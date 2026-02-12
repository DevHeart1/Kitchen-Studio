
export interface RecipeStep {
  id: string;
  instruction: string;
  durationSeconds?: number;
  ingredients: {
    name: string;
    amount: number;
    unit: string;
  }[];
  highlightObject?: 'pan' | 'bowl' | 'cutting_board';
}

export type TimelineEventCallback = (event: string, data?: any) => void;

export class TimelineEngine {
  private steps: RecipeStep[] = [];
  private currentStepIndex: number = 0;
  private listeners: TimelineEventCallback[] = [];

  constructor(steps: RecipeStep[]) {
    this.steps = steps;
  }

  public subscribe(callback: TimelineEventCallback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private emit(event: string, data?: any) {
    this.listeners.forEach(l => l(event, data));
  }

  public start() {
    this.currentStepIndex = 0;
    this.emit('STEP_START', this.steps[0]);
    this.checkAutoDeduction(this.steps[0]);
  }

  public next() {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      const step = this.steps[this.currentStepIndex];
      this.emit('STEP_START', step);
      this.checkAutoDeduction(step);
      return true;
    } else {
      this.emit('RECIPE_COMPLETE');
      return false;
    }
  }

  public getActiveIngredients(): string[] {
    const step = this.steps[this.currentStepIndex];
    if (!step) return [];
    return step.ingredients.map(i => i.name);
  }

  public getCurrentStep(): RecipeStep | null {
    return this.steps[this.currentStepIndex] || null;
  }

  /**
   * Logic to determine if items should be deducted from inventory.
   * In a real app, this might happen AFTER the step is done, or during.
   * For this V1, we deduct when the step starts (instruction given).
   */
  private checkAutoDeduction(step: RecipeStep) {
    if (step.ingredients.length > 0) {
      // Emit event for InventoryContext to pick up
      step.ingredients.forEach(ing => {
        this.emit('INVENTORY_DEDUCT', ing);
      });
    }
  }
}
