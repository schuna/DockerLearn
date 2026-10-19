import { CommandResult, ParsedCommand } from '../../types/command';
import { ContainerState, DockerEngineState, PortBinding, VolumeMount } from '../../types/engine';
import { cloneState } from '../history';

interface ParsedService {
  name: string;
  image: string;
  ports?: string[];
  volumes?: string[];
  environment?: string[] | Record<string, string>;
  depends_on?: string[];
  networks?: string[];
}

/**
 * 간단한 YAML 서비스 블록 파서 (가상 compose.yaml 전용)
 */
function parseSimpleComposeYaml(content: string): Record<string, ParsedService> {
  const services: Record<string, ParsedService> = {};
  const lines = content.split('\n');

  let inServices = false;
  let currentService: ParsedService | null = null;
  let currentArrayKey: 'ports' | 'volumes' | 'depends_on' | 'networks' | null = null;

  for (let rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line || line.trim().startsWith('#')) continue;

    const trimmed = line.trim();

    if (trimmed === 'services:') {
      inServices = true;
      continue;
    }

    if (!inServices) continue;

    // 서비스 이름 (들여쓰기 2칸 e.g. "  web:" or "  db:")
    const serviceMatch = line.match(/^ {2}([a-zA-Z0-9_-]+):$/);
    if (serviceMatch) {
      const name = serviceMatch[1];
      currentService = {
        name,
        image: `${name}:latest`,
      };
      services[name] = currentService;
      currentArrayKey = null;
      continue;
    }

    if (!currentService) continue;

    // 속성 매칭 (들여쓰기 4칸 e.g. "    image: nginx")
    const attrMatch = line.match(/^ {4}([a-zA-Z0-9_-]+): *(.*)$/);
    if (attrMatch) {
      const key = attrMatch[1];
      const val = attrMatch[2].trim();

      if (key === 'image') {
        currentService.image = val;
        currentArrayKey = null;
      } else if (['ports', 'volumes', 'depends_on', 'networks'].includes(key)) {
        currentArrayKey = key as any;
        if (!currentService[currentArrayKey!]) {
          currentService[currentArrayKey!] = [];
        }
      }
      continue;
    }

    // 배열 항목 매칭 (들여쓰기 6칸 e.g. "      - 80:80")
    const arrayItemMatch = line.match(/^ {6}- *(.*)$/);
    if (arrayItemMatch && currentArrayKey && currentService[currentArrayKey]) {
      const itemVal = arrayItemMatch[1].trim().replace(/^['"]|['"]$/g, '');
      currentService[currentArrayKey]!.push(itemVal);
    }
  }

  return services;
}

export function handleCompose(cmd: ParsedCommand, state: DockerEngineState): CommandResult {
  const nextState = cloneState(state);
  const action = cmd.action || 'up';

  const yamlContent =
    state.buildContext['compose.yaml'] ||
    state.buildContext['docker-compose.yml'] ||
    state.buildContext['docker-compose.yaml'];

  if (action === 'up') {
    if (!yamlContent || !yamlContent.trim()) {
      return {
        success: false,
        stdout: '',
        stderr: 'no configuration file provided: not found compose.yaml or docker-compose.yml in editor.',
        nextState,
      };
    }

    const services = parseSimpleComposeYaml(yamlContent);
    const serviceKeys = Object.keys(services);

    if (serviceKeys.length === 0) {
      return {
        success: false,
        stdout: '',
        stderr: 'failed to parse compose file: no valid services defined.',
        nextState,
      };
    }

    // 의존성 순서 정렬
    const sortedServiceNames = [...serviceKeys].sort((a, b) => {
      const depsB = services[b].depends_on || [];
      if (depsB.includes(a)) return -1;
      const depsA = services[a].depends_on || [];
      if (depsA.includes(b)) return 1;
      return 0;
    });

    const composeNetName = 'app_default';
    if (!nextState.networks[composeNetName]) {
      nextState.networks[composeNetName] = {
        name: composeNetName,
        driver: 'bridge',
        subnet: '172.24.0.0/16',
        connectedContainerIds: [],
      };
    }

    const outputs: string[] = [`[+] Running ${serviceKeys.length + 1}/${serviceKeys.length + 1}`];
    outputs.push(` ✔ Network ${composeNetName}  Created`);

    const animationQueue: {
      type: 'compose_step';
      targetId: string;
      label: string;
      durationMs: number;
    }[] = [];

    for (const sName of sortedServiceNames) {
      const s = services[sName];
      const containerId = Math.random().toString(16).substring(2, 14);
      const containerName = `app-${sName}-1`;

      // 기존 동일 이름 컨테이너 교체
      const existingKey = Object.keys(nextState.containers).find(
        k => nextState.containers[k].name === containerName
      );
      if (existingKey) {
        delete nextState.containers[existingKey];
      }

      // 이미지 등록
      const [repo, tag = 'latest'] = (s.image || `${sName}:latest`).split(':');
      const imgId = `img-${repo}-${tag}`;
      if (!nextState.images[imgId]) {
        nextState.images[imgId] = {
          id: imgId,
          repository: repo,
          tag,
          size: '120MB',
          layers: [`FROM ${repo}:${tag}`],
          createdAt: new Date().toISOString(),
        };
      }

      // 포트
      const ports: PortBinding[] = (s.ports || []).map(p => {
        const parts = p.split(':');
        return {
          hostPort: parseInt(parts[0], 10),
          containerPort: parseInt(parts[1] || parts[0], 10),
          protocol: 'tcp',
        };
      });

      // 볼륨
      const volumeMounts: VolumeMount[] = (s.volumes || []).map(v => {
        const parts = v.split(':');
        const vName = parts[0];
        if (!nextState.volumes[vName]) {
          nextState.volumes[vName] = {
            name: vName,
            driver: 'local',
            data: {},
            createdAt: new Date().toISOString(),
          };
        }
        return {
          volumeName: vName,
          containerPath: parts[1] || '/data',
          mode: 'rw',
        };
      });

      const newContainer: ContainerState = {
        id: containerId,
        name: containerName,
        imageId: imgId,
        status: 'running',
        ports,
        env: {},
        volumeMounts,
        networkNames: [composeNetName],
        createdAt: new Date().toISOString(),
      };

      nextState.containers[containerId] = newContainer;
      nextState.networks[composeNetName].connectedContainerIds.push(containerId);

      outputs.push(` ✔ Container ${containerName}  Started`);
      animationQueue.push({
        type: 'compose_step',
        targetId: containerId,
        label: `서비스 ${sName} 기동 완료`,
        durationMs: 300,
      });
    }

    return {
      success: true,
      stdout: outputs.join('\n') + '\n',
      stderr: '',
      nextState,
      animationQueue,
    };
  } else if (action === 'down') {
    const composeNetName = 'app_default';
    const removedContainers: string[] = [];

    for (const [id, c] of Object.entries(nextState.containers)) {
      if (c.networkNames.includes(composeNetName) || c.name.startsWith('app-')) {
        removedContainers.push(c.name);
        delete nextState.containers[id];
      }
    }

    delete nextState.networks[composeNetName];

    const out = [
      `[+] Running ${removedContainers.length + 1}/${removedContainers.length + 1}`,
      ...removedContainers.map(c => ` ✔ Container ${c}  Removed`),
      ` ✔ Network ${composeNetName}  Removed`,
    ];

    return {
      success: true,
      stdout: out.join('\n') + '\n',
      stderr: '',
      nextState,
    };
  }

  return {
    success: false,
    stdout: '',
    stderr: `docker compose: '${action}' is not supported in virtual engine. Use 'up' or 'down'.`,
    nextState: state,
  };
}
