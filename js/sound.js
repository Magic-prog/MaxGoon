class SoundFX {
    constructor() {
        this.ctx = null;
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

    playTone(freq, type, duration, delay = 0, vol = 0.1) {
        try {
            this.init();
            setTimeout(() => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

                gain.gain.setValueAtTime(vol, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start();
                osc.stop(this.ctx.currentTime + duration);
            }, delay);
        } catch (e) {
            // Prevenir bloqueos de audio del navegador antes de la primera interacción
        }
    }

    // 1. Sonido al cargar el logo de la empresa (Splash Screen)
    playSplash() {
        this.playTone(300, 'sine', 0.2, 0, 0.15);
        this.playTone(450, 'sine', 0.2, 150, 0.15);
        this.playTone(600, 'triangle', 0.4, 300, 0.2);
    }

    // 2. Sonido al pasar el mouse por los botones
    playButtonHover() {
        this.playTone(440, 'sine', 0.05, 0, 0.03);
    }

    // 3. Sonido al hacer clic en los botones
    playButtonClick() {
        this.playTone(587.33, 'triangle', 0.08, 0, 0.1);
    }

    // 4. Sonido al hacer clic en una ficha (seleccionar)
    playTileSelect() {
        this.playTone(523.25, 'sine', 0.08, 0, 0.08);
    }

    // 5. Sonido al equivocarse de ficha (selección incorrecta)
    playTileError() {
        this.playTone(180, 'sawtooth', 0.15, 0, 0.1);
        this.playTone(130, 'sawtooth', 0.2, 80, 0.1);
    }

    // 6. Sonido al quitar una pareja correcta
    playMatchSuccess() {
        this.playTone(523.25, 'sine', 0.1, 0, 0.1);
        this.playTone(659.25, 'sine', 0.1, 80, 0.1);
        this.playTone(783.99, 'triangle', 0.2, 160, 0.12);
    }

    // 7. Sonido al ganar la partida
    playWin() {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((note, index) => {
            this.playTone(note, 'triangle', 0.25, index * 120, 0.15);
        });
    }

    // 8. Sonido al perder / sin movimientos
    playLose() {
        const notes = [300, 260, 220, 180];
        notes.forEach((note, index) => {
            this.playTone(note, 'sawtooth', 0.3, index * 180, 0.12);
        });
    }
}

const soundFX = new SoundFX();