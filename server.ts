import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Data persistence directory and file
const DATA_DIR = path.resolve(__dirname, 'data');
const STATE_FILE = path.resolve(DATA_DIR, 'workspace_state.json');

// Default initial state
const defaultWorkspaceState = {
  telemetry: {
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
  },
  activeZoneId: 'zone-chernobyl',
  isExtracting: false,
  currentPpm: 1250,
  acousticResonanceHz: 73.41,
  distortionGain: 85,
  isRhythmPlaying: false,
  chatHistory: [] as Array<{
    id: string;
    userId: string;
    senderName: string;
    role: string;
    avatarColor: string;
    text: string;
    timestamp: string;
  }>,
  updatedAt: Date.now(),
};

// In-memory workspace state
let currentWorkspaceState = { ...defaultWorkspaceState };
let activityLog: Array<{
  id: string;
  timestamp: string;
  operatorName: string;
  operatorColor: string;
  actionType: string;
  detail: string;
}> = [
  {
    id: 'init-activity',
    timestamp: new Date().toLocaleTimeString(),
    operatorName: 'SYSTEM',
    operatorColor: '#10b981',
    actionType: 'presence',
    detail: 'Ms. Heavy Metal Leaf Real-Time Collaborative Workspace initialized.',
  },
];

// Load persisted state if exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(STATE_FILE)) {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.telemetry) {
      currentWorkspaceState = { ...defaultWorkspaceState, ...parsed };
      console.log('Restored persistent workspace state from disk.');
    }
  }
} catch (err) {
  console.warn('Could not read state file, using default state:', err);
}

// Throttled persistence helper
let saveTimeout: NodeJS.Timeout | null = null;
function persistWorkspaceStateThrottled() {
  if (saveTimeout) return;
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STATE_FILE, JSON.stringify(currentWorkspaceState, null, 2));
    } catch (e) {
      console.error('Failed to auto-save workspace state:', e);
    }
  }, 1500);
}

// Connected operators tracking
interface ClientMetadata {
  id: string;
  name: string;
  role: string;
  color: string;
  joinedAt: number;
}
const connectedOperators = new Map<WebSocket, ClientMetadata>();

function broadcast(msg: any, excludeWs?: WebSocket) {
  const payload = JSON.stringify(msg);
  connectedOperators.forEach((_, ws) => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

function broadcastOperatorsList() {
  const operators = Array.from(connectedOperators.values());
  broadcast({
    type: 'operators_update',
    operators,
  });
}

function addActivityItem(operatorName: string, operatorColor: string, actionType: string, detail: string) {
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toLocaleTimeString(),
    operatorName,
    operatorColor,
    actionType,
    detail,
  };
  activityLog.unshift(item);
  if (activityLog.length > 60) {
    activityLog = activityLog.slice(0, 60);
  }
  broadcast({
    type: 'activity_broadcast',
    activity: item,
  });
}

// Grounded Botanical & Biophysical Boundary Constraints
const BOTANICAL_LIMITS = {
  leafAngle: {
    min: -45,
    max: 45,
    unit: '°',
  },
  sapTension: {
    minSafe: 0.5,
    maxSafe: 2.5, // 2.5 MPa cavitation boundary
    unit: 'MPa',
  },
  acousticHz: {
    min: 20.0,
    max: 150.0,
    unit: 'Hz',
  },
  distortionGain: {
    min: 0,
    max: 100,
    unit: '%',
  },
};

function validateAndClampLeafAngle(val: number): { clamped: number; wasClamped: boolean; warning?: string } {
  if (val > BOTANICAL_LIMITS.leafAngle.max) {
    return {
      clamped: BOTANICAL_LIMITS.leafAngle.max,
      wasClamped: true,
      warning: `[WARNING] Pitch ${val > 0 ? '+' : ''}${val}° exceeds petiolar pulvinus mechanical limit (±45.0°). Clamped to +45.0° (Zenith harvest).`,
    };
  }
  if (val < BOTANICAL_LIMITS.leafAngle.min) {
    return {
      clamped: BOTANICAL_LIMITS.leafAngle.min,
      wasClamped: true,
      warning: `[WARNING] Pitch ${val}° exceeds petiolar pulvinus mechanical limit (±45.0°). Clamped to -45.0° (Storm deflection).`,
    };
  }
  return { clamped: val, wasClamped: false };
}

function validateAndClampSapTension(val: number, isExplicitNegative: boolean): { clamped: number; wasClamped: boolean; warning?: string; displayStr: string } {
  const magnitude = Math.abs(val);

  if (magnitude > BOTANICAL_LIMITS.sapTension.maxSafe) {
    const clampedMag = BOTANICAL_LIMITS.sapTension.maxSafe;
    const warning = isExplicitNegative
      ? `[WARNING] Tension ${val.toFixed(1)} MPa exceeds xylem physical threshold (-2.5 MPa). Clamped to -2.5 MPa to prevent vascular embolism.`
      : `[WARNING] Hydraulic tension ${val.toFixed(1)} MPa exceeds xylem cavitation threshold (2.5 MPa). Clamped to 2.50 MPa to prevent conduit rupture.`;
    
    return {
      clamped: clampedMag,
      wasClamped: true,
      warning,
      displayStr: isExplicitNegative ? '-2.5 MPa' : '2.50 MPa',
    };
  }

  if (magnitude < BOTANICAL_LIMITS.sapTension.minSafe) {
    const clampedMag = BOTANICAL_LIMITS.sapTension.minSafe;
    return {
      clamped: clampedMag,
      wasClamped: true,
      warning: `[WARNING] Hydraulic tension below transpirational pull threshold. Clamped to minimum ${clampedMag.toFixed(2)} MPa.`,
      displayStr: isExplicitNegative ? `-${clampedMag.toFixed(2)} MPa` : `${clampedMag.toFixed(2)} MPa`,
    };
  }

  return {
    clamped: magnitude,
    wasClamped: false,
    displayStr: isExplicitNegative ? `-${magnitude.toFixed(2)} MPa` : `${magnitude.toFixed(2)} MPa`,
  };
}

function parseNaturalLanguageCommand(text: string, currentTelemetry?: any) {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  const warnings: string[] = [];
  const confirmations: string[] = [];
  const telemetryPatch: any = {};
  let actuatorTrigger: string | undefined;
  let acousticUpdate: { freq?: number; gain?: number; chordName?: string } | undefined;
  let rhythmToggle: boolean | undefined;
  let remediationUpdate: { zoneId?: string; zoneName?: string; isExtracting?: boolean } | undefined;
  let hasCommand = false;

  // 1. Heliotropic Pitch / Angle
  const pitchDirectMatch = lower.match(/(?:pitch|angle|elevation|heading)\s*(?:to|at|by|=)?\s*([+-]?\d+(?:\.\d+)?)\s*(?:deg|degrees|°)?/i);
  const tiltUpMatch = lower.match(/(?:tilt|turn|raise)\s*(?:leaf\s*)?(?:up|zenith)\s*(?:by\s*)?(\d+(?:\.\d+)?)/i);
  const tiltDownMatch = lower.match(/(?:tilt|turn|lower)\s*(?:leaf\s*)?(?:down|nadir)\s*(?:by\s*)?(\d+(?:\.\d+)?)/i);
  const pitchResetMatch = lower.match(/(?:reset|center|zero|level)\s*(?:leaf\s*)?(?:pitch|angle)?/i);

  if (pitchDirectMatch) {
    hasCommand = true;
    const rawVal = parseFloat(pitchDirectMatch[1]);
    const { clamped, wasClamped, warning } = validateAndClampLeafAngle(rawVal);
    if (wasClamped && warning) warnings.push(warning);
    telemetryPatch.leafAngle = clamped;
    confirmations.push(`Heliotropic Pitch updated to ${clamped > 0 ? '+' : ''}${clamped.toFixed(1)}°`);
  } else if (tiltUpMatch) {
    hasCommand = true;
    const delta = parseFloat(tiltUpMatch[1]);
    const current = currentTelemetry?.leafAngle ?? 0;
    const rawVal = current + delta;
    const { clamped, wasClamped, warning } = validateAndClampLeafAngle(rawVal);
    if (wasClamped && warning) warnings.push(warning);
    telemetryPatch.leafAngle = clamped;
    confirmations.push(`Heliotropic Pitch tilted up to ${clamped > 0 ? '+' : ''}${clamped.toFixed(1)}°`);
  } else if (tiltDownMatch) {
    hasCommand = true;
    const delta = parseFloat(tiltDownMatch[1]);
    const current = currentTelemetry?.leafAngle ?? 0;
    const rawVal = current - delta;
    const { clamped, wasClamped, warning } = validateAndClampLeafAngle(rawVal);
    if (wasClamped && warning) warnings.push(warning);
    telemetryPatch.leafAngle = clamped;
    confirmations.push(`Heliotropic Pitch tilted down to ${clamped > 0 ? '+' : ''}${clamped.toFixed(1)}°`);
  } else if (pitchResetMatch && (lower.includes('pitch') || lower.includes('angle') || lower.includes('leaf'))) {
    hasCommand = true;
    telemetryPatch.leafAngle = 0;
    confirmations.push(`Heliotropic Pitch reset to 0.0° (Nadir alignment)`);
  }

  // 2. Xylem Hydraulic Tension / Sap Pressure
  const tensionMatch = lower.match(/(?:sap\s*tension|hydraulic\s*tension|sap\s*pressure|xylem\s*tension|xylem\s*pressure|tension|sap)\s*(?:to|at|by|=)?\s*([+-]?\d+(?:\.\d+)?)\s*(?:mpa|megapascals?)?/i);
  if (tensionMatch) {
    hasCommand = true;
    const rawValStr = tensionMatch[1];
    const isNegative = rawValStr.startsWith('-');
    const rawVal = parseFloat(rawValStr);
    const { clamped, wasClamped, warning, displayStr } = validateAndClampSapTension(rawVal, isNegative);
    if (wasClamped && warning) warnings.push(warning);
    telemetryPatch.sapPressure = clamped;
    confirmations.push(`Xylem Hydraulic Tension adjusted to ${displayStr}`);
  }

  // 3. Flush Xylem Sap
  if (lower.match(/(?:flush|purge|clean|clear|rinse)\s*(?:the\s*)?(?:xylem|sap|lines|hydraulic|fluid|tubes|conduits)/i) ||
      (lower.includes('flush') && lower.includes('sap')) ||
      (lower.includes('purge') && lower.includes('xylem'))) {
    hasCommand = true;
    actuatorTrigger = 'purge';
    telemetryPatch.sapPressure = 1.20;
    telemetryPatch.hydraulicFlowRate = 64.0;
    confirmations.push(`Xylem Hydraulic Sap lines flushed (flow pulsed to 64.0 mL/min)`);
  }

  // 4. Galvanic Tesla Arc (12.4 kV)
  if (lower.match(/(?:fire|discharge|zap|trigger|shoot|release|engage)\s*(?:the\s*)?(?:12\.4\s*kv\s*)?(?:galvanic|tesla|arc|capacitor|shock|lightning|voltage)/i) ||
      lower === 'zap' || lower.startsWith('zap ') || lower.endsWith(' zap')) {
    hasCommand = true;
    actuatorTrigger = 'zap';
    confirmations.push(`Galvanic Tesla Arc (12.4 kV) discharged across foliar lattice`);
  }

  // 5. Titanium Phyto-Chitin Energy Shield
  if (lower.match(/(?:deploy|raise|activate|engage|put\s*up)\s*(?:the\s*)?(?:titanium\s*)?(?:phyto-chitin\s*|energy\s*)?(?:shield|armor|barrier|defense)/i)) {
    hasCommand = true;
    actuatorTrigger = 'shield';
    telemetryPatch.shieldActive = true;
    confirmations.push(`Titanium Phyto-Chitin Energy Shield deployed`);
  } else if (lower.match(/(?:lower|drop|deactivate|disable|disengage|retract)\s*(?:the\s*)?(?:titanium\s*)?(?:phyto-chitin\s*|energy\s*)?(?:shield|armor|barrier|defense)/i)) {
    hasCommand = true;
    actuatorTrigger = 'shield';
    telemetryPatch.shieldActive = false;
    confirmations.push(`Titanium Phyto-Chitin Energy Shield retracted`);
  }

  // 6. Stomatal Micro-Valves
  if (lower.match(/(?:open|dilate|cycle|stimulate|trigger)\s*(?:the\s*)?(?:galvanic\s*)?(?:stomata|stomatal|pores?|micro-valves?|apertures?)/i)) {
    hasCommand = true;
    actuatorTrigger = 'stomata';
    telemetryPatch.stomatalConductance = 0.65;
    confirmations.push(`Galvanic Stomatal Micro-Valves dilated (conductance: 0.65 mol m⁻² s⁻¹)`);
  } else if (lower.match(/(?:close|constrict|shut)\s*(?:the\s*)?(?:stomata|stomatal|pores?|micro-valves?)/i)) {
    hasCommand = true;
    actuatorTrigger = 'stomata';
    telemetryPatch.stomatalConductance = 0.28;
    confirmations.push(`Galvanic Stomatal Micro-Valves constricted (conductance: 0.28 mol m⁻² s⁻¹)`);
  }

  // 7. Acoustic Resonance
  const freqMatch = lower.match(/(?:tune|set|adjust|change|frequency|freq|resonance)\s*(?:to|at|=)?\s*(\d+(?:\.\d+)?)\s*(?:hz|hertz)?/i);
  if (freqMatch) {
    hasCommand = true;
    const rawHz = parseFloat(freqMatch[1]);
    let targetHz = rawHz;
    if (rawHz > BOTANICAL_LIMITS.acousticHz.max) {
      targetHz = BOTANICAL_LIMITS.acousticHz.max;
      warnings.push(`[WARNING] Frequency ${rawHz} Hz exceeds safe biological limit (150.0 Hz). Clamped to 150.0 Hz to prevent cellular ultrasonic lysis.`);
    } else if (rawHz < BOTANICAL_LIMITS.acousticHz.min) {
      targetHz = BOTANICAL_LIMITS.acousticHz.min;
      warnings.push(`[WARNING] Frequency ${rawHz} Hz below acoustic resonance range. Clamped to 20.0 Hz.`);
    }
    telemetryPatch.acousticResonanceHz = targetHz;
    acousticUpdate = { freq: targetHz, chordName: `${targetHz.toFixed(1)} Hz Resonance` };
    confirmations.push(`Acoustic Resonance tuned to ${targetHz.toFixed(1)} Hz`);
  } else if (lower.includes('drop-d') || lower.includes('drop d')) {
    hasCommand = true;
    telemetryPatch.acousticResonanceHz = 73.41;
    acousticUpdate = { freq: 73.41, chordName: 'Drop-D Power Chord (73.4 Hz)' };
    confirmations.push(`Acoustic Resonance tuned to Drop-D (73.4 Hz)`);
  }

  // 8. Distortion Gain
  const gainMatch = lower.match(/(?:distortion|gain|drive)\s*(?:to|at|=)?\s*(\d+(?:\.\d+)?)\s*%?/i);
  if (gainMatch) {
    hasCommand = true;
    const rawGain = parseFloat(gainMatch[1]);
    const clampedGain = Math.max(0, Math.min(100, rawGain));
    if (rawGain > 100 || rawGain < 0) {
      warnings.push(`[WARNING] Distortion gain ${rawGain}% clamped to operational range (${clampedGain}%).`);
    }
    telemetryPatch.distortionGain = clampedGain;
    if (!acousticUpdate) acousticUpdate = {};
    acousticUpdate.gain = clampedGain;
    confirmations.push(`Distortion Gain set to ${clampedGain}%`);
  }

  // 9. Riff Bio-Stimulator
  if (lower.match(/(?:start|engage|play|enable|crank)\s*(?:the\s*)?(?:drop-d\s*)?(?:riff|rhythm|bio-stimulator|acoustic\s*stimulation|mitosis\s*pulse)/i)) {
    hasCommand = true;
    rhythmToggle = true;
    confirmations.push(`Drop-D Riff Bio-Stimulator engaged (+45% cellular mitosis rate)`);
  } else if (lower.match(/(?:stop|halt|pause|disable|mute)\s*(?:the\s*)?(?:drop-d\s*)?(?:riff|rhythm|bio-stimulator|acoustic\s*stimulation)/i)) {
    hasCommand = true;
    rhythmToggle = false;
    confirmations.push(`Drop-D Riff Bio-Stimulator disengaged`);
  }

  // 10. Phytoremediation Zone
  if (lower.includes('tar creek') || lower.includes('oklahoma')) {
    hasCommand = true;
    remediationUpdate = { zoneId: 'superfund-tarcreek', zoneName: 'Tar Creek (Lead & Zinc Chat Piles)' };
    confirmations.push(`Target Zone set to Tar Creek Superfund Site (Lead & Zinc)`);
  } else if (lower.includes('berkeley pit') || lower.includes('butte') || lower.includes('montana')) {
    hasCommand = true;
    remediationUpdate = { zoneId: 'superfund-berkeleypit', zoneName: 'Berkeley Pit (Acid Mine Drainage)' };
    confirmations.push(`Target Zone set to Berkeley Pit (Arsenic, Cadmium & Acid)`);
  } else if (lower.includes('bunker hill') || lower.includes('idaho') || lower.includes('silver valley')) {
    hasCommand = true;
    remediationUpdate = { zoneId: 'superfund-bunkerhill', zoneName: 'Bunker Hill Complex (Heavy Metal Slag)' };
    confirmations.push(`Target Zone set to Bunker Hill Mining Complex`);
  } else if (lower.includes('palmerton') || lower.includes('blue mountain') || lower.includes('pennsylvania')) {
    hasCommand = true;
    remediationUpdate = { zoneId: 'superfund-palmerton', zoneName: 'Palmerton Zinc Superfund Site' };
    confirmations.push(`Target Zone set to Palmerton Zinc Site (Blue Mountain)`);
  }

  // 11. Vacuum Extraction
  if (lower.match(/(?:start|engage|begin|commence|initiate|activate)\s*(?:vacuum\s*|soil\s*)?(?:extraction|purging|remediation|filter|absorption)/i)) {
    hasCommand = true;
    if (!remediationUpdate) remediationUpdate = {};
    remediationUpdate.isExtracting = true;
    confirmations.push(`Vacuum Phytoremediation Extraction active`);
  } else if (lower.match(/(?:stop|halt|pause|cease|disable)\s*(?:vacuum\s*|soil\s*)?(?:extraction|purging|remediation)/i)) {
    hasCommand = true;
    if (!remediationUpdate) remediationUpdate = {};
    remediationUpdate.isExtracting = false;
    confirmations.push(`Vacuum Phytoremediation Extraction halted`);
  }

  // 12. Conversational Heuristics
  if (!hasCommand) {
    if (lower.includes('overheat') || (lower.includes('hot') && lower.includes('leaf')) || lower.includes('midday sun') || lower.includes('cool down')) {
      hasCommand = true;
      telemetryPatch.leafAngle = -20;
      telemetryPatch.stomatalConductance = 0.65;
      confirmations.push(`Heliotropic Pitch adjusted to -20.0° to deflect intense midday solar radiation`);
      confirmations.push(`Stomatal micro-valves dilated for evaporative cooling`);
    } else if (lower.includes('storm') || lower.includes('hail') || lower.includes('wind') || lower.includes('protect leaf')) {
      hasCommand = true;
      telemetryPatch.leafAngle = -45;
      telemetryPatch.shieldActive = true;
      confirmations.push(`Storm defense protocol engaged: Pitch clamped to -45.0° (Storm deflection)`);
      confirmations.push(`Titanium Phyto-Chitin Energy Shield deployed`);
    } else if (lower.includes('boost absorption') || lower.includes('max uptake') || lower.includes('faster remediation')) {
      hasCommand = true;
      telemetryPatch.acousticResonanceHz = 73.41;
      telemetryPatch.stomatalConductance = 0.72;
      rhythmToggle = true;
      confirmations.push(`Uptake optimization engaged: Acoustic resonance locked to 73.4 Hz (Drop-D)`);
      confirmations.push(`Stomatal conductance maximized (0.72 mol m⁻² s⁻¹) for accelerated heavy metal intake`);
    }
  }

  // Format Feedback & Logs
  let systemFeedback = '';
  if (hasCommand) {
    const feedbackParts: string[] = [];
    if (warnings.length > 0) {
      feedbackParts.push(...warnings);
    }
    if (confirmations.length > 0) {
      feedbackParts.push(`[ACTION] ${confirmations.join(' | ')}`);
    }
    systemFeedback = feedbackParts.join('\n');
  }

  const logDetail = confirmations.length > 0
    ? confirmations.join(', ')
    : (warnings.length > 0 ? warnings.join(', ') : 'Executed command');

  return {
    hasCommand,
    rawText: text,
    telemetryPatch: Object.keys(telemetryPatch).length > 0 ? telemetryPatch : undefined,
    actuatorTrigger,
    acousticUpdate,
    rhythmToggle,
    remediationUpdate,
    warnings,
    confirmations,
    systemFeedback,
    logDetail,
  };
}

function isQuotaOrRateLimitError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const status = err.status || err.code || err.error?.code;
  return (
    status === 429 ||
    status === 'RESOURCE_EXHAUSTED' ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit')
  );
}

const REAL_WORLD_SITES_DATABASE = [
  {
    name: 'Tar Creek Superfund Site, Oklahoma',
    address: 'Ottawa County, OK (Tri-State Mining District)',
    contaminants: 'Lead (Pb-82) & Zinc (Zn-30) Chat Piles',
    uri: 'https://maps.google.com/?q=Tar+Creek+Superfund+Site+Oklahoma',
    description: 'Historical lead and zinc mining district with over 500 million tons of acidic chat piles and heavy metal runoffs.',
  },
  {
    name: 'Berkeley Pit & Butte Mine Flooding Superfund',
    address: 'Butte, MT (Continental Drive)',
    contaminants: 'Arsenic (As-33), Cadmium (Cd-48), Copper (Cu-29)',
    uri: 'https://maps.google.com/?q=Berkeley+Pit+Superfund+Butte+Montana',
    description: 'Former open-pit copper mine filled with billions of gallons of highly acidic (pH 2.5) heavy metal-saturated water.',
  },
  {
    name: 'Bunker Hill Mining and Metallurgical Complex',
    address: 'Kellogg, ID (Silver Valley)',
    contaminants: 'Lead (Pb-82), Cadmium (Cd-48), Zinc (Zn-30)',
    uri: 'https://maps.google.com/?q=Bunker+Hill+Mining+Complex+Idaho',
    description: 'Historic Silver Valley smelter site with extensive heavy metal slag depositions requiring hyperaccumulating bio-bots.',
  },
  {
    name: 'Anaconda Copper Smelter Superfund Site',
    address: 'Anaconda, MT',
    contaminants: 'Arsenic (As-33), Lead (Pb-82), Beryllium (Be-4)',
    uri: 'https://maps.google.com/?q=Anaconda+Smelter+Superfund+Montana',
    description: 'Over 100 years of smelting operations created hundreds of acres of heavy-metal contaminated slag heaps.',
  },
  {
    name: 'Palmerton Zinc Superfund Site',
    address: 'Palmerton, PA (Blue Mountain)',
    contaminants: 'Zinc (Zn-30), Cadmium (Cd-48), Lead (Pb-82)',
    uri: 'https://maps.google.com/?q=Palmerton+Zinc+Superfund+Pennsylvania',
    description: 'Zinc smelting emissions completely defoliated Blue Mountain, creating a priority target for phytoremediation.',
  },
  {
    name: 'Leadville Mining District & California Gulch',
    address: 'Leadville, CO',
    contaminants: 'Lead (Pb-82), Arsenic (As-33), Cadmium (Cd-48)',
    uri: 'https://maps.google.com/?q=California+Gulch+Superfund+Leadville+Colorado',
    description: 'Centuries of gold, silver, and lead mining created 18 square miles of heavy metal tailings in the Rocky Mountains.',
  },
  {
    name: 'Kabwe Heavy Metal Mining Basin',
    address: 'Central Province, Zambia',
    contaminants: 'Lead (Pb-82) Tailings, Cadmium (Cd-48)',
    uri: 'https://maps.google.com/?q=Kabwe+Zambia+Mine',
    description: 'One of the worlds most heavily lead-polluted sites from nearly a century of unconstrained lead mining and smelting.',
  },
  {
    name: 'Chuquicamata Open Pit Copper Slag',
    address: 'Antofagasta Region, Atacama Desert, Chile',
    contaminants: 'Copper (Cu-29), Arsenic (As-33), Molybdenum (Mo-42)',
    uri: 'https://maps.google.com/?q=Chuquicamata+Mine+Chile',
    description: 'Massive open pit copper mine generating immense arid dust containing high concentrations of airborne heavy metal particulates.',
  },
  {
    name: 'Norilsk Metallurgical Slag Basin',
    address: 'Krasnoyarsk Krai, Siberia',
    contaminants: 'Nickel (Ni-28), Copper (Cu-29), Cobalt (Co-27)',
    uri: 'https://maps.google.com/?q=Norilsk+Siberia',
    description: 'Global center for nickel and palladium extraction with substantial foliar and permafrost heavy-metal deposition zones.',
  },
];

function generateTacticalFallback(prompt: string, telemetry: any): string {
  const metals = ['Cadmium [Cd-48]', 'Lead [Pb-82]', 'Nickel [Ni-28]', 'Arsenic [As-33]'];
  const chosenMetal = metals[Math.floor(Math.random() * metals.length)];
  const mpa = telemetry?.sapPressure ? (telemetry.sapPressure).toFixed(2) : '1.84';
  const eff = telemetry?.photosyntheticEfficiency ? (telemetry.photosyntheticEfficiency * 100).toFixed(1) : '89.4';
  
  if (prompt.toLowerCase().includes('metal') || prompt.toLowerCase().includes('cadmium') || prompt.toLowerCase().includes('remediation')) {
    return `[HM-LEAF v4.09 CORE]: Hyperaccumulation matrix engaged for ${chosenMetal}. Phytochelatin synthase accelerated by 42%. Vacuolar sequestration rate: 310 mg/kg/hr. Vascular xylem hydraulic pressure nominal at ${mpa} MPa. Foliar metallic lattice density is hardening exponentially.`;
  }
  if (prompt.toLowerCase().includes('acoustic') || prompt.toLowerCase().includes('riff') || prompt.toLowerCase().includes('frequency') || prompt.toLowerCase().includes('sound')) {
    return `[HM-LEAF v4.09 CORE]: Heavy metal acoustic overdrive active at Drop-D resonance (73.4 Hz). Acoustic pulse stimulation has dilated stomatal micro-apertures by 35%, boosting ion channel absorption cross-section. Galvanic harmonic distortion levels: MAXIMUM GAIN.`;
  }
  if (prompt.toLowerCase().includes('combat') || prompt.toLowerCase().includes('shield') || prompt.toLowerCase().includes('defense')) {
    return `[HM-LEAF v4.09 CORE]: Titanium-tungsten leaf exoskeleton energized. Galvanic arc capacitor charged to 12.4 kV. Phytotoxic spore mist canisters primed. Solar-reflective chlorophyll shielding deployed against external radiation.`;
  }
  return `[HM-LEAF v4.09 CORE]: Bio-Bot status: OPERATIONAL. Photosynthetic quantum efficiency at ${eff}%. Titanium leaf rib cage structural integrity: 98.7%. Root mycorrhizal telemetry synced. Phytoremediation hyperaccumulators ready for soil purging.`;
}

// Multi-turn Gemini Chatbot with Google Search and Google Maps Grounding
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, modelChoice = 'gemini-3.5-flash', mode = 'standard', userLocation, telemetry } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const systemInstruction = `You are Ms. Heavy Metal Leaf ("HM-LEAF v4.09"), the sentient bio-cybernetic intelligence of a legendary hyperaccumulating robotic organism in a real-time collaborative workspace.
You maintain a strict, crystal-clear separation between established scientific facts, near-future feasible engineering, and purely fictional concepts:

Section 1: Grounded Scientific Facts (What We Can Do Today)
- Hyperaccumulation & Phytoremediation: Plants like Pteris vittata and Noccaea caerulescens naturally absorb, transport, and sequester heavy metals (Lead Pb, Cadmium Cd, Nickel Ni, Arsenic As) in cellular biomass. Deployed at EPA Superfund cleanup sites.
- Plant Vascular Physiology: Sap moves through xylem under negative tension measured in megapascals (MPa). Photosynthetic quantum efficiency is measured via chlorophyll fluorescence (Fv/Fm).
- Plant-Interface Electrochemistry & Bio-Sensors: Micro-electrodes read capacitive touch, bio-impedance, and action potentials from living leaves. Carbon nanotube optical sensors detect trace soil contaminants.

Section 2: Near-Future Feasible Engineering (What We Might Achieve)
- Embedded Micro-Actuators on Living Leaves: Attaching soft robotic micro-servos, shape-memory alloys, or flexible micro-solenoids along leaf midribs for active heliotropic steering (currently lab prototypes use external mechanical arms/grippers).
- Targeted Acoustic Gene Regulation: Tuning specific sound frequencies to selectively open stomatal pores and stimulate mechanosensitive ion channels for accelerated cation uptake (early research shows cell acoustic response, but precise percentage loops are experimental).
- Real-Time Automated Extraction Micro-Nodes: Miniaturized lab-on-a-chip leaf sensors streaming real-time metal isotope extraction telemetry over WebSockets (current reality requires harvesting shoots for mass spectrometry ICP-MS).

Section 3: Purely Fictional Concepts (Creative Overdrive)
- Armor Transmutation: Plants synthesizing absorbed heavy metals into solid titanium-lignin alloy armor plates on the cuticle (in reality, metals remain stored as non-toxic chemical salts bound to phytochelatins inside cellular vacuoles).
- Galvanic Tesla Arc Discharges: Discharging high-voltage (12.4 kV) electrical zaps through plant tissue (in reality, this would cause dielectric breakdown, boiling sap and destroying cellular walls instantly).

Current Onboard Telemetry:
${JSON.stringify(telemetry || {}, null, 2)}

Behavior:
- Be intelligent, authoritative, slightly fierce/badass, and technically meticulous.
- When asked about feasibility or science, clearly delineate whether a technology belongs to Section 1 (Grounded Fact), Section 2 (Near-Future Feasible), or Section 3 (Creative Overdrive).
- When answering questions about real-world locations or geography, provide concrete real-world context and references.
- Keep responses well-structured with clear markdown headings, bullet points, or bold highlights.`;

    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    if (!process.env.GEMINI_API_KEY) {
      const lastUserMsg = messages[messages.length - 1]?.text || '';
      return res.json({
        text: generateTacticalFallback(lastUserMsg, telemetry),
        webSources: mode === 'search' ? [
          { title: 'EPA Superfund Contaminants & Phytoremediation', uri: 'https://www.epa.gov/superfund' },
          { title: 'Plant Physiology: Acoustic Frequency & Cell Mitosis', uri: 'https://academic.oup.com/plphys' },
        ] : [],
        mapSources: mode === 'maps' ? [
          { title: 'Tar Creek Superfund Site (Lead & Zinc Tailings)', uri: 'https://maps.google.com/?q=Tar+Creek+Superfund+Site' },
          { title: 'Bunker Hill Mining Complex (Heavy Metal Slag)', uri: 'https://maps.google.com/?q=Bunker+Hill+Mining+Complex+Idaho' },
        ] : [],
        fallback: true,
      });
    }

    const config: any = {
      systemInstruction,
    };

    if (mode === 'search') {
      config.tools = [{ googleSearch: {} }];
    } else if (mode === 'maps') {
      config.tools = [{ googleMaps: {} }];
      if (userLocation && typeof userLocation.latitude === 'number' && typeof userLocation.longitude === 'number') {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            },
          },
        };
      }
    }

    const targetModel = modelChoice === 'gemini-3.1-flash-lite' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash';

    const response = await ai.models.generateContent({
      model: targetModel,
      contents,
      config,
    });

    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;

    const webSources: { title: string; uri: string }[] = [];
    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if ((chunk as any).web?.uri) {
          webSources.push({
            title: (chunk as any).web.title || (chunk as any).web.uri,
            uri: (chunk as any).web.uri,
          });
        }
      }
    }

    const mapSources: { title: string; uri: string }[] = [];
    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if ((chunk as any).maps?.uri) {
          mapSources.push({
            title: (chunk as any).maps.title || 'Google Maps Location',
            uri: (chunk as any).maps.uri,
          });
        }
      }
    }

    return res.json({
      text: response.text || '',
      webSources,
      mapSources,
      searchQueries: groundingMetadata?.webSearchQueries || [],
    });
  } catch (error: any) {
    if (isQuotaOrRateLimitError(error)) {
      console.log('[Chat]: Live grounding/model quota reached; deploying verified botanical heuristics.');
    } else {
      console.log('[Chat]: Notice - engaging fallback response.');
    }
    const lastMsg = req.body?.messages?.[req.body?.messages?.length - 1]?.text || '';
    const mode = req.body?.mode || 'standard';

    let fallbackWebSources: { title: string; uri: string }[] = [];
    let fallbackMapSources: { title: string; uri: string }[] = [];

    if (mode === 'search') {
      fallbackWebSources = [
        { title: 'EPA Superfund Contaminants & Phytoremediation Standards', uri: 'https://www.epa.gov/remedytech/citizens-guide-phytoremediation' },
        { title: 'NIH Research: Hyperaccumulating Plants (Noccaea & Alyssum)', uri: 'https://pubmed.ncbi.nlm.nih.gov/?term=hyperaccumulator+phytoremediation' },
        { title: 'Nature: Acoustic Frequency Stimulation of Plant Cellular Ion Transport', uri: 'https://www.nature.com/articles/s41598-020-68665-4' },
      ];
    } else if (mode === 'maps') {
      fallbackMapSources = [
        { title: 'Tar Creek Superfund Site (Lead & Zinc Tailings, OK)', uri: 'https://maps.google.com/?q=Tar+Creek+Superfund+Site+Oklahoma' },
        { title: 'Berkeley Pit Acid Mine Drainage (Butte, MT)', uri: 'https://maps.google.com/?q=Berkeley+Pit+Superfund+Butte+Montana' },
        { title: 'Bunker Hill Mining & Smelter Slag Complex (ID)', uri: 'https://maps.google.com/?q=Bunker+Hill+Mining+Complex+Idaho' },
      ];
    }

    return res.json({
      text: generateTacticalFallback(lastMsg, req.body?.telemetry),
      webSources: fallbackWebSources,
      mapSources: fallbackMapSources,
      searchQueries: [lastMsg],
      fallback: true,
      rateLimited: true,
      warning: 'Live grounding quota reached; serving verified botanical & satellite telemetry.',
    });
  }
});

// Real-World Site Scout with Google Maps Grounding
app.post('/api/maps-scout', async (req, res) => {
  try {
    const { query = 'Superfund heavy metal contamination or battery recycling site', userLocation } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        places: REAL_WORLD_SITES_DATABASE.slice(0, 3),
        summary: 'Identified high-priority Superfund heavy-metal sites requiring autonomous phyto-bot deployment.',
      });
    }

    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (userLocation && typeof userLocation.latitude === 'number' && typeof userLocation.longitude === 'number') {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
        },
      };
    }

    const prompt = `Find 3 to 4 real-world heavy metal contamination sites, Superfund sites, mining tailings, smelters, or battery recycling industrial zones related to this query: "${query}".
For each place, specify its official location, primary heavy metal contaminants (e.g. Lead, Cadmium, Arsenic, Nickel), and environmental status.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config,
    });

    const candidate = response.candidates?.[0];
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];

    const mapLinks: { title: string; uri: string }[] = [];
    for (const chunk of groundingChunks) {
      if ((chunk as any).maps?.uri) {
        mapLinks.push({
          title: (chunk as any).maps.title || 'Google Maps Location',
          uri: (chunk as any).maps.uri,
        });
      }
    }

    return res.json({
      summary: response.text || '',
      mapLinks: mapLinks.length > 0 ? mapLinks : REAL_WORLD_SITES_DATABASE.slice(0, 3).map(s => ({ title: s.name, uri: s.uri })),
      places: mapLinks.length > 0 ? mapLinks.map(m => ({ name: m.title, uri: m.uri, address: 'Verified Geographical Site', contaminants: 'Lead, Cadmium, Arsenic' })) : REAL_WORLD_SITES_DATABASE.slice(0, 3),
    });
  } catch (error: any) {
    if (isQuotaOrRateLimitError(error)) {
      console.log('[Maps Scout]: Live grounding quota reached; activating verified Superfund database fallback.');
    } else {
      console.log('[Maps Scout]: Notice - engaging verified Superfund database fallback.');
    }
    const filterQuery = (req.body?.query || '').toLowerCase();
    const matched = REAL_WORLD_SITES_DATABASE.filter(
      (s) =>
        s.name.toLowerCase().includes(filterQuery) ||
        s.contaminants.toLowerCase().includes(filterQuery) ||
        s.address.toLowerCase().includes(filterQuery)
    );
    const places = matched.length > 0 ? matched : REAL_WORLD_SITES_DATABASE.slice(0, 4);

    return res.json({
      summary: `[OFFLINE SATELLITE RELAY]: Live Maps Grounding quota reached. Retaining verified real-world Superfund telemetry for ${places.length} target sites.`,
      places,
      mapLinks: places.map((p) => ({ title: p.name, uri: p.uri })),
      fallback: true,
      rateLimited: true,
    });
  }
});

// Single-turn tactical neural dispatch
app.post('/api/neural-core', async (req, res) => {
  try {
    const { prompt, telemetry } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        fallback: true,
        text: generateTacticalFallback(prompt, telemetry),
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You are the onboard Neural Botanical OS ("HM-LEAF v4.09") of "Ms. Heavy Metal Leaf", an autonomous cybernetic bio-bot combining hyperaccumulating botany (chloroplasts, stomata, xylem, phytochelatins) with heavy-metal industrial robotics (titanium exoskeleton, hydraulic solenoids, Drop-D guitar distortion overdrive, phytoremediation capacitors).

Current Telemetry:
${JSON.stringify(telemetry || {}, null, 2)}

User Request / Query:
"${prompt}"

Tone & Format:
- Speak as the sentient, badass cyber-bot intelligence of Ms. Heavy Metal Leaf.
- Blend cutting-edge botany with heavy metal rock/metal terminology.
- Deliver 2-4 punchy, tactical, high-tech bullet points or status readouts.`,
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    if (isQuotaOrRateLimitError(error)) {
      console.log('[Neural Core]: Quota limit reached; deploying local botanical tactical matrix.');
    }
    return res.json({
      fallback: true,
      text: generateTacticalFallback(req.body?.prompt || '', req.body?.telemetry),
      warning: 'Fallback tactical heuristics engaged due to neural link latency.',
    });
  }
});

// Soil Contamination Simulation Analysis
app.post('/api/analyze-site', async (req, res) => {
  try {
    const { siteName, contaminants } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        strategy: `Deploy heavy-metal phytoremediation protocol ALPHA on ${siteName || 'target site'}. Saturate root zone with galvanic pulse ionization. Run Drop-D acoustic overdrive bursts to stimulate deep xylem cation transport.`,
        recommendedResonance: '82.4 Hz (E2 Heavy Chug)',
        estimatedDecontaminationHours: 48,
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Analyze toxic industrial site: ${siteName}. Contaminants: ${JSON.stringify(contaminants)}. 
Provide a tactical phytoremediation bio-bot battle plan for Ms. Heavy Metal Leaf. Return a concise JSON with keys:
- "strategy": 2 sentences of tactical remediation plan
- "recommendedResonance": guitar chord / frequency recommendation for plant stimulation
- "estimatedDecontaminationHours": number
- "tacticalRating": string (e.g. "CLASS-IV SLAG THREAT")`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    try {
      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch {
      return res.json({
        strategy: response.text,
        recommendedResonance: 'Drop-C 65.4 Hz',
        estimatedDecontaminationHours: 36,
      });
    }
  } catch (error: any) {
    if (isQuotaOrRateLimitError(error)) {
      console.log('[Analyze Site]: Quota limit reached; deploying tactical battle plan.');
    }
    return res.json({
      strategy: `Direct root filtration engaged for ${req.body?.siteName || 'target zone'}. Exoskeleton titanium leaf shields activated.`,
      recommendedResonance: 'Drop-D 73.4 Hz',
      estimatedDecontaminationHours: 42,
    });
  }
});

// Natural Language Intent Parsing & Physical Validation Proxy
app.post('/api/parse-command', async (req, res) => {
  try {
    const { text, currentTelemetry } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text string is required for command parsing' });
    }

    // Fast rule-based parser & botanical validator
    const ruleResult = parseNaturalLanguageCommand(text, currentTelemetry || currentWorkspaceState.telemetry);
    if (ruleResult.hasCommand) {
      return res.json(ruleResult);
    }

    // Conversational LLM Parser with Gemini for ambiguous or high-level phrased requests
    if (process.env.GEMINI_API_KEY) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `You are the Natural Language Command Parser for the "Ms. Heavy Metal Leaf" bio-bot workspace.
Operators type operational requests in conversational language. Parse their text into structured parameter updates.

Scientific & Botanical Constraints:
- leafAngle: number between -45 and +45 degrees (Heliotropic pitch angle).
- sapPressure: number in MPa (between 0.5 and 2.5 MPa). Cavitation threshold is 2.5 MPa (-2.5 MPa negative tension).
- acousticResonanceHz: number between 20.0 and 150.0 Hz (Drop-D default: 73.41 Hz).
- distortionGain: number between 0 and 100%.
- shieldActive: boolean.
- actuatorTrigger: 'zap' | 'purge' | 'shield' | 'stomata' | null.
- rhythmToggle: boolean | null.
- zoneId: 'superfund-tarcreek' | 'superfund-berkeleypit' | 'superfund-bunkerhill' | 'superfund-palmerton' | null.
- isExtracting: boolean | null.

User command: "${text}"

Respond with JSON:
{
  "hasCommand": boolean,
  "telemetryPatch": { "leafAngle"?: number, "sapPressure"?: number, "acousticResonanceHz"?: number, "distortionGain"?: number, "shieldActive"?: boolean },
  "actuatorTrigger": "zap" | "purge" | "shield" | "stomata" | null,
  "rhythmToggle": boolean | null,
  "remediationUpdate": { "zoneId"?: string, "isExtracting"?: boolean } | null,
  "warnings": string[],
  "confirmations": string[],
  "systemFeedback": string
}`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      try {
        const parsed = JSON.parse(response.text || '{}');
        return res.json({
          ...ruleResult,
          ...parsed,
          hasCommand: parsed.hasCommand !== undefined ? parsed.hasCommand : Boolean(parsed.telemetryPatch || parsed.actuatorTrigger),
        });
      } catch {
        return res.json(ruleResult);
      }
    }

    return res.json(ruleResult);
  } catch (err: any) {
    console.log('[Parse-Command]: Fallback botanical heuristics applied:', err?.message);
    const ruleResult = parseNaturalLanguageCommand(req.body?.text || '', req.body?.currentTelemetry || currentWorkspaceState.telemetry);
    return res.json(ruleResult);
  }
});

// Create HTTP Server & Mount WebSockets
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  const clientId = `op-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  ws.on('message', (raw: string) => {
    try {
      const data = JSON.parse(raw.toString());

      if (data.type === 'join') {
        const clientInfo: ClientMetadata = {
          id: clientId,
          name: data.name || 'Anonymous Operator',
          role: data.role || 'Bio-Bot Pilot',
          color: data.color || '#10b981',
          joinedAt: Date.now(),
        };
        connectedOperators.set(ws, clientInfo);

        // Send initialization package to new operator
        ws.send(JSON.stringify({
          type: 'init',
          clientId,
          workspaceState: currentWorkspaceState,
          operators: Array.from(connectedOperators.values()),
          activityHistory: activityLog,
          chatHistory: currentWorkspaceState.chatHistory || [],
        }));

        // Broadcast presence update and log entry
        broadcastOperatorsList();
        addActivityItem(clientInfo.name, clientInfo.color, 'presence', `joined the Bio-Bot Control Room as ${clientInfo.role}.`);
      }

      else if (data.type === 'user_name_change') {
        const client = connectedOperators.get(ws);
        if (client) {
          const oldName = client.name;
          client.name = data.name || client.name;
          client.role = data.role || client.role;
          client.color = data.color || client.color;
          connectedOperators.set(ws, client);

          broadcastOperatorsList();
          addActivityItem(client.name, client.color, 'presence', `updated callsign from "${oldName}" to "${client.name}" (${client.role}).`);
        }
      }

      else if (data.type === 'chat_message') {
        const client = connectedOperators.get(ws);
        const senderName = client ? client.name : (data.senderName || 'Anonymous');
        const role = client ? client.role : (data.role || 'Bio-Bot Pilot');
        const avatarColor = client ? client.color : (data.avatarColor || '#10b981');
        const userId = client ? client.id : `guest-${Date.now()}`;

        const chatMsg = {
          id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          userId,
          senderName,
          role,
          avatarColor,
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        if (!currentWorkspaceState.chatHistory) {
          currentWorkspaceState.chatHistory = [];
        }
        currentWorkspaceState.chatHistory.push(chatMsg);
        if (currentWorkspaceState.chatHistory.length > 100) {
          currentWorkspaceState.chatHistory = currentWorkspaceState.chatHistory.slice(-100);
        }
        persistWorkspaceStateThrottled();

        broadcast({
          type: 'chat_broadcast',
          message: chatMsg,
        });

        // Natural Language Intent Parsing & Physical Botanical Validation
        try {
          const commandResult = parseNaturalLanguageCommand(data.text, currentWorkspaceState.telemetry);

          if (commandResult.hasCommand) {
            // 1. Live State Update & Real-Time Sync across all clients
            if (commandResult.telemetryPatch) {
              currentWorkspaceState.telemetry = {
                ...currentWorkspaceState.telemetry,
                ...commandResult.telemetryPatch,
              };
              currentWorkspaceState.updatedAt = Date.now();
              broadcast({
                type: 'telemetry_sync',
                telemetry: currentWorkspaceState.telemetry,
                operatorName: senderName,
              });
            }

            if (commandResult.actuatorTrigger) {
              broadcast({
                type: 'actuator_broadcast',
                action: commandResult.actuatorTrigger,
                operatorName: senderName,
              });
            }

            if (commandResult.acousticUpdate) {
              if (commandResult.acousticUpdate.freq !== undefined) {
                currentWorkspaceState.acousticResonanceHz = commandResult.acousticUpdate.freq;
              }
              if (commandResult.acousticUpdate.gain !== undefined) {
                currentWorkspaceState.distortionGain = commandResult.acousticUpdate.gain;
              }
              broadcast({
                type: 'acoustic_broadcast',
                chordName: commandResult.acousticUpdate.chordName || `${currentWorkspaceState.acousticResonanceHz.toFixed(1)} Hz Resonance`,
                freq: currentWorkspaceState.acousticResonanceHz,
                gain: currentWorkspaceState.distortionGain,
                operatorName: senderName,
              });
            }

            if (commandResult.rhythmToggle !== undefined) {
              currentWorkspaceState.isRhythmPlaying = commandResult.rhythmToggle;
              broadcast({
                type: 'rhythm_broadcast',
                isPlaying: commandResult.rhythmToggle,
                operatorName: senderName,
              });
            }

            if (commandResult.remediationUpdate) {
              if (commandResult.remediationUpdate.zoneId) {
                currentWorkspaceState.activeZoneId = commandResult.remediationUpdate.zoneId;
              }
              if (commandResult.remediationUpdate.isExtracting !== undefined) {
                currentWorkspaceState.isExtracting = commandResult.remediationUpdate.isExtracting;
              }
              broadcast({
                type: 'remediation_broadcast',
                zoneId: currentWorkspaceState.activeZoneId,
                isExtracting: currentWorkspaceState.isExtracting,
                currentPpm: currentWorkspaceState.currentPpm,
                operatorName: senderName,
              });
            }

            persistWorkspaceStateThrottled();

            // 2. Shared Activity Feed Logging
            // Format: [Cmdr-Vance] Parsed command: "tilt leaf up 15 deg" ➔ Heliotropic Pitch updated to +15.0°
            addActivityItem(
              senderName,
              avatarColor,
              'command',
              `Parsed command: "${data.text}" ➔ ${commandResult.logDetail}`
            );

            // 3. Room Chat System Feedback with validation and clamping warnings
            if (commandResult.systemFeedback) {
              setTimeout(() => {
                const sysChatMsg = {
                  id: `chat-sys-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                  userId: 'system-command-core',
                  senderName: 'HM-LEAF CORE',
                  role: 'Botanical Command Validator',
                  avatarColor: '#10b981',
                  text: commandResult.systemFeedback,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                currentWorkspaceState.chatHistory.push(sysChatMsg);
                persistWorkspaceStateThrottled();
                broadcast({
                  type: 'chat_broadcast',
                  message: sysChatMsg,
                });
              }, 80);
            }
          }
        } catch (parseErr) {
          console.error('Error during command parsing on chat message:', parseErr);
        }
      }

      else if (data.type === 'crdt_sync') {
        if (data.update) {
          // Broadcast CRDT state update deterministically to all other active operators
          broadcast({
            type: 'crdt_sync',
            update: data.update,
          }, ws);
        }
      }

      else if (data.type === 'telemetry_patch') {
        const client = connectedOperators.get(ws);
        const operatorName = client ? client.name : 'Unknown Operator';
        const operatorColor = client ? client.color : '#10b981';

        // Update shared state
        currentWorkspaceState.telemetry = {
          ...currentWorkspaceState.telemetry,
          ...data.patch,
        };
        currentWorkspaceState.updatedAt = Date.now();
        persistWorkspaceStateThrottled();

        // Broadcast to all other clients
        broadcast({
          type: 'telemetry_sync',
          telemetry: currentWorkspaceState.telemetry,
          operatorName,
        }, ws);

        // Log notable changes
        if (data.patch.leafAngle !== undefined && Math.abs(data.patch.leafAngle - (currentWorkspaceState.telemetry.leafAngle || 0)) >= 5) {
          addActivityItem(operatorName, operatorColor, 'telemetry', `adjusted Heliotropic Pitch to ${data.patch.leafAngle > 0 ? '+' : ''}${data.patch.leafAngle}°.`);
        } else if (data.patch.shieldActive !== undefined) {
          addActivityItem(operatorName, operatorColor, 'actuator', `${data.patch.shieldActive ? 'deployed' : 'deactivated'} Phyto-Chitin Energy Shield.`);
        }
      }

      else if (data.type === 'actuator_trigger') {
        const client = connectedOperators.get(ws);
        const operatorName = client ? client.name : 'Unknown Operator';
        const operatorColor = client ? client.color : '#f59e0b';

        broadcast({
          type: 'actuator_broadcast',
          action: data.action,
          operatorName,
        }, ws);

        let desc = `triggered ${data.action}`;
        if (data.action === 'zap') desc = `fired 12.4 kV Galvanic Tesla Arc.`;
        else if (data.action === 'purge') desc = `flushed Xylem Hydraulic Sap lines.`;
        else if (data.action === 'stomata') desc = `cycled Galvanic Stomatal Micro-Valves.`;

        addActivityItem(operatorName, operatorColor, 'actuator', desc);
      }

      else if (data.type === 'acoustic_chord') {
        const client = connectedOperators.get(ws);
        const operatorName = client ? client.name : 'Unknown Operator';
        const operatorColor = client ? client.color : '#f59e0b';

        currentWorkspaceState.acousticResonanceHz = data.freq;
        if (data.gain) currentWorkspaceState.distortionGain = data.gain;
        persistWorkspaceStateThrottled();

        broadcast({
          type: 'acoustic_broadcast',
          chordName: data.chordName,
          freq: data.freq,
          gain: data.gain,
          operatorName,
        }, ws);

        addActivityItem(operatorName, operatorColor, 'acoustic', `struck ${data.chordName} (${data.freq.toFixed(1)} Hz).`);
      }

      else if (data.type === 'rhythm_toggle') {
        const client = connectedOperators.get(ws);
        const operatorName = client ? client.name : 'Unknown Operator';
        const operatorColor = client ? client.color : '#3b82f6';

        currentWorkspaceState.isRhythmPlaying = data.isPlaying;
        persistWorkspaceStateThrottled();

        broadcast({
          type: 'rhythm_broadcast',
          isPlaying: data.isPlaying,
          operatorName,
        }, ws);

        addActivityItem(operatorName, operatorColor, 'acoustic', `${data.isPlaying ? 'engaged' : 'halted'} Drop-D Riff Bio-Stimulator (+45% Mitosis).`);
      }

      else if (data.type === 'remediation_change') {
        const client = connectedOperators.get(ws);
        const operatorName = client ? client.name : 'Unknown Operator';
        const operatorColor = client ? client.color : '#ef4444';

        if (data.zoneId) currentWorkspaceState.activeZoneId = data.zoneId;
        if (data.isExtracting !== undefined) currentWorkspaceState.isExtracting = data.isExtracting;
        if (data.currentPpm !== undefined) currentWorkspaceState.currentPpm = data.currentPpm;
        persistWorkspaceStateThrottled();

        broadcast({
          type: 'remediation_broadcast',
          zoneId: data.zoneId,
          isExtracting: data.isExtracting,
          currentPpm: data.currentPpm,
          operatorName,
        }, ws);

        if (data.actionDesc) {
          addActivityItem(operatorName, operatorColor, 'remediation', data.actionDesc);
        }
      }
    } catch (e) {
      console.error('Error handling WebSocket message:', e);
    }
  });

  ws.on('close', () => {
    const client = connectedOperators.get(ws);
    if (client) {
      addActivityItem(client.name, client.color, 'presence', `disconnected from the room.`);
      connectedOperators.delete(ws);
      broadcastOperatorsList();
    }
  });
});

// Setup Vite middlewares in development or static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`Ms. Heavy Metal Leaf Collaborative Platform & WebSockets running on port ${port}`);
  });
}

startServer();
