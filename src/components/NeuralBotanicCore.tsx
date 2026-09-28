import React, { useState, useRef, useEffect } from 'react';
import { LeafTelemetry } from '../types/bioBot';
import { audioEngine } from '../audio/synthEngine';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Globe, 
  MapPin, 
  ExternalLink, 
  Trash2, 
  Zap, 
  Compass, 
  ChevronRight,
  Sliders,
  Copy,
  Check
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  webSources?: { title: string; uri: string }[];
  mapSources?: { title: string; uri: string }[];
  searchQueries?: string[];
  modeUsed?: 'standard' | 'search' | 'maps';
}

interface NeuralBotanicCoreProps {
  telemetry: LeafTelemetry;
  onTriggerActuator: (action: string) => void;
}

const PRESET_QUERIES = [
  'What are the best hyperaccumulator plants for Cadmium and Lead phytoremediation?',
  'Where are the most hazardous heavy metal Superfund sites in the USA?',
  'How does acoustic frequency and Drop-D guitar overdrive stimulate plant cell ion channels?',
  'Recommend a tactical bio-bot remediation protocol for 850 PPM Nickel slag.',
];

export const NeuralBotanicCore: React.FC<NeuralBotanicCoreProps> = ({
  telemetry,
  onTriggerActuator,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `**[HM-LEAF v4.09 NEURAL LINK SYNCHRONIZED]**

Greetings, Commander. I am **Ms. Heavy Metal Leaf**—an autonomous bio-cybernetic hybrid organism. 
- **Vascular Xylem Status**: ${telemetry.sapPressure.toFixed(2)} MPa tension nominal.
- **Titanium Exoskeleton**: ${telemetry.exoskeletonIntegrity.toFixed(1)}% tensile armor.
- **Drop-D Overdrive Resonator**: 73.4 Hz calibrated.

I am equipped with live **Google Search Grounding** for botanical literature and **Google Maps Grounding** to pinpoint real-world industrial contamination sites worldwide. How can we direct our hyperaccumulation protocols today?`,
      timestamp: '00:00:01',
      modeUsed: 'standard',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'standard' | 'search' | 'maps'>('search');
  const [modelChoice, setModelChoice] = useState<'gemini-3.5-flash' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    audioEngine.playTacticalClick();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: timeStr,
      modeUsed: mode,
    };

    const updatedHistory = [...messages, newUserMsg];
    setMessages(updatedHistory);
    setInput('');
    setIsLoading(true);

    // Get approximate user location if maps mode is active
    let userLocation: { latitude: number; longitude: number } | undefined;
    if (mode === 'maps' && 'geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        userLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
      } catch (e) {
        // Geolocation optional, fallback works gracefully
      }
    }

    try {
      // Send conversation history to /api/chat
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({ role: m.role, text: m.text })),
          modelChoice,
          mode,
          userLocation,
          telemetry,
        }),
      });

      const data = await res.json();
      audioEngine.playTacticalClick();

      const newBotMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.text || 'Telemetry acknowledged.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        webSources: data.webSources || [],
        mapSources: data.mapSources || [],
        searchQueries: data.searchQueries || [],
        modeUsed: mode,
      };

      setMessages((prev) => [...prev, newBotMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `[NEURAL COMM LATENCY]: Local fallback active. Structural titanium integrity at ${telemetry.exoskeletonIntegrity.toFixed(1)}%. Vacuum cation pumps ready.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        modeUsed: 'standard',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    audioEngine.playTacticalClick();
    setMessages([
      {
        id: 'reset',
        role: 'model',
        text: 'Neural log flushed. Conversation memory cleared. Ready for new mission parameters.',
        timestamp: new Date().toLocaleTimeString(),
        modeUsed: 'standard',
      },
    ]);
  };

  const handleCopyText = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.text);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-xl backdrop-blur h-full">
      {/* Header with Mode & Model Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-950/80 border border-emerald-600/40 text-emerald-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide font-heading text-zinc-100 flex items-center gap-2">
              MS. HEAVY METAL LEAF — ONBOARD CHATBOT
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                MULTI-TURN AI
              </span>
            </h3>
            <p className="text-[11px] font-mono text-zinc-400">
              Interactive Phyto-Robotics Intelligence with Live Google Search & Maps Grounding
            </p>
          </div>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/90 p-1 text-xs font-mono">
            <button
              onClick={() => {
                audioEngine.playTacticalClick();
                setMode('search');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors text-[11px] font-semibold ${
                mode === 'search'
                  ? 'bg-blue-600 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Ground responses in live Google Search for research, biology & rock science"
            >
              <Globe className="h-3 w-3" />
              <span>GOOGLE SEARCH</span>
            </button>

            <button
              onClick={() => {
                audioEngine.playTacticalClick();
                setMode('maps');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors text-[11px] font-semibold ${
                mode === 'maps'
                  ? 'bg-emerald-600 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Ground responses in Google Maps to find real contaminated sites and Superfunds"
            >
              <MapPin className="h-3 w-3" />
              <span>GOOGLE MAPS</span>
            </button>

            <button
              onClick={() => {
                audioEngine.playTacticalClick();
                setMode('standard');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors text-[11px] font-semibold ${
                mode === 'standard'
                  ? 'bg-zinc-700 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Standard tactical bio-bot responses"
            >
              <Zap className="h-3 w-3" />
              <span>TACTICAL</span>
            </button>
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 border border-zinc-800 bg-zinc-900/80 px-2 py-1 rounded-lg">
            <Sliders className="h-3 w-3 text-zinc-500" />
            <select
              value={modelChoice}
              onChange={(e) => setModelChoice(e.target.value as any)}
              className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
            >
              <option value="gemini-3.5-flash" className="bg-zinc-900 text-zinc-200">
                gemini-3.5-flash (Standard & Grounding)
              </option>
              <option value="gemini-3.1-flash-lite" className="bg-zinc-900 text-zinc-200">
                gemini-3.1-flash-lite (Fast Tasks)
              </option>
            </select>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-red-400 hover:border-red-900/50 transition-colors"
            title="Clear Chat Thread"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Preset Query Chips */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-[11px] font-mono text-zinc-300 hover:border-emerald-600 hover:text-emerald-300 transition-colors disabled:opacity-50 text-left"
          >
            <ChevronRight className="h-3 w-3 text-emerald-500 flex-shrink-0" />
            <span className="truncate max-w-[280px] sm:max-w-none">{q}</span>
          </button>
        ))}
      </div>

      {/* Scrollable Conversation Thread */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-[360px] max-h-[500px] overflow-y-auto rounded-lg border border-zinc-900 bg-zinc-950 p-4 font-mono text-xs flex flex-col gap-4 scanline-overlay"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1.5 rounded-xl p-3.5 transition-all ${
              msg.role === 'user'
                ? 'bg-zinc-900/90 border border-zinc-800 text-zinc-100 self-end max-w-[85%] shadow-md'
                : 'bg-emerald-950/20 border border-emerald-900/40 text-emerald-100 max-w-[95%] shadow-lg'
            }`}
          >
            {/* Message Meta Header */}
            <div className="flex items-center justify-between text-[10px] text-zinc-400 border-b border-zinc-800/40 pb-1 mb-1">
              <div className="flex items-center gap-2">
                <span className={`font-bold ${
                  msg.role === 'user' ? 'text-cyan-400' : 'text-emerald-400 flex items-center gap-1'
                }`}>
                  {msg.role === 'user' ? 'YOU (OPERATOR)' : 'MS. HEAVY METAL LEAF'}
                </span>
                {msg.modeUsed && (
                  <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase border ${
                    msg.modeUsed === 'search'
                      ? 'bg-blue-950 text-blue-300 border-blue-800'
                      : msg.modeUsed === 'maps'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                  }`}>
                    {msg.modeUsed}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">{msg.timestamp}</span>
                <button
                  onClick={() => handleCopyText(msg)}
                  className="hover:text-zinc-200 text-zinc-500 p-0.5"
                  title="Copy message"
                >
                  {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>

            {/* Message Body Content */}
            <div className="whitespace-pre-wrap leading-relaxed text-zinc-200 font-sans sm:font-mono text-xs sm:text-[13px]">
              {msg.text}
            </div>

            {/* Google Search Grounding Sources Cards */}
            {msg.webSources && msg.webSources.length > 0 && (
              <div className="mt-2.5 rounded-lg border border-blue-900/60 bg-blue-950/20 p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 mb-1.5 uppercase tracking-wider">
                  <Globe className="h-3.5 w-3.5" />
                  <span>Google Search Grounding Sources ({msg.webSources.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {msg.webSources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 p-1.5 rounded bg-zinc-900/90 border border-zinc-800 hover:border-blue-500 hover:bg-zinc-850 transition-colors group"
                    >
                      <span className="text-[11px] text-zinc-300 truncate group-hover:text-blue-300 font-medium">
                        {source.title}
                      </span>
                      <ExternalLink className="h-3 w-3 text-zinc-500 flex-shrink-0 group-hover:text-blue-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Google Maps Grounding Place Links Cards */}
            {msg.mapSources && msg.mapSources.length > 0 && (
              <div className="mt-2.5 rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 mb-1.5 uppercase tracking-wider">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Google Maps Grounding Locations ({msg.mapSources.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {msg.mapSources.map((place, idx) => (
                    <a
                      key={idx}
                      href={place.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 p-1.5 rounded bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500 hover:bg-zinc-850 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Compass className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        <span className="text-[11px] text-zinc-200 truncate group-hover:text-emerald-300 font-medium">
                          {place.title}
                        </span>
                      </div>
                      <ExternalLink className="h-3 w-3 text-zinc-500 flex-shrink-0 group-hover:text-emerald-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 animate-pulse text-xs">
            <Sparkles className="h-4 w-4 animate-spin text-emerald-400" />
            <span>
              {mode === 'search'
                ? 'CONSULTING GOOGLE SEARCH & SYNTHESIZING BOTANICAL RESEARCH...'
                : mode === 'maps'
                ? 'SCANNING GOOGLE MAPS FOR GEOGRAPHICAL CONTAMINATED SITES...'
                : 'SYNTHESIZING ONBOARD BIO-ROBOTIC TELEMETRY...'}
            </span>
          </div>
        )}
      </div>

      {/* Input Form Bar */}
      <div className="flex items-center gap-2 pt-1">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={
              mode === 'search'
                ? "Ask about real hyperaccumulators, heavy metal limits, or acoustic botany (Search Grounded)..."
                : mode === 'maps'
                ? "Search for real Superfund sites, smelters, or mine tailings (Maps Grounded)..."
                : "Enter command for Ms. Heavy Metal Leaf..."
            }
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-3 pr-10 py-2.5 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 uppercase">
            {mode}
          </div>
        </div>

        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading || !input.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 text-zinc-950 text-xs font-mono font-bold hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">DISPATCH</span>
        </button>
      </div>
    </div>
  );
};
