import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Clock,
  Compass,
  Globe2,
  Layers,
  Scale,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import forexSessionsImg from '../assets/images/forex_sessions_globe_1795099710509.jpg';
import forexPairBalanceImg from '../assets/images/forex_pair_balance_1795099710513.jpg';
import forexFibWavesImg from '../assets/images/forex_fibonacci_waves_1795099710135.jpg';

interface ForexEducationModuleProps {
  onOpenCryptoFoundations?: () => void;
  onOpenFibonacciStudio?: () => void;
}

type ForexLessonTab = 'pairs' | 'sessions' | 'charts' | 'safety';
type ExamplePairId = 'EURUSD' | 'GBPUSD' | 'USDJPY' | 'XAUUSD';
type ExampleChartId = 'eurusd_fib' | 'gbpusd_london' | 'usdjpy_channel';

interface PairGuideMeta {
  id: ExamplePairId;
  label: string;
  nickname: string;
  base: string;
  quote: string;
  samplePrice: string;
  pipStep: number;
  pipDecimals: number;
  pipHighlightIndex: number;
  avgDailyPips: string;
  plainEnglish: string;
  bestSession: string;
}

const PAIR_GUIDES: PairGuideMeta[] = [
  {
    id: 'EURUSD',
    label: 'EUR / USD',
    nickname: 'The Fiber (Most Liquid Pair)',
    base: 'Euro (EUR)',
    quote: 'US Dollar (USD)',
    samplePrice: '1.0845',
    pipStep: 0.0001,
    pipDecimals: 4,
    pipHighlightIndex: 5,
    avgDailyPips: '60 – 85 pips/day',
    plainEnglish:
      '1 Euro currently costs $1.0845 US Dollars. When the chart rises, the Euro is strengthening relative to the US Dollar.',
    bestSession: 'London + New York Overlap (8:00 AM – 12:00 PM EST)',
  },
  {
    id: 'GBPUSD',
    label: 'GBP / USD',
    nickname: 'The Cable (Higher Rhythm)',
    base: 'British Pound (GBP)',
    quote: 'US Dollar (USD)',
    samplePrice: '1.2680',
    pipStep: 0.0001,
    pipDecimals: 4,
    pipHighlightIndex: 5,
    avgDailyPips: '80 – 115 pips/day',
    plainEnglish:
      '1 British Pound costs $1.2680 US Dollars. Moves with crisp swings during the London morning open.',
    bestSession: 'London Open (3:00 AM – 6:00 AM EST) & NY Overlap',
  },
  {
    id: 'USDJPY',
    label: 'USD / JPY',
    nickname: 'The Yen Pair (2-Decimal Pip)',
    base: 'US Dollar (USD)',
    quote: 'Japanese Yen (JPY)',
    samplePrice: '151.40',
    pipStep: 0.01,
    pipDecimals: 2,
    pipHighlightIndex: 5,
    avgDailyPips: '75 – 110 pips/day',
    plainEnglish:
      '1 US Dollar buys 151.40 Japanese Yen. Notice Yen pairs count pips at the 2nd decimal place (0.01) instead of the 4th.',
    bestSession: 'Tokyo Session & New York Bond Yield Hours',
  },
  {
    id: 'XAUUSD',
    label: 'XAU / USD',
    nickname: 'Spot Gold vs. US Dollar',
    base: '1 Troy Ounce Gold (XAU)',
    quote: 'US Dollar (USD)',
    samplePrice: '2650.40',
    pipStep: 0.1,
    pipDecimals: 2,
    pipHighlightIndex: 5,
    avgDailyPips: '180 – 300 points/day',
    plainEnglish:
      'Measures 1 troy ounce of physical gold in US Dollars. Respects clean Fibonacci pullbacks, but requires smaller lot sizes due to wider swings.',
    bestSession: 'London Fix & New York Morning (8:00 AM – 11:30 AM EST)',
  },
];

interface ExampleCandle {
  o: number;
  h: number;
  l: number;
  c: number;
  label?: string;
}

interface AnnotatedForexChartSpec {
  id: ExampleChartId;
  pair: string;
  timeframe: string;
  title: string;
  seasonTag: string;
  summary: string;
  entryPrice: number;
  stopPrice: number;
  targetPrice: number;
  fib382: number;
  fib500: number;
  fib618: number;
  riskPips: number;
  rewardPips: number;
  rrText: string;
  decimals: number;
  candles: ExampleCandle[];
  callouts: Array<{
    candleIdx: number;
    anchor: 'high' | 'low';
    title: string;
    detail: string;
  }>;
  takeaways: string[];
}

const ANNOTATED_FOREX_CHARTS: AnnotatedForexChartSpec[] = [
  {
    id: 'eurusd_fib',
    pair: 'EUR / USD',
    timeframe: '4-Hour Chart',
    title: 'Example 1 · Ascending Eagle 61.8% Golden Pocket Pullback',
    seasonTag: 'Ascending Season · 1:2.2 Risk-to-Reward',
    summary:
      'Price makes a clean impulse wave from Swing A (1.0780) to Swing B (1.0880), gently retraces 61.8% to 1.0818, prints a bullish rejection wick, and resumes to the 127.2% extension.',
    entryPrice: 1.0822,
    stopPrice: 1.0797,
    targetPrice: 1.0877,
    fib382: 1.0842,
    fib500: 1.0830,
    fib618: 1.0818,
    riskPips: 25,
    rewardPips: 55,
    rrText: '1 : 2.2',
    decimals: 4,
    candles: [
      { o: 1.0792, h: 1.0798, l: 1.0780, c: 1.0795 },
      { o: 1.0795, h: 1.0816, l: 1.0793, c: 1.0814 },
      { o: 1.0814, h: 1.0842, l: 1.0812, c: 1.0839 },
      { o: 1.0839, h: 1.0864, l: 1.0835, c: 1.0860 },
      { o: 1.0860, h: 1.0880, l: 1.0856, c: 1.0876 },
      { o: 1.0876, h: 1.0878, l: 1.0858, c: 1.0861 },
      { o: 1.0861, h: 1.0863, l: 1.0842, c: 1.0846 },
      { o: 1.0846, h: 1.0849, l: 1.0829, c: 1.0833 },
      { o: 1.0833, h: 1.0836, l: 1.0815, c: 1.0824 },
      { o: 1.0824, h: 1.0845, l: 1.0821, c: 1.0842 },
      { o: 1.0842, h: 1.0862, l: 1.0839, c: 1.0858 },
      { o: 1.0858, h: 1.0882, l: 1.0855, c: 1.0879 },
    ],
    callouts: [
      { candleIdx: 0, anchor: 'low', title: 'Point A Low', detail: '1.0780 Base' },
      { candleIdx: 4, anchor: 'high', title: 'Point B High', detail: '1.0880 Impulse' },
      { candleIdx: 8, anchor: 'low', title: '61.8% Pin Bar', detail: 'Calm Buy Zone' },
      { candleIdx: 11, anchor: 'high', title: 'Target Filled', detail: '+55 Pips (1:2.2)' },
    ],
    takeaways: [
      'Never chase the green candle at Point B (1.0880); let price exhale back into the 50%–61.8% Fibonacci shelf.',
      'Place the protective stop below the 78.6% level (25 pips risk) so normal noise cannot shake you out.',
      'Exact same visual blueprint you practice in Module 2 Fibonacci Studio — just measured in pips instead of cents.',
    ],
  },
  {
    id: 'gbpusd_london',
    pair: 'GBP / USD',
    timeframe: '1-Hour Chart',
    title: 'Example 2 · London Open Liquidity Sweep & Continuation',
    seasonTag: 'Session Rhythm · 1:2.0 Risk-to-Reward',
    summary:
      'During the quiet Tokyo hours GBP/USD drifts sideways. At the 3:00 AM EST London Open, a brief wick sweeps below the Asian range floor, snaps back above support, and climbs smoothly into New York.',
    entryPrice: 1.2640,
    stopPrice: 1.2610,
    targetPrice: 1.2700,
    fib382: 1.2662,
    fib500: 1.2650,
    fib618: 1.2636,
    riskPips: 30,
    rewardPips: 60,
    rrText: '1 : 2.0',
    decimals: 4,
    candles: [
      { o: 1.2642, h: 1.2652, l: 1.2634, c: 1.2646 },
      { o: 1.2646, h: 1.2654, l: 1.2636, c: 1.2640 },
      { o: 1.2640, h: 1.2649, l: 1.2633, c: 1.2644 },
      { o: 1.2644, h: 1.2650, l: 1.2635, c: 1.2638 },
      { o: 1.2638, h: 1.2644, l: 1.2616, c: 1.2641 },
      { o: 1.2641, h: 1.2663, l: 1.2638, c: 1.2660 },
      { o: 1.2660, h: 1.2674, l: 1.2652, c: 1.2671 },
      { o: 1.2671, h: 1.2676, l: 1.2655, c: 1.2662 },
      { o: 1.2662, h: 1.2686, l: 1.2660, c: 1.2684 },
      { o: 1.2684, h: 1.2698, l: 1.2679, c: 1.2694 },
      { o: 1.2694, h: 1.2708, l: 1.2688, c: 1.2703 },
      { o: 1.2703, h: 1.2712, l: 1.2695, c: 1.2706 },
    ],
    callouts: [
      { candleIdx: 1, anchor: 'high', title: 'Tokyo Range', detail: 'Quiet Coiling' },
      { candleIdx: 4, anchor: 'low', title: 'London Sweep', detail: 'Wick Below Floor' },
      { candleIdx: 5, anchor: 'high', title: 'Engulfing Close', detail: '1.2640–60 Confirm' },
      { candleIdx: 10, anchor: 'high', title: 'NY Target', detail: '+60 Pips (1:2.0)' },
    ],
    takeaways: [
      'Notice how patient traders wait for the candle to CLOSE back inside the range after a stop-sweep wick.',
      'Entering at the London/NY transition avoids the slow, choppy midday drift of the Tokyo range.',
      'Risk is capped strictly at 30 pips below the sweep low while targeting 60 pips at prior structural highs.',
    ],
  },
  {
    id: 'usdjpy_channel',
    pair: 'USD / JPY',
    timeframe: 'Daily Chart',
    title: 'Example 3 · Descending Season Patience (Why You Wait for Support)',
    seasonTag: 'Descending Season · Discipline Lesson',
    summary:
      'In a Descending Eagle season, lower highs reject the 50% retracement shelf repeatedly. Instead of trying to catch a falling knife early, students wait until a true double-bottom & higher-low form.',
    entryPrice: 149.80,
    stopPrice: 149.10,
    targetPrice: 151.40,
    fib382: 151.15,
    fib500: 150.65,
    fib618: 150.15,
    riskPips: 70,
    rewardPips: 160,
    rrText: '1 : 2.3',
    decimals: 2,
    candles: [
      { o: 152.30, h: 152.50, l: 151.60, c: 151.75 },
      { o: 151.75, h: 151.90, l: 150.95, c: 151.10 },
      { o: 151.10, h: 151.45, l: 150.80, c: 151.35 },
      { o: 151.35, h: 151.40, l: 150.30, c: 150.45 },
      { o: 150.45, h: 150.65, l: 149.70, c: 149.85 },
      { o: 149.85, h: 150.25, l: 149.25, c: 149.55 },
      { o: 149.55, h: 150.05, l: 149.40, c: 149.90 },
      { o: 149.90, h: 150.15, l: 149.30, c: 149.85 },
      { o: 149.85, h: 150.55, l: 149.75, c: 150.48 },
      { o: 150.48, h: 150.95, l: 150.25, c: 150.85 },
      { o: 150.85, h: 151.35, l: 150.65, c: 151.25 },
      { o: 151.25, h: 151.60, l: 151.05, c: 151.48 },
    ],
    callouts: [
      { candleIdx: 0, anchor: 'high', title: 'Lower Highs', detail: 'Do Not Chase Down' },
      { candleIdx: 5, anchor: 'low', title: '1st Floor Test', detail: '149.25 Support' },
      { candleIdx: 7, anchor: 'low', title: 'Higher Low', detail: 'Calm Reversal Base' },
      { candleIdx: 11, anchor: 'high', title: 'Relief Rally', detail: '+160 Pips Target' },
    ],
    takeaways: [
      'A Descending season punishes impatient buyers who buy the very first red candle.',
      'Waiting for the second test (Higher Low) gives you a clean 70-pip floor with 160 pips of open sky above.',
      'Always note Yen pairs use 2 decimal places (149.80 → 151.40 = 160 pips).',
    ],
  },
];

export const ForexEducationModule: React.FC<ForexEducationModuleProps> = ({
  onOpenCryptoFoundations,
  onOpenFibonacciStudio,
}) => {
  const [activeTab, setActiveTab] = useState<ForexLessonTab>('pairs');

  // Tab 1: Pair & Pip Explorer
  const [selectedPairId, setSelectedPairId] = useState<ExamplePairId>('EURUSD');
  const [simulatedPipMove, setSimulatedPipMove] = useState<number>(15);

  // Tab 2: 24-Hour Global Session Clock (UTC hour 0..23)
  const [utcHour, setUtcHour] = useState<number>(13); // 13:00 UTC = 8:00 AM EST (London + NY overlap!)

  // Tab 3: Annotated Example Charts
  const [selectedChartId, setSelectedChartId] = useState<ExampleChartId>('eurusd_fib');
  const [showFibOverlay, setShowFibOverlay] = useState<boolean>(true);
  const [showRiskBox, setShowRiskBox] = useState<boolean>(true);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);

  // Tab 4: Micro-Lot & Safety Math Simulator
  const [paperAccountUsd, setPaperAccountUsd] = useState<number>(500);
  const [riskPct, setRiskPct] = useState<number>(1.5);
  const [stopLossPips, setStopLossPips] = useState<number>(25);

  const selectedPair = useMemo(
    () => PAIR_GUIDES.find((p) => p.id === selectedPairId) ?? PAIR_GUIDES[0],
    [selectedPairId]
  );

  const shiftedPairPrice = useMemo(() => {
    const baseNum = Number(selectedPair.samplePrice);
    const nextNum = baseNum + simulatedPipMove * selectedPair.pipStep;
    return nextNum.toFixed(selectedPair.pipDecimals);
  }, [selectedPair, simulatedPipMove]);

  const activeChart = useMemo(
    () => ANNOTATED_FOREX_CHARTS.find((c) => c.id === selectedChartId) ?? ANNOTATED_FOREX_CHARTS[0],
    [selectedChartId]
  );

  const sessionStatus = useMemo(() => {
    const tokyoOpen = utcHour >= 0 && utcHour < 9;
    const londonOpen = utcHour >= 8 && utcHour < 17;
    const newYorkOpen = utcHour >= 13 && utcHour < 22;
    const isLondonNyOverlap = londonOpen && newYorkOpen;
    const isTokyoLondonOverlap = tokyoOpen && londonOpen;

    let headline = 'Quiet Transition Window';
    let advice =
      'Lower institutional liquidity. Spreads can widen slightly — best used for journaling and marking higher-timeframe Fibonacci zones.';
    if (isLondonNyOverlap) {
      headline = 'Peak Liquidity · London + New York Overlap';
      advice =
        'Both Europe and the US desks are active simultaneously. Tightest spreads and cleanest structural trends on EUR/USD, GBP/USD, and Gold.';
    } else if (isTokyoLondonOverlap) {
      headline = 'Morning Handoff · Tokyo + London Overlap';
      advice =
        'London traders step in as Asian ranges finish forming. Common window for clean breakout or liquidity-sweep setups.';
    } else if (londonOpen) {
      headline = 'London Session Active';
      advice =
        'Strong European institutional volume on EUR and GBP pairs. Classic window for morning trend direction.';
    } else if (newYorkOpen) {
      headline = 'New York Session Active';
      advice =
        'US economic releases and afternoon follow-through on USD pairs and Spot Gold.';
    } else if (tokyoOpen) {
      headline = 'Tokyo (Asian) Session Active';
      advice =
        'Calm range-building hours on EUR/USD and GBP/USD; steady rhythm on USD/JPY.';
    }

    const estHour24 = (utcHour + 19) % 24;
    const estSuffix = estHour24 >= 12 ? 'PM' : 'AM';
    const estHour12 = estHour24 % 12 === 0 ? 12 : estHour24 % 12;

    return {
      tokyoOpen,
      londonOpen,
      newYorkOpen,
      isLondonNyOverlap,
      headline,
      advice,
      estLabel: `${estHour12}:00 ${estSuffix} EST`,
      utcLabel: `${utcHour < 10 ? `0${utcHour}` : utcHour}:00 UTC`,
    };
  }, [utcHour]);

  // Tab 4 Micro-Lot Math (1 micro-lot = 0.01 lot ≈ $0.10 per pip on EUR/USD)
  const safetyMath = useMemo(() => {
    const maxRiskUsd = (paperAccountUsd * riskPct) / 100;
    const dollarsPerPipAllowed = maxRiskUsd / Math.max(5, stopLossPips);
    // Standard lot = $10/pip, Mini (0.10) = $1/pip, Micro (0.01) = $0.10/pip
    const recommendedLots = Math.max(0.01, Math.floor((dollarsPerPipAllowed / 10) * 100) / 100);
    const actualRiskUsd = recommendedLots * 10 * stopLossPips;
    const twoRRewardUsd = actualRiskUsd * 2;
    const consecutiveLossesBeforeHalf = Math.max(
      1,
      Math.floor((paperAccountUsd * 0.5) / Math.max(0.01, actualRiskUsd))
    );
    return {
      maxRiskUsd,
      dollarsPerPipAllowed,
      recommendedLots,
      actualRiskUsd,
      twoRRewardUsd,
      consecutiveLossesBeforeHalf,
    };
  }, [paperAccountUsd, riskPct, stopLossPips]);

  // Helper to map price to SVG Y coordinate in Annotated Chart Viewer
  const chartSvgBounds = useMemo(() => {
    const allPrices = [
      ...activeChart.candles.flatMap((c) => [c.h, c.l]),
      activeChart.entryPrice,
      activeChart.stopPrice,
      activeChart.targetPrice,
    ];
    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const pad = (maxP - minP) * 0.14;
    return { low: minP - pad, high: maxP + pad };
  }, [activeChart]);

  const priceToY = (price: number) => {
    const top = 26;
    const bottom = 294;
    const ratio = (chartSvgBounds.high - price) / Math.max(0.00001, chartSvgBounds.high - chartSvgBounds.low);
    return top + ratio * (bottom - top);
  };

  return (
    <div className="space-y-6">
      {/* Module Header Banner */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
                Forex Learning Guide
              </span>
              <span aria-hidden="true">·</span>
              <span>Information &amp; Visual Chart Study</span>
              <span aria-hidden="true">·</span>
              <span>Zero-Hype · Paper Practice First</span>
            </div>
            <h1
              className="font-editorial text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight"
              style={{ textWrap: 'balance' }}
            >
              Forex Foundations: Currency Pairs, Global Sessions &amp; Illustrated Chart Examples
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-[70ch]">
              The exact same candlestick anatomy, market seasons, Fibonacci 61.8% retracements, and
              strict 1%–2% risk stewardship you learn at Symphony Markets Academy apply directly to
              Foreign Exchange (Forex). Walk through these 4 illustrated visual lessons before ever
              opening a paper demo chart.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenFibonacciStudio && (
              <button
                type="button"
                onClick={onOpenFibonacciStudio}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Open Fibonacci Studio</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* 4 Progressive Visual Lesson Tabs */}
        <div
          role="tablist"
          aria-label="Forex Learning Topics"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800"
        >
          {(
            [
              {
                id: 'pairs' as const,
                step: '01',
                label: 'Currency Pairs & Pips',
                icon: Scale,
              },
              {
                id: 'sessions' as const,
                step: '02',
                label: '24-Hr Global Sessions',
                icon: Globe2,
              },
              {
                id: 'charts' as const,
                step: '03',
                label: 'Annotated Example Charts',
                icon: TrendingUp,
              },
              {
                id: 'safety' as const,
                step: '04',
                label: 'Micro-Lots & Safety Rules',
                icon: ShieldCheck,
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-left text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="font-mono opacity-80">{tab.step}.</span>
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ====================================================================
       * LESSON 01: CURRENCY PAIRS & PIPS (WITH CUSTOM ILLUSTRATION)
       * ==================================================================== */}
      {activeTab === 'pairs' && (
        <div className="space-y-6">
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Visual Illustration Card */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
              <div className="relative bg-slate-100 dark:bg-slate-950 aspect-[4/3] w-full overflow-hidden">
                <img
                  src={forexPairBalanceImg}
                  alt="Illustration of a precision brass balance scale weighing a base currency against a quote currency"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="text-xs font-mono font-semibold text-sky-700 dark:text-sky-400">
                    Visual Metaphor · Always Two Currencies on a Scale
                  </div>
                  <h2 className="font-editorial text-lg font-bold text-slate-900 dark:text-white">
                    Base Currency (Left) vs. Quote Currency (Right)
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    You never trade a single national currency alone. Every Forex quote is a balance
                    scale comparing <strong>1 unit of the Base currency</strong> on the left against
                    how much of the <strong>Quote currency</strong> on the right it takes to buy it.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                  Rising chart = Left currency getting stronger · Falling chart = Right currency
                  getting stronger.
                </div>
              </div>
            </div>

            {/* Right Interactive Pair & Pip Explorer */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Interactive Pair &amp; Pip Visualizer
                    </div>
                    <h2 className="font-editorial text-xl font-bold text-slate-900 dark:text-white">
                      Inspect How Major Pairs &amp; Pips Move
                    </h2>
                  </div>

                  {/* Segmented Pair Switcher */}
                  <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    {PAIR_GUIDES.map((pair) => (
                      <button
                        key={pair.id}
                        type="button"
                        onClick={() => {
                          setSelectedPairId(pair.id);
                          setSimulatedPipMove(15);
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                          selectedPairId === pair.id
                            ? 'bg-sky-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {pair.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Interactive Quote Display */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedPair.nickname}
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Base: {selectedPair.base} · Quote: {selectedPair.quote}
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Simulated Price ({simulatedPipMove >= 0 ? '+' : ''}
                        {simulatedPipMove} pips)
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {shiftedPairPrice.slice(0, -1)}
                        <span className="text-emerald-600 dark:text-emerald-400 underline decoration-2 underline-offset-4">
                          {shiftedPairPrice.slice(-1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Pip Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <label
                        htmlFor="forex-pip-slider"
                        className="font-sans font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Drag to Simulate a Pip Move:
                      </label>
                      <span
                        className={
                          simulatedPipMove >= 0
                            ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                            : 'text-rose-600 dark:text-rose-400 font-bold'
                        }
                      >
                        {simulatedPipMove >= 0 ? '+' : ''}
                        {simulatedPipMove} pips (1 pip = {selectedPair.pipStep})
                      </span>
                    </div>
                    <input
                      id="forex-pip-slider"
                      type="range"
                      min={-50}
                      max={50}
                      step={1}
                      value={simulatedPipMove}
                      onChange={(e) => setSimulatedPipMove(Number(e.target.value))}
                      className="w-full accent-sky-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>-50 pips</span>
                      <span>Base: {selectedPair.samplePrice}</span>
                      <span>+50 pips</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedPair.plainEnglish}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 space-y-1">
                    <div className="text-slate-500 dark:text-slate-400">Typical Daily Movement</div>
                    <div className="font-mono font-bold text-slate-900 dark:text-white">
                      {selectedPair.avgDailyPips}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 space-y-1">
                    <div className="text-slate-500 dark:text-slate-400">Cleanest Trading Hours</div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {selectedPair.bestSession}
                    </div>
                  </div>
                </div>
              </div>

              {/* Honest Crypto vs Forex Comparison Table */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Key Difference: XRPL Spot Crypto vs. Regulated Forex
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 space-y-1">
                    <div className="font-semibold text-emerald-800 dark:text-emerald-300">
                      XRP / XRPL DEX (Modules 1–3)
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      100% self-custody in your own Xaman wallet, 1x Spot (zero leverage), open 24/7
                      including weekends.
                    </p>
                  </div>
                  <div className="rounded-lg border border-sky-500/30 bg-sky-50/40 dark:bg-sky-950/20 p-3 space-y-1">
                    <div className="font-semibold text-sky-800 dark:text-sky-300">
                      Foreign Exchange (Forex)
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      Traded through regulated brokers Mon–Fri (closed weekends). Brokers offer
                      leverage — so strict micro-lot sizing is mandatory.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ====================================================================
       * LESSON 02: 24-HOUR GLOBAL SESSION RHYTHM (TOKYO · LONDON · NEW YORK)
       * ==================================================================== */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-6 relative bg-slate-900 aspect-[16/9] lg:aspect-auto">
                <img
                  src={forexSessionsImg}
                  alt="Editorial illustration of the 24-hour global Forex sessions across Tokyo, London, and New York City"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="lg:col-span-6 p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold text-sky-700 dark:text-sky-400">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Global 24-Hour Relay (Sunday 5 PM EST → Friday 5 PM EST)</span>
                  </div>
                  <h2 className="font-editorial text-2xl font-bold text-slate-900 dark:text-white">
                    Forex Moves in Three Predictable Daily Waves
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Just as Symphony Markets teaches seasonal cycles on weekly charts, Forex follows
                    a daily sunlight rhythm around the earth. Drag the clock slider below to see
                    which financial capitals are open right now and when liquidity peaks.
                  </p>
                </div>

                {/* Live Interactive Clock Readout */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {sessionStatus.headline}
                    </div>
                    <div className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400 tabular-nums">
                      {sessionStatus.estLabel} ({sessionStatus.utcLabel})
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {sessionStatus.advice}
                  </p>

                  <div className="space-y-1 pt-1">
                    <label
                      htmlFor="forex-utc-slider"
                      className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400"
                    >
                      Slide Hour of the Day (00:00 – 23:00 UTC):
                    </label>
                    <input
                      id="forex-utc-slider"
                      type="range"
                      min={0}
                      max={23}
                      step={1}
                      value={utcHour}
                      onChange={(e) => setUtcHour(Number(e.target.value))}
                      className="w-full accent-sky-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive SVG 24-Hour Session Overlap Bar Chart */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-900 dark:text-white">
                  Interactive 24-Hour Session Overlap Diagram (UTC Hours)
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Gold highlight = Peak London + New York Overlap (13:00 – 17:00 UTC / 8 AM – 12 PM EST)
                </span>
              </div>

              <div className="w-full overflow-x-auto">
                <svg
                  viewBox="0 0 960 190"
                  role="img"
                  aria-label="24-Hour Forex Global Trading Session Overlap Chart"
                  className="w-full min-w-[640px] h-auto"
                >
                  {/* Background Grid */}
                  <rect
                    x="110"
                    y="16"
                    width="820"
                    height="132"
                    rx="8"
                    className="fill-slate-50 dark:fill-slate-950 stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="1"
                  />

                  {/* Peak London + NY Overlap Highlight Band (13..17 UTC) */}
                  <rect
                    x={110 + (13 / 24) * 820}
                    y="16"
                    width={(4 / 24) * 820}
                    height="132"
                    className="fill-amber-400/20 dark:fill-amber-500/15"
                  />

                  {/* Hour Vertical Hairlines */}
                  {[0, 4, 8, 12, 16, 20, 24].map((h) => {
                    const x = 110 + (h / 24) * 820;
                    return (
                      <g key={h}>
                        <line
                          x1={x}
                          y1="16"
                          x2={x}
                          y2="148"
                          className="stroke-slate-200 dark:stroke-slate-800"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={x}
                          y="170"
                          textAnchor="middle"
                          className="fill-slate-500 dark:fill-slate-400 text-[11px] font-mono"
                        >
                          {h < 10 ? `0${h}:00` : `${h}:00`}
                        </text>
                      </g>
                    );
                  })}

                  {/* Row 1: Tokyo (00:00 - 09:00 UTC) */}
                  <text
                    x="16"
                    y="47"
                    className="fill-slate-700 dark:fill-slate-300 text-[12px] font-semibold"
                  >
                    Tokyo
                  </text>
                  <rect
                    x={110 + (0 / 24) * 820}
                    y="28"
                    width={(9 / 24) * 820}
                    height="26"
                    rx="6"
                    className={
                      sessionStatus.tokyoOpen
                        ? 'fill-amber-500'
                        : 'fill-amber-500/35 dark:fill-amber-500/25'
                    }
                  />
                  <text
                    x={110 + (4.5 / 24) * 820}
                    y="45"
                    textAnchor="middle"
                    className="fill-slate-950 dark:fill-white text-[11px] font-mono font-semibold"
                  >
                    00:00 – 09:00 UTC (USD/JPY)
                  </text>

                  {/* Row 2: London (08:00 - 17:00 UTC) */}
                  <text
                    x="16"
                    y="87"
                    className="fill-slate-700 dark:fill-slate-300 text-[12px] font-semibold"
                  >
                    London
                  </text>
                  <rect
                    x={110 + (8 / 24) * 820}
                    y="68"
                    width={(9 / 24) * 820}
                    height="26"
                    rx="6"
                    className={
                      sessionStatus.londonOpen
                        ? 'fill-sky-600'
                        : 'fill-sky-600/35 dark:fill-sky-500/25'
                    }
                  />
                  <text
                    x={110 + (12.5 / 24) * 820}
                    y="85"
                    textAnchor="middle"
                    className="fill-white text-[11px] font-mono font-semibold"
                  >
                    08:00 – 17:00 UTC (EUR · GBP)
                  </text>

                  {/* Row 3: New York (13:00 - 22:00 UTC) */}
                  <text
                    x="16"
                    y="127"
                    className="fill-slate-700 dark:fill-slate-300 text-[12px] font-semibold"
                  >
                    New York
                  </text>
                  <rect
                    x={110 + (13 / 24) * 820}
                    y="108"
                    width={(9 / 24) * 820}
                    height="26"
                    rx="6"
                    className={
                      sessionStatus.newYorkOpen
                        ? 'fill-emerald-600'
                        : 'fill-emerald-600/35 dark:fill-emerald-500/25'
                    }
                  />
                  <text
                    x={110 + (17.5 / 24) * 820}
                    y="125"
                    textAnchor="middle"
                    className="fill-white text-[11px] font-mono font-semibold"
                  >
                    13:00 – 22:00 UTC (USD · Gold)
                  </text>

                  {/* Active Selected Hour Scrubber Needle */}
                  <line
                    x1={110 + ((utcHour + 0.5) / 24) * 820}
                    y1="10"
                    x2={110 + ((utcHour + 0.5) / 24) * 820}
                    y2="154"
                    className="stroke-rose-600 dark:stroke-rose-400"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx={110 + ((utcHour + 0.5) / 24) * 820}
                    cy="12"
                    r="4.5"
                    className="fill-rose-600 dark:fill-rose-400"
                  />
                </svg>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ====================================================================
       * LESSON 03: ANNOTATED EXAMPLE FOREX CHARTS + FIBONACCI ILLUSTRATION
       * ==================================================================== */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          {/* Example Chart Selector + Visual Overlay Toggles */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {ANNOTATED_FOREX_CHARTS.map((chart, idx) => (
                  <button
                    key={chart.id}
                    type="button"
                    onClick={() => setSelectedChartId(chart.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedChartId === chart.id
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Example {idx + 1}: {chart.pair} ({chart.timeframe})
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowFibOverlay((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    showFibOverlay
                      ? 'bg-amber-500/15 border-amber-500/60 text-amber-800 dark:text-amber-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Fibonacci Shelf: {showFibOverlay ? 'On' : 'Off'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRiskBox((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    showRiskBox
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-800 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Entry / Stop / Target: {showRiskBox ? 'On' : 'Off'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAnnotations((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    showAnnotations
                      ? 'bg-sky-500/15 border-sky-500/60 text-sky-800 dark:text-sky-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Chart Labels: {showAnnotations ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            {/* Two-Zone Educational Stage (65% Interactive Chart / 35% Guided Notes) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="font-mono font-bold text-white">
                    {activeChart.pair} · {activeChart.timeframe}
                  </div>
                  <div className="text-slate-400 font-mono tabular-nums">
                    Stop: {activeChart.riskPips} pips · Target: +{activeChart.rewardPips} pips · R:R{' '}
                    <span className="text-emerald-400 font-bold">{activeChart.rrText}</span>
                  </div>
                </div>

                {/* Crisp Annotated SVG Candlestick + Fibonacci Study Chart */}
                <div className="w-full overflow-x-auto">
                  <svg
                    viewBox="0 0 760 330"
                    role="img"
                    aria-label={`${activeChart.pair} annotated Forex candlestick and Fibonacci example chart`}
                    className="w-full min-w-[540px] h-auto"
                  >
                    {/* Subtle Horizontal Grid */}
                    {[0.2, 0.4, 0.6, 0.8].map((frac) => {
                      const y = 26 + frac * 268;
                      return (
                        <line
                          key={frac}
                          x1="20"
                          y1={y}
                          x2="665"
                          y2={y}
                          stroke="#1e293b"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Entry / Stop / Target Shaded Reward & Risk Boxes */}
                    {showRiskBox && (
                      <>
                        {/* Reward Box (Green) */}
                        <rect
                          x="445"
                          y={Math.min(
                            priceToY(activeChart.targetPrice),
                            priceToY(activeChart.entryPrice)
                          )}
                          width="215"
                          height={Math.abs(
                            priceToY(activeChart.entryPrice) - priceToY(activeChart.targetPrice)
                          )}
                          fill="rgba(16, 185, 129, 0.14)"
                          stroke="rgba(16, 185, 129, 0.55)"
                          strokeDasharray="4 3"
                        />
                        {/* Risk Box (Rose) */}
                        <rect
                          x="445"
                          y={Math.min(
                            priceToY(activeChart.entryPrice),
                            priceToY(activeChart.stopPrice)
                          )}
                          width="215"
                          height={Math.abs(
                            priceToY(activeChart.stopPrice) - priceToY(activeChart.entryPrice)
                          )}
                          fill="rgba(244, 63, 94, 0.14)"
                          stroke="rgba(244, 63, 94, 0.55)"
                          strokeDasharray="4 3"
                        />
                        <text
                          x="672"
                          y={priceToY(activeChart.targetPrice) + 4}
                          fill="#34d399"
                          fontSize="10"
                          fontFamily="monospace"
                        >
                          TP {activeChart.targetPrice.toFixed(activeChart.decimals)}
                        </text>
                        <text
                          x="672"
                          y={priceToY(activeChart.entryPrice) + 4}
                          fill="#38bdf8"
                          fontSize="10"
                          fontFamily="monospace"
                        >
                          IN {activeChart.entryPrice.toFixed(activeChart.decimals)}
                        </text>
                        <text
                          x="672"
                          y={priceToY(activeChart.stopPrice) + 4}
                          fill="#fb7185"
                          fontSize="10"
                          fontFamily="monospace"
                        >
                          SL {activeChart.stopPrice.toFixed(activeChart.decimals)}
                        </text>
                      </>
                    )}

                    {/* Fibonacci Retracement Levels */}
                    {showFibOverlay && (
                      <>
                        {[
                          { label: 'Fib 38.2%', price: activeChart.fib382, color: '#94a3b8' },
                          { label: 'Fib 50.0%', price: activeChart.fib500, color: '#fbbf24' },
                          { label: 'Fib 61.8%', price: activeChart.fib618, color: '#f59e0b' },
                        ].map((fib) => {
                          const y = priceToY(fib.price);
                          return (
                            <g key={fib.label}>
                              <line
                                x1="20"
                                y1={y}
                                x2="660"
                                y2={y}
                                stroke={fib.color}
                                strokeWidth={fib.label === 'Fib 61.8%' ? '1.6' : '1'}
                                strokeDasharray="5 4"
                                opacity="0.85"
                              />
                              <text
                                x="26"
                                y={y - 4}
                                fill={fib.color}
                                fontSize="10"
                                fontFamily="monospace"
                              >
                                {fib.label} · {fib.price.toFixed(activeChart.decimals)}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    )}

                    {/* Candlesticks */}
                    {activeChart.candles.map((c, idx) => {
                      const cx = 62 + idx * 52;
                      const isBull = c.c >= c.o;
                      const color = isBull ? '#10b981' : '#f43f5e';
                      const yHigh = priceToY(c.h);
                      const yLow = priceToY(c.l);
                      const yOpen = priceToY(c.o);
                      const yClose = priceToY(c.c);
                      const bodyTop = Math.min(yOpen, yClose);
                      const bodyH = Math.max(4, Math.abs(yClose - yOpen));

                      return (
                        <g key={idx}>
                          <line
                            x1={cx}
                            y1={yHigh}
                            x2={cx}
                            y2={yLow}
                            stroke={color}
                            strokeWidth="2"
                          />
                          <rect
                            x={cx - 11}
                            y={bodyTop}
                            width="22"
                            height={bodyH}
                            rx="2"
                            fill={color}
                          />
                        </g>
                      );
                    })}

                    {/* Educational Callout Labels */}
                    {showAnnotations &&
                      activeChart.callouts.map((note) => {
                        const c = activeChart.candles[note.candleIdx];
                        if (!c) return null;
                        const cx = 62 + note.candleIdx * 52;
                        const isHigh = note.anchor === 'high';
                        const yTarget = isHigh ? priceToY(c.h) - 18 : priceToY(c.l) + 22;
                        return (
                          <g key={note.title}>
                            <circle
                              cx={cx}
                              cy={isHigh ? priceToY(c.h) - 4 : priceToY(c.l) + 4}
                              r="3.5"
                              fill="#38bdf8"
                            />
                            <text
                              x={cx}
                              y={Math.max(18, Math.min(312, yTarget))}
                              textAnchor="middle"
                              fill="#e2e8f0"
                              fontSize="10"
                              fontWeight="700"
                            >
                              {note.title}
                            </text>
                            <text
                              x={cx}
                              y={Math.max(29, Math.min(324, yTarget + 12))}
                              textAnchor="middle"
                              fill="#94a3b8"
                              fontSize="9"
                              fontFamily="monospace"
                            >
                              {note.detail}
                            </text>
                          </g>
                        );
                      })}
                  </svg>
                </div>
              </div>

              {/* Right Column: Plain-English Reading Notes + Fibonacci Blueprint Illustration */}
              <div className="lg:col-span-4 space-y-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-3">
                  <div className="text-xs font-mono font-semibold text-amber-700 dark:text-amber-400">
                    {activeChart.seasonTag}
                  </div>
                  <h3 className="font-editorial text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {activeChart.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeChart.summary}
                  </p>
                  <ul className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    {activeChart.takeaways.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400 shrink-0">
                          0{i + 1}.
                        </span>
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Custom Fibonacci Waves Editorial Illustration */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                    <img
                      src={forexFibWavesImg}
                      alt="Blueprint illustration of harmonious market waves and golden ratio Fibonacci geometry"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    <strong className="text-slate-900 dark:text-white">
                      Same Geometry Across Markets:
                    </strong>{' '}
                    Whether studying XRP on XRPL or EUR/USD on a 4-hour Forex chart, patient entries
                    wait for price to pull back into harmony instead of chasing vertical spikes.
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ====================================================================
       * LESSON 04: MICRO-LOTS, PIP RISK & NO-SCAM ZONE LEVERAGE PROTECTION
       * ==================================================================== */}
      {activeTab === 'safety' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive Micro-Lot & Risk Calculator */}
          <section className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
            <div className="space-y-1">
              <div className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                Interactive Forex Safety Math (EUR/USD Reference)
              </div>
              <h2 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                How Micro-Lots Protect Beginners From the Leverage Trap
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Adjust the three sliders below to see how disciplined students keep every Forex
                paper trade inside a calm 1%–2% risk cap using micro-lots (0.01 lot ≈ $0.10 per pip).
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono tabular-nums">
                  <label htmlFor="fx-bal" className="font-sans font-semibold text-slate-700 dark:text-slate-300">
                    1. Paper Demo Account Balance
                  </label>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ${paperAccountUsd.toLocaleString()}
                  </span>
                </div>
                <input
                  id="fx-bal"
                  type="range"
                  min={100}
                  max={5000}
                  step={100}
                  value={paperAccountUsd}
                  onChange={(e) => setPaperAccountUsd(Number(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono tabular-nums">
                  <label htmlFor="fx-risk" className="font-sans font-semibold text-slate-700 dark:text-slate-300">
                    2. Maximum Risk Per Trade (Never Above 2%)
                  </label>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {riskPct.toFixed(1)}% (${safetyMath.maxRiskUsd.toFixed(2)})
                  </span>
                </div>
                <input
                  id="fx-risk"
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.5}
                  value={riskPct}
                  onChange={(e) => setRiskPct(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono tabular-nums">
                  <label htmlFor="fx-stop" className="font-sans font-semibold text-slate-700 dark:text-slate-300">
                    3. Structural Stop-Loss Distance (Pips)
                  </label>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {stopLossPips} pips
                  </span>
                </div>
                <input
                  id="fx-stop"
                  type="range"
                  min={10}
                  max={80}
                  step={5}
                  value={stopLossPips}
                  onChange={(e) => setStopLossPips(Number(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Clean Output Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 font-mono tabular-nums">
              <div className="rounded-lg border border-sky-500/40 bg-sky-50/50 dark:bg-sky-950/20 p-3">
                <div className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                  Safe Lot Size
                </div>
                <div className="text-lg font-bold text-sky-700 dark:text-sky-400">
                  {safetyMath.recommendedLots.toFixed(2)} lot
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                <div className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                  Max Loss (1R)
                </div>
                <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                  -${safetyMath.actualRiskUsd.toFixed(2)}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                <div className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                  1:2 Target (+2R)
                </div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  +${safetyMath.twoRRewardUsd.toFixed(2)}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                <div className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                  Cushion Depth
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {safetyMath.consecutiveLossesBeforeHalf} stops
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Lot Size Reference & No-Scam Zone Checklist */}
          <section className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <Compass className="w-3.5 h-3.5 shrink-0" />
                <span>No-Scam Zone Forex Rules</span>
              </div>
              <h3 className="font-editorial text-lg font-bold text-slate-900 dark:text-white">
                Lot Size Cheat Sheet (EUR/USD)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono tabular-nums border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-left font-sans text-slate-500 dark:text-slate-400">
                    <th className="py-2 pr-2">Lot Type</th>
                    <th className="py-2 pr-2">Size</th>
                    <th className="py-2 pr-2">Value / Pip</th>
                    <th className="py-2">Student Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  <tr>
                    <td className="py-2.5 pr-2 font-sans font-semibold text-emerald-700 dark:text-emerald-400">
                      Micro Lot
                    </td>
                    <td className="py-2.5 pr-2">0.01</td>
                    <td className="py-2.5 pr-2">~$0.10 / pip</td>
                    <td className="py-2.5 font-sans">Beginners &amp; Paper</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-2 font-sans font-semibold">Mini Lot</td>
                    <td className="py-2.5 pr-2">0.10</td>
                    <td className="py-2.5 pr-2">~$1.00 / pip</td>
                    <td className="py-2.5 font-sans">Intermediate</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-2 font-sans font-semibold text-amber-700 dark:text-amber-400">
                      Standard Lot
                    </td>
                    <td className="py-2.5 pr-2">1.00</td>
                    <td className="py-2.5 pr-2">~$10.00 / pip</td>
                    <td className="py-2.5 font-sans">Large Accounts Only</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-2 text-xs">
              <div className="font-bold text-amber-900 dark:text-amber-200">
                3 Questions to Ask Before Any Forex Broker
              </div>
              <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 leading-relaxed">
                <li>
                  <strong>1. Regulated?</strong> Only study with top-tier regulated brokers (e.g.,
                  CFTC/NFA in the US, FCA in the UK) — never offshore Telegram signal groups.
                </li>
                <li>
                  <strong>2. Free Demo First?</strong> Log at least 30 calm paper demo trades using
                  0.01 micro-lots and fixed stop-losses before risking real money.
                </li>
                <li>
                  <strong>3. Zero 500x Gambling?</strong> High leverage does not create an edge —
                  patient chart structure and small risk per trade do.
                </li>
              </ul>
            </div>

            {onOpenCryptoFoundations && (
              <button
                type="button"
                onClick={onOpenCryptoFoundations}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>Explore Module 01: Foundations &amp; Eagle Seasons</span>
              </button>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
