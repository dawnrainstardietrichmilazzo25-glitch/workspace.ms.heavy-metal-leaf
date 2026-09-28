/**
 * AudioWorkletProcessor Code for Heavy Metal DSP Synthesis
 * Runs in real-time background audio thread to eliminate UI/canvas thread stutter.
 */

export const HEAVY_METAL_WORKLET_CODE = `
class HeavyMetalDSPProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.sampleRate = 44100;
    this.phase1 = 0;
    this.phase2 = 0;
    this.phase3 = 0;
    this.targetFreq = 73.41;
    this.gainAmount = 85;
    this.envelope = 0;
    this.decayRate = 0.9997;

    // 132 BPM Bio-Mitosis Loop (44100 / (132 * 4 / 60)) ~ 5011 samples per 16th note
    this.isRhythmActive = false;
    this.rhythmSamplesPer16th = 5011;
    this.rhythmSampleCounter = 0;
    this.rhythmStep = 0;
    this.riffNotes = [73.41, 73.41, 73.41, 87.31, 73.41, 98.0, 103.83, 98.0];

    // Tesla Arc crackle burst
    this.zapRemainingSamples = 0;
    this.zapTotalSamples = 17640;

    // Hydraulic Purge swoosh
    this.purgeRemainingSamples = 0;
    this.purgeTotalSamples = 22050;

    this.port.onmessage = (event) => {
      const data = event.data;
      if (data.type === 'init') {
        this.sampleRate = data.sampleRate || 44100;
        // 132 BPM: 132 / 60 = 2.2 beats/sec -> 1/8 note = 1/(4.4) sec
        this.rhythmSamplesPer16th = Math.floor(this.sampleRate / (132 * 2 / 60));
      } else if (data.type === 'playChord') {
        this.triggerChord(data.rootFreq, data.gain, data.duration);
      } else if (data.type === 'setRhythm') {
        this.isRhythmActive = Boolean(data.isPlaying);
        if (this.isRhythmActive) {
          this.rhythmStep = 0;
          this.rhythmSampleCounter = 0;
        }
      } else if (data.type === 'playZap') {
        this.zapTotalSamples = Math.floor(this.sampleRate * (data.duration || 0.4));
        this.zapRemainingSamples = this.zapTotalSamples;
      } else if (data.type === 'playPurge') {
        this.purgeTotalSamples = Math.floor(this.sampleRate * (data.duration || 0.5));
        this.purgeRemainingSamples = this.purgeTotalSamples;
      }
    };
  }

  triggerChord(freq, gain, duration) {
    this.targetFreq = freq || 73.41;
    this.gainAmount = gain !== undefined ? gain : 85;
    this.envelope = 1.0;
    const dur = duration || 0.8;
    this.decayRate = Math.exp(-1.0 / (this.sampleRate * dur * 0.35));
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || output.length === 0) return true;
    const channelLeft = output[0];
    const channelRight = output[1] || output[0];
    const len = channelLeft.length;

    for (let i = 0; i < len; i++) {
      // 132 BPM Bio-Mitosis Loop Sequencer
      if (this.isRhythmActive) {
        this.rhythmSampleCounter++;
        if (this.rhythmSampleCounter >= this.rhythmSamplesPer16th) {
          this.rhythmSampleCounter = 0;
          const note = this.riffNotes[this.rhythmStep % this.riffNotes.length];
          const dur = (this.rhythmStep % 2 === 0) ? 0.22 : 0.35;
          this.triggerChord(note, 90, dur);
          this.port.postMessage({ type: 'beat', step: this.rhythmStep });
          this.rhythmStep++;
        }
      }

      let synthSample = 0;

      // Heavy Metal Power Chord Multi-Oscillator
      if (this.envelope > 0.0005) {
        this.phase1 += this.targetFreq / this.sampleRate;
        if (this.phase1 > 1) this.phase1 -= 1;

        // Detuned 5th harmonic (1.4983x)
        this.phase2 += (this.targetFreq * 1.4983) / this.sampleRate;
        if (this.phase2 > 1) this.phase2 -= 1;

        // Octave harmonic (2.0x)
        this.phase3 += (this.targetFreq * 2.0) / this.sampleRate;
        if (this.phase3 > 1) this.phase3 -= 1;

        const saw1 = 2 * this.phase1 - 1;
        const saw2 = 2 * this.phase2 - 1;
        const saw3 = 2 * this.phase3 - 1;

        const rawWave = (saw1 * 0.5 + saw2 * 0.3 + saw3 * 0.2) * this.envelope;

        // Tube overdrive sigmoid saturation curve
        const drive = 1.0 + (this.gainAmount / 18.0);
        synthSample = Math.tanh(rawWave * drive) * 0.7;

        this.envelope *= this.decayRate;
      }

      // 12.4 kV Galvanic Tesla Arc Burst
      let zapSample = 0;
      if (this.zapRemainingSamples > 0) {
        const white = (Math.random() * 2 - 1);
        const zapProgress = this.zapRemainingSamples / this.zapTotalSamples;
        zapSample = white * zapProgress * (Math.random() > 0.3 ? 0.5 : -0.5);
        this.zapRemainingSamples--;
      }

      // Hydraulic Purge swoosh
      let purgeSample = 0;
      if (this.purgeRemainingSamples > 0) {
        const white = (Math.random() * 2 - 1);
        const purgeProgress = this.purgeRemainingSamples / this.purgeTotalSamples;
        purgeSample = white * purgeProgress * 0.35;
        this.purgeRemainingSamples--;
      }

      const mixed = synthSample * 0.65 + zapSample * 0.5 + purgeSample * 0.4;
      channelLeft[i] = mixed;
      if (channelRight !== channelLeft) {
        channelRight[i] = mixed;
      }
    }

    return true;
  }
}

registerProcessor('heavy-metal-dsp-processor', HeavyMetalDSPProcessor);
`;
