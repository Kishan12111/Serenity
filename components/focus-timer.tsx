'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addElapsedSeconds as localAddElapsedSeconds } from '@/components/stats-tracker';

interface FocusTimerProps {
  onSessionComplete?: (duration: number) => void;
  onNotification?: (type: 'focus' | 'break', duration: number) => void;
  onRunningChange?: (running: boolean) => void;
  onElapsedSeconds?: (mode: string, seconds: number) => void;
  isPomodoro?: boolean;
  customMinutes?: string;
  pomodoroSettings?: {
    focusTime: number;
    shortBreak: number;
    longBreak: number;
  };
}

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

const TIMER_STATE_KEY = 'serenity_timer_state';

type TimerSnapshot = {
  timeLeft: number;
  isRunning: boolean;
  mode: TimerMode;
  sessionsCompleted: number;
  customMinutes: string;
  isCustomMode?: boolean;
  isPomodoro: boolean;
  pomodoroSettings: {
    focusTime: number;
    shortBreak: number;
    longBreak: number;
  };
  lastSaved: number;
};

export function FocusTimer({
  onSessionComplete,
  onNotification,
  onRunningChange,
  onElapsedSeconds,
  isPomodoro = false,
  customMinutes: customMinutesProp = '25',
  pomodoroSettings: pomodoroSettingsProp = {
    focusTime: 25,
    shortBreak: 5,
    longBreak: 15,
  },
}: FocusTimerProps) {
  const [timeLeft, setTimeLeft] = useState(parseInt(customMinutesProp) * 60 || 25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [pomodoroConfig, setPomodoroConfig] = useState(pomodoroSettingsProp);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPersistRef = useRef<number>(Date.now());
  const modeRef = useRef<TimerMode>(mode);
  const prevCustomMinutesRef = useRef(customMinutesProp);
  
  // Store the target end time instead of counting down
  const endTimeRef = useRef<number>(0);
  const lastRecordedSecondRef = useRef<number>(0);

  useEffect(() => {
    setPomodoroConfig(pomodoroSettingsProp);
  }, [pomodoroSettingsProp]);

  // Keep modeRef in sync
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Sync customMinutes prop with timer when it changes (and not running)
  useEffect(() => {
    if (!isRunning && customMinutesProp !== prevCustomMinutesRef.current) {
      const newTime = parseInt(customMinutesProp) * 60 || 25 * 60;
      setTimeLeft(newTime);
      prevCustomMinutesRef.current = customMinutesProp;
    }
  }, [customMinutesProp, isRunning]);

  const modeConfig = {
    focus: { label: 'Focus Time', color: 'from-slate-200 to-slate-400', bg: 'bg-slate-800/40' },
    shortBreak: { label: 'Short Break', color: 'from-teal-300 to-teal-500', bg: 'bg-teal-900/40' },
    longBreak: { label: 'Long Break', color: 'from-amber-200 to-amber-400', bg: 'bg-amber-900/40' },
  };

  const getDuration = () => {
    if (!isPomodoro) {
      return parseInt(customMinutesProp) * 60 || 25 * 60;
    }
    return mode === 'focus'
      ? pomodoroConfig.focusTime * 60
      : mode === 'shortBreak'
        ? pomodoroConfig.shortBreak * 60
        : pomodoroConfig.longBreak * 60;
  };

  // Handle spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;
        e.preventDefault();
        setIsRunning((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Hydrate timer state from localStorage so sessions resume after reloads
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(TIMER_STATE_KEY);
    if (!raw) return;

    let snapshot: TimerSnapshot;
    try {
      snapshot = JSON.parse(raw) as TimerSnapshot;
    } catch {
      localStorage.removeItem(TIMER_STATE_KEY);
      return;
    }
    const savedDuration = snapshot.isCustomMode && snapshot.isPomodoro === false
      ? (parseInt(snapshot.customMinutes || '25') || 25) * 60
      : snapshot.mode === 'focus'
        ? snapshot.pomodoroSettings.focusTime * 60
        : snapshot.mode === 'shortBreak'
          ? snapshot.pomodoroSettings.shortBreak * 60
          : snapshot.pomodoroSettings.longBreak * 60;

    const elapsed = snapshot.isRunning
      ? Math.max(0, Math.floor((Date.now() - (snapshot.lastSaved || Date.now())) / 1000))
      : 0;

    const adjustedTimeLeft = Math.max(snapshot.timeLeft - elapsed, 0);

    setMode(snapshot.mode || 'focus');
    setSessionsCompleted(snapshot.sessionsCompleted || 0);

    setPomodoroConfig(snapshot.pomodoroSettings || pomodoroConfig);

    if (adjustedTimeLeft === 0 && snapshot.isRunning) {
      handleTimerComplete(Math.ceil(savedDuration / 60));
      setTimeLeft(savedDuration);
      setIsRunning(false);
    } else {
      setTimeLeft(adjustedTimeLeft || savedDuration);
      setIsRunning(snapshot.isRunning && adjustedTimeLeft > 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistState = (nextState?: Partial<TimerSnapshot>, force = false) => {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    if (!force && now - lastPersistRef.current < 5000) return;
    const payload: TimerSnapshot = {
      timeLeft,
      isRunning,
      mode,
      sessionsCompleted,
      customMinutes: customMinutesProp,
      isPomodoro,
      pomodoroSettings: pomodoroConfig,
      lastSaved: now,
      ...nextState,
    };
    localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(payload));
    lastPersistRef.current = now;
  };

  useEffect(() => {
    if (onRunningChange) onRunningChange(isRunning);
  }, [isRunning, onRunningChange]);

  // Main timer effect - uses end time approach for accuracy
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set the target end time
    endTimeRef.current = Date.now() + (timeLeft * 1000);
    lastRecordedSecondRef.current = timeLeft;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      
      // Calculate how many seconds passed since last recording
      const secondsElapsed = lastRecordedSecondRef.current - remaining;
      
      // Record elapsed time for ALL modes (focus and breaks)
      if (secondsElapsed > 0) {
        // Update local storage
        localAddElapsedSeconds(modeRef.current, secondsElapsed);
        // Call Convex sync callback if provided
        if (onElapsedSeconds) {
          onElapsedSeconds(modeRef.current === 'focus' ? 'focus' : 'break', secondsElapsed);
        }
        lastRecordedSecondRef.current = remaining;
      }
      
      if (remaining <= 0) {
        setIsRunning(false);
        handleTimerComplete(Math.ceil(getDuration() / 60));
        setTimeLeft(getDuration());
        return;
      }
      
      setTimeLeft(remaining);
      persistState({ timeLeft: remaining });
    };

    // Run immediately
    tick();
    
    // Then run every 100ms for smooth updates even when tab is backgrounded
    intervalRef.current = setInterval(tick, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setIsRunning(true);
      setCountdown(null);
      return;
    }
    const timer = setInterval(() => setCountdown(prev => prev! - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleTimerComplete = (durationMinutes?: number) => {
    const sessionMinutes = durationMinutes || parseInt(customMinutesProp || '25');

    if (onSessionComplete && mode === 'focus') {
      onSessionComplete(sessionMinutes);
    }

    if (onNotification) {
      onNotification(mode === 'focus' ? 'focus' : 'break', sessionMinutes);
    }

    if (isPomodoro) {
      if (mode === 'focus') {
        const nextSessionCount = sessionsCompleted + 1;
        setSessionsCompleted(nextSessionCount);
        const nextMode = nextSessionCount % 4 === 0 ? 'longBreak' : 'shortBreak';
        setMode(nextMode);
      } else {
        setMode('focus');
      }
      setCountdown(3);
    }
    persistState({ isRunning: false, timeLeft: getDuration() }, true);
  };

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
    persistState({ isRunning: !isRunning }, true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getDuration());
    persistState({ isRunning: false, timeLeft: getDuration() }, true);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine text size based on time format (hours vs minutes)
  const getTimerTextSize = () => {
    const hours = Math.floor(timeLeft / 3600);
    if (hours > 0) {
      return 'text-3xl sm:text-5xl'; // Smaller for h:mm:ss format
    }
    return 'text-5xl sm:text-7xl'; // Larger for mm:ss format
  };

  const progress = ((getDuration() - timeLeft) / getDuration()) * 100;
  const currentConfig = modeConfig[mode];

  return (
    <div className="w-full max-w-md mx-auto px-2 py-2">
      {/* Mode Indicator */}
      <div className="text-center mb-3">
        <div className={`inline-block px-4 py-1.5 rounded-full ${currentConfig.bg} border border-white/15 backdrop-blur-sm`}>
          <span className={`text-xs font-semibold bg-gradient-to-r ${currentConfig.color} bg-clip-text text-transparent`}>
            {currentConfig.label}
          </span>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="relative w-56 h-56 sm:w-72 sm:h-72 mx-auto mb-4">
        {/* Outer glow circle */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${currentConfig.color} opacity-15 blur-xl`} />

        {/* Progress ring container */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={`url(#gradient-${mode})`}
            strokeWidth="8"
            strokeDasharray={`${(progress / 100) * 565} 565`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id={`gradient-${mode}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={mode === 'focus' ? '#a855f7' : mode === 'shortBreak' ? '#0ea5e9' : '#10b981'} />
              <stop offset="100%" stopColor={mode === 'focus' ? '#ec4899' : mode === 'shortBreak' ? '#06b6d4' : '#14b8a6'} />
            </linearGradient>
          </defs>
        </svg>

        {/* Timer Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {countdown !== null ? (
            <div className="text-center">
              <div className="text-sm font-medium text-white/70 mb-2">Starting in</div>
              <div className="text-6xl font-bold text-white drop-shadow-lg">{countdown}</div>
            </div>
          ) : (
            <div className="text-center">
              <div className={`${getTimerTextSize()} font-bold bg-gradient-to-br ${currentConfig.color} bg-clip-text text-transparent font-mono tracking-tight drop-shadow-lg ${isRunning ? 'breathe' : ''}`}>
                {formatTime(timeLeft)}
              </div>
              {isPomodoro && <p className="text-white/50 text-xs mt-1">Session {sessionsCompleted + 1}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons - Always visible */}
      <div className="flex gap-3 justify-center">
        {countdown !== null ? (
          <button
            onClick={() => setCountdown(0)}
            className="px-6 py-2.5 rounded-full font-semibold text-sm transition-all border bg-white/15 hover:bg-white/25 border-white/20 text-white"
          >
            Skip Countdown
          </button>
        ) : (
          <button
            onClick={handleToggleTimer}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-all border ${
              isRunning
                ? 'bg-red-500/20 hover:bg-red-500/30 border-red-400/40 text-white'
                : 'bg-white/15 hover:bg-white/25 border-white/20 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause size={16} />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Start</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-full font-semibold text-sm transition-all"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
