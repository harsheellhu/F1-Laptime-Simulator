/**
 * Formula 1 V6 Turbo Hybrid Engine Sound Synthesizer (Web Audio API)
 * Generates dynamic, zero-dependency real-time F1 engine audio:
 * - Multi-harmonic engine cylinder firing oscillators
 * - Resonant bandpass turbocharger spool whistle
 * - Overdrive exhaust distortion
 * - Dynamic throttle & RPM modulation on cursor interaction
 */

class F1EngineSound {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.filter = null;
    this.turboFilter = null;
    this.turboGain = null;
    this.osc1 = null;
    this.osc2 = null;
    this.osc3 = null;
    this.noiseNode = null;
    this.isMuted = false;
    this.targetRpm = 0.2;
    this.currentRpm = 0.2;
    this.animId = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);

      // Lowpass Engine Filter
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(600, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      // Distortion Overdrive
      const distortion = this.ctx.createWaveShaper();
      distortion.curve = this._makeDistortionCurve(18);
      distortion.oversample = '2x';

      // Connect Chain: Oscillators -> Filter -> Distortion -> MasterGain -> Destination
      this.filter.connect(distortion);
      distortion.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // Turbo Whistle Noise Source
      this._initTurbo();

      this._loopRpm();
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  _makeDistortionCurve(amount) {
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  _initTurbo() {
    if (!this.ctx) return;
    // 2-second white noise buffer for turbo spool
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    this.turboFilter = this.ctx.createBiquadFilter();
    this.turboFilter.type = 'bandpass';
    this.turboFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);
    this.turboFilter.Q.setValueAtTime(14.0, this.ctx.currentTime);

    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.noiseNode.connect(this.turboFilter);
    this.turboFilter.connect(this.turboGain);
    this.turboGain.connect(this.masterGain);
    this.noiseNode.start();
  }

  start() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (!this.isPlaying) {
      const now = this.ctx.currentTime;

      // 1. Primary Engine Oscillator (V6 Firing Fundamental)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.setValueAtTime(95, now);

      // 2. Harmonic Upper Octave (High-Pitch Scream)
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'sawtooth';
      this.osc2.frequency.setValueAtTime(190, now);

      // 3. Sub-Bass Exhaust Thump
      this.osc3 = this.ctx.createOscillator();
      this.osc3.type = 'triangle';
      this.osc3.frequency.setValueAtTime(47.5, now);

      const oscGain1 = this.ctx.createGain();
      oscGain1.gain.value = 0.5;
      const oscGain2 = this.ctx.createGain();
      oscGain2.gain.value = 0.35;
      const oscGain3 = this.ctx.createGain();
      oscGain3.gain.value = 0.3;

      this.osc1.connect(oscGain1).connect(this.filter);
      this.osc2.connect(oscGain2).connect(this.filter);
      this.osc3.connect(oscGain3).connect(this.filter);

      this.osc1.start();
      this.osc2.start();
      this.osc3.start();

      this.isPlaying = true;
    }

    if (this.masterGain && !this.isMuted) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(0.28, now, 0.08);
    }
  }

  setThrottle(intensity = 0.5) {
    this.targetRpm = Math.min(1.0, Math.max(0.15, intensity));
    if (!this.isPlaying) {
      this.start();
    }
  }

  stop() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.targetRpm = 0.15;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(0, now, 0.25);
  }

  _loopRpm() {
    const update = () => {
      if (this.ctx && this.isPlaying) {
        // Smooth RPM interpolation
        this.currentRpm += (this.targetRpm - this.currentRpm) * 0.12;

        const now = this.ctx.currentTime;
        const rpm = this.currentRpm; // 0.15 (idle) to 1.0 (redline)

        // Fundamental frequencies (90Hz idle -> 340Hz redline scream)
        const f0 = 90 + rpm * 260;
        if (this.osc1) this.osc1.frequency.setTargetAtTime(f0, now, 0.05);
        if (this.osc2) this.osc2.frequency.setTargetAtTime(f0 * 2, now, 0.05);
        if (this.osc3) this.osc3.frequency.setTargetAtTime(f0 * 0.5, now, 0.05);

        // Lowpass cutoff sweep (800Hz -> 4800Hz)
        if (this.filter) {
          const cutoff = 600 + Math.pow(rpm, 1.8) * 4200;
          this.filter.frequency.setTargetAtTime(cutoff, now, 0.05);
        }

        // Turbo whistle frequency & gain sweep
        if (this.turboFilter && this.turboGain) {
          const turboFreq = 1600 + rpm * 2400;
          const turboVol = Math.max(0, (rpm - 0.25) * 0.18);
          this.turboFilter.frequency.setTargetAtTime(turboFreq, now, 0.06);
          this.turboGain.gain.setTargetAtTime(turboVol, now, 0.06);
        }
      }
      this.animId = requestAnimationFrame(update);
    };
    this.animId = requestAnimationFrame(update);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      const now = this.ctx ? this.ctx.currentTime : 0;
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.28, now, 0.05);
    }
    return this.isMuted;
  }
}

export const f1Sound = new F1EngineSound();
