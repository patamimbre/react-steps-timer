export interface StepTime {
  /** Unique identifier provided by the user */
  id: string;
  /** Start timestamp in milliseconds */
  start: number;
  /** End timestamp in milliseconds */
  end: number;
  /** Duration in milliseconds (end - start) */
  duration: number;
}

export interface StepsTimerContextValue {
  /** Total elapsed time in milliseconds */
  totalTime: number;
  /** Whether the timer is currently running */
  running: boolean;
  /** Map of active step IDs to their current elapsed time */
  activeSteps: Record<string, number>;
  /** Array of finished steps with their durations and IDs */
  stepTimes: StepTime[];
  /** Start the timer from zero */
  start: () => void;
  /** Pause the timer (and all active steps) */
  pause: () => void;
  /** Resume the timer (and all active steps) */
  resume: () => void;
  /** Begin timing a new step with the given ID */
  startStep: (id: string) => void;
  /** End timing the step with the given ID */
  endStep: (id: string) => void;
  /** Stop all active steps immediately (records them as finished) */
  stop: () => void;
  /** Reset the timer and clear all step data */
  reset: () => void;
}
