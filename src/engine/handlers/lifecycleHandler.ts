import { CommandResult, ParsedCommand } from '../../types/command';
import { DockerEngineState } from '../../types/engine';
import { cloneState } from '../history';

export function handlePs(cmd: ParsedCommand, state: DockerEngineState): CommandResult {
  const showAll = Boolean(cmd.flags['all'] || cmd.flags['a']);
  const containers = Object.values(state.containers).filter(
    c => showAll || c.status === 'running'
  );

  if (containers.length === 0) {
    return {
      success: true,
      stdout: 'CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS     NAMES\n',
      stderr: '',
      nextState: state,
    };
  }

  const header = 'CONTAINER ID   IMAGE                STATUS         PORTS                   NAMES';
  const rows = containers.map(c => {
    const img = state.images[c.imageId];
    const imgName = img ? `${img.repository}:${img.tag}` : c.imageId.slice(0, 12);
    const portsStr = c.ports.map(p => `${p.hostPort}->${p.containerPort}/${p.protocol}`).join(', ') || '-';
    const statusStr = c.status === 'running' ? 'Up 5 minutes' : 'Exited (0) 2 minutes ago';

    return `${c.id.slice(0, 12).padEnd(14)} ${imgName.padEnd(20)} ${statusStr.padEnd(14)} ${portsStr.padEnd(23)} ${c.name}`;
  });

  return {
    success: true,
    stdout: `${header}\n${rows.join('\n')}\n`,
    stderr: '',
    nextState: state,
  };
}

export function handleStop(cmd: ParsedCommand, state: DockerEngineState): CommandResult {
  const nextState = cloneState(state);

  if (cmd.args.length === 0) {
    return {
      success: false,
      stdout: '',
      stderr: '"docker stop" requires at least 1 container argument: [OPTIONS] CONTAINER [CONTAINER...]',
      nextState,
    };
  }

  const stoppedNames: string[] = [];
  const errors: string[] = [];

  for (const target of cmd.args) {
    const container = Object.values(nextState.containers).find(
      c => c.id === target || c.id.startsWith(target) || c.name === target
    );

    if (!container) {
      errors.push(`Error response from daemon: No such container: ${target}`);
      continue;
    }

    container.status = 'stopped';
    stoppedNames.push(target);
  }

  return {
    success: errors.length === 0,
    stdout: stoppedNames.join('\n') + (stoppedNames.length > 0 ? '\n' : ''),
    stderr: errors.join('\n'),
    nextState,
    animationQueue: stoppedNames.map(target => ({
      type: 'container_stop',
      label: `컨테이너 '${target}' 중지 완료`,
      durationMs: 300,
    })),
  };
}

export function handleRm(cmd: ParsedCommand, state: DockerEngineState): CommandResult {
  const nextState = cloneState(state);

  if (cmd.args.length === 0) {
    return {
      success: false,
      stdout: '',
      stderr: '"docker rm" requires at least 1 container argument: [OPTIONS] CONTAINER [CONTAINER...]',
      nextState,
    };
  }

  const removedNames: string[] = [];
  const errors: string[] = [];
  const force = Boolean(cmd.flags['force'] || cmd.flags['f']);

  for (const target of cmd.args) {
    const container = Object.values(nextState.containers).find(
      c => c.id === target || c.id.startsWith(target) || c.name === target
    );

    if (!container) {
      errors.push(`Error response from daemon: No such container: ${target}`);
      continue;
    }

    if (container.status === 'running' && !force) {
      errors.push(
        `Error response from daemon: You cannot remove a running container ${container.id}. Stop the container before attempting removal or force remove.`
      );
      continue;
    }

    // 네트워크 연결 목록에서 제거
    for (const netName of container.networkNames) {
      if (nextState.networks[netName]) {
        nextState.networks[netName].connectedContainerIds = nextState.networks[
          netName
        ].connectedContainerIds.filter(id => id !== container.id);
      }
    }

    delete nextState.containers[container.id];
    removedNames.push(target);
  }

  return {
    success: errors.length === 0,
    stdout: removedNames.join('\n') + (removedNames.length > 0 ? '\n' : ''),
    stderr: errors.join('\n'),
    nextState,
  };
}

export function handleImages(_cmd: ParsedCommand, state: DockerEngineState): CommandResult {
  const images = Object.values(state.images);

  if (images.length === 0) {
    return {
      success: true,
      stdout: 'REPOSITORY   TAG       IMAGE ID       CREATED        SIZE\n',
      stderr: '',
      nextState: state,
    };
  }

  const header = 'REPOSITORY           TAG         IMAGE ID       CREATED         SIZE';
  const rows = images.map(img => {
    return `${img.repository.padEnd(20)} ${img.tag.padEnd(11)} ${img.id.slice(0, 12).padEnd(14)} 2 days ago      ${img.size}`;
  });

  return {
    success: true,
    stdout: `${header}\n${rows.join('\n')}\n`,
    stderr: '',
    nextState: state,
  };
}
