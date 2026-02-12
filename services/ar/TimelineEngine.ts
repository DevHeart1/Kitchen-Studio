import { TimelineStep } from '@/types/ar';

export type TimelineEventType =
  | 'step_start'
  | 'step_complete'
  | 'timer_tick'
  | 'timer_done'
  | 'recipe_complete'
  | 'inventory_deduct';

export interface TimelineEvent {
  type: TimelineEventType;
  stepIndex: number;
  step: TimelineStep;
  elapsed: number;
  remaining: number;
}

export interface InventoryDeduction {
  ingredient: string;
  amount: number;
  unit: string;
}

type TimelineListener = (event: TimelineEvent) => void;

export class TimelineEngine {
  private steps: TimelineStep[] = [];
  private currentIndex = 0;
  private elapsed = 0;
  private totalElapsed = 0;
  private running = false;
  private paused = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners: TimelineListener[] = [];
  private deductions: Map<number, InventoryDeduction> = new Map();

  constructor(steps: TimelineStep[]) {
    this.steps = steps;
    this.buildDeductions();
  }

  private buildDeductions(): void {
    this.steps.forEach((step, idx) => {
      if (step.ingredient && step.amount && step.unit) {
        this.deductions.set(idx, {
          ingredient: step.ingredient,
          amount: step.amount,
          unit: step.unit,
        });
      }
    });
  }

  on(listener: TimelineListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(type: TimelineEventType): void {
    const step = this.steps[this.currentIndex];
    if (!step) return;
    const event: TimelineEvent = {
      type,
      stepIndex: this.currentIndex,
      step,
      elapsed: this.elapsed,
      remaining: Math.max(0, step.duration - this.elapsed),
    };
    this.listeners.forEach((l) => l(event));
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.elapsed = 0;
    this.emit('step_start');
    this.startTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.intervalId = setInterval(() => {
      if (this.paused) return;
      this.elapsed++;
      this.totalElapsed++;

      const step = this.steps[this.currentIndex];
      if (!step) return;

      this.emit('timer_tick');

      if (step.duration > 0 && this.elapsed >= step.duration) {
        this.emit('timer_done');
        if (step.autoAdvance) {
          this.completeStep();
        }
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  completeStep(): void {
    const deduction = this.deductions.get(this.currentIndex);
    if (deduction) {
      this.emit('inventory_deduct');
    }
    this.emit('step_complete');

    if (this.currentIndex >= this.steps.length - 1) {
      this.running = false;
      this.stopTimer();
      this.emit('recipe_complete');
      return;
    }

    this.currentIndex++;
    this.elapsed = 0;
    this.emit('step_start');
  }

  nextStep(): void {
    if (this.currentIndex >= this.steps.length - 1) {
      this.completeStep();
      return;
    }
    this.currentIndex++;
    this.elapsed = 0;
    this.emit('step_start');
  }

  prevStep(): void {
    if (this.currentIndex <= 0) return;
    this.currentIndex--;
    this.elapsed = 0;
    this.emit('step_start');
  }

  goToStep(index: number): void {
    if (index < 0 || index >= this.steps.length) return;
    this.currentIndex = index;
    this.elapsed = 0;
    this.emit('step_start');
  }

  getCurrentStep(): TimelineStep | null {
    return this.steps[this.currentIndex] || null;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getStepCount(): number {
    return this.steps.length;
  }

  getElapsed(): number {
    return this.elapsed;
  }

  getTotalElapsed(): number {
    return this.totalElapsed;
  }

  getDeduction(stepIndex: number): InventoryDeduction | null {
    return this.deductions.get(stepIndex) || null;
  }

  isRunning(): boolean {
    return this.running;
  }

  isPaused(): boolean {
    return this.paused;
  }

  getProgress(): number {
    if (this.steps.length === 0) return 0;
    return ((this.currentIndex + 1) / this.steps.length) * 100;
  }

  destroy(): void {
    this.stopTimer();
    this.listeners = [];
    this.running = false;
    this.paused = false;
  }
}
