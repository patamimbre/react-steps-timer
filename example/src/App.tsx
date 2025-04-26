import React from "react";
import { StepsTimerProvider, useStepsTimer } from "../../src";

const StepsDemo: React.FC = () => {
  const {
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
  } = useStepsTimer();
  return (
    <div>
      <h2>Steps Timer Demo</h2>
      <div>
        Total: {totalTime} ms - {running ? "Running" : "Paused"}
      </div>
      <button onClick={start}>Start</button>
      <button onClick={pause}>Pause</button>
      <button onClick={resume}>Resume</button>
      <button onClick={() => startStep("A")}>Start Step A</button>
      <button onClick={() => endStep("A")}>End Step A</button>
      <button onClick={() => startStep("B")}>Start Step B</button>
      <button onClick={() => endStep("B")}>End Step B</button>
      <button onClick={stop}>Stop All Steps</button>
      <button onClick={reset}>Reset</button>
      <div>
        <h3>Active Steps</h3>
        <pre>{JSON.stringify(activeSteps, null, 2)}</pre>
      </div>
      <div>
        <h3>Completed Steps</h3>
        <pre>{JSON.stringify(stepTimes, null, 2)}</pre>
      </div>
    </div>
  );
};

export const App: React.FC = () => (
  <StepsTimerProvider>
    <StepsDemo />
  </StepsTimerProvider>
);
