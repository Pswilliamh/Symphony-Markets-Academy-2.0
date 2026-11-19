import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Music, Pause, Play, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import { AssetSymbol, Candle } from '../types/market';
import { SymphonyHarpLogo } from './SymphonyHarpLogo';

interface CandlestickSymphonyComposerProps {
  symbol: AssetSymbol;
  onSelectSymbol?: (sym: AssetSymbol) => void;
  candles: Candle[];
  livePrice: number;
  btcLivePrice?: number;
  xrpLivePrice?: number;
  xlmLivePrice?: number;
}

export type SymphonyInstrument = 'concert_harp' | 'warm_strings' | 'celesta_chimes';
export type SymphonyTempo = 76 | 98 | 124;

interface PentatonicNoteDef {
  noteName: string;
  symbolGlyph: string;
  friendlyLabel: string;
  freqHz: number;
  roleLabel: string;
}

/**
 * 10-Note Symphonic Abundance Scale.
 * Every interval in this scale is warm and consonant—meaning any sequence of peaks
 * and valleys produces a genuine, pleasing symphonic melody with zero harsh noise.
 */
const SYMPHONY_ABUNDANCE_SCALE: PentatonicNoteDef[] = [
  { noteName: 'G3', symbolGlyph: '♩', friendlyLabel: 'Deep Cello Bass', freqHz: 192.43, roleLabel: 'Deep Valley Foundation' },
  { noteName: 'A3', symbolGlyph: '♩', friendlyLabel: 'Warm Bass Rest', freqHz: 216.0, roleLabel: 'Calm Grounding Breath' },
  { noteName: 'C4', symbolGlyph: '♪', friendlyLabel: 'Low Harp String', freqHz: 256.87, roleLabel: 'Steady Rhythm Anchor' },
  { noteName: 'D4', symbolGlyph: '♪', friendlyLabel: 'Stepping Note', freqHz: 288.33, roleLabel: 'Gentle Upward Step' },
  { noteName: 'E4', symbolGlyph: '♪', friendlyLabel: 'Warm Harmony', freqHz: 323.63, roleLabel: 'Heart of the Melody' },
  { noteName: 'G4', symbolGlyph: '♫', friendlyLabel: 'Golden Harp Center', freqHz: 384.87, roleLabel: 'Flowing Market Song' },
  { noteName: 'A4', symbolGlyph: '♫', friendlyLabel: 'Rising String', freqHz: 432.0, roleLabel: 'Natural Harmonic Lift' },
  { noteName: 'C5', symbolGlyph: '♫', friendlyLabel: 'High Harp Note', freqHz: 513.74, roleLabel: 'Bright Ascending Wave' },
  { noteName: 'D5', symbolGlyph: '♬', friendlyLabel: 'Abundance Chime', freqHz: 528.0, roleLabel: 'Soaring Peak Harmony' },
  { noteName: 'E5', symbolGlyph: '♬', friendlyLabel: 'Symphony Crown', freqHz: 647.27, roleLabel: '8-Hour Crescendo Peak' },
];

export interface EightHourMusicBar {
  index: number;
  timeLabel: string;
  hoursAgoLabel: string;
  open: number;
  high: number;
  low: number;
  close: number;
  bullish: boolean;
  scaleIndex: number;
  note: PentatonicNoteDef;
  isPeak: boolean;
  isValley: boolean;
  bodyIntensity: number;
}

export const CandlestickSymphonyComposer: React.FC<CandlestickSymphonyComposerProps> = ({
  symbol,
  onSelectSymbol,
  candles,
  livePrice,
  btcLivePrice,
  xrpLivePrice,
  xlmLivePrice,
}) => {
  const [barCount, setBarCount] = useState<16 | 24>(16);
  const [instrument, setInstrument] = useState<SymphonyInstrument>('concert_harp');
  const [tempoBpm, setTempoBpm] = useState<SymphonyTempo>(98);
  const [showGhostCandles, setShowGhostCandles] = useState<boolean>(true);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeBarIndex, setActiveBarIndex] = useState<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const stepTimerRef = useRef<number | null>(null);
  const priceDecimals = symbol === 'BTCUSDT' ? 2 : 4;

  // Build the 8-Hour Historical Candlestick & Musical Note Dataset
  const musicBars: EightHourMusicBar[] = useMemo(() => {
    const sourceSlice =
      candles && candles.length >= barCount
        ? candles.slice(-barCount)
        : Array.from({ length: barCount }, (_, idx) => {
            const base =
              livePrice ||
              (symbol === 'BTCUSDT' ? 91450 : symbol === 'XRPUSDT' ? 2.42 : 0.415);
            const wave =
              Math.sin(idx * 0.55) * base * 0.012 +
              Math.cos(idx * 0.28) * base * 0.008;
            const open = Number((base + wave).toFixed(priceDecimals));
            const delta = Math.sin(idx * 0.9 + 0.4) * base * 0.0065;
            const close = Number((open + delta).toFixed(priceDecimals));
            const high = Number((Math.max(open, close) + base * 0.003).toFixed(priceDecimals));
            const low = Number((Math.min(open, close) - base * 0.003).toFixed(priceDecimals));
            return {
              time: Date.now() - (barCount - idx) * (480 / barCount) * 60 * 1000,
              open,
              high,
              low,
              close,
              volume: 100000,
            };
          });

    const minLow = Math.min(...sourceSlice.map((c) => c.low));
    const maxHigh = Math.max(...sourceSlice.map((c) => c.high));
    const range = Math.max(0.00001, maxHigh - minLow);

    let peakIdx = 0;
    let valleyIdx = 0;
    sourceSlice.forEach((c, i) => {
      if (c.close >= sourceSlice[peakIdx].close) peakIdx = i;
      if (c.close <= sourceSlice[valleyIdx].close) valleyIdx = i;
    });

    const minutesPerBar = Math.round(480 / barCount);

    return sourceSlice.map((c, idx) => {
      const normalized = Math.max(0, Math.min(0.999, (c.close - minLow) / range));
      const scaleIndex = Math.floor(normalized * SYMPHONY_ABUNDANCE_SCALE.length);
      const note = SYMPHONY_ABUNDANCE_SCALE[scaleIndex];
      const bullish = c.close >= c.open;
      const bodyRatio = Math.min(1, Math.abs(c.close - c.open) / (range * 0.22));
      const bodyIntensity = 0.5 + bodyRatio * 0.5;

      const minsAgo = (barCount - 1 - idx) * minutesPerBar;
      const hrs = Math.floor(minsAgo / 60);
      const mins = minsAgo % 60;
      const hoursAgoLabel =
        minsAgo === 0
          ? 'Now'
          : hrs > 0 && mins > 0
          ? `-${hrs}h ${mins}m`
          : hrs > 0
          ? `-${hrs}h`
          : `-${mins}m`;

      const dateObj = new Date(Date.now() - minsAgo * 60 * 1000);
      const timeLabel = dateObj.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      return {
        index: idx,
        timeLabel,
        hoursAgoLabel,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        bullish,
        scaleIndex,
        note,
        isPeak: idx === peakIdx,
        isValley: idx === valleyIdx && valleyIdx !== peakIdx,
        bodyIntensity,
      };
    });
  }, [candles, barCount, livePrice, symbol]);

  const ensureAudioContext = (): AudioContext | null => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        void audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  };

  /**
   * Plays a rich, multi-layered Symphonic Harp & Bowed Cello Note/Chord
   */
  const playSymphonicBarNote = (bar: EightHourMusicBar) => {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const baseFreq = bar.note.freqHz;

      // Warm Low-Pass Acoustic Filter + Concert Hall Echo
      const warmthFilter = ctx.createBiquadFilter();
      warmthFilter.type = 'lowpass';
      warmthFilter.frequency.setValueAtTime(bar.bullish ? 1550 : 980, now);
      warmthFilter.Q.setValueAtTime(0.65, now);

      const delayNode = ctx.createDelay();
      delayNode.delayTime.setValueAtTime(0.24, now);
      const delayFeedback = ctx.createGain();
      delayFeedback.gain.setValueAtTime(0.28, now);
      const delayWet = ctx.createGain();
      delayWet.gain.setValueAtTime(0.26, now);

      warmthFilter.connect(ctx.destination);
      warmthFilter.connect(delayNode);
      delayNode.connect(delayFeedback);
      delayFeedback.connect(delayNode);
      delayNode.connect(delayWet);
      delayWet.connect(ctx.destination);

      const noteDuration = instrument === 'warm_strings' ? 1.65 : 1.35;
      const peakGain = 0.13 * bar.bodyIntensity;

      const triggerVoice = (
        freq: number,
        gainLevel: number,
        startOffset: number,
        dur: number,
        oscType: OscillatorType
      ) => {
        const osc = ctx.createOscillator();
        const voiceGain = ctx.createGain();
        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, now + startOffset);

        const attack = instrument === 'warm_strings' ? 0.14 : 0.028;
        voiceGain.gain.setValueAtTime(0.0001, now + startOffset);
        voiceGain.gain.linearRampToValueAtTime(gainLevel, now + startOffset + attack);
        voiceGain.gain.exponentialRampToValueAtTime(0.0005, now + startOffset + dur);

        osc.connect(voiceGain);
        voiceGain.connect(warmthFilter);
        osc.start(now + startOffset);
        osc.stop(now + startOffset + dur + 0.05);
      };

      if (instrument === 'concert_harp') {
        // Warm Concert Harp pluck + soft Cello body foundation
        triggerVoice(baseFreq, peakGain, 0, noteDuration, 'sine');
        triggerVoice(baseFreq, peakGain * 0.36, 0.01, noteDuration * 0.9, 'triangle');
        if (bar.bullish) {
          // Green candle: rising harp arpeggio grace notes (Major 3rd + Perfect 5th)
          triggerVoice(baseFreq * 1.25, peakGain * 0.28, 0.06, noteDuration * 0.85, 'sine');
          triggerVoice(baseFreq * 1.5, peakGain * 0.24, 0.12, noteDuration * 0.8, 'sine');
        } else {
          // Red candle: soothing deep Cello & Bass Harp rest
          triggerVoice(baseFreq * 0.5, peakGain * 0.48, 0, noteDuration * 1.1, 'sine');
          triggerVoice(baseFreq * 0.75, peakGain * 0.22, 0.05, noteDuration * 0.9, 'triangle');
        }
      } else if (instrument === 'warm_strings') {
        // Lush Bowed Cello & Viola Orchestra Ensemble
        triggerVoice(baseFreq, peakGain * 0.85, 0, noteDuration, 'sine');
        triggerVoice(baseFreq * 1.002, peakGain * 0.38, 0.02, noteDuration, 'triangle');
        triggerVoice(bar.bullish ? baseFreq * 1.5 : baseFreq * 0.5, peakGain * 0.35, 0.04, noteDuration, 'sine');
      } else {
        // Warm Orchestra Celesta & Chimes
        triggerVoice(baseFreq, peakGain * 0.9, 0, noteDuration * 0.95, 'sine');
        triggerVoice(baseFreq * 1.5, peakGain * 0.28, 0.05, noteDuration * 0.75, 'sine');
      }

      if (bar.isPeak || bar.isValley) {
        const chordMultipliers = bar.isPeak ? [1.25, 1.5, 2.0] : [0.5, 0.75, 1.25];
        chordMultipliers.forEach((mult, idx) => {
          triggerVoice(
            baseFreq * mult,
            peakGain * 0.24,
            0.07 * (idx + 1),
            noteDuration * 1.2,
            'sine'
          );
        });
      }
    } catch {
      // Ignore audio errors before user gesture
    }
  };

  /**
   * Plays a dedicated demonstration for the 3 Visual Analogy Cards at the top
   */
  const playAnalogyCardSound = (cardType: 'green_note' | 'red_rest' | 'peak_valley_chord') => {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, now);
    filter.connect(ctx.destination);

    const playNote = (freq: number, offset: number, dur: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + offset);
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.linearRampToValueAtTime(vol, now + offset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + offset + dur);
      osc.connect(gain);
      gain.connect(filter);
      osc.start(now + offset);
      osc.stop(now + offset + dur + 0.05);
    };

    if (cardType === 'green_note') {
      // Rising Emerald Harp Notes (C4 -> E4 -> G4 -> C5)
      [256.87, 323.63, 384.87, 513.74].forEach((f, i) => playNote(f, i * 0.14, 1.2, 0.11));
    } else if (cardType === 'red_rest') {
      // Warm Deep Cello & Bass Harp Breath (A3 + E3 warm rest)
      playNote(216.0, 0, 1.8, 0.13);
      playNote(144.0, 0.04, 1.9, 0.11);
      playNote(324.0, 0.12, 1.5, 0.06);
    } else {
      // Full Golden Symphony Arpeggio Chord
      [216.0, 256.87, 323.63, 384.87, 432.0, 528.0].forEach((f, i) =>
        playNote(f, i * 0.12, 1.8, 0.09)
      );
    }
  };

  // Playback Sequencer Effect
  useEffect(() => {
    if (!isPlaying) {
      if (stepTimerRef.current) {
        window.clearTimeout(stepTimerRef.current);
        stepTimerRef.current = null;
      }
      return;
    }

    const stepMs = Math.round((60 / tempoBpm) * 1000 * 0.68);

    stepTimerRef.current = window.setTimeout(() => {
      setActiveBarIndex((prev) => {
        const nextIdx = prev + 1;
        if (nextIdx >= musicBars.length) {
          if (isLooping) {
            playSymphonicBarNote(musicBars[0]);
            return 0;
          }
          setIsPlaying(false);
          return prev;
        }
        playSymphonicBarNote(musicBars[nextIdx]);
        return nextIdx;
      });
    }, stepMs);

    return () => {
      if (stepTimerRef.current) {
        window.clearTimeout(stepTimerRef.current);
      }
    };
  }, [isPlaying, activeBarIndex, tempoBpm, musicBars, isLooping, instrument]);

  useEffect(() => {
    return () => {
      if (stepTimerRef.current) {
        window.clearTimeout(stepTimerRef.current);
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        void audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    const startIdx = activeBarIndex >= musicBars.length - 1 ? 0 : activeBarIndex;
    setActiveBarIndex(startIdx);
    if (musicBars[startIdx]) {
      playSymphonicBarNote(musicBars[startIdx]);
    }
    setIsPlaying(true);
  };

  const handleSelectBar = (bar: EightHourMusicBar) => {
    setActiveBarIndex(bar.index);
    playSymphonicBarNote(bar);
  };

  const activeBar = musicBars[activeBarIndex] ?? musicBars[musicBars.length - 1];
  const peakBar = musicBars.find((b) => b.isPeak) ?? musicBars[0];
  const valleyBar = musicBars.find((b) => b.isValley) ?? musicBars[0];

  // SVG Coordinate Geometry
  const svgWidth = 960;
  const svgHeight = 350;
  const padLeft = 112;
  const padRight = 76;
  const padTop = 38;
  const padBottom = 46;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const minPrice = useMemo(() => Math.min(...musicBars.map((b) => b.low)), [musicBars]);
  const maxPrice = useMemo(() => Math.max(...musicBars.map((b) => b.high)), [musicBars]);
  const priceSpan = Math.max(0.00001, maxPrice - minPrice);

  const priceToY = (p: number) =>
    padTop + plotHeight - ((p - minPrice) / priceSpan) * plotHeight;

  const scaleIdxToY = (sIdx: number) =>
    padTop +
    plotHeight -
    (sIdx / Math.max(1, SYMPHONY_ABUNDANCE_SCALE.length - 1)) * plotHeight;

  const barIndexToX = (idx: number) =>
    padLeft + (idx / Math.max(1, musicBars.length - 1)) * plotWidth;

  const melodyPathD = useMemo(() => {
    if (musicBars.length === 0) return '';
    const pts = musicBars.map((b, i) => ({
      x: barIndexToX(i),
      y: priceToY(b.close),
    }));
    return pts.reduce((acc, pt, i, arr) => {
      if (i === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      const prev = arr[i - 1];
      const cx1 = prev.x + (pt.x - prev.x) * 0.45;
      const cy1 = prev.y;
      const cx2 = prev.x + (pt.x - prev.x) * 0.55;
      const cy2 = pt.y;
      return `${acc} C ${cx1.toFixed(1)} ${cy1.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}, ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    }, '');
  }, [musicBars, minPrice, priceSpan]);

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden space-y-0">
      {/* Top Studio Header */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border-b border-slate-800 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <SymphonyHarpLogo variant="emblem" className="w-11 h-11 sm:w-12 sm:h-12" />
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-amber-300">
                <span>♪ Visual & Musical Analogy</span>
                <span aria-hidden="true">·</span>
                <span>Past 8 Hours of Candlesticks as a Symphony</span>
              </div>
              <h2 className="font-editorial text-xl sm:text-2xl font-bold text-white">
                Seeing & Hearing Candlesticks as Musical Notes
              </h2>
            </div>
          </div>

          {/* Asset & Window Resolution Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {onSelectSymbol && (
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    onSelectSymbol('BTCUSDT');
                  }}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    symbol === 'BTCUSDT'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  BTC Song{' '}
                  {btcLivePrice
                    ? `($${btcLivePrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })})`
                    : ''}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    onSelectSymbol('XRPUSDT');
                  }}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    symbol === 'XRPUSDT'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  XRP Song {xrpLivePrice ? `($${xrpLivePrice.toFixed(4)})` : ''}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    onSelectSymbol('XLMUSDT');
                  }}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    symbol === 'XLMUSDT'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  XLM Song {xlmLivePrice ? `($${xlmLivePrice.toFixed(4)})` : ''}
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setBarCount(16);
                  setActiveBarIndex(0);
                }}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  barCount === 16
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                16 Notes (8 Hours)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setBarCount(24);
                  setActiveBarIndex(0);
                }}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  barCount === 24
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                24 Notes (8 Hours)
              </button>
            </div>
          </div>
        </div>

        {/* 3 Visual Picture Cards Showing How Candlesticks Equal Musical Notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Visual Card 1: Green Candle = Rising Musical Note */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Custom Visual Graphic: Green Candle Morphing into Rising Note */}
              <svg viewBox="0 0 88 68" className="w-20 h-16 shrink-0 rounded-lg bg-slate-950 border border-emerald-500/30 p-1">
                <line x1="22" y1="10" x2="22" y2="58" stroke="#10B981" strokeWidth="2.2" />
                <rect x="15" y="20" width="14" height="26" rx="2.5" fill="#059669" stroke="#6EE7B7" strokeWidth="1" />
                <path d="M 35 34 L 47 34" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="2 2" />
                <circle cx="64" cy="28" r="14" fill="#064E3B" stroke="#FDE68A" strokeWidth="1.5" />
                <text x="64" y="34" textAnchor="middle" fill="#FEF08A" fontSize="18" fontWeight="bold">♪</text>
              </svg>
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-400">
                  1. Green Candle = Rising Note (♪)
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Just like a musician plucking a higher harp string, a green candle steps upward in the melody.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => playAnalogyCardSound('green_note')}
              className="w-full py-1.5 px-3 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              ♪ Tap to Hear Rising Harp Note
            </button>
          </div>

          {/* Visual Card 2: Red Candle = Calm Musical Rest / Breath */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-rose-500/30 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Custom Visual Graphic: Red Candle Morphing into Warm Bass Rest */}
              <svg viewBox="0 0 88 68" className="w-20 h-16 shrink-0 rounded-lg bg-slate-950 border border-rose-500/30 p-1">
                <line x1="22" y1="12" x2="22" y2="58" stroke="#F43F5E" strokeWidth="2.2" />
                <rect x="15" y="22" width="14" height="24" rx="2.5" fill="#E11D48" stroke="#FDA4AF" strokeWidth="1" />
                <path d="M 35 34 L 47 34" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="2 2" />
                <circle cx="64" cy="38" r="14" fill="#4C0519" stroke="#FDA4AF" strokeWidth="1.5" />
                <text x="64" y="44" textAnchor="middle" fill="#FFE4E6" fontSize="18" fontWeight="bold">♩</text>
              </svg>
              <div className="space-y-1">
                <div className="text-xs font-bold text-rose-300">
                  2. Red Candle = Calm Breath (♩)
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Every great song has deep cello rests between high notes. Red candles are natural breaths, not fear.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => playAnalogyCardSound('red_rest')}
              className="w-full py-1.5 px-3 rounded-lg bg-rose-600/25 hover:bg-rose-600/40 border border-rose-500/40 text-rose-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              ♩ Tap to Hear Calm Cello Breath
            </button>
          </div>

          {/* Visual Card 3: Peaks & Valleys = Full Symphonic Chord */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Custom Visual Graphic: Peaks & Valleys Flowing as Golden Notes */}
              <svg viewBox="0 0 88 68" className="w-20 h-16 shrink-0 rounded-lg bg-slate-950 border border-amber-500/30 p-1">
                <path d="M 8 50 Q 28 12, 46 36 T 80 16" fill="none" stroke="#FBBF24" strokeWidth="2.2" />
                <text x="24" y="22" fill="#FEF08A" fontSize="13" fontWeight="bold">♪</text>
                <text x="48" y="48" fill="#38BDF8" fontSize="13" fontWeight="bold">♩</text>
                <text x="70" y="22" fill="#FEF08A" fontSize="15" fontWeight="bold">♬</text>
              </svg>
              <div className="space-y-1">
                <div className="text-xs font-bold text-amber-300">
                  3. Peaks & Valleys = Symphony (♬)
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  When you connect 8 hours of peaks and valleys together, the market plays a flowing golden song.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => playAnalogyCardSound('peak_valley_chord')}
              className="w-full py-1.5 px-3 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/40 text-amber-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              ♬ Tap to Hear Full Symphony Chord
            </button>
          </div>
        </div>

        {/* Transport & Instrument Control Deck */}
        <div className="pt-3 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                isPlaying
                  ? 'bg-rose-500 hover:bg-rose-400 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 shrink-0" />
                  <span>Pause 8-Hour Market Song</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 shrink-0" />
                  <span>♫ Play 8-Hour Market Symphony</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setActiveBarIndex(0);
                if (musicBars[0]) {
                  playSymphonicBarNote(musicBars[0]);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Restart</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLooping((v) => !v)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isLooping
                  ? 'bg-emerald-600/25 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isLooping ? 'Loop Song: ON' : 'Loop Song'}
            </button>
          </div>

          {/* Instrument & Tempo Selectors */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
              {(
                [
                  { id: 'concert_harp', label: '♪ Golden Harp' },
                  { id: 'warm_strings', label: '♫ Cello & Strings' },
                  { id: 'celesta_chimes', label: '♬ Soft Chimes' },
                ] as const
              ).map((inst) => (
                <button
                  key={inst.id}
                  type="button"
                  onClick={() => setInstrument(inst.id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    instrument === inst.id
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {inst.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
              {(
                [
                  { bpm: 76 as SymphonyTempo, label: 'Calm' },
                  { bpm: 98 as SymphonyTempo, label: 'Flowing' },
                  { bpm: 124 as SymphonyTempo, label: 'Upbeat' },
                ]
              ).map((t) => (
                <button
                  key={t.bpm}
                  type="button"
                  onClick={() => setTempoBpm(t.bpm)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    tempoBpm === t.bpm
                      ? 'bg-slate-700 text-amber-300 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowGhostCandles((v) => !v)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium cursor-pointer"
            >
              {showGhostCandles ? 'Show: Candles + Notes' : 'Show: Notes Only'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive SVG Musical Score + Candlestick Graph */}
      <div className="p-4 sm:p-6 bg-slate-950 text-white space-y-4">
        {/* Live Active Note Banner */}
        {activeBar && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 font-bold text-amber-300">
                <Music className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Note {activeBar.index + 1} of {musicBars.length} ({activeBar.hoursAgoLabel})
                </span>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-bold text-white">
                {activeBar.note.symbolGlyph} {activeBar.note.friendlyLabel} ({activeBar.note.noteName})
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-300">{activeBar.note.roleLabel}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`font-semibold ${
                  activeBar.bullish ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {activeBar.bullish
                  ? '♪ Green Candle (Rising Harp Note)'
                  : '♩ Red Candle (Calm Cello Breath)'}
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono text-sky-300">
                ${activeBar.close.toFixed(priceDecimals)}
              </span>
              <button
                type="button"
                onClick={() => playSymphonicBarNote(activeBar)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 font-semibold cursor-pointer"
              >
                <Volume2 className="w-3 h-3" />
                <span>Play Note</span>
              </button>
            </div>
          </div>
        )}

        {/* Interactive SVG Score Canvas */}
        <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/90 p-2">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full min-w-[680px] h-auto select-none"
            role="img"
            aria-label={`8-Hour Market Symphony Music Graph for ${symbol}`}
          >
            <defs>
              <linearGradient id="symphonyMelodyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.24" />
                <stop offset="50%" stopColor="#0EA5E9" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Decorative Golden Treble Clef / Musical Symbol on the Left Staff */}
            <text
              x={22}
              y={padTop + plotHeight * 0.56}
              fontSize="44"
              fill="#F59E0B"
              fillOpacity="0.25"
              fontFamily="serif"
            >
              𝄞
            </text>

            {/* Horizontal Musical Staff Lines (Left = Friendly Musical Name, Right = Price $) */}
            {SYMPHONY_ABUNDANCE_SCALE.map((scaleItem, sIdx) => {
              const y = scaleIdxToY(sIdx);
              const priceAtStaff =
                minPrice +
                (sIdx / Math.max(1, SYMPHONY_ABUNDANCE_SCALE.length - 1)) * priceSpan;
              const isHighlightPitch =
                scaleItem.noteName === 'G4' || scaleItem.noteName === 'D5';

              return (
                <g key={scaleItem.noteName}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke={isHighlightPitch ? '#F59E0B' : '#334155'}
                    strokeOpacity={isHighlightPitch ? 0.38 : 0.45}
                    strokeDasharray={isHighlightPitch ? undefined : '3 5'}
                    strokeWidth={isHighlightPitch ? 1.1 : 0.8}
                  />
                  {/* Left Axis: Friendly Musical Note Label */}
                  <text
                    x={padLeft - 10}
                    y={y + 3.5}
                    textAnchor="end"
                    className="text-[10px] font-medium"
                    fill={isHighlightPitch ? '#FDE68A' : '#94A3B8'}
                  >
                    {scaleItem.symbolGlyph} {scaleItem.friendlyLabel}
                  </text>
                  {/* Right Axis: Historical Price */}
                  <text
                    x={svgWidth - padRight + 8}
                    y={y + 3.5}
                    textAnchor="start"
                    className="text-[10px] font-mono"
                    fill="#64748B"
                  >
                    ${priceAtStaff.toFixed(priceDecimals)}
                  </text>
                </g>
              );
            })}

            {/* Area Fill Under the 8-Hour Melodic Contour */}
            {melodyPathD && (
              <path
                d={`${melodyPathD} L ${barIndexToX(musicBars.length - 1).toFixed(1)} ${(
                  svgHeight - padBottom
                ).toFixed(1)} L ${barIndexToX(0).toFixed(1)} ${(
                  svgHeight - padBottom
                ).toFixed(1)} Z`}
                fill="url(#symphonyMelodyFill)"
              />
            )}

            {/* Golden Melodic Contour Curve Connecting the 8 Hours of Notes */}
            {melodyPathD && (
              <path
                d={melodyPathD}
                fill="none"
                stroke="#FBBF24"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            )}

            {/* Active Conductor Playhead Vertical Line */}
            {activeBar && (
              <line
                x1={barIndexToX(activeBar.index)}
                y1={padTop - 12}
                x2={barIndexToX(activeBar.index)}
                y2={svgHeight - padBottom + 8}
                stroke="#F59E0B"
                strokeWidth="1.8"
                strokeDasharray="4 3"
              />
            )}

            {/* Faded Candlesticks + Glowing Musical Note Medallions Placed Directly on Each Candle */}
            {musicBars.map((bar, idx) => {
              const x = barIndexToX(idx);
              const highY = priceToY(bar.high);
              const lowY = priceToY(bar.low);
              const openY = priceToY(bar.open);
              const closeY = priceToY(bar.close);
              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.max(6, Math.abs(closeY - openY));
              const isSelected = idx === activeBarIndex;

              const candleStroke = bar.bullish ? '#10B981' : '#F43F5E';
              const candleFill = bar.bullish ? '#059669' : '#E11D48';

              return (
                <g
                  key={bar.index}
                  onClick={() => handleSelectBar(bar)}
                  className="cursor-pointer"
                >
                  {/* Wide Click Target */}
                  <rect
                    x={x - 16}
                    y={padTop}
                    width={32}
                    height={plotHeight}
                    fill="transparent"
                  />

                  {/* Faded Historical Candlestick Behind the Musical Note */}
                  {showGhostCandles && (
                    <g opacity={isSelected ? 0.72 : 0.34}>
                      <line
                        x1={x}
                        y1={highY}
                        x2={x}
                        y2={lowY}
                        stroke={candleStroke}
                        strokeWidth={isSelected ? 2.2 : 1.5}
                        strokeLinecap="round"
                      />
                      <rect
                        x={x - 7}
                        y={bodyTop}
                        width={14}
                        height={bodyHeight}
                        rx={2.5}
                        fill={candleFill}
                        stroke={candleStroke}
                        strokeWidth={0.9}
                      />
                    </g>
                  )}

                  {/* Active Glowing Ring when Playing/Selected */}
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={closeY}
                      r={16}
                      fill={bar.bullish ? '#10B981' : '#F59E0B'}
                      fillOpacity={0.28}
                      stroke="#FEF08A"
                      strokeWidth={1.8}
                    />
                  )}

                  {/* Glowing Musical Note Medallion Placed Directly on the Candle's Close */}
                  <circle
                    cx={x}
                    cy={closeY}
                    r={isSelected ? 12 : 10}
                    fill={
                      isSelected
                        ? '#FEF08A'
                        : bar.bullish
                        ? '#064E3B'
                        : '#4C0519'
                    }
                    stroke={
                      isSelected
                        ? '#F59E0B'
                        : bar.bullish
                        ? '#34D399'
                        : '#FDA4AF'
                    }
                    strokeWidth={1.5}
                  />

                  {/* Large Musical Note Symbol (♪ / ♫ / ♩ / ♬) Inside the Candle Medallion */}
                  <text
                    x={x}
                    y={closeY + 4.5}
                    textAnchor="middle"
                    fontSize={isSelected ? '14' : '12'}
                    fontWeight="bold"
                    fill={
                      isSelected
                        ? '#0F172A'
                        : bar.bullish
                        ? '#FEF08A'
                        : '#FFE4E6'
                    }
                  >
                    {bar.bullish ? (bar.isPeak ? '♬' : '♪') : '♩'}
                  </text>

                  {/* Peak & Valley Visual Callouts */}
                  {bar.isPeak && (
                    <text
                      x={x}
                      y={Math.max(15, highY - 18)}
                      textAnchor="middle"
                      className="text-[10px] font-bold"
                      fill="#FBBF24"
                    >
                      ♬ Peak Harmony
                    </text>
                  )}
                  {bar.isValley && (
                    <text
                      x={x}
                      y={Math.min(svgHeight - padBottom - 4, lowY + 22)}
                      textAnchor="middle"
                      className="text-[10px] font-bold"
                      fill="#38BDF8"
                    >
                      ♩ Valley Rest
                    </text>
                  )}

                  {/* Bottom X-Axis 8-Hour Historical Time Labels */}
                  {(idx % 2 === 0 || idx === musicBars.length - 1) && (
                    <text
                      x={x}
                      y={svgHeight - 14}
                      textAnchor="middle"
                      className="text-[10px] font-mono"
                      fill={isSelected ? '#FDE68A' : '#94A3B8'}
                    >
                      {bar.hoursAgoLabel}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Bottom 3-Card Simple Visual Takeaway */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-emerald-400 font-semibold">
              <span>♪ Green Candlesticks = Rising Harp Notes</span>
              <span className="font-mono">
                {musicBars.filter((b) => b.bullish).length} Green
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Tap any green circle with a <strong>♪</strong> note on the chart above to hear how upward price movement sounds like an ascending harp string.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-rose-400 font-semibold">
              <span>♩ Red Candlesticks = Calm Cello Rests</span>
              <span className="font-mono">
                {musicBars.filter((b) => !b.bullish).length} Red
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Tap any red circle with a <strong>♩</strong> note to hear a warm, grounding cello rest—reminding you that market pullbacks are peaceful pauses.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-amber-300 font-semibold">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>♬ Peaks & Valleys = Full Chords</span>
              </span>
              <span className="font-mono">8-Hour Song</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              When the golden line reaches the <strong>♬ Peak Harmony</strong> or <strong>♩ Valley Rest</strong>, the harp and strings play a full multi-note symphony chord.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
