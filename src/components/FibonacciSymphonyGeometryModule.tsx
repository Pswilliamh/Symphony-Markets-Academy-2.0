import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Music,
  SlidersHorizontal,
  Volume2,
} from 'lucide-react';
import videoCoverStopsImg from '../assets/images/video_cover_stops_1794561549253.jpg';
import { AssetSymbol, Candle } from '../types/market';
import {
  playFibonacciHarmonicInterval,
  playThreeWaveFibonacciSymphony,
} from '../utils/tenSetSymphonyAudio';
import { SectionPromoVideoBanner } from './SectionPromoVideoBanner';

interface FibonacciSymphonyGeometryModuleProps {
  symbol: AssetSymbol;
  onSelectSymbol?: (sym: AssetSymbol) => void;
  candles?: Candle[];
  livePrice: number;
  onApplySetupToSimulator?: (setup: {
    entryPrice: number;
    stopLossPrice: number;
    takeProfitPrice: number;
    rrRatio: number;
  }) => void;
}

type ModuleStageTab = 'extensions_3pt' | 'music_octave_bridge' | 'creation_commerce_pdf';
type WavePresetMode = 'ten_dollar_wave' | 'pdf_canonical_100' | 'live_coin_wave';
type ExtensionAnchorFormula = 'three_point_from_c' | 'two_point_swing_pdf';

interface HarmonicRatioRow {
  levelLabel: string;
  category: 'Retracement' | 'Midpoint' | 'Golden Pocket' | 'Invalidation' | 'Extension' | 'Golden Target';
  mathOrigin: string;
  musicalInterval: string;
  musicalRatio: string;
  notePair: string;
  rootHz: number;
  targetHz: number;
  tone: 'harp' | 'cello' | 'warm_chord';
  marketAction: string;
}

const HARMONIC_FIB_ROWS: HarmonicRatioRow[] = [
  {
    levelLabel: '23.6%',
    category: 'Retracement',
    mathOrigin: 'F(n) / F(n+3) [34 / 144]',
    musicalInterval: 'Major Second Step',
    musicalRatio: '9 : 8 (1.125)',
    notePair: 'C4 → D4',
    rootHz: 256.87,
    targetHz: 288.98,
    tone: 'harp',
    marketAction: 'Shallow pause in fast runaway trends; prone to sudden whipsaws.',
  },
  {
    levelLabel: '38.2%',
    category: 'Retracement',
    mathOrigin: 'F(n) / F(n+2) [55 / 144]',
    musicalInterval: 'Major Third (5 : 4)',
    musicalRatio: '5 : 4 (1.250)',
    notePair: 'C4 → E4',
    rootHz: 256.87,
    targetHz: 321.09,
    tone: 'harp',
    marketAction: 'Healthy bull-trend pullback; frequently aligns with rising 20/50 EMA.',
  },
  {
    levelLabel: '50.0%',
    category: 'Midpoint',
    mathOrigin: 'Arithmetic Median (1 / 2)',
    musicalInterval: 'Perfect Fifth (3 : 2)',
    musicalRatio: '3 : 2 (1.500)',
    notePair: 'C4 → G4',
    rootHz: 256.87,
    targetHz: 385.3,
    tone: 'harp',
    marketAction: 'Psychological Dow Theory equilibrium where institutions re-accumulate.',
  },
  {
    levelLabel: '61.8%',
    category: 'Golden Pocket',
    mathOrigin: 'Inverse Phi (144 / 233 = 0.6180)',
    musicalInterval: 'Minor-to-Golden Sixth (8 : 5)',
    musicalRatio: '8 : 5 (1.600 ≈ Φ)',
    notePair: 'C4 → Ab4 (Point C Buy)',
    rootHz: 256.87,
    targetHz: 414.8,
    tone: 'warm_chord',
    marketAction: 'Primary institutional support floor (Point C). Wait for Hammer or Engulfing candle.',
  },
  {
    levelLabel: '78.6%',
    category: 'Invalidation',
    mathOrigin: 'Square Root of 0.618 (√0.618)',
    musicalInterval: 'Low Cello Grounding Rest',
    musicalRatio: 'Sub-Octave Anchor',
    notePair: 'C4 → G3 Stop Guard',
    rootHz: 256.87,
    targetHz: 192.65,
    tone: 'cello',
    marketAction: 'Last line of structural defense. A close below 78.6% invalidates Wave 1 (Stop-Loss).',
  },
  {
    levelLabel: '100.0%',
    category: 'Extension',
    mathOrigin: '1.00 × Wave (A→B) from Point C',
    musicalInterval: 'Pure Octave (2 : 1)',
    musicalRatio: '2 : 1 (2.000)',
    notePair: 'C4 → C5 Octave',
    rootHz: 256.87,
    targetHz: 513.74,
    tone: 'harp',
    marketAction: 'Symmetrical Measured Move: Wave 3 equals the exact dollar length of Wave 1.',
  },
  {
    levelLabel: '127.2%',
    category: 'Extension',
    mathOrigin: 'Square Root of Phi (√1.618)',
    musicalInterval: 'Octave + Major Third Bridge',
    musicalRatio: '√Φ (1.2720)',
    notePair: 'C5 → E5 (Target 1)',
    rootHz: 385.3,
    targetHz: 490.1,
    tone: 'warm_chord',
    marketAction: 'Conservative Take-Profit 1: Steady trend milestone to lock partial limit-sell gains.',
  },
  {
    levelLabel: '161.8%',
    category: 'Golden Target',
    mathOrigin: 'Full Golden Ratio Φ (233 / 144)',
    musicalInterval: 'Golden Sixth Finale (5 : 3 / Φ)',
    musicalRatio: '233 : 144 (1.6180)',
    notePair: 'A4 (432 Hz) → Φ Peak',
    rootHz: 432.0,
    targetHz: 698.98,
    tone: 'warm_chord',
    marketAction: 'The Golden Target Wall: Algorithmic & institutional limit-sell orders cluster heavily here.',
  },
];

const UPLOADED_PDF_PATH = '/assets/aistudio/geometry-of-creation-and-commerce_9e656496.pdf';
const ORGANIC_RHYTHM_VIDEO_SRC = '/assets/The_Organic_Rhythm_of_Trading.mp4';
const ORGANIC_RHYTHM_DRIVE_ID = '1s-wUCvu1e3p3Rp93k1mzgi1TYHBuHw3i';
const RHYTHM_OF_CROWD_VIDEO_SRC = '/assets/The_Rhythm_of_the_Crowd.mp4';
const RHYTHM_OF_CROWD_DRIVE_ID = '1kCLZNmmcUAXP5XuRcAWfWnkWBXTs3YD5';

export const FibonacciSymphonyGeometryModule: React.FC<FibonacciSymphonyGeometryModuleProps> = ({
  symbol,
  onSelectSymbol,
  candles = [],
  livePrice,
  onApplySetupToSimulator,
}) => {
  const [activeStage, setActiveStage] = useState<ModuleStageTab>('extensions_3pt');
  const [presetMode, setPresetMode] = useState<WavePresetMode>('ten_dollar_wave');
  const [extensionFormula, setExtensionFormula] =
    useState<ExtensionAnchorFormula>('three_point_from_c');

  // Interactive sliders for custom exploration in 3-Point Wave Sandbox
  const [waveOneGainPct, setWaveOneGainPct] = useState<number>(50); // +50% on $20 = +$10 move ($20 -> $30)
  const [pullbackRetracePct, setPullbackRetracePct] = useState<number>(61.8); // 61.8% Golden Pocket default
  const [lastPlayedLabel, setLastPlayedLabel] = useState<string | null>(null);

  // Derive live Swing Low (Point A) and Swing High (Point B) from active candles
  const liveSwingAnchors = useMemo(() => {
    const fallbackBase =
      livePrice > 0
        ? livePrice
        : symbol === 'BTCUSDT'
        ? 91450
        : symbol === 'XRPUSDT'
        ? 0.962
        : 0.138;

    if (!candles || candles.length < 12) {
      return {
        pointA: Number((fallbackBase * 0.92).toFixed(symbol === 'BTCUSDT' ? 2 : 4)),
        pointB: Number((fallbackBase * 1.06).toFixed(symbol === 'BTCUSDT' ? 2 : 4)),
      };
    }

    const recent = candles.slice(-48);
    let low = Infinity;
    let high = -Infinity;
    for (const c of recent) {
      if (c.low < low) low = c.low;
      if (c.high > high) high = c.high;
    }
    if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low) {
      return {
        pointA: Number((fallbackBase * 0.92).toFixed(symbol === 'BTCUSDT' ? 2 : 4)),
        pointB: Number((fallbackBase * 1.06).toFixed(symbol === 'BTCUSDT' ? 2 : 4)),
      };
    }
    return {
      pointA: low,
      pointB: high,
    };
  }, [candles, livePrice, symbol]);

  // Compute exact 3-Point Fibonacci Retracement & Extension Geometry
  const waveMath = useMemo(() => {
    let pointA = 20.0;
    let pointB = 30.0;
    let decimals = 2;

    if (presetMode === 'ten_dollar_wave') {
      pointA = 20.0;
      pointB = Number((pointA * (1 + waveOneGainPct / 100)).toFixed(2));
      decimals = 2;
    } else if (presetMode === 'pdf_canonical_100') {
      pointA = 100.0;
      pointB = 200.0;
      decimals = 2;
    } else {
      pointA = liveSwingAnchors.pointA;
      pointB = liveSwingAnchors.pointB;
      decimals = symbol === 'BTCUSDT' ? 2 : 4;
    }

    const waveAB = Math.max(0.0001, pointB - pointA);
    const retraceRatio = pullbackRetracePct / 100;

    // Point C (The Dip Low after pulling back from Point B)
    const pointC = pointB - waveAB * retraceRatio;

    // Retracement levels along A -> B
    const ret236 = pointB - waveAB * 0.236;
    const ret382 = pointB - waveAB * 0.382;
    const ret500 = pointB - waveAB * 0.5;
    const ret618 = pointB - waveAB * 0.618;
    const ret786 = pointB - waveAB * 0.786;

    // Forward Extensions:
    // 1) 3-Point Trend-Based Extension (Adds Wave A->B multiples onto Point C Dip Low)
    // 2) 2-Point Swing Extension from PDF Figure 1.0 (Adds multiples above Point A / Point B)
    const ext100 =
      extensionFormula === 'three_point_from_c' ? pointC + waveAB * 1.0 : pointB;
    const ext1272 =
      extensionFormula === 'three_point_from_c'
        ? pointC + waveAB * 1.272
        : pointA + waveAB * 1.272;
    const ext1618 =
      extensionFormula === 'three_point_from_c'
        ? pointC + waveAB * 1.618
        : pointA + waveAB * 1.618;

    const riskPerUnit = Math.max(0.0001, pointC - ret786);
    const rewardTo1618 = Math.max(0, ext1618 - pointC);
    const rrTo1618 = Number((rewardTo1618 / riskPerUnit).toFixed(2));

    return {
      decimals,
      pointA,
      pointB,
      pointC,
      waveAB,
      ret236,
      ret382,
      ret500,
      ret618,
      ret786,
      ext100,
      ext1272,
      ext1618,
      rrTo1618,
    };
  }, [presetMode, waveOneGainPct, pullbackRetracePct, liveSwingAnchors, symbol, extensionFormula]);

  const fmt = (val: number) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: waveMath.decimals,
      maximumFractionDigits: waveMath.decimals,
    });

  const handleTriggerNodeAudio = (
    label: string,
    rootHz: number,
    targetHz: number,
    tone: 'harp' | 'cello' | 'warm_chord' = 'harp'
  ) => {
    playFibonacciHarmonicInterval({ rootHz, targetHz, tone });
    setLastPlayedLabel(label);
  };

  // Map price to SVG Y coordinate [26 .. 244]
  const minChartPrice = waveMath.pointA * 0.96;
  const maxChartPrice = Math.max(waveMath.ext1618, waveMath.pointB) * 1.04;
  const priceSpan = Math.max(0.0001, maxChartPrice - minChartPrice);
  const toSvgY = (price: number) => {
    const pct = (price - minChartPrice) / priceSpan;
    return Math.round(244 - Math.max(0, Math.min(1, pct)) * 214);
  };

  const yA = toSvgY(waveMath.pointA);
  const yB = toSvgY(waveMath.pointB);
  const yC = toSvgY(waveMath.pointC);
  const y786 = toSvgY(waveMath.ret786);
  const y100 = toSvgY(waveMath.ext100);
  const y1272 = toSvgY(waveMath.ext1272);
  const y1618 = toSvgY(waveMath.ext1618);

  const stagesOrder: Array<{ id: ModuleStageTab; label: string }> = [
    { id: 'extensions_3pt', label: '01. 3-Point Extensions (A → B → C)' },
    { id: 'music_octave_bridge', label: '02. Fibonacci & Musical Notes' },
    { id: 'creation_commerce_pdf', label: '03. Geometry of Creation (144 / 233 PDF)' },
  ];
  const currentStageIdx = stagesOrder.findIndex((s) => s.id === activeStage);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-6">
      {/* Dedicated Fibonacci & Organic Rhythm Video Series */}
      <SectionPromoVideoBanner
        sectionBadge="Symphony Markets Academy · Fibonacci & Harmonic Video Series"
        headline="The Organic Rhythm of Trading (7:03) & Fibonacci Part 1 (5:36)"
        description="Watch how botanical Fibonacci spirals, Hebrew Gematria (144 Garden of Eden / 233 Tree of Life = 1.618 Φ), 8-Hour Harp & Cello Candlestick Notes, and 3-Point Extensions (100%, 127.2%, 161.8% Golden Target) unite with the 2% ($0.10) risk boundary."
        accentTone="emerald"
        tracks={[
          {
            id: 'fib_organic_rhythm_of_trading',
            tabLabel: '01 · The Organic Rhythm of Trading (7:03)',
            title: 'Symphony Markets Academy — The Organic Rhythm of Trading',
            duration: '7:03',
            videoSrc: ORGANIC_RHYTHM_VIDEO_SRC,
            driveFileId: ORGANIC_RHYTHM_DRIVE_ID,
            posterSrc: videoCoverStopsImg,
          },
          {
            id: 'fib_part1_rhythm_of_crowd',
            tabLabel: '02 · Fibonacci Part 1: Rhythm of the Crowd (5:36)',
            title: 'The Rhythm of the Crowd (Fibonacci Part 1)',
            duration: '5:36',
            videoSrc: RHYTHM_OF_CROWD_VIDEO_SRC,
            driveFileId: RHYTHM_OF_CROWD_DRIVE_ID,
            posterSrc: videoCoverStopsImg,
          },
          {
            id: 'fib_symphony_notes_reel',
            tabLabel: '03 · Symphony Notes Reel (0:10)',
            title: 'Symphony Markets Academy — Scam-Free Notes Reel',
            duration: '0:10',
            videoSrc: '/api/drive-video/1R_Cy_uBTBjVgLjCqseoAjPxm0oqh5e9g',
            driveFileId: '1R_Cy_uBTBjVgLjCqseoAjPxm0oqh5e9g',
            posterSrc: videoCoverStopsImg,
          },
        ]}
      />

      {/* Header + 3-Stage Non-Scrolling Sub-Navigation */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-amber-700 dark:text-amber-400">
            <Music className="w-3.5 h-3.5 shrink-0" />
            <span>Symphony Harmonics · Golden Ratio (Φ = 1.618)</span>
            <span aria-hidden="true">·</span>
            <span>3-Point Fibonacci Extensions & Gematria Synthesis</span>
          </div>
          <h2 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            The Geometry of Creation, Musical Notes & 3-Point Fibonacci Extensions
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Retracements measure how far a market breathes inward on a dip (<strong className="text-slate-900 dark:text-slate-200">61.8% Golden Pocket</strong>), while <strong className="text-slate-900 dark:text-slate-200">3-Point Fibonacci Extensions (A → B → C)</strong> project forward to where upward momentum hits institutional profit-taking walls (<strong className="text-emerald-700 dark:text-emerald-400">100%, 127.2%, and 161.8% Φ</strong>)—governed by the exact same ratios that form musical chords.
          </p>
        </div>

        {/* Interactive Stage Switcher (Keeps Each Stage Focused Without Long Scrolling) */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
          {stagesOrder.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setActiveStage(st.id)}
              className={`px-3 py-2 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeStage === st.id
                  ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================================
       * STAGE 01: INTERACTIVE 3-POINT FIBONACCI EXTENSION SANDBOX (A -> B -> C)
       * ===================================================================== */}
      {activeStage === 'extensions_3pt' && (
        <div className="space-y-5">
          {/* Top Toolbar: Preset Selector + 3-Point vs 2-Point Formula Toggle + Audio Play */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setPresetMode('ten_dollar_wave');
                  setWaveOneGainPct(50);
                  setPullbackRetracePct(61.8);
                  setExtensionFormula('three_point_from_c');
                }}
                className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                  presetMode === 'ten_dollar_wave'
                    ? 'bg-sky-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                $10 Wave Example ($20 → $30 → Dip)
              </button>

              <button
                type="button"
                onClick={() => {
                  setPresetMode('pdf_canonical_100');
                  setPullbackRetracePct(61.8);
                }}
                className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                  presetMode === 'pdf_canonical_100'
                    ? 'bg-sky-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                PDF Figure 1.0 ($100 → $200)
              </button>

              <button
                type="button"
                onClick={() => setPresetMode('live_coin_wave')}
                className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                  presetMode === 'live_coin_wave'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                Live {symbol.replace('USDT', '')} Chart Wave
              </button>

              {presetMode === 'live_coin_wave' && onSelectSymbol && (
                <div className="flex items-center gap-1 ml-1">
                  {(['BTCUSDT', 'XRPUSDT', 'XLMUSDT'] as AssetSymbol[]).map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => onSelectSymbol(sym)}
                      className={`px-2 py-1 rounded font-mono text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0 ${
                        symbol === sym
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {sym.replace('USDT', '')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setExtensionFormula('three_point_from_c')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                    extensionFormula === 'three_point_from_c'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  3-Point From C (A→B→C)
                </button>
                <button
                  type="button"
                  onClick={() => setExtensionFormula('two_point_swing_pdf')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                    extensionFormula === 'two_point_swing_pdf'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  PDF 2-Point ($261.80)
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  playThreeWaveFibonacciSymphony();
                  setLastPlayedLabel('3-Wave Impulse → Golden Pocket → 161.8% Finale');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>♪ Hear 3-Wave Symphony</span>
              </button>
            </div>
          </div>

          {/* Two-Zone Educational Sandbox: Left Interactive SVG Stage (7 cols) + Right Control & Math Deck (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* LEFT ZONE: Interactive 3-Point Fibonacci Wave + Musical Staff Nodes */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 flex flex-col justify-between space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                <span className="font-semibold text-white">
                  Interactive 3-Point Wave Map (Click Any Price Node to Hear Its Musical Ratio)
                </span>
                {lastPlayedLabel && (
                  <span className="font-mono text-[11px] text-amber-300">
                    ♪ Sounded: {lastPlayedLabel}
                  </span>
                )}
              </div>

              <svg
                viewBox="0 0 680 272"
                className="w-full h-64 sm:h-72 select-none"
                role="img"
                aria-label="3-Point Fibonacci Extension and Retracement Interactive Wave Diagram"
              >
                {/* Horizontal Fibonacci Projection Lines */}
                {/* 161.8% Golden Target */}
                <line
                  x1="44"
                  y1={y1618}
                  x2="652"
                  y2={y1618}
                  stroke="#10B981"
                  strokeWidth="1.6"
                  strokeDasharray="6 4"
                />
                <text
                  x="648"
                  y={Math.max(14, y1618 - 5)}
                  textAnchor="end"
                  fill="#6EE7B7"
                  fontSize="10.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  161.8% Golden Target (${fmt(waveMath.ext1618)}) · ♪ Φ Peak
                </text>

                {/* 127.2% Extension */}
                <line
                  x1="44"
                  y1={y1272}
                  x2="652"
                  y2={y1272}
                  stroke="#34D399"
                  strokeOpacity="0.65"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />
                <text
                  x="648"
                  y={y1272 - 4}
                  textAnchor="end"
                  fill="#A7F3D0"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  127.2% √Φ Target (${fmt(waveMath.ext1272)}) · ♪ E5
                </text>

                {/* 100% Extension */}
                <line
                  x1="44"
                  y1={y100}
                  x2="652"
                  y2={y100}
                  stroke="#38BDF8"
                  strokeOpacity="0.7"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />
                <text
                  x="648"
                  y={y100 - 4}
                  textAnchor="end"
                  fill="#BAE6FD"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  100% Measured Wave (${fmt(waveMath.ext100)}) · ♪ C5 Octave
                </text>

                {/* Point B Interim High Line */}
                <line
                  x1="44"
                  y1={yB}
                  x2="420"
                  y2={yB}
                  stroke="#94A3B8"
                  strokeOpacity="0.45"
                  strokeWidth="1"
                />

                {/* Point C Active Pullback Line */}
                <line
                  x1="180"
                  y1={yC}
                  x2="652"
                  y2={yC}
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                />
                <text
                  x="648"
                  y={yC + 12}
                  textAnchor="end"
                  fill="#FDE68A"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  Point C ({pullbackRetracePct.toFixed(1)}% Dip @ ${fmt(waveMath.pointC)}) · ♪ 8:5 Buy
                </text>

                {/* 78.6% Stop-Loss Invalidation Line */}
                <line
                  x1="180"
                  y1={y786}
                  x2="510"
                  y2={y786}
                  stroke="#F43F5E"
                  strokeOpacity="0.75"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
                <text
                  x="508"
                  y={Math.min(264, y786 + 11)}
                  textAnchor="end"
                  fill="#FDA4AF"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  78.6% Invalidation Stop (${fmt(waveMath.ret786)}) · ♩ Cello Guard
                </text>

                {/* Point A Base Line */}
                <line
                  x1="44"
                  y1={yA}
                  x2="340"
                  y2={yA}
                  stroke="#64748B"
                  strokeOpacity="0.5"
                  strokeWidth="1"
                />

                {/* 3-WAVE TRAJECTORY: Wave 1 (A -> B), Wave 2 Pullback (B -> C), Wave 3 Extension (C -> 161.8%) */}
                {/* Wave 1: Origin A to Peak B */}
                <path
                  d={`M 76 ${yA} C 118 ${yA}, 152 ${yB}, 196 ${yB}`}
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* Wave 2: Peak B to Dip Low C */}
                <path
                  d={`M 196 ${yB} C 236 ${yB}, 264 ${yC}, 304 ${yC}`}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* Wave 3: Dip Low C projecting through 100%, 127.2%, to 161.8% Golden Wall */}
                <path
                  d={`M 304 ${yC} C 365 ${yC}, 425 ${y1272}, 490 ${y1618}`}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* Interactive Clickable Nodes */}
                {/* Node A: Origin Low */}
                <g
                  className="cursor-pointer"
                  onClick={() =>
                    handleTriggerNodeAudio(
                      `Point A Origin ($${fmt(waveMath.pointA)} · C4 Tonic)`,
                      256.87,
                      256.87,
                      'harp'
                    )
                  }
                >
                  <circle cx="76" cy={yA} r="7" fill="#38BDF8" stroke="#0F172A" strokeWidth="2" />
                  <text
                    x="76"
                    y={Math.min(265, yA + 18)}
                    textAnchor="middle"
                    fill="#E2E8F0"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    Point A (${fmt(waveMath.pointA)})
                  </text>
                </g>

                {/* Node B: Wave 1 Peak */}
                <g
                  className="cursor-pointer"
                  onClick={() =>
                    handleTriggerNodeAudio(
                      `Point B Wave 1 Peak ($${fmt(waveMath.pointB)} · 3:2 Fifth)`,
                      256.87,
                      385.3,
                      'harp'
                    )
                  }
                >
                  <circle cx="196" cy={yB} r="7" fill="#38BDF8" stroke="#0F172A" strokeWidth="2" />
                  <text
                    x="196"
                    y={Math.max(15, yB - 10)}
                    textAnchor="middle"
                    fill="#BAE6FD"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    Point B (${fmt(waveMath.pointB)})
                  </text>
                </g>

                {/* Node C: Dip Low */}
                <g
                  className="cursor-pointer"
                  onClick={() =>
                    handleTriggerNodeAudio(
                      `Point C Dip Buy ($${fmt(waveMath.pointC)} · Golden Pocket)`,
                      256.87,
                      414.8,
                      'warm_chord'
                    )
                  }
                >
                  <circle cx="304" cy={yC} r="8" fill="#F59E0B" stroke="#0F172A" strokeWidth="2" />
                  <text
                    x="304"
                    y={Math.min(265, yC + 19)}
                    textAnchor="middle"
                    fill="#FDE68A"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    Point C Buy
                  </text>
                </g>

                {/* Node 127.2% Conservative Target */}
                <g
                  className="cursor-pointer"
                  onClick={() =>
                    handleTriggerNodeAudio(
                      `127.2% √Φ Target ($${fmt(waveMath.ext1272)})`,
                      385.3,
                      490.1,
                      'warm_chord'
                    )
                  }
                >
                  <circle
                    cx="432"
                    cy={y1272}
                    r="6.5"
                    fill="#34D399"
                    stroke="#0F172A"
                    strokeWidth="2"
                  />
                </g>

                {/* Node 161.8% Golden Target Wall */}
                <g
                  className="cursor-pointer"
                  onClick={() =>
                    handleTriggerNodeAudio(
                      `161.8% Golden Target ($${fmt(waveMath.ext1618)} · Φ Finale)`,
                      432.0,
                      698.98,
                      'warm_chord'
                    )
                  }
                >
                  <circle
                    cx="490"
                    cy={y1618}
                    r="8.5"
                    fill="#10B981"
                    stroke="#ECFDF5"
                    strokeWidth="2"
                  />
                  <text
                    x="490"
                    y={Math.max(14, y1618 - 11)}
                    textAnchor="middle"
                    fill="#6EE7B7"
                    fontSize="10.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    161.8% Wall
                  </text>
                </g>
              </svg>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-800 pt-2.5">
                <span>
                  Wave 1 Length (<span className="font-mono text-sky-300">B − A</span>):{' '}
                  <strong className="font-mono text-white">+${fmt(waveMath.waveAB)}</strong>
                </span>
                <span>
                  Projected Risk-to-Reward (Point C → 161.8% vs. 78.6% Stop):{' '}
                  <strong className="font-mono text-emerald-400">1 : {waveMath.rrTo1618}R</strong>
                </span>
              </div>
            </div>

            {/* RIGHT ZONE: 3-Point Controls, Exact Extension Milestones & Simulator Dispatch */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                  <SlidersHorizontal className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>Adjust the 3 Points (A → B → C)</span>
                </div>

                {presetMode === 'ten_dollar_wave' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="wave1-gain-slider"
                        className="font-medium text-slate-700 dark:text-slate-300"
                      >
                        Wave 1 Rally Size (Point A $20 → Point B):
                      </label>
                      <span className="font-mono font-bold text-sky-700 dark:text-sky-400 tabular-nums">
                        +${fmt(waveMath.waveAB)} (${fmt(waveMath.pointB)})
                      </span>
                    </div>
                    <input
                      id="wave1-gain-slider"
                      type="range"
                      min={15}
                      max={100}
                      step={5}
                      value={waveOneGainPct}
                      onChange={(e) => setWaveOneGainPct(Number(e.target.value))}
                      className="w-full accent-sky-600 cursor-pointer"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="point-c-retrace-slider"
                      className="font-medium text-slate-700 dark:text-slate-300"
                    >
                      Point C Dip Retracement Depth:
                    </label>
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                      {pullbackRetracePct.toFixed(1)}% (${fmt(waveMath.pointC)})
                    </span>
                  </div>
                  <input
                    id="point-c-retrace-slider"
                    type="range"
                    min={23.6}
                    max={75.0}
                    step={0.2}
                    value={pullbackRetracePct}
                    onChange={(e) => setPullbackRetracePct(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {[38.2, 50.0, 61.8].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setPullbackRetracePct(lvl)}
                        className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold cursor-pointer whitespace-nowrap ${
                          Math.abs(pullbackRetracePct - lvl) < 0.3
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {lvl === 61.8 ? '61.8% Golden Pocket' : `${lvl.toFixed(1)}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Calculated 3-Point Profit-Target Milestones */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 font-mono tabular-nums">
                  <div className="font-sans font-bold text-slate-900 dark:text-white">
                    Forward Limit-Sell Milestones (Projected Above Point C):
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-sky-700 dark:text-sky-400">100.0% Ext</span>
                      <span className="font-sans text-[11px] text-slate-500 dark:text-slate-400 block">
                        1.00 × Wave 1 · ♪ 2:1 Octave
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ${fmt(waveMath.ext100)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        127.2% Ext (√Φ)
                      </span>
                      <span className="font-sans text-[11px] text-slate-500 dark:text-slate-400 block">
                        Steady Trend Limit-Sell Target 1
                      </span>
                    </div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      ${fmt(waveMath.ext1272)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/40 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">
                        161.8% Golden Target (Φ)
                      </span>
                      <span className="font-sans text-[11px] text-slate-600 dark:text-slate-300 block">
                        Institutional & Bot Take-Profit Wall
                      </span>
                    </div>
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                      ${fmt(waveMath.ext1618)}
                    </span>
                  </div>
                </div>
              </div>

              {onApplySetupToSimulator && (
                <button
                  type="button"
                  onClick={() => {
                    // Use live coin anchors when sending to the Risk Simulator
                    const a = liveSwingAnchors.pointA;
                    const b = liveSwingAnchors.pointB;
                    const w = Math.max(0.0001, b - a);
                    const c = b - w * 0.618;
                    const stop = b - w * 0.786;
                    const tp = c + w * 1.618;
                    const rr = Math.max(1.5, Math.min(5, Number(((tp - c) / Math.max(0.0001, c - stop)).toFixed(1))));
                    onApplySetupToSimulator({
                      entryPrice: Number(c.toFixed(symbol === 'BTCUSDT' ? 2 : 4)),
                      stopLossPrice: Number(stop.toFixed(symbol === 'BTCUSDT' ? 2 : 4)),
                      takeProfitPrice: Number(tp.toFixed(symbol === 'BTCUSDT' ? 2 : 4)),
                      rrRatio: rr,
                    });
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>
                    Send Live {symbol.replace('USDT', '')} Point C & 161.8% Target to Risk Simulator
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * STAGE 02: FIBONACCI SEQUENCE TO MUSICAL NOTES (2, 3, 5, 8, 13 OCTAVE)
       * ===================================================================== */}
      {activeStage === 'music_octave_bridge' && (
        <div className="space-y-5 text-xs">
          {/* 13-Key Octave Fibonacci Geometry Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="lg:col-span-5 space-y-2">
              <div className="font-mono font-bold text-amber-700 dark:text-amber-400">
                1, 1, 2, 3, 5, 8, 13 · WHY AN OCTAVE IS PURE FIBONACCI
              </div>
              <h3 className="font-editorial text-lg font-bold text-slate-900 dark:text-white">
                Every Piano & Harp Octave Encodes Five Consecutive Fibonacci Numbers
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Look at a single musical octave from <strong>C4 to C5</strong>: it contains{' '}
                <strong>13 chromatic notes</strong> total, built from <strong>8 white scale keys</strong> and{' '}
                <strong>5 black pentatonic keys</strong> arranged in clusters of <strong>2</strong> and{' '}
                <strong>3</strong> (<span className="font-mono font-bold">2, 3, 5, 8, 13</span>). Click any key on the keyboard to hear its harmonic relationship to the Point A Tonic!
              </p>
              {lastPlayedLabel && (
                <div className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
                  ♪ Playing: {lastPlayedLabel}
                </div>
              )}
            </div>

            {/* Interactive 8-White + 5-Black = 13-Key SVG Octave */}
            <div className="lg:col-span-7">
              <svg
                viewBox="0 0 560 156"
                className="w-full h-40 select-none"
                role="img"
                aria-label="Interactive 13-Key Fibonacci Musical Octave Keyboard"
              >
                {/* 8 White Keys (C4 to C5) */}
                {[
                  { note: 'C4', fib: '1:1 Point A', hz: 256.87, highlight: '#38BDF8' },
                  { note: 'D4', fib: '23.6% Step', hz: 288.33, highlight: '#E2E8F0' },
                  { note: 'E4', fib: '38.2% (5:4)', hz: 323.63, highlight: '#E2E8F0' },
                  { note: 'F4', fib: '4:3 Fourth', hz: 342.88, highlight: '#E2E8F0' },
                  { note: 'G4', fib: '50% (3:2)', hz: 384.87, highlight: '#BAE6FD' },
                  { note: 'A4', fib: '161.8% (5:3)', hz: 432.0, highlight: '#6EE7B7' },
                  { note: 'B4', fib: 'Leading', hz: 484.9, highlight: '#E2E8F0' },
                  { note: 'C5', fib: '100% (2:1)', hz: 513.74, highlight: '#A7F3D0' },
                ].map((wk, idx) => {
                  const x = 16 + idx * 66;
                  return (
                    <g
                      key={wk.note}
                      className="cursor-pointer"
                      onClick={() =>
                        handleTriggerNodeAudio(
                          `${wk.note} (${Math.round(wk.hz)} Hz) · ${wk.fib}`,
                          256.87,
                          wk.hz,
                          'warm_chord'
                        )
                      }
                    >
                      <rect
                        x={x}
                        y="12"
                        width="62"
                        height="128"
                        rx="6"
                        fill={wk.highlight}
                        stroke="#334155"
                        strokeWidth="1.5"
                      />
                      <text
                        x={x + 31}
                        y="114"
                        textAnchor="middle"
                        fill="#0F172A"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {wk.note}
                      </text>
                      <text
                        x={x + 31}
                        y="130"
                        textAnchor="middle"
                        fill="#334155"
                        fontSize="8.5"
                        fontFamily="monospace"
                      >
                        {wk.fib}
                      </text>
                    </g>
                  );
                })}

                {/* 5 Black Keys (Grouped in 2 + 3 -> Highlighting Ab4 = 8:5 = 61.8% Golden Pocket!) */}
                {[
                  { note: 'C#', x: 62, hz: 272.14, isGolden: false },
                  { note: 'Eb', x: 128, hz: 305.47, isGolden: false },
                  { note: 'F#', x: 260, hz: 363.27, isGolden: false },
                  { note: 'Ab (8:5)', x: 326, hz: 410.99, isGolden: true },
                  { note: 'Bb', x: 392, hz: 457.69, isGolden: false },
                ].map((bk) => (
                  <g
                    key={bk.note}
                    className="cursor-pointer"
                    onClick={() =>
                      handleTriggerNodeAudio(
                        bk.isGolden
                          ? 'Ab4 (8:5 Minor Sixth ≈ 61.8% Golden Pocket Buy)'
                          : `${bk.note} Pentatonic Note`,
                        256.87,
                        bk.hz,
                        'warm_chord'
                      )
                    }
                  >
                    <rect
                      x={bk.x}
                      y="12"
                      width="40"
                      height="78"
                      rx="5"
                      fill={bk.isGolden ? '#D97706' : '#0F172A'}
                      stroke="#1E293B"
                      strokeWidth="1.5"
                    />
                    <text
                      x={bk.x + 20}
                      y="74"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="8.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {bk.note}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Interactive Table: Click Any Ratio Row to Hear Its Musical Interval */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">Fib Level</th>
                  <th className="py-2.5 px-3 font-semibold">Mathematical Origin</th>
                  <th className="py-2.5 px-3 font-semibold">Symphony Musical Interval</th>
                  <th className="py-2.5 px-3 font-semibold">Market Significance & Execution</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Hear Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {HARMONIC_FIB_ROWS.map((row) => {
                  const isGolden =
                    row.category === 'Golden Pocket' || row.category === 'Golden Target';
                  return (
                    <tr
                      key={row.levelLabel}
                      onClick={() =>
                        handleTriggerNodeAudio(
                          `${row.levelLabel} (${row.musicalInterval})`,
                          row.rootHz,
                          row.targetHz,
                          row.tone
                        )
                      }
                      className={`cursor-pointer transition-colors ${
                        isGolden
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/35'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                        {row.levelLabel}{' '}
                        <span className="font-sans font-normal text-slate-500 dark:text-slate-400">
                          · {row.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">
                        {row.mathOrigin}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-sky-700 dark:text-sky-400 whitespace-nowrap">
                        {row.musicalInterval} ({row.notePair})
                      </td>
                      <td className="py-2.5 px-3 leading-relaxed">{row.marketAction}</td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTriggerNodeAudio(
                              `${row.levelLabel} (${row.musicalInterval})`,
                              row.rootHz,
                              row.targetHz,
                              row.tone
                            );
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap"
                        >
                          <Volume2 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Play</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
       * STAGE 03: THE GEOMETRY OF CREATION & COMMERCE (PDF SYNTHESIS: 144 / 233)
       * ===================================================================== */}
      {activeStage === 'creation_commerce_pdf' && (
        <div className="space-y-5 text-xs">
          {/* Top Bar with Direct Link to Uploaded 3-Page Curriculum PDF + 144/233 Phi Chord */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300/80 dark:border-amber-500/40">
            <div className="space-y-0.5 max-w-2xl">
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                Unified Synthesis: Ancient Hebrew Gematria (144 & 233), Natural Growth & Market Psychology
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Notice how the 12th and 13th Fibonacci numbers (<span className="font-mono font-bold">144</span> and <span className="font-mono font-bold">233</span>) generate both the <strong>161.8% Golden Extension</strong> (<span className="font-mono">233 / 144 = 1.618055</span>, 99.998% of Φ) and the <strong>61.8% Golden Pocket</strong> (<span className="font-mono">144 / 233 = 0.618025</span>)—and in acoustic physics, <span className="font-mono">144 Hz × 3 = 432 Hz</span>!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleTriggerNodeAudio(
                    '144 Hz (Kedem F12) + 233 Hz (Etz HaChaim F13) Golden Phi Dyad',
                    144.0,
                    233.08,
                    'warm_chord'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer whitespace-nowrap shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>♪ Hear 144 Hz + 233 Hz Phi Chord</span>
              </button>

              <a
                href={UPLOADED_PDF_PATH}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Open 3-Page PDF Module</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 2-Column Tables from Page 1 of the PDF: Family Algebraic Lineage + Edenic Fibonacci Milestones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                A. Algebraic Lineage of Family Terms (A + B = C)
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                In ancient Hebrew, each of the 22 letters carried an inherent numeric value (Aleph = 1 up to Tav = 400), forming algebraic harmony across foundational words:
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-left border-collapse font-mono tabular-nums text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-sans text-slate-600 dark:text-slate-400">
                      <th className="py-2 px-3 font-semibold">Term</th>
                      <th className="py-2 px-3 font-semibold">Hebrew Letters & Values</th>
                      <th className="py-2 px-3 font-semibold text-right">Sum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr>
                      <td className="py-2 px-3 font-sans font-semibold text-slate-900 dark:text-white">
                        Father (Av)
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                        Aleph (1) + Bet (2)
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-sky-700 dark:text-sky-400">
                        3
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-sans font-semibold text-slate-900 dark:text-white">
                        Mother (Em)
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                        Aleph (1) + Mem (40)
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-sky-700 dark:text-sky-400">
                        41
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/50 dark:bg-emerald-950/20">
                      <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-white">
                        Child (Yeled)
                      </td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-200">
                        Yud (10) + Lamed (30) + Dalet (4) = 3 + 41
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                        44
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                B. Edenic Fibonacci Sequence Milestones (F₁₂ = 144 & F₁₃ = 233)
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Key Genesis terms land directly on consecutive Fibonacci numbers whose ratio converges to Φ (1.618) and 1/Φ (0.618):
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-left border-collapse font-mono tabular-nums text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-sans text-slate-600 dark:text-slate-400">
                      <th className="py-2 px-3 font-semibold">Term & Meaning</th>
                      <th className="py-2 px-3 font-semibold">Computation</th>
                      <th className="py-2 px-3 font-semibold text-right">Fibonacci Node</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr>
                      <td className="py-2 px-3 font-sans font-semibold text-slate-900 dark:text-white">
                        Kedem (Origin / East)
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                        100 + 4 + 40
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-amber-700 dark:text-amber-400">
                        144 (F₁₂)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-sans font-semibold text-slate-900 dark:text-white">
                        Etz HaChaim (Tree of Life)
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                        70 + 90 + 5 + 10 + 10 + 40
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                        233 (F₁₃)
                      </td>
                    </tr>
                    <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                      <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-white">
                        Golden Ratio Synthesis
                      </td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-200">
                        233/144 = 1.61805 · 144/233 = 0.61802
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                        99.998% Φ
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Page 3 Demystified Market Psychology + 4-Step Trainee SOP */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                Why Fibonacci Works in Real Markets (Zero Superstition)
              </div>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
                <li>
                  <strong className="text-slate-900 dark:text-white">
                    1. Institutional Algorithmic Clustering:
                  </strong>{' '}
                  Quant desks and market-making bots program automated limit-buy orders at{' '}
                  <span className="font-mono">38.2%</span>, <span className="font-mono">50.0%</span>, and{' '}
                  <span className="font-mono">61.8%</span>, and program automated profit-taking walls at{' '}
                  <span className="font-mono">127.2%</span> and <span className="font-mono">161.8%</span>.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">
                    2. Collective Self-Fulfilling Liquidity Walls:
                  </strong>{' '}
                  Because millions of traders and algorithms place their limit-sell orders at the exact same{' '}
                  <span className="font-mono">161.8%</span> Golden Target line, real selling supply concentrates there—causing rallies to stall right on schedule.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">
                    3. Harmonic Expansion & Contraction:
                  </strong>{' '}
                  Crowd optimism and profit-taking breathe in measurable impulse waves and corrective pullbacks rather than straight vertical lines.
                </li>
              </ul>
            </div>

            <div className="lg:col-span-6 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 space-y-2.5">
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                4-Step Trainee Execution Protocol (Rules of Engagement)
              </div>
              <ul className="space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>1. Confirm Trend First:</strong> Never draw Fibonacci in sideways chop. Require a clear Wave 1 higher-high (<span className="font-mono">Point A → Point B</span>).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>2. Stack Confluence:</strong> Pair the <span className="font-mono">61.8%</span> Golden Pocket with horizontal support, 20/50 EMA, or high-volume nodes.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>3. Wait for Rejection Candle at Point C:</strong> Confirm buyers stepped in (Hammer wick or Bullish Engulfing) inside <span className="font-mono">61.8%–65.0%</span>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>4. Strict 1:2.5+ Risk/Reward:</strong> Invalidate below <span className="font-mono">78.6%</span> and scale limit sells at <span className="font-mono">127.2%</span> and <span className="font-mono">161.8%</span>.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Clean Sub-Stage Prev / Next Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 text-xs">
        <button
          type="button"
          disabled={currentStageIdx <= 0}
          onClick={() => {
            if (currentStageIdx > 0) {
              setActiveStage(stagesOrder[currentStageIdx - 1].id);
            }
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>
            {currentStageIdx > 0
              ? `Previous: ${stagesOrder[currentStageIdx - 1].label}`
              : 'Stage 01 of 03'}
          </span>
        </button>

        <span className="font-mono text-slate-500 dark:text-slate-400">
          Fibonacci Symphony Lab · Part {currentStageIdx + 1} of {stagesOrder.length}
        </span>

        <button
          type="button"
          onClick={() => {
            const nextIdx = (currentStageIdx + 1) % stagesOrder.length;
            setActiveStage(stagesOrder[nextIdx].id);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold cursor-pointer whitespace-nowrap shrink-0"
        >
          <span>
            {currentStageIdx < stagesOrder.length - 1
              ? `Next: ${stagesOrder[currentStageIdx + 1].label}`
              : 'Back to 01. 3-Point Extensions'}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
