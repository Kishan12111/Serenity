'use client';

import { useState } from 'react';
import { X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuickGuide() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full p-3 hover:shadow-lg hover:scale-110 transition-all z-40"
        title="Help"
      >
        <HelpCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass dark:glass-dark rounded-2xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">How to Use Serinity</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-muted rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm text-foreground/80">
          <div>
            <h3 className="font-semibold text-foreground mb-1">Focus Tab</h3>
            <p>
              Set a custom timer or enable Pomodoro mode for structured sessions. Press spacebar to start/pause.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">Stats Tab</h3>
            <p>
              Track your daily, weekly, and monthly focus time. Maintain your streak for consistent productivity.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">Settings Tab</h3>
            <p>
              Customize wallpapers, animations, and Pomodoro durations to match your preferences.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">Keyboard Shortcut</h3>
            <p>
              Press <kbd className="bg-primary/20 px-2 py-1 rounded text-xs">SPACEBAR</kbd> to quickly start/pause the timer.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">Tips</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Try 25-minute focus sessions with 5-minute breaks</li>
              <li>Take a longer break after 4 consecutive sessions</li>
              <li>Choose a calming wallpaper that matches your mood</li>
              <li>All data is stored locally on your device</li>
            </ul>
          </div>
        </div>

        <Button
          onClick={() => setIsOpen(false)}
          className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full"
        >
          Got it!
        </Button>
      </div>
    </div>
  );
}
