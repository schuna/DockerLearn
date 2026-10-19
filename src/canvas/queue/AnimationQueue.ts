export interface AnimationStep {
  type: 'layer_build' | 'container_start' | 'container_stop' | 'compose_step';
  targetId?: string;
  label?: string;
  durationMs?: number;
}

export type AnimationCallback = (step: AnimationStep, isLast: boolean) => void;

export class AnimationQueueManager {
  private queue: AnimationStep[] = [];
  private isProcessing = false;
  private currentTimer: any = null;

  public enqueue(steps: AnimationStep[], onStep: AnimationCallback, onComplete?: () => void): void {
    this.queue.push(...steps);
    if (!this.isProcessing) {
      this.processNext(onStep, onComplete);
    }
  }

  private processNext(onStep: AnimationCallback, onComplete?: () => void): void {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      if (onComplete) onComplete();
      return;
    }

    this.isProcessing = true;
    const step = this.queue.shift()!;
    const isLast = this.queue.length === 0;

    onStep(step, isLast);

    const delay = step.durationMs || 350;
    this.currentTimer = setTimeout(() => {
      this.processNext(onStep, onComplete);
    }, delay);
  }

  public clear(): void {
    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }
    this.queue = [];
    this.isProcessing = false;
  }
}
