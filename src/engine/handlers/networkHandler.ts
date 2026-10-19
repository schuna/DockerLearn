import { CommandResult, ParsedCommand } from '../../types/command';
import { DockerEngineState } from '../../types/engine';
import { cloneState } from '../history';

export function handleNetwork(cmd: ParsedCommand, state: DockerEngineState): CommandResult {
  const nextState = cloneState(state);
  const action = cmd.action || 'ls';

  switch (action) {
    case 'create': {
      const netName = cmd.args[0];
      if (!netName) {
        return {
          success: false,
          stdout: '',
          stderr: '"docker network create" requires at least 1 argument: [OPTIONS] NETWORK',
          nextState,
        };
      }

      if (nextState.networks[netName]) {
        return {
          success: false,
          stdout: '',
          stderr: `Error response from daemon: network with name ${netName} already exists`,
          nextState,
        };
      }

      // 서브넷 자동 생성
      const count = Object.keys(nextState.networks).length;
      const subnet = `172.${18 + count}.0.0/16`;

      nextState.networks[netName] = {
        name: netName,
        driver: 'bridge',
        subnet,
        connectedContainerIds: [],
      };

      const fullId = Math.random().toString(16).substring(2, 14) + Math.random().toString(16).substring(2, 14);
      return {
        success: true,
        stdout: `${fullId}\n`,
        stderr: '',
        nextState,
      };
    }

    case 'ls':
    case 'list': {
      const networks = Object.values(state.networks);
      const header = 'NETWORK ID     NAME      DRIVER    SCOPE';
      const rows = networks.map((net, i) => {
        const fakeId = (100000000000 + i).toString(16).slice(0, 12);
        return `${fakeId.padEnd(14)} ${net.name.padEnd(9)} ${net.driver.padEnd(9)} local`;
      });

      return {
        success: true,
        stdout: `${header}\n${rows.join('\n')}\n`,
        stderr: '',
        nextState: state,
      };
    }

    case 'connect': {
      const [netName, targetContainer] = cmd.args;
      if (!netName || !targetContainer) {
        return {
          success: false,
          stdout: '',
          stderr: '"docker network connect" requires 2 arguments: NETWORK CONTAINER',
          nextState,
        };
      }

      const network = nextState.networks[netName];
      if (!network) {
        return {
          success: false,
          stdout: '',
          stderr: `Error response from daemon: network ${netName} not found`,
          nextState,
        };
      }

      const container = Object.values(nextState.containers).find(
        c => c.id === targetContainer || c.id.startsWith(targetContainer) || c.name === targetContainer
      );

      if (!container) {
        return {
          success: false,
          stdout: '',
          stderr: `Error response from daemon: No such container: ${targetContainer}`,
          nextState,
        };
      }

      if (!container.networkNames.includes(netName)) {
        container.networkNames.push(netName);
      }
      if (!network.connectedContainerIds.includes(container.id)) {
        network.connectedContainerIds.push(container.id);
      }

      return {
        success: true,
        stdout: '',
        stderr: '',
        nextState,
      };
    }

    case 'rm': {
      const netName = cmd.args[0];
      if (!netName) {
        return {
          success: false,
          stdout: '',
          stderr: '"docker network rm" requires at least 1 network argument.',
          nextState,
        };
      }

      if (['bridge', 'host', 'none'].includes(netName)) {
        return {
          success: false,
          stdout: '',
          stderr: `Error response from daemon: ${netName} is a pre-defined network and cannot be removed`,
          nextState,
        };
      }

      if (!nextState.networks[netName]) {
        return {
          success: false,
          stdout: '',
          stderr: `Error response from daemon: network ${netName} not found`,
          nextState,
        };
      }

      delete nextState.networks[netName];
      return {
        success: true,
        stdout: `${netName}\n`,
        stderr: '',
        nextState,
      };
    }

    default:
      return {
        success: false,
        stdout: '',
        stderr: `docker network: '${action}' is not a valid docker network command. See 'docker network --help'.`,
        nextState: state,
      };
  }
}
