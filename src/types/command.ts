import { DockerEngineState } from './engine';

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  nextState: DockerEngineState;
  animationQueue?: {
    type: 'layer_build' | 'container_start' | 'container_stop' | 'compose_step';
    targetId?: string;
    label?: string;
    durationMs?: number;
  }[];
}

export interface ParsedCommand {
  raw: string;
  command: string;      // e.g. "docker" or "undo" or "help" or "clear"
  subcommand?: string;   // e.g. "run", "ps", "stop", "rm", "images", "build", "volume", "network", "compose"
  action?: string;       // e.g. "create", "ls", "rm" for volume/network, "up", "down" for compose
  flags: Record<string, string | boolean | string[]>;
  args: string[];
}
