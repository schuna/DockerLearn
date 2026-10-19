# 🐳 DockerLearn

> **Learn Git Branching 벤치마킹 기반 대화형 가상 도커(Docker) 학습 플랫폼**  
> 백엔드 서버 없이 브라우저 단독으로 실행되는 **순수 인메모리 가상 엔진(In-Memory Virtual Engine)**과 **React Flow 인터랙티브 시각화 캔버스**를 결합하여, 실시간 시각 피드백과 단계별 미션 해결 환경을 제공합니다.

---

## 📌 주요 특징 (Key Features)

### 1. 🧠 100% 클라이언트 가상 도커 엔진 (Serverless & In-Memory)
- **백엔드 통신 제로**: 외부 Docker 데몬이나 백엔드 서버 없이 웹 브라우저 메모리 내에서 컨테이너, 이미지, 볼륨, 네트워크 라이프사이클을 완벽히 시뮬레이션합니다.
- **상태 스냅샷 타임머신 (`undo` / `redo`)**: 최대 20개의 불변 상태 스냅샷을 관리하여, 잘못 입력한 명령어를 언제든 직전 상태로 즉각 롤백할 수 있습니다.
- **화이트리스트 기반 CLI 파서**: 엄격한 플래그 파싱과 렉서를 통해 복합 쉘 연산자 오작동을 차단하고 친절한 학습 가이드를 제공합니다.

### 2. 🎨 React Flow 기반 반응형 시각화 캔버스
- **ContainerNode**: 기동 상태(`running`) 에메랄드 펄스 애니메이션, 정지 상태(`stopped`) 블러/Exited 뱃지, 포트 바인딩 칩(`8080:80/tcp`), 볼륨 및 네트워크 연결 앵커.
- **ImageStackNode**: `Dockerfile` 명령어 단위로 아래에서 위로 적층된 수직 레이어 시각화.
- **VolumeNode & NetworkGroupNode**: 영구 데이터 디스크 블록 및 가상 브리지 서브넷 바운더리 박스.
- **AnimatedTrafficEdge**: 포트 트래픽 및 볼륨 데이터 흐름을 베지어 곡선 상의 발광 파티클 애니메이션으로 실시간 렌더링.
- **비동기 스텝 애니메이션 큐**: `docker build` 실행 시 레이어별 400ms 지연 적층, `compose up` 시 의존성 순서 컨테이너 단계적 기동.

### 3. 💻 인터랙티브 터미널 & 내장 탭 에디터
- **가상 Bash 터미널**: 방향키(↑/↓) 명령어 히스토리 탐색, Tab 자동 완성, 추천 명령어 알약 버튼, 자동 스크롤 지원.
- **내장 파일 에디터 (`Dockerfile`, `compose.yaml`)**: 코드 줄 번호 표시, Tab 2스페이스 들여쓰기, 클립보드 복사, 템플릿 복원, 원클릭 빌드/기동 연동.

### 4. 🎯 3단계 9개 레벨 커리큘럼 & 부분 일치(Subset Matching) 검증기
- **목표 상시 노출**: 메인 화면 상단 대시보드에서 현재 미션 목표를 확인하고 바로 실습을 진행할 수 있습니다.
- **정답 힌트 토글**: 정답 스포일러를 방지하기 위해 추천 실행 명령어는 `💡 힌트 보기` 버튼 클릭 시에만 노출됩니다.
- **부분 일치 검증**: 단순 문자열 비교가 아닌, 명령어 실행 후 생성된 도커 엔진의 실제 상태 속성을 검사하여 다양한 정답 입력을 유연하게 채점합니다.
- **클리어 축하 효과 & 진행도 보존**: 레벨 클리어 시 폭죽 파티클 애니메이션이 발동하며, `localStorage`에 진척도가 자동 저장됩니다.

---

## 🗺️ 3단계 커리큘럼 로드맵

```
🟢 1단계: 초보 (Beginner)
├── 1-1. 첫 컨테이너 실행 및 포트 바인딩 (docker run -d -p 8080:80 --name my-web nginx)
├── 1-2. 라이프사이클 제어 및 정리 (docker stop legacy-app, docker rm legacy-app)
└── 1-3. Dockerfile 작성과 이미지 빌드 (탭 에디터 활용, docker build -t my-app .)

🟡 2단계: 중급 (Intermediate)
├── 2-1. 볼륨 마운트와 데이터 지속성 (docker volume create, -v my-db-data:/var/lib/mysql)
├── 2-2. 사용자 정의 브리지 네트워크와 격리 (docker network create app-net, --network)
└── 2-3. Docker Compose 다중 컨테이너 배포 (compose.yaml 작성 후 docker compose up -d)

🔴 3단계: 고급 (Advanced)
├── 3-1. Multi-stage build를 통한 이미지 슬리밍 (빌드 아티팩트 분리 및 용량 경량화)
├── 3-2. 빌드 캐시 최적화 및 레이어 순서 설계 (자주 변경되지 않는 의존성 상단 배치)
└── 3-3. 보안 베스트 프랙티스 (Alpine 베이스 이미지 + 비-root USER 계정 설정)
```

---

## 🛠️ 지원 명령어 목록 (Supported Commands)

| 명령어 | 지원 플래그 및 설명 |
| :--- | :--- |
| `docker run` | `-d` (백그라운드), `-p` (포트 바인딩), `-v` (볼륨 마운트), `--name` (이름 지정), `-e` (환경변수), `--network` (네트워크 연결) |
| `docker ps` | `-a` / `--all` (정지된 컨테이너 포함 전체 목록 확인) |
| `docker stop` | 실행 중인 컨테이너 정지 (`docker stop <container...>`) |
| `docker rm` | 정지된 컨테이너 삭제, `-f` / `--force` (실행 중인 컨테이너 강제 삭제) |
| `docker images` | 로컬 이미지 목록 및 레이어 수, 용량 확인 |
| `docker build` | `-t` / `--tag` (이미지 태그 지정), `-f` (Dockerfile 경로), 에디터 파일 기반 빌드 |
| `docker volume` | `create <name>`, `ls`, `rm <name>`, `inspect <name>` |
| `docker network` | `create <name>`, `ls`, `connect <net> <container>`, `rm <name>` |
| `docker compose` | `up -d` (다중 서비스 기동), `down` (서비스 및 네트워크 일괄 정지/제거) |
| `undo` / `redo` | 직전 상태로 타임머신 롤백 / 취소한 작업 다시 실행 |
| `clear` / `help` | 터미널 화면 비우기 / 전체 명령어 도움말 표시 |

---

## 💻 빠른 시작 가이드 (Quick Start)

### 요구 사양
- **Node.js**: `v14.15.1` 이상 (Node 14, 16, 18, 20 호환)
- **로컬 개발 포트**: `5188` (Vite 기본 포트 5173 충돌 방지 설정 적용)

### 1. 저장소 복제 및 설치
```bash
git clone https://github.com/schuna/DockerLearn.git
cd DockerLearn
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```
터미널에 표시된 로컬 주소([http://localhost:5188](http://localhost:5188))로 브라우저에서 접속합니다.

### 3. 프로덕션 번들 빌드
```bash
npm run build
```
빌드된 정적 결과물은 `dist/` 디렉터리에 생성되며, GitHub Pages나 Vercel, Netlify 등 정적 호스팅 서비스에 즉시 배포할 수 있습니다.

---

## 📂 프로젝트 구조 (Project Structure)

```
DockerLearn/
├── index.html                         # 진입 HTML (다크 모드 & 도커 아이콘 설정)
├── vite.config.ts                     # Vite 2 빌드 및 포트 5188 설정
├── tailwind.config.js                 # 도커 테마 및 글로우 애니메이션 세팅
└── src/
    ├── types/                         # 불변 엔진 및 레벨 상태 인터페이스
    │   ├── engine.ts                  # DockerEngineState, ContainerState, ImageState 등
    │   ├── command.ts                 # CLI 파싱 토큰 및 핸들러 결과 타입
    │   └── level.ts                   # 미션 정의 및 부분 일치 검증기 타입
    ├── engine/                        # 순수 인메모리 가상 도커 엔진 코어
    │   ├── VirtualDockerEngine.ts     # 메인 디스패처 및 상태 관리자
    │   ├── parser.ts                  # 화이트리스트 토크나이저 & 렉서
    │   ├── history.ts                 # StateHistoryManager (스냅샷 스택 타임머신)
    │   └── handlers/                  # run, lifecycle, volume, network, build, compose
    ├── canvas/                        # React Flow 기반 시각화 캔버스
    │   ├── DockerCanvas.tsx           # 메인 캔버스 뷰포트
    │   ├── nodes/                     # ContainerNode, ImageStackNode, VolumeNode, NetworkGroupNode
    │   ├── edges/                     # AnimatedTrafficEdge (베지어 곡선 패킷 애니메이션)
    │   └── queue/                     # AnimationQueue (비동기 스텝 애니메이션)
    ├── components/                    # UI 컴포넌트
    │   ├── layout/                    # Header, MobileLandscapeOverlay
    │   ├── terminal/                  # VirtualTerminal (방향키 히스토리, 추천 버튼)
    │   ├── editor/                    # TabbedEditor (Dockerfile / compose.yaml 탭)
    │   └── mission/                   # MissionBanner (목표 상시 표시, 힌트 토글), MissionDialog
    ├── levels/                        # 9개 레벨 카탈로그 및 Subset Matching 검증기
    │   └── index.ts                   # 1-1부터 3-3까지 미션 데이터
    └── utils/
        └── confetti.ts                # 제로 의존성 캔버스 축하 폭죽 파티클
```

---

## 📄 라이선스 (License)

This project is licensed under the MIT License.
