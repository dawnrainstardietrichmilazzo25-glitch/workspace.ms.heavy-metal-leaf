export interface LeafTelemetry {
  photosyntheticEfficiency: number; // 0.0 - 1.0 (typical 0.75 - 0.95)
  chlorophyllDensity: number; // mg/m2 (300 - 650)
  sapPressure: number; // MPa (0.5 - 3.2)
  stomatalConductance: number; // mol m-2 s-1 (0.1 - 0.8)
  exoskeletonIntegrity: number; // 0 - 100%
  galvanicCharge: number; // 0 - 100%
  hydraulicFlowRate: number; // mL/min
  acousticResonanceHz: number; // e.g. 73.4 Hz
  distortionGain: number; // 1 - 100
  leafAngle: number; // degrees -45 to 45
  shieldActive: boolean;
  overdriveActive: boolean;
  purgingMetals: boolean;
  accumulatedMetals: {
    lead: number; // mg Pb
    cadmium: number; // mg Cd
    nickel: number; // mg Ni
    arsenic: number; // mg As
    mercury: number; // mg Hg
  };
  totalExtractedGrams: number;
}

export type ViewLayer = 'all' | 'botany' | 'cyber' | 'metals' | 'combat';

export interface HotspotNode {
  id: string;
  name: string;
  category: 'botany' | 'cyber' | 'metal' | 'combat';
  realityTier: 'fact' | 'near-future' | 'fiction';
  x: number; // percentage in SVG (0 - 100)
  y: number; // percentage in SVG (0 - 100)
  status: 'OPTIMAL' | 'ACTIVE' | 'WARNING' | 'CHARGING';
  description: string;
  scienceNote?: string;
  metrics: Record<string, string | number>;
}

export interface RemediationZone {
  id: string;
  name: string;
  threatLevel: 'CLASS-II MODERATE' | 'CLASS-III HAZARDOUS' | 'CLASS-IV CATASTROPHIC';
  description: string;
  basePpm: number;
  contaminants: {
    lead: number;
    cadmium: number;
    nickel: number;
    arsenic: number;
    mercury: number;
  };
  soilPh: number;
  radiationRads: number;
  completed: boolean;
}
