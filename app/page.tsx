'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { WallpaperBackground, WallpaperScene } from '@/components/wallpaper-background';
import { MonthlyCalendar } from '@/components/monthly-calendar';
import { DayView } from '@/components/day-view';
import { useAudio, playAlarm, AmbientSound, AlarmSound } from '@/lib/useAudio';
import { FocusTimer } from '@/components/focus-timer';
import { StatsDashboard } from '@/components/stats-dashboard';
import { SettingsPanel } from '@/components/settings-panel';
import { SessionNotification } from '@/components/session-notification';
import { StreakIndicator } from '@/components/streak-indicator';
import { FocusForum, FloatingChatBubble, MiniChatPanel, FloatingMessages } from '@/components/focus-forum';
import { AdminPanel, AdminButton } from '@/components/admin-panel';
import { recordSession, getTodayStats } from '@/components/stats-tracker';
import { useAuth } from '@/lib/useAuth';
import { Button } from '@/components/ui/button';
import { Clock, BarChart3, Settings, Image, X, User, LogOut, LogIn, WifiOff, MessageCircle, Shield, CalendarDays } from 'lucide-react';
import { useConvexStats } from '@/lib/useConvexStats';

type Page = 'focus' | 'stats' | 'settings' | 'forum' | 'calendar' | 'day-view';

const QUOTES = [
  'Every moment of focus brings you closer to your goals.',
  'Peace comes when you silence the noise.',
  'Small sessions, big achievements.',
  'You are capable of great things.',
  'Focus today, win tomorrow.',
  'Consistency is the key to success.',
  'Your potential is limitless.',
  'One session at a time.',
  'Deep work creates deep value.',
  'Progress, not perfection.',
];

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, signOut, isLoading: authLoading } = useAuth();
  const { isOnline, addElapsedSeconds: convexAddElapsedSeconds, recordSession: convexRecordSession } = useConvexStats();
  
  const [currentPage, setCurrentPage] = useState<Page>('focus');
  const [wallpaper, setWallpaper] = useState<WallpaperScene>('night-sky');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [isPomodoro, setIsPomodoro] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showWallpaperMenu, setShowWallpaperMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('25');
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [currentQuote, setCurrentQuote] = useState('');
  const [superFocusMode, setSuperFocusMode] = useState(false);
  const [showMiniChat, setShowMiniChat] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [lastSeenMessageTime, setLastSeenMessageTime] = useState<number>(Date.now());
  const [pomodoroSettings, setPomodoroSettings] = useState({
    focusTime: 25,
    shortBreak: 5,
    longBreak: 15,
  });
  const [notification, setNotification] = useState<{
    type: 'focus' | 'break';
    duration: number;
    id: number;
  }>({ type: 'focus', duration: 0, id: 0 });
  
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split('T')[0]);

  // Query for unread message count
  const messageCount = useQuery(api.forum.getMessageCount, { since: lastSeenMessageTime });
  const unreadCount = messageCount || 0;

  const audio = useAudio();
  const [alarmSound, setAlarmSound] = useState<AlarmSound>('bell');

  // Load settings and today's stats on mount
  useEffect(() => {
    const saved = localStorage.getItem('serenity_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      setWallpaper(settings.wallpaper || 'night-sky');
      setAnimationsEnabled(settings.animationsEnabled !== false);
      setSuperFocusMode(settings.superFocusMode || false);
      setPomodoroSettings({
        focusTime: settings.focusTime || 25,
        shortBreak: settings.shortBreak || 5,
        longBreak: settings.longBreak || 15,
      });
      setCustomMinutes(settings.customMinutes || '25');
      if (settings.ambientSound) {
        audio.setAmbient(settings.ambientSound);
      }
      if (settings.alarmSound) {
        setAlarmSound(settings.alarmSound);
      }
    }

    // Set random quote
    setCurrentQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

    // Get today's focus time
    const todayStats = getTodayStats();
    setTodayMinutes(todayStats.totalMinutes);
  }, []);

  // Update today's minutes periodically when running
  useEffect(() => {
    if (!isRunning) {
      audio.pauseAmbient();
      return;
    }
    
    // Start ambient if not playing and not silence
    if (!audio.isPlaying && audio.currentAmbient !== 'silence') {
      audio.startAmbient();
    }

    const interval = setInterval(() => {
      const todayStats = getTodayStats();
      setTodayMinutes(todayStats.totalMinutes);
    }, 1000); // Update every second for accurate display
    return () => clearInterval(interval);
  }, [isRunning, audio]);

  const handleSessionComplete = (duration: number) => {
    // duration is already in minutes (passed from FocusTimer)
    if (duration > 0) {
      // Local storage
      recordSession(duration);
      // Convex (with offline support)
      convexRecordSession(duration, 'focus');
      
      const todayStats = getTodayStats();
      setTodayMinutes(todayStats.totalMinutes);
    }
  };

  // Handler for elapsed seconds - sync to Convex
  const handleElapsedSeconds = (mode: string, seconds: number) => {
    convexAddElapsedSeconds(mode, seconds);
  };

  const handleNotification = (type: 'focus' | 'break', duration: number) => {
    playAlarm(alarmSound);
    setNotification(prev => ({ type, duration, id: prev.id + 1 }));
  };

  const handleWallpaperChange = (scene: WallpaperScene) => {
    setWallpaper(scene);
    setShowWallpaperMenu(false);
  };

  const handleAnimationToggle = (enabled: boolean) => {
    setAnimationsEnabled(enabled);
  };

  const handleSoundChange = (sound: AmbientSound) => {
    audio.setAmbient(sound);
  };

  const handlePomodoroSettingsChange = (settings: {
    focusTime: number;
    shortBreak: number;
    longBreak: number;
  }) => {
    setPomodoroSettings(settings);
  };

  const handleCustomMinutesChange = (mins: string) => {
    setCustomMinutes(mins);
    localStorage.setItem('serenity_settings', JSON.stringify({
      ...JSON.parse(localStorage.getItem('serenity_settings') || '{}'),
      customMinutes: mins,
    }));
  };

  const wallpaperOptions: { value: WallpaperScene; label: string }[] = [
    { value: 'night-sky', label: '🌌 Night Sky' },
    { value: 'balcony-sunset', label: '🌇 Balcony Sunset' },
    { value: 'moon-man', label: '🌙 Moon Silhouette' },
    { value: 'city-illustration', label: '🌃 Anime City' },
  ];

  const formatTodayTime = (mins: number) => {
    const roundedMins = Math.round(mins);
    if (roundedMins < 60) return `${roundedMins}m`;
    const hours = Math.floor(roundedMins / 60);
    const remaining = roundedMins % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Wallpaper background */}
      <WallpaperBackground scene={wallpaper} />

      {/* Session notification */}
      <SessionNotification
        notificationId={notification.id}
        sessionType={notification.type}
        duration={notification.duration}
      />

      {/* Content overlay */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Navigation - hidden when timer is running */}
        {!isRunning && (
          <nav className="backdrop-blur-md bg-black/60 border-b border-white/10 shrink-0 relative z-50">
            <div className="w-full px-4 md:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Serinity Logo */}
                <div className="w-8 h-8 relative">
                  <svg viewBox="0 0 32 32" className="w-full h-full">
                    <defs>
                      <linearGradient id="navAccent" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7"/>
                        <stop offset="100%" stopColor="#ec4899"/>
                      </linearGradient>
                      <linearGradient id="navGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#c084fc"/>
                        <stop offset="100%" stopColor="#f472b6"/>
                      </linearGradient>
                    </defs>
                    <rect width="32" height="32" rx="8" fill="#0f0f1a"/>
                    <circle cx="16" cy="16" r="12" fill="none" stroke="url(#navAccent)" strokeWidth="1.5" opacity="0.3"/>
                    <circle cx="16" cy="16" r="9" fill="none" stroke="url(#navGlow)" strokeWidth="2.5" opacity="0.2"/>
                    <circle cx="16" cy="16" r="9" fill="none" stroke="url(#navAccent)" strokeWidth="2.5" 
                            strokeDasharray="42 57" strokeLinecap="round" transform="rotate(-90 16 16)"/>
                    <circle cx="16" cy="16" r="5" fill="#0f0f1a" stroke="url(#navAccent)" strokeWidth="0.5" opacity="0.8"/>
                    <text x="16" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="url(#navGlow)">S</text>
                    <circle cx="26" cy="5" r="1.5" fill="#fbbf24"/>
                    <circle cx="5" cy="7" r="1" fill="#fbbf24" opacity="0.8"/>
                  </svg>
                </div>
                <div>
                  <span className="text-white/95 font-bold text-base">Serinity</span>
                  <p className="text-white/50 text-xs">Focus Companion</p>
                </div>
                {/* Offline indicator */}
                {!isOnline && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full">
                    <WifiOff className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-amber-400 text-xs font-medium">Offline</span>
                  </div>
                )}
                {/* Login reminder for non-authenticated users */}
                {!isAuthenticated && isOnline && (
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full">
                    <span className="text-white/40 text-xs">Data not synced •</span>
                    <button 
                      onClick={() => router.push('/auth')}
                      className="text-white/60 text-xs hover:text-white/80 underline underline-offset-2"
                    >
                      Sign in
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage('focus')}
                  variant="ghost"
                  size="sm"
                  className={`rounded-full text-sm px-4 py-2 ${
                    currentPage === 'focus'
                      ? 'bg-white/15 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Focus
                </Button>

                <Button
                  onClick={() => {
                    setCurrentPage('forum');
                    setLastSeenMessageTime(Date.now());
                  }}
                  variant="ghost"
                  size="sm"
                  className={`rounded-full text-sm px-4 py-2 relative ${
                    currentPage === 'forum'
                      ? 'bg-white/15 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Forum
                  {unreadCount > 0 && currentPage !== 'forum' && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>

                <Button
                  onClick={() => setCurrentPage('calendar')}
                  variant="ghost"
                  size="sm"
                  className={`rounded-full text-sm px-4 py-2 ${
                    currentPage === 'calendar' || currentPage === 'day-view'
                      ? 'bg-white/15 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Calendar
                </Button>

                <Button
                  onClick={() => setCurrentPage('stats')}
                  variant="ghost"
                  size="sm"
                  className={`rounded-full text-sm px-4 py-2 ${
                    currentPage === 'stats'
                      ? 'bg-white/15 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Stats
                </Button>

                <Button
                  onClick={() => setCurrentPage('settings')}
                  variant="ghost"
                  size="sm"
                  className={`rounded-full text-sm px-4 py-2 ${
                    currentPage === 'settings'
                      ? 'bg-white/15 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>

                <Button
                  onClick={() => setShowWallpaperMenu(!showWallpaperMenu)}
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-sm px-4 py-2 text-white/60 hover:text-white hover:bg-white/10"
                >
                  <Image className="h-4 w-4" />
                </Button>

                {/* User Menu */}
                <div className="relative">
                  <Button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-sm px-4 py-2 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <User className="h-4 w-4" />
                  </Button>

                  {showUserMenu && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-2xl z-[100]">
                      {isAuthenticated ? (
                        <>
                          <div className="mb-3 pb-3 border-b border-white/10">
                            <p className="text-white font-medium truncate">{user?.name || 'User'}</p>
                            <p className="text-white/50 text-xs truncate">{user?.email}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/60">Current Streak</span>
                              <span className="text-white font-medium">{user?.streak?.currentStreak || 0} days</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/60">Best Streak</span>
                              <span className="text-white font-medium">{user?.streak?.bestStreak || 0} days</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/60">Total Sessions</span>
                              <span className="text-white font-medium">{user?.lifetimeTotals?.totalSessions || 0}</span>
                            </div>
                          </div>
                          
                          {/* Admin Panel Button */}
                          {user?.role === 'admin' && (
                            <Button
                              onClick={() => {
                                setShowUserMenu(false);
                                setShowAdminPanel(true);
                              }}
                              variant="ghost"
                              size="sm"
                              className="w-full mt-3 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 border border-purple-500/20"
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Admin Dashboard
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => {
                              setShowUserMenu(false);
                              signOut();
                            }}
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-white/70 text-sm mb-3">
                            Sign in to save your progress and sync across devices
                          </p>
                          <Button
                            onClick={() => {
                              setShowUserMenu(false);
                              router.push('/auth');
                            }}
                            className="w-full bg-white/15 hover:bg-white/25 text-white border border-white/20"
                          >
                            <LogIn className="h-4 w-4 mr-2" />
                            Sign In / Sign Up
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </nav>
        )}

        {/* Wallpaper menu popup */}
        {showWallpaperMenu && !isRunning && (
          <div className="absolute top-20 right-6 z-50 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/80 text-sm font-medium">Wallpaper</span>
              <button
                onClick={() => setShowWallpaperMenu(false)}
                className="text-white/50 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {wallpaperOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleWallpaperChange(opt.value)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    wallpaper === opt.value
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center overflow-hidden p-4">
          {currentPage === 'focus' && (
            <div className="w-full h-full absolute inset-0 z-0 bg-black">
              <DayView 
                dateStr={new Date().toISOString().split('T')[0]} 
                sessions={(user?.recentSessions || []).filter(s => {
                  const d = new Date(s.startedAt);
                  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` === new Date().toISOString().split('T')[0];
                }).map((s, i) => {
                  const start = new Date(s.startedAt);
                  const end = new Date(s.endedAt);
                  return {
                    startHour: start.getHours(),
                    startMinute: start.getMinutes(),
                    endHour: end.getHours(),
                    endMinute: end.getMinutes(),
                    label: s.label,
                    labelCategory: s.labelCategory,
                    durationMinutes: s.durationMinutes,
                    mode: s.mode,
                    sessionIndex: i
                  };
                })}
              >
                <FocusTimer
                  onSessionComplete={handleSessionComplete}
                  onNotification={handleNotification}
                  onElapsedSeconds={handleElapsedSeconds}
                  isPomodoro={isPomodoro}
                  customMinutes={customMinutes}
                  pomodoroSettings={pomodoroSettings}
                  onRunningChange={setIsRunning}
                />
              </DayView>

              {/* Overlays on top of DayView */}
              <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-between px-12">
              {/* Left side: Timer settings (when not running) */}
              {!isRunning && (
                <div className="lg:w-64 w-full max-w-sm order-2 lg:order-1 shrink-0 pointer-events-auto">
                  {/* Streak indicator */}
                  <div className="flex justify-center mb-4">
                    <StreakIndicator variant="compact" />
                  </div>

                  {/* Mode toggle */}
                  <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-4">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setIsPomodoro(false)}
                        className={`w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                          !isPomodoro
                            ? 'bg-white/20 text-white border border-white/30'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        Custom Timer
                      </button>
                      <button
                        onClick={() => setIsPomodoro(true)}
                        className={`w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                          isPomodoro
                            ? 'bg-white/20 text-white border border-white/30'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        Pomodoro
                      </button>
                    </div>

                    {/* Quick time presets */}
                    {!isPomodoro && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-white/60 text-xs font-medium mb-2 text-center">Quick Select</label>
                          <div className="grid grid-cols-5 gap-1">
                            {[5, 15, 25, 45, 60].map((mins) => (
                              <button
                                key={mins}
                                onClick={() => handleCustomMinutesChange(mins.toString())}
                                className={`py-2 rounded-lg font-medium text-xs transition-all ${
                                  customMinutes === mins.toString()
                                    ? 'bg-white/20 text-white border border-white/30'
                                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                                }`}
                              >
                                {mins}m
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-white/60 text-xs font-medium mb-2 text-center">Custom Minutes</label>
                          <input
                            type="number"
                            min="1"
                            max="180"
                            value={customMinutes}
                            onChange={(e) => handleCustomMinutesChange(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-center text-sm font-medium focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                            placeholder="Enter minutes"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}



              {/* Right side: Today stats & quote (when not running) */}
              {!isRunning && (
                <div className="lg:w-64 w-full max-w-sm order-3 shrink-0 pointer-events-auto">
                  <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-white/60" />
                      <span className="text-white/70 text-sm">Today's Focus</span>
                    </div>
                    <p className="text-white font-bold text-2xl">{formatTodayTime(todayMinutes)}</p>
                    {currentQuote && (
                      <p className="text-white/50 text-xs italic leading-relaxed border-t border-white/10 pt-3 mt-2">
                        "{currentQuote}"
                      </p>
                    )}
                  </div>
                </div>
              )}
              </div>
            </div>
          )}

          {currentPage === 'forum' && (
            <div className="w-full h-full">
              <FocusForum onClose={() => setCurrentPage('focus')} />
            </div>
          )}

          {currentPage === 'stats' && (
            <div className="w-full max-w-4xl px-6 h-full overflow-auto py-6">
              <StatsDashboard />
            </div>
          )}

          {currentPage === 'settings' && (
            <div className="w-full max-w-3xl px-6 h-full overflow-auto py-6">
              <SettingsPanel
                onWallpaperChange={handleWallpaperChange}
                onAnimationToggle={handleAnimationToggle}
                onSoundChange={handleSoundChange}
                onAlarmSoundChange={setAlarmSound}
                onPomodoroSettingsChange={handlePomodoroSettingsChange}
                superFocusMode={superFocusMode}
                onSuperFocusModeChange={setSuperFocusMode}
              />
            </div>
          )}

          {currentPage === 'calendar' && (
            <div className="w-full h-full overflow-auto py-6 flex items-center justify-center">
              <MonthlyCalendar onDayClick={(date) => { setSelectedDateStr(date); setCurrentPage('day-view'); }} />
            </div>
          )}

          {currentPage === 'day-view' && (
            <div className="w-full h-full absolute inset-0 z-[100] bg-black">
              <DayView 
                dateStr={selectedDateStr} 
                sessions={(user?.recentSessions || []).filter(s => {
                  const d = new Date(s.startedAt);
                  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` === selectedDateStr;
                }).map((s, i) => {
                  const start = new Date(s.startedAt);
                  const end = new Date(s.endedAt);
                  return {
                    startHour: start.getHours(),
                    startMinute: start.getMinutes(),
                    endHour: end.getHours(),
                    endMinute: end.getMinutes(),
                    label: s.label,
                    labelCategory: s.labelCategory,
                    durationMinutes: s.durationMinutes,
                    mode: s.mode,
                    sessionIndex: i
                  };
                })} 
                onBack={() => setCurrentPage('calendar')} 
              />
            </div>
          )}
        </main>

        {/* Floating chat bubble - visible when timer is running and not in super focus mode */}
        {isRunning && currentPage === 'focus' && !superFocusMode && (
          <>
            <FloatingChatBubble
              onClick={() => setShowMiniChat(!showMiniChat)}
              unreadCount={unreadCount}
              disabled={superFocusMode}
            />
            <FloatingMessages disabled={superFocusMode || showMiniChat} />
            <MiniChatPanel
              isOpen={showMiniChat}
              onClose={() => setShowMiniChat(false)}
              onExpand={() => {
                setShowMiniChat(false);
                setCurrentPage('forum');
                setLastSeenMessageTime(Date.now());
              }}
            />
          </>
        )}

        {/* Bottom bar - visible info when running */}
        {isRunning && currentPage === 'focus' && (
          <div className="fixed bottom-4 left-4 right-4 z-20">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              {/* Left: Today's focus + Quote */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                  <Clock className="h-3.5 w-3.5 text-white/60" />
                  <span className="text-white/70 text-xs">Today:</span>
                  <span className="text-white font-semibold text-sm">{formatTodayTime(todayMinutes)}</span>
                </div>
                {currentQuote && (
                  <p className="text-white/40 text-xs italic max-w-xs truncate hidden sm:block">"{currentQuote}"</p>
                )}
              </div>

              {/* Right: Streak */}
              <StreakIndicator variant="compact" />
            </div>
          </div>
        )}

        {/* Footer hint - hidden when running */}
        {!isRunning && currentPage === 'focus' && (
          <footer className="text-center py-2 text-white/40 text-xs shrink-0">
            Press SPACE to start/pause
          </footer>
        )}
      </div>

      {/* Admin Panel Modal */}
      {showAdminPanel && user?.email && (
        <AdminPanel
          adminEmail={user.email}
          onClose={() => setShowAdminPanel(false)}
        />
      )}
    </div>
  );
}
