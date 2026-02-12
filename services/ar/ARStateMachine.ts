import { createMachine, assign } from 'xstate';

export interface ARC_Context {
  recipeId: string | null;
  currentStepIndex: number;
  totalSteps: number;
  isTimerRunning: boolean;
  activeIngredients: string[]; // For AR highlighting
}

export type ARC_Event =
  | { type: 'START_COOKING'; recipeId: string; totalSteps: number, initialIngredients: string[] }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'NEXT_STEP'; nextIngredients?: string[] }
  | { type: 'PREV_STEP'; prevIngredients?: string[] }
  | { type: 'FINISH_COOKING' }
  | { type: 'GESTURE_DETECTED'; gesture: 'open_hand' | 'pinch' | 'thumbs_up' }
  | { type: 'VOICE_COMMAND'; command: 'next' | 'back' | 'pause' | 'repeat' | 'how_much' };

export const arCookingMachine = createMachine({
  types: {} as {
    context: ARC_Context;
    events: ARC_Event;
  },
  id: 'arCooking',
  initial: 'idle',
  context: {
    recipeId: null,
    currentStepIndex: 0,
    totalSteps: 0,
    isTimerRunning: false,
    activeIngredients: [],
  },
  states: {
    idle: {
      on: {
        START_COOKING: {
          target: 'cooking',
          actions: 'initializeContext',
        },
      },
    },
    cooking: {
      initial: 'instruction_active',
      states: {
        instruction_active: {
          // Displaying instruction, speaking audio
          on: {
            PAUSE: { target: '#arCooking.paused' },
            GESTURE_DETECTED: [
              {
                guard: ({ context, event }) => event.gesture === 'open_hand',
                target: '#arCooking.paused',
              },
              {
                guard: ({ context, event }) => event.gesture === 'pinch',
                actions: 'triggerNextStep',
              }
            ],
            VOICE_COMMAND: [
              { guard: ({ event }) => event.command === 'pause', target: '#arCooking.paused' },
              { guard: ({ event }) => event.command === 'next', actions: 'triggerNextStep' },
            ],
            NEXT_STEP: {
              target: 'instruction_active',
              actions: ['incrementStep', 'updateIngredients'],
              guard: 'hasNextStep',
            },
            FINISH_COOKING: { target: '#arCooking.completed' },
          },
        },
      },
    },
    paused: {
      on: {
        RESUME: { target: 'cooking.instruction_active' },
        GESTURE_DETECTED: {
          guard: ({ event }) => event.gesture === 'thumbs_up',
          target: 'cooking.instruction_active'
        },
        VOICE_COMMAND: {
          guard: ({ event }) => event.command === 'next', // "Resume" or "Next"
          target: 'cooking.instruction_active'
        }
      },
    },
    completed: {
      type: 'final',
    },
  },
}, {
  actions: {
    initializeContext: assign(({ event }) => {
      if (event.type !== 'START_COOKING') return {};
      return {
        recipeId: event.recipeId,
        totalSteps: event.totalSteps,
        currentStepIndex: 0,
        isTimerRunning: true,
        activeIngredients: event.initialIngredients || [],
      };
    }),
    incrementStep: assign({
      currentStepIndex: ({ context }) => context.currentStepIndex + 1,
    }),
    updateIngredients: assign(({ event }) => {
      if (event.type === 'NEXT_STEP' && event.nextIngredients) {
        return { activeIngredients: event.nextIngredients };
      }
      return {};
    }),
    triggerNextStep: () => {
      console.log("Trigger next step requested");
    }
  },
  guards: {
    hasNextStep: ({ context }) => context.currentStepIndex < context.totalSteps - 1,
  },
});
