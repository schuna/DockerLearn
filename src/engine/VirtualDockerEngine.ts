import { CommandResult, ParsedCommand } from '../types/command';
import { DockerEngineState } from '../types/engine';
import { handleBuild } from './handlers/buildHandler';
import { handleCompose } from './handlers/composeHandler';
import { handleImages, handlePs, handleRm, handleStop } from './handlers/lifecycleHandler';
import { handleNetwork } from './handlers/networkHandler';
import { handleRun } from './handlers/runHandler';
import { handleVolume } from './handlers/volumeHandler';
import { cloneState, HistoryManager } from './history';
import { parseCommand } from './parser';

export function createDefaultDockerState(): DockerEngineState {
  return {
    images: {
      'img-nginx-latest': {
        id: 'img-nginx-latest',
        repository: 'nginx',
        tag: 'latest',
        size: '142MB',
        layers: ['FROM alpine', 'RUN apk add --no-cache nginx', 'EXPOSE 80', 'CMD ["nginx", "-g", "daemon off;"]'],
        createdAt: new Date().toISOString(),
      },
    },
    containers: {},
    volumes: {},
    networks: {
      bridge: {
        name: 'bridge',
        driver: 'bridge',
        subnet: '172.17.0.0/16',
        connectedContainerIds: [],
      },
    },
    buildContext: {
      Dockerfile: 'FROM nginx:alpine\nCOPY . /usr/share/nginx/html\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]',
      'compose.yaml': 'services:\n  web:\n    image: nginx:latest\n    ports:\n      - "8080:80"\n',
    },
  };
}

export class VirtualDockerEngine {
  private historyManager: HistoryManager;

  constructor(initialState?: DockerEngineState) {
    this.historyManager = new HistoryManager(initialState || createDefaultDockerState());
  }

  public getState(): DockerEngineState {
    return this.historyManager.getPresentState();
  }

  public reset(state?: DockerEngineState): void {
    this.historyManager.reset(state || createDefaultDockerState());
  }

  public updateBuildContext(filename: string, content: string): void {
    const currentState = this.historyManager.getPresentState();
    const nextState = cloneState(currentState);
    nextState.buildContext[filename] = content;
    this.historyManager.pushState(nextState);
  }

  public undo(): CommandResult {
    const undoResult = this.historyManager.undo();
    return {
      success: undoResult.success,
      stdout: undoResult.success ? undoResult.message : '',
      stderr: undoResult.success ? '' : undoResult.message,
      nextState: undoResult.state,
    };
  }

  public redo(): CommandResult {
    const redoResult = this.historyManager.redo();
    return {
      success: redoResult.success,
      stdout: redoResult.success ? redoResult.message : '',
      stderr: redoResult.success ? '' : redoResult.message,
      nextState: redoResult.state,
    };
  }

  public execute(rawInput: string): CommandResult {
    const currentState = this.historyManager.getPresentState();

    const { parsed, error } = parseCommand(rawInput);

    if (error) {
      return {
        success: false,
        stdout: '',
        stderr: error,
        nextState: currentState,
      };
    }

    if (!parsed) {
      return {
        success: true,
        stdout: '',
        stderr: '',
        nextState: currentState,
      };
    }

    // 1. 단독 유틸리티 명령어
    if (parsed.command === 'clear') {
      return {
        success: true,
        stdout: '\x1bc', // ANSI clear command
        stderr: '',
        nextState: currentState,
      };
    }

    if (parsed.command === 'undo') {
      return this.undo();
    }

    if (parsed.command === 'redo') {
      return this.redo();
    }

    if (parsed.command === 'help') {
      return this.getHelpResult(currentState);
    }

    // 2. Docker 명령어 라우팅
    const result = this.dispatchDockerCommand(parsed, currentState);

    // 변경사항이 있고 성공한 경우 히스토리에 푸시
    if (result.success && this.hasStateChanged(currentState, result.nextState)) {
      this.historyManager.pushState(result.nextState);
    }

    return result;
  }

  private dispatchDockerCommand(cmd: ParsedCommand, state: DockerEngineState): CommandResult {
    switch (cmd.subcommand) {
      case 'run':
        return handleRun(cmd, state);
      case 'ps':
        return handlePs(cmd, state);
      case 'stop':
        return handleStop(cmd, state);
      case 'rm':
        return handleRm(cmd, state);
      case 'images':
        return handleImages(cmd, state);
      case 'build':
        return handleBuild(cmd, state);
      case 'volume':
        return handleVolume(cmd, state);
      case 'network':
        return handleNetwork(cmd, state);
      case 'compose':
        return handleCompose(cmd, state);
      default:
        return {
          success: false,
          stdout: '',
          stderr: `docker: '${cmd.subcommand}' is not a docker command. See 'help'.`,
          nextState: state,
        };
    }
  }

  private hasStateChanged(a: DockerEngineState, b: DockerEngineState): boolean {
    return JSON.stringify(a) !== JSON.stringify(b);
  }

  private getHelpResult(state: DockerEngineState): CommandResult {
    const helpText = `
DockerLearn 가상 도커 엔진 명령어 안내:

  기본 명령어:
    docker run [OPTIONS] IMAGE [CMD]   컨테이너 생성 및 실행 (-d, -p, -v, --name, -e, --network)
    docker ps [-a]                     실행 중이거나 모든(-a) 컨테이너 목록 확인
    docker stop CONTAINER...           실행 중인 컨테이너 정지
    docker rm [-f] CONTAINER...        정지된 컨테이너 삭제 (-f: 강제 삭제)
    docker images                      로컬 도커 이미지 목록 확인
    docker build -t NAME:TAG [PATH]    에디터의 Dockerfile 기반 이미지 빌드
    docker volume [create|ls|rm]       영구 볼륨 생성/조회/삭제
    docker network [create|ls|connect] 가상 브리지 네트워크 관리
    docker compose [up|down]           에디터의 compose.yaml 기반 다중 서비스 기동/종료

  유틸리티:
    undo                               직전 작업 상태로 롤백 (타임머신)
    redo                               취소한 작업 다시 실행
    clear                              터미널 화면 비우기
    help                               명령어 도움말 출력
`;

    return {
      success: true,
      stdout: helpText.trim() + '\n',
      stderr: '',
      nextState: state,
    };
  }
}
