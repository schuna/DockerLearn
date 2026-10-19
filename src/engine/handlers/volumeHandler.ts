import { CommandResult, ParsedCommand } from '../../types/command';
import { DockerEngineState } from '../../types/engine';
import { cloneState } from '../history';

export function handleVolume(cmd: ParsedCommand, state: DockerEngineState): CommandResult {
  const nextState = cloneState(state);
  const action = cmd.action || 'ls';

  switch (action) {
    case 'create': {
      const volName = cmd.args[0];
      if (!volName) {
        return {
          success: false,
          stdout: '',
          stderr: '"docker volume create" requires at least 1 argument: [OPTIONS] [VOLUME]',
          nextState,
        };
      }

      if (nextState.volumes[volName]) {
        // 이미 존재하는 경우 해당 이름 반환 (Docker CLI 표준 동작)
        return {
          success: true,
          stdout: `${volName}\n`,
          stderr: '',
          nextState,
        };
      }

      nextState.volumes[volName] = {
        name: volName,
        driver: 'local',
        data: {},
        createdAt: new Date().toISOString(),
      };

      return {
        success: true,
        stdout: `${volName}\n`,
        stderr: '',
        nextState,
      };
    }

    case 'ls':
    case 'list': {
      const volumes = Object.values(state.volumes);
      const header = 'DRIVER    VOLUME NAME';
      const rows = volumes.map(v => `${v.driver.padEnd(9)} ${v.name}`);

      return {
        success: true,
        stdout: `${header}\n${rows.join('\n')}\n`,
        stderr: '',
        nextState: state,
      };
    }

    case 'rm':
    case 'remove': {
      if (cmd.args.length === 0) {
        return {
          success: false,
          stdout: '',
          stderr: '"docker volume rm" requires at least 1 volume name argument.',
          nextState,
        };
      }

      const removed: string[] = [];
      const errors: string[] = [];

      for (const vName of cmd.args) {
        if (!nextState.volumes[vName]) {
          errors.push(`Error response from daemon: get ${vName}: no such volume`);
          continue;
        }

        // 컨테이너에서 마운트 중인지 검사
        const isMounted = Object.values(nextState.containers).some(c =>
          c.volumeMounts.some(m => m.volumeName === vName)
        );

        if (isMounted) {
          errors.push(`Error response from daemon: remove ${vName}: volume is in use`);
          continue;
        }

        delete nextState.volumes[vName];
        removed.push(vName);
      }

      return {
        success: errors.length === 0,
        stdout: removed.join('\n') + (removed.length > 0 ? '\n' : ''),
        stderr: errors.join('\n'),
        nextState,
      };
    }

    case 'inspect': {
      const vName = cmd.args[0];
      if (!vName || !state.volumes[vName]) {
        return {
          success: false,
          stdout: '',
          stderr: `Error: No such volume: ${vName || ''}`,
          nextState: state,
        };
      }

      const v = state.volumes[vName];
      const json = JSON.stringify(
        [
          {
            CreatedAt: v.createdAt,
            Driver: v.driver,
            Labels: null,
            Mountpoint: `/var/lib/docker/volumes/${v.name}/_data`,
            Name: v.name,
            Options: null,
            Scope: 'local',
          },
        ],
        null,
        2
      );

      return {
        success: true,
        stdout: `${json}\n`,
        stderr: '',
        nextState: state,
      };
    }

    default:
      return {
        success: false,
        stdout: '',
        stderr: `docker volume: '${action}' is not a valid docker volume command. See 'docker volume --help'.`,
        nextState: state,
      };
  }
}
