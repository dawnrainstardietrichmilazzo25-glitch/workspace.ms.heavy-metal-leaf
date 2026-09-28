/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LeafTelemetry, HotspotNode, ViewLayer } from './types/bioBot';
import { CyborgLeafCanvas, HOTSPOT_NODES } from './components/CyborgLeafCanvas';
import { TelemetryHUD } from './components/TelemetryHUD';
import { OverdriveAcousticLab } from './components/OverdriveAcousticLab';
import { PhytoremediationChamber } from './components/PhytoremediationChamber';
import { NeuralBotanicCore } from './components/NeuralBotanicCore';
import { audioEngine } from './audio/synthEngine';
import { 
  Zap, 
  Activity, 
  Radio, 
  FlaskConical, 
  Bot, 
  HelpCircle, 
  Sparkles,
  Shield, 
  Volume2, 
  VolumeX,
  Info
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'console' | 'acoustic' | 'remediation' | 'neural'>('console');
  const [activeLayer, setActiveLayer] = useState<ViewLayer>('all');
  const [selectedNode, setSelectedNode] = useState<HotspotNode | null>(HOTSPOT_NODES[2]); // default to Midrib
  const [isZapping, setIsZapping] = useState<boolean>(false);
  const [isAcousticStimulated, setIsAcousticStimulated] = useState<boolean>(false);
  const [showBioSpecModal, setShowBioSpecModal] = useState<boolean>(false);

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

  const handleUpdateTelemetry = (patch: Partial<LeafTelemetry>) => {
    setTelemetry((prev) => ({ ...prev, ...patch }));
  };

  const handleTriggerActuator = (action: string) => {
    if (action === 'zap') {
      audioEngine.playGalvanicZap(0.5);
      setIsZapping(true);
      handleUpdateTelemetry({
        galvanicCharge: Math.max(15, telemetry.galvanicCharge - 25),
      });
      setTimeout(() => setIsZapping(false), 500);
      // Slowly recharge
      setTimeout(() => {
        setTelemetry((prev) => ({ ...prev, galvanicCharge: Math.min(100, prev.galvanicCharge + 25) }));
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
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
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  CYBORG BIO-BOT PLATFORM
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 hidden sm:block">
                Tactical Phytoremediation • Drop-D Acoustic Overdrive • Autonomous Phyto-Robotics
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

          {/* Quick Specs / Lore Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                audioEngine.playTacticalClick();
                setShowBioSpecModal(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-mono text-zinc-300 hover:border-emerald-500 hover:text-emerald-300 transition-all"
              title="View Ms. Heavy Metal Leaf Blueprint & Scientific Specs"
            >
              <Info className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden md:inline">SPECIFICATIONS</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Dynamic Tab Views */}
        {activeTab === 'console' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Interactive Cyborg Leaf Schematic */}
            <div className="lg:col-span-7">
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

            {/* Right 5 Cols: Real-time Telemetry Gauges HUD */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <TelemetryHUD
                telemetry={telemetry}
                onUpdateTelemetry={handleUpdateTelemetry}
              />
            </div>
          </div>
        )}

        {activeTab === 'acoustic' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <OverdriveAcousticLab
                resonanceHz={telemetry.acousticResonanceHz}
                distortionGain={telemetry.distortionGain}
                onUpdateParams={(p) => handleUpdateTelemetry(p)}
                onStimulationActiveChange={(active) => setIsAcousticStimulated(active)}
              />
            </div>
            <div className="lg:col-span-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-xl backdrop-blur flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <h4 className="text-sm font-bold font-heading text-zinc-100">
                    BIO-ACOUSTIC PHYSICS
                  </h4>
                </div>
                <div className="text-xs text-zinc-300 leading-relaxed space-y-2">
                  <p>
                    <strong>Why Heavy Metal?</strong> In bio-hybrid robotics, acoustic frequencies between <strong>70 Hz and 110 Hz</strong> (specifically Drop-D electric guitar power chords) resonate with plant cell mechanoreceptors.
                  </p>
                  <p>
                    The physical vibration of acoustic overdrive induces micro-shear stresses along the titanium leaf margin, stimulating <em>plasma membrane H⁺-ATPase</em> pumps. This dilates stomatal apertures by <strong>+35%</strong> and accelerates heavy metal cation extraction by <strong>+45%</strong>.
                  </p>
                  <div className="rounded border border-amber-900/50 bg-amber-950/20 p-2 text-[11px] text-amber-200 font-mono">
                    ✦ TIP: Turn on the <strong>ENGAGE RIFF STIMULATOR</strong> to supercharge phytoremediation rates in the Phyto-Chamber tab!
                  </div>
                </div>
              </div>
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
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <h4 className="text-emerald-400 font-bold mb-1">
                  1. ORGANIC PHYTO-METRIC SPECIFICATIONS
                </h4>
                <p className="text-zinc-400">
                  Transgenic hybrid of <em>Noccaea caerulescens</em> (alpine pennycress) and synthetic titanium leaf lamina. Utilizes phytochelatins (PC2, PC3) to bind Cd²⁺, Pb²⁺, and Ni²⁺ into non-toxic organometallic vacuolar complexes at rates exceeding 25,000 mg/kg dry biomass.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <h4 className="text-cyan-400 font-bold mb-1">
                  2. TITANIUM-6AL-4V ROBOTIC EXOSKELETON
                </h4>
                <p className="text-zinc-400">
                  Laser-sintered titanium rib cage reinforcement with hydraulic micro-solenoids. Operates under negative xylem tension of 1.2 to 2.8 MPa, with automated cavitation relief purging.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <h4 className="text-amber-400 font-bold mb-1">
                  3. DROP-D ACOUSTIC RESONANCE ENGINE
                </h4>
                <p className="text-zinc-400">
                  Integrated piezoelectric overdrive driver utilizing non-linear waveshaper clipping at 73.41 Hz (Drop-D) to generate acoustic shockwaves that excite leaf stomatal dilation and accelerate ion pumping.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <h4 className="text-red-400 font-bold mb-1">
                  4. GALVANIC DEFENSIVE DISCHARGE
                </h4>
                <p className="text-zinc-400">
                  Dual high-voltage Tesla arc electrodes discharging up to 12.4 kV to vaporize insect herbivores, burn away invasive pathogens, and jump-start root mycorrhizal signaling.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
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

      {/* Footer Status Bar */}
      <footer className="border-t border-zinc-900 bg-zinc-950 px-4 py-2.5 text-[11px] font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              CYBORG BIO-BOT SYSTEM: NOMINAL
            </span>
            <span className="hidden sm:inline text-zinc-600">|</span>
            <span className="hidden sm:inline">XYLEM FLOW: {telemetry.hydraulicFlowRate.toFixed(1)} mL/min</span>
            <span className="hidden sm:inline text-zinc-600">|</span>
            <span className="hidden sm:inline">HARVESTED METALS: {(telemetry.totalExtractedGrams * 1000).toFixed(0)} mg</span>
          </div>

          <div className="flex items-center gap-2">
            <span>FIRMWARE: HM-LEAF v4.09</span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-500">HEAVY METAL PHYTOMATRIX</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
