import React, { useState } from 'react';
import { audioEngine } from '../audio/synthEngine';
import plantSpecimenImg from '../assets/images/hyperaccumulator_plant_1790606113565.jpg';
import { 
  CheckCircle2, 
  Clock, 
  Flame, 
  FlaskConical, 
  ExternalLink, 
  ShieldAlert, 
  Sparkles, 
  Info, 
  Cpu, 
  Leaf, 
  Zap,
  Layers,
  Camera
} from 'lucide-react';

interface ScienceRealityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScienceRealityModal: React.FC<ScienceRealityModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'facts' | 'future' | 'fiction'>('all');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl border border-emerald-600/80 bg-zinc-950 p-6 shadow-[0_0_60px_rgba(16,185,129,0.25)] max-h-[90vh] overflow-y-auto flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-zinc-900 border border-emerald-400">
              <FlaskConical className="h-5 w-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-zinc-100 tracking-wide uppercase">
                Technology Readiness & Scientific Fact Breakdown
              </h2>
              <p className="text-[11px] font-mono text-zinc-400">
                Separating established botanical facts, near-future engineering, and creative overdrive
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.playTacticalClick();
              onClose();
            }}
            className="text-zinc-400 hover:text-zinc-100 px-2 py-1 rounded hover:bg-zinc-800 font-mono text-sm"
          >
            ✕
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 p-1 text-xs font-mono">
          <button
            onClick={() => {
              audioEngine.playTacticalClick();
              setActiveTab('all');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-zinc-800 text-zinc-100 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ALL SECTIONS
          </button>
          <button
            onClick={() => {
              audioEngine.playTacticalClick();
              setActiveTab('facts');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'facts'
                ? 'bg-emerald-600 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-emerald-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            SECTION 1: GROUNDED FACTS (TODAY)
          </button>
          <button
            onClick={() => {
              audioEngine.playTacticalClick();
              setActiveTab('future');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'future'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-amber-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            SECTION 2: NEAR-FUTURE (FEASIBLE)
          </button>
          <button
            onClick={() => {
              audioEngine.playTacticalClick();
              setActiveTab('fiction');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'fiction'
                ? 'bg-purple-600 text-zinc-100 font-bold'
                : 'text-zinc-400 hover:text-purple-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            SECTION 3: CREATIVE OVERDRIVE
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col gap-4 text-xs font-mono">
          {/* SECTION 1: GROUNDED FACTS */}
          {(activeTab === 'all' || activeTab === 'facts') && (
            <div className="rounded-xl border border-emerald-800/80 bg-emerald-950/20 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-emerald-900/50 pb-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>SECTION 1: GROUNDED SCIENTIFIC FACTS (WHAT WE CAN DO TODAY)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700">
                  REAL-WORLD SCIENCE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-emerald-900/40 bg-zinc-900/80 p-3 flex flex-col gap-1.5">
                  <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                    <Leaf className="h-3.5 w-3.5 text-emerald-400" />
                    1. Hyperaccumulation
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    Plants like <em>Pteris vittata</em> (Chinese brake fern) and <em>Noccaea caerulescens</em> naturally absorb and store heavy metals like lead (Pb), cadmium (Cd), nickel (Ni), and arsenic (As) in their cellular biomass.
                  </p>
                  <div className="mt-auto text-[10px] text-zinc-500 pt-1 border-t border-zinc-800">
                    Application: Routinely deployed at EPA Superfund cleanup sites.
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-900/40 bg-zinc-900/80 p-3 flex flex-col gap-1.5">
                  <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-emerald-400" />
                    2. Vascular Physiology
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    Plants transport sap through xylem vessels under negative pressure (hydraulic tension), measured in <strong>megapascals (MPa)</strong>. Photosynthetic efficiency is evaluated using chlorophyll fluorescence (<strong>Fv/Fm</strong>).
                  </p>
                  <div className="mt-auto text-[10px] text-zinc-500 pt-1 border-t border-zinc-800">
                    Application: Standard real-world botanical & agronomic measurement.
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-900/40 bg-zinc-900/80 p-3 flex flex-col gap-1.5">
                  <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-emerald-400" />
                    3. Plant Electrochemistry
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    Micro-electrodes read capacitive touch, action potentials, and bio-impedance directly from living leaves. Carbon nanotube optical sensors inside leaf tissue detect trace soil toxins under infrared imaging.
                  </p>
                  <div className="mt-auto text-[10px] text-zinc-500 pt-1 border-t border-zinc-800">
                    Application: Real-world MIT plant-nanobionic sensor research.
                  </div>
                </div>
              </div>

              {/* Living Specimen Photographic Evidence Banner */}
              <div className="rounded-lg border border-emerald-900/50 bg-zinc-900/70 p-3 flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:w-44 h-28 rounded-lg overflow-hidden border border-zinc-800 flex-shrink-0">
                  <img
                    src={plantSpecimenImg}
                    alt="Living Hyperaccumulating Plant Test Bed"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1 left-1.5 text-[8px] font-mono bg-black/70 px-1.5 py-0.2 rounded text-emerald-300 border border-emerald-500/30">
                    REAL BOTANICAL SPECIMEN
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-1 text-[11px]">
                  <span className="font-bold text-emerald-300 flex items-center gap-1">
                    <Camera className="h-3 w-3 text-emerald-400" />
                    Ground Truth: Living Phytoremediation Test Bed
                  </span>
                  <p className="text-zinc-300 leading-relaxed">
                    Living cruciferous plants (<em>Brassica</em> / mustard family with signature yellow four-petal blooms and serrated leaves) grown in square soil planters are real-world bio-accumulators that concentrate heavy metals into foliar tissue.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: NEAR-FUTURE FEASIBLE */}
          {(activeTab === 'all' || activeTab === 'future') && (
            <div className="rounded-xl border border-amber-800/80 bg-amber-950/20 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-amber-900/50 pb-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Clock className="h-4 w-4" />
                  <span>SECTION 2: NEAR-FUTURE FEASIBLE ENGINEERING (WHAT WE MIGHT ACHIEVE)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-700">
                  FEASIBLE LAB STAGE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-amber-900/40 bg-zinc-900/80 p-3 flex flex-col gap-1.5">
                  <div className="text-amber-300 font-bold">
                    1. Embedded Micro-Actuators
                  </div>
                  <div className="text-[10px] text-amber-400 font-semibold">Future Possibility:</div>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    Soft robotic micro-servos, shape-memory alloys, or flexible micro-solenoids grafted onto leaf midribs to actively steer leaves toward sunlight (heliotropism) or close them before storms.
                  </p>
                  <div className="mt-auto text-[10px] text-zinc-500 pt-1 border-t border-zinc-800">
                    Current Reality: Lab prototypes currently use external mechanical arms or soft robotic grippers rather than direct grafted solenoids.
                  </div>
                </div>

                <div className="rounded-lg border border-amber-900/40 bg-zinc-900/80 p-3 flex flex-col gap-1.5">
                  <div className="text-amber-300 font-bold">
                    2. Targeted Acoustic Gene Regulation
                  </div>
                  <div className="text-[10px] text-amber-400 font-semibold">Future Possibility:</div>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    Tuning specific sound frequencies to selectively open stomatal pores and stimulate mechanosensitive ion channels, accelerating nutrient and heavy metal absorption on demand.
                  </p>
                  <div className="mt-auto text-[10px] text-zinc-500 pt-1 border-t border-zinc-800">
                    Current Reality: Plant cells demonstrably respond to sound waves, but tuning continuous high-intensity acoustic loops for precise percentage boosts remains experimental.
                  </div>
                </div>

                <div className="rounded-lg border border-amber-900/40 bg-zinc-900/80 p-3 flex flex-col gap-1.5">
                  <div className="text-amber-300 font-bold">
                    3. Real-Time Lab-on-a-Chip Micro-Nodes
                  </div>
                  <div className="text-[10px] text-amber-400 font-semibold">Future Possibility:</div>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    Miniaturized leaf sensors continuously measuring milligram-level soil extraction of metal isotopes in real time, streaming telemetry over WebSockets.
                  </p>
                  <div className="mt-auto text-[10px] text-zinc-500 pt-1 border-t border-zinc-800">
                    Current Reality: Precise metal measurement currently requires harvesting plant shoots and analyzing them with mass spectrometers (ICP-MS).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: CREATIVE OVERDRIVE */}
          {(activeTab === 'all' || activeTab === 'fiction') && (
            <div className="rounded-xl border border-purple-800/80 bg-purple-950/20 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-purple-900/50 pb-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>SECTION 3: PURELY FICTIONAL CONCEPTS (CREATIVE OVERDRIVE)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700">
                  SCI-FI / OVERDRIVE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-purple-900/40 bg-zinc-900/80 p-3 flex flex-col gap-1.5">
                  <div className="text-purple-300 font-bold">
                    ✦ Armor Transmutation
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    <strong>Creative Concept:</strong> Plants synthesizing heavy metals absorbed from soil into solid titanium-lignin alloy armor plates on the outer cuticle.
                  </p>
                  <div className="text-[11px] text-purple-300/90 pt-1 border-t border-zinc-800">
                    <strong>Scientific Truth:</strong> In living biology, absorbed heavy metals remain chemically sequestered as non-toxic chemical salts bound to phytochelatins inside cellular vacuoles, not crystallized armor plating.
                  </div>
                </div>

                <div className="rounded-lg border border-purple-900/40 bg-zinc-900/80 p-3 flex flex-col gap-1.5">
                  <div className="text-purple-300 font-bold">
                    ✦ Galvanic Tesla Arc Discharges
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    <strong>Creative Concept:</strong> Discharging high-voltage (12.4 kV) electrical zaps through plant tissue to incinerate pests and jump-start mycorrhizal roots.
                  </p>
                  <div className="text-[11px] text-purple-300/90 pt-1 border-t border-zinc-800">
                    <strong>Scientific Truth:</strong> A 12.4 kV electrical discharge through living plant tissue would cause catastrophic dielectric breakdown, boiling vascular sap and incinerating cellular walls instantly.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-xs font-mono">
          <span className="text-zinc-500">
            Ms. Heavy Metal Leaf • Scientific Taxonomy Matrix
          </span>
          <button
            onClick={() => {
              audioEngine.playTacticalClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-zinc-950 font-bold hover:bg-emerald-500 transition-all"
          >
            ACKNOWLEDGE SPECIFICATION
          </button>
        </div>
      </div>
    </div>
  );
};
