import React, { useState, useEffect } from 'react';
import { ViewLayer, HotspotNode, LeafTelemetry } from '../types/bioBot';
import { audioEngine } from '../audio/synthEngine';
import { 
  Zap, 
  Cpu, 
  Leaf, 
  ShieldAlert, 
  Radio, 
  Activity,
  Layers, 
  Maximize2
} from 'lucide-react';

interface CyborgLeafCanvasProps {
  telemetry: LeafTelemetry;
  selectedNode: HotspotNode | null;
  onSelectNode: (node: HotspotNode | null) => void;
  onTriggerActuator: (action: string) => void;
  activeLayer: ViewLayer;
  setActiveLayer: (layer: ViewLayer) => void;
  isZapping: boolean;
}

export const HOTSPOT_NODES: HotspotNode[] = [
  {
    id: 'apical-spire',
    name: 'Apical Sensor Spire',
    category: 'cyber',
    x: 50,
    y: 9,
    status: 'OPTIMAL',
    description: 'Tungsten-carbide apex probe equipped with lidar atmospheric telemetry and sun-tracking heliotropic guidance.',
    metrics: {
      'Lidar Range': '14.2 m',
      'Solar Azimuth': '182.4°',
      'Structural Tensile': '980 MPa',
    },
  },
  {
    id: 'chloroplast-core',
    name: 'Chloroplast Quantum Matrix',
    category: 'botany',
    x: 36,
    y: 35,
    status: 'OPTIMAL',
    description: 'Genetically enhanced bio-photovoltaic thylakoid stacks transducing solar photons into bio-galvanic storage.',
    metrics: {
      'Quantum Yield (Fv/Fm)': '0.842',
      'Chlorophyll Density': '540 mg/m²',
      'ATP Synthesis': '38.4 mmol/s',
    },
  },
  {
    id: 'midrib-solenoid',
    name: 'Primary Midrib Hydraulic Truss',
    category: 'cyber',
    x: 50,
    y: 52,
    status: 'ACTIVE',
    description: 'Titanium-reinforced central vascular spine with high-pressure micro-solenoids pumping heavy-metal enriched sap.',
    metrics: {
      'Hydraulic Sap Tension': '1.84 MPa',
      'Flow Velocity': '42.8 mL/min',
      'Exoskeleton Load': '18.2 kN',
    },
  },
  {
    id: 'metal-vacuole',
    name: 'Cadmium-Lead Sequestration Matrix',
    category: 'metal',
    x: 64,
    y: 45,
    status: 'ACTIVE',
    description: 'Phytochelatin vacuolar chambers converting toxic soil heavy metals into crystallized metallic lattice plates.',
    metrics: {
      'Cadmium Saturation': '78.2%',
      'Lead Sequestration': '145 mg/g',
      'Phytochelatin Synthase': '+45%',
    },
  },
  {
    id: 'stomata-valves',
    name: 'Galvanic Stomatal Micro-Valves',
    category: 'botany',
    x: 33,
    y: 65,
    status: 'OPTIMAL',
    description: 'Piezoelectric micro-apertures regulating CO2 transpiration, water retention, and acoustic frequency intake.',
    metrics: {
      'Aperture Width': '8.4 µm',
      'Conductance (gs)': '0.38 mol/(m²·s)',
      'Acoustic Dilation': '+22%',
    },
  },
  {
    id: 'arc-prongs',
    name: 'Tesla Arc Emitters (Overdrive Deflectors)',
    category: 'combat',
    x: 66,
    y: 72,
    status: 'CHARGING',
    description: 'High-voltage galvanic electrodes discharging defensive electric arcs and sonic shockwaves to vaporize pests.',
    metrics: {
      'Capacitor Bank': '12.4 kV',
      'Pulse Resonance': '73.4 Hz',
      'Discharge Readiness': 'READY',
    },
  },
  {
    id: 'petiole-dock',
    name: 'Petiole Hydraulic Quick-Dock',
    category: 'cyber',
    x: 50,
    y: 91,
    status: 'OPTIMAL',
    description: 'Robotic petiole articulation joint connecting Ms. Heavy Metal Leaf to root anchors or autonomous rover mounts.',
    metrics: {
      'Pitch Articulation': '-12°',
      'Servo Torque': '65 Nm',
      'Mycorrhizal Link': 'SYNCED',
    },
  },
];

export const CyborgLeafCanvas: React.FC<CyborgLeafCanvasProps> = ({
  telemetry,
  selectedNode,
  onSelectNode,
  onTriggerActuator,
  activeLayer,
  setActiveLayer,
  isZapping,
}) => {
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase((prev) => (prev + 1) % 100);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const handleHotspotClick = (node: HotspotNode) => {
    audioEngine.playTacticalClick();
    onSelectNode(node.id === selectedNode?.id ? null : node);
  };

  const getLayerFilter = (node: HotspotNode) => {
    if (activeLayer === 'all') return true;
    if (activeLayer === 'botany' && (node.category === 'botany' || node.category === 'metal')) return true;
    if (activeLayer === 'cyber' && node.category === 'cyber') return true;
    if (activeLayer === 'metals' && node.category === 'metal') return true;
    if (activeLayer === 'combat' && node.category === 'combat') return true;
    return false;
  };

  return (
    <div className="relative flex flex-col h-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-2xl backdrop-blur overflow-hidden">
      {/* Top Controls & Layer Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-950/80 border border-emerald-600/40 text-emerald-400">
            <Activity className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide font-heading text-zinc-100 flex items-center gap-2">
              CYBERNETIC LEAF MORPHOLOGY
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                REV 4.09
              </span>
            </h2>
            <p className="text-[11px] font-mono text-zinc-400">
              Interactive Phyto-Robotic Anatomy & Real-time Actuators
            </p>
          </div>
        </div>

        {/* View Layers Switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/90 p-1 text-xs font-mono">
          <Layers className="h-3.5 w-3.5 text-zinc-500 ml-1 mr-0.5" />
          {(['all', 'botany', 'cyber', 'metals', 'combat'] as ViewLayer[]).map((layer) => (
            <button
              key={layer}
              onClick={() => {
                audioEngine.playTacticalClick();
                setActiveLayer(layer);
              }}
              className={`px-2 py-1 rounded transition-colors text-[11px] font-semibold uppercase ${
                activeLayer === layer
                  ? 'bg-emerald-600 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {layer === 'all' ? 'All' : layer}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Leaf Visualizer Viewport */}
      <div className="relative flex-1 min-h-[380px] w-full flex items-center justify-center rounded-lg border border-emerald-950/40 bg-radial from-zinc-900/60 via-zinc-950/90 to-black p-2 overflow-hidden">
        {/* Background Grid & Compass Reticle */}
        <div className="absolute inset-0 cyber-grid opacity-40 pointer-events-none" />

        {/* Target Reticle Circular Overlays */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-[340px] h-[340px] rounded-full border border-dashed border-emerald-500 animate-spin" style={{ animationDuration: '60s' }} />
          <div className="absolute w-[240px] h-[240px] rounded-full border border-emerald-400/40" />
        </div>

        {/* Electric Arc Flash Overlay when Zap is active */}
        {isZapping && (
          <div className="absolute inset-0 bg-emerald-400/20 backdrop-invert-0 z-20 pointer-events-none animate-pulse flex items-center justify-center">
            <div className="text-emerald-300 font-mono text-xl font-black tracking-widest bg-zinc-950/90 px-4 py-2 rounded border border-emerald-400 shadow-2xl">
              ⚡ 12.4 kV GALVANIC ARC DISCHARGED ⚡
            </div>
          </div>
        )}

        {/* Shield Overlay */}
        {telemetry.shieldActive && (
          <div className="absolute inset-8 rounded-full border-2 border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_50px_rgba(16,185,129,0.35)] pointer-events-none animate-pulse z-10" />
        )}

        {/* Main SVG Schematic */}
        <div 
          className="relative w-full max-w-[420px] aspect-[3/4] max-h-[500px] flex items-center justify-center transition-transform duration-300"
          style={{ transform: `rotate(${telemetry.leafAngle}deg)` }}
        >
          <svg
            viewBox="0 0 400 520"
            className="w-full h-full drop-shadow-[0_0_20px_rgba(16,185,129,0.25)] select-none"
          >
            <defs>
              {/* Botanical Leaf Gradient */}
              <linearGradient id="leafBioGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#064e3b" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#022c22" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#051e18" stopOpacity="0.95" />
              </linearGradient>

              {/* Titanium Exoskeleton Gradient */}
              <linearGradient id="titaniumGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="50%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              {/* Heavy Metal Crystallization Gradient */}
              <linearGradient id="metalDepositGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#b45309" stopOpacity="0.7" />
              </linearGradient>

              {/* Vascular Glow */}
              <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* BASE BOTANICAL LEAF BODY (Lanceolate Organic Lamina) */}
            <path
              d="M 200 40 
                 C 270 90, 360 180, 340 310
                 C 320 400, 260 450, 200 480
                 C 140 450, 80 400, 60 310
                 C 40 180, 130 90, 200 40 Z"
              fill="url(#leafBioGrad)"
              stroke="#047857"
              strokeWidth="2.5"
              className={activeLayer === 'cyber' ? 'opacity-30' : 'opacity-100'}
            />

            {/* SERRATED TITANIUM MARGINAL BLADES (Industrial Exoskeleton Teeth) */}
            {(activeLayer === 'all' || activeLayer === 'cyber' || activeLayer === 'combat') && (
              <g stroke="#94a3b8" strokeWidth="1.8" fill="#1e293b">
                {/* Left Serration Blades */}
                <polygon points="120,110 80,135 110,145" />
                <polygon points="85,175 45,205 78,215" />
                <polygon points="62,250 25,285 58,295" />
                <polygon points="68,335 38,365 72,372" />
                <polygon points="100,410 75,435 108,438" />

                {/* Right Serration Blades */}
                <polygon points="280,110 320,135 290,145" />
                <polygon points="315,175 355,205 322,215" />
                <polygon points="338,250 375,285 342,295" />
                <polygon points="332,335 362,365 328,372" />
                <polygon points="300,410 325,435 292,438" />
              </g>
            )}

            {/* QUANTUM CHLOROPLAST ARRAYS (Hexagonal Bio-Chips) */}
            {(activeLayer === 'all' || activeLayer === 'botany') && (
              <g opacity="0.6" stroke="#10b981" strokeWidth="0.8" fill="#064e3b">
                {/* Left Mesophyll Quantum Nodes */}
                <circle cx="150" cy="180" r="14" fill="#047857" opacity="0.4" />
                <circle cx="120" cy="240" r="18" fill="#047857" opacity="0.5" />
                <circle cx="135" cy="310" r="16" fill="#047857" opacity="0.4" />
                <circle cx="160" cy="370" r="15" fill="#047857" opacity="0.3" />

                {/* Right Mesophyll Quantum Nodes */}
                <circle cx="250" cy="180" r="14" fill="#047857" opacity="0.4" />
                <circle cx="280" cy="240" r="18" fill="#047857" opacity="0.5" />
                <circle cx="265" cy="310" r="16" fill="#047857" opacity="0.4" />
                <circle cx="240" cy="370" r="15" fill="#047857" opacity="0.3" />
              </g>
            )}

            {/* HEAVY METAL HYPERACCUMULATION VACUOLE PODS (Lead / Cadmium Sequestration) */}
            {(activeLayer === 'all' || activeLayer === 'metals') && (
              <g>
                {/* Cadmium Pod Left */}
                <rect x="135" y="275" width="28" height="18" rx="4" fill="url(#metalDepositGrad)" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="149" y="288" fill="#050707" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Cd-48</text>

                {/* Lead Pod Right */}
                <rect x="238" y="260" width="28" height="18" rx="4" fill="url(#metalDepositGrad)" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="252" y="273" fill="#050707" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Pb-82</text>

                {/* Nickel Pod Top Right */}
                <rect x="215" y="195" width="26" height="16" rx="3" fill="#64748b" stroke="#38bdf8" strokeWidth="1.2" />
                <text x="228" y="206" fill="#050707" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Ni-28</text>
              </g>
            )}

            {/* SECONDARY LATERAL VASCULAR VEINS (Micro-circuit & Sap conduits) */}
            <g stroke="#10b981" strokeWidth="2" strokeLinecap="round" filter="url(#glowGreen)" opacity="0.85">
              {/* Branch Left 1 */}
              <path d="M 200 120 Q 150 140 100 130" strokeDasharray="4 2" />
              {/* Branch Right 1 */}
              <path d="M 200 120 Q 250 140 300 130" strokeDasharray="4 2" />

              {/* Branch Left 2 */}
              <path d="M 200 190 Q 130 220 70 200" strokeDasharray="6 2" />
              {/* Branch Right 2 */}
              <path d="M 200 190 Q 270 220 330 200" strokeDasharray="6 2" />

              {/* Branch Left 3 */}
              <path d="M 200 270 Q 120 300 55 280" />
              {/* Branch Right 3 */}
              <path d="M 200 270 Q 280 300 345 280" />

              {/* Branch Left 4 */}
              <path d="M 200 350 Q 130 380 75 365" strokeDasharray="5 3" />
              {/* Branch Right 4 */}
              <path d="M 200 350 Q 270 380 325 365" strokeDasharray="5 3" />

              {/* Branch Left 5 */}
              <path d="M 200 420 Q 160 440 110 430" />
              {/* Branch Right 5 */}
              <path d="M 200 420 Q 240 440 290 430" />
            </g>

            {/* CYBERNETIC TITANIUM TRUSSES & MIDRIB EXOSKELETON */}
            {(activeLayer === 'all' || activeLayer === 'cyber' || activeLayer === 'combat') && (
              <g>
                {/* Central Midrib Piston Housing */}
                <path
                  d="M 194 50 L 206 50 L 210 475 L 190 475 Z"
                  fill="url(#titaniumGrad)"
                  stroke="#94a3b8"
                  strokeWidth="2"
                />

                {/* Internal Hydraulic Core Conduit (Glowing sap pump line) */}
                <line
                  x1="200"
                  y1="55"
                  x2="200"
                  y2="470"
                  stroke="#34d399"
                  strokeWidth="4"
                  strokeDasharray="12 4"
                  strokeDashoffset={-pulsePhase * 2}
                />

                {/* Hydraulic Micro-Solenoid Rings */}
                {[110, 170, 230, 290, 350, 410].map((yVal, i) => (
                  <g key={i}>
                    <rect
                      x="188"
                      y={yVal}
                      width="24"
                      height="10"
                      rx="2"
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                    <circle cx="200" cy={yVal + 5} r="2.5" fill="#38bdf8" />
                  </g>
                ))}
              </g>
            )}

            {/* TESLA ARC EMITTERS (Near petiole base) */}
            <g>
              {/* Left Arc Horn */}
              <path d="M 160 440 L 140 455 L 135 440" stroke="#f59e0b" strokeWidth="2.5" fill="none" />
              {/* Right Arc Horn */}
              <path d="M 240 440 L 260 455 L 265 440" stroke="#f59e0b" strokeWidth="2.5" fill="none" />
              
              {/* Lightning spark path if zapping */}
              {isZapping && (
                <path
                  d="M 135 440 L 150 420 L 180 435 L 200 400 L 220 435 L 250 420 L 265 440"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  fill="none"
                  filter="url(#glowGreen)"
                />
              )}
            </g>

            {/* APICAL PROBE SPIRE (Apex tip) */}
            <g>
              <polygon points="200,15 194,50 206,50" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
              <circle cx="200" cy="22" r="3" fill="#ef4444" className="animate-ping" />
              <circle cx="200" cy="22" r="2" fill="#f87171" />
            </g>

            {/* PETIOLE CYBER-DOCK & MECHANICAL ROOT PORT (Base) */}
            <g>
              <rect x="186" y="475" width="28" height="35" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
              <line x1="192" y1="485" x2="208" y2="485" stroke="#34d399" strokeWidth="2" />
              <line x1="192" y1="495" x2="208" y2="495" stroke="#34d399" strokeWidth="2" />
              <circle cx="200" cy="502" r="3.5" fill="#f59e0b" />
            </g>

            {/* INTERACTIVE HOTSPOT TARGET NODES */}
            {HOTSPOT_NODES.filter(getLayerFilter).map((node) => {
              const isSelected = selectedNode?.id === node.id;
              // Map x/y percentages to SVG 400x520
              const svgX = (node.x / 100) * 400;
              const svgY = (node.y / 100) * 520;

              return (
                <g
                  key={node.id}
                  className="cursor-pointer group"
                  onClick={() => handleHotspotClick(node)}
                >
                  {/* Outer pulsating ring */}
                  <circle
                    cx={svgX}
                    cy={svgY}
                    r={isSelected ? 18 : 12}
                    fill={isSelected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.15)'}
                    stroke={isSelected ? '#34d399' : '#10b981'}
                    strokeWidth={isSelected ? 2 : 1}
                    className="transition-all duration-200 group-hover:scale-125"
                  />

                  {/* Inner Core */}
                  <circle
                    cx={svgX}
                    cy={svgY}
                    r={isSelected ? 6 : 4.5}
                    fill={
                      node.category === 'combat'
                        ? '#ef4444'
                        : node.category === 'metal'
                        ? '#f59e0b'
                        : node.category === 'cyber'
                        ? '#38bdf8'
                        : '#10b981'
                    }
                  />

                  {/* Node Name Indicator label */}
                  <text
                    x={svgX + (svgX > 200 ? 16 : -16)}
                    y={svgY + 4}
                    fill="#e2e8f0"
                    fontSize="9"
                    fontWeight="600"
                    fontFamily="monospace"
                    textAnchor={svgX > 200 ? 'start' : 'end'}
                    className="pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] opacity-80 group-hover:opacity-100"
                  >
                    {node.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Selected Hotspot Inspector Panel */}
      {selectedNode ? (
        <div className="mt-3 rounded-lg border border-emerald-800/80 bg-zinc-900/90 p-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                selectedNode.category === 'combat' ? 'bg-red-500' :
                selectedNode.category === 'metal' ? 'bg-amber-400' :
                selectedNode.category === 'cyber' ? 'bg-cyan-400' : 'bg-emerald-400'
              }`} />
              <h4 className="text-xs font-bold font-mono tracking-wide text-zinc-100">
                {selectedNode.name}
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                STATUS: <strong className="text-emerald-400">{selectedNode.status}</strong>
              </span>
              <button
                onClick={() => onSelectNode(null)}
                className="text-xs font-mono text-zinc-400 hover:text-zinc-200 px-1.5 py-0.5 rounded hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>
          </div>
          <p className="text-xs text-zinc-300 mb-2.5 leading-relaxed">
            {selectedNode.description}
          </p>

          <div className="grid grid-cols-3 gap-2">
            {Object.entries(selectedNode.metrics).map(([k, v]) => (
              <div key={k} className="rounded border border-zinc-800 bg-zinc-950 p-1.5 text-center">
                <div className="text-[9px] uppercase font-mono text-zinc-500 truncate">{k}</div>
                <div className="text-xs font-mono font-bold text-emerald-300">{v}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-2.5 text-center text-xs font-mono text-zinc-500">
          Click any illuminated node or actuator on Ms. Heavy Metal Leaf for deep telemetry and diagnostics.
        </div>
      )}

      {/* Actuator Quick Action Buttons */}
      <div className="mt-3 grid grid-cols-4 gap-2 pt-2 border-t border-zinc-800/60">
        <button
          onClick={() => onTriggerActuator('zap')}
          className="flex flex-col items-center justify-center gap-1 rounded border border-amber-600/40 bg-amber-950/30 p-2 hover:bg-amber-900/50 hover:border-amber-500 transition-all text-amber-300"
          title="Discharge 12.4 kV Tesla Coil Arc"
        >
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-[10px] font-mono font-bold tracking-wider">GALVANIC ARC</span>
        </button>

        <button
          onClick={() => onTriggerActuator('purge')}
          className="flex flex-col items-center justify-center gap-1 rounded border border-cyan-600/40 bg-cyan-950/30 p-2 hover:bg-cyan-900/50 hover:border-cyan-500 transition-all text-cyan-300"
          title="Flush Xylem Hydraulic Sap Lines"
        >
          <Cpu className="h-4 w-4 text-cyan-400" />
          <span className="text-[10px] font-mono font-bold tracking-wider">HYDRAULIC PURGE</span>
        </button>

        <button
          onClick={() => onTriggerActuator('shield')}
          className={`flex flex-col items-center justify-center gap-1 rounded border p-2 transition-all ${
            telemetry.shieldActive
              ? 'border-emerald-500 bg-emerald-900/60 text-emerald-200'
              : 'border-emerald-900/50 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/40'
          }`}
          title="Toggle Phyto-Chitin Energy Shield"
        >
          <ShieldAlert className="h-4 w-4" />
          <span className="text-[10px] font-mono font-bold tracking-wider">
            {telemetry.shieldActive ? 'SHIELD ON' : 'ENERGY SHIELD'}
          </span>
        </button>

        <button
          onClick={() => onTriggerActuator('stomata')}
          className="flex flex-col items-center justify-center gap-1 rounded border border-emerald-600/40 bg-emerald-950/30 p-2 hover:bg-emerald-900/50 hover:border-emerald-500 transition-all text-emerald-300"
          title="Cycle Stomatal Micro-Valves"
        >
          <Leaf className="h-4 w-4 text-emerald-400" />
          <span className="text-[10px] font-mono font-bold tracking-wider">VENT STOMATA</span>
        </button>
      </div>
    </div>
  );
};
