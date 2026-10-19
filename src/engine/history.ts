import { DockerEngineState, StateHistoryManager } from '../types/engine';

export const MAX_HISTORY_SNAPSHOTS = 20;

export function cloneState(state: DockerEngineState): DockerEngineState {
  return JSON.parse(JSON.stringify(state));
}

export class HistoryManager {
  private history: StateHistoryManager;

  constructor(initialState: DockerEngineState) {
    this.history = {
      past: [],
      present: cloneState(initialState),
      future: [],
    };
  }

  public getPresentState(): DockerEngineState {
    return cloneState(this.history.present);
  }

  public pushState(newState: DockerEngineState): void {
    this.history.past.push(cloneState(this.history.present));
    if (this.history.past.length > MAX_HISTORY_SNAPSHOTS) {
      this.history.past.shift();
    }
    this.history.present = cloneState(newState);
    this.history.future = []; // Clear redo stack on new action
  }

  public undo(): { success: boolean; state: DockerEngineState; message: string } {
    if (this.history.past.length === 0) {
      return {
        success: false,
        state: cloneState(this.history.present),
        message: '되돌릴 이전 작업 내역이 없습니다.',
      };
    }

    const previousState = this.history.past.pop()!;
    this.history.future.push(cloneState(this.history.present));
    this.history.present = previousState;

    return {
      success: true,
      state: cloneState(this.history.present),
      message: '직전 상태로 성공적으로 되돌렸습니다. (Undo complete)',
    };
  }

  public redo(): { success: boolean; state: DockerEngineState; message: string } {
    if (this.history.future.length === 0) {
      return {
        success: false,
        state: cloneState(this.history.present),
        message: '다시 실행할 작업 내역이 없습니다.',
      };
    }

    const nextState = this.history.future.pop()!;
    this.history.past.push(cloneState(this.history.present));
    this.history.present = nextState;

    return {
      success: true,
      state: cloneState(this.history.present),
      message: '다시 실행했습니다. (Redo complete)',
    };
  }

  public reset(newInitialState: DockerEngineState): void {
    this.history.past = [];
    this.history.present = cloneState(newInitialState);
    this.history.future = [];
  }

  public canUndo(): boolean {
    return this.history.past.length > 0;
  }

  public canRedo(): boolean {
    return this.history.future.length > 0;
  }
}
