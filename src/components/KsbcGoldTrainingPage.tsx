import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  Eye,
  FileCheck2,
  FileWarning,
  KeyRound,
  Lock,
  Play,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import goldRwaBlueprintImg from '../assets/images/infographic_gold_rwa_blueprint_1794621089543.jpg';
import { SectionPromoVideoBanner } from './SectionPromoVideoBanner';

interface KsbcGoldTrainingPageProps {
  onEnterApp: (targetSectionId?: string) => void;
  xrpLivePrice: number;
}

type LessonStep = 1 | 2 | 3 | 4;

const KSBC_PROMO_VIDEO_SRC = '/api/drive-video/1vvE86gSwiJeR7LxLPZcGfxbxw5EbPWM7';

const STEP_META: Array<{
  step: LessonStep;
  shortTitle: string;
  headline: string;
  summary: string;
}> = [
  {
    step: 1,
    shortTitle: 'Step 1 · Crystalline Overview & Video',
    headline: 'Open Source Abundance: Gold in Transparent Crystalline Columns',
    summary:
      'KSBC (Kingdom Symphony Bible Coin) is our personal-learning blueprint (not a live coin yet) replacing closed steel vaults with illuminated crystalline columns—symbolizing wealth that is 100% visible, verifiable, and active on-chain.',
  },
  {
    step: 2,
    shortTitle: 'Step 2 · Crystalline Mint Map',
    headline: 'Drag the Slider to Illuminate Crystalline Gold Columns on XRPL',
    summary:
      'Watch physical 999.9 gold bars light up inside transparent glass cylinders wired directly to the XRP Ledger—and see how the XRPL Trustline Gate blocks spam.',
  },
  {
    step: 3,
    shortTitle: 'Step 3 · Closed Vaults vs. Crystal Proof',
    headline: 'Spot the Difference in 5 Seconds: Opaque Hype vs. Crystalline RWA',
    summary:
      'Contrast closed "secret steel vault" scam claims against transparent crystalline reserves and 100% self-custody standards.',
  },
  {
    step: 4,
    shortTitle: 'Step 4 · Crystalline Safety Cushion',
    headline: 'See Why an Illuminated Equity Cushion Beats 20x Casino Leverage',
    summary:
      'Move the sliders to watch the transparent crystalline collateral column resize in real time—showing how visible asset backing prevents wipeouts.',
  },
];

export const KsbcGoldTrainingPage: React.FC<KsbcGoldTrainingPageProps> = ({
  onEnterApp,
  xrpLivePrice,
}) => {
  const promoVideoRef = useRef<HTMLVideoElement | null>(null);
  const [activeStep, setActiveStep] = useState<LessonStep>(1);
  const [promoPlaying, setPromoPlaying] = useState<boolean>(false);

  // Step 2 Hypothetical Minting Sandbox State
  const [goldOunces, setGoldOunces] = useState<number>(3.5);
  const [unitMode, setUnitMode] = useState<'gram' | 'hundredth_oz'>('gram');
  const referenceGoldSpotUsd = 2650;

  // Step 4 Hypothetical Collateral Safety Buffer State
  const [collateralGoldUsd, setCollateralGoldUsd] = useState<number>(1000);
  const [ltvPercent, setLtvPercent] = useState<number>(60);

  const currentMeta = STEP_META.find((s) => s.step === activeStep) ?? STEP_META[0];

  // Step 2 Calculations
  const totalGrams = goldOunces * 31.1035;
  const hypotheticalTokensMinted =
    unitMode === 'gram' ? Math.floor(totalGrams * 100) / 100 : goldOunces * 100;
  const estimatedGoldValueUsd = goldOunces * referenceGoldSpotUsd;
  const valuePerTokenUsd =
    hypotheticalTokensMinted > 0 ? estimatedGoldValueUsd / hypotheticalTokensMinted : 0;
  const xrplTrustlineReserveXrp = 0.2;
  const xrplTrustlineReserveUsd = xrplTrustlineReserveXrp * xrpLivePrice;
  const fullBarsCount = Math.floor(goldOunces);
  const hasHalfBar = goldOunces % 1 !== 0;

  // Step 4 Calculations
  const maxConservativeBorrowUsd = (collateralGoldUsd * ltvPercent) / 100;
  const safetyEquityBufferUsd = collateralGoldUsd - maxConservativeBorrowUsd;
  const safetyBufferPct = 100 - ltvPercent;
  const annualSimpleInterestUsd = maxConservativeBorrowUsd * 0.05;

  return (
    <div className="max-w-[1180px] w-full mx-auto px-4 sm:px-6 py-6 lg:py-8 space-y-6">
      {/* Compact Header with Transparent Sandbox Disclaimer */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-semibold">
            <span>KSBC · Kingdom Symphony Bible Coin</span>
            <span aria-hidden="true">·</span>
            <span>Visual RWA Training Sandbox (Hypothetical · Not Live or Government-Certified)</span>
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Gold Real-World Asset (RWA) Crystalline Classroom
          </h1>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
          Visual Lesson {activeStep} of 4 · Open Source Abundance
        </div>
      </div>

      {/* Dedicated KSBC Gold & Antidote to Loose Cycles Section Video */}
      <SectionPromoVideoBanner
        sectionBadge="KSBC Gold & Open-Ledger Antidote · Synced From Google Drive"
        headline="KSBC Gold — Symphony Markets Academy & The Antidote to Loose Cycles"
        description="Watch how physical 999.9 fine gold bars encased in transparent crystalline columns map 1:1 onto public ledger proofs with open-source Automated Market Maker (x · y = k) math—and switch between the KSBC Gold Promo and our full 6:14 Antidote to Loose Cycles film."
        accentTone="amber"
        tracks={[
          {
            id: 'ksbc_antidote_full',
            tabLabel: '01 · Antidote to Loose Cycles (6:14)',
            title: 'The Antidote to Loose Cycles — KSBC Gold RWA & Open AMM Math',
            duration: '6:14',
            videoSrc: '/assets/The_Antidote_to_Loose_Cycles.mp4',
            driveFileId: '1RCuSGFs76KSTkdQBPDXrSN5ND8y_ZBBi',
            posterSrc: goldRwaBlueprintImg,
          },
          {
            id: 'ksbc_gold_promo',
            tabLabel: '02 · KSBC Gold Promo (0:10)',
            title: 'KSBC Gold Symphony Markets Academy Promo',
            duration: '0:10',
            videoSrc: KSBC_PROMO_VIDEO_SRC,
            driveFileId: '1vvE86gSwiJeR7LxLPZcGfxbxw5EbPWM7',
            posterSrc: goldRwaBlueprintImg,
          },
        ]}
      />

      {/* 4-Step Visual Stepper */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {STEP_META.map((item) => {
          const isActive = item.step === activeStep;
          return (
            <button
              key={item.step}
              type="button"
              onClick={() => setActiveStep(item.step)}
              className={`text-left px-4 py-3 rounded-xl border transition-colors cursor-pointer ${
                isActive
                  ? 'bg-amber-500/12 dark:bg-amber-500/20 border-amber-500/60 text-slate-900 dark:text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div
                className={`text-xs font-semibold ${
                  isActive
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.shortTitle}
              </div>
            </button>
          );
        })}
      </div>

      {/* Single Focused Visual Lesson Stage */}
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            {currentMeta.shortTitle}
          </div>
          <h2 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {currentMeta.headline}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-[68ch]">
            {currentMeta.summary}
          </p>
        </div>

        {/* =====================================================================
         * STEP 1: HERO KSBC GOLD RWA PROMO VIDEO + 3-STAGE CRYSTALLINE PIPELINE
         * ===================================================================== */}
        {activeStep === 1 && (
          <div className="space-y-6">
            {/* Hero KSBC Gold RWA Promo Video + Open Source Abundance Thesis */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-amber-300/60 dark:border-amber-500/30 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-6">
                <div className="relative aspect-16/9 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-sm">
                  <video
                    ref={promoVideoRef}
                    src={KSBC_PROMO_VIDEO_SRC}
                    poster={goldRwaBlueprintImg}
                    controls
                    playsInline
                    preload="metadata"
                    onPlay={() => setPromoPlaying(true)}
                    onPause={() => setPromoPlaying(false)}
                    onEnded={() => setPromoPlaying(false)}
                    className="w-full h-full object-contain bg-slate-950"
                  />
                  {!promoPlaying && (
                    <div className="pointer-events-none absolute inset-x-0 top-0 bottom-11 bg-gradient-to-t from-black/70 via-black/20 to-black/30 flex items-center justify-center p-4">
                      <button
                        type="button"
                        onClick={() => {
                          const el = promoVideoRef.current;
                          if (el) {
                            void el.play();
                          }
                        }}
                        className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-bold shadow-lg transition-transform duration-150 hover:scale-105 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current shrink-0" />
                        <span>Play KSBC Gold RWA Promo (0:10)</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Official Promo · KSBC Gold RWA & Open Math Proof (x · y = k)</span>
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="text-amber-700 dark:text-amber-400 font-sans font-semibold hover:underline cursor-pointer"
                  >
                    Try Interactive Mint Map →
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Visual Language · Transparent Crystalline Columns vs. Closed Vaults</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Why KSBC Uses Illuminated Glass Columns ("Open Source Abundance")
                </h3>
                <p>
                  Old financial institutions and crypto scams hide behind <strong>closed steel vault doors</strong>—demanding blind trust while concealing whether reserves actually exist. While a locked brass safe is the right metaphor for guarding your <em>personal 12-word private key</em>, Real-World Asset reserves belong in <strong>transparent, crystalline columns</strong>.
                </p>
                <p>
                  <strong>KSBC (Kingdom Symphony Bible Coin)</strong> is a transparent personal-learning blueprint (not a live coin yet) demonstrating <strong>100% verifiable reserves</strong>: physical 999.9 fine gold encased in illuminated glass cylinders directly wired to public XRP Ledger blocks so anyone can verify supply in real time.
                </p>
              </div>
            </div>

            {/* Illustrated 3-Step Crystalline Pipeline Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-stretch">
              {/* Stage 1 Visual Card: Illuminated Transparent Crystalline Gold Column SVG */}
              <div className="md:col-span-3 p-5 rounded-xl bg-amber-50/70 dark:bg-slate-950 border border-amber-300/60 dark:border-cyan-500/30 flex flex-col items-center text-center justify-between gap-4">
                <div className="text-xs font-mono font-semibold text-amber-800 dark:text-amber-300">
                  01 · Crystalline Reserve
                </div>

                {/* Custom Illustrated Illuminated Glass Cylinder Encasing 999.9 Gold Bar */}
                <svg
                  viewBox="0 0 180 116"
                  className="w-44 h-28"
                  role="img"
                  aria-label="Physical 999.9 fine gold bar encased inside an illuminated transparent crystalline glass column"
                >
                  <defs>
                    <linearGradient id="crystalGlassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.32" />
                      <stop offset="50%" stopColor="#E0F2FE" stopOpacity="0.10" />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.28" />
                    </linearGradient>
                    <linearGradient id="goldIngotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FEF08A" />
                      <stop offset="55%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#B45309" />
                    </linearGradient>
                  </defs>
                  {/* Illuminated Ledger Pedestal */}
                  <ellipse cx="90" cy="102" rx="54" ry="9" fill="#0EA5E9" fillOpacity="0.22" stroke="#38BDF8" strokeWidth="1.2" />
                  {/* Vertical Optical Light Beam */}
                  <rect x="52" y="18" width="76" height="84" fill="url(#crystalGlassGrad)" />
                  {/* 999.9 Gold Bars Visible Inside the Transparent Glass Column */}
                  <polygon points="62,86 118,86 111,68 69,68" fill="url(#goldIngotGrad)" stroke="#FEF3C7" strokeWidth="1" />
                  <polygon points="66,65 114,65 108,48 72,48" fill="url(#goldIngotGrad)" stroke="#FEF3C7" strokeWidth="1" />
                  <text x="90" y="81" textAnchor="middle" fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#78350F">
                    999.9 GOLD
                  </text>
                  {/* Crystalline Cylinder Walls & Top Rim */}
                  <line x1="52" y1="18" x2="52" y2="102" stroke="#38BDF8" strokeWidth="1.8" />
                  <line x1="128" y1="18" x2="128" y2="102" stroke="#38BDF8" strokeWidth="1.8" />
                  <line x1="64" y1="22" x2="64" y2="98" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="1.2" />
                  <ellipse cx="90" cy="18" rx="38" ry="7" fill="#E0F2FE" fillOpacity="0.25" stroke="#38BDF8" strokeWidth="1.5" />
                </svg>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Visible Crystalline Column
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Physical bullion sits in open, auditable view—never hidden behind opaque doors.
                  </p>
                </div>
              </div>

              {/* Visual Connector Arrow 1 */}
              <div className="md:col-span-1 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <ArrowRight className="w-6 h-6 rotate-90 md:rotate-0" />
              </div>

              {/* Stage 2 Visual Card: Crystalline Optical Assay & 1:1 Scale SVG */}
              <div className="md:col-span-3 p-5 rounded-xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-300/60 dark:border-sky-500/30 flex flex-col items-center text-center justify-between gap-4">
                <div className="text-xs font-mono font-semibold text-sky-800 dark:text-sky-400">
                  02 · Open Math Proof
                </div>

                {/* Custom Illustrated Crystalline Cylinders on Precision Balance Scale */}
                <svg
                  viewBox="0 0 180 116"
                  className="w-44 h-28"
                  role="img"
                  aria-label="Two transparent crystalline columns balanced 1 to 1 on an optical ledger scale"
                >
                  <rect x="68" y="94" width="44" height="6" rx="3" fill="#0284C7" />
                  <rect x="87" y="30" width="6" height="66" rx="2" fill="#0284C7" />
                  <line x1="34" y1="42" x2="146" y2="42" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" />
                  {/* Left Crystal Cylinder (Gold) */}
                  <rect x="26" y="46" width="28" height="34" rx="4" fill="#38BDF8" fillOpacity="0.18" stroke="#38BDF8" strokeWidth="1.4" />
                  <rect x="31" y="62" width="18" height="14" rx="2" fill="#F59E0B" />
                  {/* Right Crystal Cylinder (On-Chain Supply) */}
                  <rect x="126" y="46" width="28" height="34" rx="4" fill="#10B981" fillOpacity="0.18" stroke="#10B981" strokeWidth="1.4" />
                  <circle cx="140" cy="67" r="7" fill="#10B981" />
                  {/* Center Verification Check */}
                  <circle cx="90" cy="28" r="9" fill="#10B981" />
                  <polyline
                    points="85,28 88.5,31.5 95,24.5"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    1:1 Verifiable Parity
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Optical proof-of-reserve confirms token supply equals exact assayed gram weight.
                  </p>
                </div>
              </div>

              {/* Visual Connector Arrow 2 */}
              <div className="md:col-span-1 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ArrowRight className="w-6 h-6 rotate-90 md:rotate-0" />
              </div>

              {/* Stage 3 Visual Card: XRPL Digital Receipt SVG */}
              <div className="md:col-span-3 p-5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-300/60 dark:border-emerald-500/30 flex flex-col items-center text-center justify-between gap-4">
                <div className="text-xs font-mono font-semibold text-emerald-800 dark:text-emerald-400">
                  03 · Active XRPL Ledger
                </div>

                {/* Custom Illustrated Token Receipt on Ledger SVG */}
                <svg
                  viewBox="0 0 180 116"
                  className="w-44 h-28"
                  role="img"
                  aria-label="Divisible KSBC digital token wired directly to the XRP Ledger"
                >
                  <line x1="22" y1="58" x2="158" y2="58" stroke="#10B981" strokeWidth="1.8" strokeDasharray="4 4" />
                  <rect x="20" y="44" width="26" height="28" rx="5" fill="#D1FAE5" stroke="#059669" strokeWidth="1.5" />
                  <rect x="134" y="44" width="26" height="28" rx="5" fill="#D1FAE5" stroke="#059669" strokeWidth="1.5" />
                  <circle cx="90" cy="58" r="29" fill="#059669" />
                  <circle cx="90" cy="58" r="23" fill="#10B981" stroke="#A7F3D0" strokeWidth="1.5" />
                  <text
                    x="90"
                    y="56"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                    fill="#FFFFFF"
                  >
                    KSBC
                  </text>
                  <text
                    x="90"
                    y="68"
                    textAnchor="middle"
                    fontSize="8"
                    fontFamily="monospace"
                    fill="#ECFDF5"
                  >
                    XRPL RWA
                  </text>
                </svg>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Divisible Ledger Receipt
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Settles on XRPL in 3–4 seconds for ~$0.0001 while holders keep full self-custody.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
         * STEP 2: INTERACTIVE 10-COLUMN ILLUMINATED CRYSTALLINE RESERVE CHAMBER
         * ===================================================================== */}
        {activeStep === 2 && (
          <div className="space-y-6">
            {/* Top Controls Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="md:col-span-7 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="gold-oz-slider"
                    className="font-semibold text-slate-800 dark:text-slate-200"
                  >
                    Drag to Illuminate Crystalline Gold Columns:
                  </label>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                    {goldOunces} Troy Oz ({totalGrams.toFixed(1)} grams)
                  </span>
                </div>
                <input
                  id="gold-oz-slider"
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={goldOunces}
                  onChange={(e) => setGoldOunces(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              <div className="md:col-span-5 space-y-1.5">
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Choose Token Denomination:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUnitMode('gram')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      unitMode === 'gram'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    1 KSBC = 1 Gram
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitMode('hundredth_oz')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      unitMode === 'hundredth_oz'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    1 KSBC = 0.01 Oz
                  </button>
                </div>
              </div>
            </div>

            {/* Live Visual Pipeline: 10 Crystalline Columns -> XRPL Trustline Gate -> Self-Custody Wallet */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* Visual Box 1: Illuminated 10-Column Crystalline Reserve Chamber */}
              <div className="lg:col-span-5 p-5 rounded-xl border border-sky-400/50 dark:border-sky-500/40 bg-slate-950 text-white flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Crystalline Reserve Columns (Visible Proof)</span>
                  </span>
                  <span className="font-mono font-bold text-amber-300 tabular-nums">
                    ~${estimatedGoldValueUsd.toLocaleString()}
                  </span>
                </div>

                {/* 10 Illuminated Transparent Glass Cylinders Housing Gold Bars */}
                <div className="grid grid-cols-5 gap-2.5 py-1">
                  {Array.from({ length: 10 }).map((_, idx) => {
                    const isFull = idx < fullBarsCount;
                    const isHalf = idx === fullBarsCount && hasHalfBar;
                    const isLit = isFull || isHalf;
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1">
                        <svg
                          viewBox="0 0 48 76"
                          className="w-full h-16"
                          role="img"
                          aria-label={`Crystalline reserve column ${idx + 1}: ${
                            isFull ? '1 troy ounce gold bar' : isHalf ? '0.5 troy ounce gold bar' : 'empty transparent column'
                          }`}
                        >
                          {/* Top Glass Rim */}
                          <ellipse
                            cx="24"
                            cy="8"
                            rx="16"
                            ry="4"
                            fill={isLit ? '#38BDF8' : '#1E293B'}
                            fillOpacity={isLit ? 0.35 : 0.4}
                            stroke={isLit ? '#7DD3FC' : '#475569'}
                            strokeWidth="1.2"
                          />
                          {/* Transparent Glass Cylinder Body */}
                          <rect
                            x="8"
                            y="8"
                            width="32"
                            height="54"
                            fill={isLit ? '#0EA5E9' : '#0F172A'}
                            fillOpacity={isLit ? 0.16 : 0.35}
                          />
                          {/* Illuminated Gold Bullion Core */}
                          {isFull && (
                            <rect
                              x="13"
                              y="20"
                              width="22"
                              height="36"
                              rx="3"
                              fill="#F59E0B"
                              stroke="#FEF08A"
                              strokeWidth="1.2"
                            />
                          )}
                          {isHalf && (
                            <rect
                              x="13"
                              y="38"
                              width="22"
                              height="18"
                              rx="2.5"
                              fill="#FBBF24"
                              stroke="#FEF08A"
                              strokeWidth="1.2"
                            />
                          )}
                          {/* Glass Specular Highlight + Walls */}
                          <line
                            x1="8"
                            y1="8"
                            x2="8"
                            y2="62"
                            stroke={isLit ? '#7DD3FC' : '#334155'}
                            strokeWidth="1.2"
                          />
                          <line
                            x1="40"
                            y1="8"
                            x2="40"
                            y2="62"
                            stroke={isLit ? '#7DD3FC' : '#334155'}
                            strokeWidth="1.2"
                          />
                          <line
                            x1="13"
                            y1="11"
                            x2="13"
                            y2="59"
                            stroke="#FFFFFF"
                            strokeOpacity={isLit ? 0.45 : 0.12}
                            strokeWidth="1"
                          />
                          {/* Ledger Optical Pedestal + Connection Node */}
                          <ellipse
                            cx="24"
                            cy="62"
                            rx="16"
                            ry="4"
                            fill={isLit ? '#38BDF8' : '#1E293B'}
                            fillOpacity={isLit ? 0.45 : 0.5}
                            stroke={isLit ? '#38BDF8' : '#475569'}
                            strokeWidth="1.2"
                          />
                          {isLit && (
                            <line
                              x1="24"
                              y1="66"
                              x2="24"
                              y2="75"
                              stroke="#34D399"
                              strokeWidth="1.8"
                            />
                          )}
                        </svg>
                        <span
                          className={`text-[10px] font-mono font-bold tabular-nums ${
                            isLit ? 'text-amber-300' : 'text-slate-500'
                          }`}
                        >
                          {isFull ? '1.0 oz' : isHalf ? '0.5 oz' : 'Empty'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-300 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span>
                    Each lit glass cylinder = <strong>1 Troy Oz</strong> (31.1g) wired to ledger
                  </span>
                  <span className="font-mono text-emerald-400">100% Auditable</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="lg:col-span-1 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <ArrowRight className="w-6 h-6 rotate-90 lg:rotate-0" />
              </div>

              {/* Visual Box 2: XRPL Issuer + Opt-In Trustline Gate */}
              <div className="lg:col-span-3 p-5 rounded-xl border border-sky-300/60 dark:border-sky-500/30 bg-sky-50/50 dark:bg-sky-950/15 flex flex-col justify-between gap-3">
                <div className="text-xs font-semibold text-sky-800 dark:text-sky-400 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4" />
                  XRPL Trustline Gate
                </div>

                <div className="divide-y divide-sky-200/70 dark:divide-slate-800 my-auto">
                  <div className="pb-3 flex items-start gap-2.5 text-xs">
                    <Scale className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900 dark:text-white">
                        1:1 Crystalline Cap
                      </strong>
                      <span className="text-slate-600 dark:text-slate-400">
                        Zero unbacked minting allowed
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 flex items-start gap-2.5 text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900 dark:text-white">
                        Holder TrustSet Opt-In
                      </strong>
                      <span className="text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                        {xrplTrustlineReserveXrp} XRP (~${xrplTrustlineReserveUsd.toFixed(2)}) anti-spam lock
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-sky-200/70 dark:border-slate-800">
                  Blocks unsolicited scam airdrops automatically.
                </div>
              </div>

              {/* Arrow */}
              <div className="lg:col-span-1 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ArrowRight className="w-6 h-6 rotate-90 lg:rotate-0" />
              </div>

              {/* Visual Box 3: Resulting Token Output in Self-Custody Wallet */}
              <div className="lg:col-span-2 p-5 rounded-xl border border-emerald-300/60 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/15 flex flex-col justify-between gap-3">
                <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4" />
                  Your Wallet
                </div>

                <div className="my-auto space-y-1 font-mono tabular-nums">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {hypotheticalTokensMinted.toLocaleString()}
                  </div>
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    KSBC Tokens
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                    ${valuePerTokenUsd.toFixed(2)} / token
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  100% matched to {totalGrams.toFixed(1)}g visible gold.
                </div>
              </div>
            </div>

            {/* Detailed Step-by-Step Words Explaining the XRPL Minting & Trustline Mechanics */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div>
                <strong className="block text-slate-900 dark:text-white mb-1">
                  1. Open-Source Abundance vs. Secret Vaults
                </strong>
                Every lit crystalline cylinder represents physical gold accompanied by public assay serial numbers and on-chain proof-of-reserve—so learners verify math instead of trusting marketing promises.
              </div>
              <div>
                <strong className="block text-slate-900 dark:text-white mb-1">
                  2. Why XRPL Requires a 0.2 XRP Trustline
                </strong>
                Unlike networks where scammers drop fake tokens into your wallet uninvited, XRPL requires you to sign an explicit <span className="font-mono">TrustSet</span> opt-in (temporarily locking {xrplTrustlineReserveXrp} XRP in your own wallet) before holding any RWA token.
              </div>
              <div>
                <strong className="block text-slate-900 dark:text-white mb-1">
                  3. Redemption Extinguishes the Receipt
                </strong>
                When physical gold is redeemed from a crystalline reserve column, those exact digital receipts are returned and burned on-chain so ledger supply never exceeds real metal.
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
         * STEP 3: OPAQUE STEEL VAULTS VS. TRANSPARENT CRYSTALLINE COLUMNS
         * ===================================================================== */}
        {activeStep === 3 && (
          <div className="space-y-5">
            {/* Visual Architectural Contrast Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-rose-300/60 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/15 flex items-center gap-4">
                <svg viewBox="0 0 88 80" className="w-20 h-20 shrink-0" aria-hidden="true">
                  <rect x="12" y="10" width="64" height="60" rx="8" fill="#334155" stroke="#F43F5E" strokeWidth="2" />
                  <circle cx="44" cy="40" r="15" fill="#1E293B" stroke="#FB7185" strokeWidth="2" />
                  <text x="44" y="46" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#FDA4AF">
                    ?
                  </text>
                </svg>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-rose-700 dark:text-rose-400">
                    ✕ Closed Steel Vault Mythology (Opaque)
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Uses heavy steel vault stock photos to project authority while hiding unbacked token printing and freezing customer withdrawals.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-300/70 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/15 flex items-center gap-4">
                <svg viewBox="0 0 88 80" className="w-20 h-20 shrink-0" aria-hidden="true">
                  <ellipse cx="44" cy="68" rx="26" ry="5" fill="#10B981" fillOpacity="0.3" stroke="#10B981" strokeWidth="1.5" />
                  <rect x="22" y="14" width="44" height="54" fill="#38BDF8" fillOpacity="0.18" stroke="#38BDF8" strokeWidth="1.8" />
                  <rect x="30" y="30" width="28" height="30" rx="3" fill="#F59E0B" stroke="#FEF08A" strokeWidth="1.2" />
                  <ellipse cx="44" cy="14" rx="22" ry="5" fill="#E0F2FE" fillOpacity="0.3" stroke="#38BDF8" strokeWidth="1.5" />
                </svg>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">
                    ✓ Illuminated Crystalline Column (Verifiable)
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Symbolizes <strong>Open Source Abundance</strong>: reserves visible through glass, wired 1:1 to public XRPL ledger state while you hold your own private wallet key.
                  </p>
                </div>
              </div>
            </div>

            {[
              {
                topic: 'Reserve Visibility',
                scamIcon: FileWarning,
                scamText: 'Flashes fake government seals or closed "secret vaults" nobody can audit.',
                honestIcon: FileCheck2,
                honestText:
                  'States clearly when a concept (like KSBC today) is an educational prototype—and requires transparent crystalline proof-of-reserve audits before launch.',
              },
              {
                topic: 'Private Key vs. Reserve',
                scamIcon: Lock,
                scamText:
                  'Locks YOUR funds inside their custodial website while keeping their own reserves hidden.',
                honestIcon: KeyRound,
                honestText:
                  'Your private key stays locked in your personal brass safe (your phone), while gold reserves stay 100% public inside transparent crystalline columns.',
              },
              {
                topic: 'Token Supply Discipline',
                scamIcon: ShieldAlert,
                scamText:
                  'Prints millions of unbacked presale tokens and promises "guaranteed daily yield."',
                honestIcon: Coins,
                honestText:
                  'Strict 1:1 reserve math: zero tokens minted without matching physical gram weight.',
              },
            ].map((row) => {
              const ScamIcon = row.scamIcon;
              const HonestIcon = row.honestIcon;
              return (
                <div
                  key={row.topic}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                >
                  <div className="md:col-span-2 flex items-center">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {row.topic}
                    </span>
                  </div>

                  {/* Red Trap Visual Box */}
                  <div className="md:col-span-5 p-3.5 rounded-lg bg-rose-500/8 border border-rose-500/25 flex items-start gap-3">
                    <ScamIcon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong className="block text-rose-700 dark:text-rose-400 mb-0.5">
                        ✕ Fake Gold Scam Trap
                      </strong>
                      {row.scamText}
                    </div>
                  </div>

                  {/* Green Shield Visual Box */}
                  <div className="md:col-span-5 p-3.5 rounded-lg bg-emerald-500/8 border border-emerald-500/25 flex items-start gap-3">
                    <HonestIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong className="block text-emerald-700 dark:text-emerald-400 mb-0.5">
                        ✓ No-Scam Zone Crystalline Standard
                      </strong>
                      {row.honestText}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =====================================================================
         * STEP 4: CRYSTALLINE COLLATERAL COLUMN VS. 20X LEVERAGE WIPEOUT
         * ===================================================================== */}
        {activeStep === 4 && (
          <div className="space-y-6">
            {/* Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="collateral-usd-slider"
                    className="font-semibold text-slate-800 dark:text-slate-200"
                  >
                    1. Hypothetical Crystalline Gold Reserve Value
                  </label>
                  <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    ${collateralGoldUsd.toLocaleString()}
                  </span>
                </div>
                <input
                  id="collateral-usd-slider"
                  type="range"
                  min={200}
                  max={10000}
                  step={200}
                  value={collateralGoldUsd}
                  onChange={(e) => setCollateralGoldUsd(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="ltv-slider"
                    className="font-semibold text-slate-800 dark:text-slate-200"
                  >
                    2. Borrow Ratio (LTV) vs. Crystalline Safety Cushion
                  </label>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {ltvPercent}% Credit / {safetyBufferPct}% Cushion
                  </span>
                </div>
                <input
                  id="ltv-slider"
                  type="range"
                  min={30}
                  max={70}
                  step={5}
                  value={ltvPercent}
                  onChange={(e) => setLtvPercent(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Visual Crystalline Column + Stacked Bar Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left 4 Cols: Live Vertical Crystalline Collateral Column SVG */}
              <div className="lg:col-span-4 p-5 rounded-xl bg-slate-950 border border-sky-500/30 flex flex-col items-center justify-between gap-3 text-white">
                <div className="text-xs font-semibold text-sky-300 text-center">
                  Live Crystalline Reserve Column
                </div>
                <svg
                  viewBox="0 0 160 190"
                  className="w-36 h-44"
                  role="img"
                  aria-label="Illuminated crystalline collateral column showing emerald safety cushion above golden credit base"
                >
                  <ellipse cx="80" cy="172" rx="46" ry="8" fill="#0EA5E9" fillOpacity="0.28" stroke="#38BDF8" strokeWidth="1.4" />
                  {/* Outer Glass Column */}
                  <rect x="34" y="20" width="92" height="152" fill="#0EA5E9" fillOpacity="0.12" stroke="#7DD3FC" strokeWidth="1.6" />
                  {/* Top Emerald Safety Cushion Segment */}
                  <rect
                    x="42"
                    y={26}
                    width="76"
                    height={Math.round((140 * safetyBufferPct) / 100)}
                    rx="3"
                    fill="#10B981"
                    fillOpacity="0.82"
                  />
                  {/* Bottom Golden Credit Segment */}
                  <rect
                    x="42"
                    y={26 + Math.round((140 * safetyBufferPct) / 100)}
                    width="76"
                    height={Math.round((140 * ltvPercent) / 100)}
                    rx="3"
                    fill="#F59E0B"
                    fillOpacity="0.9"
                  />
                  <line x1="48" y1="24" x2="48" y2="168" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.5" />
                  <ellipse cx="80" cy="20" rx="46" ry="8" fill="#E0F2FE" fillOpacity="0.25" stroke="#7DD3FC" strokeWidth="1.4" />
                </svg>
                <div className="text-[11px] font-mono text-center text-slate-300">
                  <span className="text-emerald-400 font-bold">{safetyBufferPct}% Cushion</span> ·{' '}
                  <span className="text-amber-300 font-bold">{ltvPercent}% Credit</span>
                </div>
              </div>

              {/* Right 8 Cols: Horizontal Comparison Bars */}
              <div className="lg:col-span-8 space-y-4 flex flex-col justify-between">
                {/* Bar 1: Conservative Gold RWA Bar */}
                <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Conservative Crystalline Backing (${collateralGoldUsd.toLocaleString()} Asset)
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                      Est. 5% Interest: ${annualSimpleInterestUsd.toFixed(0)}/yr
                    </span>
                  </div>

                  <div className="w-full h-11 rounded-lg overflow-hidden flex border border-slate-300 dark:border-slate-700 font-mono text-xs font-bold tabular-nums">
                    <div
                      style={{ width: `${ltvPercent}%` }}
                      className="bg-amber-400 text-amber-950 flex items-center justify-center px-2 whitespace-nowrap overflow-hidden"
                    >
                      Credit ${maxConservativeBorrowUsd.toFixed(0)} ({ltvPercent}%)
                    </div>
                    <div
                      style={{ width: `${safetyBufferPct}%` }}
                      className="bg-emerald-600 text-white flex items-center justify-center px-2 whitespace-nowrap overflow-hidden"
                    >
                      Safety Cushion ${safetyEquityBufferUsd.toFixed(0)} ({safetyBufferPct}%)
                    </div>
                  </div>
                </div>

                {/* Bar 2: Visual Contrast Against Dangerous 20x Crypto Leverage */}
                <div className="p-5 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      Compare: Dangerous 20x Futures Leverage Trap
                    </span>
                    <span className="font-mono text-rose-700 dark:text-rose-400">
                      5% price drop = 100% Account Wiped Out
                    </span>
                  </div>

                  <div className="w-full h-9 rounded-lg overflow-hidden flex border border-rose-400/50 font-mono text-xs font-bold">
                    <div
                      style={{ width: '5%' }}
                      className="bg-slate-700 text-white flex items-center justify-center text-[10px]"
                      title="5% tiny margin"
                    >
                      5%
                    </div>
                    <div
                      style={{ width: '95%' }}
                      className="bg-rose-600 text-white flex items-center justify-center px-3 whitespace-nowrap"
                    >
                      95% Borrowed Debt Zone (Instant Liquidation Danger)
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-white">
                    Why Visible Equity Cushions Protect Families & Learners:
                  </strong>{' '}
                  In hypothetical RWA collateral models, borrowing at a conservative{' '}
                  <strong>{ltvPercent}% LTV</strong> against ${collateralGoldUsd.toLocaleString()}{' '}
                  of visible crystalline reserve value leaves a{' '}
                  <strong>
                    ${safetyEquityBufferUsd.toFixed(0)} ({safetyBufferPct}%) equity cushion
                  </strong>{' '}
                  so normal dips do not trigger liquidation—unlike 20x casino leverage where 95% debt wipes out beginners on a routine 5% wiggle.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step-by-Step Navigation Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={activeStep === 1}
            onClick={() => setActiveStep((s) => Math.max(1, s - 1) as LessonStep)}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            ← Previous Visual
          </button>

          {activeStep < 4 ? (
            <button
              type="button"
              onClick={() => setActiveStep((s) => Math.min(4, s + 1) as LessonStep)}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Next Visual ({activeStep + 1} of 4) →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onEnterApp('start-here')}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Practice Inside $5 Wallet App →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
