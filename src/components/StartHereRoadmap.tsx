import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, Lock, ShieldCheck } from 'lucide-react';
import selfCustodyKeysImg from '../assets/images/infographic_self_custody_keys_1794621087516.jpg';
import videoCoverWalletImg from '../assets/images/video_cover_wallet_1794561551281.jpg';
import {
  AssetSymbol,
  Candle,
  FibonacciLevel,
  InstrumentType,
  TradeSide,
} from '../types/market';
import { ScamScreenXRayInspector } from './ScamScreenXRayInspector';
import { SectionPromoVideoBanner } from './SectionPromoVideoBanner';

interface StartHereRoadmapProps {
  symbol: AssetSymbol;
  onSelectSymbol: (sym: AssetSymbol) => void;
  candles: Candle[];
  fibLevels: FibonacciLevel[];
  livePrice: number;
  accountBalance: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskPercent: number;
  rrRatio: number;
  instrument: InstrumentType;
  leverage: number;
  tradeSide: TradeSide;
  onActivateFiveDollarPreset: () => void;
  onJumpToWalletWatch: () => void;
  beginnerFocusMode: boolean;
  onToggleBeginnerFocusMode: () => void;
}

interface CoachResponse {
  plainEnglishAnswer: string;
  liveChartTranslation: string;
  fiveDollarActionTip: string;
  jargonDecoded: Array<{ term: string; simpleMeaning: string }>;
}

const PLAIN_ENGLISH_GLOSSARY = [
  {
    term: 'Spot (1x) vs. Futures',
    plain:
      'Spot means actually owning the coin in your wallet—if you buy $5 of XLM, it cannot be "liquidated" to zero unless the coin itself goes to zero. Futures use borrowed money (leverage) and can wipe out beginners quickly.',
  },
  {
    term: 'Candlestick & Wicks',
    plain:
      'One bar showing a tug-of-war over time (like 1 hour). Green = buyers won that hour; Red = sellers won. The thin stick ("wick") shows a price buyers or sellers tried to reach before getting pushed back.',
  },
  {
    term: 'Stop-Loss ("Safety Exit")',
    plain:
      'Deciding BEFORE you buy at what exact price you admit the idea did not work and swap back to cash—so a 10-cent mistake never turns into losing half your wallet.',
  },
  {
    term: '1:2 Risk-Reward (R:R)',
    plain:
      'Only taking a trade when your realistic upside (+20 cents) is at least double what you risk losing (-10 cents). Even if you are right only 4 out of 10 times, you still come out ahead.',
  },
  {
    term: 'Fibonacci 50% / 61.8%',
    plain:
      'Think of it as waiting for a "sale" after a price jump. Instead of buying at the top of a spike, patient buyers wait for price to cool off halfway (50%–61.8%) before stepping in.',
  },
  {
    term: 'Spread & Bps (Basis Points)',
    plain:
      'The tiny fee gap between the instant buy price and instant sell price. 10 bps equals 0.10% (half a cent on $5). Lower bps means less money lost to trading friction.',
  },
];

export const StartHereRoadmap: React.FC<StartHereRoadmapProps> = ({
  symbol,
  onSelectSymbol,
  candles,
  fibLevels,
  livePrice,
  accountBalance,
  entryPrice,
  stopLoss,
  takeProfit,
  riskPercent,
  rrRatio,
  instrument,
  leverage,
  tradeSide,
  onActivateFiveDollarPreset,
  onJumpToWalletWatch,
  beginnerFocusMode,
  onToggleBeginnerFocusMode,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [showGlossary, setShowGlossary] = useState<boolean>(false);
  const [showScamXRay, setShowScamXRay] = useState<boolean>(false);
  const [keysImgError, setKeysImgError] = useState<boolean>(false);

  // Step 1 Interactive 5 XRP Pre-Send & Destination Tag Safety Checker (Xaman & Trust Wallet)
  const [testRecipientType, setTestRecipientType] = useState<'personal_xaman_trust' | 'exchange'>(
    'personal_xaman_trust'
  );
  const [testAddressInput, setTestAddressInput] = useState<string>('');
  const [testXrpAmount, setTestXrpAmount] = useState<string>('5');

  // Step 5 AI Mentor State
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [coachReply, setCoachReply] = useState<CoachResponse | null>(null);
  const [isAskingCoach, setIsAskingCoach] = useState<boolean>(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  // Interactive Wise-Choice Checklist (Step 4/5)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    lowFeeChain: true,
    spotOnly: true,
    notChasingSpike: false,
    knowExitPrice: false,
  });

  const coinName = symbol === 'BTCUSDT' ? 'BTC' : symbol === 'XRPUSDT' ? 'XRP' : 'XLM';
  const decimals = symbol === 'BTCUSDT' ? 2 : 4;

  // Live plain-English chart reading
  const liveReading = useMemo(() => {
    const recent = candles.slice(-40);
    const last = candles[candles.length - 1];
    if (!last || recent.length < 5) {
      return {
        zoneStatus: 'Fair Middle Range',
        zoneTone: 'text-sky-600 dark:text-sky-400',
        rangePositionPct: 50,
        candleStory: 'Waiting for live candle bars to load...',
        patternName: 'Normal Bar',
        wiseVerdict:
          'Wait for the chart to load, then check whether price is near a calm pullback zone.',
      };
    }

    const high = Math.max(...recent.map((c) => c.high));
    const low = Math.min(...recent.map((c) => c.low));
    const posPct = ((livePrice - low) / Math.max(high - low, 1e-8)) * 100;
    const isGreen = last.close >= last.open;
    const pat = last.detectedPattern;

    let zoneStatus = 'Middle Balance Zone (Wait for Clear Edge)';
    let zoneTone = 'text-sky-600 dark:text-sky-400';
    let wiseVerdict =
      'Price is sitting in the middle of its recent range. You do not need to rush—patient learners often wait for a dip closer to the 50%–61.8% pullback band.';

    if (posPct >= 78) {
      zoneStatus = 'Near Recent Ceiling (Caution: Chasing Risk)';
      zoneTone = 'text-amber-600 dark:text-amber-400';
      wiseVerdict =
        'Price is near the top of its recent range. Buying right after a big green run is where most beginners get trapped when early buyers take profit.';
    } else if (posPct >= 28 && posPct <= 55) {
      zoneStatus = 'Healthy Pullback / "Discount" Zone';
      zoneTone = 'text-emerald-600 dark:text-emerald-400';
      wiseVerdict =
        'Price has pulled back from its recent high into a calmer middle/support area—a much more disciplined spot to plan a small Spot entry with a clear safety exit.';
    } else if (posPct < 28) {
      zoneStatus = 'Near Recent Floor (Watch for Buyer Bounce)';
      zoneTone = 'text-amber-600 dark:text-amber-400';
      wiseVerdict =
        'Price is near its recent lows. Instead of guessing the bottom blindly, wait for a green reversal candle (like a Hammer or Bullish Engulfing) to show buyers actually stepped in.';
    }

    const candleStory = pat
      ? `The latest bar formed a "${pat.name}" (${pat.bias}): ${pat.whatItDoes}`
      : isGreen
      ? `In the current bar, buyers nudged ${coinName} upward from $${last.open.toFixed(
          decimals
        )} to $${last.close.toFixed(decimals)}.`
      : `In the current bar, sellers pushed ${coinName} slightly down from $${last.open.toFixed(
          decimals
        )} to $${last.close.toFixed(decimals)}.`;

    return {
      zoneStatus,
      zoneTone,
      rangePositionPct: Math.min(100, Math.max(0, posPct)),
      candleStory,
      patternName: pat ? `${pat.name} (${pat.bias})` : isGreen ? 'Green Up-Bar' : 'Red Down-Bar',
      wiseVerdict,
    };
  }, [candles, livePrice, coinName, decimals]);

  // Concrete $5 Wallet Numbers
  const fiveDollarPlan = useMemo(() => {
    const budget = accountBalance;
    const safeEntry = entryPrice > 0 ? entryPrice : livePrice;
    const riskUsd = budget * (riskPercent / 100);
    const rewardUsd = riskUsd * rrRatio;
    const stopDist = Math.max(Math.abs(safeEntry - stopLoss), 1e-6);
    const rawUnits = riskUsd / stopDist;
    // In a real 1x Spot wallet without leverage, you cannot buy more coins than your total cash budget!
    const maxSpotUnits = budget / Math.max(safeEntry, 1e-6);
    const actualSpotUnits = Math.min(rawUnits, maxSpotUnits);
    const cashUsedUsd = actualSpotUnits * safeEntry;
    const cashKeptSafeUsd = Math.max(0, budget - cashUsedUsd);
    const actualLossIfStopped = actualSpotUnits * stopDist;
    const actualGainIfTarget = actualSpotUnits * Math.abs(takeProfit - safeEntry);

    const fib618 = fibLevels.find((f) => f.ratio === 0.618)?.price ?? safeEntry * 0.98;

    return {
      budget,
      safeEntry,
      actualSpotUnits,
      cashUsedUsd,
      cashKeptSafeUsd,
      actualLossIfStopped,
      actualGainIfTarget,
      fib618,
    };
  }, [accountBalance, entryPrice, livePrice, riskPercent, rrRatio, stopLoss, takeProfit, fibLevels]);

  const askAiMentor = async (promptQuestion: string) => {
    const q = promptQuestion.trim();
    if (!q) return;
    setIsAskingCoach(true);
    setCoachError(null);
    try {
      const res = await fetch('/api/learning-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          symbol,
          livePrice: livePrice.toFixed(decimals),
          accountBalance: accountBalance.toFixed(2),
          entryPrice: fiveDollarPlan.safeEntry.toFixed(decimals),
          stopLoss: stopLoss.toFixed(decimals),
          takeProfit: takeProfit.toFixed(decimals),
          riskUsd: fiveDollarPlan.actualLossIfStopped.toFixed(2),
          rewardUsd: fiveDollarPlan.actualGainIfTarget.toFixed(2),
          candlePattern: liveReading.patternName,
          priceZoneStatus: liveReading.zoneStatus,
          instrument,
          leverage,
        }),
      });
      const rawText = await res.text();
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        throw new Error('AI Learning Coach was briefly refreshing. Please tap Ask again.');
      }
      if (!res.ok) {
        throw new Error(
          typeof data.error === 'string' ? data.error : 'Could not reach AI Learning Coach'
        );
      }
      setCoachReply(data as unknown as CoachResponse);
    } catch (err: unknown) {
      setCoachError(err instanceof Error ? err.message : 'Error contacting AI Learning Coach');
    } finally {
      setIsAskingCoach(false);
    }
  };

  const isFiveDollarSpotReady = accountBalance === 5 && instrument === 'spot' && leverage === 1;

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-5 space-y-5">
      {/* Top Banner: Start Here Orientation + $5 Mode Switch */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400">
            <span>Start Here · $5 Guided Training Sandbox</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 dark:text-emerald-400">
              100% Risk-Free Simulation Inside App (Zero Real Funds Deposited · Not Financial Advice)
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            Learn Market Decisions Safely with a $5 Real-Wallet Roadmap
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Every slider, AI check, and trade ticket inside Symphony Markets Academy runs in a <strong>100% simulated learning sandbox</strong>. When you choose to test a real $5 Spot swap on public Stellar (XLM) or XRP Ledger rails, you do so strictly inside your own external self-custody wallet app.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onActivateFiveDollarPreset}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isFiveDollarSpotReady
                ? 'bg-emerald-600 text-white'
                : 'bg-sky-600 hover:bg-sky-500 text-white'
            }`}
          >
            {isFiveDollarSpotReady
              ? '✓ $5 Spot Wallet Mode Active'
              : 'Set App to $5 Wallet Mode (1x Spot)'}
          </button>

          <button
            type="button"
            onClick={() => setShowGlossary((g) => !g)}
            className="px-3 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {showGlossary ? 'Hide Plain-English Dictionary' : 'Decode Jargon (Dictionary)'}
          </button>

          <button
            type="button"
            onClick={() => setShowScamXRay((x) => !x)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
              showScamXRay
                ? 'border-rose-500/60 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span>{showScamXRay ? 'Hide Scam X-Ray' : 'Red-Flag Scam X-Ray'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleBeginnerFocusMode}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-sky-500/50 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {beginnerFocusMode
              ? 'Open 11-Module Skill & AI DEX Labs →'
              : 'Jump to 11-Module Skill & AI DEX Labs →'}
          </button>
        </div>
      </div>

      {/* Collapsible Interactive Red-Flag Scam X-Ray */}
      {showScamXRay && <ScamScreenXRayInspector />}

      {/* Dedicated $5 Blueprint & Survival Finance Section Video */}
      <SectionPromoVideoBanner
        sectionBadge="$5 Blueprint & Survival Finance · Synced From Google Drive"
        headline="Symphony Markets Academy — Survival Finance & The $5 Blueprint"
        description="Watch our new 5:07 Survival Finance walkthrough on why capital preservation comes before profit, how the $5 Spot Roadmap and sub-penny XRPL/Stellar rails work, and how the 2.0% (10-Cent) risk cap protects students from wipeouts."
        accentTone="sky"
        tracks={[
          {
            id: 'survival_finance_full',
            tabLabel: '01 · Survival Finance (5:07)',
            title: 'Survival Finance & Traditional Markets',
            duration: '5:07',
            videoSrc: '/assets/Survival_Finance_Traditional_Markets.mp4',
            driveFileId: '1pCtFdKXo6Fhd88QnSCoH95qlRTXAf5Dj',
            posterSrc: videoCoverWalletImg,
          },
          {
            id: 'five_dollar_full',
            tabLabel: '02 · Full $5 Blueprint (4:40)',
            title: 'Symphony Markets Academy: The $5 Blueprint',
            duration: '4:40',
            videoSrc: '/assets/aistudio/Symphony_Markets__The__5_Blueprint_781e68ab.mp4',
            driveFileId: '1RNomMOr0irdvq0nsbm8nQh2fhooCPoBp',
            posterSrc: videoCoverWalletImg,
          },
          {
            id: 'five_dollar_promo',
            tabLabel: '03 · Five Dollar Promo (0:10)',
            title: 'Symphony Markets Academy Five Dollar Promo',
            duration: '0:10',
            videoSrc: '/api/drive-video/1iGNAlXhg2f03A3z-a4T_3wCElOijfkdX',
            driveFileId: '1iGNAlXhg2f03A3z-a4T_3wCElOijfkdX',
            posterSrc: videoCoverWalletImg,
          },
        ]}
      />

      {/* Collapsible Plain-English Jargon Decoder */}
      {showGlossary && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-900 dark:text-white">
            Plain-English Decoder — What All Those Dashboard Terms Actually Mean
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PLAIN_ENGLISH_GLOSSARY.map((item) => (
              <div
                key={item.term}
                className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1"
              >
                <div className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                  {item.term}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.plain}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5-Step Guided Progress Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { num: 1 as const, label: '1. Protect Your $5' },
          { num: 2 as const, label: '2. Read the Chart' },
          { num: 3 as const, label: '3. Check Buy Zone' },
          { num: 4 as const, label: '4. 10-Cent Safety Plan' },
          { num: 5 as const, label: '5. Ask AI Mentor' },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setStep(s.num)}
            className={`px-3 py-2.5 text-left text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap truncate cursor-pointer ${
              step === s.num
                ? 'bg-slate-900 dark:bg-sky-600 border-slate-900 dark:border-sky-600 text-white'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* STEP 1: PROTECT YOUR $5 (WALLET, FEES & RESERVES) */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Step 1: How to Use a Real $5 Wallet Without Losing It to Hidden Traps
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Most beginners who try crypto with $5 accidentally lose $2–$4 on their very first click—not because of a bad trade, but because of <strong>network gas fees</strong> or <strong>wallet reserve rules</strong>. Here are the 3 golden rules for a $5 real-wallet test:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <strong className="text-slate-900 dark:text-white">
                  Rule A — Use XLM (Stellar) or XRP, Never Ethereum Mainnet for $5:
                </strong>{' '}
                <span className="text-slate-600 dark:text-slate-300">
                  Swapping on Ethereum can cost $2+ in gas fees (40% of your $5!). On{' '}
                  <strong>Stellar (XLM)</strong> or <strong>XRP Ledger (XRP)</strong>, a transaction costs{' '}
                  <span className="font-mono">~$0.00005</span> (less than a hundredth of a penny), so you can practice dozens of real swaps without fees eating your $5.
                </span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <strong className="text-slate-900 dark:text-white">
                  Rule B — Know the "1-Coin Wallet Activation Reserve":
                </strong>{' '}
                <span className="text-slate-600 dark:text-slate-300">
                  Self-custody wallets (like Trust Wallet, Lobstr, or Xaman) keep <strong>1 XLM</strong> (~$0.41) on Stellar or <strong>1 XRP</strong> (~$2.42) on XRPL locked as an anti-spam account reserve. With a $5 budget, <strong>Stellar (XLM)</strong> leaves over <strong>$4.30+</strong> completely unlocked to swap back and forth with USDC!
                </span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <strong className="text-slate-900 dark:text-white">
                  Rule C — Never Type Your 12-Word Secret Phrase Anywhere:
                </strong>{' '}
                <span className="text-slate-600 dark:text-slate-300">
                  Keep your $5 safely inside your own wallet app on your phone. To track your live balance inside Symphony Markets Academy, paste <strong>only your Public Receive Address</strong> (starts with <span className="font-mono">G...</span> for XLM or <span className="font-mono">r...</span> for XRP).
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/60 dark:bg-slate-950/60 space-y-4">
            {/* Visual 5-Coin ($5.00) Stack + 10-Cent Safety Slice */}
            <div className="space-y-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Visual $5.00 Wallet Breakdown ({coinName})
                </span>
                <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 tabular-nums">
                  2% Max Risk = $0.10 Slice
                </span>
              </div>

              {/* 5 Visual $1 Coins */}
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((dollarIdx) => {
                  const reserveUsd =
                    symbol === 'BTCUSDT'
                      ? 0
                      : symbol === 'XLMUSDT'
                      ? 0.41
                      : Math.min(4.2, livePrice);
                  const isFullReserve = dollarIdx <= Math.floor(reserveUsd);
                  const isPartialReserve =
                    !isFullReserve && dollarIdx === Math.floor(reserveUsd) + 1 && reserveUsd % 1 > 0.05;
                  const isRiskSliceCoin = dollarIdx === 5;

                  return (
                    <div
                      key={dollarIdx}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <div
                        className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center font-mono text-xs font-bold tabular-nums ${
                          isFullReserve
                            ? 'bg-amber-500/20 border-amber-500 text-amber-800 dark:text-amber-300'
                            : isPartialReserve
                            ? 'bg-gradient-to-r from-amber-500/25 via-emerald-500/15 to-emerald-500/20 border-amber-500/80 text-slate-900 dark:text-white'
                            : isRiskSliceCoin
                            ? 'bg-emerald-500/15 border-sky-500 text-slate-900 dark:text-white ring-2 ring-rose-500/40'
                            : 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {isFullReserve ? (
                          <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <span>$1</span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 leading-tight">
                        {isFullReserve
                          ? 'Reserve'
                          : isPartialReserve
                          ? symbol === 'XLMUSDT'
                            ? '41¢ Lock'
                            : 'Part Lock'
                          : isRiskSliceCoin
                          ? '10¢ Risk'
                          : 'Safe Free'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                  1-Coin Wallet Reserve stays yours
                </span>
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  $4.90 of $5 protected by Stop Exit
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Quick $5 Network Comparison (Simulation vs. Live Public Ledger)
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Clicking below loads live market prices into our <strong>Risk-Free Paper Sandbox</strong>. Real on-chain swaps happen only when you open your own external wallet (Lobstr, Xaman, or Trust Wallet):
              </p>
            </div>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  onSelectSymbol('BTCUSDT');
                  onActivateFiveDollarPreset();
                }}
                className={`w-full p-3 text-left rounded-lg border transition-colors cursor-pointer ${
                  symbol === 'BTCUSDT'
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex justify-between font-semibold text-slate-900 dark:text-white">
                  <span>Bitcoin (BTC) · Satoshis Self-Custody</span>
                  <span className="text-amber-600 dark:text-amber-400">$0 Base Reserve</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                  In-App: Simulated Paper Sizing · Live Ledger: $5 buys ~5,500 Satoshis (0.000055 BTC, 21M hard cap)
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectSymbol('XLMUSDT');
                  onActivateFiveDollarPreset();
                }}
                className={`w-full p-3 text-left rounded-lg border transition-colors cursor-pointer ${
                  symbol === 'XLMUSDT'
                    ? 'border-sky-500 bg-sky-500/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex justify-between font-semibold text-slate-900 dark:text-white">
                  <span>Stellar (XLM) · Sandbox + Public Network</span>
                  <span className="text-emerald-600 dark:text-emerald-400">~$0.41 Base Reserve</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                  In-App: Simulated Paper Sizing · Live Ledger: $5 buys ~12 XLM ($0.00005 fee, ~$4.35+ unlocked)
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectSymbol('XRPUSDT');
                  onActivateFiveDollarPreset();
                }}
                className={`w-full p-3 text-left rounded-lg border transition-colors cursor-pointer ${
                  symbol === 'XRPUSDT'
                    ? 'border-sky-500 bg-sky-500/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex justify-between font-semibold text-slate-900 dark:text-white">
                  <span>XRP Ledger (XRP) · Sandbox + Public Network</span>
                  <span className="text-sky-600 dark:text-sky-400">1 XRP Base Reserve</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                  In-App: Simulated Paper Sizing · Live Ledger: $5 buys ~2 XRP ($0.00003 fee, 1 XRP base lock)
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onJumpToWalletWatch}
                className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                Watch My Public Wallet Address →
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Next: Step 2 →
              </button>
            </div>
          </div>

          {/* Full-Width Interactive 5 XRP Pre-Send & Destination Tag Checker (Xaman Android vs. Trust Wallet) */}
          <div className="lg:col-span-12 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Real-Wallet Pre-Send Safety Check · Xaman Wallet (Android / iOS) & Trust Wallet
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Testing a 5 XRP Send? Check “Why No Destination Tag Shows Up” & Verify `r...` vs. `0x...` First
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                100% Local Check · Never Paste Seed Phrases
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-6 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    1. Where are you sending your XRP?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTestRecipientType('personal_xaman_trust')}
                      className={`p-2.5 rounded-lg border text-left font-semibold transition-colors cursor-pointer ${
                        testRecipientType === 'personal_xaman_trust'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      My Own Xaman / Trust Wallet
                      <span className="block font-normal text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Personal self-custody `r...` address
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestRecipientType('exchange')}
                      className={`p-2.5 rounded-lg border text-left font-semibold transition-colors cursor-pointer ${
                        testRecipientType === 'exchange'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Centralized Exchange Deposit
                      <span className="block font-normal text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Coinbase, Uphold, Kraken, Binance
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-8">
                    <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      2. Paste Recipient Public Address (Optional Check)
                    </label>
                    <input
                      type="text"
                      value={testAddressInput}
                      onChange={(e) => setTestAddressInput(e.target.value)}
                      placeholder="Paste r... (Native XRPL) or 0x... to test"
                      className="w-full px-3 py-2 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      Send Amount (XRP)
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      value={testXrpAmount}
                      onChange={(e) => setTestXrpAmount(e.target.value)}
                      className="w-full px-3 py-2 font-mono tabular-nums text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong className="block text-slate-900 dark:text-white">
                    Why Trust Wallet Sometimes Hides the “Destination Tag” Box:
                  </strong>
                  <p>
                    1. <strong>Check for Wrapped BEP-20 XRP (`0x...`):</strong> Trust Wallet lists both <strong>Native XRP (`XRP Ledger`, starts with `r...`)</strong> and <strong>Binance-Peg XRP (`BNB Smart Chain / BEP20`, starts with `0x...`)</strong>. BEP-20 XRP has <em>no</em> Destination Tag field and <strong>cannot</strong> be sent to a native `r...` Xaman address!
                  </p>
                  <p>
                    2. <strong>Why Xaman Wallet on Android Is Ideal:</strong> <strong>Xaman (`xaman.app`)</strong> is built exclusively for the real XRP Ledger (`r...`). It always uses native XRP, warns automatically if an exchange requires a Destination Tag, and includes the native XRPL DEX right inside the app.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-3 text-xs">
                {(() => {
                  const trimmedAddr = testAddressInput.trim();
                  const parsedAmt = Math.max(0, parseFloat(testXrpAmount) || 0);
                  const isEvmWrongChain = trimmedAddr.startsWith('0x');
                  const isNativeXrpl = trimmedAddr.startsWith('r') && trimmedAddr.length >= 25;
                  const spendableAfterNewActivation = Math.max(0, parsedAmt - 1 - 0.00001);

                  if (isEvmWrongChain) {
                    return (
                      <div className="p-4 rounded-xl border border-rose-400 dark:border-rose-500/60 bg-rose-50/70 dark:bg-rose-950/30 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>STOP — `0x...` Address Detected (BNB Smart Chain / EVM, NOT Native XRPL!)</span>
                        </div>
                        <p className="text-rose-800 dark:text-rose-200 leading-relaxed">
                          This address starts with <span className="font-mono font-bold">0x</span>, which means it is on an Ethereum/BNB Smart Chain network—<strong>not</strong> the native XRP Ledger! That is why Trust Wallet does not show a Destination Tag option on BEP-20 XRP. Do not send between `0x...` and `r...` addresses directly. In Trust Wallet, enable <strong>XRP (XRP Ledger)</strong> whose Receive address starts with lowercase <span className="font-mono font-bold">r</span>.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
                      <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          {testRecipientType === 'personal_xaman_trust'
                            ? 'Personal Xaman / Trust Wallet (`r...`): NO Destination Tag Needed!'
                            : 'Exchange Deposit (`r...`): Destination Tag IS Mandatory!'}
                        </span>
                      </div>

                      {testRecipientType === 'personal_xaman_trust' ? (
                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                          When sending {parsedAmt || 5} XRP to <strong>your own Android Xaman Wallet</strong> (or personal Trust Wallet `r...` address), <strong>you do NOT need a Destination Tag</strong> because that `r...` account belongs 100% to you alone. Leave the Tag/Memo blank—as long as both wallets show native <span className="font-mono font-bold">r...</span> addresses!
                        </p>
                      ) : (
                        <p className="text-amber-900 dark:text-amber-200 leading-relaxed">
                          Centralized exchanges share one vault `r...` address across thousands of users. You <strong>MUST enter the numeric Destination Tag / Memo</strong> shown on your exchange deposit screen. If Trust Wallet is not showing a Tag/Memo field at all, verify you selected <strong>Native XRP (`r...`)</strong> and not BEP-20 XRP (`0x...`)!
                        </p>
                      )}

                      {trimmedAddr && !isNativeXrpl && (
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300">
                          Heads-up: Native XRP Ledger addresses always start with a lowercase <strong>r</strong> (25–35 characters, e.g., <span className="font-mono">rEb8...</span>). Double-check the address in Xaman by tapping <strong>Receive</strong>.
                        </div>
                      )}

                      <div className="pt-2.5 border-t border-emerald-200 dark:border-emerald-500/30 space-y-1.5 font-mono text-[11px] tabular-nums text-slate-700 dark:text-slate-300">
                        <div className="font-sans font-bold text-slate-900 dark:text-white">
                          1 XRP Reserve Math for Your {parsedAmt || 5} XRP Test:
                        </div>
                        <div>
                          • If receiving into a brand-new Xaman (`0 XRP`) wallet:{' '}
                          <strong className="text-amber-700 dark:text-amber-400">1.00 XRP</strong> locks as Base Reserve →{' '}
                          <strong className="text-emerald-700 dark:text-emerald-400">
                            {spendableAfterNewActivation.toFixed(2)} XRP
                          </strong>{' '}
                          is immediately spendable!
                        </div>
                        <div>
                          • If sending OUT of a Trust Wallet that holds only{' '}
                          <strong>{parsedAmt || 5}.00 XRP total</strong>: XRPL keeps{' '}
                          <strong>1.00 XRP</strong> inside Trust Wallet, so max sendable is{' '}
                          <strong className="text-sky-700 dark:text-sky-400">
                            ~{Math.max(0, (parsedAmt || 5) - 1.0001).toFixed(4)} XRP
                          </strong>
                          .
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Full-Width Educational Textbook Infographic for Rule C: Private Vault Key vs. Public Viewing Window */}
          <div className="lg:col-span-12 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-5">
              {!keysImgError ? (
                <img
                  src={selfCustodyKeysImg}
                  alt="Architectural diagram comparing Private Cryptographic Key locked inside a brass vault versus an open glass Public Cryptographic Address viewing window"
                  referrerPolicy="no-referrer"
                  onError={() => setKeysImgError(true)}
                  className="w-full aspect-16/9 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
                />
              ) : (
                <div className="w-full aspect-16/9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 text-xs text-slate-600 dark:text-slate-400">
                  Private Key (Locked Vault — Never Share) vs. Public Address (Read-Only Viewing Window)
                </div>
              )}
            </div>
            <div className="md:col-span-7 space-y-2 text-xs">
              <div className="font-semibold text-sky-600 dark:text-sky-400">
                Visualizing Rule C · How Self-Custody Keys Actually Work
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Left = Your Private 12-Word / Secret Numbers Key (Never Share) · Right = Your Public Viewing Window (Safe to Paste)
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Think of your wallet as having two completely different parts: your <strong>Private Key</strong> (12-word phrase in Trust Wallet, or 8-row Secret Numbers / phrase in Xaman) is the physical brass master key locked inside your own Android phone—anyone who sees it can open the safe. Your <strong>Public Receive Address</strong> (<span className="font-mono">r...</span> in Xaman/XRPL or <span className="font-mono">G...</span> in Stellar) is simply a bulletproof glass window that lets you (or Symphony Markets Academy) view the balance from the outside with zero ability to touch your coins.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: READ THE CHART IN PLAIN ENGLISH */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Step 2: What the {coinName} Chart Below Is Saying Right Now (In Plain English)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              You don’t need to memorize 50 indicators. Look at the candlestick chart right below this box—it only shows three simple things:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <svg viewBox="0 0 120 34" className="w-full h-8" aria-hidden="true">
                  <line x1="35" y1="4" x2="35" y2="30" stroke="#10B981" strokeWidth="2" />
                  <rect x="27" y="9" width="16" height="14" rx="2" fill="#10B981" />
                  <line x1="85" y1="4" x2="85" y2="30" stroke="#F43F5E" strokeWidth="2" />
                  <rect x="77" y="11" width="16" height="14" rx="2" fill="#F43F5E" />
                </svg>
                <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                  1. Green & Red Bars
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Green means buyers pushed price higher during that time block. Red means sellers pushed it lower.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <svg viewBox="0 0 120 34" className="w-full h-8" aria-hidden="true">
                  <path d="M8,26 Q45,20 75,14 T112,7" fill="none" stroke="#0284C7" strokeWidth="2.5" />
                  <path d="M8,30 Q48,25 80,20 T112,15" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="3 2" />
                </svg>
                <div className="font-semibold text-sky-600 dark:text-sky-400">
                  2. Blue & Purple Trend Lines
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  The smooth lines show the average price. When the blue line (EMA 20) stays above the purple line (SMA 50), the overall tide is rising.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <svg viewBox="0 0 120 34" className="w-full h-8" aria-hidden="true">
                  <line x1="8" y1="6" x2="112" y2="6" stroke="#F43F5E" strokeWidth="1.5" strokeDasharray="3 3" />
                  <rect x="8" y="16" width="104" height="10" fill="#10B981" fillOpacity="0.2" />
                  <line x1="8" y1="21" x2="112" y2="21" stroke="#10B981" strokeWidth="1.5" />
                </svg>
                <div className="font-semibold text-amber-600 dark:text-amber-400">
                  3. Colored Horizontal Zones
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Fibonacci bands mark "ceiling" (0%) and "discount pullback" (50%–61.8%) zones so you can see if price is high or on sale.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/60 dark:bg-slate-950/60 space-y-3">
            <div className="text-xs font-semibold text-slate-900 dark:text-white">
              Live Translation of {coinName} (${livePrice.toFixed(decimals)})
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              {liveReading.candleStory}
            </p>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Tip: Click any single bar on the candlestick chart below to read what that specific candle shape means!
            </div>
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Next: Step 3 (Check Buy Zone) →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: CHECK WHETHER NOW IS A WISE ENTRY OR CHASING */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Step 3: Wise Choice Habit #1 — Never Buy Right at the Ceiling
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              When a coin suddenly shoots up with huge green candles, human emotion says <em>"Buy now before I miss out!"</em> In real markets, buying at the ceiling means buying from earlier traders who are cashing out. Wise traders check <strong>where price sits between its recent Floor (0%) and Ceiling (100%)</strong>:
            </p>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-400">
                  Current {coinName} Position in Recent Range:
                </span>
                <span className={`font-semibold ${liveReading.zoneTone}`}>
                  {liveReading.zoneStatus} ({liveReading.rangePositionPct.toFixed(0)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-transform duration-200 origin-left"
                  style={{ width: `${liveReading.rangePositionPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>0% Recent Floor</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  35%–55% Calm Pullback Sweet Spot
                </span>
                <span>100% Recent Ceiling</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/60 dark:bg-slate-950/60 space-y-3">
            <div className="text-xs font-semibold text-slate-900 dark:text-white">
              Plain-English Readout Right Now
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              {liveReading.wiseVerdict}
            </p>
            <div className="text-xs font-mono text-slate-600 dark:text-slate-400 tabular-nums">
              Fibonacci 61.8% "Sale" Level: <strong>${fiveDollarPlan.fib618.toFixed(decimals)}</strong>
            </div>
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Next: Step 4 ($5 Safety Math) →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: YOUR EXACT $5 WALLET PLAN (THE 10-CENT RULE) */}
      {step === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Step 4: The "10-Cent Safety Net" on Your ${fiveDollarPlan.budget.toFixed(2)} Budget
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Even when you buy <strong>${fiveDollarPlan.cashUsedUsd.toFixed(2)}</strong> worth of {coinName} in your real wallet, you do <strong>not</strong> risk losing all $5! By picking your "Safety Exit" price before you buy, a wrong guess only costs pennies—teaching you the exact habit professionals use with $50,000:
            </p>

            {/* Visual Proportional Wallet Protection Bar */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Visual Wallet Shield: Protected Capital vs. Risk Slice
                </span>
                <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                  1:{rrRatio} Reward-to-Risk Ratio
                </span>
              </div>
              <div className="w-full h-9 rounded-lg overflow-hidden flex font-mono text-xs font-bold tabular-nums border border-slate-300 dark:border-slate-700">
                <div
                  style={{
                    width: `${Math.max(
                      72,
                      100 -
                        Math.min(
                          28,
                          (fiveDollarPlan.actualLossIfStopped /
                            Math.max(fiveDollarPlan.budget, 0.01)) *
                            100 *
                            4
                        )
                    )}%`,
                  }}
                  className="bg-emerald-600 text-white flex items-center justify-center px-2 whitespace-nowrap overflow-hidden"
                >
                  Kept Safe ${(fiveDollarPlan.budget - fiveDollarPlan.actualLossIfStopped).toFixed(2)}
                </div>
                <div className="flex-1 bg-rose-600 text-white flex items-center justify-center px-2 whitespace-nowrap">
                  Risk -${fiveDollarPlan.actualLossIfStopped.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono tabular-nums">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="font-sans text-slate-500 dark:text-slate-400">1. Buy Entry Price</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  ${fiveDollarPlan.safeEntry.toFixed(decimals)}
                </div>
                <div className="font-sans text-[11px] text-slate-500 mt-0.5">
                  Buy ~{fiveDollarPlan.actualSpotUnits.toFixed(2)} {coinName} (${fiveDollarPlan.cashUsedUsd.toFixed(2)})
                </div>
              </div>

              <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/5">
                <div className="font-sans text-rose-600 dark:text-rose-400">
                  2. Safety Exit (If Wrong)
                </div>
                <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  ${stopLoss.toFixed(decimals)}
                </div>
                <div className="font-sans text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                  Loss: -${fiveDollarPlan.actualLossIfStopped.toFixed(2)} (Keep $
                  {(fiveDollarPlan.budget - fiveDollarPlan.actualLossIfStopped).toFixed(2)} safe!)
                </div>
              </div>

              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                <div className="font-sans text-emerald-600 dark:text-emerald-400">
                  3. Profit Goal (1:{rrRatio} Target)
                </div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ${takeProfit.toFixed(decimals)}
                </div>
                <div className="font-sans text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                  Gain: +${fiveDollarPlan.actualGainIfTarget.toFixed(2)} (Wallet → $
                  {(fiveDollarPlan.budget + fiveDollarPlan.actualGainIfTarget).toFixed(2)})
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/60 dark:bg-slate-950/60 space-y-2.5">
            <div className="text-xs font-semibold text-slate-900 dark:text-white">
              Pre-Swap Wise Choice Checklist
            </div>
            {[
              { id: 'lowFeeChain', text: 'I am using a low-fee network (XLM or XRP, <1 cent fee).' },
              { id: 'spotOnly', text: 'I am buying 1x Spot coin (zero borrowed leverage).' },
              { id: 'notChasingSpike', text: 'I checked Step 3 and I am not FOMO-chasing a ceiling spike.' },
              {
                id: 'knowExitPrice',
                text: `I wrote down my Safety Exit ($${stopLoss.toFixed(decimals)}) & Profit Goal ($${takeProfit.toFixed(decimals)}).`,
              },
            ].map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={Boolean(checkedItems[item.id])}
                  onChange={() =>
                    setCheckedItems((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                  }
                  className="mt-0.5 accent-sky-600"
                />
                <span>{item.text}</span>
              </label>
            ))}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Next: Step 5 (Ask AI Mentor) →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: INTERACTIVE AI PLAIN-ENGLISH TRADING MENTOR */}
      {step === 5 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Step 5: Ask Your AI Plain-English Mentor
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              The AI Mentor reads the live {coinName} price (${livePrice.toFixed(decimals)}), latest candlestick pattern, and your ${accountBalance.toFixed(2)} plan right now—and explains anything you want in plain, jargon-free English:
            </p>

            <div className="space-y-1.5">
              {[
                `Is right now a wise time to test a $5 Spot buy on ${coinName}, or should I wait for a pullback?`,
                `Explain everything happening on the ${coinName} chart right now like I am brand new.`,
                `How do I execute this $5 ${coinName} plan safely inside a wallet like Trust Wallet without losing money to fees?`,
                `Why does risking 10 cents to make 20 cents matter if it's only $5?`,
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={isAskingCoach}
                  onClick={() => askAiMentor(q)}
                  className="w-full p-2.5 text-left text-xs rounded-lg border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:bg-sky-500/5 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  “{q}”
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                askAiMentor(customQuestion);
              }}
              className="flex items-center gap-2 pt-1"
            >
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Or ask any question in your own words..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={isAskingCoach || !customQuestion.trim()}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isAskingCoach ? 'Thinking...' : 'Ask AI'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/60 dark:bg-slate-950/60 min-h-[220px] flex flex-col justify-between gap-3">
            {coachError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
                {coachError}
              </div>
            )}

            {isAskingCoach ? (
              <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                Reading live {coinName} candles and preparing your plain-English explanation...
              </div>
            ) : coachReply ? (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="font-semibold text-sky-600 dark:text-sky-400 mb-1">
                    AI Mentor Explanation
                  </div>
                  <p className="text-slate-800 dark:text-slate-100 leading-relaxed">
                    {coachReply.plainEnglishAnswer}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    What the Live {coinName} Chart Shows Right Now
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {coachReply.liveChartTranslation}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                  <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                    Your $5 Wise-Habit Takeaway
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {coachReply.fiveDollarActionTip}
                  </p>
                </div>

                {coachReply.jargonDecoded && coachReply.jargonDecoded.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {coachReply.jargonDecoded.slice(0, 4).map((j, i) => (
                      <div key={i} className="text-[11px] text-slate-600 dark:text-slate-400">
                        <strong className="text-slate-900 dark:text-white">{j.term}:</strong>{' '}
                        {j.simpleMeaning}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="font-semibold text-slate-700 dark:text-slate-200">
                  Click any question on the left (or type your own) to start!
                </div>
                <p className="max-w-md mx-auto leading-relaxed">
                  Your AI Mentor will translate the live {coinName} chart, candlesticks, and $5 safety numbers into clear everyday language before you test a real wallet swap.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
