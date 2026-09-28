import React, { useState, useRef, useEffect } from 'react';
import { Operator, ActivityLogItem, RoomChatMessage } from '../types/collaboration';
import { audioEngine } from '../audio/synthEngine';
import { 
  Users, 
  Activity, 
  Radio, 
  Zap, 
  Shield, 
  Cpu, 
  MessageSquare, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  UserCheck, 
  Edit3, 
  Sparkles, 
  Bot,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Command,
  Sliders
} from 'lucide-react';

interface ActiveOperatorsPanelProps {
  operators: Operator[];
  activityLog: ActivityLogItem[];
  chatMessages: RoomChatMessage[];
  currentOperatorName: string;
  currentOperatorRole: string;
  currentOperatorColor: string;
  isConnected: boolean;
  onSendMessage: (text: string) => void;
  onOpenNameModal: () => void;
}

export const ActiveOperatorsPanel: React.FC<ActiveOperatorsPanelProps> = ({
  operators,
  activityLog,
  chatMessages,
  currentOperatorName,
  currentOperatorRole,
  currentOperatorColor,
  isConnected,
  onSendMessage,
  onOpenNameModal,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'activity' | 'roster'>('chat');
  const [inputText, setInputText] = useState<string>('');
  const [showCheatSheet, setShowCheatSheet] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (activeTab === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    audioEngine.playTacticalClick();
    onSendMessage(trimmed);
    setInputText('');
  };

  const handleQuickRadio = (phrase: string) => {
    audioEngine.playTacticalClick();
    onSendMessage(phrase);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'command':
        return <Terminal className="h-3 w-3 text-cyan-400" />;
      case 'actuator':
        return <Zap className="h-3 w-3 text-amber-400" />;
      case 'acoustic':
        return <Radio className="h-3 w-3 text-purple-400" />;
      case 'telemetry':
        return <Cpu className="h-3 w-3 text-cyan-400" />;
      case 'remediation':
        return <Shield className="h-3 w-3 text-emerald-400" />;
      case 'presence':
        return <UserCheck className="h-3 w-3 text-blue-400" />;
      default:
        return <Activity className="h-3 w-3 text-emerald-400" />;
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/85 shadow-xl backdrop-blur overflow-hidden flex flex-col transition-all">
      {/* Panel Master Header */}
      <div 
        className="flex items-center justify-between p-3 border-b border-zinc-800/80 bg-zinc-900/60 select-none"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Users className="h-4 w-4 text-emerald-400" />
            <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
            }`} />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono tracking-wider text-zinc-100 flex items-center gap-2">
              CONTROL ROOM WORKSPACE
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                {operators.length} ONLINE
              </span>
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Edit Name / Callsign */}
          <button
            onClick={onOpenNameModal}
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/80 text-[10px] font-mono text-zinc-300 hover:text-emerald-300 hover:border-emerald-600 transition-colors"
            title="Edit your Operator Callsign"
          >
            <Edit3 className="h-2.5 w-2.5" />
            <span>Callsign</span>
          </button>

          {/* Sync Status Badge */}
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            isConnected
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
              : 'bg-red-950/60 text-red-300 border-red-800'
          }`}>
            {isConnected ? 'LIVE SYNC' : 'DISCONNECTED'}
          </span>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-zinc-400 hover:text-zinc-200 p-0.5 rounded"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-col">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center border-b border-zinc-800 bg-zinc-950/60 px-2 pt-1.5 gap-1 text-[11px] font-mono">
            <button
              onClick={() => {
                audioEngine.playTacticalClick();
                setActiveTab('chat');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg transition-all border-t border-x ${
                activeTab === 'chat'
                  ? 'border-zinc-800 bg-zinc-900/90 text-emerald-300 font-bold shadow-sm'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="h-3 w-3 text-emerald-400" />
              <span>LIVE CHAT</span>
              <span className="text-[9px] px-1 rounded-full bg-zinc-800 text-zinc-300 ml-0.5">
                {chatMessages.length}
              </span>
            </button>

            <button
              onClick={() => {
                audioEngine.playTacticalClick();
                setActiveTab('activity');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg transition-all border-t border-x ${
                activeTab === 'activity'
                  ? 'border-zinc-800 bg-zinc-900/90 text-amber-300 font-bold shadow-sm'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity className="h-3 w-3 text-amber-400" />
              <span>SYSTEM STREAM</span>
              <span className="text-[9px] px-1 rounded-full bg-zinc-800 text-zinc-300 ml-0.5">
                {activityLog.length}
              </span>
            </button>

            <button
              onClick={() => {
                audioEngine.playTacticalClick();
                setActiveTab('roster');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg transition-all border-t border-x ${
                activeTab === 'roster'
                  ? 'border-zinc-800 bg-zinc-900/90 text-cyan-300 font-bold shadow-sm'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="h-3 w-3 text-cyan-400" />
              <span>OPERATOR ROSTER</span>
              <span className="text-[9px] px-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold ml-0.5">
                {operators.length}
              </span>
            </button>
          </div>

          {/* TAB 1: REAL-TIME CHAT & NATURAL LANGUAGE COMMAND DECK */}
          {activeTab === 'chat' && (
            <div className="p-3 flex flex-col gap-2.5">
              {/* Header banner explaining text-driven controls */}
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 bg-zinc-900/60 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-zinc-200 font-bold">NATURAL LANGUAGE COMMAND DECK</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCheatSheet(!showCheatSheet)}
                  className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
                >
                  <HelpCircle className="h-3 w-3" />
                  <span>{showCheatSheet ? 'Hide Limits' : 'Botanical Limits & Syntax'}</span>
                </button>
              </div>

              {/* Collapsible Botanical Physical Limits Cheat Sheet */}
              {showCheatSheet && (
                <div className="rounded-lg border border-emerald-900/70 bg-emerald-950/20 p-2.5 text-[11px] font-mono flex flex-col gap-1.5 animate-fade-in border-dashed">
                  <div className="text-emerald-300 font-bold flex items-center gap-1.5 pb-1 border-b border-emerald-900/40">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span>Real-World Botanical Clamping & Physical Validation Rules:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-300 text-[10px] pt-1">
                    <div>
                      <span className="text-emerald-400 font-bold">1. Heliotropic Servo Pitch:</span>
                      <p className="text-zinc-400">Range: <strong>-45° to +45°</strong> (Petiolar pulvinus flexion limit. Inputs exceeding this are clamped to prevent structural mechanical rupture).</p>
                    </div>
                    <div>
                      <span className="text-cyan-400 font-bold">2. Xylem Hydraulic Tension:</span>
                      <p className="text-zinc-400">Safe: <strong>0.5 to 2.5 MPa</strong> (-2.5 MPa tension). Exceeding -2.5 MPa triggers <em>vascular xylem cavitation warning</em> and is clamped to prevent embolism!</p>
                    </div>
                    <div>
                      <span className="text-purple-400 font-bold">3. Drop-D Acoustic Resonance:</span>
                      <p className="text-zinc-400">Safe: <strong>20.0 to 150.0 Hz</strong> (Default Drop-D 73.41 Hz). Above 150 Hz clamped to prevent ultrasonic cellular lysis.</p>
                    </div>
                    <div>
                      <span className="text-amber-400 font-bold">4. Tactical Actuators:</span>
                      <p className="text-zinc-400">Recognizes <em>flush xylem, deploy shield, fire tesla arc, cycle stomata, switch zone, start vacuum extraction</em>.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Message Scroll Feed */}
              <div 
                ref={chatScrollRef}
                className="h-52 overflow-y-auto rounded-lg border border-zinc-900 bg-zinc-950 p-2.5 font-mono text-xs flex flex-col gap-2 scanline-overlay"
              >
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-6 text-center text-xs gap-1.5">
                    <Terminal className="h-6 w-6 text-zinc-700 mb-1" />
                    <span className="font-bold text-zinc-400">Text-Driven Control Room & Chat Ready.</span>
                    <span className="text-[10px] text-zinc-500 max-w-sm">
                      Type plain English instructions to steer leaf pitch, flush xylem lines, adjust hydraulic tension, or trigger galvanic systems.
                    </span>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isSelf = msg.senderName === currentOperatorName;
                    const isSystemBot = msg.userId === 'system-command-core' || msg.senderName.includes('HM-LEAF') || msg.senderName.includes('CORE');
                    const hasWarning = msg.text.includes('[WARNING]');
                    const hasAction = msg.text.includes('[ACTION]');

                    if (isSystemBot) {
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col gap-1 rounded-lg p-2.5 transition-all text-xs font-mono ${
                            hasWarning 
                              ? 'bg-amber-950/30 border border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.15)]' 
                              : 'bg-emerald-950/30 border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-1 border-b border-zinc-800/60 text-[10px]">
                            <div className="flex items-center gap-1.5">
                              {hasWarning ? (
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              )}
                              <span className={`font-bold tracking-wider ${hasWarning ? 'text-amber-300' : 'text-emerald-300'}`}>
                                {msg.senderName}
                              </span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                                {hasWarning ? 'BOTANICAL CLAMP' : 'VALIDATED EXECUTION'}
                              </span>
                            </div>
                            <span className="text-zinc-500 text-[9px]">{msg.timestamp}</span>
                          </div>
                          <div className="text-zinc-200 text-xs leading-relaxed whitespace-pre-line pt-0.5">
                            {msg.text.split('\n').map((line, idx) => {
                              if (line.startsWith('[WARNING]')) {
                                return (
                                  <div key={idx} className="text-amber-300 font-bold flex items-start gap-1.5 my-0.5">
                                    <AlertTriangle className="h-3 w-3 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <span>{line}</span>
                                  </div>
                                );
                              }
                              if (line.startsWith('[ACTION]')) {
                                return (
                                  <div key={idx} className="text-emerald-300 font-semibold flex items-start gap-1.5 my-0.5">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <span>{line}</span>
                                  </div>
                                );
                              }
                              return <p key={idx} className="text-zinc-300">{line}</p>;
                            })}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col gap-0.5 rounded-lg p-2 transition-all ${
                          isSelf
                            ? 'bg-zinc-900/80 border border-emerald-900/40 ml-4'
                            : 'bg-zinc-900/40 border border-zinc-800/80 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] pb-1 border-b border-zinc-800/50">
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: msg.avatarColor || '#10b981' }}
                            />
                            <span className="font-bold text-zinc-200 flex items-center gap-1">
                              {msg.senderName}
                              {isSelf && <span className="text-[9px] text-emerald-400 font-normal">(YOU)</span>}
                            </span>
                            <span className="text-[9px] text-zinc-500">
                              • {msg.role}
                            </span>
                          </div>
                          <span className="text-zinc-500 font-mono text-[9px]">
                            {msg.timestamp}
                          </span>
                        </div>
                        <p className="text-zinc-200 text-xs mt-1 leading-relaxed break-words font-mono">
                          {msg.text}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Natural Language Command Quick Presets */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span className="uppercase font-bold flex items-center gap-1">
                    <Command className="h-3 w-3 text-emerald-400" />
                    Command Prompt Presets (Click to Execute):
                  </span>
                  <span className="text-[9px] text-zinc-600">Real-time parsed & clamped</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono text-zinc-400 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => handleQuickRadio('Set leaf pitch to +20 degrees and flush the xylem sap')}
                    className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-emerald-500 hover:text-emerald-300 transition-colors flex-shrink-0 text-left"
                    title="User Prompt Example 1: Set pitch and flush sap"
                  >
                    🌿 Pitch +20° & Flush Sap
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRadio('Increase sap hydraulic tension to -5.0 MPa')}
                    className="px-2 py-1 rounded bg-zinc-900 border border-amber-900/60 text-amber-300 hover:border-amber-500 hover:text-amber-200 transition-colors flex-shrink-0 text-left"
                    title="User Prompt Example 2: Cavitation Threshold Clamping Test"
                  >
                    ⚠️ Tension -5.0 MPa (Cavitation Clamp)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRadio('tilt leaf up 15 deg')}
                    className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-cyan-500 hover:text-cyan-300 transition-colors flex-shrink-0 text-left"
                  >
                    📐 Tilt Leaf Up 15°
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRadio('Tune acoustic frequency to 73.4 Hz and set distortion gain to 90%')}
                    className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-purple-500 hover:text-purple-300 transition-colors flex-shrink-0 text-left"
                  >
                    🎸 Tune 73.4 Hz & Gain 90%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRadio('Deploy titanium phyto-chitin energy shield')}
                    className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-blue-500 hover:text-blue-300 transition-colors flex-shrink-0 text-left"
                  >
                    🛡️ Deploy Shield
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRadio('Fire 12.4 kV galvanic Tesla arc')}
                    className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-amber-500 hover:text-amber-300 transition-colors flex-shrink-0 text-left"
                  >
                    ⚡ Fire 12.4 kV Tesla Arc
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRadio('Cycle stomatal micro-apertures')}
                    className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-emerald-500 hover:text-emerald-300 transition-colors flex-shrink-0 text-left"
                  >
                    🍃 Cycle Stomata
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRadio('Switch zone to Tar Creek Lead Piles and start vacuum extraction')}
                    className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-cyan-500 hover:text-cyan-300 transition-colors flex-shrink-0 text-left"
                  >
                    🧪 Tar Creek & Start Vacuum
                  </button>
                </div>
              </div>

              {/* Chat / Command Input Box */}
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 font-mono text-xs text-emerald-400 font-bold select-none">&gt;</span>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Type command or message (e.g. 'Set leaf pitch to +20° and flush sap')...`}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-7 pr-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex-shrink-0"
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>EXECUTE</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: SYSTEM ACTIVITY EVENT STREAM */}
          {activeTab === 'activity' && (
            <div className="p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  Real-Time Workspace Action Log
                </span>
                <span className="text-[10px] text-emerald-400 animate-pulse">● BROADCAST ACTIVE</span>
              </div>

              <div className="h-64 overflow-y-auto rounded-lg border border-zinc-900 bg-zinc-950 p-2.5 font-mono text-xs flex flex-col gap-1.5 scanline-overlay">
                {activityLog.length === 0 ? (
                  <div className="text-center text-zinc-500 py-6 text-xs">
                    No operator actions recorded yet.
                  </div>
                ) : (
                  activityLog.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-zinc-900/60 transition-colors text-[11px] leading-snug border border-zinc-900/60 bg-zinc-900/20"
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {getActionIcon(item.actionType)}
                      </div>
                      <div className="flex-1">
                        <span className="text-zinc-500 text-[10px] mr-1.5">
                          [{item.timestamp}]
                        </span>
                        <span
                          className="font-bold mr-1"
                          style={{ color: item.operatorColor || '#10b981' }}
                        >
                          {item.operatorName}:
                        </span>
                        <span className="text-zinc-300">
                          {item.detail}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: OPERATOR ROSTER */}
          {activeTab === 'roster' && (
            <div className="p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span className="text-zinc-300 uppercase font-bold tracking-wider">
                  Active Connected Operators ({operators.length})
                </span>
                <button
                  onClick={onOpenNameModal}
                  className="text-emerald-400 hover:underline text-[10px] font-mono"
                >
                  Change Your Callsign
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {operators.map((op) => {
                  const isSelf = op.name === currentOperatorName;
                  return (
                    <div
                      key={op.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-mono transition-all ${
                        isSelf
                          ? 'border-emerald-500/80 bg-emerald-950/40 text-emerald-200 shadow-sm'
                          : 'border-zinc-800 bg-zinc-900/70 text-zinc-300'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white/20 shadow-sm"
                        style={{ backgroundColor: op.color || '#10b981' }}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-100 truncate">
                            {op.name}
                          </span>
                          {isSelf && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-800/80 text-emerald-200 font-bold ml-1 flex-shrink-0">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 truncate">
                          {op.role}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-[10px] font-mono text-zinc-500 border-t border-zinc-800/80 pt-2 flex items-center justify-between">
                <span>All connected operators share live leaf controls and audio synthesis in real time.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
