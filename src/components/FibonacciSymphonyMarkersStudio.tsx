import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Music,
  Play,
  Sliders,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { AssetSymbol, Candle } from '../types/market';
import {
  playFibonacciHarmonicInterval,
  playThreeWaveFibonacciSymphony,
} from '../utils/tenSetSymphonyAudio';

export interface FibonacciSymphonyMarkersStudioProps {
  symbol: AssetSymbol;
  onSelectSymbol?: (sym: AssetSymbol) => void;
  candles: Candle[];
  livePrice: number;
  btcLivePrice?: number;
  xrpLivePrice?: number;
  xlmLivePrice?: number;
  onSendMarkerSetupToOrderDesk?: (setup: {
    symbol: AssetSymbol;
    entryPrice: number;
    stopLossPrice: number;
    takeProfitPrice: number;
    rrRatio: number;
    markerLabel: string;
  }) => void;
}

type StudioSubTab = 'musical_markers' | 'expanded_curriculum' | 'live_order_bridge';

interface SymphonyFibMarkerDef {
  id: string;
  code: string;
  markerRole: 'OBSERVE' | 'BUY_FOCAL' | 'SAFETY_STOP' | 'SELL_1' | 'SELL_2' | 'SELL_3';
  ratioLabel: string;
  fibFraction: string;
  title: string;
  eagleAction: string;
  musicalNote: string;
  intervalName: string;
  rootHz: number;
  targetHz: number;
  tone: 'harp' | 'cello' | 'warm_chord';
  staffY: number;
  chartX: number;
  chartY: number;
  colorHex: string;
  allocationNote: string;
  academyRule: string;
}

const SYMPHONY_FIB_MARKERS: SymphonyFibMarkerDef[] = [
  {
    id: 'ret_382',
    code: '38.2%',
    markerRole: 'OBSERVE',
    ratioLabel: '38.2% Retracement',
    fibFraction: '89 / 233 (1 - Φ⁻¹)',
    title: 'Shallow Thermal Breath — Watch & Prepare',
    eagleAction: 'Descending Eagle begins its controlled glide; premature buyers often get shaken out here.',
    musicalNote: '♪ E4 Harp',
    intervalName: '5:4 Major Third (323.6 Hz)',
    rootHz: 256.87,
    targetHz: 323.63,
    tone: 'harp',
    staffY: 74,
    chartX: 250,
    chartY: 112,
    colorHex: '#38bdf8',
    allocationNote: 'Observation Zone (Hold Dry Powder)',
    academyRule:
      'In fast breakouts price may bounce at 38.2%, but Symphony Markets Academy teaches patience—waiting for deeper wholesale value protects your 2% risk budget.',
  },
  {
    id: 'ret_500',
    code: '50.0%',
    markerRole: 'OBSERVE',
    ratioLabel: '50.0% Midpoint',
    fibFraction: '1 / 2 Octave Midpoint',
    title: 'Halfway Equilibrium — Alert Ready',
    eagleAction: 'Descending Eagle locks eyes on its Focal Point just below the 50% equilibrium line.',
    musicalNote: '♫ G4 Harp',
    intervalName: '3:2 Perfect Fifth (384.9 Hz)',
    rootHz: 256.87,
    targetHz: 384.87,
    tone: 'harp',
    staffY: 64,
    chartX: 295,
    chartY: 132,
    colorHex: '#eab308',
    allocationNote: 'Optional 25% Starter Only With Strong Volume',
    academyRule:
      'Just as a 3:2 Perfect Fifth creates balanced musical tension before resolution, the 50% pullback signals buyers and sellers are reaching equilibrium.',
  },
  {
    id: 'buy_618',
    code: '61.8%',
    markerRole: 'BUY_FOCAL',
    ratioLabel: '61.8% Golden Pocket',
    fibFraction: '144 / 233 (Φ⁻¹ = 0.6180)',
    title: 'PRIMARY BUY MARKER — Eagle Focal Point & Nest',
    eagleAction:
      'The Descending Eagle lands precisely on its chosen Focal Point (61.8%–65% Golden Pocket), gathers strength, and catches a fresh rising thermal.',
    musicalNote: '♫ Ab4 Golden Buy Chord',
    intervalName: '8:5 Minor Sixth · 144/233 Dyad (415.3 Hz)',
    rootHz: 256.87,
    targetHz: 415.3,
    tone: 'warm_chord',
    staffY: 56,
    chartX: 350,
    chartY: 154,
    colorHex: '#10b981',
    allocationNote: 'Primary Buy Entry (100% of Planned 2%-Risk Position)',
    academyRule:
      'This is our signature Symphony Buy Marker. Buying at the 61.8% Golden Pocket places your entry right above the 78.6% invalidation floor—unlocking clean 1:2 to 1:3.5 Risk-to-Reward math.',
  },
  {
    id: 'stop_786',
    code: '78.6%',
    markerRole: 'SAFETY_STOP',
    ratioLabel: '78.6% Safety Stop',
    fibFraction: '√0.618 = 0.7861',
    title: 'CALM SAFETY STOP MARKER — Bowed Cello Rest',
    eagleAction:
      'If the thermal dissolves below 78.6%, the wise Eagle steps aside calmly—losing at most 2% ($0.10 on $5) to fly the next clear thermal.',
    musicalNote: '♩ G3 Cello Rest',
    intervalName: 'Warm Bowed Cello Grounding Tone (192.4 Hz)',
    rootHz: 192.43,
    targetHz: 256.87,
    tone: 'cello',
    staffY: 90,
    chartX: 350,
    chartY: 184,
    colorHex: '#f43f5e',
    allocationNote: 'Hard Invalidation Exit (-1.0R Capped Loss)',
    academyRule:
      'In Symphony Markets Academy, a stop-loss is never a buzzer of failure—it is a musical rest (♩) that preserves 98% of your capital when crowd rhythm shifts.',
  },
  {
    id: 'sell_1000',
    code: '100.0%',
    markerRole: 'SELL_1',
    ratioLabel: '100% Extension',
    fibFraction: '1.00 × Wave AB from Point C',
    title: 'SELL MARKER #1 — Measured Wave Symmetry',
    eagleAction:
      'Ascending Eagle clears the prior peak and glides to full 1:1 wave symmetry above Point C.',
    musicalNote: '♫ C5 Octave Harp',
    intervalName: '2:1 Pure Octave Resolution (513.7 Hz)',
    rootHz: 256.87,
    targetHz: 513.74,
    tone: 'harp',
    staffY: 46,
    chartX: 485,
    chartY: 76,
    colorHex: '#38bdf8',
    allocationNote: 'Scale-Out 30% & Move Stop-Loss to Breakeven',
    academyRule:
      'Selling 30% at the 100% Octave Marker pays your wallet first and lets you move your stop-loss to your 61.8% entry—making the remainder a risk-free flight.',
  },
  {
    id: 'sell_1272',
    code: '127.2%',
    markerRole: 'SELL_2',
    ratioLabel: '127.2% √Φ Extension',
    fibFraction: '√1.618 = 1.2720',
    title: 'SELL MARKER #2 — Harmonic Bridge Target',
    eagleAction:
      'Ascending Eagle rides sustained institutional volume above the breakout zone.',
    musicalNote: '♬ E5 Harmonic Bridge',
    intervalName: '√Φ Major Tenth Shimmer (647.3 Hz)',
    rootHz: 323.63,
    targetHz: 647.27,
    tone: 'warm_chord',
    staffY: 36,
    chartX: 575,
    chartY: 54,
    colorHex: '#f59e0b',
    allocationNote: 'Scale-Out 40% Core Profit Harvest',
    academyRule:
      'Derived from the square root of the Golden Ratio (√Φ), 127.2% is where steady trend algorithms take core profits before late retail FOMO arrives.',
  },
  {
    id: 'sell_1618',
    code: '161.8%',
    markerRole: 'SELL_3',
    ratioLabel: '161.8% Φ Golden Target',
    fibFraction: '233 / 144 (Φ = 1.6180)',
    title: 'SELL MARKER #3 — Golden Ratio Symphony Finale',
    eagleAction:
      'Ascending Eagle reaches the apex of the thermal column—harvesting final gains into crowd euphoria before the next Descending Eagle cycle begins.',
    musicalNote: '♬ 432×Φ Finale Triad',
    intervalName: 'Pure Golden Ratio Chord (699.0 Hz + 432 Hz)',
    rootHz: 432.0,
    targetHz: 432.0 * 1.618,
    tone: 'warm_chord',
    staffY: 24,
    chartX: 675,
    chartY: 30,
    colorHex: '#10b981',
    allocationNote: 'Final 30% Golden Target Exit',
    academyRule:
      '161.8% (Φ) is the institutional ceiling where algorithmic profit-taking peaks. Exiting your final 30% here completes the full Buy-to-Sell Symphony.',
  },
];

const FIB_TIME_ZONES = [
  { bar: 1, note: '♩', meaning: 'Impulse spark candle from Swing Origin A' },
  { bar: 2, note: '♪', meaning: 'Initial momentum confirmation follow-through' },
  { bar: 3, note: '♪', meaning: 'First minor pause or micro-test' },
  { bar: 5, note: '♫', meaning: 'Common short-term crest (Wave 1 stall)' },
  { bar: 8, note: '♫', meaning: 'Frequent pullback midpoint rhythm' },
  { bar: 13, note: '♬', meaning: 'High-probability Point C Golden Pocket turn window' },
  { bar: 21, note: '♬', meaning: '100%–127.2% Extension expansion window' },
  { bar: 34, note: '♬', meaning: '161.8% Golden Finale exhaustion / cycle reset window' },
];

export const FibonacciSymphonyMarkersStudio: React.FC<FibonacciSymphonyMarkersStudioProps> = ({
  symbol,
  onSelectSymbol,
  candles,
  livePrice,
  btcLivePrice = 91450,
  xrpLivePrice = 2.42,
  xlmLivePrice = 0.41,
  onSendMarkerSetupToOrderDesk,
}) => {
  const [subTab, setSubTab] = useState<StudioSubTab>('musical_markers');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string>('buy_618');
  const [isPlayingSequence, setIsPlayingSequence] = useState<boolean>(false);
  const playTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  // Tab 02 Interactive Confluence & Scale-Out States
  const [confGoldenPocket, setConfGoldenPocket] = useState<boolean>(true);
  const [confTrendEma, setConfTrendEma] = useState<boolean>(true);
  const [confCandleSignal, setConfCandleSignal] = useState<boolean>(true);
  const [scaleBudgetUsd, setScaleBudgetUsd] = useState<number>(5);
  const [activeTimeZoneIdx, setActiveTimeZoneIdx] = useState<number>(5); // Bar 13 default

  // Tab 03 Selected Target Tier for 1-Click Dispatch
  const [selectedTargetRole, setSelectedTargetRole] = useState<'SELL_1' | 'SELL_2' | 'SELL_3'>(
    'SELL_3'
  );

  const decimals = symbol === 'BTCUSDT' ? 2 : 4;
  const baseCoin = symbol === 'BTCUSDT' ? 'BTC' : symbol === 'XRPUSDT' ? 'XRP' : 'XLM';

  useEffect(() => {
    return () => {
      playTimersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const selectedMarker = useMemo(
    () => SYMPHONY_FIB_MARKERS.find((m) => m.id === selectedMarkerId) ?? SYMPHONY_FIB_MARKERS[2],
    [selectedMarkerId]
  );

  // Derive realistic 3-Point Swing A (Origin), Swing B (Peak), and Point C (61.8% Golden Pocket) from live candles
  const liveMarkerPrices = useMemo(() => {
    const safePrice = livePrice > 0 ? livePrice : symbol === 'BTCUSDT' ? btcLivePrice : xrpLivePrice;
    let swingLowA = safePrice * 0.92;
    let swingHighB = safePrice * 1.04;

    if (candles.length >= 20) {
      const recent = candles.slice(-48);
      const lows = recent.map((c) => c.low);
      const highs = recent.map((c) => c.high);
      const minLow = Math.min(...lows);
      const maxHigh = Math.max(...highs);
      if (maxHigh > minLow * 1.01) {
        swingLowA = minLow;
        swingHighB = maxHigh;
      }
    }

    const waveAB = Math.max(swingHighB - swingLowA, safePrice * 0.02);
    const ret382 = swingHighB - waveAB * 0.382;
    const ret500 = swingHighB - waveAB * 0.5;
    const buy618 = swingHighB - waveAB * 0.618; // Point C Focal Point
    const stop786 = swingHighB - waveAB * 0.786; // Calm Cello Stop

    // Forward 3-Point Extensions projected upward from Point C (buy618)
    const sell1000 = buy618 + waveAB * 1.0;
    const sell1272 = buy618 + waveAB * 1.272;
    const sell1618 = buy618 + waveAB * 1.618;

    return {
      swingLowA,
      swingHighB,
      waveAB,
      byId: {
        ret_382: ret382,
        ret_500: ret500,
        buy_618: buy618,
        stop_786: stop786,
        sell_1000: sell1000,
        sell_1272: sell1272,
        sell_1618: sell1618,
      } as Record<string, number>,
    };
  }, [candles, livePrice, symbol, btcLivePrice, xrpLivePrice]);

  const handleSelectAndPlayMarker = (marker: SymphonyFibMarkerDef) => {
    setSelectedMarkerId(marker.id);
    playFibonacciHarmonicInterval({
      rootHz: marker.rootHz,
      targetHz: marker.targetHz,
      tone: marker.tone,
    });
  };

  const handlePlayFullSymphonyWalkthrough = () => {
    playTimersRef.current.forEach((t) => clearTimeout(t));
    playTimersRef.current = [];
    setIsPlayingSequence(true);

    const orderedIds = ['ret_382', 'ret_500', 'buy_618', 'sell_1000', 'sell_1272', 'sell_1618'];
    playThreeWaveFibonacciSymphony();

    orderedIds.forEach((id, idx) => {
      const timer = setTimeout(() => {
        setSelectedMarkerId(id);
        if (idx === orderedIds.length - 1) {
          setIsPlayingSequence(false);
        }
      }, idx * 520);
      playTimersRef.current.push(timer);
    });
  };

  // Confluence Score Calculation (Tab 02)
  const confluenceCount =
    (confGoldenPocket ? 1 : 0) + (confTrendEma ? 1 : 0) + (confCandleSignal ? 1 : 0);

  // Scale-Out Calculation (Tab 02)
  const scaleOutStats = useMemo(() => {
    const entry = liveMarkerPrices.byId.buy_618;
    const stop = liveMarkerPrices.byId.stop_786;
    const riskUsd = scaleBudgetUsd * 0.02; // 2% Academy Risk Rule
    const perUnitRisk = Math.max(entry - stop, 1e-6);
    const rawUnits = riskUsd / perUnitRisk;
    // Spot 1x cap so position never exceeds wallet budget
    const maxSpotUnits = scaleBudgetUsd / Math.max(entry, 1e-6);
    const totalUnits = Math.min(rawUnits, maxSpotUnits);

    const unitsT1 = totalUnits * 0.3;
    const unitsT2 = totalUnits * 0.4;
    const unitsT3 = totalUnits * 0.3;

    const gainT1 = unitsT1 * (liveMarkerPrices.byId.sell_1000 - entry);
    const gainT2 = unitsT2 * (liveMarkerPrices.byId.sell_1272 - entry);
    const gainT3 = unitsT3 * (liveMarkerPrices.byId.sell_1618 - entry);
    const totalGain = gainT1 + gainT2 + gainT3;
    const actualRisk = totalUnits * perUnitRisk;
    const blendedRr = actualRisk > 0 ? totalGain / actualRisk : 2.5;

    return {
      totalUnits,
      actualRisk,
      gainT1,
      gainT2,
      gainT3,
      totalGain,
      blendedRr,
    };
  }, [liveMarkerPrices, scaleBudgetUsd]);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 space-y-6">
      {/* Header & Dedicated Space Sub-Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400">
            <Music className="w-4 h-4 shrink-0" />
            <span>Symphony Markets Academy · Dedicated Fibonacci & Musical Markers Studio</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">144 / 233 = 0.6180 · Φ = 1.6180</span>
          </div>
          <h2
            className="font-editorial text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight"
            style={{ textWrap: 'balance' }}
          >
            Fibonacci Ratios Connected to Musical Buy, Stop & Sell Markers
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-[74ch] leading-relaxed">
            Every Fibonacci pullback and extension corresponds to an exact acoustic interval. Here in its own dedicated studio, explore how the <strong>Descending Eagle</strong> glides to the <strong>61.8% Golden Pocket Buy Marker (♫ Ab4)</strong> and how the <strong>Ascending Eagle</strong> harvests profits across our three <strong>Musical Sell Markers (100%, 127.2%, 161.8%)</strong>.
          </p>
        </div>

        {/* Coin Switcher */}
        {onSelectSymbol && (
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs self-start lg:self-auto">
            {(
              [
                { sym: 'BTCUSDT' as AssetSymbol, label: 'BTC' },
                { sym: 'XRPUSDT' as AssetSymbol, label: 'XRP' },
                { sym: 'XLMUSDT' as AssetSymbol, label: 'XLM' },
              ] as const
            ).map((item) => (
              <button
                key={item.sym}
                type="button"
                onClick={() => onSelectSymbol(item.sym)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  symbol === item.sym
                    ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3-Tab Dedicated Studio Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setSubTab('musical_markers')}
            className={`px-3.5 py-2 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'musical_markers'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            01. ♬ Interactive Buy & Sell Musical Score
          </button>
          <button
            type="button"
            onClick={() => setSubTab('expanded_curriculum')}
            className={`px-3.5 py-2 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'expanded_curriculum'
                ? 'bg-sky-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            02. Time Zones, Confluence & Scale-Out Math
          </button>
          <button
            type="button"
            onClick={() => setSubTab('live_order_bridge')}
            className={`px-3.5 py-2 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'live_order_bridge'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            03. Live {baseCoin} Markers → Embedded XRPL DEX
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePlayFullSymphonyWalkthrough}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isPlayingSequence ? 'Playing Buy → Sell Symphony...' : 'Play Full Buy → Sell Symphony'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectAndPlayMarker(SYMPHONY_FIB_MARKERS[3])}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 shrink-0" />
            <span>♩ Hear 78.6% Cello Stop</span>
          </button>
        </div>
      </div>

      {/* ========================================================================
       * TAB 01: INTERACTIVE EAGLE FLIGHT & MUSICAL BUY / STOP / SELL SCORE
       * ======================================================================== */}
      {subTab === 'musical_markers' && (
        <div className="space-y-5">
          {/* Dual Price-Wave + Musical Staff Concert Score SVG */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-white">
                  Interactive Fibonacci Symphony Score ({baseCoin} Live Scale)
                </span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span className="text-emerald-400">
                  Click any Buy, Stop, or Sell Marker node to hear its exact harmonic interval
                </span>
              </div>
              <span className="font-mono text-amber-300 tabular-nums">
                Active: {selectedMarker.code} · {selectedMarker.musicalNote}
              </span>
            </div>

            <svg
              viewBox="0 0 760 295"
              className="w-full h-auto select-none"
              role="img"
              aria-label="Fibonacci Eagle Flight path mapped onto Musical Buy, Stop-Loss, and Sell Markers"
            >
              {/* Top Price Wave Zone Labels */}
              <text x="20" y="20" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                PRICE WAVE · DESCENDING EAGLE FOCAL POINT → ASCENDING EAGLE HARVEST
              </text>

              {/* Horizontal Fibonacci Guide Lines */}
              {SYMPHONY_FIB_MARKERS.map((m) => {
                const isSel = m.id === selectedMarker.id;
                return (
                  <g key={`line-${m.id}`}>
                    <line
                      x1="50"
                      y1={m.chartY}
                      x2="710"
                      y2={m.chartY}
                      stroke={m.colorHex}
                      strokeOpacity={isSel ? 0.65 : 0.22}
                      strokeWidth={isSel ? 1.5 : 1}
                      strokeDasharray={m.markerRole === 'SAFETY_STOP' ? '4 4' : '2 4'}
                    />
                    <text
                      x="716"
                      y={m.chartY + 3}
                      fill={m.colorHex}
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight={isSel ? 'bold' : 'normal'}
                    >
                      {m.code}
                    </text>
                  </g>
                );
              })}

              {/* 3-Point Eagle Wave Path: Origin A -> Peak B -> Descending Eagle Focal Point C (61.8% Buy) -> Ascending Eagle Extensions */}
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                points="65,192 185,84"
              />
              {/* Descending Eagle Glide (B -> C 61.8% Buy Focal Point) */}
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeDasharray="6 3"
                points="185,84 250,112 295,132 350,154"
              />
              {/* Ascending Eagle Thermal Flight (C -> 100% -> 127.2% -> 161.8%) */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                points="350,154 485,76 575,54 675,30"
              />

              {/* Origin A & Peak B Reference Anchors */}
              <circle cx="65" cy="192" r="4.5" fill="#94a3b8" />
              <text x="48" y="206" fill="#cbd5e1" fontSize="9.5" fontFamily="monospace">
                Origin A (${liveMarkerPrices.swingLowA.toFixed(decimals)})
              </text>
              <circle cx="185" cy="84" r="4.5" fill="#38bdf8" />
              <text x="140" y="74" fill="#38bdf8" fontSize="9.5" fontFamily="monospace">
                Peak B (${liveMarkerPrices.swingHighB.toFixed(decimals)})
              </text>

              {/* Clickable Price Wave Marker Nodes */}
              {SYMPHONY_FIB_MARKERS.map((m) => {
                const isSel = m.id === selectedMarker.id;
                const priceVal = liveMarkerPrices.byId[m.id] ?? livePrice;
                return (
                  <g
                    key={`node-${m.id}`}
                    onClick={() => handleSelectAndPlayMarker(m)}
                    className="cursor-pointer"
                  >
                    {isSel && (
                      <circle
                        cx={m.chartX}
                        cy={m.chartY}
                        r="12"
                        fill={m.colorHex}
                        fillOpacity="0.22"
                      />
                    )}
                    <circle
                      cx={m.chartX}
                      cy={m.chartY}
                      r={isSel ? 7 : 5.5}
                      fill={m.colorHex}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                    <text
                      x={m.chartX}
                      y={m.markerRole === 'SAFETY_STOP' ? m.chartY + 15 : m.chartY - 10}
                      textAnchor="middle"
                      fill={isSel ? '#ffffff' : m.colorHex}
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {m.musicalNote.split(' ')[0]} ${priceVal.toFixed(decimals)}
                    </text>
                  </g>
                );
              })}

              {/* Lower Musical 5-Line Concert Staff */}
              <text x="20" y="222" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                SYMPHONY CONCERT STAFF (432 Hz / 528 Hz HARMONIC INTERVALS)
              </text>
              {[232, 244, 256, 268, 280].map((ly) => (
                <line
                  key={`staff-${ly}`}
                  x1="50"
                  y1={ly}
                  x2="710"
                  y2={ly}
                  stroke="#334155"
                  strokeWidth="1"
                />
              ))}

              {/* Musical Notes Positioned Directly Below Each Fibonacci Marker */}
              {SYMPHONY_FIB_MARKERS.map((m) => {
                const isSel = m.id === selectedMarker.id;
                const noteY = 205 + m.staffY * 0.82;
                return (
                  <g
                    key={`staff-note-${m.id}`}
                    onClick={() => handleSelectAndPlayMarker(m)}
                    className="cursor-pointer"
                  >
                    <line
                      x1={m.chartX}
                      y1={m.chartY + 8}
                      x2={m.chartX}
                      y2={noteY - 8}
                      stroke={m.colorHex}
                      strokeOpacity={isSel ? 0.55 : 0.18}
                      strokeDasharray="2 3"
                    />
                    <ellipse
                      cx={m.chartX}
                      cy={noteY}
                      rx={isSel ? 7.5 : 6}
                      ry={isSel ? 5.5 : 4.5}
                      fill={m.colorHex}
                    />
                    <line
                      x1={m.chartX + 5.5}
                      y1={noteY}
                      x2={m.chartX + 5.5}
                      y2={noteY - 20}
                      stroke={m.colorHex}
                      strokeWidth="1.8"
                    />
                    <text
                      x={m.chartX}
                      y="292"
                      textAnchor="middle"
                      fill={isSel ? '#ffffff' : '#94a3b8'}
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {m.musicalNote.replace(/^[^\s]+\s/, '')}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Interactive Marker Selector Strip + Selected Marker Deep Dive */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-5 space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Any Fibonacci Musical Marker (Click to Audition Sound):
              </div>
              <div className="space-y-1.5">
                {SYMPHONY_FIB_MARKERS.map((m) => {
                  const isSel = m.id === selectedMarker.id;
                  const roleTag =
                    m.markerRole === 'BUY_FOCAL'
                      ? 'BUY FOCAL POINT'
                      : m.markerRole === 'SAFETY_STOP'
                      ? 'CELLO STOP'
                      : m.markerRole.startsWith('SELL')
                      ? `SELL #${m.markerRole.slice(-1)}`
                      : 'WATCH';
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectAndPlayMarker(m)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg border transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                        isSel
                          ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                          <span className="font-mono tabular-nums">{m.code}</span>
                          <span>·</span>
                          <span className="truncate">{m.musicalNote}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {m.intervalName}
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0">
                        {roleTag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Detail Card for Selected Marker */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950 p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
                <div className="space-y-1">
                  <div className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    {selectedMarker.ratioLabel} · {selectedMarker.fibFraction}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedMarker.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectAndPlayMarker(selectedMarker)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Play {selectedMarker.musicalNote}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono tabular-nums">
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                    Live {baseCoin} Marker Price
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    ${(liveMarkerPrices.byId[selectedMarker.id] ?? livePrice).toFixed(decimals)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                    Acoustic Frequency
                  </div>
                  <div className="text-sm font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                    {selectedMarker.rootHz.toFixed(1)} → {selectedMarker.targetHz.toFixed(1)} Hz
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                    Order Desk Action
                  </div>
                  <div className="font-sans text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {selectedMarker.allocationNote}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  <strong className="text-slate-900 dark:text-white">
                    Eagle Flight Perspective:
                  </strong>{' '}
                  {selectedMarker.eagleAction}
                </p>
                <p>
                  <strong className="text-slate-900 dark:text-white">
                    Symphony Academy Stewardship Rule:
                  </strong>{' '}
                  {selectedMarker.academyRule}
                </p>
              </div>

              {onSendMarkerSetupToOrderDesk && (
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Ready to stage the 61.8% Focal Buy & 161.8% Golden Sell in Section 06?
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onSendMarkerSetupToOrderDesk({
                        symbol,
                        entryPrice: Number(liveMarkerPrices.byId.buy_618.toFixed(decimals)),
                        stopLossPrice: Number(liveMarkerPrices.byId.stop_786.toFixed(decimals)),
                        takeProfitPrice: Number(liveMarkerPrices.byId.sell_1618.toFixed(decimals)),
                        rrRatio: 3,
                        markerLabel: '61.8% Golden Pocket Buy → 161.8% Golden Finale Sell',
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Send to Embedded XRPL DEX & Risk Desk</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
       * TAB 02: EXPANDED FIBONACCI MASTERY (TIME ZONES, CONFLUENCE & SCALE-OUT)
       * ======================================================================== */}
      {subTab === 'expanded_curriculum' && (
        <div className="space-y-6">
          {/* Module A: Fibonacci Time Zones (Musical Tempo & Measures) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 p-5 space-y-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4 shrink-0" />
                <span>Part I · Fibonacci Time Zones (Musical Tempo & Rhythm Along the X-Axis)</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Why Price Is Pitch (Y-Axis) and Fibonacci Time Zones Are Rhythm (X-Axis)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-[74ch]">
                In a symphony, playing the right note at the wrong beat breaks harmony. While Fibonacci Retracements and Extensions measure vertical <strong>price</strong>, <strong>Fibonacci Time Zones</strong> count forward <code className="font-mono">1, 2, 3, 5, 8, 13, 21, 34</code> candles from Swing Origin A to spot <em>when</em> crowd exhaustion or fresh thermals cluster.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {FIB_TIME_ZONES.map((tz, idx) => {
                const isAct = idx === activeTimeZoneIdx;
                return (
                  <button
                    key={tz.bar}
                    type="button"
                    onClick={() => {
                      setActiveTimeZoneIdx(idx);
                      playFibonacciHarmonicInterval({
                        rootHz: 256.87,
                        targetHz: 256.87 * (1 + idx * 0.125),
                        tone: 'harp',
                      });
                    }}
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                      isAct
                        ? 'border-sky-500 bg-sky-500/10 dark:bg-sky-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-mono text-amber-600 dark:text-amber-400">
                      {tz.note} Beat
                    </div>
                    <div className="text-base font-mono font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                      Bar {tz.bar}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
                  Fibonacci Bar {FIB_TIME_ZONES[activeTimeZoneIdx].bar} ({FIB_TIME_ZONES[activeTimeZoneIdx].note}):
                </span>{' '}
                <span className="text-slate-700 dark:text-slate-200">
                  {FIB_TIME_ZONES[activeTimeZoneIdx].meaning}
                </span>
              </div>
              <span className="font-mono text-slate-500 dark:text-slate-400">
                When Bar 13 or 21 aligns with the 61.8% Golden Pocket = Time + Price Harmony
              </span>
            </div>
          </div>

          {/* Module B & C Side-by-Side: 3-Layer Confluence Simulator & 3-Tier Scale-Out Math */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 3-Layer Golden Pocket Confluence Checklist */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Part II · 3-Chord Golden Pocket Confluence Filter</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Never Trade a Single Note Alone — Wait for a 3-Note Chord
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Toggle the three conditions below to see how Symphony Markets Academy grades a Descending Eagle Focal Point before placing a Buy order:
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confGoldenPocket}
                    onChange={(e) => setConfGoldenPocket(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      Note 1: Price Reaches 61.8%–65.0% Golden Pocket (${liveMarkerPrices.byId.buy_618.toFixed(decimals)})
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      144/233 wholesale retracement discount rather than chasing green highs.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confTrendEma}
                    onChange={(e) => setConfTrendEma(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      Note 2: Structural Support / Rising 50 EMA Overlaps the Zone
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      Prior resistance-turned-support reinforces the Eagle’s landing ledge.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confCandleSignal}
                    onChange={(e) => setConfCandleSignal(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      Note 3: Bullish Hammer or Engulfing Confirmation Candle Prints
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      Proves sellers exhausted their downward push and buyers stepped in.
                    </div>
                  </div>
                </label>
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Harmony Grade:{' '}
                    <span
                      className={
                        confluenceCount === 3
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : confluenceCount === 2
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }
                    >
                      {confluenceCount === 3
                        ? 'A+ Full 3-Note Symphony Chord (Stage Limit Buy)'
                        : confluenceCount === 2
                        ? 'B-Grade Partial Harmony (Wait for Candle Confirmation)'
                        : 'Single Note Only — Stand Aside & Protect Capital'}
                    </span>
                  </div>
                </div>
                <CheckCircle2
                  className={`w-5 h-5 shrink-0 ${
                    confluenceCount === 3 ? 'text-emerald-500' : 'text-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* 3-Tier Harmonic Scale-Out Calculator */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 shrink-0" />
                    <span>Part III · 3-Marker Harmonic Scale-Out (30% / 40% / 30%)</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Harvesting Profits Across All 3 Musical Sell Markers
                  </h3>
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                  {[5, 100, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setScaleBudgetUsd(amt)}
                      className={`px-2 py-1 rounded font-mono font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                        scaleBudgetUsd === amt
                          ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Instead of guessing one single top, institutional traders divide exits across the three Fibonacci Extension Sell Markers:
              </p>

              <div className="space-y-2 text-xs font-mono tabular-nums">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-sans font-semibold text-sky-700 dark:text-sky-400">
                      ♫ Sell #1 (30% @ 100% Ext):
                    </span>{' '}
                    <span>${liveMarkerPrices.byId.sell_1000.toFixed(decimals)}</span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    +${scaleOutStats.gainT1.toFixed(2)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-sans font-semibold text-amber-700 dark:text-amber-400">
                      ♬ Sell #2 (40% @ 127.2% √Φ):
                    </span>{' '}
                    <span>${liveMarkerPrices.byId.sell_1272.toFixed(decimals)}</span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    +${scaleOutStats.gainT2.toFixed(2)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-sans font-semibold text-emerald-700 dark:text-emerald-400">
                      ♬ Sell #3 (30% @ 161.8% Φ):
                    </span>{' '}
                    <span>${liveMarkerPrices.byId.sell_1618.toFixed(decimals)}</span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    +${scaleOutStats.gainT3.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums">
                <span className="text-rose-600 dark:text-rose-400">
                  ♩ Max 78.6% Cello Risk: -${scaleOutStats.actualRisk.toFixed(2)}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  Total Blended Harvest: +${scaleOutStats.totalGain.toFixed(2)} (1:
                  {scaleOutStats.blendedRr.toFixed(1)} R:R)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
       * TAB 03: LIVE COIN MARKER TABLE & 1-CLICK SEND TO EMBEDDED XRPL DEX
       * ======================================================================== */}
      {subTab === 'live_order_bridge' && (
        <div className="space-y-5">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4 font-semibold">Fibonacci Ratio</th>
                  <th className="py-3 px-4 font-semibold">Symphony Musical Marker</th>
                  <th className="py-3 px-4 font-semibold">Eagle Flight Role</th>
                  <th className="py-3 px-4 font-semibold text-right">Live {baseCoin} Price</th>
                  <th className="py-3 px-4 font-semibold text-right">Audition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono tabular-nums">
                {SYMPHONY_FIB_MARKERS.map((m) => {
                  const p = liveMarkerPrices.byId[m.id] ?? livePrice;
                  return (
                    <tr
                      key={`row-${m.id}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {m.ratioLabel}
                      </td>
                      <td className="py-3 px-4 font-sans font-medium text-slate-800 dark:text-slate-200">
                        {m.musicalNote}{' '}
                        <span className="text-slate-500 dark:text-slate-400">
                          ({m.intervalName})
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-300">
                        {m.allocationNote}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        ${p.toFixed(decimals)}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => handleSelectAndPlayMarker(m)}
                          className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Play Note
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 1-Click Bridge Card into Section 06 Embedded XRPL DEX & Risk Desk */}
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/[0.05] dark:bg-slate-950 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Direct Bridge to Section 06 · Embedded XRPL DEX & Position Calculator
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                Choose which Musical Sell Marker you want as your Take-Profit target, then load your{' '}
                <strong>61.8% Focal Point Buy (${liveMarkerPrices.byId.buy_618.toFixed(decimals)})</strong> and{' '}
                <strong>78.6% Cello Stop (${liveMarkerPrices.byId.stop_786.toFixed(decimals)})</strong> directly into our embedded order desk:
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                {(
                  [
                    { role: 'SELL_1' as const, label: '100% Octave', rr: 1.5 },
                    { role: 'SELL_2' as const, label: '127.2% √Φ', rr: 2 },
                    { role: 'SELL_3' as const, label: '161.8% Φ', rr: 3 },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => setSelectedTargetRole(opt.role)}
                    className={`px-2.5 py-1.5 rounded font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedTargetRole === opt.role
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {onSendMarkerSetupToOrderDesk && (
                <button
                  type="button"
                  onClick={() => {
                    const tpPrice =
                      selectedTargetRole === 'SELL_1'
                        ? liveMarkerPrices.byId.sell_1000
                        : selectedTargetRole === 'SELL_2'
                        ? liveMarkerPrices.byId.sell_1272
                        : liveMarkerPrices.byId.sell_1618;
                    const rrVal =
                      selectedTargetRole === 'SELL_1'
                        ? 1.5
                        : selectedTargetRole === 'SELL_2'
                        ? 2
                        : 3;
                    onSendMarkerSetupToOrderDesk({
                      symbol,
                      entryPrice: Number(liveMarkerPrices.byId.buy_618.toFixed(decimals)),
                      stopLossPrice: Number(liveMarkerPrices.byId.stop_786.toFixed(decimals)),
                      takeProfitPrice: Number(tpPrice.toFixed(decimals)),
                      rrRatio: rrVal,
                      markerLabel: `61.8% Eagle Focal Buy → ${
                        selectedTargetRole === 'SELL_1'
                          ? '100% Octave'
                          : selectedTargetRole === 'SELL_2'
                          ? '127.2% √Φ'
                          : '161.8% Golden'
                      } Sell`,
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Load Into Embedded XRPL DEX Calculator</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
