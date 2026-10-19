import { DockerEngineState } from './engine';

export interface EvaluationResult {
  passed: boolean;
  message: string;
  hint?: string;
}

export type LevelEvaluator = (state: DockerEngineState) => EvaluationResult;

export interface LevelDefinition {
  id: string; // e.g. "1-1", "1-2"
  stage: 1 | 2 | 3;
  title: string;
  description: string;
  goal: string;
  recommendedCommand?: string;
  initialState: DockerEngineState;
  initialEditorContent?: Record<string, string>; // e.g. { 'Dockerfile': '...' }
  evaluate: LevelEvaluator;
}

export interface UserProgressStorage {
  completedLevels: string[];
  commandHistory: string[];
  lastActiveLevel: string;
}

export const STORAGE_KEY_PROGRESS = 'DOCKER_LEARNING_PROGRESS_V3';
