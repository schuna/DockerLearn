import { CommandResult, ParsedCommand } from '../../types/command';
import { DockerEngineState, ImageState } from '../../types/engine';
import { cloneState } from '../history';

export function handleBuild(cmd: ParsedCommand, state: DockerEngineState): CommandResult {
  const nextState = cloneState(state);

  // 태그 파싱 (-t my-app 또는 -t my-app:v1)
  const tagFlag = cmd.flags['tag'];
  const fullTag = typeof tagFlag === 'string' ? tagFlag : 'my-app:latest';
  const [repo, tag = 'latest'] = fullTag.split(':');

  // Dockerfile 파일 읽기
  const fileName = typeof cmd.flags['file'] === 'string' ? cmd.flags['file'] : 'Dockerfile';
  const dockerfileContent = state.buildContext[fileName] || state.buildContext['Dockerfile'];

  if (!dockerfileContent || !dockerfileContent.trim()) {
    return {
      success: false,
      stdout: '',
      stderr: `Cannot find a valid ${fileName} in build context. Please create or edit your Dockerfile in the editor tab.`,
      nextState,
    };
  }

  // Dockerfile 줄 단위 파싱
  const lines = dockerfileContent
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'));

  if (lines.length === 0) {
    return {
      success: false,
      stdout: '',
      stderr: 'Error: The Dockerfile is empty.',
      nextState,
    };
  }

  const layers: string[] = [];
  const buildStepsOutput: string[] = [];
  const animationSteps: {
    type: 'layer_build';
    targetId: string;
    label: string;
    durationMs: number;
  }[] = [];

  const imageId = `img-${repo}-${tag}`;

  lines.forEach((line, index) => {
    const stepNum = index + 1;
    const stepHeader = `Step ${stepNum}/${lines.length} : ${line}`;
    buildStepsOutput.push(stepHeader);

    const layerHash = Math.random().toString(16).substring(2, 14);
    buildStepsOutput.push(` ---> Running in ${layerHash}`);
    buildStepsOutput.push(` ---> ${Math.random().toString(16).substring(2, 14)}`);

    layers.push(line);

    animationSteps.push({
      type: 'layer_build',
      targetId: imageId,
      label: stepHeader,
      durationMs: 400,
    });
  });

  // 이미지 생성 및 저장
  // 크기 계산 (시뮬레이션: 레이어 수와 베이스 이미지 기반)
  let estimatedSize = 50 + layers.length * 15;
  if (layers.some(l => l.toLowerCase().includes('alpine'))) {
    estimatedSize = 15 + layers.length * 8;
  }

  const newImage: ImageState = {
    id: imageId,
    repository: repo,
    tag,
    size: `${estimatedSize}MB`,
    layers,
    createdAt: new Date().toISOString(),
  };

  nextState.images[imageId] = newImage;

  const finalShortId = Math.random().toString(16).substring(2, 14);
  buildStepsOutput.push(`Successfully built ${finalShortId}`);
  buildStepsOutput.push(`Successfully tagged ${repo}:${tag}`);

  return {
    success: true,
    stdout: buildStepsOutput.join('\n') + '\n',
    stderr: '',
    nextState,
    animationQueue: animationSteps,
  };
}
