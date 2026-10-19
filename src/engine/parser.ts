import { ParsedCommand } from '../types/command';

// 화이트리스트 지원 명령어 목록
export const WHITELIST_DOCKER_SUBCOMMANDS = [
  'run',
  'ps',
  'stop',
  'rm',
  'images',
  'image',
  'build',
  'volume',
  'network',
  'compose',
];

export const WHITELIST_ROOT_COMMANDS = ['docker', 'undo', 'redo', 'clear', 'help'];

/**
 * 명령어 문자열을 인자 배열로 안전하게 토큰화 (따옴표 지원)
 */
export function tokenizeInput(input: string): string[] {
  const tokens: string[] = [];
  let currentToken = '';
  let inDoubleQuote = false;
  let inSingleQuote = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    } else if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if ((char === ' ' || char === '\t') && !inDoubleQuote && !inSingleQuote) {
      if (currentToken.length > 0) {
        tokens.push(currentToken);
        currentToken = '';
      }
    } else {
      currentToken += char;
    }
  }

  if (currentToken.length > 0) {
    tokens.push(currentToken);
  }

  return tokens;
}

export interface ParseResult {
  parsed?: ParsedCommand;
  error?: string;
}

export function parseCommand(rawInput: string): ParseResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { error: '' };
  }

  // 1. 미지원 복합 쉘 연산자 감지
  if (/[|&><;]/.test(trimmed)) {
    return {
      error: '가상 학습 터미널에서는 복합 쉘 문법 대신 표준 단일 도커 명령어 실행을 권장합니다.',
    };
  }

  const tokens = tokenizeInput(trimmed);
  if (tokens.length === 0) {
    return { error: '' };
  }

  const rootCommand = tokens[0].toLowerCase();

  // 루트 명령어 검증
  if (!WHITELIST_ROOT_COMMANDS.includes(rootCommand)) {
    return {
      error: `알 수 없는 명령어입니다: '${rootCommand}'. 'help'를 입력하여 사용 가능한 명령어를 확인하세요.`,
    };
  }

  // 단독 유틸리티 명령어
  if (rootCommand === 'undo' || rootCommand === 'redo' || rootCommand === 'clear' || rootCommand === 'help') {
    return {
      parsed: {
        raw: trimmed,
        command: rootCommand,
        flags: {},
        args: tokens.slice(1),
      },
    };
  }

  // docker 명령어 처리
  if (tokens.length < 2) {
    return {
      error: '도커 서브 명령어를 지정하세요. (예: docker run, docker ps, docker images 등)',
    };
  }

  const subcommand = tokens[1].toLowerCase();
  const normalizedSubcommand = subcommand === 'image' ? 'images' : subcommand;

  if (!WHITELIST_DOCKER_SUBCOMMANDS.includes(normalizedSubcommand)) {
    return {
      error: `지원하지 않거나 알 수 없는 도커 명령어입니다: 'docker ${subcommand}'. 'help'를 통해 지원 목록을 확인하세요.`,
    };
  }

  const flags: Record<string, string | boolean | string[]> = {};
  const args: string[] = [];
  let action: string | undefined;

  let index = 2;

  // volume, network, compose의 경우 action(create, ls, rm, up, down 등) 추출
  if (['volume', 'network', 'compose'].includes(normalizedSubcommand) && index < tokens.length) {
    const nextToken = tokens[index];
    if (!nextToken.startsWith('-')) {
      action = nextToken.toLowerCase();
      index++;
    }
  }

  // 플래그 및 아규먼트 파싱
  while (index < tokens.length) {
    const token = tokens[index];

    if (token.startsWith('--')) {
      const flagPart = token.slice(2);
      if (flagPart.includes('=')) {
        const [k, v] = flagPart.split('=');
        addFlagValue(flags, k, v);
      } else {
        // 다음 토큰이 값인지 확인
        if (
          index + 1 < tokens.length &&
          !tokens[index + 1].startsWith('-') &&
          isValuedFlag(flagPart)
        ) {
          addFlagValue(flags, flagPart, tokens[index + 1]);
          index++;
        } else {
          flags[flagPart] = true;
        }
      }
    } else if (token.startsWith('-') && token.length > 1) {
      // e.g. -d or -p 8080:80 or -it
      const shortFlags = token.slice(1);
      
      // 만약 -p 8080:80 처럼 단일 짧은 플래그가 값을 취하는 경우
      if (shortFlags.length === 1 && isValuedShortFlag(shortFlags)) {
        if (index + 1 < tokens.length && !tokens[index + 1].startsWith('-')) {
          addNormalizedShortFlag(flags, shortFlags, tokens[index + 1]);
          index++;
        } else {
          addNormalizedShortFlag(flags, shortFlags, true);
        }
      } else {
        // 복합 불리언 플래그 (예: -d, -a, -q)
        for (let j = 0; j < shortFlags.length; j++) {
          const sf = shortFlags[j];
          addNormalizedShortFlag(flags, sf, true);
        }
      }
    } else {
      args.push(token);
    }

    index++;
  }

  return {
    parsed: {
      raw: trimmed,
      command: 'docker',
      subcommand: normalizedSubcommand,
      action,
      flags,
      args,
    },
  };
}

function isValuedFlag(flag: string): boolean {
  return ['publish', 'volume', 'name', 'network', 'env', 'tag', 'file'].includes(flag);
}

function isValuedShortFlag(shortFlag: string): boolean {
  return ['p', 'v', 'e', 't', 'f'].includes(shortFlag);
}

function addNormalizedShortFlag(flags: Record<string, any>, sf: string, val: any) {
  const map: Record<string, string> = {
    d: 'detach',
    p: 'publish',
    v: 'volume',
    e: 'env',
    t: 'tag',
    f: 'file',
    a: 'all',
    q: 'quiet',
  };
  const normalized = map[sf] || sf;
  addFlagValue(flags, normalized, val);
}

function addFlagValue(flags: Record<string, any>, key: string, value: any) {
  // 다중 지정 가능한 플래그 (예: -p, -v, -e)
  if (['publish', 'volume', 'env'].includes(key)) {
    if (!flags[key]) {
      flags[key] = [value];
    } else if (Array.isArray(flags[key])) {
      (flags[key] as string[]).push(value);
    } else {
      flags[key] = [flags[key], value];
    }
  } else {
    flags[key] = value;
  }
}
