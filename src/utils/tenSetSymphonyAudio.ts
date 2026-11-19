/**
 * 10-Set Symphony Note Progression Engine (432 Hz / 528 Hz Abundance Tuning)
 * Translates live 10-Set Buy & Sell trade outcomes into a calm, musical progression:
 * - Winning Buy -> Profit Sell sets play ascending Golden Concert Harp notes/chords
 *   climbing up the scale as cumulative wallet coins grow.
 * - Controlled -1.0R Safety Stop sets (#03 & #07) play a warm, grounding Bowed Cello
 *   rest—teaching calm emotional stewardship instead of panic.
 */

export interface SetMusicalNoteMeta {
  glyph: string;
  noteName: string;
  freqHz: number;
  shortLabel: string;
  description: string;
}

const WINNING_HARP_LADDER: Array<{ noteName: string; freqHz: number; glyph: string }> = [
  { noteName: 'C4', freqHz: 256.87, glyph: '♪' },
  { noteName: 'D4', freqHz: 288.33, glyph: '♪' },
  { noteName: 'E4', freqHz: 323.63, glyph: '♪' },
  { noteName: 'G4', freqHz: 384.87, glyph: '♫' },
  { noteName: 'A4', freqHz: 432.0, glyph: '♫' },
  { noteName: 'C5', freqHz: 513.74, glyph: '♫' },
  { noteName: 'D5', freqHz: 528.0, glyph: '♬' },
  { noteName: 'E5', freqHz: 647.27, glyph: '♬' },
];

const STOP_CELLO_RESTS: Array<{ noteName: string; freqHz: number; glyph: string }> = [
  { noteName: 'G3', freqHz: 192.43, glyph: '♩' },
  { noteName: 'A3', freqHz: 216.0, glyph: '♩' },
];

let sharedAudioCtx: AudioContext | null = null;

function getOrCreateAudioContext(): AudioContext | null {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export function getSetMusicalNoteMeta(
  setNumber: number,
  outcome: 'WIN_TARGET_HIT' | 'CONTROLLED_1R_STOP',
  winOrdinalIndex: number
): SetMusicalNoteMeta {
  if (outcome === 'CONTROLLED_1R_STOP') {
    const cello = STOP_CELLO_RESTS[setNumber % STOP_CELLO_RESTS.length];
    return {
      glyph: cello.glyph,
      noteName: cello.noteName,
      freqHz: cello.freqHz,
      shortLabel: `${cello.glyph} ${cello.noteName} Cello Rest`,
      description: 'Warm Cello Rest (-1R Calm Safety Pause)',
    };
  }

  const clampedIdx = Math.max(0, Math.min(WINNING_HARP_LADDER.length - 1, winOrdinalIndex));
  const harp = WINNING_HARP_LADDER[clampedIdx];
  const isFinale = setNumber === 10;
  return {
    glyph: harp.glyph,
    noteName: harp.noteName,
    freqHz: harp.freqHz,
    shortLabel: isFinale
      ? `${harp.glyph} ${harp.noteName} Finale Chord`
      : `${harp.glyph} ${harp.noteName} Harp`,
    description: isFinale
      ? 'Symphony Finale Triad (+3.0R Abundance Peak)'
      : `Ascending Golden Harp (${Math.round(harp.freqHz)} Hz)`,
  };
}

export function playTradeSetSymphonyNote(params: {
  setNumber: number;
  outcome: 'WIN_TARGET_HIT' | 'CONTROLLED_1R_STOP';
  winOrdinalIndex: number;
  rMultiple: number;
}): void {
  const ctx = getOrCreateAudioContext();
  if (!ctx) return;

  try {
    const meta = getSetMusicalNoteMeta(
      params.setNumber,
      params.outcome,
      params.winOrdinalIndex
    );
    const now = ctx.currentTime;
    const isWin = params.outcome === 'WIN_TARGET_HIT';

    // Warm acoustic low-pass filter + gentle hall echo
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isWin ? 1680 : 720, now);
    filter.Q.setValueAtTime(0.7, now);

    const delay = ctx.createDelay();
    delay.delayTime.setValueAtTime(0.22, now);
    const feedback = ctx.createGain();
    feedback.gain.setValueAtTime(0.24, now);
    const wet = ctx.createGain();
    wet.gain.setValueAtTime(0.22, now);

    filter.connect(ctx.destination);
    filter.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(ctx.destination);

    const playVoice = (
      freq: number,
      peakGain: number,
      offsetSec: number,
      durationSec: number,
      type: OscillatorType
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + offsetSec);

      const start = now + offsetSec;
      const attack = isWin ? 0.025 : 0.09;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(peakGain, start + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

      osc.connect(filter === null ? ctx.destination : gain);
      gain.connect(filter);

      osc.start(start);
      osc.stop(start + durationSec + 0.03);
    };

    if (isWin) {
      // Buy note (lower fourth/fifth pickup) -> Sell profit target note (warm ascending Harp!)
      const buyPickupFreq = meta.freqHz * 0.75;
      playVoice(buyPickupFreq, 0.075, 0, 0.45, 'triangle');
      playVoice(meta.freqHz, 0.115, 0.14, 1.15, 'triangle');
      playVoice(meta.freqHz * 1.5, 0.05, 0.22, 0.95, 'sine');

      // Set #10 (+3.0R) adds a gentle 528 Hz / Octave Golden Harp Finale shimmer
      if (params.setNumber === 10 || params.rMultiple >= 2.5) {
        playVoice(meta.freqHz * 2, 0.045, 0.3, 1.25, 'sine');
      }
    } else {
      // Controlled -1.0R Safety Stop: Warm, calm Bowed Cello grounding interval
      playVoice(meta.freqHz, 0.11, 0, 1.35, 'sine');
      playVoice(meta.freqHz * 0.5, 0.065, 0.02, 1.35, 'triangle');
    }
  } catch {
    // Audio playback is non-blocking if browser autoplay policy prevents sound
  }
}

/**
 * Plays a two-note harmonic ratio interval (e.g. 144 Hz + 233 Hz Phi dyad,
 * 3:2 Perfect Fifth, 8:5 Golden Pocket Minor Sixth, or 1.618 Golden Target)
 * so students can literally HEAR how Fibonacci math translates into music.
 */
export function playFibonacciHarmonicInterval(params: {
  rootHz: number;
  targetHz: number;
  tone?: 'harp' | 'cello' | 'warm_chord';
}): void {
  const ctx = getOrCreateAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const isCello = params.tone === 'cello';

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isCello ? 760 : 1850, now);
    filter.Q.setValueAtTime(0.75, now);

    const delay = ctx.createDelay();
    delay.delayTime.setValueAtTime(0.2, now);
    const feedback = ctx.createGain();
    feedback.gain.setValueAtTime(0.22, now);
    const wet = ctx.createGain();
    wet.gain.setValueAtTime(0.2, now);

    filter.connect(ctx.destination);
    filter.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(ctx.destination);

    const triggerNote = (
      freq: number,
      peak: number,
      startOffset: number,
      dur: number,
      oscType: OscillatorType
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = oscType;
      osc.frequency.setValueAtTime(Math.max(65, Math.min(2400, freq)), now + startOffset);
      const t0 = now + startOffset;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(peak, t0 + (isCello ? 0.08 : 0.03));
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(filter);
      osc.start(t0);
      osc.stop(t0 + dur + 0.04);
    };

    // Play root anchor followed rapidly by harmonic ratio note, ringing together as a dyad
    triggerNote(params.rootHz, 0.095, 0, 1.35, isCello ? 'sine' : 'triangle');
    triggerNote(params.targetHz, 0.11, 0.18, 1.45, 'triangle');
    if (params.tone === 'warm_chord') {
      triggerNote(params.rootHz * 2, 0.045, 0.32, 1.35, 'sine');
    }
  } catch {
    // Non-blocking audio fallback
  }
}

/**
 * Plays the 3-Point Fibonacci Wave Symphony:
 * Point A (Origin C4) -> Point B (Impulse Peak G4) -> Point C (61.8% Golden Pocket Rest E4)
 * -> 100% Wave (C5) -> 127.2% Bridge (E5) -> 161.8% Golden Target Finale (A5 Chord)
 */
export function playThreeWaveFibonacciSymphony(): void {
  const ctx = getOrCreateAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1900, now);
    filter.connect(ctx.destination);

    const sequence: Array<{ freq: number; offset: number; dur: number; peak: number; type: OscillatorType }> = [
      { freq: 256.87, offset: 0.0, dur: 0.55, peak: 0.09, type: 'triangle' }, // Point A: Origin Low (C4)
      { freq: 384.87, offset: 0.42, dur: 0.6, peak: 0.105, type: 'triangle' }, // Point B: Wave 1 Peak (G4, 3:2)
      { freq: 311.13, offset: 0.9, dur: 0.7, peak: 0.09, type: 'sine' }, // Point C: 61.8% Golden Pocket Pullback (Eb4/E4)
      { freq: 513.74, offset: 1.5, dur: 0.6, peak: 0.1, type: 'triangle' }, // 100% Extension (C5 Octave, 2:1)
      { freq: 647.27, offset: 1.98, dur: 0.65, peak: 0.105, type: 'triangle' }, // 127.2% Extension (E5, sqrt(Phi))
      { freq: 432.0 * 1.618, offset: 2.48, dur: 1.45, peak: 0.12, type: 'triangle' }, // 161.8% Golden Target Finale
      { freq: 432.0, offset: 2.5, dur: 1.45, peak: 0.065, type: 'sine' }, // Harmonic root under Finale
    ];

    for (const step of sequence) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = step.type;
      osc.frequency.setValueAtTime(step.freq, now + step.offset);
      const t0 = now + step.offset;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(step.peak, t0 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + step.dur);
      osc.connect(gain);
      gain.connect(filter);
      osc.start(t0);
      osc.stop(t0 + step.dur + 0.04);
    }
  } catch {
    // Non-blocking audio fallback
  }
}

