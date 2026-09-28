/**
 * Web Audio Synth Engine for Ms. Heavy Metal Leaf
 * Synthesizes guitar distortion power-chords, hydraulic purges, galvanic arcs, and bio-pulses.
 */

class HeavyMetalAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private distortionNode: WaveShaperNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.55;
  private rhythmInterval: number | null = null;
  public isRhythmPlaying: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    if (!this.ctx) {
      this.initContext();
    }
    return this.analyser;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Generates a non-linear sigmoid clipping curve for authentic heavy metal tube overdrive.
   */
  private makeDistortionCurve(amount: number = 80): Float32Array {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  /**
   * Plays a heavy metal power chord with dual detuned sawtooth oscillators and overdrive clipping.
   * @param rootFreq Frequency of root note (e.g. 73.41 for D2 Drop-D, 82.41 for E2)
   * @param duration Duration in seconds
   * @param gainAmount Overdrive crunch intensity (10 - 200)
   */
  public playPowerChord(rootFreq: number = 73.41, duration: number = 0.8, gainAmount: number = 85) {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;
      // Frequencies for root, fifth (1.5x root), and octave (2x root)
      const freqs = [rootFreq, rootFreq * 1.4983, rootFreq * 2.0];

      // Pre-gain for pushing into distortion
      const preDistortionGain = this.ctx.createGain();
      preDistortionGain.gain.setValueAtTime(2.2, now);

      // Waveshaper distortion
      const shaper = this.ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(gainAmount) as any;
      shaper.oversample = '4x';

      // Tone low-pass filter (Cabinet emulator simulation)
      const cabFilter = this.ctx.createBiquadFilter();
      cabFilter.type = 'lowpass';
      cabFilter.frequency.setValueAtTime(3200, now);
      cabFilter.Q.setValueAtTime(3.5, now);

      // Envelope gain
      const chordEnv = this.ctx.createGain();
      chordEnv.gain.setValueAtTime(0.001, now);
      chordEnv.gain.exponentialRampToValueAtTime(0.7, now + 0.04);
      chordEnv.gain.exponentialRampToValueAtTime(0.35, now + duration * 0.4);
      chordEnv.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      // Routing
      preDistortionGain.connect(shaper);
      shaper.connect(cabFilter);
      cabFilter.connect(chordEnv);
      chordEnv.connect(this.masterGain);

      // Create dual oscillators for each note with slight chorusing/detune
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();

        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';

        osc1.frequency.setValueAtTime(freq, now);
        osc2.frequency.setValueAtTime(freq * 1.004, now); // 4 cents detune

        const noteGain = this.ctx.createGain();
        noteGain.gain.setValueAtTime(idx === 0 ? 0.45 : 0.35, now);

        osc1.connect(noteGain);
        osc2.connect(noteGain);
        noteGain.connect(preDistortionGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + duration);
        osc2.stop(now + duration);
      });
    } catch (e) {
      console.error('Audio engine play error:', e);
    }
  }

  /**
   * Galvanic Electric Arc Discharge Sound (Zapping high-voltage crackle)
   */
  public playGalvanicZap(duration: number = 0.4) {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate crackling noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1400, now);
      bandpass.frequency.exponentialRampToValueAtTime(450, now + duration);
      bandpass.Q.setValueAtTime(8, now);

      const zapEnv = this.ctx.createGain();
      zapEnv.gain.setValueAtTime(0.01, now);
      zapEnv.gain.exponentialRampToValueAtTime(0.8, now + 0.02);
      zapEnv.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(bandpass);
      bandpass.connect(zapEnv);
      zapEnv.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + duration);
    } catch (e) {
      console.error('Galvanic sound error:', e);
    }
  }

  /**
   * Hydraulic Servo Purge (Pneumatic pressurized swoosh)
   */
  public playHydraulicPurge(duration: number = 0.5) {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + duration);

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.5, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(env);
      env.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + duration);
    } catch (e) {
      console.error('Hydraulic purge error:', e);
    }
  }

  /**
   * Piezo Switch Click (Crisp tactical interface sound)
   */
  public playTacticalClick() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.25, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(env);
      env.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.error('Click sound error:', e);
    }
  }

  /**
   * Starts an automated Heavy Metal Rhythm Chug (Drop-D stimulation loop)
   */
  public toggleRhythmStimulator(onBeatCallback?: (step: number) => void): boolean {
    if (this.isRhythmPlaying) {
      if (this.rhythmInterval) {
        window.clearInterval(this.rhythmInterval);
        this.rhythmInterval = null;
      }
      this.isRhythmPlaying = false;
      return false;
    }

    this.initContext();
    this.isRhythmPlaying = true;
    let step = 0;
    // Classic heavy metal palm-muted riff sequence: D -> D -> D -> F -> D -> G -> Ab -> G
    const riffNotes = [73.41, 73.41, 73.41, 87.31, 73.41, 98.0, 103.83, 98.0];

    this.rhythmInterval = window.setInterval(() => {
      const note = riffNotes[step % riffNotes.length];
      const duration = (step % 2 === 0) ? 0.22 : 0.35;
      this.playPowerChord(note, duration, 90);
      if (onBeatCallback) {
        onBeatCallback(step);
      }
      step++;
    }, 280);

    return true;
  }
}

export const audioEngine = new HeavyMetalAudioEngine();
