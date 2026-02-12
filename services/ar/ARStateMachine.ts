import { setup, assign, createActor } from 'xstate';
import { GestureType, ARCookingPhase } from '@/types/ar';

interface ARContext {
  phase: ARCookingPhase;
  currentStep: number;
  totalSteps: number;
  lastGesture: GestureType;
  lastGestureTime: number;
  errorMessage: string | null;
  mediaPipeReady: boolean;
  geminiReady: boolean;
}

const GESTURE_COOLDOWN_MS = 1200;

export const arCookingMachine = setup({
  types: {
    context: {} as ARContext,
    events: {} as
      | { type: 'INIT' }
      | { type: 'LOADED' }
      | { type: 'LOAD_ERROR'; error: string }
      | { type: 'START' }
      | { type: 'PAUSE' }
      | { type: 'RESUME' }
      | { type: 'NEXT_STEP' }
      | { type: 'PREV_STEP' }
      | { type: 'STEP_COMPLETE' }
      | { type: 'RECIPE_COMPLETE' }
      | { type: 'GESTURE'; gesture: GestureType; confidence: number }
      | { type: 'VOICE_COMMAND'; command: string }
      | { type: 'TIMER_DONE' }
      | { type: 'EXIT' }
      | { type: 'SET_MEDIAPIPE_READY'; ready: boolean }
      | { type: 'SET_GEMINI_READY'; ready: boolean }
      | { type: 'SET_TOTAL_STEPS'; total: number },
  },
  guards: {
    gestureNotOnCooldown: ({ context }) => {
      return Date.now() - context.lastGestureTime > GESTURE_COOLDOWN_MS;
    },
    hasNextStep: ({ context }) => {
      return context.currentStep < context.totalSteps - 1;
    },
    hasPrevStep: ({ context }) => {
      return context.currentStep > 0;
    },
    isLastStep: ({ context }) => {
      return context.currentStep >= context.totalSteps - 1;
    },
  },
}).createMachine({
  id: 'arCooking',
  initial: 'idle',
  context: {
    phase: 'idle',
    currentStep: 0,
    totalSteps: 0,
    lastGesture: 'none',
    lastGestureTime: 0,
    errorMessage: null,
    mediaPipeReady: false,
    geminiReady: false,
  },
  on: {
    SET_MEDIAPIPE_READY: {
      actions: assign({ mediaPipeReady: ({ event }) => event.ready }),
    },
    SET_GEMINI_READY: {
      actions: assign({ geminiReady: ({ event }) => event.ready }),
    },
    SET_TOTAL_STEPS: {
      actions: assign({ totalSteps: ({ event }) => event.total }),
    },
    EXIT: { target: '.idle', actions: assign({ phase: 'idle' }) },
  },
  states: {
    idle: {
      entry: assign({ phase: 'idle' }),
      on: {
        INIT: { target: 'initializing' },
        START: { target: 'cooking' },
      },
    },
    initializing: {
      entry: assign({ phase: 'initializing', errorMessage: null }),
      on: {
        LOADED: { target: 'ready' },
        LOAD_ERROR: {
          target: 'ready',
          actions: assign({ errorMessage: ({ event }) => event.error }),
        },
      },
    },
    ready: {
      entry: assign({ phase: 'ready' }),
      on: {
        START: { target: 'cooking' },
      },
    },
    cooking: {
      entry: assign({ phase: 'cooking' }),
      on: {
        PAUSE: { target: 'paused' },
        NEXT_STEP: [
          {
            guard: 'isLastStep',
            actions: [
              assign({ phase: 'complete' }),
            ],
            target: 'complete',
          },
          {
            guard: 'hasNextStep',
            actions: assign({
              currentStep: ({ context }) => context.currentStep + 1,
              phase: 'cooking',
            }),
          },
        ],
        PREV_STEP: {
          guard: 'hasPrevStep',
          actions: assign({
            currentStep: ({ context }) => context.currentStep - 1,
          }),
        },
        STEP_COMPLETE: [
          {
            guard: 'isLastStep',
            target: 'complete',
          },
          {
            guard: 'hasNextStep',
            actions: assign({
              currentStep: ({ context }) => context.currentStep + 1,
            }),
          },
        ],
        RECIPE_COMPLETE: { target: 'complete' },
        TIMER_DONE: {},
        GESTURE: {
          guard: 'gestureNotOnCooldown',
          actions: assign({
            lastGesture: ({ event }) => event.gesture,
            lastGestureTime: () => Date.now(),
          }),
        },
        VOICE_COMMAND: {},
      },
    },
    paused: {
      entry: assign({ phase: 'paused' }),
      on: {
        RESUME: { target: 'cooking' },
        NEXT_STEP: {
          guard: 'hasNextStep',
          target: 'cooking',
          actions: assign({
            currentStep: ({ context }) => context.currentStep + 1,
          }),
        },
      },
    },
    complete: {
      entry: assign({ phase: 'complete' }),
      type: 'final',
    },
  },
});

export function createARCookingActor(totalSteps: number) {
  const actor = createActor(arCookingMachine, {
    input: undefined,
  });
  actor.start();
  actor.send({ type: 'SET_TOTAL_STEPS', total: totalSteps });
  return actor;
}
