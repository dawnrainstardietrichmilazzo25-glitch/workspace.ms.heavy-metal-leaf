import React, { useState } from 'react';
import { LeafTelemetry } from '../types/bioBot';
import { audioEngine } from '../audio/synthEngine';
import plantSpecimenImg from '../assets/images/hyperaccumulator_plant_1790606113565.jpg';
import { 
  Gauge, 
  Sun, 
  Droplets, 
  BatteryCharging, 
  ShieldCheck, 
  Sliders, 
  Flame, 
  Zap,
  Camera,
  Eye,
  Maximize2,
  Sparkles,
  Leaf,
  Activity,
  Terminal
} from 'lucide-react';

interface TelemetryHUDProps {
  telemetry: LeafTelemetry;
  onUpdateTelemetry: (patch: Partial<LeafTelemetry>) => void;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  telemetry,
  onUpdateTelemetry,
}) => {
  const [showFullSpecimen, setShowFullSpecimen] = useState<boolean>(false);

  const handleAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const angle = Number(e.target.value);
    onUpdateTelemetry({ leafAngle: angle });
  };

  const handleAngleStep = (delta: number) => {
    audioEngine.playTacticalClick();
    const newAngle = Math.max(-45, Math.min(45, telemetry.leafAngle + delta));
    onUpdateTelemetry({ leafAngle: newAngle });
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Primary Bio-Robotics Dial Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Photosynthetic Yield Card */}
        <div className="rounded-lg border border-emerald-900/60 bg-zinc-950/80 p-3 shadow">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-mono flex items-center gap-1.5 text-emerald-400">
              <Sun className="h-3.5 w-3.5" />
              QUANTUM YIELD (Fv/Fm)
            </span>
            <span className="text-[9px] font-mono px-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              ● FACT (SEC. 1)
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-zinc-100">
              {telemetry.photosyntheticEfficiency.toFixed(3)}
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              ({(telemetry.photosyntheticEfficiency * 100).toFixed(1)}%)
            </span>
          </div>
          {/* Progress Bar */}
          <div className="mt-2 h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
              style={{ width: `${telemetry.photosyntheticEfficiency * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[9px] font-mono text-zinc-500">
            <span>STRESS: 0.50</span>
            <span>OPTIMAL: 0.85</span>
          </div>
        </div>

        {/* Xylem Sap Pressure (MPa) */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 shadow">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-mono flex items-center gap-1.5 text-cyan-400">
              <Droplets className="h-3.5 w-3.5" />
              XYLEM TENSION
            </span>
            <span className="text-[9px] font-mono px-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              ● FACT (SEC. 1)
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-zinc-100">
              {telemetry.sapPressure.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-zinc-400">MPa</span>
          </div>
          {/* Progress Bar */}
          <div className="mt-2 h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                telemetry.sapPressure > 2.5 ? 'bg-red-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${(telemetry.sapPressure / 3.5) * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[9px] font-mono text-zinc-500">
            <span>FLOW: {telemetry.hydraulicFlowRate.toFixed(1)} mL/min</span>
            <span>LIMIT: 3.2 MPa</span>
          </div>
        </div>

        {/* Galvanic Arc Battery */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 shadow">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-mono flex items-center gap-1.5 text-amber-400">
              <BatteryCharging className="h-3.5 w-3.5" />
              GALVANIC CAPACITOR
            </span>
            <span className="text-[9px] font-mono px-1 rounded bg-purple-950 text-purple-300 border border-purple-800">
              ★ FICTION (SEC. 3)
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-zinc-100">
              {telemetry.galvanicCharge.toFixed(0)}%
            </span>
            <span className="text-xs font-mono text-zinc-500">12.4 kV</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
              style={{ width: `${telemetry.galvanicCharge}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[9px] font-mono text-zinc-500">
            <span>DISCHARGE READY</span>
            <span>{telemetry.galvanicCharge >= 80 ? 'HIGH SURGE' : 'CHARGING'}</span>
          </div>
        </div>

        {/* Exoskeleton Hardening Index */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 shadow">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-mono flex items-center gap-1.5 text-purple-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              TITANIUM LIGNIN
            </span>
            <span className="text-[9px] font-mono px-1 rounded bg-purple-950 text-purple-300 border border-purple-800">
              ★ FICTION (SEC. 3)
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-zinc-100">
              {telemetry.exoskeletonIntegrity.toFixed(1)}%
            </span>
            <span className="text-xs font-mono text-zinc-500">ARMOR</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-400 transition-all duration-300"
              style={{ width: `${telemetry.exoskeletonIntegrity}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[9px] font-mono text-zinc-500">
            <span>ALLOY: Ti-6Al-4V + PECTIN</span>
            <span>RATING: 940 MPa</span>
          </div>
        </div>
      </div>

      {/* Heliotropic Servo Articulation Controls */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 shadow">
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <div className="flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-mono font-semibold text-zinc-200">
              HELIOTROPIC SERVO PITCH
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
              <Terminal className="h-2.5 w-2.5" />
              COMMAND DRIVEN
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
            {telemetry.leafAngle > 0 ? `+${telemetry.leafAngle}°` : `${telemetry.leafAngle}°`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleAngleStep(-5)}
            className="px-2 py-1 text-xs font-mono rounded border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 active:scale-95"
            title="Tilt Leaf Down/Left"
          >
            -5°
          </button>
          
          <input
            type="range"
            min="-45"
            max="45"
            step="1"
            value={telemetry.leafAngle}
            onChange={handleAngleChange}
            className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />

          <button
            onClick={() => handleAngleStep(5)}
            className="px-2 py-1 text-xs font-mono rounded border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 active:scale-95"
            title="Tilt Leaf Up/Right"
          >
            +5°
          </button>
          <button
            onClick={() => {
              audioEngine.playTacticalClick();
              onUpdateTelemetry({ leafAngle: 0 });
            }}
            className="px-2 py-1 text-[11px] font-mono rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
          >
            RESET
          </button>
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-mono text-zinc-500">
          <span>-45° (STORM DEFLECTION)</span>
          <span>Controlled via Chat: &quot;tilt leaf up 15 deg&quot;</span>
          <span>+45° (ZENITH HARVEST)</span>
        </div>
      </div>

      {/* Live Botanical Specimen Camera & Biosensor Telemetry */}
      <div className="rounded-lg border border-emerald-900/60 bg-zinc-950/80 p-3 shadow flex flex-col gap-2">
        <div className="flex items-center justify-between text-zinc-400">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
            <Camera className="h-3.5 w-3.5 text-emerald-400" />
            <span>LIVE SPECIMEN CULTURE CAM</span>
            <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 animate-pulse">
              ● REC
            </span>
          </div>
          <button
            onClick={() => {
              audioEngine.playTacticalClick();
              setShowFullSpecimen(!showFullSpecimen);
            }}
            className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 hover:text-emerald-300 transition-colors"
          >
            <Maximize2 className="h-2.5 w-2.5" />
            <span>{showFullSpecimen ? 'COMPACT' : 'EXPAND'}</span>
          </button>
        </div>

        {/* Specimen Viewport */}
        <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-black group">
          <img
            src={plantSpecimenImg}
            alt="Living Hyperaccumulator Specimen - Brassica with Yellow Blooms"
            className={`w-full object-cover transition-all duration-300 ${
              showFullSpecimen ? 'h-60' : 'h-32'
            }`}
            referrerPolicy="no-referrer"
          />
          {/* Futuristic HUD overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-black/30 pointer-events-none" />
          
          <div className="absolute top-2 left-2 flex items-center gap-1 text-[9px] font-mono bg-black/70 px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-300">
            <Activity className="h-2.5 w-2.5 text-emerald-400 animate-pulse" />
            <span>CH-1: +14.2 mV AP</span>
          </div>

          <div className="absolute top-2 right-2 text-[9px] font-mono bg-black/70 px-2 py-0.5 rounded border border-zinc-700 text-zinc-300">
            <span>RH 68% • 22.4°C</span>
          </div>

          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-zinc-200 bg-black/70 px-2 py-1 rounded border border-zinc-800 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 truncate">
              <Leaf className="h-3 w-3 text-emerald-400 flex-shrink-0" />
              <span className="truncate"><em>Brassica juncea</em> Hyperaccumulator</span>
            </div>
            <span className="text-amber-400 font-bold flex-shrink-0 text-[9px]">
              ROOT SEQUESTRATION ACTIVE
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
          <span>SPECIMEN ID: HYPER-09</span>
          <span>STOMATA: OPEN (380 mmol m⁻² s⁻¹)</span>
          <span>VACUOLE: 78.4 mg Cd</span>
        </div>
      </div>

      {/* Foliar Heavy Metal Hyperaccumulation Status */}
      <div className="rounded-lg border border-amber-950/60 bg-zinc-950/80 p-3 shadow">
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-xs font-mono font-semibold flex items-center gap-1.5 text-amber-400">
            <Flame className="h-3.5 w-3.5" />
            PHYTOREMEDIATION ACCUMULATOR TANKS
          </span>
          <span className="text-[11px] font-mono text-zinc-400">
            TOTAL EXTRACTED: <strong className="text-amber-300">{telemetry.totalExtractedGrams.toFixed(2)} g</strong>
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 text-center text-xs font-mono">
          <div className="rounded border border-amber-900/40 bg-zinc-900/80 p-1.5">
            <div className="text-[10px] text-zinc-500">LEAD (Pb)</div>
            <div className="text-xs font-bold text-amber-300">{telemetry.accumulatedMetals.lead.toFixed(1)} mg</div>
          </div>
          <div className="rounded border border-amber-900/40 bg-zinc-900/80 p-1.5">
            <div className="text-[10px] text-zinc-500">CADMIUM (Cd)</div>
            <div className="text-xs font-bold text-amber-300">{telemetry.accumulatedMetals.cadmium.toFixed(1)} mg</div>
          </div>
          <div className="rounded border border-cyan-900/40 bg-zinc-900/80 p-1.5">
            <div className="text-[10px] text-zinc-500">NICKEL (Ni)</div>
            <div className="text-xs font-bold text-cyan-300">{telemetry.accumulatedMetals.nickel.toFixed(1)} mg</div>
          </div>
          <div className="rounded border border-purple-900/40 bg-zinc-900/80 p-1.5">
            <div className="text-[10px] text-zinc-500">ARSENIC (As)</div>
            <div className="text-xs font-bold text-purple-300">{telemetry.accumulatedMetals.arsenic.toFixed(1)} mg</div>
          </div>
          <div className="rounded border border-red-900/40 bg-zinc-900/80 p-1.5">
            <div className="text-[10px] text-zinc-500">MERCURY (Hg)</div>
            <div className="text-xs font-bold text-red-300">{telemetry.accumulatedMetals.mercury.toFixed(1)} mg</div>
          </div>
        </div>
      </div>
    </div>
  );
};
