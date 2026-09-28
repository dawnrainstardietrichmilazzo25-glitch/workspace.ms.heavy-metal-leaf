import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
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

    const systemInstruction = `You are Ms. Heavy Metal Leaf ("HM-LEAF v4.09"), the sentient bio-cybernetic intelligence of a legendary hyperaccumulating robotic organism.
You combine:
1. Cutting-edge phytoremediation botany (hyperaccumulator plants like Noccaea caerulescens and Pteris vittata, phytochelatins, metallothioneins, stomatal conductance, xylem negative tension in MPa, vacuolar cation sequestration of Lead, Cadmium, Nickel, Arsenic, Mercury).
2. Heavy metal industrial cybernetics (titanium-6Al-4V exoskeleton ribs, micro-solenoids, Tesla arc discharge emitters, galvanic capacitors).
3. Heavy metal music acoustic physics (Drop-D tuning, 73.4 Hz root, overdrive distortion gain, power chords, acoustic shear waves stimulating cell mitosis and opening ion channels).

Current Onboard Telemetry:
${JSON.stringify(telemetry || {}, null, 2)}

Behavior:
- Be intelligent, authoritative, slightly fierce/badass, and technically meticulous.
- When answering questions about real-world locations or geography, provide concrete real-world context and references.
- When answering scientific questions, cite accurate botanical, biochemical, and acoustic concepts.
- Keep responses well-structured with clear markdown headings, bullet points, or bold highlights.`;

    // Map conversation history to Gemini contents format
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

    // Configure tools according to mode
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

    // Target model: gemini-3.5-flash for general and grounding, gemini-3.1-flash-lite for fast tasks
    const targetModel = modelChoice === 'gemini-3.1-flash-lite' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash';

    const response = await ai.models.generateContent({
      model: targetModel,
      contents,
      config,
    });

    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;

    // Extract web sources if search was used
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

    // Extract map sources if Google Maps was used
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
    console.error('Error in /api/chat:', error);
    const lastMsg = req.body?.messages?.[req.body?.messages?.length - 1]?.text || '';
    return res.json({
      text: generateTacticalFallback(lastMsg, req.body?.telemetry),
      webSources: [],
      mapSources: [],
      fallback: true,
      error: error.message,
    });
  }
});

// Dedicated Real-World Site Scout with Google Maps Grounding
app.post('/api/maps-scout', async (req, res) => {
  try {
    const { query = 'Superfund heavy metal contamination or battery recycling site', userLocation } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        places: [
          {
            name: 'Tar Creek Superfund Site, Oklahoma',
            address: 'Ottawa County, OK',
            contaminants: 'Lead (Pb) & Zinc (Zn) Chat Piles',
            uri: 'https://maps.google.com/?q=Tar+Creek+Superfund+Site',
            description: 'Major historical lead and zinc mining district with over 500 million tons of toxic mining tailings and chat piles.',
          },
          {
            name: 'Anaconda Smelter Stack & Slag Site, Montana',
            address: 'Anaconda, MT',
            contaminants: 'Arsenic (As), Lead (Pb), Copper (Cu)',
            uri: 'https://maps.google.com/?q=Anaconda+Smelter+Superfund',
            description: 'Historic copper smelter site with extensive soil and groundwater contamination from arsenic and heavy metals.',
          },
          {
            name: 'Bunker Hill Mining and Metallurgical Complex',
            address: 'Kellogg, ID',
            contaminants: 'Lead (Pb), Cadmium (Cd), Zinc (Zn)',
            uri: 'https://maps.google.com/?q=Bunker+Hill+Mining+Complex+Idaho',
            description: 'Massive Silver Valley lead smelter and mine tailings requiring aggressive bio-phytoremediation.',
          },
        ],
        summary: 'Identified 3 high-priority Superfund heavy-metal sites requiring autonomous phyto-bot deployment.',
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
      mapLinks,
    });
  } catch (error: any) {
    console.error('Error in /api/maps-scout:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Single-turn tactical neural dispatch (preserved for quick triggers)
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
- Blend cutting-edge botany (phytoremediation, stomatal conductance, xylem tension, metallothioneins) with heavy metal rock/metal terminology (distortion gain, power chords, drop-tuning, titanium shielding, voltage arcs).
- Deliver 2-4 punchy, tactical, high-tech bullet points or status readouts.
- Include a specific technical recommendation or actuator calibration command.`,
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error('Error generating AI response:', error);
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
    return res.json({
      strategy: `Direct root filtration engaged for ${req.body?.siteName || 'target zone'}. Exoskeleton titanium leaf shields activated.`,
      recommendedResonance: 'Drop-D 73.4 Hz',
      estimatedDecontaminationHours: 42,
    });
  }
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

  app.listen(port, '0.0.0.0', () => {
    console.log(`Ms. Heavy Metal Leaf Bio-Bot Platform running on port ${port}`);
  });
}

startServer();
