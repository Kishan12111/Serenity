'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export type AmbientSound = 'rain' | 'cafe' | 'ocean' | 'forest' | 'silence';
export type AlarmSound = 'bell' | 'chime' | 'digital' | 'bowl' | 'none';

function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  return new (window.AudioContext || (window as any).webkitAudioContext)();
}

function createRainNoise(ctx: AudioContext): AudioBufferSourceNode {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function createCafeNoise(ctx: AudioContext): AudioBufferSourceNode {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function createOceanNoise(ctx: AudioContext): { source: AudioBufferSourceNode; filter: BiquadFilterNode } {
  const source = createRainNoise(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  filter.Q.value = 0.5;
  return { source, filter };
}

export function playAlarm(type: AlarmSound, volume: number = 0.5): void {
  if (type === 'none' || typeof window === 'undefined') return;
  const ctx = createAudioContext();
  if (!ctx) return;

  const gainNode = ctx.createGain();
  gainNode.gain.value = volume;
  gainNode.connect(ctx.destination);

  if (type === 'bell' || type === 'bowl') {
    const freqs = type === 'bowl' ? [220, 440, 660] : [523, 659, 784];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(oscGain);
      oscGain.connect(gainNode);
      oscGain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.05);
      oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + 3);
    });
  } else if (type === 'chime') {
    [784, 988, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(oscGain);
      oscGain.connect(gainNode);
      oscGain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.2);
      oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + 2);
    });
  } else if (type === 'digital') {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 880;
    osc.connect(oscGain);
    oscGain.connect(gainNode);
    oscGain.gain.setValueAtTime(0.2, ctx.currentTime);
    oscGain.gain.setValueAtTime(0, ctx.currentTime + 0.1);
    oscGain.gain.setValueAtTime(0.2, ctx.currentTime + 0.2);
    oscGain.gain.setValueAtTime(0, ctx.currentTime + 0.3);
    oscGain.gain.setValueAtTime(0.2, ctx.currentTime + 0.4);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1);
  }

  setTimeout(() => ctx.close(), 4000);
}

export function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const [currentAmbient, setCurrentAmbient] = useState<AmbientSound>('silence');
  const [volume, setVolume] = useState(0.4);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopAmbient = useCallback(() => {
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 0.5);
      setTimeout(() => {
        sourceRef.current?.stop();
        sourceRef.current = null;
      }, 600);
    }
    setIsPlaying(false);
  }, []);

  const startAmbient = useCallback((sound: AmbientSound, vol: number) => {
    if (sound === 'silence' || typeof window === 'undefined') {
      setIsPlaying(false);
      return;
    }

    if (!ctxRef.current) {
      ctxRef.current = createAudioContext();
    }
    const ctx = ctxRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') ctx.resume();

    sourceRef.current?.stop();
    sourceRef.current = null;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 1);
    gainNode.connect(ctx.destination);
    gainRef.current = gainNode;

    if (sound === 'rain') {
      const source = createRainNoise(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      source.connect(filter);
      filter.connect(gainNode);
      source.start();
      sourceRef.current = source;
    } else if (sound === 'cafe') {
      const source = createCafeNoise(ctx);
      source.connect(gainNode);
      source.start();
      sourceRef.current = source;
    } else if (sound === 'ocean') {
      const { source, filter } = createOceanNoise(ctx);
      source.connect(filter);
      filter.connect(gainNode);
      source.start();
      sourceRef.current = source;
      filterRef.current = filter;
    } else if (sound === 'forest') {
      const source = createRainNoise(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 2;
      source.connect(filter);
      filter.connect(gainNode);
      source.start();
      sourceRef.current = source;
    }

    setIsPlaying(true);
  }, []);

  const setAmbient = useCallback((sound: AmbientSound, vol?: number) => {
    const v = vol ?? volume;
    setCurrentAmbient(sound);
    stopAmbient();
    if (sound !== 'silence') {
      setTimeout(() => startAmbient(sound, v), 650);
    }
  }, [volume, stopAmbient, startAmbient]);

  const setAmbientVolume = useCallback((vol: number) => {
    setVolume(vol);
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.linearRampToValueAtTime(vol, ctxRef.current.currentTime + 0.1);
    }
  }, []);

  useEffect(() => {
    return () => {
      sourceRef.current?.stop();
      ctxRef.current?.close();
    };
  }, []);

  return {
    currentAmbient,
    isPlaying,
    volume,
    setAmbient,
    setAmbientVolume,
    stopAmbient,
    startAmbient: (sound?: AmbientSound) => startAmbient(sound ?? currentAmbient, volume),
    pauseAmbient: stopAmbient,
  };
}
