import { LevelDefinition } from '../types/level';
import { DockerEngineState } from '../types/engine';
import { createDefaultDockerState } from '../engine/VirtualDockerEngine';

export const ALL_LEVELS: LevelDefinition[] = [
  // 1-1
  {
    id: '1-1',
    stage: 1,
    title: '첫 컨테이너 실행 및 포트 바인딩',
    description: `도커의 가장 기본적인 출발점은 컨테이너를 기동하고 호스트 포트와 연결하는 것입니다.
백그라운드(-d) 모드로 8080 포트를 컨테이너의 80 포트에 바인딩하고, 컨테이너 이름을 'my-web'으로 지정하여 nginx 컨테이너를 실행해 보세요.`,
    goal: "nginx 이미지를 기반으로 이름이 'my-web'이고 8080:80 포트 바인딩된 백그라운드 컨테이너 실행",
    recommendedCommand: 'docker run -d -p 8080:80 --name my-web nginx',
    initialState: createDefaultDockerState(),
    evaluate: (state: DockerEngineState) => {
      const cnt = Object.values(state.containers).find(c => c.name === 'my-web');
      if (!cnt) {
        return { passed: false, message: "이름이 'my-web'인 컨테이너를 찾을 수 없습니다.", hint: '--name my-web 옵션을 사용하세요.' };
      }
      if (cnt.status !== 'running') {
        return { passed: false, message: '컨테이너가 실행 중이지 않습니다.', hint: '-d 옵션으로 실행하세요.' };
      }
      const hasPort = cnt.ports.some(p => p.hostPort === 8080 && p.containerPort === 80);
      if (!hasPort) {
        return { passed: false, message: '8080:80 포트 바인딩이 누락되었습니다.', hint: '-p 8080:80 옵션을 추가하세요.' };
      }
      return { passed: true, message: '🎉 첫 웹 서버 컨테이너가 성공적으로 기동되었습니다!' };
    },
  },

  // 1-2
  {
    id: '1-2',
    stage: 1,
    title: '라이프사이클 제어 및 정리',
    description: `실행 중인 컨테이너는 필요 없을 때 정지(stop)하고 안전하게 삭제(rm)해야 시스템 리소스를 보존할 수 있습니다.
현재 실행 중인 'legacy-app' 컨테이너를 정지하고 완전히 삭제하세요.`,
    goal: "'legacy-app' 컨테이너를 정지한 후 삭제 완료",
    recommendedCommand: 'docker stop legacy-app && docker rm legacy-app',
    initialState: (() => {
      const s = createDefaultDockerState();
      s.containers['cnt-legacy'] = {
        id: 'c1e9a8f27301',
        name: 'legacy-app',
        imageId: 'img-nginx-latest',
        status: 'running',
        ports: [{ hostPort: 3000, containerPort: 80, protocol: 'tcp' }],
        env: {},
        volumeMounts: [],
        networkNames: ['bridge'],
        createdAt: new Date().toISOString(),
      };
      s.networks['bridge'].connectedContainerIds.push('c1e9a8f27301');
      return s;
    })(),
    evaluate: (state: DockerEngineState) => {
      const cnt = Object.values(state.containers).find(c => c.name === 'legacy-app');
      if (cnt) {
        if (cnt.status === 'running') {
          return { passed: false, message: "'legacy-app'이 아직 실행 중입니다.", hint: 'docker stop legacy-app 명령으로 중지하세요.' };
        }
        return { passed: false, message: "'legacy-app'이 아직 삭제되지 않았습니다.", hint: 'docker rm legacy-app 명령으로 삭제하세요.' };
      }
      return { passed: true, message: "🎉 'legacy-app' 컨테이너를 성공적으로 정리했습니다!" };
    },
  },

  // 1-3
  {
    id: '1-3',
    stage: 1,
    title: 'Dockerfile 작성과 이미지 빌드',
    description: `Dockerfile을 작성하여 나만의 도커 이미지를 빌드해 봅니다.
우측의 [에디터] 탭에서 Dockerfile 내용을 확인한 후, 'my-app:v1' 태그로 이미지를 빌드하세요.`,
    goal: "'my-app' 레포지토리에 'v1' 태그를 가진 이미지 빌드 완료",
    recommendedCommand: 'docker build -t my-app:v1 .',
    initialState: createDefaultDockerState(),
    evaluate: (state: DockerEngineState) => {
      const img = Object.values(state.images).find(
        i => i.repository === 'my-app' && (i.tag === 'v1' || i.tag === 'latest')
      );
      if (!img) {
        return { passed: false, message: "'my-app' 이미지가 빌드되지 않았습니다.", hint: 'docker build -t my-app:v1 . 명령을 실행하세요.' };
      }
      return { passed: true, message: "🎉 나만의 도커 이미지가 성공적으로 빌드되었습니다!" };
    },
  },

  // 2-1
  {
    id: '2-1',
    stage: 2,
    title: '볼륨 마운트와 데이터 지속성',
    description: `컨테이너는 기본적으로 무상태(Stateless)이므로 종료되면 내부 데이터가 소멸합니다.
'my-db-data' 볼륨을 생성하고, mysql 컨테이너에 마운트(-v my-db-data:/var/lib/mysql)하여 실행하세요.`,
    goal: "'my-db-data' 볼륨 생성 및 컨테이너에 /var/lib/mysql 경로로 마운트",
    recommendedCommand: 'docker volume create my-db-data && docker run -d -v my-db-data:/var/lib/mysql --name db mysql',
    initialState: createDefaultDockerState(),
    evaluate: (state: DockerEngineState) => {
      const hasVolume = Boolean(state.volumes['my-db-data']);
      if (!hasVolume) {
        return { passed: false, message: "'my-db-data' 볼륨이 없습니다.", hint: 'docker volume create my-db-data 를 먼저 실행하세요.' };
      }
      const containerWithVol = Object.values(state.containers).find(c =>
        c.volumeMounts.some(v => v.volumeName === 'my-db-data' && v.containerPath === '/var/lib/mysql')
      );
      if (!containerWithVol) {
        return { passed: false, message: 'my-db-data 볼륨이 /var/lib/mysql 에 마운트된 컨테이너가 없습니다.', hint: '-v my-db-data:/var/lib/mysql 옵션으로 컨테이너를 실행하세요.' };
      }
      return { passed: true, message: '🎉 영구 데이터 볼륨 마운트에 성공했습니다!' };
    },
  },

  // 2-2
  {
    id: '2-2',
    stage: 2,
    title: '사용자 정의 브리지 네트워크와 격리',
    description: `컨테이너 간의 안전한 통신 및 이름 기반 DNS 해석을 위해 사용자 정의 브리지 네트워크를 생성합니다.
'app-net' 네트워크를 생성하고, redis 컨테이너를 해당 네트워크에 연결하여 실행하세요.`,
    goal: "'app-net' 네트워크 생성 및 소속된 컨테이너 실행",
    recommendedCommand: 'docker network create app-net && docker run -d --network app-net --name cache redis',
    initialState: createDefaultDockerState(),
    evaluate: (state: DockerEngineState) => {
      const hasNet = Boolean(state.networks['app-net']);
      if (!hasNet) {
        return { passed: false, message: "'app-net' 네트워크가 없습니다.", hint: 'docker network create app-net 을 실행하세요.' };
      }
      const cnt = Object.values(state.containers).find(c => c.networkNames.includes('app-net'));
      if (!cnt) {
        return { passed: false, message: "'app-net'에 연결된 컨테이너가 없습니다.", hint: 'docker run --network app-net 옵션을 지정하세요.' };
      }
      return { passed: true, message: '🎉 사용자 정의 네트워크에 컨테이너가 정상 배치되었습니다!' };
    },
  },

  // 2-3
  {
    id: '2-3',
    stage: 2,
    title: 'Docker Compose 다중 컨테이너 배포',
    description: `웹 서비스와 데이터베이스 같은 복수 컨테이너를 한 번의 명령어로 일괄 정의 및 배포합니다.
[에디터] 탭의 compose.yaml 내용을 확인하고 'docker compose up -d' 명령어로 실행하세요.`,
    goal: "Docker Compose를 통해 web과 db 서비스 동시 기동",
    recommendedCommand: 'docker compose up -d',
    initialState: createDefaultDockerState(),
    evaluate: (state: DockerEngineState) => {
      const composeContainers = Object.values(state.containers).filter(c =>
        c.name.startsWith('app-')
      );
      if (composeContainers.length < 2) {
        return { passed: false, message: 'Compose 서비스 컨테이너가 모두 기동되지 않았습니다.', hint: 'docker compose up -d 를 실행하세요.' };
      }
      return { passed: true, message: '🎉 Docker Compose 다중 컨테이너 배포에 성공했습니다!' };
    },
  },

  // 3-1
  {
    id: '3-1',
    stage: 3,
    title: 'Multi-stage build를 통한 이미지 슬리밍',
    description: `빌드 도구와 최종 실행 환경을 분리하는 Multi-stage build 기법으로 이미지 크기를 대폭 줄입니다.
[에디터]의 Dockerfile에서 'AS builder'와 최종 alpine 단계를 확인하고 빌드하세요.`,
    goal: "Multi-stage Dockerfile 기반 'lean-app' 이미지 빌드 완료",
    recommendedCommand: 'docker build -t lean-app .',
    initialState: (() => {
      const s = createDefaultDockerState();
      s.buildContext['Dockerfile'] = `# Multi-stage Build 예제
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;
      return s;
    })(),
    evaluate: (state: DockerEngineState) => {
      const img = Object.values(state.images).find(i => i.repository === 'lean-app');
      if (!img) {
        return { passed: false, message: "'lean-app' 이미지가 없습니다.", hint: 'docker build -t lean-app . 를 실행하세요.' };
      }
      const hasMultiStage = img.layers.some(l => l.includes('AS builder') || l.includes('--from=builder'));
      if (!hasMultiStage) {
        return { passed: false, message: 'Multi-stage build 레이어가 확인되지 않습니다.', hint: 'Dockerfile의 FROM builder 구문을 확인하세요.' };
      }
      return { passed: true, message: '🎉 경량화된 Multi-stage 도커 이미지가 빌드되었습니다!' };
    },
  },

  // 3-2
  {
    id: '3-2',
    stage: 3,
    title: '빌드 캐시 최적화 및 레이어 순서 설계',
    description: `도커는 이전 레이어가 변경되지 않으면 캐시를 재사용합니다.
자주 변경되지 않는 의존성 설치(COPY package*.json, RUN npm install)를 소스코드 전체 복사보다 위에 배치하도록 Dockerfile을 확인하고 빌드하세요.`,
    goal: "캐시 친화적인 레이어 순서로 'cached-app' 이미지 빌드",
    recommendedCommand: 'docker build -t cached-app .',
    initialState: (() => {
      const s = createDefaultDockerState();
      s.buildContext['Dockerfile'] = `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "server.js"]`;
      return s;
    })(),
    evaluate: (state: DockerEngineState) => {
      const img = Object.values(state.images).find(i => i.repository === 'cached-app');
      if (!img) {
        return { passed: false, message: "'cached-app' 이미지가 없습니다.", hint: 'docker build -t cached-app . 를 실행하세요.' };
      }
      return { passed: true, message: '🎉 빌드 캐시 최적화 레이어 설계가 완료되었습니다!' };
    },
  },

  // 3-3
  {
    id: '3-3',
    stage: 3,
    title: '보안 베스트 프랙티스 (Non-root USER 설정)',
    description: `컨테이너가 기본 root 사용자로 실행되면 호스트 권한 탈취 위협이 존재합니다.
전용 비-root 사용자(USER node 또는 appuser)를 지정하여 실행되는 안전한 이미지를 빌드하고 실행하세요.`,
    goal: "USER 지시어가 포함된 'secure-app' 이미지 빌드 및 컨테이너 실행",
    recommendedCommand: 'docker build -t secure-app . && docker run -d --name secure-srv secure-app',
    initialState: (() => {
      const s = createDefaultDockerState();
      s.buildContext['Dockerfile'] = `FROM node:18-alpine
WORKDIR /app
COPY . .
USER node
CMD ["node", "app.js"]`;
      return s;
    })(),
    evaluate: (state: DockerEngineState) => {
      const img = Object.values(state.images).find(i => i.repository === 'secure-app');
      if (!img) {
        return { passed: false, message: "'secure-app' 이미지가 없습니다.", hint: 'docker build -t secure-app . 를 실행하세요.' };
      }
      const hasUser = img.layers.some(l => l.startsWith('USER '));
      if (!hasUser) {
        return { passed: false, message: 'Dockerfile에 USER 지시어가 누락되었습니다.', hint: 'USER node 구문을 추가하세요.' };
      }
      const cnt = Object.values(state.containers).find(c => c.name === 'secure-srv');
      if (!cnt) {
        return { passed: false, message: "'secure-srv' 컨테이너가 실행되지 않았습니다.", hint: 'docker run -d --name secure-srv secure-app 를 실행하세요.' };
      }
      return { passed: true, message: '🎉 최고 등급 보안 규격을 준수한 컨테이너 기동에 성공했습니다!' };
    },
  },
];
