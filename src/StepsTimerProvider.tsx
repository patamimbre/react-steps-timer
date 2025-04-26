import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { StepsTimerContextValue, StepTime } from "./types";

const StepsTimerContext = createContext<StepsTimerContextValue | undefined>(
  undefined
);

interface StepsTimerProviderProps {
  children: React.ReactNode;
}

export const StepsTimerProvider: React.FC<StepsTimerProviderProps> = ({
  children,
}) => {
  const [totalTime, setTotalTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [activeSteps, setActiveSteps] = useState<Record<string, number>>({});
  const [stepTimes, setStepTimes] = useState<StepTime[]>([]);

  const startRef = useRef<number | null>(null);
  const totalOffsetRef = useRef(0);
  const activeStepsRef = useRef<
    Record<string, { start: number | null; offset: number; startTimestamp: number }>
  >({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runningRef = useRef(false);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    // Safe early return if not running
    if (!runningRef.current || startRef.current === null) return;

    const now = Date.now();
    const elapsed = now - startRef.current;

    // Update total time
    setTotalTime((current) => totalOffsetRef.current + elapsed);

    // Update step times
    setActiveSteps((prev) => {
      const updated: Record<string, number> = {};
      let hasChanges = false;

      Object.entries(activeStepsRef.current).forEach(([id, entry]) => {
        if (entry.start !== null) {
          updated[id] = entry.offset + (now - entry.start);
          hasChanges = hasChanges || prev[id] !== updated[id];
        } else if (prev[id]) {
          updated[id] = prev[id];
        }
      });

      // Only update state if values have changed
      return hasChanges ? updated : prev;
    });
  }, []);

  const start = useCallback(() => {
    if (runningRef.current) return;
    const now = Date.now();

    // Clear any existing interval first
    clearTimerInterval();

    setTotalTime(0);
    setActiveSteps({});
    setStepTimes([]);

    totalOffsetRef.current = 0;
    activeStepsRef.current = {};
    startRef.current = now;
    runningRef.current = true;

    setRunning(true);
    intervalRef.current = setInterval(tick, 100);
  }, [tick, clearTimerInterval]);

  const pause = useCallback(() => {
    if (!runningRef.current) return;

    // Update refs first
    runningRef.current = false;

    clearTimerInterval();

    const now = Date.now();

    if (startRef.current !== null) {
      totalOffsetRef.current += now - startRef.current;
      startRef.current = null;
    }

    // Update all active steps
    Object.values(activeStepsRef.current).forEach((entry) => {
      if (entry.start !== null) {
        entry.offset += now - entry.start;
        entry.start = null;
      }
    });

    // Update state last
    setRunning(false);
  }, [clearTimerInterval]);

  const resume = useCallback(() => {
    if (runningRef.current) return;

    // Clear any existing interval first
    clearTimerInterval();

    const now = Date.now();

    runningRef.current = true;
    startRef.current = now;

    // Resume all active steps
    Object.values(activeStepsRef.current).forEach((entry) => {
      if (entry.start === null) entry.start = now;
    });

    setRunning(true);
    intervalRef.current = setInterval(tick, 100);
  }, [tick, clearTimerInterval]);

  const startStep = useCallback((id: string) => {
    if (!runningRef.current) return;

    // Don't duplicate steps
    if (activeStepsRef.current[id]) return;

    const now = Date.now();

    // Track original start timestamp for accurate reporting
    activeStepsRef.current[id] = {
      start: runningRef.current ? now : null,
      offset: 0,
      startTimestamp: now
    };

    setActiveSteps((prev) => ({ ...prev, [id]: 0 }));
  }, []);

  const endStep = useCallback((id: string) => {
    const entry = activeStepsRef.current[id];
    if (!entry) return;

    const now = Date.now();
    const duration = entry.offset + (entry.start !== null ? now - entry.start : 0);

    const newStep: StepTime = {
      id,
      start: entry.startTimestamp, // Use the original start timestamp
      end: now,
      duration,
    };

    setStepTimes((prev) => [...prev, newStep]);

    // Remove from tracking
    delete activeStepsRef.current[id];

    setActiveSteps((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, []);

  const stop = useCallback(() => {
    pause();

    // End all active steps
    const activeStepIds = Object.keys(activeStepsRef.current);
    activeStepIds.forEach((id) => endStep(id));
  }, [pause, endStep]);

  const reset = useCallback(() => {
    clearTimerInterval();

    runningRef.current = false;
    startRef.current = null;
    totalOffsetRef.current = 0;
    activeStepsRef.current = {};

    setRunning(false);
    setTotalTime(0);
    setActiveSteps({});
    setStepTimes([]);
  }, [clearTimerInterval]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      clearTimerInterval();
    };
  }, [clearTimerInterval]);

  const value: StepsTimerContextValue = {
    totalTime,
    running,
    activeSteps,
    stepTimes,
    start,
    pause,
    resume,
    startStep,
    endStep,
    stop,
    reset,
  };

  return (
    <StepsTimerContext.Provider value={value}>
      {children}
    </StepsTimerContext.Provider>
  );
};

export const useStepsTimerContext = (): StepsTimerContextValue => {
  const context = useContext(StepsTimerContext);
  if (!context) {
    throw new Error(
      "useStepsTimerContext must be used within a StepsTimerProvider"
    );
  }
  return context;
};
