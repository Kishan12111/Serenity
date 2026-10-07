'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { WallpaperScene } from '@/components/wallpaper-background';
import { Shield, MessageCircle } from 'lucide-react';

import { AmbientSound } from '@/lib/useAudio';

interface SettingsPanelProps {
  onWallpaperChange: (scene: WallpaperScene) => void;
  onAnimationToggle: (enabled: boolean) => void;
  onSoundChange: (sound: AmbientSound) => void;
  onAlarmSoundChange?: (sound: 'bell' | 'chime' | 'digital' | 'bowl' | 'none') => void;
  onPomodoroSettingsChange: (settings: {
    focusTime: number;
    shortBreak: number;
    longBreak: number;
  }) => void;
  superFocusMode?: boolean;
  onSuperFocusModeChange?: (enabled: boolean) => void;
}

const WALLPAPER_SCENES: { value: WallpaperScene; label: string }[] = [
  { value: 'night-sky', label: '🌌 Night Sky' },
  { value: 'balcony-sunset', label: '🌇 Balcony Sunset' },
  { value: 'moon-man', label: '🌙 Moon Silhouette' },
  { value: 'city-illustration', label: '🌃 Anime City' },
];

export function SettingsPanel({
  onWallpaperChange,
  onAnimationToggle,
  onSoundChange,
  onAlarmSoundChange,
  onPomodoroSettingsChange,
  superFocusMode = false,
  onSuperFocusModeChange,
}: SettingsPanelProps) {
  const [wallpaper, setWallpaper] = useState<WallpaperScene>('night-sky');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [ambientSound, setAmbientSound] = useState<AmbientSound>('silence');
  const [alarmSound, setAlarmSound] = useState<'bell' | 'chime' | 'digital' | 'bowl' | 'none'>('bell');
  const [focusTime, setFocusTime] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [localSuperFocusMode, setLocalSuperFocusMode] = useState(superFocusMode);

  useEffect(() => {
    setLocalSuperFocusMode(superFocusMode);
  }, [superFocusMode]);

  useEffect(() => {
    const saved = localStorage.getItem('serenity_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      setWallpaper(settings.wallpaper || 'night-sky');
      setAnimationsEnabled(settings.animationsEnabled !== false);
      setAmbientSound(settings.ambientSound || 'silence');
      setAlarmSound(settings.alarmSound || 'bell');
      setFocusTime(settings.focusTime || 25);
      setShortBreak(settings.shortBreak || 5);
      setLongBreak(settings.longBreak || 15);
    }
  }, []);

  const saveSettings = (overrides: Record<string, unknown> = {}) => {
    const existing = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('serenity_settings') || '{}') : {};
    const settings = { ...existing, wallpaper, animationsEnabled, ambientSound, focusTime, shortBreak, longBreak, ...overrides };
    localStorage.setItem('serenity_settings', JSON.stringify(settings));
  };

  const handleWallpaperChange = (value: WallpaperScene) => {
    setWallpaper(value);
    onWallpaperChange(value);
    saveSettings({ wallpaper: value });
  };

  const handleAnimationToggle = (checked: boolean) => {
    setAnimationsEnabled(checked);
    onAnimationToggle(checked);
    saveSettings({ animationsEnabled: checked });
  };

  const handleSoundChange = (sound: AmbientSound) => {
    setAmbientSound(sound);
    onSoundChange(sound);
    saveSettings({ ambientSound: sound });
  };

  const handleAlarmSoundChange = (sound: 'bell' | 'chime' | 'digital' | 'bowl' | 'none') => {
    setAlarmSound(sound);
    onAlarmSoundChange?.(sound);
    saveSettings({ alarmSound: sound });
  };

  const updatePomodoroSetting = (key: string, value: number) => {
    if (key === 'focusTime') setFocusTime(value);
    if (key === 'shortBreak') setShortBreak(value);
    if (key === 'longBreak') setLongBreak(value);
    const settings = {
      focusTime: key === 'focusTime' ? value : focusTime,
      shortBreak: key === 'shortBreak' ? value : shortBreak,
      longBreak: key === 'longBreak' ? value : longBreak,
    };
    onPomodoroSettingsChange(settings);
    saveSettings(settings);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="space-y-6">
        {/* Background Scene Selection */}
        <div className="glass-dark p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
            ✨ Background Scene
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {WALLPAPER_SCENES.map((scene) => (
              <button
                key={scene.value}
                onClick={() => handleWallpaperChange(scene.value)}
                className={`p-4 rounded-2xl font-medium transition-all border-2 ${
                  wallpaper === scene.value
                    ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-purple-400/60 shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                } text-white`}
              >
                {scene.label}
              </button>
            ))}
          </div>
        </div>

        {/* Display Settings */}
        <div className="glass-dark p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-6">
            🎨 Display
          </h3>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <label className="text-white font-medium">Enable Animations</label>
            <Switch
              checked={animationsEnabled}
              onCheckedChange={handleAnimationToggle}
              className="data-[state=checked]:bg-purple-500"
            />
          </div>
        </div>

        {/* Sound Settings */}
        <div className="glass-dark p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
          <h3 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-6">
            🎵 Ambient Mood
          </h3>
          <p className="text-white/60 text-sm mb-4">Plays ambient audio while your timer is running</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { id: 'rain', label: '🌧️ Rain', value: 'rain' },
              { id: 'cafe', label: '☕ Café', value: 'cafe' },
              { id: 'ocean', label: '🌊 Ocean', value: 'ocean' },
              { id: 'forest', label: '🌲 Forest', value: 'forest' },
              { id: 'silence', label: '🔇 Silence', value: 'silence' },
            ].map(({ id, label, value }) => (
              <button
                key={id}
                onClick={() => handleSoundChange(value as any)}
                className={`p-3 rounded-xl font-medium transition-all border-2 text-sm ${
                  ambientSound === value
                    ? 'bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border-emerald-400/60'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                } text-white`}
              >
                {label}
              </button>
            ))}
          </div>
          
          <div className="mt-8">
            <h3 className="text-white/80 font-medium mb-3">Timer Alarm</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { id: 'bell', label: '🔔 Bell', value: 'bell' },
                { id: 'chime', label: '✨ Chime', value: 'chime' },
                { id: 'digital', label: '📱 Digital', value: 'digital' },
                { id: 'bowl', label: '🧘 Bowl', value: 'bowl' },
                { id: 'none', label: '🔇 None', value: 'none' },
              ].map(({ id, label, value }) => (
                <button
                  key={id}
                  onClick={() => handleAlarmSoundChange(value as any)}
                  className={`p-3 rounded-xl font-medium transition-all border-2 text-sm ${
                    alarmSound === value
                      ? 'bg-gradient-to-br from-blue-500/30 to-indigo-500/30 border-blue-400/60'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  } text-white`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pomodoro Settings */}
        <div className="glass-dark p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
          <h3 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-6">
            ⏱️ Pomodoro Timer
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-3">Focus Time</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={focusTime}
                  onChange={(e) => updatePomodoroSetting('focusTime', parseInt(e.target.value) || 1)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-lg focus:outline-none focus:border-white/40"
                />
                <span className="text-white/60 font-medium">min</span>
              </div>
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-3">Short Break</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={shortBreak}
                  onChange={(e) => updatePomodoroSetting('shortBreak', parseInt(e.target.value) || 1)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-lg focus:outline-none focus:border-white/40"
                />
                <span className="text-white/60 font-medium">min</span>
              </div>
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-3">Long Break</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={longBreak}
                  onChange={(e) => updatePomodoroSetting('longBreak', parseInt(e.target.value) || 1)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-lg focus:outline-none focus:border-white/40"
                />
                <span className="text-white/60 font-medium">min</span>
              </div>
            </div>
          </div>
        </div>



        {/* About */}
        <div className="glass-dark p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-3">💫 About Serinity</h3>
          <p className="text-white/70 text-sm leading-relaxed">
            A peaceful focus companion designed for deep work. Your data syncs securely to the cloud when signed in, and is stored locally when offline.
          </p>
        </div>
      </div>
    </div>
  );
}
