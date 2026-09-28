/**
 * Web Audio Synth Engine for Ms. Heavy Metal Leaf
 * Powered by dedicated Web Audio Worklet DSP for jitter-free real-time synthesis.
 */

import { HEAVY_METAL_WORKLET_CODE } from './workletProcessorCode';

class HeavyMetalAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private isWorkletReady: boolean = false;
  private isMuted: boolean = false;
  private volume: number = 0.55;
  private rhythmInterval: number | null = null;
  public isRhythmPlaying: boolean = false;
  private onBeatCallback?: (step: number) => void;

  private async initContext() {
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

      // Attempt initializing dedicated AudioWorkletNode
      if (this.ctx.audioWorklet) {
        try {
          const blob = new Blob([HEAVY_METAL_WORKLET_CODE], { type: 'application/javascript' });
          const blobUrl = URL.createObjectURL(blob);
          await this.ctx.audioWorklet.addModule(blobUrl);

          this.workletNode = new AudioWorkletNode(this.ctx, 'heavy-metal-dsp-processor', {
            outputChannelCount: [2],
          });
          this.workletNode.port.postMessage({ type: 'init', sampleRate: this.ctx.sampleRate });

          this.workletNode.port.onmessage = (event) => {
            if (event.data?.type === 'beat' && this.onBeatCallback) {
              this.onBeatCallback(event.data.step);
            }
          };

          this.workletNode.connect(this.masterGain);
          this.isWorkletReady = true;
          URL.revokeObjectURL(blobUrl);
        } catch (workletErr) {
          console.warn('AudioWorklet initialization fallback to standard WebAudio nodes:', workletErr);
          this.isWorkletReady = false;
        }
      }
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
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
   * Non-linear sigmoid clipping curve for standard nodes fallback
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
   * Plays a heavy metal power chord via AudioWorklet (or fallback standard nodes)
   */
  public playPowerChord(rootFreq: number = 73.41, duration: number = 0.8, gainAmount: number = 85) {
    this.initContext();

    if (this.isWorkletReady && this.workletNode) {
      this.workletNode.port.postMessage({
        type: 'playChord',
        rootFreq,
        gain: gainAmount,
        duration,
      });
      return;
    }

    // Standard Web Audio fallback if worklet is not yet ready
    try {
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const freqs = [rootFreq, rootFreq * 1.4983, rootFreq * 2.0];

      const preDistortionGain = this.ctx.createGain();
      preDistortionGain.gain.setValueAtTime(2.2, now);

      const shaper = this.ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(gainAmount) as any;
      shaper.oversample = '4x';

      const postFilter = this.ctx.createBiquadFilter();
      postFilter.type = 'lowpass';
      postFilter.frequency.setValueAtTime(4500, now);

      const chordGain = this.ctx.createGain();
      chordGain.gain.setValueAtTime(0.001, now);
      chordGain.gain.linearRampToValueAtTime(0.45, now + 0.02);
      chordGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime((idx === 0 ? 0 : idx === 1 ? -4 : 6), now);

        osc.connect(preDistortionGain);
        osc.start(now);
        osc.stop(now + duration + 0.05);
      });

      preDistortionGain.connect(shaper);
      shaper.connect(postFilter);
      postFilter.connect(chordGain);
      chordGain.connect(this.masterGain);
    } catch (e) {
      console.error('Power chord audio error:', e);
    }
  }

  /**
   * Galvanic Tesla Arc (12.4 kV discharge crackle)
   */
  public playGalvanicZap(duration: number = 0.4) {
    this.initContext();

    if (this.isWorkletReady && this.workletNode) {
      this.workletNode.port.postMessage({ type: 'playZap', duration });
      return;
    }

    try {
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.3 ? 1 : 0);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(3200, now);
      bandpass.Q.setValueAtTime(4.0, now);

      const zapEnv = this.ctx.createGain();
      zapEnv.gain.setValueAtTime(0.65, now);
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
    this.initContext();

    if (this.isWorkletReady && this.workletNode) {
      this.workletNode.port.postMessage({ type: 'playPurge', duration });
      return;
    }

    try {
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
   * Piezo Switch Click
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
   * Automated 132 BPM Heavy Metal Rhythm Chug (Drop-D bio-mitosis pulse)
   */
  public toggleRhythmStimulator(onBeatCallback?: (step: number) => void): boolean {
    this.initContext();
    this.onBeatCallback = onBeatCallback;

    if (this.isWorkletReady && this.workletNode) {
      this.isRhythmPlaying = !this.isRhythmPlaying;
      this.workletNode.port.postMessage({
        type: 'setRhythm',
        isPlaying: this.isRhythmPlaying,
      });
      return this.isRhythmPlaying;
    }

    // Fallback timer if worklet is not ready
    if (this.isRhythmPlaying) {
      if (this.rhythmInterval) {
        window.clearInterval(this.rhythmInterval);
        this.rhythmInterval = null;
      }
      this.isRhythmPlaying = false;
      return false;
    }

    this.isRhythmPlaying = true;
    let step = 0;
    const riffNotes = [73.41, 73.41, 73.41, 87.31, 73.41, 98.0, 103.83, 98.0];

    // 132 BPM interval ~ 227 ms per 8th note
    this.rhythmInterval = window.setInterval(() => {
      const note = riffNotes[step % riffNotes.length];
      const duration = (step % 2 === 0) ? 0.22 : 0.35;
      this.playPowerChord(note, duration, 90);
      if (onBeatCallback) {
        onBeatCallback(step);
      }
      step++;
    }, 227);

    return true;
  }
}

export const audioEngine = new HeavyMetalAudioEngine();
