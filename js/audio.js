/**
 * Sound FX Synthesizer using Web Audio API
 * No external MP3 files needed - 100% reliable offline & in browser
 */
class SoundEffects {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.suspenseOsc = null;
        this.suspenseGain = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopSuspense();
        }
        return this.muted;
    }

    playTone(freq, type = 'sine', duration = 0.2, gainValue = 0.2, startDelay = 0) {
        if (this.muted) return;
        this.init();
        const startTime = this.ctx.currentTime + startDelay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(gainValue, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    playCorrect() {
        if (this.muted) return;
        this.init();
        // Ascending major chord (C5, E5, G5, C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            this.playTone(freq, 'triangle', 0.35, 0.2, idx * 0.08);
        });
    }

    playWrong() {
        if (this.muted) return;
        this.init();
        // Low dissonant buzz
        this.playTone(180, 'sawtooth', 0.4, 0.25, 0);
        this.playTone(135, 'sawtooth', 0.5, 0.25, 0.1);
    }

    playTick() {
        if (this.muted) return;
        this.init();
        this.playTone(880, 'sine', 0.05, 0.1, 0);
    }

    playWarningTick() {
        if (this.muted) return;
        this.init();
        this.playTone(1174.66, 'triangle', 0.08, 0.2, 0);
    }

    playBuzzer() {
        if (this.muted) return;
        this.init();
        // High impact game-show bell/buzzer with resonant harmonics
        this.playTone(880, 'sine', 0.6, 0.35, 0);
        this.playTone(1760, 'sine', 0.5, 0.25, 0);
        this.playTone(440, 'triangle', 0.7, 0.3, 0.02);
    }

    playClick() {
        if (this.muted) return;
        this.init();
        this.playTone(600, 'sine', 0.04, 0.08, 0);
    }

    playWheelClick() {
        if (this.muted) return;
        this.init();
        this.playTone(700 + Math.random() * 200, 'triangle', 0.03, 0.1, 0);
    }

    playFanfare() {
        if (this.muted) return;
        this.init();
        const fanfareNotes = [
            { f: 523.25, d: 0.15, t: 0 },
            { f: 523.25, d: 0.15, t: 0.15 },
            { f: 523.25, d: 0.15, t: 0.3 },
            { f: 659.25, d: 0.4, t: 0.45 },
            { f: 523.25, d: 0.2, t: 0.9 },
            { f: 783.99, d: 0.6, t: 1.1 }
        ];
        fanfareNotes.forEach(n => {
            this.playTone(n.f, 'triangle', n.d, 0.25, n.t);
        });
    }

    playGoldGrab() {
        if (this.muted) return;
        this.init();
        this.playTone(400, 'sawtooth', 0.1, 0.15, 0);
        this.playTone(600, 'sine', 0.25, 0.2, 0.1);
        this.playTone(800, 'sine', 0.3, 0.2, 0.2);
    }

    playExplosion() {
        if (this.muted) return;
        this.init();
        // Noise buffer for explosion
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.5);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }

    startSuspense() {
        if (this.muted) return;
        this.init();
        this.stopSuspense();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(65.41, this.ctx.currentTime); // C2 low drone

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 1);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        this.suspenseOsc = osc;
        this.suspenseGain = gain;
    }

    stopSuspense() {
        if (this.suspenseOsc) {
            try {
                this.suspenseOsc.stop();
                this.suspenseOsc.disconnect();
            } catch(e) {}
            this.suspenseOsc = null;
        }
    }
}

window.soundFX = new SoundEffects();
