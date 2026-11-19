import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Compass,
  Layers,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import founderDeskImg from '../assets/images/founder_desk_story_1794561548330.jpg';
import noScamCompassImg from '../assets/images/no_scam_compass_1794561548457.jpg';
import { AssetSymbol, Candle } from '../types/market';
import { SectionPromoVideoBanner } from './SectionPromoVideoBanner';

export type MarketCyclePartId =
  | 'bull_vs_bear'
  | 'four_seasons'
  | 'monthly_rhythms'
  | 'four_year_cycles';

interface MarketCyclesEducationModuleProps {
  symbol?: AssetSymbol;
  onSelectSymbol?: (sym: AssetSymbol) => void;
  candles?: Candle[];
  btcLivePrice?: number;
  xrpLivePrice: number;
  xlmLivePrice: number;
  onEnterApp?: (targetSectionId?: string) => void;
  onlyPart?: MarketCyclePartId | 'all';
  sectionNumberOverride?: string;
}

type CyclePhaseKey = 'accumulation' | 'markup' | 'distribution' | 'markdown';
type HistoricalCycleId = 'cycle1' | 'cycle2' | 'cycle3' | 'cycle4';
type QuarterFilter = 'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4';

interface CyclePhaseDetail {
  key: CyclePhaseKey;
  seasonLabel: string;
  phaseNumber: string;
  title: string;
  subtitle: string;
  musicalTempo: string;
  crowdPsychology: string;
  chartStructure: string;
  scamDangerLevel: string;
  fiveDollarHabit: string;
  colorHex: string;
  badgeTextClass: string;
}

interface HistoricalFourYearCycle {
  id: HistoricalCycleId;
  years: string;
  eraTitle: string;
  halvingDate: string;
  blockReward: string;
  year1Summary: string;
  year2PeakSummary: string;
  year3BearSummary: string;
  year4BottomSummary: string;
  btcCycleRange: string;
  xrpXlmContext: string;
  keyLesson: string;
  isCurrent?: boolean;
}

interface MonthSeasonalityItem {
  month: string;
  shortName: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  tendency: 'Bullish Bias' | 'Mixed / Transition' | 'Defensive / Pullback';
  historicalAvgNote: string;
  plainEnglishWhy: string;
  barHeightPct: number;
  isPositive: boolean;
  isCurrentMonth?: boolean;
}

const FOUR_CYCLE_PHASES: CyclePhaseDetail[] = [
  {
    key: 'accumulation',
    seasonLabel: 'Season 01 · Crypto Spring',
    phaseNumber: 'Phase 1',
    title: 'Accumulation (The Quiet Planting Season)',
    subtitle: 'After the Bear Market storm finishes, prices go flat and quiet for months.',
    musicalTempo: '♩ Deep Cello Adagio — Steady, calm foundational rhythm',
    crowdPsychology:
      'Disbelief & boredom. Headlines claim "crypto is dead," influencers move on, and retail traders stop watching charts.',
    chartStructure:
      'Sideways range with flat 50-day and 200-day moving averages. Sellers are exhausted; long-term Spot holders quietly absorb supply at the floor.',
    scamDangerLevel:
      'Low hype, but watch out for fake "recovery airdrop" phishing links targeting tired holders.',
    fiveDollarHabit:
      'Practice calm 1x Spot entries near support floors with your $5 learning wallet. Never rush—Spring rewards patience.',
    colorHex: '#0EA5E9',
    badgeTextClass: 'text-sky-700 dark:text-sky-400',
  },
  {
    key: 'markup',
    seasonLabel: 'Season 02 · Crypto Summer',
    phaseNumber: 'Phase 2',
    title: 'Markup / Bull Expansion (The Growth Wave)',
    subtitle: 'Supply tightens after the Halving and prices climb in a staircase of Higher Highs.',
    musicalTempo: '♫ Rising Harp Arpeggio — Harmonic upward momentum',
    crowdPsychology:
      'Growing optimism & validation. Everyday learners start noticing green candles and asking how to open a wallet.',
    chartStructure:
      'Clear Higher Highs (HH) and Higher Lows (HL). Pullbacks to the 38.2%–61.8% Fibonacci zone bounce cleanly with rising volume.',
    scamDangerLevel:
      'Rising danger: Fake "automated AI trading bots" and paid VIP Telegram signal groups start advertising everywhere.',
    fiveDollarHabit:
      'Never chase a tall vertical green candle. Wait for a calm red pullback candle ("musical rest"), risk only $0.10 (2%), and ride the trend.',
    colorHex: '#10B981',
    badgeTextClass: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    key: 'distribution',
    seasonLabel: 'Season 03 · Crypto Autumn Peak',
    phaseNumber: 'Phase 3',
    title: 'Distribution & Euphoria (The Blow-Off Ceiling)',
    subtitle: 'Smart money harvests profits while late crowd FOMO buys the very top.',
    musicalTempo: '♬ Fortissimo Brass Climax — Loud, fast, high-tension',
    crowdPsychology:
      'Euphoria & feeling invincible. Strangers brag about overnight gains and believe prices can only go straight up forever.',
    chartStructure:
      'Parabolic vertical spikes followed by long upper rejection wicks (Shooting Stars), bearish RSI divergence, and violent whipsaws.',
    scamDangerLevel:
      'MAXIMUM DANGER: Fake "double-your-crypto" giveaways, celebrity meme rug-pulls, and rigged platforms with fake "Stop Trading" buttons peak here.',
    fiveDollarHabit:
      'Scale out profits using the Exit Ladder, move gains into cold self-custody or physical/RWA value (like KSBC Gold), and refuse all FOMO.',
    colorHex: '#F59E0B',
    badgeTextClass: 'text-amber-700 dark:text-amber-400',
  },
  {
    key: 'markdown',
    seasonLabel: 'Season 04 · Crypto Winter',
    phaseNumber: 'Phase 4',
    title: 'Markdown / Bear Market Reset (The Cleansing Storm)',
    subtitle: 'Excess leverage is washed out and prices step down to honest long-term value.',
    musicalTempo: '𝄽 Quiet Symphonic Rest — Essential pause before the next symphony',
    crowdPsychology:
      'Fear, panic, and capitulation. Over-leveraged gamblers get liquidated and vow never to look at markets again.',
    chartStructure:
      'Lower Highs (LH) and Lower Lows (LL). Sharp relief rallies ("Bull Traps") fail at descending resistance lines until selling finally dries up.',
    scamDangerLevel:
      'Custodial platform freezes: Centralized lenders and shady exchanges that gambled customer deposits lock withdrawals (proving why self-custody is mandatory).',
    fiveDollarHabit:
      'Protect your capital in self-custody, use zero leverage (1x Spot only), and use the quiet Winter months to master chart reading.',
    colorHex: '#F43F5E',
    badgeTextClass: 'text-rose-700 dark:text-rose-400',
  },
];

const HISTORICAL_FOUR_YEAR_CYCLES: HistoricalFourYearCycle[] = [
  {
    id: 'cycle1',
    years: '2012 – 2016',
    eraTitle: 'Cycle 1 · The Genesis Proof & First Halving Era',
    halvingDate: 'Nov 28, 2012 (Year 1)',
    blockReward: '50 BTC → 25 BTC per block',
    year1Summary: '2012 (Year 1): First Bitcoin Halving cuts new supply in half at ~$12; quiet steady climb begins.',
    year2PeakSummary: '2013 (Year 2): First major post-halving Bull Market surges from $13 to ~$1,150 by late November 2013.',
    year3BearSummary: '2014 (Year 3): Mt. Gox exchange collapse triggers a -85% Bear Market reset down toward ~$170.',
    year4BottomSummary: '2015–2016 (Year 4): Quiet accumulation floor between $200–$450; XRPL and Stellar foundational rails are built.',
    btcCycleRange: '$12 → $1,150 Peak → $170 Bear Floor',
    xrpXlmContext: 'XRPL (launched 2012) and Stellar (launched 2014) traded under $0.005–$0.02 while building cross-border settlement rails.',
    keyLesson: 'Proved for the first time that cutting new supply in half triggers a multi-year wave—and that leaving coins on an exchange (Mt. Gox) is fatal.',
  },
  {
    id: 'cycle2',
    years: '2016 – 2020',
    eraTitle: 'Cycle 2 · The Global Retail & Payment Rails Awakening',
    halvingDate: 'July 9, 2016 (Year 1)',
    blockReward: '25 BTC → 12.5 BTC per block',
    year1Summary: '2016 (Year 1): Second Halving at ~$650; steady Higher Lows build a launchpad into year-end.',
    year2PeakSummary: '2017 (Year 2): Historic Bull Run—BTC reaches ~$19,800 in Dec 2017; XRP surges to $3.84 and XLM reaches $0.93 in Jan 2018.',
    year3BearSummary: '2018 (Year 3): Classic Year-3 Bear Market washes out 90% of hyped ICO tokens; BTC resets to ~$3,200 by Dec 2018.',
    year4BottomSummary: '2019–Early 2020 (Year 4): Mid-cycle recovery and re-accumulation before the May 2020 Halving.',
    btcCycleRange: '$650 → $19,800 Peak → $3,200 Bear Floor',
    xrpXlmContext: 'XRP ($0.006 → $3.84) and XLM ($0.002 → $0.93) demonstrated explosive Q4/Q1 utility breakouts followed by a multi-year cooldown.',
    keyLesson: 'Showed that payment utility coins move fastest in the final Q4/Q1 stretch of a bull wave, and that taking profit on the way up is essential.',
  },
  {
    id: 'cycle3',
    years: '2020 – 2024',
    eraTitle: 'Cycle 3 · The DeFi, Institutional & Self-Custody Test Era',
    halvingDate: 'May 11, 2020 (Year 1)',
    blockReward: '12.5 BTC → 6.25 BTC per block',
    year1Summary: '2020 (Year 1): Third Halving at ~$8,700; Q4 "Uptober–December" breakout carries BTC past $29,000.',
    year2PeakSummary: '2021 (Year 2): Double-top Bull Market (April & November 2021) reaches ~$69,000 BTC; XRP rallies to ~$1.96 and XLM to ~$0.79.',
    year3BearSummary: '2022 (Year 3): Federal Reserve rate hikes + collapse of custodial giants (FTX, Celsius, Voyager) push BTC down to ~$15,500 in Nov 2022.',
    year4BottomSummary: '2023–Early 2024 (Year 4): Strong Year-4 recovery driven by July 2023 XRP legal clarity ruling and Spot ETF approvals.',
    btcCycleRange: '$8,700 → $69,000 Peak → $15,500 Bear Floor',
    xrpXlmContext: 'In July 2023, U.S. federal court ruled programmatic XRP sales on exchanges are not securities, cementing XRPL & Stellar clarity.',
    keyLesson: '2022 proved forever: "Not your keys, not your crypto." Every learner who held assets in self-custody with zero leverage survived unscathed.',
  },
  {
    id: 'cycle4',
    years: '2024 – 2028',
    eraTitle: 'Cycle 4 (Current) · Sovereign Self-Custody, RWA & Utility Era',
    halvingDate: 'April 19, 2024 (Year 1)',
    blockReward: '6.25 BTC → 3.125 BTC per block',
    year1Summary: '2024 (Year 1): Fourth Halving + regulated Spot ETFs + launch of enterprise stablecoin & RWA settlement rails (RLUSD, Soroban).',
    year2PeakSummary: '2025 (Year 2): Post-halving expansion wave across sovereign Bitcoin, ISO 20022 cross-border rails (XRP, XLM), and tokenized gold.',
    year3BearSummary: '2026 (Year 3 — WHERE WE ARE NOW): Mid-cycle valuation reset & healthy consolidation. Excess leverage is cleared out while real utility builds higher structural floors.',
    year4BottomSummary: '2027–2028 (Year 4 Ahead): Pre-halving accumulation & springboard runway leading into the 5th Halving in Spring 2028.',
    btcCycleRange: '2024 Halving (~$64k) → 2025 Expansion → 2026 Mid-Cycle Value Reset',
    xrpXlmContext: 'XRP and XLM now operate with sub-penny fees (~$0.0001), native DEX AMM pools, and real-world asset tokenization (like KSBC Gold).',
    keyLesson: 'In Year 3 (Late 2026), patience beats hype: avoid high leverage, accumulate quality utility on dips, and keep your 2% ($0.10) safety net active.',
    isCurrent: true,
  },
];

const MONTHLY_SEASONALITY_DATA: MonthSeasonalityItem[] = [
  {
    month: 'January',
    shortName: 'Jan',
    quarter: 'Q1',
    tendency: 'Mixed / Transition',
    historicalAvgNote: 'New-Year Rebalancing',
    plainEnglishWhy:
      'Institutions deploy fresh annual budgets in week 1, followed by mid-month profit-taking from December rallies.',
    barHeightPct: 58,
    isPositive: true,
  },
  {
    month: 'February',
    shortName: 'Feb',
    quarter: 'Q1',
    tendency: 'Bullish Bias',
    historicalAvgNote: 'Strong Winter Recovery',
    plainEnglishWhy:
      'Historically one of Q1’s most consistent green months as Lunar New Year & institutional inflows settle in.',
    barHeightPct: 74,
    isPositive: true,
  },
  {
    month: 'March',
    shortName: 'Mar',
    quarter: 'Q1',
    tendency: 'Defensive / Pullback',
    historicalAvgNote: 'Pre-Tax Liquidity Dip',
    plainEnglishWhy:
      'Traders and funds often sell a portion of holdings in March to set aside cash for April tax deadlines.',
    barHeightPct: 42,
    isPositive: false,
  },
  {
    month: 'April',
    shortName: 'Apr',
    quarter: 'Q2',
    tendency: 'Bullish Bias',
    historicalAvgNote: 'Post-Tax Spring Bounce',
    plainEnglishWhy:
      'Once tax-season selling finishes in mid-April, buyers frequently step back in (2024 Halving also occurred in April).',
    barHeightPct: 78,
    isPositive: true,
  },
  {
    month: 'May',
    shortName: 'May',
    quarter: 'Q2',
    tendency: 'Mixed / Transition',
    historicalAvgNote: '“Sell in May” Transition',
    plainEnglishWhy:
      'Wall Street’s classic "Sell in May and go away" adage often causes volume to cool off heading into summer.',
    barHeightPct: 50,
    isPositive: true,
  },
  {
    month: 'June',
    shortName: 'Jun',
    quarter: 'Q2',
    tendency: 'Defensive / Pullback',
    historicalAvgNote: 'Mid-Year Portfolio Reset',
    plainEnglishWhy:
      'Half-year institutional book closing and summer vacation schedules frequently create quiet sideways or pullback weeks.',
    barHeightPct: 40,
    isPositive: false,
  },
  {
    month: 'July',
    shortName: 'Jul',
    quarter: 'Q3',
    tendency: 'Bullish Bias',
    historicalAvgNote: 'Mid-Summer Relief Bounce',
    plainEnglishWhy:
      'After June rebalancing, July often delivers a calm summer relief bounce (and marked the July 2023 XRP clarity ruling).',
    barHeightPct: 68,
    isPositive: true,
  },
  {
    month: 'August',
    shortName: 'Aug',
    quarter: 'Q3',
    tendency: 'Defensive / Pullback',
    historicalAvgNote: 'Low-Volume Summer Chop',
    plainEnglishWhy:
      'Thinner late-summer order books mean sudden news can cause choppy wicks up and down—ideal for patience, not chasing.',
    barHeightPct: 38,
    isPositive: false,
  },
  {
    month: 'September',
    shortName: 'Sep',
    quarter: 'Q3',
    tendency: 'Defensive / Pullback',
    historicalAvgNote: 'The “Septembear” Discount',
    plainEnglishWhy:
      'Historically the weakest calendar month across both stocks and crypto as funds close fiscal Q3—often creating the best autumn buying floor.',
    barHeightPct: 30,
    isPositive: false,
  },
  {
    month: 'October',
    shortName: 'Oct',
    quarter: 'Q4',
    tendency: 'Bullish Bias',
    historicalAvgNote: '“Uptober” Q4 Awakening',
    plainEnglishWhy:
      'October kicks off Q4 institutional deployment and has historically been one of the highest win-rate green months in crypto.',
    barHeightPct: 88,
    isPositive: true,
  },
  {
    month: 'November',
    shortName: 'Nov',
    quarter: 'Q4',
    tendency: 'Bullish Bias',
    historicalAvgNote: 'Current Month · Peak Q4 Momentum',
    plainEnglishWhy:
      'November sits in the heart of Q4: in Bull years (2013, 2017, 2021) it marked major breakouts; in Bear/Reset years (2018, 2022, 2026) it forms major long-term accumulation floors.',
    barHeightPct: 92,
    isPositive: true,
    isCurrentMonth: true,
  },
  {
    month: 'December',
    shortName: 'Dec',
    quarter: 'Q4',
    tendency: 'Mixed / Transition',
    historicalAvgNote: 'Year-End Rally & Tax Harvesting',
    plainEnglishWhy:
      'Combines holiday "Santa Rally" optimism with late-December tax-loss harvesting before the new calendar year begins.',
    barHeightPct: 66,
    isPositive: true,
  },
];

export const MarketCyclesEducationModule: React.FC<MarketCyclesEducationModuleProps> = ({
  symbol = 'XRPUSDT',
  onSelectSymbol,
  candles = [],
  btcLivePrice = 91450,
  xrpLivePrice,
  xlmLivePrice,
  onEnterApp,
  onlyPart = 'all',
  sectionNumberOverride,
}) => {
  const [selectedPhase, setSelectedPhase] = useState<CyclePhaseKey>('accumulation');
  const [selectedCycleId, setSelectedCycleId] = useState<HistoricalCycleId>('cycle4');
  const [quarterFilter, setQuarterFilter] = useState<QuarterFilter>('all');

  const showBullVsBear = onlyPart === 'all' || onlyPart === 'bull_vs_bear';
  const showFourSeasons = onlyPart === 'all' || onlyPart === 'four_seasons';
  const showMonthlyRhythms = onlyPart === 'all' || onlyPart === 'monthly_rhythms';
  const showFourYearCycles = onlyPart === 'all' || onlyPart === 'four_year_cycles';

  const activePhase = useMemo(
    () => FOUR_CYCLE_PHASES.find((p) => p.key === selectedPhase) ?? FOUR_CYCLE_PHASES[0],
    [selectedPhase]
  );

  const activeHistoricalCycle = useMemo(
    () =>
      HISTORICAL_FOUR_YEAR_CYCLES.find((c) => c.id === selectedCycleId) ??
      HISTORICAL_FOUR_YEAR_CYCLES[3],
    [selectedCycleId]
  );

  const filteredMonths = useMemo(
    () =>
      quarterFilter === 'all'
        ? MONTHLY_SEASONALITY_DATA
        : MONTHLY_SEASONALITY_DATA.filter((m) => m.quarter === quarterFilter),
    [quarterFilter]
  );

  // Live technical pulse from the active candle feed so learners see how the live chart connects to Bull/Bear structure
  const liveTechnicalPulse = useMemo(() => {
    const activePrice =
      symbol === 'BTCUSDT'
        ? btcLivePrice
        : symbol === 'XRPUSDT'
        ? xrpLivePrice
        : xlmLivePrice;
    if (!candles || candles.length < 5) {
      return {
        activePrice,
        ema20: activePrice * 0.992,
        ema50: activePrice * 0.985,
        rsi14: 52.4,
        shortTermPosture: 'Bullish Higher-Low Structure',
        isBullishShortTerm: true,
      };
    }
    const last = candles[candles.length - 1];
    const ema20 = last.ema20 ?? last.close * 0.995;
    const ema50 = last.sma50 ?? last.close * 0.988;

    let gains = 0;
    let losses = 0;
    const slice = candles.slice(-15);
    for (let i = 1; i < slice.length; i++) {
      const diff = slice[i].close - slice[i - 1].close;
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const rs = losses === 0 ? 1.5 : gains / losses;
    const rsi14 = Math.min(85, Math.max(20, 100 - 100 / (1 + rs)));

    const isBullishShortTerm = last.close >= ema20 && ema20 >= ema50;

    let shortTermPosture = 'Sideways Accumulation Range';
    if (last.close > ema20 && ema20 > ema50) {
      shortTermPosture = 'Short-Term Bullish Staircase (Price Above 20 EMA & 50 SMA)';
    } else if (last.close < ema20 && ema20 < ema50) {
      shortTermPosture = 'Short-Term Bearish Pullback (Price Below 20 EMA & 50 SMA)';
    }

    return {
      activePrice: last.close,
      ema20,
      ema50,
      rsi14,
      shortTermPosture,
      isBullishShortTerm,
    };
  }, [candles, symbol, btcLivePrice, xrpLivePrice, xlmLivePrice]);

  return (
    <div className="space-y-8">
      {/* ============================================================================
       * SECTION 1: VISUAL ANATOMY OF A BULL MARKET VS. A BEAR MARKET
       * ============================================================================ */}
      {showBullVsBear && (
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{sectionNumberOverride ?? '01'}. Symphony Markets Academy Perspective</span>
              <span aria-hidden="true">·</span>
              <span>Ascending & Descending Eagle Markets</span>
              <span aria-hidden="true">·</span>
              <span>Traditional Bull & Bear History</span>
            </div>
            <h2
              className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 dark:text-white"
              style={{ textWrap: 'balance' }}
            >
              The Ascending Eagle & Descending Eagle Markets (And Why Wall Street Calls Them Bull & Bear)
            </h2>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
            Every student should know why traditional finance says <strong>“Bull”</strong> and <strong>“Bear”</strong>—yet inside <strong>Symphony Markets Academy</strong>, we view the market through the higher lens of an <strong>Eagle</strong>: soaring effortlessly upward on warm thermal currents, and descending with calm, purposeful focus to a chosen target point.
          </div>
        </div>

        {/* Symphony Markets Academy Core Distinction Banner */}
        <div className="rounded-xl border border-amber-200/90 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center text-xs sm:text-sm">
          <div className="md:col-span-4 space-y-1">
            <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              Why Symphony Markets Academy Teaches the Eagle Mindset
            </div>
            <div className="font-editorial text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Purposeful Flight Over Blind Force
            </div>
          </div>
          <div className="md:col-span-8 text-slate-700 dark:text-slate-300 leading-relaxed">
            Wall Street’s traditional animals describe <strong>blind combat</strong>—a bull violently thrusting its horns up, or a bear swiping its heavy paws down. An <strong>Eagle</strong> never wastes strength fighting the wind: in an <strong>Ascending Eagle Market</strong>, it spreads its wings on rising thermal patterns; in a <strong>Descending Eagle Market</strong>, it locks its eyes onto a precise <strong>Focal Point</strong> (such as its nest or a <strong>61.8% Fibonacci support zone</strong>) and glides down purposefully to accomplish its task before soaring again.
          </div>
        </div>

        {/* Two Visual Side-by-Side Anatomy Cards: ASCENDING EAGLE (BULL) vs DESCENDING EAGLE (BEAR) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* CARD A: THE ASCENDING EAGLE MARKET (TRADITIONAL: BULL MARKET) */}
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/15 p-5 sm:p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    <span>Soaring on Rising Thermal Patterns</span>
                    <span aria-hidden="true">·</span>
                    <span>Traditional Name: Bull Market</span>
                  </div>
                  <h3 className="font-editorial text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    The Ascending Eagle Market
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Symphony Markets Academy Name · Traditionally Called “The Bull Market” (Horns Thrusting Upward)
                  </p>
                </div>
                <ArrowUpRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>

              {/* Custom SVG Diagram: Ascending Eagle Thermal Staircase (Higher Highs & Higher Lows) */}
              <div className="rounded-lg border border-emerald-200/80 dark:border-emerald-500/25 bg-slate-950 p-3.5">
                <svg
                  viewBox="0 0 520 182"
                  className="w-full h-auto"
                  role="img"
                  aria-label="Visual diagram of an Ascending Eagle Market soaring upward on warm thermal currents through Higher Highs and Higher Lows"
                >
                  {/* Subtle grid lines */}
                  <line x1="20" y1="38" x2="500" y2="38" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="20" y1="88" x2="500" y2="88" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="20" y1="138" x2="500" y2="138" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Subtle Rising Thermal Updraft Spirals beneath HL1 and HL2 */}
                  <ellipse cx="155" cy="128" rx="22" ry="6" fill="none" stroke="#38BDF8" strokeOpacity="0.45" strokeDasharray="3 2" />
                  <ellipse cx="300" cy="96" rx="24" ry="6" fill="none" stroke="#38BDF8" strokeOpacity="0.45" strokeDasharray="3 2" />

                  {/* Rising Thermal Support Floor Line */}
                  <line
                    x1="35"
                    y1="154"
                    x2="475"
                    y2="54"
                    stroke="#10B981"
                    strokeWidth="1.5"
                    strokeDasharray="5 4"
                    opacity="0.7"
                  />
                  <text x="292" y="128" fill="#34D399" fontSize="10" fontFamily="monospace">
                    Rising Thermal Floor (Catch Updrafts Here)
                  </text>

                  {/* Ascending Eagle Flight Path */}
                  <polyline
                    points="35,148 105,100 155,122 245,66 300,90 405,30 445,50 488,20"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Stylized Eagle Wing Silhouette at Summit */}
                  <path
                    d="M472,22 Q482,12 492,20 Q498,11 506,17"
                    fill="none"
                    stroke="#FBBF24"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />

                  {/* Representative Candlesticks along the Thermal Staircase */}
                  <line x1="75" y1="106" x2="75" y2="136" stroke="#10B981" strokeWidth="2" />
                  <rect x="70" y="112" width="10" height="18" rx="1.5" fill="#10B981" />

                  <line x1="155" y1="108" x2="155" y2="130" stroke="#F43F5E" strokeWidth="2" />
                  <rect x="150" y="112" width="10" height="12" rx="1.5" fill="#F43F5E" />

                  <line x1="215" y1="70" x2="215" y2="104" stroke="#10B981" strokeWidth="2" />
                  <rect x="210" y="74" width="10" height="24" rx="1.5" fill="#10B981" />

                  <line x1="300" y1="76" x2="300" y2="98" stroke="#F43F5E" strokeWidth="2" />
                  <rect x="295" y="80" width="10" height="12" rx="1.5" fill="#F43F5E" />

                  <line x1="370" y1="36" x2="370" y2="72" stroke="#10B981" strokeWidth="2" />
                  <rect x="365" y="40" width="10" height="26" rx="1.5" fill="#10B981" />

                  {/* Key Nodes & Labels */}
                  <circle cx="105" cy="100" r="4" fill="#34D399" />
                  <text x="80" y="90" fill="#A7F3D0" fontSize="10" fontWeight="bold" fontFamily="monospace">
                    HH 1
                  </text>

                  <circle cx="155" cy="122" r="4.5" fill="#FBBF24" />
                  <text x="115" y="146" fill="#FDE68A" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                    HL 1 (♩ Thermal)
                  </text>

                  <circle cx="245" cy="66" r="4" fill="#34D399" />
                  <text x="225" y="56" fill="#A7F3D0" fontSize="10" fontWeight="bold" fontFamily="monospace">
                    HH 2 (♪)
                  </text>

                  <circle cx="300" cy="90" r="4.5" fill="#FBBF24" />
                  <text x="260" y="111" fill="#FDE68A" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                    HL 2 (♩ Thermal)
                  </text>

                  <circle cx="405" cy="30" r="4.5" fill="#34D399" />
                  <text x="364" y="20" fill="#6EE7B7" fontSize="10" fontWeight="bold" fontFamily="monospace">
                    HH 3 (♬ Soar)
                  </text>

                  {/* Top-left title inside SVG */}
                  <text x="24" y="24" fill="#34D399" fontSize="10.5" fontWeight="bold" fontFamily="sans-serif">
                    ▲ ASCENDING EAGLE: Soaring on Rising Thermals (HH + HL)
                  </text>
                </svg>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  <strong>Our Academy Distinction (Ascending Eagle):</strong> An eagle does not flap frantically to climb—it spreads its wings and catches <strong>warm rising thermal currents</strong>, circling effortlessly higher from one updraft to the next (<span className="font-mono">Higher Highs</span> and <span className="font-mono">Higher Lows</span>).
                </p>
                <p>
                  <strong>Traditional History (“Bull Market”):</strong> Historically, Wall Street called an uptrend a <em>Bull Market</em> because when a bull charges, it lowers its head and <strong>thrusts its horns upward into the air</strong>.
                </p>
                <p>
                  <strong>What Red Pullbacks Mean During Ascent:</strong> Notice `HL 1` and `HL 2` above—even a soaring eagle glides slightly inward to lock into the next rising thermal column (a <strong>Fibonacci 38.2%–61.8% musical breath</strong>) before ascending to a higher peak.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-200/80 dark:border-emerald-500/25 space-y-1.5 text-xs">
              <div className="font-semibold text-emerald-800 dark:text-emerald-300">
                Wise $5 Stewardship Rule in an Ascending Eagle Market:
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Never chase the tip of a vertical green spike in FOMO. Wait calmly for price to glide back onto its rising thermal support (`HL`), cap your risk at <strong>2% ($0.10 on $5)</strong>, and harvest partial gains at Fibonacci extension targets (`127.2%` & `161.8%`).
              </p>
            </div>
          </div>

          {/* CARD B: THE DESCENDING EAGLE MARKET (TRADITIONAL: BEAR MARKET) */}
          <div className="rounded-xl border border-sky-200 dark:border-sky-500/30 bg-sky-50/40 dark:bg-sky-950/15 p-5 sm:p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400">
                    <Compass className="w-4 h-4 shrink-0" />
                    <span>Purposeful Descent to a Focal Point</span>
                    <span aria-hidden="true">·</span>
                    <span>Traditional Name: Bear Market</span>
                  </div>
                  <h3 className="font-editorial text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    The Descending Eagle Market
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Symphony Markets Academy Name · Traditionally Called “The Bear Market” (Paws Swiping Downward)
                  </p>
                </div>
                <ArrowDownRight className="w-6 h-6 text-sky-600 dark:text-sky-400 shrink-0" />
              </div>

              {/* Custom SVG Diagram: Descending Eagle Glide Path to Focal Point (Nest / 61.8% / Accumulation Floor) */}
              <div className="rounded-lg border border-sky-200/80 dark:border-sky-500/25 bg-slate-950 p-3.5">
                <svg
                  viewBox="0 0 520 182"
                  className="w-full h-auto"
                  role="img"
                  aria-label="Visual diagram of a Descending Eagle Market gliding purposefully toward a precise focal point at the support nest"
                >
                  {/* Subtle grid lines */}
                  <line x1="20" y1="38" x2="500" y2="38" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="20" y1="88" x2="500" y2="88" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="20" y1="138" x2="500" y2="138" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Purposeful Glide Vector Line toward Focal Point */}
                  <line
                    x1="45"
                    y1="26"
                    x2="365"
                    y2="144"
                    stroke="#38BDF8"
                    strokeWidth="1.5"
                    strokeDasharray="5 4"
                    opacity="0.7"
                  />
                  <text x="152" y="50" fill="#BAE6FD" fontSize="10" fontFamily="monospace">
                    Focused Descent Corridor (Eyes Locked on Target)
                  </text>

                  {/* Descending Staircase Path: Peak -> LL1 -> LH1 -> LL2 -> LH2 -> Focal Point Nest */}
                  <polyline
                    points="35,26 105,92 150,64 230,128 275,102 365,146 435,144 492,126"
                    fill="none"
                    stroke="#F43F5E"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Green Liftoff from Focal Point Nest */}
                  <polyline
                    points="365,146 435,144 492,126"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Highlighted Focal Point Nest / Value Zone */}
                  <rect
                    x="338"
                    y="128"
                    width="162"
                    height="32"
                    rx="5"
                    fill="#F59E0B"
                    fillOpacity="0.16"
                    stroke="#FBBF24"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />
                  {/* Concentric Focal-Point Bullseye Rings at 365, 146 */}
                  <circle cx="365" cy="146" r="11" fill="none" stroke="#FBBF24" strokeWidth="1.3" />
                  <circle cx="365" cy="146" r="5" fill="#FBBF24" />
                  <text x="342" y="121" fill="#FDE68A" fontSize="10" fontWeight="bold" fontFamily="monospace">
                    ◎ Focal Point Nest (61.8% / Value Floor)
                  </text>

                  {/* Representative Candlesticks */}
                  <line x1="75" y1="46" x2="75" y2="86" stroke="#F43F5E" strokeWidth="2" />
                  <rect x="70" y="52" width="10" height="28" rx="1.5" fill="#F43F5E" />

                  <line x1="150" y1="56" x2="150" y2="78" stroke="#10B981" strokeWidth="2" />
                  <rect x="145" y="62" width="10" height="12" rx="1.5" fill="#10B981" />

                  <line x1="195" y1="82" x2="195" y2="122" stroke="#F43F5E" strokeWidth="2" />
                  <rect x="190" y="86" width="10" height="28" rx="1.5" fill="#F43F5E" />

                  {/* Nodes & Labels */}
                  <circle cx="105" cy="92" r="4" fill="#FB7185" />
                  <text x="82" y="110" fill="#FECDD3" fontSize="10" fontWeight="bold" fontFamily="monospace">
                    LL 1
                  </text>

                  <circle cx="150" cy="64" r="4" fill="#38BDF8" />
                  <text x="130" y="54" fill="#BAE6FD" fontSize="10" fontWeight="bold" fontFamily="monospace">
                    LH 1
                  </text>

                  <circle cx="230" cy="128" r="4" fill="#FB7185" />
                  <text x="206" y="146" fill="#FECDD3" fontSize="10" fontWeight="bold" fontFamily="monospace">
                    LL 2
                  </text>

                  <circle cx="275" cy="102" r="4" fill="#38BDF8" />
                  <text x="262" y="92" fill="#BAE6FD" fontSize="10" fontWeight="bold" fontFamily="monospace">
                    LH 2
                  </text>

                  <text x="24" y="170" fill="#BAE6FD" fontSize="10.5" fontWeight="bold" fontFamily="sans-serif">
                    ▼ DESCENDING EAGLE: Purposeful Glide to Focal Point (♩ Cello Rest)
                  </text>
                </svg>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  <strong>Our Academy Distinction (Descending Eagle):</strong> An eagle never falls out of the sky in panic. When an eagle descends, it folds its wings with precision, locks onto a <strong>Focal Point</strong>—whether returning to its nest or gathering nourishment—and glides straight to that calculated destination to <strong>accomplish a specific task</strong>.
                </p>
                <p>
                  <strong>Traditional History (“Bear Market”):</strong> Historically, Wall Street called a downtrend a <em>Bear Market</em> because a bear stands up and <strong>swipes its heavy paws downward toward the ground</strong> (<span className="font-mono">Lower Highs</span> and <span className="font-mono">Lower Lows</span>).
                </p>
                <p>
                  <strong>Why Purposeful Descent Is a Gift for Prepared Stewards:</strong> Unprepared gamblers fear downward movement, whereas trained Symphony stewards recognize the market is descending toward a mathematical <strong>Focal Point</strong> (the <strong>61.8% Golden Pocket</strong> or <strong>Accumulation Nest</strong>) where true value is gathered.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-sky-200/80 dark:border-sky-500/25 space-y-1.5 text-xs">
              <div className="font-semibold text-sky-900 dark:text-sky-300">
                Wise $5 Stewardship Rule in a Descending Eagle Market:
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Do not step in mid-air while price is still descending. Keep your assets safe in self-custody (1x Spot, zero leverage) and wait patiently until the eagle lands squarely on its <strong>Focal Point Nest</strong> and confirms support before acting.
              </p>
            </div>
          </div>
        </div>

        {/* Quick 5-Row Visual Comparison Strip */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4 font-semibold">Academy & Market Dimension</th>
                <th className="py-3 px-4 font-semibold text-emerald-700 dark:text-emerald-400">
                  ▲ Ascending Eagle Market (Traditional: Bull)
                </th>
                <th className="py-3 px-4 font-semibold text-sky-700 dark:text-sky-400">
                  ▼ Descending Eagle Market (Traditional: Bear)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                  1. Eagle Flight vs. Wall Street Name
                </td>
                <td className="py-2.5 px-4">
                  Soars upward on warm thermal currents (Wall Street: “Bull horns thrusting up”)
                </td>
                <td className="py-2.5 px-4">
                  Descends purposefully to a chosen Focal Point / Nest (Wall Street: “Bear paws swiping down”)
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                  2. Candlestick & Fibonacci Structure
                </td>
                <td className="py-2.5 px-4">
                  Higher Highs (HH) & Higher Lows (HL); projects upward to 100%, 127.2% & 161.8% Φ targets
                </td>
                <td className="py-2.5 px-4">
                  Lower Highs (LH) & Lower Lows (LL); glides into 61.8% Golden Pocket or Winter Accumulation Nest
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                  3. Crowd Emotion vs. Steward Focus
                </td>
                <td className="py-2.5 px-4">
                  Crowd chases hype peaks; Steward rides thermals calmly and scales out at Fibonacci walls
                </td>
                <td className="py-2.5 px-4">
                  Crowd panics in fear; Steward observes the focal destination and prepares patient Spot entries
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                  4. Scam Trap to Guard Against
                </td>
                <td className="py-2.5 px-4">
                  Fake AI trading bots, VIP signal groups, & meme-coin rug pulls
                </td>
                <td className="py-2.5 px-4">
                  Centralized platforms freezing withdrawals & fake “wallet recovery” phishing
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                  5. Symphony Musical Marker
                </td>
                <td className="py-2.5 px-4 font-mono">
                  ♫ Ascending Golden Harp (C4 → E5 → 161.8% Φ Finale)
                </td>
                <td className="py-2.5 px-4 font-mono">
                  ♩ Grounding Bowed Cello & 8:5 Golden Pocket Pickup
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      )}

      {/* ============================================================================
       * SECTION 2: THE 4 EMOTIONAL & SEASONAL PHASES OF EVERY MARKET CYCLE
       * ============================================================================ */}
      {showFourSeasons && (
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{sectionNumberOverride ?? '02'}. Interactive 4-Season Wave</span>
              <span aria-hidden="true">·</span>
              <span>Accumulation → Markup → Distribution → Markdown</span>
            </div>
            <h2
              className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 dark:text-white"
              style={{ textWrap: 'balance' }}
            >
              How a Complete Market Cycle Flows Through 4 Seasons
            </h2>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Click any of the <strong>4 Seasons</strong> below to inspect how crowd emotion, chart structure, and your $5 wallet strategy shift across the wave:
          </p>
        </div>

        {/* Interactive SVG Wave of the 4 Seasons */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 sm:p-5 space-y-4">
          <svg
            viewBox="0 0 880 210"
            className="w-full h-auto"
            role="img"
            aria-label="Interactive 4-Phase Market Cycle Wave showing Accumulation, Markup, Distribution, and Markdown"
          >
            {/* 4 Vertical Phase Columns */}
            <rect
              x="15"
              y="15"
              width="205"
              height="180"
              rx="8"
              fill={selectedPhase === 'accumulation' ? '#0EA5E9' : '#1E293B'}
              fillOpacity={selectedPhase === 'accumulation' ? '0.18' : '0.25'}
              stroke={selectedPhase === 'accumulation' ? '#38BDF8' : '#334155'}
              strokeWidth={selectedPhase === 'accumulation' ? '2' : '1'}
              className="cursor-pointer"
              onClick={() => setSelectedPhase('accumulation')}
            />
            <rect
              x="230"
              y="15"
              width="205"
              height="180"
              rx="8"
              fill={selectedPhase === 'markup' ? '#10B981' : '#1E293B'}
              fillOpacity={selectedPhase === 'markup' ? '0.18' : '0.25'}
              stroke={selectedPhase === 'markup' ? '#34D399' : '#334155'}
              strokeWidth={selectedPhase === 'markup' ? '2' : '1'}
              className="cursor-pointer"
              onClick={() => setSelectedPhase('markup')}
            />
            <rect
              x="445"
              y="15"
              width="205"
              height="180"
              rx="8"
              fill={selectedPhase === 'distribution' ? '#F59E0B' : '#1E293B'}
              fillOpacity={selectedPhase === 'distribution' ? '0.18' : '0.25'}
              stroke={selectedPhase === 'distribution' ? '#FBBF24' : '#334155'}
              strokeWidth={selectedPhase === 'distribution' ? '2' : '1'}
              className="cursor-pointer"
              onClick={() => setSelectedPhase('distribution')}
            />
            <rect
              x="660"
              y="15"
              width="205"
              height="180"
              rx="8"
              fill={selectedPhase === 'markdown' ? '#F43F5E' : '#1E293B'}
              fillOpacity={selectedPhase === 'markdown' ? '0.18' : '0.25'}
              stroke={selectedPhase === 'markdown' ? '#FB7185' : '#334155'}
              strokeWidth={selectedPhase === 'markdown' ? '2' : '1'}
              className="cursor-pointer"
              onClick={() => setSelectedPhase('markdown')}
            />

            {/* Phase Titles at Top of Columns */}
            <text x="30" y="38" fill="#7DD3FC" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
              1. ACCUMULATION (Spring)
            </text>
            <text x="30" y="54" fill="#94A3B8" fontSize="10" fontFamily="monospace">
              Smart Money Plants Seeds
            </text>

            <text x="245" y="38" fill="#6EE7B7" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
              2. MARKUP / BULL (Summer)
            </text>
            <text x="245" y="54" fill="#94A3B8" fontSize="10" fontFamily="monospace">
              Higher Highs & Breakouts
            </text>

            <text x="460" y="38" fill="#FDE68A" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
              3. DISTRIBUTION (Autumn)
            </text>
            <text x="460" y="54" fill="#94A3B8" fontSize="10" fontFamily="monospace">
              Euphoria Top & Profit Harvest
            </text>

            <text x="675" y="38" fill="#FECDD3" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
              4. MARKDOWN / BEAR (Winter)
            </text>
            <text x="675" y="54" fill="#94A3B8" fontSize="10" fontFamily="monospace">
              Leverage Reset & Discount
            </text>

            {/* Continuous Cycle Sine Curve across all 4 phases */}
            <path
              d="M 30 165 C 90 168, 160 164, 220 152 C 290 135, 360 75, 435 55 C 495 38, 575 38, 645 65 C 715 95, 780 155, 850 165"
              fill="none"
              stroke="url(#cycleWaveGrad)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="cycleWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="38%" stopColor="#10B981" />
                <stop offset="68%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#F43F5E" />
              </linearGradient>
            </defs>

            {/* Interactive Nodes along the curve */}
            <circle cx="118" cy="164" r="7" fill="#38BDF8" stroke="#0F172A" strokeWidth="2" />
            <text x="72" y="185" fill="#E2E8F0" fontSize="10" fontFamily="monospace">
              ♩ Flat Value Floor
            </text>

            <circle cx="335" cy="100" r="7" fill="#10B981" stroke="#0F172A" strokeWidth="2" />
            <text x="275" y="130" fill="#A7F3D0" fontSize="10" fontFamily="monospace">
              ♫ Trend Confirmed
            </text>

            <circle cx="545" cy="44" r="7" fill="#F59E0B" stroke="#0F172A" strokeWidth="2" />
            <text x="492" y="76" fill="#FDE68A" fontSize="10" fontFamily="monospace">
              ♬ Maximum FOMO Warning
            </text>

            <circle cx="765" cy="135" r="7" fill="#F43F5E" stroke="#0F172A" strokeWidth="2" />
            <text x="700" y="175" fill="#FECDD3" fontSize="10" fontFamily="monospace">
              𝄽 Late-2026 Value Reset
            </text>
          </svg>

          {/* 4 Interactive Phase Selector Buttons */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {FOUR_CYCLE_PHASES.map((phase) => {
              const isSelected = phase.key === selectedPhase;
              return (
                <button
                  key={phase.key}
                  type="button"
                  onClick={() => setSelectedPhase(phase.key)}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-amber-400 text-white'
                      : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-mono text-amber-400">{phase.seasonLabel}</div>
                  <div className="text-xs sm:text-sm font-bold text-white mt-0.5 whitespace-nowrap truncate">
                    {phase.title.split(' (')[0]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Phase Detail Panel */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <div className={`text-xs font-semibold ${activePhase.badgeTextClass}`}>
                {activePhase.seasonLabel} · {activePhase.musicalTempo}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {activePhase.title}
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {activePhase.subtitle}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-900 dark:text-white">
                1. Crowd Emotion & News
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {activePhase.crowdPsychology}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-900 dark:text-white">
                2. What the Chart Looks Like
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {activePhase.chartStructure}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-semibold text-rose-700 dark:text-rose-400">
                3. No-Scam Zone Alert
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {activePhase.scamDangerLevel}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                4. Your $5 Self-Custody Action
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {activePhase.fiveDollarHabit}
              </p>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ============================================================================
       * SECTION 3: CALENDAR SEASONALITY — TIMES OF THE YEAR & MONTHLY RHYTHMS
       * ============================================================================ */}
      {showMonthlyRhythms && (
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>{sectionNumberOverride ?? '03'}. Time-of-Year & Monthly Calendar Rhythms</span>
              <span aria-hidden="true">·</span>
              <span>12-Month Seasonality + Day 1–30 Rhythm</span>
            </div>
            <h2
              className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 dark:text-white"
              style={{ textWrap: 'balance' }}
            >
              How the Market Moves by Time of the Year & Time of the Month
            </h2>
          </div>

          {/* Quarter Filter Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            {(['all', 'Q1', 'Q2', 'Q3', 'Q4'] as QuarterFilter[]).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuarterFilter(q)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  quarterFilter === q
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {q === 'all' ? 'All 12 Months' : q}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Quarterly Overview Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 space-y-1.5">
            <div className="font-mono font-bold text-sky-700 dark:text-sky-400">
              Q1 (Jan – Mar) · New Year & Tax Prep
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              January & February bring fresh annual allocations, while <strong>March</strong> often dips as traders raise cash for April tax payments.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 space-y-1.5">
            <div className="font-mono font-bold text-amber-700 dark:text-amber-400">
              Q2 (Apr – Jun) · Spring Bounce → “Sell in May”
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong>April</strong> historically bounces after tax day, while late May and June transition into quieter summer institutional volume.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 space-y-1.5">
            <div className="font-mono font-bold text-rose-700 dark:text-rose-400">
              Q3 (Jul – Sep) · Summer Chop & “Septembear”
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong>August & September</strong> are historically the softest months of the year—creating the best late-summer discount floors for patient buyers.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1.5">
            <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              Q4 (Oct – Dec) · “Uptober” & November Power Window
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Historically the <strong>strongest 3-month season</strong> in crypto. We are currently in <strong>November (Q4)</strong>—when major trend moves or cycle floors lock in.
            </p>
          </div>
        </div>

        {/* 12-Month Visual Seasonality Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {filteredMonths.map((item) => (
            <div
              key={item.month}
              className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                item.isCurrentMonth
                  ? 'border-amber-400 dark:border-amber-400 bg-amber-50/50 dark:bg-amber-950/25'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {item.month}
                    {item.isCurrentMonth ? ' (NOW)' : ''}
                  </span>
                  <span
                    className={`font-mono text-[11px] font-semibold ${
                      item.tendency === 'Bullish Bias'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : item.tendency === 'Defensive / Pullback'
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-sky-700 dark:text-sky-400'
                    }`}
                  >
                    {item.quarter} · {item.tendency}
                  </span>
                </div>

                {/* Visual Strength Bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${item.barHeightPct}%` }}
                    className={`h-full rounded-full ${
                      item.tendency === 'Bullish Bias'
                        ? 'bg-emerald-500'
                        : item.tendency === 'Defensive / Pullback'
                        ? 'bg-rose-500'
                        : 'bg-sky-500'
                    }`}
                  />
                </div>

                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {item.historicalAvgNote}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.plainEnglishWhy}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Within-the-Month Rhythm (Day 1 to Day 30) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-5 space-y-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-sky-700 dark:text-sky-400">
              Inside Every Single Month · The 4-Week Monthly Cycle (Days 1 – 30)
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              How Prices Behave From the 1st of the Month to the 30th
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                Week 1 (Days 1–7) · Payday & Auto-Buy Inflows
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Start-of-month salaries, retirement contributions, and recurring Spot buys often give the first week of the month an upward liquidity boost.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-mono font-bold text-amber-700 dark:text-amber-400">
                Week 2 (Days 10–15) · CPI & Inflation News Wicks
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                U.S. inflation (CPI) and Federal Reserve updates usually drop mid-month, causing fast 1-hour stop-hunt wicks both up and down.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-mono font-bold text-rose-700 dark:text-rose-400">
                Week 4 (Days 22–26) · Last-Friday Options Expiry
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                On the <strong>last Friday of every month</strong>, billions in monthly Options and Futures contracts expire—often pinning or shaking out prices before a fresh move.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-mono font-bold text-sky-700 dark:text-sky-400">
                Days 28–31 · Monthly Candle Close
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Institutions rebalance portfolios on the final day of the month. The <strong>Monthly Candle Close</strong> is the #1 compass for confirming long-term Bull vs. Bear trends.
              </p>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ============================================================================
       * SECTION 4: THE PAST FOUR 4-YEAR CYCLES (2012–2028) & WHERE WE ARE RIGHT NOW
       * ============================================================================ */}
      {showFourYearCycles && (
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{sectionNumberOverride ?? '04'}. The 4-Year Halving Clock (2012 – 2028)</span>
              <span aria-hidden="true">·</span>
              <span>Live Cycle GPS: November 2026</span>
            </div>
            <h2
              className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 dark:text-white"
              style={{ textWrap: 'balance' }}
            >
              The Past Four 4-Year Cycles & Where the Market Is Right Now (Late 2026)
            </h2>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
            Every 4 years (210,000 blocks), the new supply of Bitcoin created every 10 minutes is <strong>cut in half</strong>—creating a predictable 4-year rhythm across the entire crypto market.
          </div>
        </div>

        {/* Dedicated 4-Year Cycle GPS & Survival Finance Video Lessons */}
        <SectionPromoVideoBanner
          sectionBadge="Symphony Markets Academy · 4-Year Cycle GPS & Survival Defense Films"
          headline="The Antidote to Loose Cycles (6:14) & Survival Finance (5:07)"
          description="Watch how open-math stewardship, KSBC Gold RWA reserves, and the Live 16-Year Logarithmic Cycle Map (2012–2028) anchor students in Late Year 3 (November 2026 Value Reset & Accumulation Bridge)—so you never buy peak hype or panic-sell engineered lows."
          accentTone="amber"
          tracks={[
            {
              id: 'cycle_antidote_loose_cycles',
              tabLabel: '01 · The Antidote to Loose Cycles (6:14)',
              title: 'Symphony Markets Academy — The Antidote to Loose Cycles',
              duration: '6:14',
              videoSrc: '/assets/The_Antidote_to_Loose_Cycles.mp4',
              driveFileId: '1RCuSGFs76KSTkdQBPDXrSN5ND8y_ZBBi',
              posterSrc: noScamCompassImg,
            },
            {
              id: 'cycle_survival_finance',
              tabLabel: '02 · Survival Finance & Traditional Markets (5:07)',
              title: 'Symphony Markets Academy — Survival Finance & Traditional Markets',
              duration: '5:07',
              videoSrc: '/assets/Survival_Finance_Traditional_Markets.mp4',
              driveFileId: '1pCtFdKXo6Fhd88QnSCoH95qlRTXAf5Dj',
              posterSrc: founderDeskImg,
            },
          ]}
        />

        {/* Visual 4-Year Rhythm Formula Strip (Year 1 -> Year 2 -> Year 3 -> Year 4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-500/30 bg-sky-50/40 dark:bg-sky-950/20 space-y-1">
            <div className="font-mono font-bold text-sky-700 dark:text-sky-400">
              Year 1 of Cycle (2012, 2016, 2020, 2024)
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              Halving Supply Cut & Launchpad
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              New coin issuance drops 50%. Prices break out of their Winter range and establish Higher Lows.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1">
            <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              Year 2 of Cycle (2013, 2017, 2021, 2025)
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              Post-Halving Bull Expansion Wave
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              The supply shock meets global demand. Historically delivers the steepest Bull Market rally and payment-rail breakouts.
            </p>
          </div>

          <div className="p-4 rounded-xl border-2 border-amber-400 dark:border-amber-400 bg-amber-50/60 dark:bg-amber-950/30 space-y-1">
            <div className="font-mono font-bold text-amber-800 dark:text-amber-300">
              Year 3 of Cycle (2014, 2018, 2022, 2026 ← NOW)
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              Bear Reset & Value Consolidation Floor
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>Where We Are Today (Nov 2026):</strong> Speculative froth cools off, weak hands exit, and late-Year-3 forms the generational accumulation floor.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 space-y-1">
            <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
              Year 4 of Cycle (2015, 2019, 2023, 2027 Ahead)
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              Spring Recovery & Pre-Halving Runway
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Smart money finishes accumulating the Year-3 floor and prices steadily climb ahead of the next Halving (Spring 2028).
            </p>
          </div>
        </div>

        {/* Multi-Cycle SVG Timeline (2012 -> 2028) with Glowing "YOU ARE HERE: NOV 2026" Marker */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
            <span className="font-semibold text-white">
              Visual 16-Year Logarithmic Cycle Map (2012 – 2028)
            </span>
            <span className="font-mono text-amber-300">
              ★ Current Position: Late 2026 (Cycle 4 · Year 3 Value Reset & Accumulation Bridge)
            </span>
          </div>

          <svg
            viewBox="0 0 920 220"
            className="w-full h-auto"
            role="img"
            aria-label="16-year chart of the four 4-year crypto cycles from 2012 to 2028 showing Halvings, Bull Peaks, Bear Floors, and the current November 2026 position"
          >
            {/* Horizontal grid lines */}
            <line x1="30" y1="40" x2="890" y2="40" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="30" y1="95" x2="890" y2="95" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="30" y1="150" x2="890" y2="150" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="30" y1="190" x2="890" y2="190" stroke="#334155" strokeWidth="1" />

            {/* Vertical Cycle Dividers (2012, 2016, 2020, 2024, 2028) */}
            <line x1="50" y1="20" x2="50" y2="190" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 4" />
            <text x="35" y="208" fill="#7DD3FC" fontSize="10" fontFamily="monospace">2012 Halving</text>

            <line x1="255" y1="20" x2="255" y2="190" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 4" />
            <text x="225" y="208" fill="#7DD3FC" fontSize="10" fontFamily="monospace">2016 Halving</text>

            <line x1="460" y1="20" x2="460" y2="190" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 4" />
            <text x="430" y="208" fill="#7DD3FC" fontSize="10" fontFamily="monospace">2020 Halving</text>

            <line x1="665" y1="20" x2="665" y2="190" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 4" />
            <text x="635" y="208" fill="#7DD3FC" fontSize="10" fontWeight="bold" fontFamily="monospace">2024 Halving</text>

            <line x1="875" y1="20" x2="875" y2="190" stroke="#64748B" strokeWidth="1" strokeDasharray="4 4" />
            <text x="820" y="208" fill="#94A3B8" fontSize="10" fontFamily="monospace">2028 Halving</text>

            {/* Structural Rising Long-Term Logarithmic Floor Line */}
            <line
              x1="50"
              y1="184"
              x2="875"
              y2="68"
              stroke="#10B981"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              opacity="0.55"
            />
            <text x="530" y="138" fill="#34D399" fontSize="10" fontFamily="monospace">
              Higher Structural Cycle Floors (2015 → 2018 → 2022 → 2026)
            </text>

            {/* Historical Curve (2012 to Nov 2026) */}
            <path
              d="M 50 182 Q 85 125, 110 130 Q 145 138, 175 170 Q 215 168, 255 152 Q 295 85, 320 92 Q 355 105, 380 142 Q 420 138, 460 120 Q 505 55, 535 58 Q 570 68, 595 112 Q 630 105, 665 86 Q 710 28, 740 34 Q 770 45, 795 82"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Projected 2027–2028 Runway Dashed Path */}
            <path
              d="M 795 82 Q 835 76, 875 48"
              fill="none"
              stroke="#FBBF24"
              strokeWidth="2.5"
              strokeDasharray="5 4"
            />

            {/* Peak & Floor Callout Dots */}
            {/* Cycle 1 */}
            <circle cx="110" cy="130" r="4" fill="#10B981" />
            <text x="82" y="120" fill="#A7F3D0" fontSize="9.5" fontFamily="monospace">2013 ($1.1k)</text>
            <circle cx="175" cy="170" r="4" fill="#F43F5E" />
            <text x="152" y="184" fill="#FDA4AF" fontSize="9.5" fontFamily="monospace">2014–15 ($170)</text>

            {/* Cycle 2 */}
            <circle cx="320" cy="92" r="4" fill="#10B981" />
            <text x="285" y="80" fill="#A7F3D0" fontSize="9.5" fontFamily="monospace">2017 ($19.8k)</text>
            <circle cx="380" cy="142" r="4" fill="#F43F5E" />
            <text x="355" y="158" fill="#FDA4AF" fontSize="9.5" fontFamily="monospace">2018 ($3.2k)</text>

            {/* Cycle 3 */}
            <circle cx="535" cy="58" r="4" fill="#10B981" />
            <text x="500" y="46" fill="#A7F3D0" fontSize="9.5" fontFamily="monospace">2021 ($69k)</text>
            <circle cx="595" cy="112" r="4" fill="#F43F5E" />
            <text x="568" y="126" fill="#FDA4AF" fontSize="9.5" fontFamily="monospace">Nov 2022 ($15.5k)</text>

            {/* Cycle 4 Peak & YOU ARE HERE (Nov 2026) */}
            <circle cx="735" cy="33" r="4.5" fill="#10B981" />
            <text x="690" y="22" fill="#A7F3D0" fontSize="9.5" fontFamily="monospace">2025 Wave</text>

            {/* YOU ARE HERE MARKER (Late 2026) */}
            <circle cx="795" cy="82" r="9" fill="#F59E0B" fillOpacity="0.3" />
            <circle cx="795" cy="82" r="5.5" fill="#FBBF24" stroke="#0F172A" strokeWidth="2" />
            <rect x="705" y="94" width="175" height="24" rx="4" fill="#F59E0B" />
            <text x="713" y="110" fill="#0F172A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              ★ YOU ARE HERE: NOV 2026
            </text>
          </svg>

          {/* 4 Historical Cycle Selector Tabs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {HISTORICAL_FOUR_YEAR_CYCLES.map((cycle) => {
              const isSelected = cycle.id === selectedCycleId;
              return (
                <button
                  key={cycle.id}
                  type="button"
                  onClick={() => setSelectedCycleId(cycle.id)}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-amber-400 text-white'
                      : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-mono text-amber-400">
                    {cycle.years} {cycle.isCurrent ? '· ★ CURRENT' : ''}
                  </div>
                  <div className="text-xs font-bold text-white mt-0.5 truncate">
                    {cycle.eraTitle.split(' · ')[1]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected 4-Year Cycle Deep Dive Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <div className="text-xs font-mono font-semibold text-amber-700 dark:text-amber-400">
                {activeHistoricalCycle.years} · Halving: {activeHistoricalCycle.halvingDate} ({activeHistoricalCycle.blockReward})
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {activeHistoricalCycle.eraTitle}
              </h3>
            </div>
            <div className="text-xs font-mono text-sky-700 dark:text-sky-400">
              {activeHistoricalCycle.btcCycleRange}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="font-semibold text-sky-700 dark:text-sky-400">Year 1 (Halving Launch)</div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {activeHistoricalCycle.year1Summary}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="font-semibold text-emerald-700 dark:text-emerald-400">Year 2 (Bull Expansion)</div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {activeHistoricalCycle.year2PeakSummary}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="font-semibold text-rose-700 dark:text-rose-400">Year 3 (Reset / Floor)</div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {activeHistoricalCycle.year3BearSummary}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="font-semibold text-amber-700 dark:text-amber-400">Year 4 (Recovery Bridge)</div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {activeHistoricalCycle.year4BottomSummary}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <strong className="text-slate-900 dark:text-white">XRP & Stellar (XLM) in This Cycle: </strong>
              <span className="text-slate-600 dark:text-slate-300">{activeHistoricalCycle.xrpXlmContext}</span>
            </div>
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <strong className="text-emerald-700 dark:text-emerald-400">Core No-Scam Takeaway: </strong>
              <span className="text-slate-600 dark:text-slate-300">{activeHistoricalCycle.keyLesson}</span>
            </div>
          </div>
        </div>

        {/* WHERE THE MARKET IS RIGHT NOW (LATE 2026) + LIVE XRP/XLM TELEMETRY */}
        <div className="rounded-xl border-2 border-amber-400/80 dark:border-amber-400/60 bg-gradient-to-r from-amber-50/80 via-white to-sky-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300">
                ★ LIVE CYCLE GPS · NOVEMBER 2026 (CYCLE 4 · YEAR 3 · Q4)
              </div>
              <h3 className="font-editorial text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Where Is the Market Right Now—and What Should a Wise Learner Do Today?
              </h3>
            </div>

            {onSelectSymbol && (
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onSelectSymbol('BTCUSDT')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    symbol === 'BTCUSDT'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  BTC ($
                  {(btcLivePrice || 91450).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  )
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSymbol('XRPUSDT')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    symbol === 'XRPUSDT'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  XRP (${(xrpLivePrice || 2.42).toFixed(4)})
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSymbol('XLMUSDT')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    symbol === 'XLMUSDT'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  XLM (${(xlmLivePrice || 0.415).toFixed(4)})
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left 7 Cols: Plain-English Macro Position Explanation */}
            <div className="lg:col-span-7 space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>1. The 4-Year Clock Position (Late Year 3 of Cycle 4):</strong> Look at the historical years <strong>November 2014</strong>, <strong>November 2018</strong>, and <strong>November 2022</strong>. Every single time, late Year 3 of the 4-year cycle was the <strong>Value Reset & Accumulation Bridge</strong>—the exact window where the post-halving hype had cooled off and smart, patient Spot learners built their positions before the Year 4 recovery (2015, 2019, 2023, and now <strong>2027 ahead</strong>).
              </p>
              <p>
                <strong>2. The Calendar Position (November / Q4 Seasonality):</strong> We are in <strong>November (Q4)</strong>, historically the most active institutional quarter of the year, transitioning from Year-3 consolidation into the pre-2027 recovery runway.
              </p>
              <p>
                <strong>3. How This Cycle Is Different (Real Utility & Self-Custody):</strong> Unlike 2018 or 2022, regulated Spot ETFs, enterprise stablecoins (RLUSD, USDC), ISO 20022 payment rails (<strong>XRP & XLM</strong>), and physical-gold RWA anchors (<strong>KSBC Gold</strong>) now provide a much stronger institutional support floor.
              </p>
            </div>

            {/* Right 5 Cols: Live Chart Telemetry & 3-Step Action Checklist */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 flex flex-col justify-between space-y-4 text-xs">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Live{' '}
                    {symbol === 'BTCUSDT'
                      ? 'BTC/USDT'
                      : symbol === 'XRPUSDT'
                      ? 'XRP/USDT'
                      : 'XLM/USDT'}{' '}
                    Technical Pulse
                  </span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                    ${liveTechnicalPulse.activePrice.toFixed(symbol === 'BTCUSDT' ? 2 : 4)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono tabular-nums text-[11px]">
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                    <div className="text-slate-500">20 EMA</div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      ${liveTechnicalPulse.ema20.toFixed(symbol === 'BTCUSDT' ? 2 : 4)}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                    <div className="text-slate-500">50 EMA</div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      ${liveTechnicalPulse.ema50.toFixed(symbol === 'BTCUSDT' ? 2 : 4)}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                    <div className="text-slate-500">RSI (14)</div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      {liveTechnicalPulse.rsi14.toFixed(1)}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <strong>Short-Term Chart Posture:</strong> {liveTechnicalPulse.shortTermPosture}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>3-Step Game Plan for Right Now:</span>
                  </div>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                    <li>• <strong>1x Spot Only:</strong> Zero Futures leverage during Year-3 volatility.</li>
                    <li>• <strong>$0.10 Safety Net (2% Risk):</strong> Practice patient entries on Fibonacci pullbacks.</li>
                    <li>• <strong>Self-Custody First:</strong> Keep your keys in your own wallet, never on a custodial app.</li>
                  </ul>
                </div>
              </div>

              {onEnterApp && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => onEnterApp('risk-chart')}
                    className="flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors text-center cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Practice on Live Risk Chart →
                  </button>
                  <button
                    type="button"
                    onClick={() => onEnterApp('skill-desk')}
                    className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Layers className="w-3.5 h-3.5 inline mr-1" />
                    Time Machine
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      )}
    </div>
  );
};
