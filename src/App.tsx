/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { LeafTelemetry, HotspotNode, ViewLayer } from './types/bioBot';
import { CyborgLeafCanvas, HOTSPOT_NODES } from './components/CyborgLeafCanvas';
import { TelemetryHUD } from './components/TelemetryHUD';
import { OverdriveAcousticLab } from './components/OverdriveAcousticLab';
import { PhytoremediationChamber } from './components/PhytoremediationChamber';
import { NeuralBotanicCore } from './components/NeuralBotanicCore';
import { OperatorAuthModal } from './components/OperatorAuthModal';
import { ActiveOperatorsPanel } from './components/ActiveOperatorsPanel';
import { ScienceRealityModal } from './components/ScienceRealityModal';
import { useWorkspaceSync } from './hooks/useWorkspaceSync';
import { audioEngine } from './audio/synthEngine';
import { 
  Zap, 
  Activity, 
  Radio, 
  FlaskConical, 
  Bot, 
  Shield, 
  Info,
  Users,
  User,
  Sliders,
  Sparkles,
  Wifi,
  BookOpen,
  MessageSquare
} from 'lucide-react';

const STORAGE_KEY = 'ms_heavy_metal_leaf_operator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'console' | 'acoustic' | 'remediation' | 'neural'>('console');
  const [activeLayer, setActiveLayer] = useState<ViewLayer>('all');
  const [selectedNode, setSelectedNode] = useState<HotspotNode | null>(HOTSPOT_NODES[2]); // default to Midrib
  const [isZapping, setIsZapping] = useState<boolean>(false);
  const [isAcousticStimulated, setIsAcousticStimulated] = useState<boolean>(false);
  const [showBioSpecModal, setShowBioSpecModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showOperatorsDrawer, setShowOperatorsDrawer] = useState<boolean>(false);
  const [showScienceModal, setShowScienceModal] = useState<boolean>(false);

  // Operator Auth Profile
  const [operator, setOperator] = useState<{
    name: string;
    role: string;
    color: string;
  }>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse stored operator:', e);
    }
    return {
      name: '',
      role: 'Chief Bio-Bot Pilot',
      color: '#10b981',
    };
  });

  // Prompt auth modal if no operator name stored
  useEffect(() => {
    if (!operator.name) {
      setShowAuthModal(true);
    }
  }, [operator.name]);

  // Master Telemetry State
  const [telemetry, setTelemetry] = useState<LeafTelemetry>({
    photosyntheticEfficiency: 0.842,
    chlorophyllDensity: 540,
    sapPressure: 1.84,
    stomatalConductance: 0.38,
    exoskeletonIntegrity: 94.2,
    galvanicCharge: 88,
    hydraulicFlowRate: 42.8,
    acousticResonanceHz: 73.41,
    distortionGain: 85,
    leafAngle: 12,
    shieldActive: false,
    overdriveActive: false,
    purgingMetals: false,
    accumulatedMetals: {
      lead: 145.2,
      cadmium: 78.4,
      nickel: 52.1,
      arsenic: 18.0,
      mercury: 9.5,
    },
    totalExtractedGrams: 0.303,
  });

  // WebSocket Workspace Synchronization Hook
  const {
    isConnected,
    operators,
    activityLog,
    chatMessages,
    broadcastUserNameChange,
    broadcastChatMessage,
    broadcastTelemetry,
    broadcastActuator,
    broadcastChord,
    broadcastRhythm,
    broadcastRemediation,
  } = useWorkspaceSync({
    operatorName: operator.name || 'Anonymous Operator',
    operatorRole: operator.role,
    operatorColor: operator.color,
    onRemoteTelemetry: (remoteTelemetry) => {
      setTelemetry((prev) => ({
        ...prev,
        ...remoteTelemetry,
      }));
    },
    onRemoteActuator: (action, remoteOpName) => {
      if (action === 'zap') {
        setIsZapping(true);
        audioEngine.playGalvanicZap(0.4);
        setTimeout(() => setIsZapping(false), 500);
      } else if (action === 'purge') {
        audioEngine.playHydraulicPurge(0.5);
      } else if (action === 'shield') {
        audioEngine.playTacticalClick();
      } else if (action === 'stomata') {
        audioEngine.playTacticalClick();
      }
    },
    onRemoteChord: (chordName, freq, gain) => {
      audioEngine.playPowerChord(freq, 0.45, gain || 85);
      setTelemetry((prev) => ({ ...prev, acousticResonanceHz: freq }));
    },
    onRemoteRhythm: (isPlaying) => {
      setIsAcousticStimulated(isPlaying);
    },
  });

  const handleUpdateTelemetry = useCallback((patch: Partial<LeafTelemetry>) => {
    setTelemetry((prev) => {
      const updated = { ...prev, ...patch };
      return updated;
    });
    // Broadcast live telemetry change to all room operators
    broadcastTelemetry(patch);
  }, [broadcastTelemetry]);

  const handleTriggerActuator = (action: string) => {
    // Broadcast immediately over WebSockets
    broadcastActuator(action);

    if (action === 'zap') {
      audioEngine.playGalvanicZap(0.5);
      setIsZapping(true);
      handleUpdateTelemetry({
        galvanicCharge: Math.max(15, telemetry.galvanicCharge - 25),
      });
      setTimeout(() => setIsZapping(false), 500);
      setTimeout(() => {
        handleUpdateTelemetry({ galvanicCharge: Math.min(100, telemetry.galvanicCharge + 25) });
      }, 3000);
    } else if (action === 'purge') {
      audioEngine.playHydraulicPurge(0.6);
      handleUpdateTelemetry({
        sapPressure: 1.20,
        hydraulicFlowRate: 64.0,
      });
      setTimeout(() => {
        handleUpdateTelemetry({
          sapPressure: 1.84,
          hydraulicFlowRate: 42.8,
        });
      }, 2500);
    } else if (action === 'shield') {
      audioEngine.playTacticalClick();
      handleUpdateTelemetry({ shieldActive: !telemetry.shieldActive });
    } else if (action === 'stomata') {
      audioEngine.playTacticalClick();
      handleUpdateTelemetry({
        stomatalConductance: telemetry.stomatalConductance > 0.5 ? 0.38 : 0.65,
      });
    }
  };

  const handleOperatorLogin = (name: string, role: string, color: string) => {
    const profile = { name, role, color };
    setOperator(profile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Could not save operator to localStorage:', e);
    }
    broadcastUserNameChange(name, role, color);
    setShowAuthModal(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Name-Only Authentication Modal */}
      {showAuthModal && (
        <OperatorAuthModal
          onJoin={handleOperatorLogin}
          currentName={operator.name}
          isChangingName={Boolean(operator.name)}
          onCancel={operator.name ? () => setShowAuthModal(false) : undefined}
        />
      )}

      {/* Top Cybernetic Nav Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-zinc-900 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.35)]">
              <Zap className="h-5 w-5 text-emerald-200" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-wider font-heading text-zinc-100 uppercase">
                  Ms. Heavy Metal Leaf
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold hidden sm:inline">
                  COLLABORATIVE BIO-BOT ROOM
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 hidden sm:block">
                Tactical Phytoremediation • Drop-D Acoustic Overdrive • Real-Time Shared Workspace
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 p-1 text-xs font-mono">
            <button
              onClick={() => {
                audioEngine.playTacticalClick();
                setActiveTab('console');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'console'
                  ? 'bg-emerald-600 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>COMMAND DECK</span>
            </button>

            <button
              onClick={() => {
                audioEngine.playTacticalClick();
                setActiveTab('acoustic');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'acoustic'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              <span>HEAVY METAL SYNTH</span>
            </button>

            <button
              onClick={() => {
                audioEngine.playTacticalClick();
                setActiveTab('remediation');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'remediation'
                  ? 'bg-red-500 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              <span>PHYTO-CHAMBER</span>
            </button>

            <button
              onClick={() => {
                audioEngine.playTacticalClick();
                setActiveTab('neural');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'neural'
                  ? 'bg-purple-500 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Bot className="h-3.5 w-3.5" />
              <span>NEURAL AI</span>
            </button>
          </div>

          {/* Presence Roster & Active Operator Badge */}
          <div className="flex items-center gap-2">
            {/* Live Chat & Operators Room Toggle */}
            <button
              onClick={() => {
                audioEngine.playTacticalClick();
                setShowOperatorsDrawer(!showOperatorsDrawer);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                showOperatorsDrawer
                  ? 'border-emerald-500 bg-emerald-950/70 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                  : isConnected
                  ? 'border-emerald-600/70 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40'
                  : 'border-red-800 bg-red-950/40 text-red-300'
              }`}
              title="Toggle Multi-Operator Chat & Live System Deck"
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
              <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
              <span>CHAT ({chatMessages.length})</span>
            </button>

            {/* Current Operator Profile Badge */}
            <button
              onClick={() => {
                audioEngine.playTacticalClick();
                setShowAuthModal(true);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-mono hover:border-emerald-500 transition-all text-left"
              title="Click to change your Operator Call Sign"
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: operator.color || '#10b981' }}
              />
              <div className="flex flex-col">
                <span className="font-bold text-zinc-200 truncate max-w-[100px] leading-tight">
                  {operator.name || 'Set Call Sign'}
                </span>
                <span className="text-[9px] text-zinc-500 truncate max-w-[100px] leading-tight">
                  {operator.role}
                </span>
              </div>
            </button>

            {/* Science Reality Taxonomy Button */}
            <button
              onClick={() => {
                audioEngine.playTacticalClick();
                setShowScienceModal(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-500/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40 text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              title="Established Science vs. Near-Future vs. Creative Overdrive"
            >
              <FlaskConical className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden md:inline">SCIENCE VS. SCI-FI</span>
            </button>

            {/* Quick Specs / Lore Button */}
            <button
              onClick={() => {
                audioEngine.playTacticalClick();
                setShowBioSpecModal(true);
              }}
              className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-emerald-300 hover:border-emerald-700 transition-all"
              title="View Ms. Heavy Metal Leaf Blueprint & Specs"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Real-time Operator Stream Banner (if toggled or on top of workspace) */}
        {showOperatorsDrawer && (
          <div className="animate-fade-in">
            <ActiveOperatorsPanel
              operators={operators}
              activityLog={activityLog}
              chatMessages={chatMessages}
              currentOperatorName={operator.name}
              currentOperatorRole={operator.role}
              currentOperatorColor={operator.color}
              isConnected={isConnected}
              onSendMessage={broadcastChatMessage}
              onOpenNameModal={() => setShowAuthModal(true)}
            />
          </div>
        )}

        {/* Dynamic Tab Views */}
        {activeTab === 'console' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Interactive Cyborg Leaf Schematic */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <CyborgLeafCanvas
                telemetry={telemetry}
                selectedNode={selectedNode}
                onSelectNode={setSelectedNode}
                onTriggerActuator={handleTriggerActuator}
                activeLayer={activeLayer}
                setActiveLayer={setActiveLayer}
                isZapping={isZapping}
              />
            </div>

            {/* Right 5 Cols: Real-time Telemetry Gauges HUD & Active Roster */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <TelemetryHUD
                telemetry={telemetry}
                onUpdateTelemetry={handleUpdateTelemetry}
              />

              {!showOperatorsDrawer && (
                <ActiveOperatorsPanel
                  operators={operators}
                  activityLog={activityLog}
                  chatMessages={chatMessages}
                  currentOperatorName={operator.name}
                  currentOperatorRole={operator.role}
                  currentOperatorColor={operator.color}
                  isConnected={isConnected}
                  onSendMessage={broadcastChatMessage}
                  onOpenNameModal={() => setShowAuthModal(true)}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'acoustic' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <OverdriveAcousticLab
                resonanceHz={telemetry.acousticResonanceHz}
                distortionGain={telemetry.distortionGain}
                onUpdateParams={(p) => {
                  handleUpdateTelemetry(p);
                  if (p.resonanceHz) {
                    broadcastChord('Power Chord', p.resonanceHz, p.distortionGain);
                  }
                }}
                onStimulationActiveChange={(active) => {
                  setIsAcousticStimulated(active);
                  broadcastRhythm(active);
                }}
              />
            </div>
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-xl backdrop-blur flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <h4 className="text-sm font-bold font-heading text-zinc-100">
                    SHARED BIO-ACOUSTIC PHYSICS
                  </h4>
                </div>
                <div className="text-xs text-zinc-300 leading-relaxed space-y-2">
                  <p>
                    <strong>Collaborative Overdrive:</strong> When you or any connected operator strikes chords or engages the <strong>Riff Stimulator</strong>, the audio broadcast stimulates leaf stomatal dilation for the entire room.
                  </p>
                  <p>
                    Acoustic vibrations generate <strong>+45%</strong> cation extraction speed across all active decontamination chambers.
                  </p>
                </div>
              </div>

              {!showOperatorsDrawer && (
                <ActiveOperatorsPanel
                  operators={operators}
                  activityLog={activityLog}
                  chatMessages={chatMessages}
                  currentOperatorName={operator.name}
                  currentOperatorRole={operator.role}
                  currentOperatorColor={operator.color}
                  isConnected={isConnected}
                  onSendMessage={broadcastChatMessage}
                  onOpenNameModal={() => setShowAuthModal(true)}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'remediation' && (
          <div className="grid grid-cols-1 gap-6">
            <PhytoremediationChamber
              telemetry={telemetry}
              onUpdateTelemetry={handleUpdateTelemetry}
              isStimulated={isAcousticStimulated}
            />
          </div>
        )}

        {activeTab === 'neural' && (
          <div className="grid grid-cols-1 gap-6">
            <NeuralBotanicCore
              telemetry={telemetry}
              onTriggerActuator={handleTriggerActuator}
            />
          </div>
        )}
      </main>

      {/* Specifications & Bio-Lore Modal */}
      {showBioSpecModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-xl border border-emerald-700 bg-zinc-950 p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold font-heading text-zinc-100">
                  MS. HEAVY METAL LEAF — SYSTEM BLUEPRINT
                </h3>
              </div>
              <button
                onClick={() => {
                  audioEngine.playTacticalClick();
                  setShowBioSpecModal(false);
                }}
                className="text-zinc-400 hover:text-zinc-100 px-2 py-1 rounded hover:bg-zinc-800 font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono text-zinc-300 leading-relaxed">
              <div className="rounded-lg border border-emerald-800 bg-emerald-950/20 p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-emerald-400 font-bold text-xs uppercase flex items-center gap-1.5">
                    ● SECTION 1: GROUNDED SCIENTIFIC FACTS (WHAT WE CAN DO TODAY)
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">REALITY</span>
                </div>
                <ul className="text-zinc-300 space-y-1.5 text-[11px] list-disc list-inside">
                  <li><strong>Hyperaccumulation & Phytoremediation:</strong> Plants like <em>Pteris vittata</em> and <em>Noccaea caerulescens</em> naturally absorb, transport, and sequester heavy metals (Pb, Cd, Ni, As) in their biomass. Routinely deployed at EPA Superfund cleanup locations.</li>
                  <li><strong>Plant Vascular Physiology:</strong> Sap moves through xylem vessels under negative pressure (hydraulic tension), measured in megapascals (MPa). Photosynthetic quantum efficiency is measured via chlorophyll fluorescence (Fv/Fm).</li>
                  <li><strong>Bio-Sensors & Electrochemistry:</strong> Micro-electrodes read capacitive touch, bio-impedance, and action potentials from living leaves. Carbon nanotube optical sensors detect soil contaminants.</li>
                </ul>
              </div>

              <div className="rounded-lg border border-amber-800 bg-amber-950/20 p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-amber-400 font-bold text-xs uppercase flex items-center gap-1.5">
                    ▲ SECTION 2: NEAR-FUTURE FEASIBLE (WHAT WE MIGHT ACHIEVE)
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700">FEASIBLE LAB</span>
                </div>
                <ul className="text-zinc-300 space-y-1.5 text-[11px] list-disc list-inside">
                  <li><strong>Embedded Micro-Actuators on Living Leaves:</strong> Soft robotic micro-servos, shape-memory alloys, or flexible micro-solenoids along leaf midribs for active heliotropic steering. (Current lab prototypes use external mechanical arms or soft robotic grippers).</li>
                  <li><strong>Targeted Acoustic Gene Regulation:</strong> Tuning specific sound frequencies to selectively open stomatal pores and stimulate plant mechanosensitive ion channels for accelerated cation uptake.</li>
                  <li><strong>Real-Time Automated Extraction Micro-Nodes:</strong> Miniaturized lab-on-a-chip leaf sensors streaming real-time metal isotope extraction telemetry over WebSockets (current reality requires harvesting shoots for mass spectrometry ICP-MS).</li>
                </ul>
              </div>

              <div className="rounded-lg border border-purple-800 bg-purple-950/20 p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-purple-400 font-bold text-xs uppercase flex items-center gap-1.5">
                    ★ SECTION 3: PURELY FICTIONAL CONCEPTS (CREATIVE OVERDRIVE)
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-700">SCI-FI</span>
                </div>
                <ul className="text-zinc-300 space-y-1.5 text-[11px] list-disc list-inside">
                  <li><strong>Armor Transmutation:</strong> Plants synthesizing heavy metals absorbed from soil into solid titanium-lignin alloy armor plates on the cuticle (in reality, metals remain stored as non-toxic chemical salts bound to phytochelatins inside cellular vacuoles).</li>
                  <li><strong>Galvanic Tesla Arc Discharges:</strong> Discharging high-voltage (12.4 kV) electrical zaps through plant tissue (in reality, this would cause dielectric breakdown, boiling sap and destroying cellular walls instantly).</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-2 border-t border-zinc-800">
              <button
                onClick={() => {
                  audioEngine.playTacticalClick();
                  setShowBioSpecModal(false);
                  setShowScienceModal(true);
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Open Interactive Science Reality Matrix</span>
              </button>

              <button
                onClick={() => {
                  audioEngine.playTacticalClick();
                  setShowBioSpecModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-zinc-950 font-mono font-bold text-xs hover:bg-emerald-500"
              >
                CLOSE BLUEPRINT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Science Reality Taxonomy Modal */}
      <ScienceRealityModal
        isOpen={showScienceModal}
        onClose={() => setShowScienceModal(false)}
      />

      {/* Footer Status Bar */}
      <footer className="border-t border-zinc-900 bg-zinc-950 px-4 py-2.5 text-[11px] font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              WS: {isConnected ? 'SYNCHRONIZED' : 'RECONNECTING'}
            </span>
            <span className="hidden sm:inline text-zinc-600">|</span>
            <span className="hidden sm:inline">OPERATORS IN ROOM: {operators.length}</span>
            <span className="hidden sm:inline text-zinc-600">|</span>
            <span className="hidden sm:inline">XYLEM FLOW: {telemetry.hydraulicFlowRate.toFixed(1)} mL/min</span>
            <span className="hidden sm:inline text-zinc-600">|</span>
            <span className="hidden sm:inline">HARVESTED METALS: {(telemetry.totalExtractedGrams * 1000).toFixed(0)} mg</span>
          </div>

          <div className="flex items-center gap-2">
            <span>OPERATOR: <strong className="text-zinc-200">{operator.name || 'GUEST'}</strong></span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-500">AUTO-SAVING PERSISTENT ROOM</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
