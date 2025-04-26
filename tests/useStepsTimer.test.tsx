import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act, renderHook, cleanup } from '@testing-library/react';
import { StepsTimerProvider, useStepsTimerContext } from '../src/StepsTimerProvider';
import React from 'react';

// Test wrapper component
const TestComponent = () => {
  const timer = useStepsTimerContext();
  return (
    <div>
      <div data-testid="totalTime">{timer.totalTime}</div>
      <div data-testid="running">{timer.running.toString()}</div>
      <div data-testid="activeSteps">{JSON.stringify(timer.activeSteps)}</div>
      <div data-testid="stepTimes">{JSON.stringify(timer.stepTimes)}</div>
      <button data-testid="startBtn" onClick={timer.start}>Start</button>
      <button data-testid="pauseBtn" onClick={timer.pause}>Pause</button>
      <button data-testid="resumeBtn" onClick={timer.resume}>Resume</button>
      <button data-testid="resetBtn" onClick={timer.reset}>Reset</button>
      <button data-testid="startStep1" onClick={() => timer.startStep("step1")}>Start Step 1</button>
      <button data-testid="startStep2" onClick={() => timer.startStep("step2")}>Start Step 2</button>
      <button data-testid="endStep1" onClick={() => timer.endStep("step1")}>End Step 1</button>
      <button data-testid="endStep2" onClick={() => timer.endStep("step2")}>End Step 2</button>
      <button data-testid="stopBtn" onClick={timer.stop}>Stop</button>
    </div>
  );
};

describe('StepsTimerProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 0, 1, 0, 0, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup(); // Clean up the DOM after each test
  });

  describe('Initial state and context', () => {
    it('provides correct initial state', () => {
      render(
        <StepsTimerProvider>
          <TestComponent />
        </StepsTimerProvider>
      );

      expect(screen.getByTestId('totalTime').textContent).toBe('0');
      expect(screen.getByTestId('running').textContent).toBe('false');
      expect(screen.getByTestId('activeSteps').textContent).toBe('{}');
      expect(screen.getByTestId('stepTimes').textContent).toBe('[]');
    });

    it('throws error when hook used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useStepsTimerContext());
      }).toThrow('useStepsTimerContext must be used within a StepsTimerProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Basic timer functions', () => {
    it('starts the timer from zero', () => {
      render(
        <StepsTimerProvider>
          <TestComponent />
        </StepsTimerProvider>
      );

      // Start timer
      act(() => {
        screen.getByTestId('startBtn').click();
      });

      expect(screen.getByTestId('running').textContent).toBe('true');

      // Advance time
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByTestId('totalTime').textContent).toBe('1000');
    });

    it('starts timer resets all previous data', () => {
      // Create a fresh render for this test
      const { unmount } = render(
        <StepsTimerProvider>
          <TestComponent />
        </StepsTimerProvider>
      );

      // Start timer
      act(() => {
        screen.getByTestId('startBtn').click();
        vi.advanceTimersByTime(1000);
      });

      // Verify time has increased
      expect(screen.getByTestId('totalTime').textContent).toBe('1000');

      // Unmount to clean up any lingering state
      unmount();

      // Re-render a fresh component
      render(
        <StepsTimerProvider>
          <TestComponent />
        </StepsTimerProvider>
      );

      // Start again and check it starts from 0
      act(() => {
        screen.getByTestId('startBtn').click();
        vi.advanceTimersByTime(10);
      });

      // Verify reset
      expect(screen.getByTestId('totalTime').textContent).toBe('0');
    });

    it('pauses and resumes the timer correctly', () => {
      render(
        <StepsTimerProvider>
          <TestComponent />
        </StepsTimerProvider>
      );

      // Start timer
      act(() => {
        screen.getByTestId('startBtn').click();
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByTestId('totalTime').textContent).toBe('1000');

      // Pause timer
      act(() => {
        screen.getByTestId('pauseBtn').click();
        vi.advanceTimersByTime(1000);
      });
      // Time should not increase while paused
      expect(screen.getByTestId('totalTime').textContent).toBe('1000');
      expect(screen.getByTestId('running').textContent).toBe('false');

      // Resume timer
      act(() => {
        screen.getByTestId('resumeBtn').click();
        vi.advanceTimersByTime(2000);
      });
      // Time should increase after resume (1000 + 2000)
      expect(screen.getByTestId('totalTime').textContent).toBe('3000');
      expect(screen.getByTestId('running').textContent).toBe('true');
    });

    it('resets the timer to initial state', () => {
      render(
        <StepsTimerProvider>
          <TestComponent />
        </StepsTimerProvider>
      );

      // Start timer and step
      act(() => {
        screen.getByTestId('startBtn').click();
        screen.getByTestId('startStep1').click();
        vi.advanceTimersByTime(1000);
      });

      // Verify there's data
      expect(screen.getByTestId('totalTime').textContent).toBe('1000');
      expect(screen.getByTestId('running').textContent).toBe('true');
      expect(JSON.parse(screen.getByTestId('activeSteps').textContent || '{}')).toHaveProperty('step1');

      // Reset timer
      act(() => {
        screen.getByTestId('resetBtn').click();
      });

      // Verify reset state
      expect(screen.getByTestId('totalTime').textContent).toBe('0');
      expect(screen.getByTestId('running').textContent).toBe('false');
      expect(screen.getByTestId('activeSteps').textContent).toBe('{}');
      expect(screen.getByTestId('stepTimes').textContent).toBe('[]');
    });
  });

  describe('Step tracking', () => {
    it('tracks a single step correctly', () => {
      render(
        <StepsTimerProvider>
          <TestComponent />
        </StepsTimerProvider>
      );

      const startTime = new Date(2023, 0, 1, 0, 0, 0, 0).getTime();

      // Start timer
      act(() => {
        screen.getByTestId('startBtn').click();
        vi.advanceTimersByTime(500);
      });

      // Start step1
      act(() => {
        screen.getByTestId('startStep1').click();
        vi.advanceTimersByTime(1000);
      });

      // Verify step is active
      const activeSteps = JSON.parse(screen.getByTestId('activeSteps').textContent || '{}');
      expect(activeSteps).toHaveProperty('step1');
      expect(activeSteps.step1).toBeGreaterThan(0);

      // End step1
      act(() => {
        screen.getByTestId('endStep1').click();
      });

      // Verify step is removed from active steps
      expect(JSON.parse(screen.getByTestId('activeSteps').textContent || '{}')).toEqual({});

      // Verify completed step is recorded
      const stepTimes = JSON.parse(screen.getByTestId('stepTimes').textContent || '[]');
      expect(stepTimes.length).toBe(1);
      expect(stepTimes[0].id).toBe('step1');
      expect(stepTimes[0].duration).toBeGreaterThanOrEqual(1000);
      expect(stepTimes[0].start).toBeGreaterThanOrEqual(startTime);
      expect(stepTimes[0].end).toBeGreaterThanOrEqual(startTime + 1500);
    });

    it('tracks multiple steps simultaneously', () => {
      render(
        <StepsTimerProvider>
          <TestComponent />
        </StepsTimerProvider>
      );

      // Start timer
      act(() => {
        screen.getByTestId('startBtn').click();
        vi.advanceTimersByTime(100);
      });

      // Start step1
      act(() => {
        screen.getByTestId('startStep1').click();
        vi.advanceTimersByTime(500);
      });

      // Start step2 while step1 is still running
      act(() => {
        screen.getByTestId('startStep2').click();
        vi.advanceTimersByTime(700);
      });

      // Verify both steps are active
      const activeSteps = JSON.parse(screen.getByTestId('activeSteps').textContent || '{}');
      expect(activeSteps).toHaveProperty('step1');
      expect(activeSteps).toHaveProperty('step2');

      // End step1
      act(() => {
        screen.getByTestId('endStep1').click();
        vi.advanceTimersByTime(300);
      });

      // Verify only step2 is active now
      const activeStepsAfter = JSON.parse(screen.getByTestId('activeSteps').textContent || '{}');
      expect(activeStepsAfter).not.toHaveProperty('step1');
      expect(activeStepsAfter).toHaveProperty('step2');

      // End step2
      act(() => {
        screen.getByTestId('endStep2').click();
      });

      // Verify both steps are recorded
      const stepTimes = JSON.parse(screen.getByTestId('stepTimes').textContent || '[]');
      expect(stepTimes.length).toBe(2);
      expect(stepTimes.find(s => s.id === 'step1')).toBeTruthy();
      expect(stepTimes.find(s => s.id === 'step2')).toBeTruthy();

      // step1 ran for 1200ms (500 + 700), step2 ran for 1000ms (700 + 300)
      expect(stepTimes.find(s => s.id === 'step1')?.duration).toBeGreaterThanOrEqual(1200);
      expect(stepTimes.find(s => s.id === 'step2')?.duration).toBeGreaterThanOrEqual(1000);
    });

    it('properly handles step timing across pause/resume', () => {
      render(
        <StepsTimerProvider>
          <TestComponent />
        </StepsTimerProvider>
      );

      // Start timer and step
      act(() => {
        screen.getByTestId('startBtn').click();
        screen.getByTestId('startStep1').click();
        vi.advanceTimersByTime(1000);
      });

      // Pause timer
      act(() => {
        screen.getByTestId('pauseBtn').click();
        vi.advanceTimersByTime(2000); // This time shouldn't count
      });

      // Resume timer
      act(() => {
        screen.getByTestId('resumeBtn').click();
        vi.advanceTimersByTime(1500);
      });

      // End step
      act(() => {
        screen.getByTestId('endStep1').click();
      });

      // Verify step timing is correct (should be ~2500ms, not counting pause time)
      const stepTimes = JSON.parse(screen.getByTestId('stepTimes').textContent || '[]');
      expect(stepTimes[0].duration).toBeGreaterThanOrEqual(2500);
      expect(stepTimes[0].duration).toBeLessThan(3500); // Shouldn't include pause time
    });
  });

  describe('Stop function', () => {
    it('stops all active steps', () => {
      render(
        <StepsTimerProvider>
          <TestComponent />
        </StepsTimerProvider>
      );

      // Start timer and multiple steps
      act(() => {
        screen.getByTestId('startBtn').click();
        vi.advanceTimersByTime(100);
        screen.getByTestId('startStep1').click();
        vi.advanceTimersByTime(200);
        screen.getByTestId('startStep2').click();
        vi.advanceTimersByTime(500);
      });

      // Verify multiple steps are active
      const activeSteps = JSON.parse(screen.getByTestId('activeSteps').textContent || '{}');
      expect(Object.keys(activeSteps).length).toBe(2);

      // Stop all steps
      act(() => {
        screen.getByTestId('stopBtn').click();
      });

      // Verify no active steps remain
      expect(JSON.parse(screen.getByTestId('activeSteps').textContent || '{}')).toEqual({});

      // Verify all steps were recorded
      const stepTimes = JSON.parse(screen.getByTestId('stepTimes').textContent || '[]');
      expect(stepTimes.length).toBe(2);
      expect(stepTimes.find(s => s.id === 'step1')).toBeTruthy();
      expect(stepTimes.find(s => s.id === 'step2')).toBeTruthy();
    });

    it('handles stop when no steps are active', () => {
      render(
        <StepsTimerProvider>
          <TestComponent />
        </StepsTimerProvider>
      );

      // Start timer but no steps
      act(() => {
        screen.getByTestId('startBtn').click();
        vi.advanceTimersByTime(500);
      });

      // Stop (no active steps)
      act(() => {
        screen.getByTestId('stopBtn').click();
      });

      // Verify state (should be paused, no steps recorded)
      expect(screen.getByTestId('running').textContent).toBe('false');
      expect(screen.getByTestId('activeSteps').textContent).toBe('{}');
      expect(screen.getByTestId('stepTimes').textContent).toBe('[]');
    });
  });

  describe('Edge cases', () => {
    it('ignores operations when timer is not running', () => {
      render(
        <StepsTimerProvider>
          <TestComponent />
        </StepsTimerProvider>
      );

      // Try to start a step without starting timer
      act(() => {
        screen.getByTestId('startStep1').click();
        vi.advanceTimersByTime(1000);
      });

      // Nothing should happen
      expect(screen.getByTestId('activeSteps').textContent).toBe('{}');
    });

    it('handles attempts to start the same step twice', () => {
      render(
        <StepsTimerProvider>
          <TestComponent />
        </StepsTimerProvider>
      );

      // Start timer
      act(() => {
        screen.getByTestId('startBtn').click();
        vi.advanceTimersByTime(100);
      });

      // Start step1 twice
      act(() => {
        screen.getByTestId('startStep1').click();
        vi.advanceTimersByTime(100);
        screen.getByTestId('startStep1').click(); // Should be ignored
        vi.advanceTimersByTime(400);
      });

      // Check that it only counts once
      const activeSteps = JSON.parse(screen.getByTestId('activeSteps').textContent || '{}');
      expect(Object.keys(activeSteps).length).toBe(1);

      // End the step
      act(() => {
        screen.getByTestId('endStep1').click();
      });

      // Verify timing (should be ~500ms)
      const stepTimes = JSON.parse(screen.getByTestId('stepTimes').textContent || '[]');
      expect(stepTimes.length).toBe(1);
      expect(stepTimes[0].duration).toBeCloseTo(500, -2); // Allow small margin of error
    });

    it('handles attempting to end a non-existent step', () => {
      render(
        <StepsTimerProvider>
          <TestComponent />
        </StepsTimerProvider>
      );

      // Start timer
      act(() => {
        screen.getByTestId('startBtn').click();
        vi.advanceTimersByTime(100);
      });

      // Try to end a step that was never started
      act(() => {
        screen.getByTestId('endStep1').click();
      });

      // Nothing should happen (no errors)
      expect(screen.getByTestId('activeSteps').textContent).toBe('{}');
      expect(screen.getByTestId('stepTimes').textContent).toBe('[]');
    });

    it('handles pause/resume/reset when timer is not running', () => {
      render(
        <StepsTimerProvider>
          <TestComponent />
        </StepsTimerProvider>
      );

      // Try operations without starting
      act(() => {
        screen.getByTestId('pauseBtn').click();
        screen.getByTestId('resumeBtn').click();
        screen.getByTestId('resetBtn').click();
      });

      // State should remain initial
      expect(screen.getByTestId('totalTime').textContent).toBe('0');
      expect(screen.getByTestId('running').textContent).toBe('false');
    });

    it('properly cleans up on unmount', () => {
      const { unmount } = render(
        <StepsTimerProvider>
          <TestComponent />
        </StepsTimerProvider>
      );

      // Start timer
      act(() => {
        screen.getByTestId('startBtn').click();
      });

      const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

      // Unmount component
      unmount();

      // Should clean up interval
      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });
  });
});
