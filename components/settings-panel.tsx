'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { WallpaperScene } from '@/components/wallpaper-background';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, MessageCircle } from 'lucide-react';

interface SettingsPanelProps {
  onWallpaperChange: (scene: WallpaperScene) => void;
  onAnimationToggle: (enabled: boolean) => void;
  onSoundChange: (sound: 'rain' | 'cafe' | 'silence') => void;
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
  onPomodoroSettingsChange,
  superFocusMode = false,
  onSuperFocusModeChange,
}: SettingsPanelProps) {
  const [wallpaper, setWallpaper] = useState<WallpaperScene>('night-sky');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [ambientSound, setAmbientSound] = useState<'rain' | 'cafe' | 'silence'>('silence');
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
      setFocusTime(settings.focusTime || 25);
      setShortBreak(settings.shortBreak || 5);
      setLongBreak(settings.longBreak || 15);
    }
  }, []);

  const saveSettings = () => {
    const settings = {
      wallpaper,
      animationsEnabled,
      ambientSound,
      focusTime,
      shortBreak,
      longBreak,
    };
    localStorage.setItem('serenity_settings', JSON.stringify(settings));
  };

  const handleWallpaperChange = (value: WallpaperScene) => {
    setWallpaper(value);
    onWallpaperChange(value);
    localStorage.setItem('serenity_settings', JSON.stringify({
      wallpaper: value,
      animationsEnabled,
      ambientSound,
      focusTime,
      shortBreak,
      longBreak,
    }));
  };

  const handleAnimationToggle = (checked: boolean) => {
    setAnimationsEnabled(checked);
    onAnimationToggle(checked);
    saveSettings();
  };

  const handleSoundChange = (sound: 'rain' | 'cafe' | 'silence') => {
    setAmbientSound(sound);
    onSoundChange(sound);
    saveSettings();
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
    saveSettings();
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
          <p className="text-white/60 text-sm mb-4">Visual indicators to set your focus mood</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'rain', label: '🌧️ Rain', value: 'rain' },
              { id: 'cafe', label: '☕ Café', value: 'cafe' },
              { id: 'silence', label: '🔇 Silence', value: 'silence' },
            ].map(({ id, label, value }) => (
              <button
                key={id}
                onClick={() => handleSoundChange(value as 'rain' | 'cafe' | 'silence')}
                className={`p-4 rounded-xl font-medium transition-all border-2 ${
                  ambientSound === value
                    ? 'bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border-emerald-400/60'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                } text-white`}
              >
                {label}
              </button>
            ))}
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

        {/* Super Focus Mode */}
        <div className="glass-dark p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
          <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-6 flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-400" />
            Super Focus Mode
          </h3>
          <p className="text-white/60 text-sm mb-4">
            Block all distractions including the Focus Forum chat during timer sessions
          </p>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-white/60" />
              <div>
                <label className="text-white font-medium">Hide Forum During Focus</label>
                <p className="text-white/50 text-xs mt-0.5">Disables floating chat while timer is running</p>
              </div>
            </div>
            <Switch
              checked={localSuperFocusMode}
              onCheckedChange={(checked) => {
                setLocalSuperFocusMode(checked);
                onSuperFocusModeChange?.(checked);
                const saved = localStorage.getItem('serenity_settings');
                const settings = saved ? JSON.parse(saved) : {};
                settings.superFocusMode = checked;
                localStorage.setItem('serenity_settings', JSON.stringify(settings));
              }}
              className="data-[state=checked]:bg-indigo-500"
            />
          </div>
        </div>

        {/* About */}
        <div className="glass-dark p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-3">💫 About Serinity</h3>
          <p className="text-white/70 text-sm leading-relaxed">
            A peaceful focus companion designed for deep work. All your data stays private—stored locally on your device with no tracking or servers.
          </p>
        </div>
      </div>
    </div>
  );
}
