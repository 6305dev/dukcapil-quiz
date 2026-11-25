let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function unlockAudio() {
  getAudioContext();
}

/**
 * Suara ketukan (woodblock/clock tick) untuk hitung mundur.
 * @param {boolean} urgent - nada lebih tegas saat sisa <= 5 detik
 */
export function playTickSound(urgent = false) {
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  const startFreq = urgent ? 1150 : 780;
  const endFreq = urgent ? 460 : 300;
  const duration = urgent ? 0.065 : 0.05;
  const peakGain = urgent ? 0.28 : 0.16;

  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(peakGain, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.01);
}

/**
 * Ketukan ganda singkat saat waktu soal habis.
 */
export function playTimeoutSound() {
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  const now = ctx.currentTime;
  [0, 0.11].forEach((offset) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now + offset);
    osc.frequency.exponentialRampToValueAtTime(220, now + offset + 0.08);

    gain.gain.setValueAtTime(0.001, now + offset);
    gain.gain.linearRampToValueAtTime(0.24, now + offset + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + offset);
    osc.stop(now + offset + 0.09);
  });
}

/**
 * Suara terompet / fanfare perayaan saat menyelesaikan kuis.
 */
export function playTrumpetFanfare() {
  if (typeof window !== 'undefined' && localStorage.getItem('quiz_muted') === '1') return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const trigger = () => {
    const now = ctx.currentTime;
    // Fanfare: C5 -> E5 -> G5 -> C6 (tahan)
    const notes = [
      { freq: 523.25, start: 0.0, dur: 0.14 },
      { freq: 659.25, start: 0.14, dur: 0.14 },
      { freq: 783.99, start: 0.28, dur: 0.14 },
      { freq: 1046.5, start: 0.43, dur: 0.55 }
    ];

    notes.forEach(({ freq, start, dur }) => {
      const t0 = now + start;
      const t1 = t0 + dur;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      // Karakter brass/terompet dari sawtooth + detune tipis
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, t0);
      osc2.frequency.setValueAtTime(freq * 1.004, t0);

      // Filter brassy attack
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(2.5, t0);
      filter.frequency.setValueAtTime(650, t0);
      filter.frequency.exponentialRampToValueAtTime(2600, t0 + 0.045);
      filter.frequency.exponentialRampToValueAtTime(1400, t1);

      // Envelope tiupan terompet
      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.18, t0 + 0.025);
      gain.gain.setValueAtTime(0.16, t1 - 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t1 + 0.04);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(t0);
      osc2.start(t0);
      osc1.stop(t1 + 0.05);
      osc2.stop(t1 + 0.05);
    });
  };

  if (ctx.state === 'running') {
    trigger();
  } else {
    ctx.resume().then(trigger).catch(() => {});
  }
}

/**
 * Efek suara klik pin (flapper) saat spinning wheel melewati segmen hadiah.
 * @param {number} speedRatio - 0..1 (1 = putaran awal cepat, 0 = hampir berhenti)
 * @param {boolean} muted - apakah audio di-mute
 */
export function playWheelPegTick(speedRatio = 0.5, muted = false) {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  const now = ctx.currentTime;
  const clamped = Math.max(0, Math.min(1, speedRatio));

  // Bunyi klik mekanis plastik/kayu dari flapper mengenai pin roda
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  const highFreq = 920 + clamped * 480;
  const lowFreq = 260 + clamped * 120;
  const duration = 0.032 + (1 - clamped) * 0.022;
  const peak = 0.14 + (1 - clamped) * 0.09;

  osc.frequency.setValueAtTime(highFreq, now);
  osc.frequency.exponentialRampToValueAtTime(lowFreq, now + duration);

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1200, now);
  filter.Q.setValueAtTime(1.4, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.01);
}

/**
 * Suara terompet meriah (royal trumpet fanfare + harmoni) saat hadiah doorprize terpilih.
 * @param {boolean} muted - apakah audio di-mute
 */
export function playDoorprizeTrumpet(muted = false) {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const trigger = () => {
    const now = ctx.currentTime;
    // Melodi fanfare terompet kemenangan + akord harmoni C Mayor
    const voices = [
      // Lead Trumpet: G4 -> C5 -> E5 -> G5 -> E5 -> G5 (tahan megah)
      { freq: 392.0, start: 0.0, dur: 0.11, vol: 0.17 },
      { freq: 523.25, start: 0.11, dur: 0.11, vol: 0.18 },
      { freq: 659.25, start: 0.22, dur: 0.11, vol: 0.19 },
      { freq: 783.99, start: 0.34, dur: 0.22, vol: 0.21 },
      { freq: 659.25, start: 0.58, dur: 0.13, vol: 0.18 },
      { freq: 1046.5, start: 0.73, dur: 0.78, vol: 0.22 },
      // Harmony Brass pada nada puncak
      { freq: 783.99, start: 0.73, dur: 0.78, vol: 0.14 },
      { freq: 659.25, start: 0.73, dur: 0.78, vol: 0.13 },
      { freq: 523.25, start: 0.73, dur: 0.78, vol: 0.13 }
    ];

    voices.forEach(({ freq, start, dur, vol }) => {
      const t0 = now + start;
      const t1 = t0 + dur;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, t0);
      osc2.frequency.setValueAtTime(freq * 1.005, t0);

      filter.type = 'lowpass';
      filter.Q.setValueAtTime(2.8, t0);
      filter.frequency.setValueAtTime(700, t0);
      filter.frequency.exponentialRampToValueAtTime(3100, t0 + 0.05);
      filter.frequency.exponentialRampToValueAtTime(1600, t1);

      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(vol, t0 + 0.025);
      gain.gain.setValueAtTime(vol * 0.88, Math.max(t0 + 0.03, t1 - 0.07));
      gain.gain.exponentialRampToValueAtTime(0.001, t1 + 0.05);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(t0);
      osc2.start(t0);
      osc1.stop(t1 + 0.06);
      osc2.stop(t1 + 0.06);
    });
  };

  if (ctx.state === 'running') {
    trigger();
  } else {
    ctx.resume().then(trigger).catch(() => {});
  }
}
