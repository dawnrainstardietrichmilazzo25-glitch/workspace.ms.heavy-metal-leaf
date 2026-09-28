import { LeafTelemetry } from '../types/bioBot';

export interface ParsedCommandResult {
  hasCommand: boolean;
  rawText: string;
  telemetryPatch?: Partial<LeafTelemetry>;
  actuatorTrigger?: string; // 'zap' | 'purge' | 'shield' | 'stomata'
  acousticUpdate?: {
    freq?: number;
    gain?: number;
    chordName?: string;
  };
  rhythmToggle?: boolean;
  remediationUpdate?: {
    zoneId?: string;
    zoneName?: string;
    isExtracting?: boolean;
  };
  warnings: string[];
  confirmations: string[];
  systemFeedback: string;
  logDetail: string;
}

// Grounded Botanical & Biophysical Boundary Constraints
export const BOTANICAL_LIMITS = {
  leafAngle: {
    min: -45,
    max: 45,
    unit: '°',
  },
  sapTension: {
    // In plant vascular physiology, negative pressure/tension threshold before cavitation embolism
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

/**
 * Validates and clamps a leaf angle value within botanical pulvinus flexion limits (-45° to +45°).
 */
export function validateAndClampLeafAngle(val: number): { clamped: number; wasClamped: boolean; warning?: string } {
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

/**
 * Validates and clamps xylem hydraulic tension.
 * Handles both negative pressure notation (-5.0 MPa) and positive magnitude (5.0 MPa).
 * Critical real-world botanical limit: 2.5 MPa (-2.5 MPa) to prevent xylem embolism.
 */
export function validateAndClampSapTension(val: number, isExplicitNegative: boolean): { clamped: number; wasClamped: boolean; warning?: string; displayStr: string } {
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

/**
 * Parses natural language commands typed by operators in the chat deck or command bar.
 */
export function parseNaturalLanguageCommand(text: string, currentTelemetry?: LeafTelemetry): ParsedCommandResult {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  const warnings: string[] = [];
  const confirmations: string[] = [];
  const telemetryPatch: Partial<LeafTelemetry> = {};
  let actuatorTrigger: string | undefined;
  let acousticUpdate: { freq?: number; gain?: number; chordName?: string } | undefined;
  let rhythmToggle: boolean | undefined;
  let remediationUpdate: { zoneId?: string; zoneName?: string; isExtracting?: boolean } | undefined;
  let hasCommand = false;

  // 1. HELIOTROPIC PITCH / LEAF ANGLE
  // Matches: "set leaf pitch to +20 degrees", "pitch -30", "tilt leaf up 15 deg", "angle 25"
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

  // 2. XYLEM HYDRAULIC TENSION / SAP PRESSURE
  // Matches: "Increase sap hydraulic tension to -5.0 MPa", "set sap pressure to 1.8 MPa", "tension 2.1"
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

  // 3. XYLEM SAP FLUSH / PURGE LINES
  // Matches: "flush the xylem sap", "purge lines", "flush xylem lines"
  if (lower.match(/(?:flush|purge|clean|clear|rinse)\s*(?:the\s*)?(?:xylem|sap|lines|hydraulic|fluid|tubes|conduits)/i) ||
      (lower.includes('flush') && lower.includes('sap')) ||
      (lower.includes('purge') && lower.includes('xylem'))) {
    hasCommand = true;
    actuatorTrigger = 'purge';
    telemetryPatch.sapPressure = 1.20;
    telemetryPatch.hydraulicFlowRate = 64.0;
    confirmations.push(`Xylem Hydraulic Sap lines flushed (flow pulsed to 64.0 mL/min)`);
  }

  // 4. GALVANIC TESLA ARC (12.4 kV)
  // Matches: "fire galvanic tesla arc", "zap", "discharge 12.4 kv arc"
  if (lower.match(/(?:fire|discharge|zap|trigger|shoot|release|engage)\s*(?:the\s*)?(?:12\.4\s*kv\s*)?(?:galvanic|tesla|arc|capacitor|shock|lightning|voltage)/i) ||
      lower === 'zap' || lower.startsWith('zap ') || lower.endsWith(' zap')) {
    hasCommand = true;
    actuatorTrigger = 'zap';
    confirmations.push(`Galvanic Tesla Arc (12.4 kV) discharged across foliar lattice`);
  }

  // 5. TITANIUM PHYTO-CHITIN SHIELD
  // Matches: "deploy shield", "raise titanium shield", "deactivate shield", "drop shield"
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

  // 6. STOMATAL MICRO-VALVES
  // Matches: "cycle stomatal micro-valves", "open stomata", "dilate stomatal pores"
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

  // 7. ACOUSTIC FREQUENCY / POWER CHORDS
  // Matches: "tune acoustic frequency to 73.4 Hz", "set frequency to 82 Hz", "resonance 73.4"
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

  // 8. DISTORTION GAIN
  // Matches: "set distortion gain to 90%", "gain 85"
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

  // 9. ACOUSTIC RHYTHM / RIFF BIO-STIMULATOR
  // Matches: "engage drop-d riff stimulator", "start rhythm", "stop riff"
  if (lower.match(/(?:start|engage|play|enable|crank)\s*(?:the\s*)?(?:drop-d\s*)?(?:riff|rhythm|bio-stimulator|acoustic\s*stimulation|mitosis\s*pulse)/i)) {
    hasCommand = true;
    rhythmToggle = true;
    confirmations.push(`Drop-D Riff Bio-Stimulator engaged (+45% cellular mitosis rate)`);
  } else if (lower.match(/(?:stop|halt|pause|disable|mute)\s*(?:the\s*)?(?:drop-d\s*)?(?:riff|rhythm|bio-stimulator|acoustic\s*stimulation)/i)) {
    hasCommand = true;
    rhythmToggle = false;
    confirmations.push(`Drop-D Riff Bio-Stimulator disengaged`);
  }

  // 10. PHYTOREMEDIATION ZONE SELECTION
  // Matches: "switch zone to Tar Creek", "target Berkeley Pit", "remediate Bunker Hill"
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

  // 11. VACUUM EXTRACTION PURGE
  // Matches: "start vacuum extraction", "engage extraction", "stop vacuum"
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

  // 12. CONVERSATIONAL HEURISTICS (Overheating, storm, sunlight, rapid uptake)
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
