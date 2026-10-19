import { CommandResult, ParsedCommand } from '../../types/command';
import { ContainerState, DockerEngineState, ImageState, PortBinding, VolumeMount } from '../../types/engine';
import { cloneState } from '../history';

// 기본 지원되는 공용 도커 허브 이미지 템플릿
const DEFAULT_PRESET_IMAGES: Record<string, Partial<ImageState>> = {
  nginx: { repository: 'nginx', tag: 'latest', size: '142MB', layers: ['FROM alpine', 'RUN apk add --no-cache nginx', 'EXPOSE 80', 'CMD ["nginx", "-g", "daemon off;"]'] },
  mysql: { repository: 'mysql', tag: 'latest', size: '512MB', layers: ['FROM debian:bullseye-slim', 'RUN apt-get update && apt-get install -y mysql-server', 'EXPOSE 3306', 'CMD ["mysqld"]'] },
  redis: { repository: 'redis', tag: 'latest', size: '113MB', layers: ['FROM alpine', 'RUN apk add --no-cache redis', 'EXPOSE 6379', 'CMD ["redis-server"]'] },
  alpine: { repository: 'alpine', tag: 'latest', size: '7.34MB', layers: ['FROM scratch', 'ADD alpine-minirootfs.tar.gz /', 'CMD ["/bin/sh"]'] },
  node: { repository: 'node', tag: '18-alpine', size: '174MB', layers: ['FROM alpine', 'RUN apk add --no-cache nodejs npm', 'CMD ["node"]'] },
};

const RANDOM_ADJECTIVES = ['quirky', 'zen', 'brave', 'serene', 'clever', 'keen', 'agile', 'lucid'];
const RANDOM_NAMES = ['curie', 'turing', 'hopper', 'lovelace', 'ritchie', 'lamport', 'torvalds', 'knuth'];

function generateRandomName(): string {
  const adj = RANDOM_ADJECTIVES[Math.floor(Math.random() * RANDOM_ADJECTIVES.length)];
  const name = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  return `${adj}_${name}`;
}

function generateHexId(len: number = 12): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function handleRun(cmd: ParsedCommand, state: DockerEngineState): CommandResult {
  const nextState = cloneState(state);

  if (cmd.args.length === 0) {
    return {
      success: false,
      stdout: '',
      stderr: '"docker run" requires at least 1 argument: [OPTIONS] IMAGE [COMMAND] [ARG...]',
      nextState,
    };
  }

  const rawImageArg = cmd.args[0];
  const [repo, tag = 'latest'] = rawImageArg.split(':');

  // 로컬 이미지 저장소에 있는지 확인, 없으면 프리셋에서 자동 Pull 시뮬레이션
  let imageId = Object.keys(nextState.images).find(
    id => nextState.images[id].repository === repo && nextState.images[id].tag === tag
  );

  let pullOutput = '';
  if (!imageId) {
    const preset = DEFAULT_PRESET_IMAGES[repo];
    if (preset) {
      imageId = `img-${repo}-${tag}`;
      nextState.images[imageId] = {
        id: imageId,
        repository: repo,
        tag: tag,
        size: preset.size || '100MB',
        layers: preset.layers || [`FROM ${repo}:${tag}`],
        createdAt: new Date().toISOString(),
      };
      pullOutput = `Unable to find image '${rawImageArg}' locally\n${tag}: Pulling from library/${repo}\nDigest: sha256:${generateHexId(32)}\nStatus: Downloaded newer image for ${rawImageArg}\n`;
    } else {
      return {
        success: false,
        stdout: '',
        stderr: `Error response from daemon: pull access denied for ${rawImageArg}, repository does not exist or may require 'docker login'.`,
        nextState,
      };
    }
  }

  // 컨테이너 이름 확인
  let containerName = typeof cmd.flags['name'] === 'string' ? cmd.flags['name'] : generateRandomName();

  // 이름 중복 확인
  const isNameTaken = Object.values(nextState.containers).some(c => c.name === containerName);
  if (isNameTaken) {
    return {
      success: false,
      stdout: '',
      stderr: `Error response from daemon: Conflict. The container name "/${containerName}" is already in use by another container.`,
      nextState,
    };
  }

  // 포트 바인딩 파싱 (-p 8080:80 또는 -p 80)
  const portBindings: PortBinding[] = [];
  const rawPorts = cmd.flags['publish'];
  if (rawPorts) {
    const portList = Array.isArray(rawPorts) ? rawPorts : [rawPorts];
    for (const p of portList) {
      if (typeof p === 'string') {
        const parts = p.split(':');
        if (parts.length === 2) {
          portBindings.push({
            hostPort: parseInt(parts[0], 10),
            containerPort: parseInt(parts[1], 10),
            protocol: 'tcp',
          });
        } else if (parts.length === 1) {
          // 컨테이너 포트만 지정 시 호스트 임의 포트 바인딩
          const cPort = parseInt(parts[0], 10);
          portBindings.push({
            hostPort: 30000 + Math.floor(Math.random() * 5000),
            containerPort: cPort,
            protocol: 'tcp',
          });
        }
      }
    }
  }

  // 볼륨 마운트 파싱 (-v my-vol:/data)
  const volumeMounts: VolumeMount[] = [];
  const rawVolumes = cmd.flags['volume'];
  if (rawVolumes) {
    const volList = Array.isArray(rawVolumes) ? rawVolumes : [rawVolumes];
    for (const v of volList) {
      if (typeof v === 'string') {
        const [volName, containerPath, mode = 'rw'] = v.split(':');
        volumeMounts.push({
          volumeName: volName,
          containerPath: containerPath || '/data',
          mode: mode === 'ro' ? 'ro' : 'rw',
        });

        // 명시된 볼륨이 아직 생성되지 않은 경우 자동 생성(Anonymous/Named Volume 동작)
        if (!nextState.volumes[volName]) {
          nextState.volumes[volName] = {
            name: volName,
            driver: 'local',
            data: {},
            createdAt: new Date().toISOString(),
          };
        }
      }
    }
  }

  // 환경 변수 파싱 (-e KEY=VAL)
  const env: Record<string, string> = {};
  const rawEnv = cmd.flags['env'];
  if (rawEnv) {
    const envList = Array.isArray(rawEnv) ? rawEnv : [rawEnv];
    for (const e of envList) {
      if (typeof e === 'string' && e.includes('=')) {
        const [k, ...vParts] = e.split('=');
        env[k] = vParts.join('=');
      }
    }
  }

  // 네트워크 지정 (--network app-net)
  const networkName = typeof cmd.flags['network'] === 'string' ? cmd.flags['network'] : 'bridge';
  if (!nextState.networks[networkName]) {
    // bridge 기본 네트워크가 없으면 생성, 그 외엔 에러
    if (networkName === 'bridge') {
      nextState.networks['bridge'] = {
        name: 'bridge',
        driver: 'bridge',
        subnet: '172.17.0.0/16',
        connectedContainerIds: [],
      };
    } else {
      return {
        success: false,
        stdout: '',
        stderr: `Error response from daemon: network ${networkName} not found.`,
        nextState,
      };
    }
  }

  const containerId = generateHexId(12);
  const isDetached = Boolean(cmd.flags['detach']);

  const newContainer: ContainerState = {
    id: containerId,
    name: containerName,
    imageId: imageId!,
    status: 'running',
    ports: portBindings,
    env,
    volumeMounts,
    networkNames: [networkName],
    createdAt: new Date().toISOString(),
  };

  nextState.containers[containerId] = newContainer;
  if (!nextState.networks[networkName].connectedContainerIds.includes(containerId)) {
    nextState.networks[networkName].connectedContainerIds.push(containerId);
  }

  const fullId = generateHexId(64);
  const stdout = isDetached
    ? `${pullOutput}${fullId}\n`
    : `${pullOutput}[Container ${containerName} (${containerId}) started interactively]`;

  return {
    success: true,
    stdout,
    stderr: '',
    nextState,
    animationQueue: [
      {
        type: 'container_start',
        targetId: containerId,
        label: `컨테이너 '${containerName}' 기동 중...`,
        durationMs: 400,
      },
    ],
  };
}
