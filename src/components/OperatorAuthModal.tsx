import React, { useState } from 'react';
import { audioEngine } from '../audio/synthEngine';
import { 
  Bot, 
  UserCheck, 
  Sparkles, 
  Shield, 
  Terminal, 
  Check, 
  Radio, 
  Zap, 
  Dice5
} from 'lucide-react';

interface OperatorAuthModalProps {
  onJoin: (name: string, role: string, color: string) => void;
  currentName?: string;
  isChangingName?: boolean;
  onCancel?: () => void;
}

const PRESET_CALLSIGNS = [
  'Cmdr-Vance',
  'CyberBotanist-7',
  'RiffMaster-DropD',
  'Dr-Thorne',
  'Nyx-Alloy',
  'HazardScout-09',
  'TeslaSurge',
  'PhytoPilot-Sam',
];

const ROLES = [
  { id: 'Chief Bio-Bot Pilot', label: 'Chief Bio-Bot Pilot', icon: Zap },
  { id: 'Phytoremediation Lead', label: 'Phytoremediation Lead', icon: Shield },
  { id: 'Acoustic Overdrive Tech', label: 'Acoustic Overdrive Tech', icon: Radio },
  { id: 'Hazard Field Scout', label: 'Hazard Field Scout', icon: Terminal },
];

const COLOR_OPTIONS = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Lime', value: '#84cc16' },
];

export const OperatorAuthModal: React.FC<OperatorAuthModalProps> = ({
  onJoin,
  currentName = '',
  isChangingName = false,
  onCancel,
}) => {
  const [name, setName] = useState(currentName);
  const [role, setRole] = useState(ROLES[0].id);
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);
  const [error, setError] = useState('');

  const handleRandomize = () => {
    audioEngine.playTacticalClick();
    const randomCallsign = PRESET_CALLSIGNS[Math.floor(Math.random() * PRESET_CALLSIGNS.length)];
    setName(randomCallsign);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a display name or callsign to enter.');
      return;
    }
    audioEngine.playTacticalClick();
    audioEngine.playPowerChord(110.0, 0.5, 75);
    onJoin(name.trim(), role, color);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-emerald-600/70 bg-zinc-950 p-6 shadow-[0_0_50px_rgba(16,185,129,0.25)] flex flex-col gap-4">
        {/* Glow corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-400 rounded-br-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-zinc-900 border border-emerald-400 shadow-md text-zinc-950">
            <Bot className="h-6 w-6 text-emerald-200" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading text-zinc-100 tracking-wide uppercase">
              {isChangingName ? 'Update Operator Call Sign' : 'Bio-Bot Control Room Login'}
            </h2>
            <p className="text-[11px] font-mono text-zinc-400">
              Ms. Heavy Metal Leaf • Real-Time Collaborative Workspace
            </p>
          </div>
        </div>

        {/* Form Prompt */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-mono font-semibold text-zinc-200 flex items-center justify-between mb-1.5">
              <span>Enter your Operator Name to enter:</span>
              <button
                type="button"
                onClick={handleRandomize}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
              >
                <Dice5 className="h-3 w-3" />
                Random Call Sign
              </button>
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                maxLength={24}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="e.g. Cmdr-Vance or Alex..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
              />
            </div>
            {error && (
              <p className="text-xs font-mono text-red-400 mt-1">{error}</p>
            )}
          </div>

          {/* Quick Preset Callsigns */}
          <div className="flex flex-wrap gap-1.5">
            {PRESET_CALLSIGNS.slice(0, 4).map((cs) => (
              <button
                key={cs}
                type="button"
                onClick={() => {
                  setName(cs);
                  setError('');
                }}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-emerald-700 hover:text-emerald-300 transition-colors"
              >
                {cs}
              </button>
            ))}
          </div>

          {/* Role Selection */}
          <div>
            <label className="text-xs font-mono font-semibold text-zinc-300 mb-1.5 block">
              Assigned Operational Role:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs font-mono transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200'
                        : 'border-zinc-800 bg-zinc-900/70 text-zinc-400 hover:bg-zinc-850'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
                    <span className="truncate">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Avatar Color Picker */}
          <div>
            <label className="text-xs font-mono font-semibold text-zinc-300 mb-1.5 block">
              Call Sign Avatar Color:
            </label>
            <div className="flex items-center gap-2.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    color === c.value ? 'scale-125 ring-2 ring-white shadow-lg' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                >
                  {color === c.value && <Check className="h-3.5 w-3.5 text-zinc-950 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
            {isChangingName && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-900"
              >
                CANCEL
              </button>
            )}
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-zinc-950 font-mono font-bold text-xs tracking-wider hover:from-emerald-500 hover:to-teal-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95"
            >
              <UserCheck className="h-4 w-4" />
              <span>ENTER CONTROL ROOM</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
