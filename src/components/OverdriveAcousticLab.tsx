import React, { useState } from 'react';
import { audioEngine } from '../audio/synthEngine';
import { AudioOscilloscope } from './AudioOscilloscope';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  Radio, 
  Sliders, 
  Zap, 
  Music,
  Sparkles
} from 'lucide-react';

interface OverdriveAcousticLabProps {
  resonanceHz: number;
  distortionGain: number;
  onUpdateParams: (params: { resonanceHz?: number; distortionGain?: number }) => void;
  onStimulationActiveChange?: (active: boolean) => void;
}

interface ChordPad {
  name: string;
  tuning: string;
  freq: number;
  desc: string;
  tag: string;
}

const CHORD_PADS: ChordPad[] = [
  { name: 'DROP-D CHUG', tuning: 'D2 / 73.4 Hz', freq: 73.41, desc: 'Heavy sub-root resonance; triggers stomatal dilation', tag: 'HEAVY' },
  { name: 'DIABOLUS TRITONE', tuning: 'Ab2 / 103.8 Hz', freq: 103.83, desc: 'Tritone dissonance; induces heavy metal cation pumping', tag: 'CHAOS' },
  { name: 'POWER CHORD FIFTH', tuning: 'A2 / 110.0 Hz', freq: 110.00, desc: 'Clean metallic harmonic; drives xylem sap acceleration', tag: 'SURGE' },
  { name: 'OCTAVE SCREAM', tuning: 'D3 / 146.8 Hz', freq: 146.83, desc: 'High harmonic overdrive; excites chloroplast ATP synthesis', tag: 'OVERDRIVE' },
];

export const OverdriveAcousticLab: React.FC<OverdriveAcousticLabProps> = ({
  resonanceHz,
  distortionGain,
  onUpdateParams,
  onStimulationActiveChange,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(65);
  const [isRhythmLooping, setIsRhythmLooping] = useState(false);
  const [activeBeat, setActiveBeat] = useState<number | null>(null);
  const [activePad, setActivePad] = useState<string | null>(null);

  const handleMuteToggle = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    audioEngine.setVolume(val / 100);
  };

  const handlePlayChord = (pad: ChordPad) => {
    setActivePad(pad.name);
    onUpdateParams({ resonanceHz: pad.freq });
    audioEngine.playPowerChord(pad.freq, 0.75, distortionGain);
    setTimeout(() => {
      setActivePad((curr) => (curr === pad.name ? null : curr));
    }, 450);
  };

  const handleToggleRhythm = () => {
    const isPlaying = audioEngine.toggleRhythmStimulator((step) => {
      setActiveBeat(step % 8);
    });
    setIsRhythmLooping(isPlaying);
    if (onStimulationActiveChange) {
      onStimulationActiveChange(isPlaying);
    }
    if (!isPlaying) {
      setActiveBeat(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-xl backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-950/80 border border-amber-600/40 text-amber-400">
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide font-heading text-zinc-100 flex items-center gap-2">
              ACOUSTIC OVERDRIVE & HEAVY METAL SYNTH
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                DROP-D BIO-STIMULATION
              </span>
            </h3>
            <p className="text-[11px] font-mono text-zinc-400">
              Web Audio DSP: Electric Guitar Distortion WaveShaper & Phyto-Acoustic Resonator
            </p>
          </div>
        </div>

        {/* Mute and Master Vol Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              title="Master Audio Volume"
            />
            <span className="w-7 text-[10px] text-zinc-400">{volume}%</span>
          </div>

          <button
            onClick={handleMuteToggle}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-all ${
              isMuted
                ? 'border-red-800 bg-red-950/60 text-red-300'
                : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5 text-red-400" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-400" />}
            {isMuted ? 'MUTED' : 'AUDIO ON'}
          </button>
        </div>
      </div>

      {/* Live Audio Oscilloscope Canvas */}
      <AudioOscilloscope resonanceHz={resonanceHz} distortionGain={distortionGain} />

      {/* Power Chord Interactive Trigger Pads */}
      <div>
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
          <span className="flex items-center gap-1 text-zinc-300 font-semibold">
            <Music className="h-3.5 w-3.5 text-amber-400" />
            HEAVY METAL POWER-CHORD PADS
          </span>
          <span className="text-[11px] text-zinc-500">
            Click pad to fire acoustic distortion wave into leaf vascular system
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {CHORD_PADS.map((pad) => {
            const isTriggered = activePad === pad.name;
            return (
              <button
                key={pad.name}
                onClick={() => handlePlayChord(pad)}
                className={`relative flex flex-col items-start p-2.5 rounded-lg border text-left transition-all active:scale-95 ${
                  isTriggered
                    ? 'border-amber-400 bg-amber-950/80 shadow-[0_0_18px_rgba(245,158,11,0.5)]'
                    : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 hover:bg-zinc-850'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold font-mono tracking-wider text-zinc-100">
                    {pad.name}
                  </span>
                  <span className="text-[9px] font-mono px-1 rounded bg-zinc-950 text-amber-400 border border-amber-900/60">
                    {pad.tag}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-emerald-400 mb-1">
                  {pad.tuning}
                </div>
                <div className="text-[10px] text-zinc-400 line-clamp-2 leading-tight">
                  {pad.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Riff Stimulator Automation & Rhythm Loop Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-lg border border-amber-950/60 bg-zinc-900/60 p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleRhythm}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold tracking-wider border transition-all ${
              isRhythmLooping
                ? 'border-amber-500 bg-amber-950 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse'
                : 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            {isRhythmLooping ? <Square className="h-4 w-4 text-amber-400 fill-amber-400" /> : <Play className="h-4 w-4 text-emerald-400 fill-emerald-400" />}
            {isRhythmLooping ? 'HALT BIO-CHUG' : 'ENGAGE RIFF STIMULATOR'}
          </button>

          <div>
            <div className="text-xs font-mono font-semibold text-zinc-200 flex items-center gap-1.5">
              <span>Continuous Palm-Muted Metal Loop</span>
              {isRhythmLooping && (
                <span className="text-[10px] px-1.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" /> +45% CATION UPTAKE
                </span>
              )}
            </div>
            <div className="text-[10px] font-mono text-zinc-500">
              Plays 132 BPM Drop-D riff to stimulate cellular mitosis and ion channel aperture
            </div>
          </div>
        </div>

        {/* 8-Step Beat Visualizer */}
        <div className="flex items-center gap-1 self-center">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((step) => (
            <div
              key={step}
              className={`h-6 w-3 rounded-sm transition-all ${
                activeBeat === step
                  ? 'bg-amber-400 shadow-[0_0_10px_#f59e0b] scale-110'
                  : 'bg-zinc-800 border border-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* DSP Tone & Distortion Knobs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Distortion Gain Slider */}
        <div className="rounded border border-zinc-800 bg-zinc-950 p-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1 text-zinc-300">
              <Zap className="h-3 w-3 text-amber-400" />
              TUBE OVERDRIVE CRUNCH (GAIN)
            </span>
            <span className="font-bold text-amber-400">{distortionGain}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="180"
            value={distortionGain}
            onChange={(e) => onUpdateParams({ distortionGain: Number(e.target.value) })}
            className="w-full h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[9px] font-mono text-zinc-500 mt-1">
            <span>WARM VINTAGE</span>
            <span>SCOOPED METALCORE</span>
            <span>MAX FUZZ</span>
          </div>
        </div>

        {/* Phyto-Resonance Frequency Slider */}
        <div className="rounded border border-zinc-800 bg-zinc-950 p-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1 text-zinc-300">
              <Sliders className="h-3 w-3 text-emerald-400" />
              PHYTO-RESONANCE CARRIER (Hz)
            </span>
            <span className="font-bold text-emerald-400">{resonanceHz.toFixed(1)} Hz</span>
          </div>
          <input
            type="range"
            min="40"
            max="250"
            step="0.5"
            value={resonanceHz}
            onChange={(e) => onUpdateParams({ resonanceHz: Number(e.target.value) })}
            className="w-full h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[9px] font-mono text-zinc-500 mt-1">
            <span>40 Hz (SUB-ROOT)</span>
            <span>73.4 Hz (DROP-D)</span>
            <span>250 Hz (STOMATA)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
