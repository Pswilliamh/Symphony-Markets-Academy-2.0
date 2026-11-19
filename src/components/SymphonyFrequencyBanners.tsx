import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Music, Volume2, VolumeX } from 'lucide-react';
import { SymphonyCandlestickBackdrop, SymphonyHarpLogo } from './SymphonyHarpLogo';

export interface FrequencyBannerItem {
  id: string;
  number: string;
  title: string;
  visualType: 'notes_rhythm' | 'brass_key' | 'dime_peace' | 'golden_harp';
  scamFrequencyLabel: string;
  scamBullets: string[];
  symphonyFrequencyLabel: string;
  symphonyBullets: string[];
  takeaway: string;
}

export const FREQUENCY_PERSPECTIVE_BANNERS: FrequencyBannerItem[] = [
  {
    id: 'freq_banner_1',
    number: '01',
    title: 'Candlesticks as Musical Notes vs. Scam Panic Noise',
    visualType: 'notes_rhythm',
    scamFrequencyLabel: 'The Scam System · Fear, FOMO & Emotional Noise',
    scamBullets: [
      'Treats every green candle as “buy now before you miss out” and every red candle as terrifying failure.',
      'Uses flashing countdown timers and fake “guaranteed daily returns” to keep your mind anxious and off-balance.',
      'Turns the market into a noisy casino where you react to fear instead of hearing the melody.',
    ],
    symphonyFrequencyLabel: 'The Symphony Way · Hearing the Market’s Melody',
    symphonyBullets: [
      'Money is energy and frequency: when you learn properly, candlesticks flow like notes on a musical sheet.',
      'Green candlesticks are rising musical notes (♪ expansion), while red candlesticks are calm musical rests (♩ gentle breaths before the next wave).',
      'You wait peacefully for the song to come to you instead of chasing hype at the top.',
    ],
    takeaway: 'Red candles are not enemies—they are the calm musical rests that prepare the next rising melody.',
  },
  {
    id: 'freq_banner_2',
    number: '02',
    title: 'Holding Your Own Brass Key vs. Locked Casino Exits',
    visualType: 'brass_key',
    scamFrequencyLabel: 'The Scam System · Fake “Stop” Buttons & Key Traps',
    scamBullets: [
      'Tricks beginners into depositing money into a rigged dashboard with a fake “Stop Trading” button.',
      'Asks for your 12-word recovery phrase under the excuse of “connecting an AI trading bot.”',
      'Drains small learners with $25–$50 network gas fees that eat a $5 budget in one click.',
    ],
    symphonyFrequencyLabel: 'The Symphony Way · Sovereign Self-Custody Flow',
    symphonyBullets: [
      'True abundance never asks for your private keys or takes custody of your money.',
      'Your $5 stays safely inside your own wallet while Symphony Markets Academy views only your public window address.',
      'Uses sub-penny XRPL and Stellar rails (~$0.0001 fee) so your value flows like music without friction.',
    ],
    takeaway: 'When you hold your own key, no scam platform can ever lock the exit door on your future.',
  },
  {
    id: 'freq_banner_3',
    number: '03',
    title: 'The 10-Cent Rhythm of Peace ($0.10) vs. Sleepless Gambling',
    visualType: 'dime_peace',
    scamFrequencyLabel: 'The Scam System · 50x Leverage & Liquidation Fear',
    scamBullets: [
      'Pushes beginners into 50x–100x leveraged bets where a tiny dip wipes out 100% of their account.',
      'Creates constant stress where one mistake erases months of hard work and steals your sleep.',
      'Hides real risk behind flashy screenshots.',
    ],
    symphonyFrequencyLabel: 'The Symphony Way · 1x Spot & The 10-Cent Safety Net',
    symphonyBullets: [
      '1x Spot ownership means you own the asset outright with zero liquidation price—giving you peace and time.',
      'On a $5 learning wallet, the 2% rule caps your risk at a single dime ($0.10) to aim for two dimes ($0.20).',
      'When your maximum risk is just 10 cents, fear disappears and you learn in a frequency of gratitude.',
    ],
    takeaway: 'Peace of mind is the true frequency of abundance—and a 10-cent risk cap protects your peace.',
  },
  {
    id: 'freq_banner_4',
    number: '04',
    title: 'Shared Open-Source Wisdom vs. Secret VIP Signal Cults',
    visualType: 'golden_harp',
    scamFrequencyLabel: 'The Scam System · Paid Gatekeeping & Hype Tokens',
    scamBullets: [
      'Charges $299/month for “secret VIP Telegram signals” that dump worthless coins on beginners.',
      'Uses confusing jargon so everyday people feel too intimidated to ask questions.',
      'Sells hollow hype with zero real-world value.',
    ],
    symphonyFrequencyLabel: 'The Symphony Way · Free Visual Learning & Real Value',
    symphonyBullets: [
      '100% free and open-source under the No-Scam Zone Covenant—nothing for sale and no upsells.',
      'Visual step-by-step tools, Plain-English AI Mentor, and our 8-Hour Candlestick Music Graph make learning intuitive.',
      'Includes the KSBC Gold Real-World Asset (RWA) Classroom so you understand tangible stewardship.',
    ],
    takeaway: 'Scams hide behind complex jargon to charge fees; Symphony Markets Academy turns wisdom into a clear visual song.',
  },
];

/**
 * Visual Analogy Illustration 1:
 * Shows Green & Red Candlesticks literally transforming into floating Golden & Emerald
 * Musical Notes (♪ ♫ ♬) along a flowing golden musical staff.
 */
const CandlestickToMusicVisualBanner: React.FC = () => (
  <div className="rounded-xl bg-slate-950 border border-amber-400/30 p-3 sm:p-4 overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800 text-[11px]">
      <span className="font-semibold text-amber-300">
        Visual Analogy · How Candlesticks Become a Symphony of Notes
      </span>
      <span className="text-slate-400">
        Green Candle = Rising Note (♪) · Red Candle = Calm Breath / Rest (♩)
      </span>
    </div>

    <svg
      viewBox="0 0 680 150"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Visual illustration showing red and green market candlesticks transforming into golden musical notes on a flowing musical staff"
    >
      <defs>
        <linearGradient id="staffGlowGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      {/* 5 Flowing Golden Musical Staff Lines */}
      {[34, 54, 74, 94, 114].map((y, idx) => (
        <path
          key={y}
          d={`M 16 ${y} Q 180 ${y - 10 + idx * 2}, 340 ${y} T 664 ${y - 6}`}
          fill="none"
          stroke="#F59E0B"
          strokeOpacity={0.22}
          strokeWidth="1"
        />
      ))}

      {/* Smooth Golden Melodic Ribbon Connecting Candlesticks into Musical Notes */}
      <path
        d="M 45 98 C 105 60, 145 45, 200 78 C 255 105, 300 40, 365 38 C 430 36, 480 86, 545 52 C 590 32, 625 26, 650 28"
        fill="none"
        stroke="url(#staffGlowGrad)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M 45 98 C 105 60, 145 45, 200 78 C 255 105, 300 40, 365 38 C 430 36, 480 86, 545 52 C 590 32, 625 26, 650 28"
        fill="none"
        stroke="#FDE68A"
        strokeWidth="2"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />

      {/* Step 1: Green Bullish Candle with Musical Eighth Note */}
      <g transform="translate(65, 0)">
        <line x1="0" y1="46" x2="0" y2="112" stroke="#10B981" strokeWidth="2.2" />
        <rect x="-9" y="60" width="18" height="36" rx="3" fill="#059669" fillOpacity="0.55" stroke="#34D399" strokeWidth="1.2" />
        <circle cx="0" cy="60" r="11" fill="#064E3B" stroke="#6EE7B7" strokeWidth="1.5" />
        <text x="0" y="65" textAnchor="middle" fill="#FEF08A" fontSize="15" fontWeight="bold">
          ♪
        </text>
        <text x="0" y="134" textAnchor="middle" fill="#6EE7B7" fontSize="10" fontWeight="bold">
          Rising Note
        </text>
      </g>

      {/* Step 2: Higher Green Peak Candle with Beamed Notes */}
      <g transform="translate(150, 0)">
        <line x1="0" y1="26" x2="0" y2="92" stroke="#10B981" strokeWidth="2.2" />
        <rect x="-9" y="38" width="18" height="38" rx="3" fill="#059669" fillOpacity="0.55" stroke="#34D399" strokeWidth="1.2" />
        <circle cx="0" cy="38" r="12" fill="#064E3B" stroke="#FDE68A" strokeWidth="1.5" />
        <text x="0" y="43" textAnchor="middle" fill="#FEF08A" fontSize="14" fontWeight="bold">
          ♫
        </text>
        <text x="0" y="134" textAnchor="middle" fill="#FDE68A" fontSize="10" fontWeight="bold">
          Peak Harmony
        </text>
      </g>

      {/* Step 3: Red Pullback Candle as Calm Musical Rest / Deep Cello Note */}
      <g transform="translate(245, 0)">
        <line x1="0" y1="58" x2="0" y2="118" stroke="#F43F5E" strokeWidth="2.2" />
        <rect x="-9" y="70" width="18" height="32" rx="3" fill="#E11D48" fillOpacity="0.45" stroke="#FDA4AF" strokeWidth="1.2" />
        <circle cx="0" cy="96" r="11" fill="#4C0519" stroke="#FDA4AF" strokeWidth="1.5" />
        <text x="0" y="101" textAnchor="middle" fill="#FFE4E6" fontSize="14" fontWeight="bold">
          ♩
        </text>
        <text x="0" y="134" textAnchor="middle" fill="#FDA4AF" fontSize="10" fontWeight="bold">
          Calm Breath (Rest)
        </text>
      </g>

      {/* Center Transformation: Golden Symphony Harp Bridge */}
      <g transform="translate(355, 18)">
        <circle cx="0" cy="48" r="28" fill="#0F172A" stroke="#F59E0B" strokeWidth="2" />
        <text x="0" y="56" textAnchor="middle" fill="#FDE68A" fontSize="26">
          ♬
        </text>
        <text x="0" y="116" textAnchor="middle" fill="#FBBF24" fontSize="10" fontWeight="bold">
          Market Symphony
        </text>
      </g>

      {/* Step 4: Pure Floating Golden & Emerald Musical Notes on the Right */}
      <g transform="translate(465, 0)">
        <line x1="0" y1="48" x2="0" y2="104" stroke="#F43F5E" strokeOpacity="0.4" strokeWidth="2" />
        <rect x="-7" y="62" width="14" height="26" rx="3" fill="#E11D48" fillOpacity="0.3" />
        <circle cx="0" cy="76" r="12" fill="#1E293B" stroke="#FBBF24" strokeWidth="1.5" />
        <text x="0" y="81" textAnchor="middle" fill="#FDE68A" fontSize="15" fontWeight="bold">
          ♪
        </text>
        <text x="0" y="134" textAnchor="middle" fill="#CBD5E1" fontSize="10">
          Valley Support
        </text>
      </g>

      <g transform="translate(555, 0)">
        <line x1="0" y1="28" x2="0" y2="90" stroke="#10B981" strokeOpacity="0.5" strokeWidth="2" />
        <rect x="-8" y="40" width="16" height="34" rx="3" fill="#10B981" fillOpacity="0.35" />
        <circle cx="0" cy="46" r="13" fill="#064E3B" stroke="#FDE68A" strokeWidth="1.6" />
        <text x="0" y="51" textAnchor="middle" fill="#FEF08A" fontSize="16" fontWeight="bold">
          ♫
        </text>
        <text x="0" y="134" textAnchor="middle" fill="#6EE7B7" fontSize="10" fontWeight="bold">
          Rising Chord
        </text>
      </g>

      <g transform="translate(632, 0)">
        <circle cx="0" cy="30" r="14" fill="#F59E0B" fillOpacity="0.25" stroke="#FEF08A" strokeWidth="1.8" />
        <text x="0" y="36" textAnchor="middle" fill="#FEF08A" fontSize="18" fontWeight="bold">
          ♬
        </text>
        <text x="0" y="134" textAnchor="middle" fill="#FDE68A" fontSize="10" fontWeight="bold">
          Abundance
        </text>
      </g>
    </svg>
  </div>
);

interface SymphonyFrequencyBannersProps {
  compact?: boolean;
  onOpenMusicGraph?: () => void;
}

export const SymphonyFrequencyBanners: React.FC<SymphonyFrequencyBannersProps> = ({
  compact = false,
  onOpenMusicGraph,
}) => {
  const [expandedInCompact, setExpandedInCompact] = useState<boolean>(false);
  const [playingMode, setPlayingMode] = useState<'none' | 'dissonance_440' | 'abundance_chord'>('none');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stopTimerRef = useRef<number | null>(null);

  const stopHarmonicPreview = () => {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setPlayingMode('none');
  };

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) {
        window.clearTimeout(stopTimerRef.current);
      }
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  /**
   * Plays a rich, multi-note Symphonic Harp & Warm Cello Arpeggio for Abundance,
   * or a tense, off-balance minor pulse for Scam Dissonance (filtered so it is never screechy).
   */
  const handlePlayFrequencyDemo = (mode: 'dissonance_440' | 'abundance_chord') => {
    if (playingMode === mode) {
      stopHarmonicPreview();
      return;
    }
    stopHarmonicPreview();

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const now = ctx.currentTime;

      // Warm Low-Pass Acoustic Filter + Concert Hall Echo
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(mode === 'abundance_chord' ? 1600 : 950, now);

      const delay = ctx.createDelay();
      delay.delayTime.setValueAtTime(0.24, now);
      const feedback = ctx.createGain();
      feedback.gain.setValueAtTime(0.26, now);
      const wet = ctx.createGain();
      wet.gain.setValueAtTime(0.25, now);

      filter.connect(ctx.destination);
      filter.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      wet.connect(ctx.destination);

      const playPluck = (
        freq: number,
        startOffset: number,
        duration: number,
        gainVal: number,
        type: OscillatorType = 'sine'
      ) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now + startOffset);
        g.gain.setValueAtTime(0.0001, now + startOffset);
        g.gain.linearRampToValueAtTime(gainVal, now + startOffset + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0005, now + startOffset + duration);
        osc.connect(g);
        g.connect(filter);
        osc.start(now + startOffset);
        osc.stop(now + startOffset + duration + 0.05);
      };

      if (mode === 'dissonance_440') {
        // Unsettled, restless minor/tritone pulse (low-pass filtered so it's never piercing)
        const restlessNotes = [220, 233.08, 311.13, 220, 233.08, 311.13];
        restlessNotes.forEach((f, idx) => {
          playPluck(f, idx * 0.45, 0.55, 0.08, 'triangle');
        });
      } else {
        // Lush Symphonic Harp Arpeggio + Warm Bowed Cello Root (432 Hz / 528 Hz Harmony)
        // Warm Cello Pad Foundation
        playPluck(216.0, 0, 3.8, 0.11, 'sine');
        playPluck(324.0, 0.1, 3.6, 0.08, 'triangle');
        // Ascending Golden Harp Notes (♪ ♫ ♬)
        const harpArpeggio = [256.87, 323.63, 384.87, 432.0, 528.0, 647.27, 528.0, 432.0];
        harpArpeggio.forEach((f, idx) => {
          playPluck(f, idx * 0.34, 1.4, 0.09, 'sine');
          playPluck(f * 0.5, idx * 0.34, 1.2, 0.04, 'triangle');
        });
      }

      setPlayingMode(mode);
      stopTimerRef.current = window.setTimeout(() => {
        stopHarmonicPreview();
      }, 4100);
    } catch {
      setPlayingMode('none');
    }
  };

  return (
    <section className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Top Harmonic Header Banner with Faded Red & Green Animated Candlesticks */}
      <div className="relative overflow-hidden p-4 sm:p-6 bg-gradient-to-r from-amber-100/90 via-sky-50/95 to-emerald-100/85 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-amber-300/60 dark:border-slate-800">
        <SymphonyCandlestickBackdrop className="opacity-30 dark:opacity-35" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
              <span>♪ Visual & Musical Analogy</span>
              <span aria-hidden="true">·</span>
              <span>Emotional Regulation & Calm Pattern Recognition</span>
            </div>
            <h2 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
              When You Learn the Market Properly, You Hear a Symphony—Not Scam Panic
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>Why Music Matters for Beginners:</strong> Most retail trading apps trigger adrenaline, anxiety, and impulsive panic-selling. Turning green candles into rising harp notes (♪) and red candles into calm cello rests (♩) actively trains patience, nervous-system calm, and disciplined pattern recognition.
            </p>
          </div>

          {/* Mobile-Friendly Wrapping Sound Comparison Buttons (Never Clips on Mobile) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handlePlayFrequencyDemo('abundance_chord')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                playingMode === 'abundance_chord'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm'
              }`}
            >
              {playingMode === 'abundance_chord' ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 shrink-0" />
                  <span>Stop Symphony Harp</span>
                </>
              ) : (
                <>
                  <Music className="w-3.5 h-3.5 shrink-0" />
                  <span>♫ Play Symphony Harp Melody</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handlePlayFrequencyDemo('dissonance_440')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                playingMode === 'dissonance_440'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white/90 dark:bg-slate-900/90 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              {playingMode === 'dissonance_440' ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 shrink-0" />
                  <span>Stop 440 Hz Tension</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Compare 440 Hz Tension</span>
                </>
              )}
            </button>

            {onOpenMusicGraph && (
              <button
                type="button"
                onClick={onOpenMusicGraph}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer"
              >
                <span>♪ Open 8-Hour Music Graph →</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Visual Content Body */}
      <div className="p-4 sm:p-6 space-y-5">
        {/* Visual Analogy Illustration: Candlesticks Morphing into Musical Notes */}
        <CandlestickToMusicVisualBanner />

        {/* Two Side-by-Side Visual Perspective Cards (Upgraded with Musical Note Visuals) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Card: Leaving Behind the 440 Hz Scam-Based System */}
          <div className="p-4 sm:p-5 rounded-xl border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/15 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-400">
                ✕ The Old Scam-Based Frequency (Fear & Noise)
              </span>
              <span className="font-mono text-[11px] text-rose-600/80 dark:text-rose-400/80 shrink-0">
                440 Hz Static
              </span>
            </div>

            {/* Visual Jagged Noise Wave SVG */}
            <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between gap-3">
              <svg viewBox="0 0 220 36" className="w-36 sm:w-44 h-8 shrink-0">
                <path
                  d="M 4 18 L 18 5 L 28 31 L 42 8 L 54 32 L 68 4 L 82 29 L 96 10 L 112 33 L 128 6 L 144 30 L 162 9 L 178 28 L 196 7 L 214 22"
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300 text-right">
                Jagged Panic & Fake Hype
              </span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  !
                </span>
                <span>
                  <strong>Artificial Urgency & FOMO:</strong> Flashing timers and fake “guaranteed daily returns” built to hijack your emotions into buying tops and panic-selling bottoms.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  ✕
                </span>
                <span>
                  <strong>Rigged Controls & Locked Vaults:</strong> Custodial platforms with fake “Stop Trading” buttons, seed-phrase traps, and $45 gas fees that drain small learners.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  ⚡
                </span>
                <span>
                  <strong>50x Liquidation Casino:</strong> High-leverage gambling where a single red candle wipes out your balance and steals your peace of mind.
                </span>
              </li>
            </ul>
          </div>

          {/* Right Card: Stepping Into the Symphony Frequency of Abundance */}
          <div className="p-4 sm:p-5 rounded-xl border border-emerald-200/90 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/15 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300">
                ♫ The Symphony Frequency of Abundance (Harmony)
              </span>
              <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 shrink-0">
                Musical Flow
              </span>
            </div>

            {/* Visual Harmonic Wave + Floating Musical Notes SVG */}
            <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-200/70 dark:border-emerald-900/40 flex items-center justify-between gap-3">
              <svg viewBox="0 0 220 36" className="w-36 sm:w-44 h-8 shrink-0">
                <path
                  d="M 6 24 Q 35 6, 65 18 T 125 16 T 185 14 T 214 10"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <text x="32" y="15" fill="#059669" fontSize="13" fontWeight="bold">♪</text>
                <text x="88" y="28" fill="#E11D48" fontSize="12" fontWeight="bold">♩</text>
                <text x="142" y="14" fill="#D97706" fontSize="13" fontWeight="bold">♫</text>
                <text x="195" y="16" fill="#059669" fontSize="14" fontWeight="bold">♬</text>
              </svg>
              <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 text-right">
                Notes, Rests & Peace
              </span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  ♪
                </span>
                <span>
                  <strong>Green & Red Candles as Musical Notes:</strong> Green candles are rising notes (<strong>♪</strong> expansion); red candles are natural musical rests (<strong>♩</strong> calm pullbacks) that prepare the next upward movement.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  ♫
                </span>
                <span>
                  <strong>Sovereign Self-Custody & Sub-Penny Flow:</strong> Your $5 stays in your own wallet on XRPL & Stellar rails (~$0.0001 fee) with zero private keys ever requested.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  ♬
                </span>
                <span>
                  <strong>The 10-Cent Rhythm of Peace ($0.10 = 1R):</strong> 1x Spot ownership with a 2% risk cap so you practice discipline in a frequency of gratitude, clarity, and abundance.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Toggle for Detailed 4-Banner Breakdown when in Compact Mode */}
        {compact && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Each candlestick string on our harp represents hearing market rhythm instead of scam panic.
            </span>
            <button
              type="button"
              onClick={() => setExpandedInCompact((v) => !v)}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              {expandedInCompact
                ? 'Hide 4 Visual Harmony Banners ▲'
                : 'View All 4 Visual Harmony Banners ▼'}
            </button>
          </div>
        )}

        {/* Full 4-Banner Visual Analogy Grid */}
        {(!compact || expandedInCompact) && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                4 Visual Analogy Banners: Turning Scam Noise Into the Symphony of Abundance
              </span>
              <span>♪ Visual Step-by-Step Guide</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FREQUENCY_PERSPECTIVE_BANNERS.map((banner) => (
                <div
                  key={banner.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
                        Banner {banner.number} · ♪
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        <span className="text-rose-600 dark:text-rose-400">Scam Noise</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Symphony Harmony
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {banner.title}
                    </h3>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
                        <div className="font-semibold text-rose-700 dark:text-rose-400 text-[11px]">
                          ✕ {banner.scamFrequencyLabel}
                        </div>
                        <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                          {banner.scamBullets.map((item) => (
                            <li key={item} className="flex items-start gap-1.5">
                              <span className="text-rose-500 font-bold">–</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/40 space-y-1">
                        <div className="font-semibold text-emerald-700 dark:text-emerald-400 text-[11px]">
                          ♫ {banner.symphonyFrequencyLabel}
                        </div>
                        <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                          {banner.symphonyBullets.map((item) => (
                            <li key={item} className="flex items-start gap-1.5">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">♪</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center gap-2 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                    <SymphonyHarpLogo variant="vector" className="w-4 h-4 shrink-0" />
                    <span>{banner.takeaway}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
