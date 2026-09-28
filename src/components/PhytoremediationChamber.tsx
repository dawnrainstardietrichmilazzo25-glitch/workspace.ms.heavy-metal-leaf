import React, { useState, useEffect } from 'react';
import { RemediationZone, LeafTelemetry } from '../types/bioBot';
import { audioEngine } from '../audio/synthEngine';
import plantSpecimenImg from '../assets/images/hyperaccumulator_plant_1790606113565.jpg';
import { 
  Skull, 
  Radiation, 
  TrendingDown, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  FlaskConical,
  Bot,
  MapPin,
  ExternalLink,
  Compass,
  Search,
  Crosshair,
  Camera,
  Leaf
} from 'lucide-react';

const INITIAL_ZONES: RemediationZone[] = [
  {
    id: 'zone-chernobyl',
    name: 'Zone 01: Chernobyl Slag Flats',
    threatLevel: 'CLASS-IV CATASTROPHIC',
    description: 'Post-industrial graphite and lead slag containment pond. High concentrations of ionic Cadmium and Lead.',
    basePpm: 1250,
    contaminants: { lead: 650, cadmium: 380, nickel: 120, arsenic: 60, mercury: 40 },
    soilPh: 4.8,
    radiationRads: 320,
    completed: false,
  },
  {
    id: 'zone-detroit',
    name: 'Zone 02: Neo-Detroit Battery Junkyard',
    threatLevel: 'CLASS-III HAZARDOUS',
    description: 'Decommissioned EV battery salvage grounds. High leaching of toxic Nickel, Cobalt, and Cadmium.',
    basePpm: 880,
    contaminants: { lead: 210, cadmium: 390, nickel: 220, arsenic: 40, mercury: 20 },
    soilPh: 5.4,
    radiationRads: 45,
    completed: false,
  },
  {
    id: 'zone-atacama',
    name: 'Zone 03: Atacama Brine Tailings',
    threatLevel: 'CLASS-II MODERATE',
    description: 'Arid lithium processing runoff flats saturated with toxic Arsenic and heavy metallic salts.',
    basePpm: 640,
    contaminants: { lead: 110, cadmium: 80, nickel: 90, arsenic: 310, mercury: 50 },
    soilPh: 7.9,
    radiationRads: 12,
    completed: false,
  },
];

interface PhytoremediationChamberProps {
  telemetry: LeafTelemetry;
  onUpdateTelemetry: (patch: Partial<LeafTelemetry>) => void;
  isStimulated: boolean;
}

export const PhytoremediationChamber: React.FC<PhytoremediationChamberProps> = ({
  telemetry,
  onUpdateTelemetry,
  isStimulated,
}) => {
  const [zones, setZones] = useState<RemediationZone[]>(INITIAL_ZONES);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone-chernobyl');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [currentPpm, setCurrentPpm] = useState<number>(INITIAL_ZONES[0].basePpm);
  const [siteAnalysis, setSiteAnalysis] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Maps Grounding Scout State
  const [mapSearchQuery, setMapSearchQuery] = useState<string>('Superfund heavy metal lead zinc sites');
  const [isScouting, setIsScouting] = useState<boolean>(false);
  const [scoutedPlaces, setScoutedPlaces] = useState<any[]>([]);
  const [scoutSummary, setScoutSummary] = useState<string>('');

  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  useEffect(() => {
    setCurrentPpm(selectedZone.basePpm);
    setIsExtracting(false);
    setSiteAnalysis(null);
  }, [selectedZoneId]);

  // Extraction Interval Loop
  useEffect(() => {
    if (!isExtracting) return;

    const interval = setInterval(() => {
      const boostMultiplier = isStimulated ? 1.45 : 1.0;
      const extractionSpeed = 4.2 * boostMultiplier;

      setCurrentPpm((prev) => {
        const next = Math.max(0, prev - extractionSpeed);
        if (next === 0 && prev > 0) {
          audioEngine.playPowerChord(146.8, 1.2, 100);
        }
        return next;
      });

      const extractedIncrement = 0.015 * boostMultiplier;
      const leadInc = extractedIncrement * 0.45;
      const cadmiumInc = extractedIncrement * 0.35;
      const nickelInc = extractedIncrement * 0.20;

      onUpdateTelemetry({
        totalExtractedGrams: telemetry.totalExtractedGrams + (extractedIncrement / 1000),
        accumulatedMetals: {
          ...telemetry.accumulatedMetals,
          lead: telemetry.accumulatedMetals.lead + leadInc,
          cadmium: telemetry.accumulatedMetals.cadmium + cadmiumInc,
          nickel: telemetry.accumulatedMetals.nickel + nickelInc,
        },
        exoskeletonIntegrity: Math.min(100, telemetry.exoskeletonIntegrity + 0.05),
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isExtracting, isStimulated, telemetry, onUpdateTelemetry]);

  const handleToggleExtraction = () => {
    audioEngine.playTacticalClick();
    if (!isExtracting) {
      audioEngine.playHydraulicPurge(0.4);
    }
    setIsExtracting(!isExtracting);
  };

  const handleResetSite = () => {
    audioEngine.playTacticalClick();
    setIsExtracting(false);
    setCurrentPpm(selectedZone.basePpm);
  };

  const handleRequestSiteAnalysis = async () => {
    audioEngine.playTacticalClick();
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: selectedZone.name,
          contaminants: selectedZone.contaminants,
        }),
      });
      const data = await res.json();
      setSiteAnalysis(data);
    } catch (e) {
      setSiteAnalysis({
        strategy: 'Deploy heavy metal phytoremediation vacuolar pumps. Pulse Drop-D acoustic chug to dislodge soil cations.',
        recommendedResonance: '73.4 Hz Drop-D',
        estimatedDecontaminationHours: 36,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Google Maps Grounding Scout Call
  const handleScoutRealSites = async () => {
    if (!mapSearchQuery.trim() || isScouting) return;
    audioEngine.playTacticalClick();
    setIsScouting(true);

    try {
      const res = await fetch('/api/maps-scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mapSearchQuery }),
      });
      if (!res.ok) {
        setScoutedPlaces([
          { name: 'Tar Creek Superfund Site, Oklahoma', uri: 'https://maps.google.com/?q=Tar+Creek+Superfund+Site+Oklahoma', address: 'Ottawa County, OK', contaminants: 'Lead (Pb-82), Zinc (Zn-30)' },
          { name: 'Berkeley Pit Acid Mine Drainage, Montana', uri: 'https://maps.google.com/?q=Berkeley+Pit+Superfund+Butte+Montana', address: 'Butte, MT', contaminants: 'Arsenic (As-33), Cadmium (Cd-48)' },
          { name: 'Bunker Hill Mining Complex, Idaho', uri: 'https://maps.google.com/?q=Bunker+Hill+Mining+Complex+Idaho', address: 'Silver Valley, ID', contaminants: 'Lead (Pb-82), Cadmium (Cd-48)' },
        ]);
        setScoutSummary('Satellite telemetry retrieved from offline Superfund database.');
        return;
      }
      const data = await res.json();

      if (data.places) {
        setScoutedPlaces(data.places);
      } else if (data.mapLinks) {
        setScoutedPlaces(data.mapLinks);
      }
      setScoutSummary(data.summary || '');
    } catch {
      setScoutedPlaces([
        { name: 'Tar Creek Superfund Site, Oklahoma', uri: 'https://maps.google.com/?q=Tar+Creek+Superfund+Site+Oklahoma', address: 'Ottawa County, OK', contaminants: 'Lead (Pb-82), Zinc (Zn-30)' },
        { name: 'Berkeley Pit Acid Mine Drainage, Montana', uri: 'https://maps.google.com/?q=Berkeley+Pit+Superfund+Butte+Montana', address: 'Butte, MT', contaminants: 'Arsenic (As-33), Cadmium (Cd-48)' },
      ]);
      setScoutSummary('Retained high-priority Superfund targets from offline database.');
    } finally {
      setIsScouting(false);
    }
  };

  const handleDeployToScoutedSite = (site: any) => {
    audioEngine.playTacticalClick();
    audioEngine.playHydraulicPurge(0.5);

    const customId = `scouted-${Date.now()}`;
    const newZone: RemediationZone = {
      id: customId,
      name: site.name || site.title || 'Scouted Superfund Zone',
      threatLevel: 'CLASS-IV CATASTROPHIC',
      description: site.description || `Real-world hazardous waste site located via Google Maps Grounding.`,
      basePpm: 950,
      contaminants: { lead: 420, cadmium: 280, nickel: 150, arsenic: 60, mercury: 40 },
      soilPh: 5.2,
      radiationRads: 18,
      completed: false,
    };

    setZones((prev) => [newZone, ...prev]);
    setSelectedZoneId(customId);
  };

  const percentageCleaned = Math.min(
    100,
    Math.max(0, ((selectedZone.basePpm - currentPpm) / selectedZone.basePpm) * 100)
  );

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-5 shadow-xl backdrop-blur">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-950/80 border border-red-600/40 text-red-400">
            <Radiation className="h-5 w-5 animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide font-heading text-zinc-100 flex items-center gap-2">
              PHYTOREMEDIATION EXTRACTION CHAMBER
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                selectedZone.threatLevel.includes('CATASTROPHIC')
                  ? 'bg-red-950 text-red-300 border-red-800'
                  : 'bg-amber-950 text-amber-300 border-amber-800'
              }`}>
                {selectedZone.threatLevel}
              </span>
            </h3>
            <p className="text-[11px] font-mono text-zinc-400">
              Vacuolar Sequestration of Toxic Soil Cations & Armor Transmutation
            </p>
          </div>
        </div>

        {/* Site Selector Dropdown */}
        <select
          value={selectedZoneId}
          onChange={(e) => {
            audioEngine.playTacticalClick();
            setSelectedZoneId(e.target.value);
          }}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-mono text-zinc-200 focus:border-emerald-500 focus:outline-none"
        >
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
      </div>

      {/* Main Chamber Gauges & Live Soil PPM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Soil PPM Gauge */}
        <div className="rounded-lg border border-red-950/80 bg-zinc-900/60 p-3.5 md:col-span-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
              <Skull className="h-3.5 w-3.5 text-red-400" />
              TARGET SOIL CONTAMINATION LEVEL
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              INITIAL: {selectedZone.basePpm} PPM
            </span>
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-red-400 tracking-tight">
              {currentPpm.toFixed(1)}
            </span>
            <span className="text-sm font-mono text-zinc-500">PPM (PARTS PER MILLION)</span>

            {isExtracting && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 animate-pulse flex items-center gap-1">
                <TrendingDown className="h-3.5 w-3.5" />
                EXTRACTING {isStimulated ? '(+45% OVERDRIVE)' : ''}
              </span>
            )}
          </div>

          {/* Decontamination Progress Bar */}
          <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 my-2">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${percentageCleaned}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-zinc-400">
            <span>TOXIC SATURATION</span>
            <span>DECONTAMINATION: <strong className="text-emerald-300">{percentageCleaned.toFixed(1)}%</strong></span>
            <span>CLEAN PURGE</span>
          </div>
        </div>

        {/* Transmutation Armor Boost Card */}
        <div className="rounded-lg border border-purple-950/80 bg-zinc-900/60 p-3.5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono text-purple-300 font-semibold flex items-center gap-1.5 mb-1">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
              ARMOR TRANSMUTATION
            </div>
            <p className="text-[10px] text-zinc-400 leading-snug">
              Extracted heavy metals are synthesized into protective nanostructured foliar plates.
            </p>
          </div>

          <div className="my-2">
            <div className="text-[10px] font-mono text-zinc-500">TITANIUM ALLOY INTEGRITY</div>
            <div className="text-2xl font-bold font-mono text-purple-200">
              {telemetry.exoskeletonIntegrity.toFixed(1)}%
            </div>
          </div>

          <div className="text-[10px] font-mono text-zinc-400 bg-zinc-950/80 px-2 py-1 rounded border border-zinc-800">
            Total Mass Harvested: <strong className="text-amber-300">{(telemetry.totalExtractedGrams * 1000).toFixed(0)} mg</strong>
          </div>
        </div>
      </div>

      {/* Living Hyperaccumulator Specimen Planter Monitoring Card */}
      <div className="rounded-lg border border-emerald-900/60 bg-zinc-950/80 p-3.5 shadow flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-64 h-36 rounded-lg overflow-hidden border border-zinc-800 flex-shrink-0 group">
          <img
            src={plantSpecimenImg}
            alt="Living Hyperaccumulator Specimen - Brassica with Yellow Blooms"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[9px] font-mono text-emerald-300 bg-black/60 px-1.5 py-0.5 rounded">
            <span className="flex items-center gap-1 font-bold">
              <Leaf className="h-2.5 w-2.5 text-emerald-400" />
              SOIL TEST BED #04
            </span>
            <span>BLOOMING PHASE</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1.5 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
            <div className="flex items-center gap-2">
              <Camera className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-bold text-zinc-100 uppercase">
                Botanical In-Situ Specimen: Brassica Hyperaccumulator
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              ACTIVE PHYTO-BIOREACTOR
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Real living test beds of <em>Brassica juncea</em> with bright yellow cruciferous blooms and serrated leaves growing directly in heavy metal tailings. Micro-electrodes and sap sensors interface living foliar tissue with Ms. Heavy Metal Leaf's robotic telemetry.
          </p>

          <div className="grid grid-cols-3 gap-2 mt-1 pt-1.5 border-t border-zinc-900 text-[10px]">
            <div className="bg-zinc-900/60 p-1.5 rounded border border-zinc-800/80">
              <span className="text-zinc-500 block">ROOT CATION UPTAKE</span>
              <strong className="text-emerald-300">18.4 mg/kg/hr</strong>
            </div>
            <div className="bg-zinc-900/60 p-1.5 rounded border border-zinc-800/80">
              <span className="text-zinc-500 block">ACOUSTIC DILATION</span>
              <strong className={isStimulated ? 'text-amber-400 font-bold' : 'text-zinc-300'}>
                {isStimulated ? '+45% (OVERDRIVE)' : 'BASELINE'}
              </strong>
            </div>
            <div className="bg-zinc-900/60 p-1.5 rounded border border-zinc-800/80">
              <span className="text-zinc-500 block">PHYTOCHELATIN (PC2)</span>
              <strong className="text-cyan-300">HIGH AFFINITY</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Contaminant Composition Breakdown */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/90 p-3.5">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <FlaskConical className="h-3.5 w-3.5 text-emerald-400" />
            ZONE CHEMICAL CONSTITUENTS BREAKDOWN
          </span>
          <span className="text-[10px] text-zinc-500">
            Soil pH: <strong className="text-zinc-300">{selectedZone.soilPh}</strong> | Rads: <strong className="text-zinc-300">{selectedZone.radiationRads} R/h</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
          <div className="rounded border border-amber-900/40 bg-zinc-900/60 p-2">
            <div className="text-[10px] text-zinc-500">LEAD (Pb-82)</div>
            <div className="text-sm font-bold text-amber-300">{selectedZone.contaminants.lead} PPM</div>
          </div>
          <div className="rounded border border-amber-900/40 bg-zinc-900/60 p-2">
            <div className="text-[10px] text-zinc-500">CADMIUM (Cd-48)</div>
            <div className="text-sm font-bold text-amber-300">{selectedZone.contaminants.cadmium} PPM</div>
          </div>
          <div className="rounded border border-cyan-900/40 bg-zinc-900/60 p-2">
            <div className="text-[10px] text-zinc-500">NICKEL (Ni-28)</div>
            <div className="text-sm font-bold text-cyan-300">{selectedZone.contaminants.nickel} PPM</div>
          </div>
          <div className="rounded border border-purple-900/40 bg-zinc-900/60 p-2">
            <div className="text-[10px] text-zinc-500">ARSENIC (As-33)</div>
            <div className="text-sm font-bold text-purple-300">{selectedZone.contaminants.arsenic} PPM</div>
          </div>
          <div className="rounded border border-red-900/40 bg-zinc-900/60 p-2">
            <div className="text-[10px] text-zinc-500">MERCURY (Hg-80)</div>
            <div className="text-sm font-bold text-red-300">{selectedZone.contaminants.mercury} PPM</div>
          </div>
        </div>
      </div>

      {/* Control Actuators & AI Assessment Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleExtraction}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider border transition-all ${
              isExtracting
                ? 'border-red-600 bg-red-950 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                : 'border-emerald-600 bg-emerald-950 text-emerald-200 hover:bg-emerald-900'
            }`}
          >
            {isExtracting ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isExtracting ? 'PAUSE EXTRACTION' : 'DEPLOY PHYTO-EXTRACTION'}
          </button>

          <button
            onClick={handleResetSite}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            RESET ZONE
          </button>
        </div>

        <button
          onClick={handleRequestSiteAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-emerald-700/60 bg-zinc-900 text-xs font-mono text-emerald-300 hover:bg-zinc-800 disabled:opacity-50"
        >
          <Bot className="h-4 w-4 text-emerald-400" />
          {isAnalyzing ? 'RUNNING TACTICAL AI SCAN...' : 'AI TACTICAL SITE ANALYSIS'}
        </button>
      </div>

      {/* AI Tactical Assessment Result Callout */}
      {siteAnalysis && (
        <div className="rounded-lg border border-emerald-700/80 bg-emerald-950/20 p-3.5 text-xs font-mono text-zinc-200">
          <div className="flex items-center justify-between text-emerald-400 font-bold mb-1">
            <span>[NEURAL BOTANICAL STRATEGY DISPATCH]</span>
            <span className="text-[10px] text-zinc-400">Est. Purge Time: {siteAnalysis.estimatedDecontaminationHours || 36}h</span>
          </div>
          <p className="leading-relaxed text-zinc-300 mb-2">
            {siteAnalysis.strategy}
          </p>
          {siteAnalysis.recommendedResonance && (
            <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-zinc-950/80 p-2 rounded border border-zinc-800">
              <Sparkles className="h-3.5 w-3.5" />
              RECOMMENDED ACOUSTIC RESONANCE: <strong>{siteAnalysis.recommendedResonance}</strong>
            </div>
          )}
        </div>
      )}

      {/* REAL-WORLD GLOBAL HAZARD SITE SCOUT (GOOGLE MAPS GROUNDED) */}
      <div className="rounded-xl border border-emerald-800/80 bg-zinc-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-emerald-400" />
            <h4 className="text-xs font-bold font-mono text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              REAL-WORLD HAZARD SITE SCOUT
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                GOOGLE MAPS GROUNDED
              </span>
            </h4>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            Powered by gemini-3.5-flash with googleMaps tool
          </span>
        </div>

        {/* Scout Search Bar */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={mapSearchQuery}
              onChange={(e) => setMapSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScoutRealSites()}
              placeholder="Search real toxic sites, battery junkyards, lead smelters, or mining tailings worldwide..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-9 pr-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleScoutRealSites}
            disabled={isScouting || !mapSearchQuery.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-zinc-950 text-xs font-mono font-bold hover:bg-emerald-500 disabled:opacity-50"
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>{isScouting ? 'SCOUTING...' : 'SCOUT SITES'}</span>
          </button>
        </div>

        {/* Scout Results Grid */}
        {scoutedPlaces.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-2">
            {scoutedPlaces.map((place, idx) => {
              const placeTitle = place.name || place.title || 'Contaminated Hazard Site';
              const placeUri = place.uri || `https://maps.google.com/?q=${encodeURIComponent(placeTitle)}`;
              return (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-3 gap-2"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <h5 className="text-xs font-bold font-mono text-emerald-300 line-clamp-1">
                        {placeTitle}
                      </h5>
                      <a
                        href={placeUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-emerald-400 p-0.5"
                        title="View on Google Maps"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    {place.address && (
                      <div className="text-[10px] font-mono text-zinc-500 mb-1">
                        {place.address}
                      </div>
                    )}
                    {place.contaminants && (
                      <div className="text-[10px] font-mono text-amber-400 mb-1">
                        Contaminants: {place.contaminants}
                      </div>
                    )}
                    {place.description && (
                      <p className="text-[10px] text-zinc-400 line-clamp-2">
                        {place.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-900 mt-1">
                    <a
                      href={placeUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <MapPin className="h-3 w-3" />
                      Maps Link
                    </a>

                    <button
                      onClick={() => handleDeployToScoutedSite(place)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-950 border border-emerald-800 text-[10px] font-mono font-bold text-emerald-300 hover:bg-emerald-900"
                    >
                      <Crosshair className="h-3 w-3" />
                      LOAD SITE
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
