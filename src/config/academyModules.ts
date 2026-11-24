import { AcademyTierLevel } from '../components/AcademyTierGateAndAdminBar';
import { MarketCyclePartId } from '../components/MarketCyclesEducationModule';

export type AcademyModuleId =
  | 'foundations'
  | 'fibonacci'
  | 'trade-desk'
  | 'library'
  | 'ksbc'
  | 'forex'
  | 'bonus-labs';

export type WorkshopChapterId =
  | 'start-here'
  | 'coin-history'
  | 'cycle-bull-vs-bear'
  | 'cycle-four-seasons'
  | 'cycle-monthly-rhythms'
  | 'cycle-four-year-clock'
  | 'market-symphony'
  | 'candlestick-guide'
  | 'fibonacci-symphony-geometry'
  | 'fibonacci-symphony-markers'
  | 'ai-buy-sell-helper'
  | 'portfolio-ledger'
  | 'skill-desk'
  | 'risk-chart'
  | 'ten-set-auto-trader'
  | 'ai-dex-lab'
  | 'open-library'
  | 'ksbc-gold'
  | 'forex-guide';

export interface ModuleLessonMeta {
  id: WorkshopChapterId;
  moduleId: AcademyModuleId;
  stepNumber: string;
  tabLabel: string;
  fullTitle: string;
  cyclePart?: MarketCyclePartId;
}

export interface AcademyModuleMeta {
  id: AcademyModuleId;
  numberLabel: string;
  title: string;
  standaloneBrandTitle: string;
  accessLabel: string;
  requiredTier: AcademyTierLevel;
  summary: string;
  audienceNote: string;
  isCoreModule: boolean;
  accentTextClass: string;
  accentButtonClass: string;
  lessons: ModuleLessonMeta[];
}

export const ACADEMY_MODULES: AcademyModuleMeta[] = [
  {
    id: 'foundations',
    numberLabel: 'Module 01',
    title: 'Foundations & Eagle Seasons',
    standaloneBrandTitle: 'Foundations & Eagle Seasons',
    accessLabel: 'Open Access · Beginner',
    requiredTier: 'beginner',
    summary:
      'Calm, zero-jargon foundations: the $5 safety rule, coin history, Ascending & Descending Eagle markets, 4 seasons, and market time clocks.',
    audienceNote: 'Best link for brand-new students and Week 1 classes.',
    isCoreModule: true,
    accentTextClass: 'text-emerald-700 dark:text-emerald-400',
    accentButtonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    lessons: [
      {
        id: 'start-here',
        moduleId: 'foundations',
        stepNumber: '01',
        tabLabel: '01. $5 Safety Start',
        fullTitle: '$5 Start Here & Real-Wallet Safety Roadmap',
      },
      {
        id: 'coin-history',
        moduleId: 'foundations',
        stepNumber: '02',
        tabLabel: '02. Coin History',
        fullTitle: 'History of Our Coins: What They Represent & Their Founders (BTC, XRP, XLM, KSBC)',
      },
      {
        id: 'cycle-bull-vs-bear',
        moduleId: 'foundations',
        stepNumber: '03',
        tabLabel: '03. Eagle Markets',
        fullTitle:
          'The Ascending Eagle & Descending Eagle Markets — And Why Wall Street Calls Them Bull & Bear',
        cyclePart: 'bull_vs_bear',
      },
      {
        id: 'cycle-four-seasons',
        moduleId: 'foundations',
        stepNumber: '04',
        tabLabel: '04. 4 Seasons',
        fullTitle: 'How a Complete Market Cycle Flows Through 4 Seasons',
        cyclePart: 'four_seasons',
      },
      {
        id: 'cycle-monthly-rhythms',
        moduleId: 'foundations',
        stepNumber: '05',
        tabLabel: '05. Monthly Rhythms',
        fullTitle: 'How the Market Moves by Time of the Year & Time of the Month',
        cyclePart: 'monthly_rhythms',
      },
      {
        id: 'cycle-four-year-clock',
        moduleId: 'foundations',
        stepNumber: '06',
        tabLabel: '06. 4-Year Clock',
        fullTitle: 'The Past Four 4-Year Cycles & Where the Market Is Right Now (Late 2026)',
        cyclePart: 'four_year_cycles',
      },
    ],
  },
  {
    id: 'fibonacci',
    numberLabel: 'Module 02',
    title: 'Fibonacci & Musical Symphony Studio',
    standaloneBrandTitle: 'Fibonacci Symphony Studio',
    accessLabel: 'Intermediate · Cohort Passcode',
    requiredTier: 'intermediate',
    summary:
      'Read price action like sheet music: 8-hour musical candlestick graphs, retracements, 3-point extensions (144/233), and harmonic Buy/Stop/Sell markers.',
    audienceNote: 'Best link for chart-reading & Fibonacci geometry sessions.',
    isCoreModule: true,
    accentTextClass: 'text-amber-700 dark:text-amber-400',
    accentButtonClass: 'bg-amber-600 hover:bg-amber-500 text-white',
    lessons: [
      {
        id: 'market-symphony',
        moduleId: 'fibonacci',
        stepNumber: '01',
        tabLabel: '01. ♪ 8-Hr Symphony',
        fullTitle: '♪ 8-Hour Market Symphony Music Graph',
      },
      {
        id: 'candlestick-guide',
        moduleId: 'fibonacci',
        stepNumber: '02',
        tabLabel: '02. Candles & Retracements',
        fullTitle: 'Candlestick Anatomy & Fibonacci Retracement Guide',
      },
      {
        id: 'fibonacci-symphony-geometry',
        moduleId: 'fibonacci',
        stepNumber: '03',
        tabLabel: '03. ♪ 3-Pt Fib & 144/233',
        fullTitle: 'The Geometry of Creation, Musical Notes & 3-Point Fibonacci Extensions',
      },
      {
        id: 'fibonacci-symphony-markers',
        moduleId: 'fibonacci',
        stepNumber: '04',
        tabLabel: '04. ♬ Buy/Sell Markers',
        fullTitle: 'Dedicated Fibonacci Symphony Studio: Musical Buy, Stop & Sell Markers',
      },
    ],
  },
  {
    id: 'trade-desk',
    numberLabel: 'Module 03',
    title: 'XRPL 1-by-1 Trade Desk',
    standaloneBrandTitle: 'XRPL 1-by-1 Trade Desk',
    accessLabel: 'Advanced · Live Self-Custody',
    requiredTier: 'advanced',
    summary:
      'Distraction-free self-custody execution desk: Live Candlestick Chart + Embedded XRPL DEX, 10-Set Sequencer, synced 1-by-1 Student Checklist, and Paper Ledger.',
    audienceNote: 'Best standalone link when practicing or placing live 1-by-1 XRP trades.',
    isCoreModule: true,
    accentTextClass: 'text-sky-700 dark:text-sky-400',
    accentButtonClass: 'bg-sky-600 hover:bg-sky-500 text-white',
    lessons: [
      {
        id: 'risk-chart',
        moduleId: 'trade-desk',
        stepNumber: '01',
        tabLabel: 'Live Chart & XRPL DEX',
        fullTitle: 'Live Candlestick Chart, 2% Risk & Embedded XRPL DEX Order Desk',
      },
      {
        id: 'ten-set-auto-trader',
        moduleId: 'trade-desk',
        stepNumber: '02',
        tabLabel: '10-Set Sequencer',
        fullTitle: 'Automated 10-Set Buy & Sell Sequencer (1-by-1 XRPL Bridge)',
      },
      {
        id: 'portfolio-ledger',
        moduleId: 'trade-desk',
        stepNumber: '03',
        tabLabel: 'Paper & Wallet Watch',
        fullTitle: 'Paper Portfolio Ledger, Read-Only Wallet Watch & Price Alerts',
      },
    ],
  },
  {
    id: 'library',
    numberLabel: 'Module 04',
    title: 'Open Media & Reading Library',
    standaloneBrandTitle: 'Symphony Media Library',
    accessLabel: 'Open Access · Free Read & Videos',
    requiredTier: 'open_library',
    summary:
      'A quiet study hall for all Academy videos, the Crypto Self-Custody podcast, Free Ebook (PDF & EPUB), and the Geometry of Creation & Commerce PDF.',
    audienceNote: 'Best open link to share with anyone—no passcode required.',
    isCoreModule: true,
    accentTextClass: 'text-emerald-700 dark:text-emerald-400',
    accentButtonClass: 'bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white',
    lessons: [
      {
        id: 'open-library',
        moduleId: 'library',
        stepNumber: '01',
        tabLabel: 'Videos, Podcast & PDFs',
        fullTitle: 'Open Media, Course Videos & Document Reading Room',
      },
    ],
  },
  {
    id: 'ksbc',
    numberLabel: 'Module 05',
    title: 'KSBC Gold RWA Blueprint',
    standaloneBrandTitle: 'KSBC Gold RWA Blueprint',
    accessLabel: 'Open Access · Gold-Backed RWA Study',
    requiredTier: 'beginner',
    summary:
      'Interactive Kingdom Symphony Bible Coin (KSBC) training module: crystalline gold reserve transparency, XRPL TrustLine mechanics, and collateral safety cushion math.',
    audienceNote: 'Best standalone link for gold-backed RWA & open-math transparency classes.',
    isCoreModule: true,
    accentTextClass: 'text-amber-700 dark:text-amber-400',
    accentButtonClass: 'bg-amber-600 hover:bg-amber-500 text-white',
    lessons: [
      {
        id: 'ksbc-gold',
        moduleId: 'ksbc',
        stepNumber: '01',
        tabLabel: 'KSBC Crystalline Gold Lab',
        fullTitle: 'KSBC Gold-Backed RWA Architecture & Crystalline Proof Lab',
      },
    ],
  },
  {
    id: 'forex',
    numberLabel: 'Module 06',
    title: 'Forex Foundations & Visual Chart Guide',
    standaloneBrandTitle: 'Forex Visual Learning Guide',
    accessLabel: 'Open Access · Illustrated Learning',
    requiredTier: 'beginner',
    summary:
      'A calm, illustrated Forex learning module with visual currency-pair scales, interactive 24-hour Tokyo/London/NY session charts, annotated Fibonacci chart examples, and micro-lot safety math.',
    audienceNote: 'Best standalone link for students asking how Symphony Markets methods apply to Forex.',
    isCoreModule: true,
    accentTextClass: 'text-sky-700 dark:text-sky-400',
    accentButtonClass: 'bg-sky-600 hover:bg-sky-500 text-white',
    lessons: [
      {
        id: 'forex-guide',
        moduleId: 'forex',
        stepNumber: '01',
        tabLabel: 'Pairs, Sessions & Charts',
        fullTitle: 'Forex Foundations: Currency Pairs, Sessions, Example Charts & Micro-Lot Safety',
      },
    ],
  },
  {
    id: 'bonus-labs',
    numberLabel: 'Bonus Labs',
    title: 'Optional Extra Labs (AI Examiner · 11-Skill · 24/7 DEX)',
    standaloneBrandTitle: 'Symphony Bonus Labs',
    accessLabel: 'Advanced · Optional Deep-Dive',
    requiredTier: 'advanced',
    summary:
      'Tucked out of the main flow so students stay focused: Live AI Market Examiner, the 11-Module Day-Trader Skill Suite, and the 24/7 Decentralized DEX Architecture Lab.',
    audienceNote: 'Optional deep-dive tools for advanced study or instructor demos.',
    isCoreModule: false,
    accentTextClass: 'text-slate-700 dark:text-slate-300',
    accentButtonClass: 'bg-slate-800 hover:bg-slate-700 text-white',
    lessons: [
      {
        id: 'ai-buy-sell-helper',
        moduleId: 'bonus-labs',
        stepNumber: '01',
        tabLabel: 'Live AI Examiner',
        fullTitle: 'Live AI Market Examiner: Recommended Buy, Stop-Loss & Sell Points',
      },
      {
        id: 'skill-desk',
        moduleId: 'bonus-labs',
        stepNumber: '02',
        tabLabel: '11-Skill Desk',
        fullTitle: 'Day-Trader-Skill Desk — 11-Module Interactive Suite',
      },
      {
        id: 'ai-dex-lab',
        moduleId: 'bonus-labs',
        stepNumber: '03',
        tabLabel: '24/7 DEX Lab',
        fullTitle: '24/7 AI Decentralized DEX Lab — On-Chain Stewardship Architecture',
      },
    ],
  },
];

export const CORE_ACADEMY_MODULES = ACADEMY_MODULES.filter((m) => m.isCoreModule);
export const BONUS_LABS_MODULE = ACADEMY_MODULES.find((m) => m.id === 'bonus-labs')!;

export const ALL_MODULE_LESSONS: ModuleLessonMeta[] = ACADEMY_MODULES.flatMap((m) => m.lessons);

const VALID_MODULE_IDS = new Set<string>(ACADEMY_MODULES.map((m) => m.id));

export function getModuleById(id: AcademyModuleId): AcademyModuleMeta {
  return ACADEMY_MODULES.find((m) => m.id === id) ?? ACADEMY_MODULES[0];
}

export function getLessonById(chapterId?: string): ModuleLessonMeta {
  if (!chapterId) return ACADEMY_MODULES[0].lessons[0];
  if (chapterId === 'market-cycles') {
    return (
      ALL_MODULE_LESSONS.find((l) => l.id === 'cycle-bull-vs-bear') ?? ACADEMY_MODULES[0].lessons[0]
    );
  }
  return ALL_MODULE_LESSONS.find((l) => l.id === chapterId) ?? ACADEMY_MODULES[0].lessons[0];
}

export function parseStandaloneModuleFromUrl(): {
  moduleId: AcademyModuleId | null;
  lessonId: WorkshopChapterId | null;
} {
  try {
    const params = new URLSearchParams(window.location.search);
    const rawModule = params.get('module')?.trim().toLowerCase() ?? '';
    if (!rawModule || !VALID_MODULE_IDS.has(rawModule)) {
      return { moduleId: null, lessonId: null };
    }
    const moduleId = rawModule as AcademyModuleId;
    const mod = getModuleById(moduleId);
    const rawLesson = params.get('lesson')?.trim() ?? '';
    const matchedLesson = mod.lessons.find((l) => l.id === rawLesson);
    return {
      moduleId,
      lessonId: matchedLesson ? matchedLesson.id : mod.lessons[0].id,
    };
  } catch {
    return { moduleId: null, lessonId: null };
  }
}

export function buildStandaloneModuleUrl(
  moduleId: AcademyModuleId,
  lessonId?: WorkshopChapterId
): string {
  try {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('module', moduleId);
    if (lessonId) {
      url.searchParams.set('lesson', lessonId);
    }
    return url.toString();
  } catch {
    return lessonId ? `?module=${moduleId}&lesson=${lessonId}` : `?module=${moduleId}`;
  }
}
