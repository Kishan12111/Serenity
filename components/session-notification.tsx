'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Target } from 'lucide-react';

interface SessionNotificationProps {
  isVisible: boolean;
  sessionType: 'focus' | 'break';
  duration: number;
}

export function SessionNotification({
  isVisible,
  sessionType,
  duration,
}: SessionNotificationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-slideIn">
      <div className="glass dark:glass-dark p-4 rounded-2xl flex items-center gap-3">
        {sessionType === 'focus' ? (
          <>
            <Target className="h-8 w-8 text-purple-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Great focus session!</p>
              <p className="text-sm text-foreground/70">
                You focused for {duration} minutes. Keep it up!
              </p>
            </div>
          </>
        ) : (
          <>
            <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Break time!</p>
              <p className="text-sm text-foreground/70">
                Take a {duration}-minute break. You deserve it!
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
