import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { createActor } from 'xstate';
import { arCookingMachine } from '@/services/ar/ARStateMachine';
import { TimelineEngine, TimelineEvent, InventoryDeduction } from '@/services/ar/TimelineEngine';
import {
  GestureType,
  ARCookingPhase,
  TimelineStep,
  DetectionFrame,
  IngredientOverlay,
  ARSessionStats,
} from '@/types/ar';
import { useInventory, InventoryItem } from '@/contexts/InventoryContext';
import { useVoiceControl } from '@/hooks/useVoiceControl';
import { useGeminiAudio } from '@/hooks/useGeminiAudio';
import { useCookingHistory } from '@/contexts/CookingHistoryContext';
import { useGamification } from '@/contexts/GamificationContext';
import { toSystemUnit, toHumanUnit } from '@/services/UnitConversionService';
import Colors from '@/constants/colors';
import { RecentCook } from '@/types';

interface UseARSessionProps {
  recipeId: string;
  recipeTitle: string;
  recipeImage: string;
  recipeIngredients: { name: string; amount: string; unit?: string }[];
  recipeInstructions: { step: number; text: string; time?: number }[];
}

export function useARSession({
  recipeId,
  recipeTitle,
  recipeImage,
  recipeIngredients,
  recipeInstructions,
}: UseARSessionProps) {
  const { inventory, updateItem, checkIngredientInPantry } = useInventory();
  const { addSession, updateSession, inProgressSessions } = useCookingHistory();
  const { awardXP } = useGamification();

  const [phase, setPhase] = useState<ARCookingPhase>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [lastGesture, setLastGesture] = useState<GestureType>('none');
  const [gestureConfidence, setGestureConfidence] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [deductionLog, setDeductionLog] = useState<InventoryDeduction[]>([]);
  const [mediaPipeReady, setMediaPipeReady] = useState(false);

  const actorRef = useRef<ReturnType<typeof createActor<typeof arCookingMachine>> | null>(null);
  const timelineRef = useRef<TimelineEngine | null>(null);

  const steps: TimelineStep[] = useMemo(() => {
    return recipeInstructions.map((inst, idx) => {
      const matchedIng = recipeIngredients.find((ing) => {
        const lowerText = inst.text.toLowerCase();
        return lowerText.includes(ing.name.toLowerCase());
      });

      return {
        id: idx + 1,
        title: `Step ${inst.step}`,
        text: inst.text,
        duration: inst.time || 0,
        ingredient: matchedIng?.name,
        amount: matchedIng ? parseFloat(matchedIng.amount) || undefined : undefined,
        unit: matchedIng?.unit,
        image: recipeImage,
      };
    });
  }, [recipeInstructions, recipeIngredients, recipeImage]);

  const currentStep = steps[currentStepIndex] || null;
  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  const handleVoiceCommand = useCallback((text: string) => {
    const cmd = text.toLowerCase();
    const actor = actorRef.current;
    if (!actor) return;

    if (cmd.includes('next') || cmd.includes('continue')) {
      actor.send({ type: 'NEXT_STEP' });
    } else if (cmd.includes('back') || cmd.includes('previous')) {
      actor.send({ type: 'PREV_STEP' });
    } else if (cmd.includes('pause') || cmd.includes('stop')) {
      actor.send({ type: 'PAUSE' });
    } else if (cmd.includes('resume') || cmd.includes('go') || cmd.includes('play')) {
      actor.send({ type: 'RESUME' });
    } else if (cmd.includes('repeat') || cmd.includes('again')) {
      speakCurrentStep();
    } else if (cmd.includes('how much') || cmd.includes('inventory') || cmd.includes('left')) {
      readInventoryStatus();
    }
  }, []);

  const { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking } =
    useVoiceControl({ onCommand: handleVoiceCommand });

  const gemini = useGeminiAudio();

  const speakCurrentStep = useCallback(() => {
    const step = steps[currentStepIndex];
    if (!step) return;

    const text = `Step ${step.id}. ${step.text}`;
    if (gemini.isConnected) {
      gemini.speak(text);
    } else {
      speak(text);
    }
  }, [currentStepIndex, steps, gemini, speak]);

  const readInventoryStatus = useCallback(() => {
    const statusParts = recipeIngredients.map((ing) => {
      const check = checkIngredientInPantry(ing.name);
      if (check.found && check.item) {
        return `${ing.name}: ${check.item.quantity || 'some'} ${check.item.unit || ''} left`;
      }
      return `${ing.name}: not in pantry`;
    });
    const text = statusParts.join('. ');
    if (gemini.isConnected) {
      gemini.speak(text);
    } else {
      speak(text);
    }
  }, [recipeIngredients, checkIngredientInPantry, gemini, speak]);

  const deductInventory = useCallback(
    async (deduction: InventoryDeduction) => {
      const check = checkIngredientInPantry(deduction.ingredient);
      if (!check.found || !check.item) return;

      const item = check.item;
      const currentQty = item.quantity || 0;
      const currentUnit = item.unit || 'pcs';

      let deductAmount = deduction.amount;
      if (deduction.unit !== currentUnit) {
        const converted = toSystemUnit(deduction.amount, deduction.unit, deduction.ingredient);
        const pantryConverted = toSystemUnit(currentQty, currentUnit, deduction.ingredient);
        if (converted.unit === pantryConverted.unit) {
          deductAmount = converted.amount;
        }
      }

      const newQty = Math.max(0, currentQty - deductAmount);
      const newStock = currentQty > 0 ? Math.round((newQty / currentQty) * (item.stockPercentage || 100)) : 0;

      await updateItem(item.id, {
        quantity: newQty,
        stockPercentage: newStock,
        status: newStock > 20 ? 'good' : newStock > 0 ? 'low' : 'expiring',
      });

      setDeductionLog((prev) => [...prev, deduction]);
    },
    [checkIngredientInPantry, updateItem]
  );

  const ingredientOverlays: IngredientOverlay[] = useMemo(() => {
    return recipeIngredients.map((ing) => {
      const check = checkIngredientInPantry(ing.name);
      let status: IngredientOverlay['status'] = 'missing';
      let color = Colors.red;
      let quantity = 0;
      let unit = ing.unit || '';

      if (check.found && check.item) {
        quantity = check.item.quantity || 0;
        unit = check.item.unit || unit;
        const needed = parseFloat(ing.amount) || 0;
        if (quantity >= needed) {
          status = 'enough';
          color = Colors.green;
        } else if (quantity > 0) {
          status = 'low';
          color = Colors.secondary;
        }
      } else if (check.hasSubstitute) {
        status = 'substitute';
        color = '#60a5fa';
        if (check.substituteItem) {
          quantity = check.substituteItem.quantity || 0;
          unit = check.substituteItem.unit || unit;
        }
      }

      return { name: ing.name, quantity, unit, status, color };
    });
  }, [recipeIngredients, checkIngredientInPantry, inventory]);

  useEffect(() => {
    const actor = createActor(arCookingMachine);
    actorRef.current = actor;

    const sub = actor.subscribe((state) => {
      const ctx = state.context;
      setPhase(ctx.phase);
      setCurrentStepIndex(ctx.currentStep);
      setLastGesture(ctx.lastGesture);
    });

    actor.start();
    actor.send({ type: 'SET_TOTAL_STEPS', total: steps.length });

    return () => {
      sub.unsubscribe();
      actor.stop();
    };
  }, [steps.length]);

  useEffect(() => {
    const timeline = new TimelineEngine(steps);
    timelineRef.current = timeline;

    const unsub = timeline.on((event: TimelineEvent) => {
      switch (event.type) {
        case 'step_start':
          setCurrentStepIndex(event.stepIndex);
          setElapsed(0);
          break;
        case 'timer_tick':
          setElapsed(event.elapsed);
          setTotalElapsed(timeline.getTotalElapsed());
          break;
        case 'timer_done':
          actorRef.current?.send({ type: 'TIMER_DONE' });
          break;
        case 'step_complete':
          break;
        case 'inventory_deduct': {
          const ded = timeline.getDeduction(event.stepIndex);
          if (ded) deductInventory(ded);
          break;
        }
        case 'recipe_complete':
          actorRef.current?.send({ type: 'RECIPE_COMPLETE' });
          break;
      }
    });

    return () => {
      unsub();
      timeline.destroy();
    };
  }, [steps, deductInventory]);

  useEffect(() => {
    if (phase === 'cooking' && currentStep) {
      setTimeout(() => speakCurrentStep(), 400);
    }
  }, [currentStepIndex, phase]);

  useEffect(() => {
    const initSession = async () => {
      const existing = inProgressSessions.find((s) => s.recipeId === recipeId);
      if (existing) {
        setSessionId(existing.id);
        if (existing.currentStep && existing.currentStep > 0) {
          setCurrentStepIndex(existing.currentStep - 1);
          actorRef.current?.send({ type: 'SET_TOTAL_STEPS', total: steps.length });
        }
      } else {
        const newId = Date.now().toString();
        const session: RecentCook = {
          id: newId,
          recipeId,
          title: recipeTitle,
          image: recipeImage,
          progress: 0,
          startedAt: new Date().toISOString(),
          totalSteps: steps.length,
          currentStep: 1,
        };
        await addSession(session);
        setSessionId(newId);
      }
    };
    initSession();
  }, []);

  useEffect(() => {
    if (sessionId && phase !== 'idle' && phase !== 'complete') {
      updateSession(sessionId, {
        currentStep: currentStepIndex + 1,
        progress: Math.round(progress),
      });
    }
  }, [currentStepIndex, sessionId, phase]);

  const handleFrame = useCallback(
    (frame: DetectionFrame) => {
      const actor = actorRef.current;
      if (!actor || phase === 'complete' || phase === 'idle') return;

      if (frame.gesture !== 'none' && frame.gestureConfidence > 0.6) {
        setLastGesture(frame.gesture);
        setGestureConfidence(frame.gestureConfidence);

        actor.send({
          type: 'GESTURE',
          gesture: frame.gesture,
          confidence: frame.gestureConfidence,
        });

        const snapshot = actor.getSnapshot();
        const currentPhase = snapshot.context.phase;

        switch (frame.gesture) {
          case 'open_hand':
            if (currentPhase === 'cooking') {
              actor.send({ type: 'PAUSE' });
              timelineRef.current?.pause();
            } else if (currentPhase === 'paused') {
              actor.send({ type: 'RESUME' });
              timelineRef.current?.resume();
            }
            break;
          case 'pinch':
            if (currentPhase === 'cooking') {
              timelineRef.current?.nextStep();
              actor.send({ type: 'NEXT_STEP' });
            }
            break;
          case 'thumbs_up':
            if (currentPhase === 'cooking') {
              timelineRef.current?.completeStep();
            }
            break;
        }
      }
    },
    [phase]
  );

  const handleMediaPipeReady = useCallback((ready: boolean) => {
    setMediaPipeReady(ready);
    actorRef.current?.send({ type: 'SET_MEDIAPIPE_READY', ready });
  }, []);

  const handleInit = useCallback(() => {
    actorRef.current?.send({ type: 'INIT' });
    setTimeout(() => {
      actorRef.current?.send({ type: 'LOADED' });
    }, 500);
  }, []);

  const handleStart = useCallback(() => {
    actorRef.current?.send({ type: 'START' });
    timelineRef.current?.start();

    if (gemini.isConnected) {
      const context = `You are a cooking assistant helping make ${recipeTitle}. Guide the user through each step naturally. Be encouraging and provide tips. Current ingredients: ${recipeIngredients.map((i) => i.name).join(', ')}.`;
      gemini.speak(context);
    }
  }, [recipeTitle, recipeIngredients, gemini]);

  const handlePause = useCallback(() => {
    actorRef.current?.send({ type: 'PAUSE' });
    timelineRef.current?.pause();
  }, []);

  const handleResume = useCallback(() => {
    actorRef.current?.send({ type: 'RESUME' });
    timelineRef.current?.resume();
  }, []);

  const handleNext = useCallback(() => {
    timelineRef.current?.nextStep();
    actorRef.current?.send({ type: 'NEXT_STEP' });
  }, []);

  const handlePrev = useCallback(() => {
    timelineRef.current?.prevStep();
    actorRef.current?.send({ type: 'PREV_STEP' });
  }, []);

  const handleToggleMic = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleExit = useCallback(() => {
    actorRef.current?.send({ type: 'EXIT' });
    timelineRef.current?.destroy();
    gemini.stop();
    stopSpeaking();
  }, [gemini, stopSpeaking]);

  const completeSession = useCallback(async () => {
    if (sessionId) {
      await updateSession(sessionId, {
        progress: 100,
        completedDate: new Date().toISOString(),
      });
    }
    await awardXP('complete_cook');
  }, [sessionId, updateSession, awardXP]);

  useEffect(() => {
    if (phase === 'complete') {
      completeSession();
    }
  }, [phase, completeSession]);

  const sessionStats: ARSessionStats = useMemo(() => {
    const used = deductionLog.map((d) => ({
      name: d.ingredient,
      amount: d.amount,
      unit: d.unit,
    }));

    const remaining = recipeIngredients.map((ing) => {
      const check = checkIngredientInPantry(ing.name);
      return {
        name: ing.name,
        amount: check.item?.quantity || 0,
        unit: check.item?.unit || ing.unit || '',
      };
    });

    return {
      totalCookTime: totalElapsed,
      ingredientsUsed: used,
      ingredientsRemaining: remaining,
      stepsCompleted: phase === 'complete' ? steps.length : currentStepIndex,
      totalSteps: steps.length,
      xpEarned: phase === 'complete' ? 100 : 0,
    };
  }, [deductionLog, recipeIngredients, checkIngredientInPantry, totalElapsed, phase, currentStepIndex, steps.length]);

  return {
    phase,
    currentStep,
    currentStepIndex,
    totalSteps: steps.length,
    elapsed,
    totalElapsed,
    progress,
    lastGesture,
    gestureConfidence,
    ingredientOverlays,
    sessionStats,
    mediaPipeReady,
    isListening,
    isSpeaking: isSpeaking || gemini.isSpeaking,
    handleFrame,
    handleMediaPipeReady,
    handleInit,
    handleStart,
    handlePause,
    handleResume,
    handleNext,
    handlePrev,
    handleToggleMic,
    handleExit,
  };
}
