import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  FastForward,
  Lock,
  LogOut,
  Music,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  StepForward,
  Volume2,
  VolumeX,
  Wallet,
} from 'lucide-react';
import {
  User,
  auth,
  onAuthStateChanged,
  recordBatchTenSetApprovalsInFirestore,
  recordWalletSetApprovalInFirestore,
  signInWithGoogleForWallet,
  signOutGoogleWalletGate,
  unlockLiveWalletSessionInFirestore,
} from '../firebase';
import { AssetSymbol, Candle, FibonacciLevel, PaperPosition } from '../types/market';
import {
  SetMusicalNoteMeta,
  getSetMusicalNoteMeta,
  playTradeSetSymphonyNote,
} from '../utils/tenSetSymphonyAudio';
import { LiveWalletUptickTracker } from './LiveWalletUptickTracker';
import { RealXrplAccountExecutionGuide } from './RealXrplAccountExecutionGuide';

interface TenSetAutoTraderLabProps {
  symbol: AssetSymbol;
  onSelectSymbol: (sym: AssetSymbol) => void;
  candles: Candle[];
  fibLevels: FibonacciLevel[];
  livePrice: number;
  btcLivePrice?: number;
  xrpLivePrice: number;
  xlmLivePrice: number;
  accountBalance: number;
  riskPercent: number;
  onLogSetPositionToPortfolio?: (
    pos: Omit<PaperPosition, 'id' | 'openedAt' | 'status'>
  ) => void;
  onSendSetToEmbeddedXrplDex?: (payload: {
    setNumber: number;
    setupName: string;
    buyPrice: number;
    stopLossPrice: number;
    sellPrice: number;
    quantityXrp: number;
    rrRatio: number;
    walletAddress?: string;
  }) => void;
}

type ExecutionMode = 'simulated' | 'trust_wallet_live';

interface VerifiedLiveWallet {
  address: string;
  shortAddress: string;
  walletLabel: string;
  coinTicker: 'BTC' | 'XRP' | 'XLM';
  totalCoins: number;
  reservedCoins: number;
  spendableCoins: number;
  checkedAt: string;
}

interface AutomatedTradeSet {
  setNumber: number;
  setupName: string;
  patternBadge: string;
  buyPrice: number;
  stopLossPrice: number;
  sellPrice: number;
  quantity: number;
  riskUsd: number;
  pnlUsd: number;
  pnlCoins: number;
  effectiveRMultiple: number;
  rMultiple: number;
  outcome: 'WIN_TARGET_HIT' | 'CONTROLLED_1R_STOP';
  winOrdinalIndex: number;
  musicalNote: SetMusicalNoteMeta;
  startingCoinsBefore: number;
  cumulativeCoinsAfter: number;
  cumulativeBalanceAfter: number;
  cappedBySpotWallet: boolean;
  whatItDid: string;
  whyItBought: string;
  whyItSold: string;
  studentLesson: string;
  trustWalletTxPayload: string;
}

interface AiTenSetExplanation {
  headline: string;
  whatTheEngineDid: string;
  whyTenSetsMatter: string;
  stopLossLesson: string;
  advancedStudentTakeaways: string[];
}

interface SetMarkHitReceipt {
  setNumber: number;
  setupBadge: string;
  coinTicker: 'BTC' | 'XRP' | 'XLM';
  quantityText: string;
  buyMarkPrice: string;
  buyHitAt: string;
  exitMarkPrice: string;
  exitHitAt: string | null;
  status: 'BUY_MARK_HIT' | 'PROFIT_TARGET_HIT' | 'SAFETY_STOP_HIT';
  rMultiple: number;
  pnlUsd: number;
  balanceAfterText: string;
  whatHappenedLine: string;
}

interface LiveMarkNotification {
  timestamp: string;
  kind: 'BUY_HIT' | 'TARGET_SELL_HIT' | 'STOP_LOSS_HIT' | 'ALL_TEN_COMPLETED';
  title: string;
  detail: string;
}

declare global {
  interface Window {
    trustwallet?: {
      request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
    ethereum?: {
      isTrust?: boolean;
      request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export const TenSetAutoTraderLab: React.FC<TenSetAutoTraderLabProps> = ({
  symbol,
  onSelectSymbol,
  livePrice,
  btcLivePrice = 91450,
  xrpLivePrice = 2.42,
  xlmLivePrice = 0.415,
  accountBalance,
  riskPercent,
  onLogSetPositionToPortfolio,
  onSendSetToEmbeddedXrplDex,
}) => {
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('simulated');
  const [completedSetsCount, setCompletedSetsCount] = useState<number>(10);
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false);
  const [selectedSetNumber, setSelectedSetNumber] = useState<number>(1);

  // 10-Set Symphony Note Progression State (Simple & Zero-Clutter)
  const [isSymphonyPlaying, setIsSymphonyPlaying] = useState<boolean>(false);
  const [symphonyAudioEnabled, setSymphonyAudioEnabled] = useState<boolean>(true);

  // Gentle Screen De-Cluttering Toggles (Collapsed by default so screen breathes)
  const [showFullLedgerTable, setShowFullLedgerTable] = useState<boolean>(false);
  const [showWalletSignDrawer, setShowWalletSignDrawer] = useState<boolean>(false);
  const [showRawPayloadJson, setShowRawPayloadJson] = useState<boolean>(false);
  const [showRealXrpBridge, setShowRealXrpBridge] = useState<boolean>(true);

  // Google Authentication + Android-Ready 1-Tap Classroom Sign-Off Gate State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState<boolean>(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [classroomQuickUnlocked, setClassroomQuickUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('symphony_classroom_signoff_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  // Active Self-Custody Wallet State (Xaman Android/iOS & Trust Wallet)
  const [walletNetwork, setWalletNetwork] = useState<
    'Bitcoin' | 'Xaman_XRPL' | 'XRPL' | 'Stellar' | 'EVM_TrustExtension'
  >(() => {
    try {
      const savedNet = localStorage.getItem('symphony_last_wallet_net_v2');
      if (
        savedNet === 'Bitcoin' ||
        savedNet === 'Xaman_XRPL' ||
        savedNet === 'XRPL' ||
        savedNet === 'Stellar' ||
        savedNet === 'EVM_TrustExtension'
      ) {
        return savedNet;
      }
    } catch {
      // Ignore storage error
    }
    return symbol === 'BTCUSDT' ? 'Bitcoin' : symbol === 'XRPUSDT' ? 'Xaman_XRPL' : 'Stellar';
  });
  const [trustWalletAddress, setTrustWalletAddress] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('symphony_last_wallet_addr_v2') ||
        'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh'
      );
    } catch {
      return 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh';
    }
  });
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [walletStatusMsg, setWalletStatusMsg] = useState<string | null>(null);
  const [liveOnChainBalance, setLiveOnChainBalance] = useState<string | null>(null);
  const [verifiedWallet, setVerifiedWallet] = useState<VerifiedLiveWallet | null>(null);
  const [useLiveWalletSizing, setUseLiveWalletSizing] = useState<boolean>(true);
  const [isCheckingWallet, setIsCheckingWallet] = useState<boolean>(false);
  const [signedSetNumbers, setSignedSetNumbers] = useState<number[]>([]);
  const [cryptographicallySignedSets, setCryptographicallySignedSets] = useState<number[]>([]);
  const [copiedSpecsSet, setCopiedSpecsSet] = useState<number | null>(null);
  const [copiedMasterBatch, setCopiedMasterBatch] = useState<boolean>(false);
  const [walletActionFeedback, setWalletActionFeedback] = useState<string | null>(null);

  // Hands-Free "Confirm Once -> Auto-Execute All 10 Sets (Trust, Don't Control)" State
  const [batchConfirmedAllTen, setBatchConfirmedAllTen] = useState<boolean>(false);
  const [isHandsFreeStewardRunning, setIsHandsFreeStewardRunning] = useState<boolean>(false);
  const [handsFreePhase, setHandsFreePhase] = useState<
    'IDLE' | 'BUYING' | 'SELLING' | 'COMPLETED'
  >('IDLE');

  // Set-by-Set Buy & Sell Mark-Hit Notifications & Completion Receipt Log
  const [markHitReceipts, setMarkHitReceipts] = useState<SetMarkHitReceipt[]>([]);
  const [latestMarkNotification, setLatestMarkNotification] =
    useState<LiveMarkNotification | null>(null);
  const [showCompletionReport, setShowCompletionReport] = useState<boolean>(false);
  const [copiedCompletionReport, setCopiedCompletionReport] = useState<boolean>(false);
  const [deviceNotifyEnabled, setDeviceNotifyEnabled] = useState<boolean>(false);

  // AI Masterclass Explanation State
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<AiTenSetExplanation | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Track Firebase Google Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setGoogleUser(user);
      setIsAuthChecking(false);
    });
    return () => unsub();
  }, []);

  // Remember wallet address & network locally so Android users don't re-paste on reload
  useEffect(() => {
    try {
      if (trustWalletAddress.trim()) {
        localStorage.setItem('symphony_last_wallet_addr_v2', trustWalletAddress.trim());
      }
      localStorage.setItem('symphony_last_wallet_net_v2', walletNetwork);
    } catch {
      // Ignore storage restrictions
    }
  }, [trustWalletAddress, walletNetwork]);

  const isGoogleVerified = Boolean(googleUser && googleUser.emailVerified);
  const isWalletGateUnlocked = isGoogleVerified || classroomQuickUnlocked;

  const activeCoinTicker: 'BTC' | 'XRP' | 'XLM' =
    symbol === 'BTCUSDT' ? 'BTC' : symbol === 'XRPUSDT' ? 'XRP' : 'XLM';
  const isBtc = symbol === 'BTCUSDT';
  const priceDecimals = isBtc ? 2 : 4;
  const qtyDecimals = isBtc ? 6 : 2;

  const formatCoinPrice = (val: number) =>
    isBtc
      ? val.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : val.toFixed(4);

  const formatCoinQty = (qty: number) =>
    isBtc ? `${qty.toFixed(6)} BTC (${Math.round(qty * 100_000_000).toLocaleString()} sats)` : `${qty.toFixed(2)} ${activeCoinTicker}`;

  const formatCoinQtyCompact = (qty: number) =>
    isBtc ? `${qty.toFixed(5)} BTC` : `${qty.toFixed(2)} ${activeCoinTicker}`;

  const effectiveBasePrice =
    livePrice > 0
      ? livePrice
      : symbol === 'BTCUSDT'
      ? 91450
      : symbol === 'XRPUSDT'
      ? 2.42
      : 0.415;

  // Determine whether the 10-Set math is actively sized from the user's real connected wallet coins
  const isSizingFromLiveWallet =
    executionMode === 'trust_wallet_live' &&
    isWalletGateUnlocked &&
    walletConnected &&
    useLiveWalletSizing &&
    verifiedWallet !== null &&
    verifiedWallet.coinTicker === activeCoinTicker &&
    verifiedWallet.spendableCoins > 0;

  // Build the 10 educational & algorithmic Buy/Sell Sets dynamically from either Live Connected Wallet Spendable Coins OR Classroom Budget
  const tenSets = useMemo<AutomatedTradeSet[]>(() => {
    const basePrice = effectiveBasePrice;
    const coinTicker = activeCoinTicker;
    const startCoins = isSizingFromLiveWallet
      ? verifiedWallet.spendableCoins
      : Math.max(5, accountBalance) / basePrice;
    const startBal = Number((startCoins * basePrice).toFixed(2));
    const riskPctDecimal = Math.max(0.005, Math.min(0.05, riskPercent / 100));

    const blueprints: Array<{
      setupName: string;
      patternBadge: string;
      entryOffsetPct: number;
      stopDistPct: number;
      rMultiple: number;
      outcome: 'WIN_TARGET_HIT' | 'CONTROLLED_1R_STOP';
      whyItBought: string;
      whyItSold: string;
      studentLesson: string;
    }> = [
      {
        setupName: 'Set #01 · Fibonacci 61.8% Golden Pocket Pullback',
        patternBadge: 'Bullish Hammer + Fib 61.8%',
        entryOffsetPct: -0.018,
        stopDistPct: 0.018,
        rMultiple: 2.0,
        outcome: 'WIN_TARGET_HIT',
        whyItBought:
          'Price pulled back calmly into the 61.8% Fibonacci Golden Pocket support zone while printing a long lower Hammer wick—showing sellers were exhausted and buyers stepped in.',
        whyItSold:
          'Automatically placed the Sell limit order at exactly 1:2.0 Risk-to-Reward (+2.0R) just below the prior swing high ceiling so profits locked in before resistance.',
        studentLesson:
          'Never buy green spikes at the top. Waiting for the 61.8% Golden Pocket pullback lets you buy at wholesale and sell at retail.',
      },
      {
        setupName: 'Set #02 · 20 EMA Rising Staircase Bounce',
        patternBadge: '20/50 EMA Bullish Alignment',
        entryOffsetPct: -0.012,
        stopDistPct: 0.016,
        rMultiple: 2.0,
        outcome: 'WIN_TARGET_HIT',
        whyItBought:
          'The 20 EMA crossed above the 50 SMA (confirming a Bullish Staircase) and price touched the 20 EMA dynamic floor with RSI holding steady at 48.',
        whyItSold:
          'Sold into the upper Bollinger channel expansion at +2.0R once short-term RSI reached 68.',
        studentLesson:
          'In an uptrend, the 20-period Moving Average acts like a rising trampoline floor—buy when price rests on the line, not when it stretches far above it.',
      },
      {
        setupName: 'Set #03 · False Breakout Whip (Controlled 1R Safety Stop)',
        patternBadge: 'Stop-Loss Protection Test',
        entryOffsetPct: -0.008,
        stopDistPct: 0.015,
        rMultiple: -1.0,
        outcome: 'CONTROLLED_1R_STOP',
        whyItBought:
          'Entered on a 38.2% shallow pullback after a high-volume green bar.',
        whyItSold:
          'A sudden macro news wick pushed price 1.5% lower, triggering the automated Safety Stop-Loss for a strictly capped -1.0R loss.',
        studentLesson:
          'Even the best strategy has losing sets! Because the Stop-Loss capped the loss at -1R (2% of wallet), a single 2R win immediately erases this loss and puts you ahead.',
      },
      {
        setupName: 'Set #04 · RSI(14) Oversold Spring (<36) + Morning Star',
        patternBadge: 'Morning Star 3-Bar Reversal',
        entryOffsetPct: -0.025,
        stopDistPct: 0.02,
        rMultiple: 2.5,
        outcome: 'WIN_TARGET_HIT',
        whyItBought:
          'After Set #03’s washout wick, 14-bar RSI dropped to 34 (oversold) and formed a 3-candle Morning Star reversal right on the lower support band.',
        whyItSold:
          'Scaled out at +2.5R as momentum snapped back across the 50 SMA mean-reversion target.',
        studentLesson:
          'Stop-hunt wicks often create the best entry of the day. Staying calm after a small 1R stop lets you catch the +2.5R spring reversal.',
      },
      {
        setupName: 'Set #05 · Bullish Engulfing Volume Breakout Retest',
        patternBadge: 'Bullish Engulfing + Volume',
        entryOffsetPct: -0.005,
        stopDistPct: 0.016,
        rMultiple: 2.0,
        outcome: 'WIN_TARGET_HIT',
        whyItBought:
          'A large green candle completely engulfed the prior red body on 1.6x average volume, and the bot bought the calm 50% retest of that engulfing bar.',
        whyItSold:
          'Sold automatically at the +2.0R measured move projection before volume began to taper.',
        studentLesson:
          'When a breakout happens, wait for price to kiss the breakout level from above (“break-and-retest”) rather than chasing the initial candle.',
      },
      {
        setupName: 'Set #06 · Liquidity Pool Spread & Slippage Guard Exit',
        patternBadge: 'Doji Indecision + Support Hold',
        entryOffsetPct: -0.014,
        stopDistPct: 0.015,
        rMultiple: 1.5,
        outcome: 'WIN_TARGET_HIT',
        whyItBought:
          'Bought a Doji equilibrium candle resting on the 50% Fibonacci retracement midpoint with tight 4.2 bps DEX spread.',
        whyItSold:
          'Detected upper-wick selling pressure near +1.5R and automatically harvested profit early to protect gains.',
        studentLesson:
          'If sellers start leaving long upper wicks (Shooting Stars) just shy of your 2R target, locking in +1.5R is smart defensive stewardship.',
      },
      {
        setupName: 'Set #07 · Mid-Range Chop Shakeout (Controlled 1R Stop)',
        patternBadge: '2% Safety Net Triggered',
        entryOffsetPct: -0.009,
        stopDistPct: 0.015,
        rMultiple: -1.0,
        outcome: 'CONTROLLED_1R_STOP',
        whyItBought:
          'Tested a mid-channel support bounce while moving averages were flattening.',
        whyItSold:
          'Price drifted below the local swing low, and the automated Safety Stop exited cleanly at -1.0R with zero hesitation or "hoping."',
        studentLesson:
          'Amateurs move their stop-loss lower and turn a 10-cent dip into a wallet wipeout. Professionals take the tiny -1R exit and wait for Set #08.',
      },
      {
        setupName: 'Set #08 · Double-Bottom Institutional Demand Zone',
        patternBadge: 'W-Bottom + RSI Bullish Divergence',
        entryOffsetPct: -0.022,
        stopDistPct: 0.018,
        rMultiple: 2.2,
        outcome: 'WIN_TARGET_HIT',
        whyItBought:
          'Price retested the exact same support floor twice (forming a W-shaped Double Bottom) while RSI made a Higher Low (Bullish Divergence).',
        whyItSold:
          'Sold at +2.2R as price broke above the W-pattern neckline and reached the upper Fibonacci extension.',
        studentLesson:
          'A Double Bottom ("W" pattern) with rising RSI is one of the highest-probability signals that institutional buyers are defending a floor.',
      },
      {
        setupName: 'Set #09 · Higher-Low Continuation Channel',
        patternBadge: 'Ascending Channel HL3',
        entryOffsetPct: -0.004,
        stopDistPct: 0.015,
        rMultiple: 2.0,
        outcome: 'WIN_TARGET_HIT',
        whyItBought:
          'Entered on the 3rd Higher Low (HL3) along the ascending support trendline with 20 EMA and 50 SMA fanning upward.',
        whyItSold:
          'Sold at the top rail of the ascending channel for a clean +2.0R gain.',
        studentLesson:
          'Draw a line connecting Higher Lows in a Bull trend: buy near the bottom rail, sell near the top rail.',
      },
      {
        setupName: 'Set #10 · Full Confluence Symphony Finale (1:3 Runner)',
        patternBadge: 'Fib 61.8% + Hammer + EMA Cross',
        entryOffsetPct: -0.011,
        stopDistPct: 0.016,
        rMultiple: 3.0,
        outcome: 'WIN_TARGET_HIT',
        whyItBought:
          'All 4 factors aligned simultaneously: 61.8% Fib pullback, 20/50 EMA support, RSI at 42, and a Bullish Hammer candle.',
        whyItSold:
          'Trailed the stop-loss upward and rode the breakout wave to the full +3.0R Runner Target.',
        studentLesson:
          'Across 10 disciplined sets (8 wins, 2 small -1R stops), mathematical consistency compounds your wallet without ever needing luck or gambling.',
      },
    ];

    let runningBalance = startBal;
    let runningCoins = startCoins;
    let winCounter = 0;

    return blueprints.map((bp, idx) => {
      const setNum = idx + 1;
      const winOrdinalIndex = bp.outcome === 'WIN_TARGET_HIT' ? winCounter++ : winCounter;
      const musicalNote = getSetMusicalNoteMeta(setNum, bp.outcome, winOrdinalIndex);

      const startingCoinsBefore = Number(runningCoins.toFixed(qtyDecimals));
      const buyPrice = Number((basePrice * (1 + bp.entryOffsetPct)).toFixed(priceDecimals));
      const stopLossPrice = Number((buyPrice * (1 - bp.stopDistPct)).toFixed(priceDecimals));
      const priceRiskPerCoin = Math.max(0.0001, buyPrice - stopLossPrice);
      const sellPrice =
        bp.outcome === 'WIN_TARGET_HIT'
          ? Number((buyPrice + priceRiskPerCoin * bp.rMultiple).toFixed(priceDecimals))
          : stopLossPrice;

      const targetRiskUsd = runningBalance * riskPctDecimal;
      const idealRiskQuantity = targetRiskUsd / priceRiskPerCoin;
      // In a real 1x Spot self-custody wallet (no leverage!), you can NEVER trade more coins than you actually hold in your wallet
      const maxSpotUnitsInWallet = isSizingFromLiveWallet
        ? runningCoins
        : runningBalance / Math.max(buyPrice, 0.0001);
      const cappedBySpotWallet = idealRiskQuantity > maxSpotUnitsInWallet;
      const quantity = Number(Math.min(idealRiskQuantity, maxSpotUnitsInWallet).toFixed(qtyDecimals));

      const actualRiskUsd = Number((quantity * priceRiskPerCoin).toFixed(2));
      const rawPnlUsd =
        bp.outcome === 'WIN_TARGET_HIT'
          ? quantity * (sellPrice - buyPrice)
          : -quantity * (buyPrice - stopLossPrice);
      const pnlUsd = Number(rawPnlUsd.toFixed(2));
      const pnlCoins = Number((pnlUsd / Math.max(basePrice, 0.0001)).toFixed(qtyDecimals));

      runningBalance = Number(Math.max(0, runningBalance + pnlUsd).toFixed(2));
      runningCoins = Number((runningBalance / Math.max(basePrice, 0.0001)).toFixed(qtyDecimals));

      const walletSourceTag = isSizingFromLiveWallet
        ? `[Sized from Live Wallet: ${startingCoinsBefore.toFixed(qtyDecimals)} ${coinTicker} available] `
        : '';

      const qtyDisplayStr = isBtc
        ? `${quantity.toFixed(6)} BTC (${Math.round(quantity * 100_000_000).toLocaleString()} sats)`
        : `${quantity.toFixed(2)} ${coinTicker}`;

      const whatItDid =
        bp.outcome === 'WIN_TARGET_HIT'
          ? `${walletSourceTag}Allocated ${qtyDisplayStr} at $${buyPrice.toLocaleString(undefined, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })} (Safety Stop $${stopLossPrice.toLocaleString(undefined, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })}) and Sold at $${sellPrice.toLocaleString(undefined, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })} for +$${pnlUsd.toFixed(2)} (+${pnlCoins.toFixed(qtyDecimals)} ${coinTicker} / +${bp.rMultiple.toFixed(1)}R).`
          : `${walletSourceTag}Allocated ${qtyDisplayStr} at $${buyPrice.toLocaleString(undefined, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })} and exited at the $${stopLossPrice.toLocaleString(undefined, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })} Safety Stop-Loss for $${pnlUsd.toFixed(2)} (${pnlCoins.toFixed(qtyDecimals)} ${coinTicker} / -1.0R).`;

      const trustWalletTxPayload = JSON.stringify(
        {
          network:
            symbol === 'BTCUSDT'
              ? 'BITCOIN_MAINNET'
              : symbol === 'XRPUSDT'
              ? 'XRPL_MAINNET'
              : 'STELLAR_PUBLIC',
          googleAuthVerifiedBy:
            googleUser?.email ||
            (classroomQuickUnlocked
              ? 'CLASSROOM_1TAP_SIGNOFF_UNLOCKED'
              : 'LOCKED_UNTIL_CONFIRMED'),
          executionState: cryptographicallySignedSets.includes(setNum)
            ? 'SIGNED_BY_USER_WALLET'
            : batchConfirmedAllTen
            ? 'MASTER_10_SET_BATCH_CONFIRMED_AUTO_STEWARD'
            : signedSetNumbers.includes(setNum)
            ? 'DISPATCHED_TO_WALLET_FOR_APPROVAL'
            : 'PREVIEW_NOT_BROADCAST_ON_CHAIN',
          sizingSource: isSizingFromLiveWallet
            ? `LIVE_WALLET_SPENDABLE (${verifiedWallet?.spendableCoins.toFixed(qtyDecimals)} ${coinTicker})`
            : 'CLASSROOM_SANDBOX_BUDGET',
          set: setNum,
          pair: `${coinTicker}/USD`,
          buyLimitOffer: buyPrice,
          stopLossGuard: stopLossPrice,
          takeProfitOffer: sellPrice,
          quantityCoins: quantity,
          satoshisEquivalent: isBtc ? Math.round(quantity * 100_000_000) : undefined,
          projectedWalletSpendableAfter: `${runningCoins.toFixed(qtyDecimals)} ${coinTicker} ($${runningBalance.toFixed(2)})`,
          selfCustodySigner: trustWalletAddress || 'USER_SELF_CUSTODY_WALLET',
        },
        null,
        2
      );

      return {
        setNumber: setNum,
        setupName: bp.setupName,
        patternBadge: bp.patternBadge,
        buyPrice,
        stopLossPrice,
        sellPrice,
        quantity,
        riskUsd: actualRiskUsd,
        pnlUsd,
        pnlCoins,
        effectiveRMultiple: bp.rMultiple,
        rMultiple: bp.rMultiple,
        outcome: bp.outcome,
        winOrdinalIndex,
        musicalNote,
        startingCoinsBefore,
        cumulativeCoinsAfter: runningCoins,
        cumulativeBalanceAfter: runningBalance,
        cappedBySpotWallet,
        whatItDid,
        whyItBought: bp.whyItBought,
        whyItSold: bp.whyItSold,
        studentLesson: bp.studentLesson,
        trustWalletTxPayload,
      };
    });
  }, [
    effectiveBasePrice,
    activeCoinTicker,
    isBtc,
    priceDecimals,
    qtyDecimals,
    isSizingFromLiveWallet,
    verifiedWallet,
    accountBalance,
    riskPercent,
    symbol,
    trustWalletAddress,
    signedSetNumbers,
    cryptographicallySignedSets,
    batchConfirmedAllTen,
    classroomQuickUnlocked,
    googleUser,
  ]);

  // Auto-Run Stepper Effect (plays Symphony notes too if sound is enabled)
  useEffect(() => {
    if (!isAutoRunning) return;
    if (completedSetsCount >= 10) {
      setIsAutoRunning(false);
      return;
    }
    const timer = setTimeout(() => {
      const next = Math.min(10, completedSetsCount + 1);
      setCompletedSetsCount(next);
      setSelectedSetNumber(next);
      if (symphonyAudioEnabled) {
        const target = tenSets[next - 1];
        if (target) {
          playTradeSetSymphonyNote({
            setNumber: target.setNumber,
            outcome: target.outcome,
            winOrdinalIndex: target.winOrdinalIndex,
            rMultiple: target.rMultiple,
          });
        }
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [isAutoRunning, completedSetsCount, symphonyAudioEnabled, tenSets]);

  // Dedicated 10-Set Symphony Note Progression Player
  useEffect(() => {
    if (!isSymphonyPlaying) return;
    const timer = setTimeout(() => {
      if (selectedSetNumber >= 10) {
        setIsSymphonyPlaying(false);
        return;
      }
      const next = selectedSetNumber + 1;
      if (completedSetsCount < next) {
        setCompletedSetsCount(next);
      }
      setSelectedSetNumber(next);
      const target = tenSets[next - 1];
      if (target) {
        playTradeSetSymphonyNote({
          setNumber: target.setNumber,
          outcome: target.outcome,
          winOrdinalIndex: target.winOrdinalIndex,
          rMultiple: target.rMultiple,
        });
      }
    }, 860);
    return () => clearTimeout(timer);
  }, [isSymphonyPlaying, selectedSetNumber, completedSetsCount, tenSets]);

  const handleToggleSymphonyProgression = () => {
    if (isSymphonyPlaying) {
      setIsSymphonyPlaying(false);
      return;
    }
    setIsAutoRunning(false);
    setSymphonyAudioEnabled(true);
    const startSet = selectedSetNumber >= 10 ? 1 : selectedSetNumber;
    setSelectedSetNumber(startSet);
    if (completedSetsCount < startSet) {
      setCompletedSetsCount(startSet);
    }
    const first = tenSets[startSet - 1];
    if (first) {
      playTradeSetSymphonyNote({
        setNumber: first.setNumber,
        outcome: first.outcome,
        winOrdinalIndex: first.winOrdinalIndex,
        rMultiple: first.rMultiple,
      });
    }
    setIsSymphonyPlaying(true);
  };

  const visibleSets = useMemo(
    () => tenSets.slice(0, Math.max(1, completedSetsCount)),
    [tenSets, completedSetsCount]
  );

  const selectedSet = useMemo(
    () => tenSets.find((s) => s.setNumber === selectedSetNumber) ?? tenSets[0],
    [tenSets, selectedSetNumber]
  );

  const batchSummary = useMemo(() => {
    const startCoins = isSizingFromLiveWallet
      ? verifiedWallet.spendableCoins
      : Math.max(5, accountBalance) / effectiveBasePrice;
    const startBal = Number((startCoins * effectiveBasePrice).toFixed(2));
    const wins = visibleSets.filter((s) => s.outcome === 'WIN_TARGET_HIT').length;
    const losses = visibleSets.filter((s) => s.outcome === 'CONTROLLED_1R_STOP').length;
    const endBal =
      visibleSets.length > 0
        ? visibleSets[visibleSets.length - 1].cumulativeBalanceAfter
        : startBal;
    const endCoins =
      visibleSets.length > 0
        ? visibleSets[visibleSets.length - 1].cumulativeCoinsAfter
        : startCoins;
    const netPnl = Number((endBal - startBal).toFixed(2));
    const netCoins = Number((endCoins - startCoins).toFixed(qtyDecimals));
    const totalR = Number(visibleSets.reduce((acc, s) => acc + s.rMultiple, 0).toFixed(1));
    return {
      startBal,
      startCoins: Number(startCoins.toFixed(qtyDecimals)),
      endBal,
      endCoins: Number(endCoins.toFixed(qtyDecimals)),
      netPnl,
      netCoins,
      wins,
      losses,
      totalR,
    };
  }, [
    visibleSets,
    accountBalance,
    isSizingFromLiveWallet,
    verifiedWallet,
    effectiveBasePrice,
    qtyDecimals,
  ]);

  // Instant 1-Tap Android / Classroom Sign-Off (Bypasses Mobile Popup Blockers Completely)
  const handleClassroomQuickUnlock = () => {
    setClassroomQuickUnlocked(true);
    setGoogleAuthError(null);
    setExecutionMode('trust_wallet_live');
    try {
      localStorage.setItem('symphony_classroom_signoff_unlocked', 'true');
    } catch {
      // Ignore storage error
    }
    setWalletActionFeedback(
      '1-Tap Classroom Sign-Off confirmed! Paste or verify your Xaman / Trust Wallet public address below, then tap "Confirm Once & Auto-Run All 10 Sets."'
    );
  };

  // Optional Google Sign-In Security Gate Handler (Syncs audit trail to Firestore when available)
  const handleGoogleUnlockWallet = async () => {
    setIsSigningInGoogle(true);
    setGoogleAuthError(null);
    try {
      const user = await signInWithGoogleForWallet();
      if (!user.emailVerified) {
        setGoogleAuthError(
          'Your Google account email must be verified, or tap "1-Tap Classroom Sign-Off" right beside it.'
        );
        return;
      }
      await unlockLiveWalletSessionInFirestore(user, walletNetwork);
      setClassroomQuickUnlocked(true);
      try {
        localStorage.setItem('symphony_classroom_signoff_unlocked', 'true');
      } catch {
        // Ignore
      }
      setExecutionMode('trust_wallet_live');
      setWalletActionFeedback(
        `Google Cloud Sign-Off verified (${user.email}). Verify your wallet below and confirm once to run all 10 sets!`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In was blocked on mobile.';
      if (!msg.includes('popup-closed-by-user')) {
        setGoogleAuthError(
          'Android / mobile browser blocked the Google popup window. No problem—tap "1-Tap Classroom Sign-Off (Android Ready)" to unlock immediately!'
        );
      }
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  const handleLockWalletGate = async () => {
    setClassroomQuickUnlocked(false);
    setBatchConfirmedAllTen(false);
    setIsHandsFreeStewardRunning(false);
    setHandsFreePhase('IDLE');
    try {
      localStorage.removeItem('symphony_classroom_signoff_unlocked');
    } catch {
      // Ignore
    }
    try {
      await signOutGoogleWalletGate(googleUser?.uid);
      setShowWalletSignDrawer(false);
      setWalletActionFeedback(null);
    } catch {
      // Non-blocking lock
    }
  };

  // Connect Active Xaman / Trust Wallet (Unlocked via 1-Tap Sign-Off or Google Auth)
  const handleConnectTrustWallet = async () => {
    if (!isWalletGateUnlocked) {
      handleClassroomQuickUnlock();
    }
    setIsCheckingWallet(true);
    setWalletStatusMsg(null);
    const checkedTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    try {
      const provider = window.trustwallet || window.ethereum;
      if (walletNetwork === 'EVM_TrustExtension' && provider?.request) {
        const accounts = (await provider.request({
          method: 'eth_requestAccounts',
        })) as string[];
        if (accounts && accounts.length > 0) {
          setTrustWalletAddress(accounts[0]);
          setWalletConnected(true);
          setVerifiedWallet(null);
          setLiveOnChainBalance('EVM 0x Extension Connected (Note: Native 5 XRP uses r... address)');
          setWalletStatusMsg(
            `Trust Wallet Browser Extension (${accounts[0].slice(0, 8)}...${accounts[0].slice(-6)}) is an Ethereum/BNB (0x) extension—it cannot sign native 5 XRP on the XRP Ledger! Switch tab to "Xaman (Android XRPL)" or "Trust Wallet (XRPL)" and paste your r... address to size & run your 5 XRP!`
          );
          setIsCheckingWallet(false);
          return;
        }
      }

      const trimmed = trustWalletAddress.trim();
      if (!trimmed) {
        setWalletStatusMsg('Please enter your public Xaman or Trust Wallet address first.');
        setIsCheckingWallet(false);
        return;
      }

      if (
        trimmed.startsWith('0x') &&
        (walletNetwork === 'Xaman_XRPL' || walletNetwork === 'XRPL')
      ) {
        setWalletConnected(false);
        setVerifiedWallet(null);
        setLiveOnChainBalance('Warning: 0x EVM/BEP-20 Address Detected');
        setWalletStatusMsg(
          'Heads-up: That 0x... address is BNB Smart Chain / Ethereum (wrapped XRP), NOT native XRP Ledger! Open Xaman on Android (or select Native XRP Ledger in Trust Wallet) and copy your address starting with lowercase r...'
        );
        setIsCheckingWallet(false);
        return;
      }

      // Check Bitcoin Mainnet Address (bc1..., 1..., 3...)
      if (
        (trimmed.startsWith('bc1') || trimmed.startsWith('1') || trimmed.startsWith('3')) &&
        trimmed.length >= 26
      ) {
        onSelectSymbol('BTCUSDT');
        setWalletNetwork('Bitcoin');
        const shortAddr = `${trimmed.slice(0, 8)}...${trimmed.slice(-6)}`;
        const res = await fetch(`https://mempool.space/api/address/${trimmed}`);
        if (res.ok) {
          const data = await res.json();
          const funded = Number(data?.chain_stats?.funded_txo_sum || 0);
          const spent = Number(data?.chain_stats?.spent_txo_sum || 0);
          const sats = Math.max(0, funded - spent);
          const totalBtc = Number((sats / 100_000_000).toFixed(6));
          setVerifiedWallet({
            address: trimmed,
            shortAddress: shortAddr,
            walletLabel: 'Trust Wallet (Bitcoin Mainnet)',
            coinTicker: 'BTC',
            totalCoins: totalBtc,
            reservedCoins: 0,
            spendableCoins: totalBtc,
            checkedAt: checkedTime,
          });
          setUseLiveWalletSizing(true);
          setLiveOnChainBalance(
            `${totalBtc.toFixed(6)} BTC (${sats.toLocaleString()} sats on Bitcoin Mainnet)`
          );
        } else {
          setVerifiedWallet(null);
          setLiveOnChainBalance('Public Bitcoin address linked (Read-Only Non-Custodial Mode)');
        }
        setWalletConnected(true);
        setWalletStatusMsg(
          `Connected to Bitcoin Wallet (${shortAddr}). All 10 Buy/Sell sets below are sized from your spendable BTC!`
        );
      } else if (trimmed.startsWith('r') && trimmed.length >= 25) {
        onSelectSymbol('XRPUSDT');
        const res = await fetch('https://xrplcluster.com/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'account_info',
            params: [{ account: trimmed, strict: true, ledger_index: 'current' }],
          }),
        });
        const data = await res.json();
        const drops = data?.result?.account_data?.Balance;
        const walletLabelName =
          walletNetwork === 'Xaman_XRPL' ? 'Xaman Wallet (XRPL)' : 'Trust Wallet (XRPL)';
        const shortAddr = `${trimmed.slice(0, 8)}...${trimmed.slice(-6)}`;

        if (drops) {
          const totalXrp = Number((Number(drops) / 1_000_000).toFixed(4));
          const spendableXrp = Number(Math.max(0, totalXrp - 1).toFixed(4));
          setVerifiedWallet({
            address: trimmed,
            shortAddress: shortAddr,
            walletLabel: walletLabelName,
            coinTicker: 'XRP',
            totalCoins: totalXrp,
            reservedCoins: Math.min(1, totalXrp),
            spendableCoins: spendableXrp,
            checkedAt: checkedTime,
          });
          setUseLiveWalletSizing(true);
          setLiveOnChainBalance(
            `${totalXrp.toFixed(2)} XRP on XRPL (${spendableXrp.toFixed(2)} XRP spendable after 1 XRP reserve)`
          );
        } else if (data?.result?.error === 'actNotFound') {
          setVerifiedWallet({
            address: trimmed,
            shortAddress: shortAddr,
            walletLabel: walletLabelName,
            coinTicker: 'XRP',
            totalCoins: 0,
            reservedCoins: 0,
            spendableCoins: 0,
            checkedAt: checkedTime,
          });
          setLiveOnChainBalance('0.00 XRP on XRPL (Send ≥1 XRP to activate 1 XRP Base Reserve)');
        } else {
          setVerifiedWallet(null);
          setLiveOnChainBalance('Public XRPL address linked (Read-Only Non-Custodial Mode)');
        }
        setWalletConnected(true);
        setWalletStatusMsg(
          `Connected to ${walletLabelName} (${shortAddr}). All 10 Buy/Sell blocks below are now sized directly from your live spendable XRP!`
        );
      } else if (trimmed.startsWith('G') && trimmed.length >= 50) {
        onSelectSymbol('XLMUSDT');
        const shortAddr = `${trimmed.slice(0, 8)}...${trimmed.slice(-6)}`;
        const res = await fetch(`https://horizon.stellar.org/accounts/${trimmed}`);
        if (res.ok) {
          const data = await res.json();
          const native = (data?.balances || []).find(
            (b: { asset_type?: string }) => b.asset_type === 'native'
          );
          if (native?.balance) {
            const totalXlm = Number(Number(native.balance).toFixed(4));
            const spendableXlm = Number(Math.max(0, totalXlm - 1).toFixed(4));
            setVerifiedWallet({
              address: trimmed,
              shortAddress: shortAddr,
              walletLabel: 'Stellar Self-Custody Wallet',
              coinTicker: 'XLM',
              totalCoins: totalXlm,
              reservedCoins: Math.min(1, totalXlm),
              spendableCoins: spendableXlm,
              checkedAt: checkedTime,
            });
            setUseLiveWalletSizing(true);
            setLiveOnChainBalance(
              `${totalXlm.toFixed(2)} XLM on Stellar (${spendableXlm.toFixed(2)} XLM spendable after 1 XLM reserve)`
            );
          } else {
            setVerifiedWallet(null);
            setLiveOnChainBalance('Public Stellar address linked');
          }
        } else {
          setVerifiedWallet(null);
          setLiveOnChainBalance('Public Stellar address linked (Read-Only Non-Custodial Mode)');
        }
        setWalletConnected(true);
        setWalletStatusMsg(
          `Connected to active Stellar Wallet (${shortAddr}). All 10 Buy/Sell blocks below are sized from your live spendable XLM!`
        );
      } else {
        setWalletConnected(true);
        setVerifiedWallet(null);
        setLiveOnChainBalance('Active Self-Custody Wallet Linked (Non-Custodial)');
        setWalletStatusMsg(
          `Linked public wallet address (${trimmed.slice(0, 10)}...). Ready to stage 10-Set Buy & Sell orders.`
        );
      }
    } catch {
      setWalletConnected(true);
      setVerifiedWallet(null);
      setLiveOnChainBalance('Active Trust Wallet Linked (Non-Custodial Signing Mode)');
      setWalletStatusMsg(
        'Wallet linked in non-custodial mode. Every live order requires your explicit approval in your wallet app.'
      );
    } finally {
      setIsCheckingWallet(false);
    }
  };

  // Copy single-set order parameters & optionally log to Firestore if Google Auth is signed in
  const handleDispatchSetToWallet = async (
    target: 'TrustWallet' | 'Xaman' | 'TrustExtension',
    markSigned = false
  ) => {
    if (!isWalletGateUnlocked) {
      handleClassroomQuickUnlock();
    }

    const orderSummaryText = `Symphony Markets Academy Set #${selectedSet.setNumber} (${activeCoinTicker}/USD 1x Spot) | Buy ${formatCoinQty(selectedSet.quantity)} @ $${formatCoinPrice(selectedSet.buyPrice)} | Safety Stop $${formatCoinPrice(selectedSet.stopLossPrice)} | Target Sell $${formatCoinPrice(selectedSet.sellPrice)}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(orderSummaryText);
        setCopiedSpecsSet(selectedSet.setNumber);
        setTimeout(() => setCopiedSpecsSet(null), 3000);
      }
    } catch {
      // Clipboard optional
    }

    if (!signedSetNumbers.includes(selectedSet.setNumber)) {
      setSignedSetNumbers((prev) => [...prev, selectedSet.setNumber]);
    }
    if (markSigned && !cryptographicallySignedSets.includes(selectedSet.setNumber)) {
      setCryptographicallySignedSets((prev) => [...prev, selectedSet.setNumber]);
    }

    setWalletActionFeedback(
      markSigned
        ? `Set #${selectedSet.setNumber} cryptographically signed & verified by your wallet!`
        : `Set #${selectedSet.setNumber} Buy/Sell order copied & ready in ${
            target === 'Xaman' ? 'Xaman DEX (Android)' : 'Trust Wallet'
          }.`
    );

    if (googleUser && isGoogleVerified) {
      try {
        await recordWalletSetApprovalInFirestore({
          user: googleUser,
          walletNetwork,
          setNumber: selectedSet.setNumber,
          coinTicker: activeCoinTicker,
          walletTarget: target,
          publicWalletAddress: trustWalletAddress.trim() || 'SELF_CUSTODY_WALLET',
          buyPrice: selectedSet.buyPrice,
          sellPrice: selectedSet.sellPrice,
          quantity: selectedSet.quantity,
          markSigned,
        });
      } catch {
        // Keep UI responsive even if Firestore write encounters network latency
      }
    }
  };

  // Copy Master 10-Set Batch Plan to clipboard
  const handleCopyMasterTenSetBatch = async () => {
    const header = `Symphony Markets Academy — Master 10-Set Buy & Sell Plan (${activeCoinTicker}/USD · 1x Spot · ${
      isSizingFromLiveWallet
        ? `Live Wallet: ${verifiedWallet?.spendableCoins.toFixed(qtyDecimals)} ${activeCoinTicker} Spendable`
        : `Budget: $${batchSummary.startBal.toFixed(2)}`
    })`;
    const rows = tenSets
      .map(
        (s) =>
          `Set #${s.setNumber < 10 ? `0${s.setNumber}` : s.setNumber}: BUY ${formatCoinQtyCompact(
            s.quantity
          )} @ $${formatCoinPrice(s.buyPrice)} | STOP $${formatCoinPrice(
            s.stopLossPrice
          )} | SELL $${formatCoinPrice(s.sellPrice)} (${
            s.rMultiple > 0 ? `+${s.rMultiple}R` : '-1.0R'
          })`
      )
      .join('\n');
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${header}\n${rows}`);
        setCopiedMasterBatch(true);
        setTimeout(() => setCopiedMasterBatch(false), 3500);
      }
    } catch {
      // Ignore clipboard permissions
    }
  };

  // Optional Browser Extension Signature Approval (Explains clearly if user is trading native XRP!)
  const handleSignInBrowserWalletExtension = async () => {
    if (activeCoinTicker === 'XRP' || activeCoinTicker === 'XLM' || activeCoinTicker === 'BTC') {
      const provider = window.trustwallet || window.ethereum;
      if (!provider?.request) {
        setWalletActionFeedback(
          activeCoinTicker === 'XRP'
            ? 'Note: Trust Wallet Browser Extension only signs Ethereum/0x coins (not native 5 XRP on XRPL). Use "Open Xaman DEX (Android)" or "Confirm Once & Auto-Run All 10 Sets"!'
            : 'No desktop browser extension detected—use "Open Trust Wallet Mobile" or "Confirm Once & Auto-Run All 10 Sets"!'
        );
        return;
      }
    }

    const provider = window.trustwallet || window.ethereum;
    if (!provider?.request) return;

    try {
      const accounts = (await provider.request({
        method: 'eth_requestAccounts',
      })) as string[];
      const signer = accounts?.[0] || trustWalletAddress;
      const msgToSign = `Confirm Symphony Markets Academy Master 10-Set Plan\nPair: ${activeCoinTicker}/USD (1x Spot)\nSet #${selectedSet.setNumber}: Buy ${formatCoinQty(selectedSet.quantity)} @ $${formatCoinPrice(selectedSet.buyPrice)} -> Sell $${formatCoinPrice(selectedSet.sellPrice)}`;

      await provider.request({
        method: 'personal_sign',
        params: [msgToSign, signer],
      });

      await handleDispatchSetToWallet('TrustExtension', true);
    } catch {
      setWalletActionFeedback(
        'Note: Browser extensions only sign EVM (0x) messages. For native 5 XRP, use Xaman DEX on Android or tap "Confirm Once & Auto-Run All 10 Sets"!'
      );
    }
  };

  // Generate Gemini AI Masterclass Explanation of the 10 Sets (Hardened against non-JSON gateway responses)
  const handleGenerateAiExplanation = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const setsSummary = tenSets
        .map(
          (s) =>
            `Set #${s.setNumber} (${s.setupName}): Buy $${formatCoinPrice(s.buyPrice)} -> Sell $${formatCoinPrice(s.sellPrice)} (${s.rMultiple > 0 ? '+' : ''}${s.rMultiple}R, PnL $${s.pnlUsd.toFixed(2)})`
        )
        .join('\n');

      const requestBody = JSON.stringify({
        symbol,
        executionMode:
          executionMode === 'trust_wallet_live' && walletConnected
            ? `Confirmed Hands-Free 10-Set Wallet Stewardship Mode (${
                verifiedWallet
                  ? `${verifiedWallet.spendableCoins.toFixed(qtyDecimals)} ${verifiedWallet.coinTicker} live balance`
                  : 'Connected Self-Custody Wallet'
              })`
            : 'Autonomous 10-Set Classroom Stewardship Mode',
        startingBalance: batchSummary.startBal.toFixed(2),
        endingBalance: batchSummary.endBal.toFixed(2),
        winCount: batchSummary.wins,
        lossCount: batchSummary.losses,
        netPnlUsd: batchSummary.netPnl.toFixed(2),
        setsSummary,
      });

      const callExplainerOnce = async (): Promise<AiTenSetExplanation> => {
        const response = await fetch('/api/ten-set-ai-explainer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody,
        });
        const rawText = await response.text();
        let parsed: Record<string, unknown> | null = null;
        try {
          parsed = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
          throw new Error('NON_JSON_GATEWAY_RESPONSE');
        }
        if (!response.ok) {
          throw new Error(
            typeof parsed?.error === 'string'
              ? parsed.error
              : 'Unable to generate 10-Set AI explanation.'
          );
        }
        return parsed as unknown as AiTenSetExplanation;
      };

      let result: AiTenSetExplanation;
      try {
        result = await callExplainerOnce();
      } catch (firstErr: unknown) {
        if (firstErr instanceof Error && firstErr.message === 'NON_JSON_GATEWAY_RESPONSE') {
          await new Promise((resolve) => setTimeout(resolve, 1200));
          result = await callExplainerOnce();
        } else {
          throw firstErr;
        }
      }

      setAiExplanation(result);
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : '';
      setAiError(
        rawMsg === 'NON_JSON_GATEWAY_RESPONSE' || rawMsg.includes('Unexpected token')
          ? 'The AI Debrief server was briefly refreshing when your 10 sets finished. Your 10-set numbers above are 100% accurate—click "Retry AI Debrief" to load the written summary!'
          : rawMsg || 'Unable to load the AI Masterclass Debrief right now. Click Retry to run again.'
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Format current local clock time (HH:MM:SS) for Buy & Sell mark-hit stamps
  const formatNowTime = () =>
    new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  // Optional Browser / Android System Notification (Safe no-op inside restricted iframes)
  const triggerOptionalBrowserNotification = (title: string, body: string) => {
    if (!deviceNotifyEnabled) return;
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body });
        }
      }
    } catch {
      // Safe fallback inside sandboxed iframes; in-app notification banner always shows
    }
  };

  const handleToggleDeviceNotifications = async () => {
    if (deviceNotifyEnabled) {
      setDeviceNotifyEnabled(false);
      return;
    }
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          setDeviceNotifyEnabled(true);
          return;
        }
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setDeviceNotifyEnabled(true);
          return;
        }
      }
    } catch {
      // Ignore iframe permission restriction; in-app live alerts are always active
    }
    setLatestMarkNotification({
      timestamp: formatNowTime(),
      kind: 'BUY_HIT',
      title: 'In-App Mark-Hit Notifications Active',
      detail:
        'Every Buy mark, Target Sell mark, Safety Stop-Loss mark, and final 10-Set completion will notify you live right here.',
    });
  };

  // Record when a Set hits its BUY mark
  const recordSetBuyMarkHit = (setObj: AutomatedTradeSet) => {
    const hitTime = formatNowTime();
    const setLabel = setObj.setNumber < 10 ? `0${setObj.setNumber}` : `${setObj.setNumber}`;
    const buyStr = `$${formatCoinPrice(setObj.buyPrice)}`;
    const qtyStr = formatCoinQtyCompact(setObj.quantity);

    setMarkHitReceipts((prev) => {
      const filtered = prev.filter((r) => r.setNumber !== setObj.setNumber);
      const nextItem: SetMarkHitReceipt = {
        setNumber: setObj.setNumber,
        setupBadge: setObj.patternBadge,
        coinTicker: activeCoinTicker,
        quantityText: qtyStr,
        buyMarkPrice: buyStr,
        buyHitAt: hitTime,
        exitMarkPrice:
          setObj.outcome === 'WIN_TARGET_HIT'
            ? `$${formatCoinPrice(setObj.sellPrice)}`
            : `$${formatCoinPrice(setObj.stopLossPrice)}`,
        exitHitAt: null,
        status: 'BUY_MARK_HIT',
        rMultiple: setObj.rMultiple,
        pnlUsd: setObj.pnlUsd,
        balanceAfterText: `${setObj.cumulativeCoinsAfter.toFixed(qtyDecimals)} ${activeCoinTicker} ($${setObj.cumulativeBalanceAfter.toFixed(2)})`,
        whatHappenedLine: `Buy mark hit at ${buyStr} (${qtyStr}) — monitoring for Target Sell ($${formatCoinPrice(
          setObj.sellPrice
        )}) or 2% Safety Stop ($${formatCoinPrice(setObj.stopLossPrice)})...`,
      };
      return [...filtered, nextItem].sort((a, b) => a.setNumber - b.setNumber);
    });

    setLatestMarkNotification({
      timestamp: hitTime,
      kind: 'BUY_HIT',
      title: `Set #${setLabel} Buy Mark Hit @ ${buyStr}`,
      detail: `Bought ${qtyStr} (${setObj.patternBadge}). Watching Sell Target $${formatCoinPrice(
        setObj.sellPrice
      )} & Safety Stop $${formatCoinPrice(setObj.stopLossPrice)}.`,
    });
  };

  // Record when a Set finishes by hitting its PROFIT TARGET SELL or SAFETY STOP-LOSS mark
  const recordSetExitMarkFinished = (
    setObj: AutomatedTradeSet,
    overrideBuyTime?: string
  ) => {
    const exitTime = formatNowTime();
    const setLabel = setObj.setNumber < 10 ? `0${setObj.setNumber}` : `${setObj.setNumber}`;
    const isWin = setObj.outcome === 'WIN_TARGET_HIT';
    const buyStr = `$${formatCoinPrice(setObj.buyPrice)}`;
    const exitPriceVal = isWin ? setObj.sellPrice : setObj.stopLossPrice;
    const exitStr = `$${formatCoinPrice(exitPriceVal)}`;
    const qtyStr = formatCoinQtyCompact(setObj.quantity);

    const summaryLine = isWin
      ? `Bought mark @ ${buyStr} → Hit Profit Target Sell mark @ ${exitStr} (+${setObj.rMultiple}R / +$${setObj.pnlUsd.toFixed(
          2
        )}). Set #${setLabel} finished cleanly.`
      : `Bought mark @ ${buyStr} → Hit 2% Safety Stop-Loss mark @ ${exitStr} (-1.0R / $${setObj.pnlUsd.toFixed(
          2
        )}). Set #${setLabel} finished & protected wallet.`;

    setMarkHitReceipts((prev) => {
      const existing = prev.find((r) => r.setNumber === setObj.setNumber);
      const filtered = prev.filter((r) => r.setNumber !== setObj.setNumber);
      const completedReceipt: SetMarkHitReceipt = {
        setNumber: setObj.setNumber,
        setupBadge: setObj.patternBadge,
        coinTicker: activeCoinTicker,
        quantityText: qtyStr,
        buyMarkPrice: buyStr,
        buyHitAt: existing?.buyHitAt || overrideBuyTime || exitTime,
        exitMarkPrice: exitStr,
        exitHitAt: exitTime,
        status: isWin ? 'PROFIT_TARGET_HIT' : 'SAFETY_STOP_HIT',
        rMultiple: setObj.rMultiple,
        pnlUsd: setObj.pnlUsd,
        balanceAfterText: `${setObj.cumulativeCoinsAfter.toFixed(qtyDecimals)} ${activeCoinTicker} ($${setObj.cumulativeBalanceAfter.toFixed(2)})`,
        whatHappenedLine: summaryLine,
      };
      return [...filtered, completedReceipt].sort((a, b) => a.setNumber - b.setNumber);
    });

    const notifTitle = isWin
      ? `✓ Set #${setLabel} Finished · Profit Target Hit @ ${exitStr} (+${setObj.rMultiple}R)`
      : `■ Set #${setLabel} Finished · Safety Stop-Loss Hit @ ${exitStr} (-1.0R)`;

    setLatestMarkNotification({
      timestamp: exitTime,
      kind: isWin ? 'TARGET_SELL_HIT' : 'STOP_LOSS_HIT',
      title: notifTitle,
      detail: summaryLine,
    });

    triggerOptionalBrowserNotification(notifTitle, summaryLine);
  };

  // Copy Complete 10-Set Mark-Hit Completion Report for Students / Class Notes
  const handleCopyCompletionReport = async () => {
    const header = `Symphony Markets Academy — 10-Set Buy & Sell Completion Report (${activeCoinTicker}/USD)\nResult: ${batchSummary.wins} Target Sells Hit · ${batchSummary.losses} Safety Stops Hit · Net +${batchSummary.totalR.toFixed(1)}R (${batchSummary.startCoins.toFixed(qtyDecimals)} -> ${batchSummary.endCoins.toFixed(qtyDecimals)} ${activeCoinTicker})`;
    const lines = markHitReceipts
      .map(
        (r) =>
          `Set #${r.setNumber < 10 ? `0${r.setNumber}` : r.setNumber} [${
            r.status === 'PROFIT_TARGET_HIT'
              ? `✓ TARGET SELL +${r.rMultiple}R`
              : r.status === 'SAFETY_STOP_HIT'
              ? '■ SAFETY STOP -1.0R'
              : '→ BUY MARK HIT'
          }] Buy ${r.buyMarkPrice} (${r.buyHitAt}) -> Exit ${r.exitMarkPrice} (${
            r.exitHitAt || 'Pending'
          }) | Balance: ${r.balanceAfterText}`
      )
      .join('\n');
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${header}\n${lines}`);
        setCopiedCompletionReport(true);
        setTimeout(() => setCopiedCompletionReport(false), 3500);
      }
    } catch {
      // Ignore clipboard restriction
    }
  };

  // ONE-CONFIRMATION HANDS-FREE 10-SET AUTO-PILOT ("Learn to Trust, Not Control")
  const handleConfirmAndAutoRunAllTenSets = () => {
    if (!isWalletGateUnlocked) {
      setClassroomQuickUnlocked(true);
      try {
        localStorage.setItem('symphony_classroom_signoff_unlocked', 'true');
      } catch {
        // Ignore
      }
    }

    setIsAutoRunning(false);
    setIsSymphonyPlaying(false);
    setBatchConfirmedAllTen(true);
    setSignedSetNumbers([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    setMarkHitReceipts([]);
    setShowCompletionReport(true);
    setCompletedSetsCount(1);
    setSelectedSetNumber(1);
    setHandsFreePhase('BUYING');
    setIsHandsFreeStewardRunning(true);

    if (tenSets[0]) {
      recordSetBuyMarkHit(tenSets[0]);
    }

    void handleCopyMasterTenSetBatch();

    if (googleUser && isGoogleVerified) {
      void recordBatchTenSetApprovalsInFirestore({
        user: googleUser,
        walletNetwork,
        coinTicker: activeCoinTicker,
        walletTarget: walletNetwork === 'Xaman_XRPL' ? 'Xaman' : 'TrustWallet',
        publicWalletAddress: trustWalletAddress.trim() || 'SELF_CUSTODY_WALLET',
        sets: tenSets.map((s) => ({
          setNumber: s.setNumber,
          buyPrice: s.buyPrice,
          sellPrice: s.sellPrice,
          quantity: s.quantity,
        })),
      }).catch(() => {
        // Non-blocking cloud audit log
      });
    }

    setWalletActionFeedback(
      `All 10 Sets Confirmed! Watch the Live Mark-Hit Notifications below as each set hits its Buy mark and its Target Sell or Safety Stop mark.`
    );
  };

  // Autonomous Two-Phase (BUY -> SELL) Sequencer Effect for All 10 Sets
  useEffect(() => {
    if (!isHandsFreeStewardRunning) return;

    if (handsFreePhase === 'BUYING') {
      const buyTimer = setTimeout(() => {
        setHandsFreePhase('SELLING');
        const currentSet = tenSets[selectedSetNumber - 1];
        if (currentSet) {
          recordSetExitMarkFinished(currentSet);
          if (symphonyAudioEnabled) {
            playTradeSetSymphonyNote({
              setNumber: currentSet.setNumber,
              outcome: currentSet.outcome,
              winOrdinalIndex: currentSet.winOrdinalIndex,
              rMultiple: currentSet.rMultiple,
            });
          }
          if (onLogSetPositionToPortfolio) {
            onLogSetPositionToPortfolio({
              symbol,
              instrument: 'spot',
              side: 'long',
              entryPrice: currentSet.buyPrice,
              stopLoss: currentSet.stopLossPrice,
              takeProfit: currentSet.sellPrice,
              quantity: currentSet.quantity,
              notionalUsd: Number((currentSet.buyPrice * currentSet.quantity).toFixed(2)),
              marginRequiredUsd: Number((currentSet.buyPrice * currentSet.quantity).toFixed(2)),
              leverage: 1,
              liquidationPrice: null,
              riskAmountUsd: currentSet.riskUsd,
              riskPercent,
              rewardAmountUsd: Math.abs(currentSet.pnlUsd),
              rrRatio: Math.abs(currentSet.rMultiple),
            });
          }
        }
      }, 650);
      return () => clearTimeout(buyTimer);
    }

    if (handsFreePhase === 'SELLING') {
      const sellTimer = setTimeout(() => {
        if (selectedSetNumber >= 10) {
          setIsHandsFreeStewardRunning(false);
          setHandsFreePhase('COMPLETED');
          setShowCompletionReport(true);
          const doneTime = formatNowTime();
          const finalWins = tenSets.filter((s) => s.outcome === 'WIN_TARGET_HIT').length;
          const finalStops = tenSets.filter((s) => s.outcome === 'CONTROLLED_1R_STOP').length;
          const finalTotalR = tenSets.reduce((acc, s) => acc + s.rMultiple, 0).toFixed(1);
          const finalEnd = tenSets[9];
          const doneTitle = `✓ All 10 Sets Rehearsed! (${finalWins} Target Sells · ${finalStops} Safety Stops)`;
          const doneDetail = `Simulated 10-Set Projection: +${finalTotalR}R (${
            finalEnd
              ? `${batchSummary.startCoins.toFixed(qtyDecimals)} → ${finalEnd.cumulativeCoinsAfter.toFixed(qtyDecimals)} ${activeCoinTicker} / $${finalEnd.cumulativeBalanceAfter.toFixed(2)}`
              : ''
          }). Note: Your real on-chain wallet balance remains untouched (${
            verifiedWallet
              ? `${verifiedWallet.spendableCoins.toFixed(qtyDecimals)} ${verifiedWallet.coinTicker} spendable`
              : 'Read-Only Non-Custodial'
          }) until you sign real Limit Offers inside Xaman DEX or Trust Wallet and live market price reaches each mark.`;

          setLatestMarkNotification({
            timestamp: doneTime,
            kind: 'ALL_TEN_COMPLETED',
            title: doneTitle,
            detail: doneDetail,
          });
          triggerOptionalBrowserNotification(doneTitle, doneDetail);
          void handleGenerateAiExplanation();
          return;
        }
        const nextSet = selectedSetNumber + 1;
        setCompletedSetsCount(nextSet);
        setSelectedSetNumber(nextSet);
        setHandsFreePhase('BUYING');
        const nextSetObj = tenSets[nextSet - 1];
        if (nextSetObj) {
          recordSetBuyMarkHit(nextSetObj);
        }
      }, 740);
      return () => clearTimeout(sellTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isHandsFreeStewardRunning,
    handsFreePhase,
    selectedSetNumber,
    symphonyAudioEnabled,
    tenSets,
  ]);

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 space-y-5">
      {/* Header & Mode Switcher (Simulated vs. Google-Protected Live Wallet Mode) */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Bot className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>10-Set Buy & Sell Sequencer (BTC · XRP · XLM)</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-amber-600 dark:text-amber-400">
              ♪ Live Symphony Progression
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              1-Tap Confirm & Hands-Free 10-Set Stewardship
            </span>
          </div>
          <h2 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Automated 10-Set Buy & Sell Sequencer
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Teach students to <strong>trust a sound mathematical plan rather than micromanage control</strong>: connect your <strong>Xaman</strong> or <strong>Trust Wallet</strong> balance (e.g. 5 spendable XRP), confirm once, and let the sequencer automatically execute all 10 Buy & Sell sets while explaining every move.
          </p>
        </div>

        {/* Mode Toggle: Simulated Classroom vs. Easy-Unlock Live Wallet Mode + Real XRP Account Bridge */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setExecutionMode('simulated');
              setShowWalletSignDrawer(false);
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              executionMode === 'simulated'
                ? 'bg-sky-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Simulated 10-Set Mode
          </button>
          <button
            type="button"
            onClick={() => setExecutionMode('trust_wallet_live')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              executionMode === 'trust_wallet_live'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isWalletGateUnlocked ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            <span>Xaman / Trust Wallet Mode</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isWalletGateUnlocked) {
                handleClassroomQuickUnlock();
              }
              onSelectSymbol('XRPUSDT');
              setWalletNetwork('Xaman_XRPL');
              setExecutionMode('trust_wallet_live');
              setShowRealXrpBridge(true);
              window.setTimeout(() => {
                document
                  .getElementById('real-xrpl-execution-bridge')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 90);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Use Real XRP Account</span>
          </button>
        </div>
      </div>

      {/* FRICTIONLESS ANDROID-READY SIGN-OFF GATE + LIVE WALLET BRIDGE (When in Live Wallet Mode) */}
      {executionMode === 'trust_wallet_live' && (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 sm:p-5 space-y-4">
          {!isWalletGateUnlocked ? (
            /* LOCKED STATE: 1-Tap Android Sign-Off OR Optional Google Sign-In */
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>
                    Step 1 · Quick Sign-Off Gate (Works Instantly on Android, Xaman & Desktop)
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Android mobile browsers often block Google popup windows inside embedded apps—so you can now unlock with <strong>1-Tap Classroom Sign-Off</strong> immediately, or optionally sign in with Google for cloud audit sync.
                </p>
                {googleAuthError && (
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 pt-1">
                    {googleAuthError}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleClassroomQuickUnlock}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1-Tap Classroom Sign-Off (Android Ready)</span>
                </button>

                <button
                  type="button"
                  disabled={isSigningInGoogle || isAuthChecking}
                  onClick={() => void handleGoogleUnlockWallet()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {isSigningInGoogle ? 'Opening Google...' : 'Google Sign-In (Optional)'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* UNLOCKED STATE: Clean 3-Step Connect -> Confirm Once -> Hands-Free 10-Set Auto-Pilot */
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-200/80 dark:border-emerald-500/25">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 text-white font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      {isGoogleVerified
                        ? `Google Verified: ${googleUser?.email}`
                        : 'Classroom Sign-Off Confirmed (Android Ready)'}
                    </span>
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    Zero Private Keys Asked · Non-Custodial Self-Custody
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!isGoogleVerified && (
                    <button
                      type="button"
                      disabled={isSigningInGoogle}
                      onClick={() => void handleGoogleUnlockWallet()}
                      className="px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-500/40 bg-white dark:bg-slate-900 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 cursor-pointer whitespace-nowrap"
                    >
                      {isSigningInGoogle ? 'Connecting...' : '+ Link Google (Optional)'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleLockWalletGate()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer whitespace-nowrap"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Lock</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                  <strong>Step 2 · Verify Public Wallet:</strong> Paste your <strong>Xaman</strong> or <strong>Trust Wallet</strong> address (<span className="font-mono">r...</span> for 5 XRP, <span className="font-mono">bc1...</span> for BTC, or <span className="font-mono">G...</span> for XLM).{' '}
                  <span className="text-amber-800 dark:text-amber-300">
                    Tip: Native XRP (<span className="font-mono">r...</span>) uses Xaman or Trust Wallet Mobile—browser extensions (<span className="font-mono">0x...</span>) only sign Ethereum/BNB coins!
                  </span>
                </p>

                <div className="flex flex-wrap items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setWalletNetwork('Xaman_XRPL');
                      onSelectSymbol('XRPUSDT');
                    }}
                    className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                      walletNetwork === 'Xaman_XRPL'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Xaman (Android XRPL)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWalletNetwork('XRPL');
                      onSelectSymbol('XRPUSDT');
                    }}
                    className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                      walletNetwork === 'XRPL'
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Trust Wallet (XRPL)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWalletNetwork('Bitcoin');
                      onSelectSymbol('BTCUSDT');
                    }}
                    className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                      walletNetwork === 'Bitcoin'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Trust Wallet (BTC)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWalletNetwork('Stellar');
                      onSelectSymbol('XLMUSDT');
                    }}
                    className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                      walletNetwork === 'Stellar'
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Stellar (XLM)
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  type="text"
                  value={trustWalletAddress}
                  onChange={(e) => setTrustWalletAddress(e.target.value)}
                  placeholder="Paste public address (r... for 5 XRP in Xaman/Trust Wallet, bc1... for BTC, G... for XLM)"
                  className="flex-1 min-w-[240px] px-3.5 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  disabled={isCheckingWallet}
                  onClick={() => void handleConnectTrustWallet()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {isCheckingWallet
                    ? 'Checking Live Ledger...'
                    : walletConnected
                    ? '✓ Wallet Verified on Ledger'
                    : 'Verify Public Wallet'}
                </button>

                {/* STEP 3: ONE-TAP CONFIRM & AUTO-RUN ALL 10 SETS */}
                <button
                  type="button"
                  disabled={isHandsFreeStewardRunning}
                  onClick={handleConfirmAndAutoRunAllTenSets}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    {isHandsFreeStewardRunning
                      ? `Auto-Handling Set #${selectedSetNumber}/10 (${handsFreePhase})...`
                      : batchConfirmedAllTen
                      ? '✓ Confirmed · Re-Run All 10 Sets Automatically'
                      : 'Step 3 · Confirm & Auto-Run All 10 Sets'}
                  </span>
                </button>
              </div>

              {walletStatusMsg && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-300 bg-white/85 dark:bg-slate-900/85 px-3.5 py-2.5 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                    <span>{walletStatusMsg}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {liveOnChainBalance && (
                        <span className="font-mono font-bold">{liveOnChainBalance}</span>
                      )}
                      <button
                        type="button"
                        disabled={isCheckingWallet}
                        onClick={() => void handleConnectTrustWallet()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[11px] font-semibold text-emerald-900 dark:text-emerald-200 cursor-pointer"
                      >
                        <RefreshCw
                          className={`w-3 h-3 ${isCheckingWallet ? 'animate-spin' : ''}`}
                        />
                        <span>Re-Check</span>
                      </button>
                    </div>
                  </div>

                  {/* Direct Android Wallet DEX Bridges + Live Sizing Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="lg:col-span-6 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          Live Wallet Sizing ({verifiedWallet ? verifiedWallet.coinTicker : activeCoinTicker})
                        </span>
                        {verifiedWallet && (
                          <button
                            type="button"
                            onClick={() => setUseLiveWalletSizing((v) => !v)}
                            className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                          >
                            {useLiveWalletSizing
                              ? 'Switch to $5 Classroom Preset'
                              : `Use My Live ${verifiedWallet.spendableCoins.toFixed(qtyDecimals)} ${verifiedWallet.coinTicker}`}
                          </button>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {verifiedWallet && isSizingFromLiveWallet ? (
                          <>
                            All 10 Buy & Sell sets are sized from your{' '}
                            <strong className="font-mono text-slate-900 dark:text-white">
                              {verifiedWallet.spendableCoins.toFixed(qtyDecimals)}{' '}
                              {verifiedWallet.coinTicker}
                            </strong>{' '}
                            spendable balance (
                            <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                              ${(verifiedWallet.spendableCoins * effectiveBasePrice).toFixed(2)}
                            </strong>
                            ), keeping{' '}
                            <span className="font-mono">
                              {verifiedWallet.reservedCoins.toFixed(2)} {verifiedWallet.coinTicker}
                            </span>{' '}
                            base reserve protected.
                          </>
                        ) : (
                          <>
                            Using Classroom Budget (${Math.max(5, accountBalance).toFixed(2)}). Verify a funded <span className="font-mono">r...</span>, <span className="font-mono">bc1...</span>, or <span className="font-mono">G...</span> wallet to size from live coins.
                          </>
                        )}
                      </p>
                    </div>

                    <div className="lg:col-span-6 space-y-2 lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-4">
                      <div className="font-bold text-amber-700 dark:text-amber-400">
                        Android & Mobile Self-Custody Bridges (Optional On-Ledger DEX)
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href="https://xumm.app/detect/xapp:xumm.dex"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => void handleCopyMasterTenSetBatch()}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer whitespace-nowrap"
                        >
                          <span>Launch Xaman DEX (Scan QR on PC · Direct on Android)</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                          href="https://link.trustwallet.com/open_url?coin_id=144&url=https://xrpl.org"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => void handleCopyMasterTenSetBatch()}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold cursor-pointer whitespace-nowrap"
                        >
                          <span>Open Trust Wallet App</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => void handleCopyMasterTenSetBatch()}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer whitespace-nowrap"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedMasterBatch ? 'Copied All 10 ✓' : 'Copy 10-Set Plan'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* LIVE $5 REAL-WALLET UPTICK & ON-CHAIN XRPL MARKET VOLUME MONITOR */}
                  {verifiedWallet && (
                    <LiveWalletUptickTracker
                      walletAddress={verifiedWallet.address}
                      walletLabel={verifiedWallet.walletLabel}
                      coinTicker={verifiedWallet.coinTicker}
                      totalCoins={verifiedWallet.totalCoins}
                      spendableCoins={verifiedWallet.spendableCoins}
                      reservedCoins={verifiedWallet.reservedCoins}
                      livePrice={
                        verifiedWallet.coinTicker === 'BTC'
                          ? btcLivePrice || effectiveBasePrice
                          : verifiedWallet.coinTicker === 'XRP'
                          ? xrpLivePrice || effectiveBasePrice
                          : xlmLivePrice || effectiveBasePrice
                      }
                      recommendedBuyPrice={selectedSet.buyPrice}
                      recommendedSellPrice={selectedSet.sellPrice}
                      onLiveLedgerSync={(upd) => {
                        setVerifiedWallet((prev) =>
                          prev
                            ? {
                                ...prev,
                                totalCoins: upd.totalCoins,
                                spendableCoins: upd.spendableCoins,
                                reservedCoins: upd.reservedCoins,
                                checkedAt: upd.checkedAt,
                              }
                            : prev
                        );
                        setLiveOnChainBalance(
                          `${upd.totalCoins.toFixed(2)} ${verifiedWallet.coinTicker} (${upd.spendableCoins.toFixed(
                            2
                          )} spendable)`
                        );
                      }}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* INTERACTIVE 4-STEP REAL XRP ACCOUNT ON-CHAIN EXECUTION BRIDGE */}
      {((executionMode === 'trust_wallet_live' && isWalletGateUnlocked && activeCoinTicker === 'XRP') ||
        verifiedWallet?.coinTicker === 'XRP') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              Real XRP Account On-Chain Execution Bridge (Xaman · Sologenic · Crossmark)
            </span>
            <button
              type="button"
              onClick={() => setShowRealXrpBridge((v) => !v)}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer whitespace-nowrap shrink-0"
            >
              {showRealXrpBridge ? 'Minimize Real XRP Guide' : 'Open Real XRP 4-Step Guide'}
            </button>
          </div>

          {showRealXrpBridge && (
            <RealXrplAccountExecutionGuide
              walletAddress={
                verifiedWallet?.coinTicker === 'XRP'
                  ? verifiedWallet.address
                  : trustWalletAddress
              }
              onChangeWalletAddress={setTrustWalletAddress}
              onVerifyWalletAddress={() => void handleConnectTrustWallet()}
              isCheckingWallet={isCheckingWallet}
              totalXrp={
                verifiedWallet?.coinTicker === 'XRP' ? verifiedWallet.totalCoins : 9.94
              }
              spendableXrp={
                verifiedWallet?.coinTicker === 'XRP' ? verifiedWallet.spendableCoins : 8.94
              }
              reservedXrp={
                verifiedWallet?.coinTicker === 'XRP' ? verifiedWallet.reservedCoins : 1.0
              }
              liveXrpPrice={xrpLivePrice || effectiveBasePrice}
              selectedSetNumber={selectedSet.setNumber}
              onSelectSetNumber={(num) => {
                if (num > completedSetsCount) {
                  setCompletedSetsCount(num);
                }
                setSelectedSetNumber(num);
              }}
              allTenSets={tenSets}
              setupName={selectedSet.setupName}
              recommendedBuyPrice={selectedSet.buyPrice}
              recommendedStopPrice={selectedSet.stopLossPrice}
              recommendedSellPrice={selectedSet.sellPrice}
              rehearsalStartUsd={batchSummary.startBal}
              rehearsalEndUsd={batchSummary.endBal}
            />
          )}
        </div>
      )}

      {/* LIVE BUY & SELL MARK-HIT NOTIFICATION TOAST + 10-SET COMPLETION REPORT */}
      {(latestMarkNotification ||
        showCompletionReport ||
        isHandsFreeStewardRunning ||
        handsFreePhase === 'COMPLETED') && (
        <div className="space-y-3" role="status" aria-live="polite">
          {/* Live Mark-Hit Notification Alert Bar */}
          {latestMarkNotification && (
            <div
              className={`rounded-xl border p-4 flex flex-wrap items-start justify-between gap-3 text-xs ${
                latestMarkNotification.kind === 'ALL_TEN_COMPLETED'
                  ? 'border-emerald-400 dark:border-emerald-500/60 bg-emerald-50/90 dark:bg-emerald-950/35 text-slate-900 dark:text-emerald-100'
                  : latestMarkNotification.kind === 'TARGET_SELL_HIT'
                  ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/25 text-slate-900 dark:text-slate-100'
                  : latestMarkNotification.kind === 'STOP_LOSS_HIT'
                  ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50/60 dark:bg-rose-950/25 text-slate-900 dark:text-slate-100'
                  : 'border-sky-300 dark:border-sky-500/40 bg-sky-50/60 dark:bg-sky-950/25 text-slate-900 dark:text-slate-100'
              }`}
            >
              <div className="space-y-1 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 font-bold">
                  <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{latestMarkNotification.title}</span>
                  <span aria-hidden="true" className="text-slate-400">
                    ·
                  </span>
                  <span className="font-mono font-normal text-slate-600 dark:text-slate-300 tabular-nums">
                    {latestMarkNotification.timestamp}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {latestMarkNotification.detail}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {markHitReceipts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCompletionReport((v) => !v)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {showCompletionReport
                      ? 'Hide Mark-Hit Log'
                      : `View What Happened (${markHitReceipts.length}/10)`}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => void handleToggleDeviceNotifications()}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                    deviceNotifyEnabled
                      ? 'border-emerald-400 bg-emerald-600 text-white'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{deviceNotifyEnabled ? 'Device Alerts On' : 'Phone/Browser Alerts'}</span>
                </button>

                {isHandsFreeStewardRunning ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsHandsFreeStewardRunning(false);
                      setHandsFreePhase('IDLE');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Emergency Pause</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setLatestMarkNotification(null);
                      if (handsFreePhase === 'COMPLETED') setHandsFreePhase('IDLE');
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Set-by-Set Buy & Sell Mark-Hit Completion View ("What Happened on Each Set #01 - #10") */}
          {showCompletionReport && markHitReceipts.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden text-xs">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-bold text-slate-900 dark:text-white">
                    {markHitReceipts.filter((r) => r.exitHitAt !== null).length >= 10
                      ? '✓ All 10 Sets Finished · Complete Buy & Sell Mark-Hit Report'
                      : `Live Buy & Sell Mark-Hit Tracker (${
                          markHitReceipts.filter((r) => r.exitHitAt !== null).length
                        }/10 Sets Finished)`}
                  </span>
                  <span aria-hidden="true" className="text-slate-400">
                    ·
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Click any row to inspect why it bought & sold
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopyCompletionReport()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>
                      {copiedCompletionReport ? 'Report Copied ✓' : 'Copy 10-Set Report'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCompletionReport(false)}
                    className="px-2.5 py-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Minimize
                  </button>
                </div>
              </div>

              {/* Clear Reconciliation Bar: Why Simulated Rehearsal Balance vs. Real On-Chain Wallet Differ */}
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-amber-50/60 dark:bg-amber-950/20 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    1. Real On-Chain Wallet Balance:{' '}
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">
                      {verifiedWallet && isSizingFromLiveWallet
                        ? `${verifiedWallet.spendableCoins.toFixed(qtyDecimals)} ${verifiedWallet.coinTicker} Spendable (${verifiedWallet.totalCoins.toFixed(qtyDecimals)} ${verifiedWallet.coinTicker} Total — Unchanged On-Chain)`
                        : 'Untouched (Read-Only Non-Custodial)'}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    Symphony Markets Academy never holds your private keys. Running 10 sets in 15 seconds is a <strong>safe fast-forward rehearsal</strong> sized from your real coins—so <strong>0.00 {activeCoinTicker}</strong> moved on the blockchain.
                  </p>
                </div>
                <div className="md:border-l md:border-amber-200/80 dark:md:border-slate-800 md:pl-3">
                  <div className="font-bold text-slate-900 dark:text-white">
                    2. Simulated 10-Set Projection:{' '}
                    <span className="font-mono text-sky-700 dark:text-sky-400">
                      {batchSummary.startCoins.toFixed(qtyDecimals)} →{' '}
                      {batchSummary.endCoins.toFixed(qtyDecimals)} {activeCoinTicker} ($
                      {batchSummary.endBal.toFixed(2)})
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    For your real wallet to change on-chain: <strong>(a)</strong> sign a real Limit Buy/Sell offer inside <strong>Xaman DEX</strong> or <strong>Sologenic</strong> with your PIN, and <strong>(b)</strong> wait for the live market price to actually reach those Buy & Sell marks!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isWalletGateUnlocked) {
                        handleClassroomQuickUnlock();
                      }
                      onSelectSymbol('XRPUSDT');
                      setWalletNetwork('Xaman_XRPL');
                      setExecutionMode('trust_wallet_live');
                      setShowRealXrpBridge(true);
                      window.setTimeout(() => {
                        document
                          .getElementById('real-xrpl-execution-bridge')
                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 90);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>Use My Real XRP Account On-Chain (4-Step Bridge)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {markHitReceipts.map((rec) => {
                  const setLabel = rec.setNumber < 10 ? `0${rec.setNumber}` : `${rec.setNumber}`;
                  const isSelected = rec.setNumber === selectedSetNumber;
                  return (
                    <div
                      key={rec.setNumber}
                      onClick={() => {
                        if (!isHandsFreeStewardRunning) {
                          setSelectedSetNumber(rec.setNumber);
                        }
                      }}
                      className={`px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 transition-colors ${
                        isHandsFreeStewardRunning ? 'cursor-default' : 'cursor-pointer'
                      } ${
                        isSelected
                          ? 'bg-sky-50/70 dark:bg-sky-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="space-y-0.5 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2 font-mono tabular-nums">
                          <span className="font-bold text-slate-900 dark:text-white">
                            Set #{setLabel}
                          </span>
                          <span aria-hidden="true" className="text-slate-400">
                            ·
                          </span>
                          <span className="text-sky-700 dark:text-sky-400">
                            Buy Hit {rec.buyMarkPrice} ({rec.buyHitAt})
                          </span>
                          <span aria-hidden="true" className="text-slate-400">
                            →
                          </span>
                          {rec.status === 'BUY_MARK_HIT' ? (
                            <span className="text-amber-700 dark:text-amber-300 font-semibold">
                              Waiting for Sell / Stop Mark...
                            </span>
                          ) : rec.status === 'PROFIT_TARGET_HIT' ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                              ✓ Target Sell Hit {rec.exitMarkPrice} (+{rec.rMultiple}R ·{' '}
                              {rec.exitHitAt})
                            </span>
                          ) : (
                            <span className="text-rose-700 dark:text-rose-400 font-bold">
                              ■ Safety Stop-Loss Hit {rec.exitMarkPrice} (-1.0R · {rec.exitHitAt})
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-snug">
                          {rec.whatHappenedLine}
                        </p>
                      </div>

                      <div className="font-mono tabular-nums text-right shrink-0">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {rec.exitHitAt ? 'Rehearsal Projection' : 'Active Size'}
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {rec.exitHitAt ? rec.balanceAfterText : rec.quantityText}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Control Deck: 1-Click Confirm & Auto-Handle All 10 Sets + Symphony Progression + Coin & AI Explain */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isHandsFreeStewardRunning}
            onClick={handleConfirmAndAutoRunAllTenSets}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>
              {isHandsFreeStewardRunning
                ? `Auto-Handling Set #${selectedSetNumber}/10 (${handsFreePhase})...`
                : 'Confirm & Auto-Run All 10 Buy/Sell Sets'}
            </span>
          </button>

          {/* Simple 10-Set Symphony Note Progression Button */}
          <button
            type="button"
            disabled={isHandsFreeStewardRunning}
            onClick={handleToggleSymphonyProgression}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 ${
              isSymphonyPlaying
                ? 'bg-amber-500 text-slate-950'
                : 'border border-amber-400/70 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-300'
            }`}
          >
            {isSymphonyPlaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Music className="w-3.5 h-3.5" />
            )}
            <span>
              {isSymphonyPlaying
                ? `Playing Note #${selectedSetNumber} (${selectedSet.musicalNote.noteName})...`
                : '♪ Play 10-Set Symphony'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSymphonyAudioEnabled((v) => !v)}
            title="Toggle musical note sound when stepping or clicking sets"
            className="inline-flex items-center gap-1 px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
          >
            {symphonyAudioEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="hidden sm:inline">
              {symphonyAudioEnabled ? 'Notes On' : 'Muted'}
            </span>
          </button>

          <button
            type="button"
            disabled={isHandsFreeStewardRunning}
            onClick={() => {
              setIsAutoRunning(false);
              setIsSymphonyPlaying(false);
              const next = completedSetsCount >= 10 ? 1 : completedSetsCount + 1;
              if (next === 1) {
                setMarkHitReceipts([]);
              }
              setCompletedSetsCount(next);
              setSelectedSetNumber(next);
              setShowCompletionReport(true);
              const s = tenSets[next - 1];
              if (s) {
                recordSetExitMarkFinished(s, formatNowTime());
                if (symphonyAudioEnabled) {
                  playTradeSetSymphonyNote({
                    setNumber: s.setNumber,
                    outcome: s.outcome,
                    winOrdinalIndex: s.winOrdinalIndex,
                    rMultiple: s.rMultiple,
                  });
                }
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <StepForward className="w-3.5 h-3.5" />
            <span>+1 Set</span>
          </button>

          <button
            type="button"
            disabled={isHandsFreeStewardRunning}
            onClick={() => {
              setIsAutoRunning(false);
              setIsSymphonyPlaying(false);
              setCompletedSetsCount(10);
              const stamp = formatNowTime();
              const allReceipts: SetMarkHitReceipt[] = tenSets.map((s) => {
                const setLabel = s.setNumber < 10 ? `0${s.setNumber}` : `${s.setNumber}`;
                const isWin = s.outcome === 'WIN_TARGET_HIT';
                const buyStr = `$${formatCoinPrice(s.buyPrice)}`;
                const exitStr = `$${formatCoinPrice(isWin ? s.sellPrice : s.stopLossPrice)}`;
                return {
                  setNumber: s.setNumber,
                  setupBadge: s.patternBadge,
                  coinTicker: activeCoinTicker,
                  quantityText: formatCoinQtyCompact(s.quantity),
                  buyMarkPrice: buyStr,
                  buyHitAt: stamp,
                  exitMarkPrice: exitStr,
                  exitHitAt: stamp,
                  status: isWin ? 'PROFIT_TARGET_HIT' : 'SAFETY_STOP_HIT',
                  rMultiple: s.rMultiple,
                  pnlUsd: s.pnlUsd,
                  balanceAfterText: `${s.cumulativeCoinsAfter.toFixed(qtyDecimals)} ${activeCoinTicker} ($${s.cumulativeBalanceAfter.toFixed(2)})`,
                  whatHappenedLine: isWin
                    ? `Bought mark @ ${buyStr} → Hit Profit Target Sell mark @ ${exitStr} (+${s.rMultiple}R / +$${s.pnlUsd.toFixed(2)}). Set #${setLabel} finished cleanly.`
                    : `Bought mark @ ${buyStr} → Hit 2% Safety Stop-Loss mark @ ${exitStr} (-1.0R / $${s.pnlUsd.toFixed(2)}). Set #${setLabel} finished & protected wallet.`,
                };
              });
              setMarkHitReceipts(allReceipts);
              setShowCompletionReport(true);
              setLatestMarkNotification({
                timestamp: stamp,
                kind: 'ALL_TEN_COMPLETED',
                title: `✓ All 10 Buy & Sell Sets Finished! (${batchSummary.wins} Target Sells · ${batchSummary.losses} Safety Stops)`,
                detail:
                  'Every set from #01 to #10 hit its Buy mark and completed at either its Profit Target or 2% Safety Stop. Inspect what happened on each set below!',
              });
            }}
            className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>All 10</span>
          </button>

          <button
            type="button"
            disabled={isHandsFreeStewardRunning}
            onClick={() => {
              setIsAutoRunning(false);
              setIsSymphonyPlaying(false);
              setHandsFreePhase('IDLE');
              setMarkHitReceipts([]);
              setLatestMarkNotification(null);
              setShowCompletionReport(false);
              setCompletedSetsCount(1);
              setSelectedSetNumber(1);
            }}
            className="inline-flex items-center gap-1 px-2 py-2 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {markHitReceipts.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCompletionReport((v) => !v)}
              className="inline-flex items-center gap-1 px-2.5 py-2 border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/30 text-xs font-semibold text-emerald-800 dark:text-emerald-300 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>
                {showCompletionReport
                  ? 'Hide Mark-Hit Report'
                  : `Mark-Hit Report (${markHitReceipts.filter((r) => r.exitHitAt !== null).length}/10)`}
              </span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onSelectSymbol('BTCUSDT')}
              className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer whitespace-nowrap shrink-0 ${
                symbol === 'BTCUSDT'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              BTC (${(btcLivePrice || 91450).toLocaleString(undefined, { maximumFractionDigits: 0 })})
            </button>
            <button
              type="button"
              onClick={() => onSelectSymbol('XRPUSDT')}
              className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer whitespace-nowrap shrink-0 ${
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
              className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer whitespace-nowrap shrink-0 ${
                symbol === 'XLMUSDT'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              XLM (${(xlmLivePrice || 0.415).toFixed(4)})
            </button>
          </div>

          <button
            type="button"
            disabled={isGeneratingAi}
            onClick={handleGenerateAiExplanation}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {isGeneratingAi ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Explaining...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Explain 10 Sets</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 10-Set Batch Scoreboard Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono tabular-nums text-xs">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
          <div className="font-sans text-slate-500 dark:text-slate-400">
            {isSizingFromLiveWallet ? 'Sets Planned (Non-Custodial)' : 'Sets Executed'}
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
            {completedSetsCount} / 10 Sets
          </div>
          {executionMode === 'trust_wallet_live' && isWalletGateUnlocked && (
            <div className="font-sans text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
              {batchConfirmedAllTen
                ? '✓ All 10 Sets Confirmed'
                : `${signedSetNumbers.length} / 10 Confirmed`}
            </div>
          )}
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
          <div className="font-sans text-slate-500 dark:text-slate-400">Win / Stop Ratio</div>
          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {batchSummary.wins}W – {batchSummary.losses}L (
            {Math.round((batchSummary.wins / visibleSets.length) * 100)}%)
          </div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
          <div className="font-sans text-slate-500 dark:text-slate-400">Cumulative R-Edge</div>
          <div className="text-base font-bold text-sky-600 dark:text-sky-400 mt-0.5">
            +{batchSummary.totalR.toFixed(1)}R Total
          </div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
          <div className="font-sans text-slate-500 dark:text-slate-400">
            {isSizingFromLiveWallet
              ? `Live Wallet Spendable (${verifiedWallet.shortAddress.slice(0, 6)}..)`
              : 'Starting Budget'}
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
            {isSizingFromLiveWallet
              ? `${batchSummary.startCoins.toFixed(qtyDecimals)} ${activeCoinTicker} ($${batchSummary.startBal.toFixed(2)})`
              : `$${batchSummary.startBal.toFixed(2)}`}
          </div>
          {isBtc && !isSizingFromLiveWallet && (
            <div className="font-sans text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
              ≈ {Math.round(batchSummary.startCoins * 100_000_000).toLocaleString()} Satoshis
            </div>
          )}
          {isSizingFromLiveWallet && (
            <div className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              +{verifiedWallet.reservedCoins.toFixed(2)} {activeCoinTicker} locked ={' '}
              {verifiedWallet.totalCoins.toFixed(qtyDecimals)} on-chain
            </div>
          )}
        </div>
        <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/25 col-span-2 sm:col-span-1">
          <div className="font-sans text-emerald-800 dark:text-emerald-300 font-semibold">
            {isSizingFromLiveWallet ? 'Projected Spendable After Sets' : 'Ending Balance'}
          </div>
          <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
            {isSizingFromLiveWallet
              ? `${batchSummary.endCoins.toFixed(qtyDecimals)} ${activeCoinTicker} ($${batchSummary.endBal.toFixed(2)})`
              : `$${batchSummary.endBal.toFixed(2)} (+$${batchSummary.netPnl.toFixed(2)})`}
          </div>
          {isSizingFromLiveWallet && (
            <div className="font-sans text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
              Net: {batchSummary.netCoins >= 0 ? '+' : ''}
              {batchSummary.netCoins.toFixed(qtyDecimals)} {activeCoinTicker} · Sign sets below to execute
            </div>
          )}
        </div>
      </div>

      {/* Visual 10-Set Execution & Symphony Note Progression SVG Map */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-white">
            Visual 10-Set Buy → Sell & Symphony Progression Map ({activeCoinTicker} · Click Any Set #01 – #10 to Hear & Inspect)
          </span>
          <span className="font-mono text-amber-300">
            ♪ Green Wins = Ascending Harp · ♩ Red Stops = Calm Cello Rest
          </span>
        </div>

        <svg
          viewBox="0 0 900 214"
          className="w-full h-auto"
          role="img"
          aria-label="Visual 10-Set automated trading and musical progression chart showing Sets 1 through 10"
        >
          <line x1="30" y1="42" x2="870" y2="42" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="30" y1="100" x2="870" y2="100" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="30" y1="160" x2="870" y2="160" stroke="#334155" strokeWidth="1" />

          {tenSets.map((setItem, idx) => {
            const xCenter = 68 + idx * 84;
            const isUnlocked = setItem.setNumber <= completedSetsCount;
            const isSelected = setItem.setNumber === selectedSetNumber;
            const isWin = setItem.outcome === 'WIN_TARGET_HIT';

            const buyY = 134;
            const sellY = isWin ? 62 : 153;

            const isActivelyBuying =
              isHandsFreeStewardRunning && isSelected && handsFreePhase === 'BUYING';
            const isActivelySelling =
              isHandsFreeStewardRunning && isSelected && handsFreePhase === 'SELLING';

            return (
              <g
                key={setItem.setNumber}
                className={isHandsFreeStewardRunning ? 'cursor-default' : 'cursor-pointer'}
                opacity={isUnlocked ? 1 : 0.25}
                onClick={() => {
                  if (isHandsFreeStewardRunning) return;
                  if (!isUnlocked) setCompletedSetsCount(setItem.setNumber);
                  setSelectedSetNumber(setItem.setNumber);
                  if (symphonyAudioEnabled) {
                    playTradeSetSymphonyNote({
                      setNumber: setItem.setNumber,
                      outcome: setItem.outcome,
                      winOrdinalIndex: setItem.winOrdinalIndex,
                      rMultiple: setItem.rMultiple,
                    });
                  }
                }}
              >
                {/* Highlight Column Box */}
                <rect
                  x={xCenter - 36}
                  y="12"
                  width="72"
                  height="188"
                  rx="8"
                  fill={isSelected ? '#0EA5E9' : '#0F172A'}
                  fillOpacity={isSelected ? '0.2' : '0.4'}
                  stroke={
                    isActivelyBuying
                      ? '#FBBF24'
                      : isActivelySelling
                      ? '#10B981'
                      : isSelected
                      ? '#38BDF8'
                      : '#1E293B'
                  }
                  strokeWidth={isSelected ? '2' : '1'}
                />

                {/* Set Number Header */}
                <text
                  x={xCenter}
                  y="27"
                  textAnchor="middle"
                  fill={isSelected ? '#FBBF24' : '#94A3B8'}
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  SET #{setItem.setNumber < 10 ? `0${setItem.setNumber}` : setItem.setNumber}
                </text>

                {/* Musical Note Progression Badge */}
                <text
                  x={xCenter}
                  y="39"
                  textAnchor="middle"
                  fill={isWin ? '#FDE68A' : '#FDA4AF'}
                  fontSize="8.5"
                  fontFamily="monospace"
                >
                  {setItem.musicalNote.glyph} {setItem.musicalNote.noteName}
                </text>

                {/* Vertical Connector from Buy to Sell (Shows partial line while Buying, full line once Selling) */}
                {!isActivelyBuying && (
                  <line
                    x1={xCenter}
                    y1={buyY}
                    x2={xCenter}
                    y2={sellY}
                    stroke={isWin ? '#10B981' : '#F43F5E'}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                )}

                {/* BUY Node + Active Buying Halo */}
                {isActivelyBuying && (
                  <circle
                    cx={xCenter}
                    cy={buyY}
                    r="11"
                    fill="#38BDF8"
                    fillOpacity="0.28"
                    stroke="#38BDF8"
                    strokeWidth="1.5"
                  />
                )}
                <circle cx={xCenter} cy={buyY} r="5.5" fill="#38BDF8" stroke="#0F172A" strokeWidth="1.5" />
                <text
                  x={xCenter}
                  y={buyY + 14}
                  textAnchor="middle"
                  fill={isActivelyBuying ? '#FDE68A' : '#BAE6FD'}
                  fontSize="8.2"
                  fontWeight={isActivelyBuying ? 'bold' : 'normal'}
                  fontFamily="monospace"
                >
                  {isActivelyBuying
                    ? 'BUYING...'
                    : isBtc
                    ? `Buy $${Math.round(setItem.buyPrice).toLocaleString()}`
                    : `Buy $${setItem.buyPrice.toFixed(3)}`}
                </text>

                {/* SELL Node + Active Selling Halo */}
                {!isActivelyBuying && (
                  <>
                    {isActivelySelling && (
                      <circle
                        cx={xCenter}
                        cy={sellY}
                        r="11.5"
                        fill={isWin ? '#10B981' : '#F43F5E'}
                        fillOpacity="0.3"
                        stroke={isWin ? '#34D399' : '#FB7185'}
                        strokeWidth="1.5"
                      />
                    )}
                    <circle
                      cx={xCenter}
                      cy={sellY}
                      r="6"
                      fill={isWin ? '#10B981' : '#F43F5E'}
                      stroke="#0F172A"
                      strokeWidth="1.5"
                    />
                    <text
                      x={xCenter}
                      y={isWin ? sellY - 8 : sellY + 14}
                      textAnchor="middle"
                      fill={isWin ? '#6EE7B7' : '#FDA4AF'}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {isWin ? `+${setItem.rMultiple}R` : '-1.0R Stop'}
                    </text>
                  </>
                )}

                {/* Cumulative Balance Footer */}
                <text
                  x={xCenter}
                  y="180"
                  textAnchor="middle"
                  fill="#E2E8F0"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  ${setItem.cumulativeBalanceAfter.toFixed(2)}
                </text>
                <text
                  x={xCenter}
                  y="192"
                  textAnchor="middle"
                  fill="#38BDF8"
                  fontSize="7.5"
                  fontFamily="monospace"
                >
                  {formatCoinQtyCompact(setItem.cumulativeCoinsAfter)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* 10 Quick Set Selector Buttons */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {tenSets.map((s) => {
            const isSelected = s.setNumber === selectedSetNumber;
            const isWin = s.outcome === 'WIN_TARGET_HIT';
            return (
              <button
                key={s.setNumber}
                type="button"
                onClick={() => {
                  if (s.setNumber > completedSetsCount) {
                    setCompletedSetsCount(s.setNumber);
                  }
                  setSelectedSetNumber(s.setNumber);
                  if (symphonyAudioEnabled) {
                    playTradeSetSymphonyNote({
                      setNumber: s.setNumber,
                      outcome: s.outcome,
                      winOrdinalIndex: s.winOrdinalIndex,
                      rMultiple: s.rMultiple,
                    });
                  }
                }}
                className={`py-2 px-1 rounded-lg border text-center font-mono text-xs font-bold transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-400/20 text-white'
                    : isWin
                    ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300 hover:border-emerald-400'
                    : 'border-rose-500/30 bg-rose-950/30 text-rose-300 hover:border-rose-400'
                }`}
              >
                #{s.setNumber < 10 ? `0${s.setNumber}` : s.setNumber}{' '}
                {isWin ? `+${s.rMultiple}R` : '-1R'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Set Detailed "What It Did & Why" Teaching Card + Direct Trust Wallet / Xaman Sign & Approve Action */}
      <div className="rounded-xl border-2 border-sky-400/70 dark:border-sky-500/40 bg-sky-50/30 dark:bg-slate-950 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="font-bold text-sky-700 dark:text-sky-400">
                SET #{selectedSet.setNumber < 10 ? `0${selectedSet.setNumber}` : selectedSet.setNumber} OF 10
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-700 dark:text-amber-400 font-semibold">
                {selectedSet.musicalNote.shortLabel}
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={`font-bold ${
                  selectedSet.outcome === 'WIN_TARGET_HIT'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {selectedSet.outcome === 'WIN_TARGET_HIT'
                  ? `✓ TARGET SOLD (+${selectedSet.rMultiple}R / +$${selectedSet.pnlUsd.toFixed(2)})`
                  : `■ SAFETY STOP EXIT (-1.0R / $${selectedSet.pnlUsd.toFixed(2)})`}
              </span>
            </div>
            <h3 className="font-editorial text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {selectedSet.setupName}
            </h3>
          </div>

          {/* Direct 1-Tap Confirm All 10 Sets OR Single-Set Wallet Ticket + Paper Portfolio Button */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isHandsFreeStewardRunning}
              onClick={handleConfirmAndAutoRunAllTenSets}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {isHandsFreeStewardRunning
                  ? `Auto-Handling Set #${selectedSetNumber}/10...`
                  : batchConfirmedAllTen
                  ? '✓ All 10 Confirmed · Re-Run Hands-Free'
                  : 'Confirm Once & Auto-Handle All 10 Sets'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isWalletGateUnlocked) {
                  handleClassroomQuickUnlock();
                }
                setExecutionMode('trust_wallet_live');
                setShowWalletSignDrawer((v) => !v);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-emerald-400/70 dark:border-emerald-500/40 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-slate-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{showWalletSignDrawer ? 'Hide Wallet Ticket' : 'Xaman / Trust Wallet Ticket'}</span>
            </button>

            {onSendSetToEmbeddedXrplDex && (
              <button
                type="button"
                onClick={() => {
                  const refXrp = xrpLivePrice || livePrice || 1.0;
                  const currentCoinPrice =
                    activeCoinTicker === 'BTC'
                      ? btcLivePrice
                      : activeCoinTicker === 'XLM'
                      ? xlmLivePrice
                      : refXrp;
                  const scaleToXrp =
                    activeCoinTicker === 'XRP' ? 1 : refXrp / Math.max(0.0001, currentCoinPrice);
                  const reserveCushion = 0.5;
                  const safeQty =
                    activeCoinTicker === 'XRP' && isSizingFromLiveWallet && verifiedWallet
                      ? Number(
                          Math.max(
                            0.5,
                            Math.min(selectedSet.quantity, verifiedWallet.spendableCoins - reserveCushion)
                          ).toFixed(2)
                        )
                      : activeCoinTicker === 'XRP'
                      ? Number(Math.max(0.5, Math.min(selectedSet.quantity, 2)).toFixed(2))
                      : 2;

                  onSendSetToEmbeddedXrplDex({
                    setNumber: selectedSet.setNumber,
                    setupName: selectedSet.setupName,
                    buyPrice: Number((selectedSet.buyPrice * scaleToXrp).toFixed(4)),
                    stopLossPrice: Number((selectedSet.stopLossPrice * scaleToXrp).toFixed(4)),
                    sellPrice: Number((selectedSet.sellPrice * scaleToXrp).toFixed(4)),
                    quantityXrp: safeQty,
                    rrRatio: Math.abs(selectedSet.rMultiple) || 2,
                    walletAddress:
                      verifiedWallet?.coinTicker === 'XRP'
                        ? verifiedWallet.address
                        : trustWalletAddress.trim().startsWith('r')
                        ? trustWalletAddress.trim()
                        : undefined,
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>
                  ⚡ Open Set #{selectedSet.setNumber < 10 ? `0${selectedSet.setNumber}` : selectedSet.setNumber} in Embedded XRPL DEX →
                </span>
              </button>
            )}

            {onLogSetPositionToPortfolio && (
              <button
                type="button"
                onClick={() =>
                  onLogSetPositionToPortfolio({
                    symbol,
                    instrument: 'spot',
                    side: 'long',
                    entryPrice: selectedSet.buyPrice,
                    stopLoss: selectedSet.stopLossPrice,
                    takeProfit: selectedSet.sellPrice,
                    quantity: selectedSet.quantity,
                    notionalUsd: Number((selectedSet.buyPrice * selectedSet.quantity).toFixed(2)),
                    marginRequiredUsd: Number(
                      (selectedSet.buyPrice * selectedSet.quantity).toFixed(2)
                    ),
                    leverage: 1,
                    liquidationPrice: null,
                    riskAmountUsd: selectedSet.riskUsd,
                    riskPercent,
                    rewardAmountUsd: Math.abs(selectedSet.pnlUsd),
                    rrRatio: Math.abs(selectedSet.rMultiple),
                  })
                }
                className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Log to Paper Portfolio →
              </button>
            )}
          </div>
        </div>

        {/* INLINE NON-CUSTODIAL WALLET SIGN & APPROVE TICKET (Explains XRPL DEX QR + Existing Balance Execution) */}
        {isWalletGateUnlocked && showWalletSignDrawer && (
          <div className="rounded-xl border border-emerald-400/70 dark:border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 space-y-3.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Xaman (Android) & Trust Wallet Order Ticket · Set #{selectedSet.setNumber} ({activeCoinTicker}/RLUSD 1x Spot)
                </span>
              </div>
              <span className="font-mono text-[11px] text-emerald-800 dark:text-emerald-300">
                {isGoogleVerified ? `Google: ${googleUser?.email}` : '1-Tap Classroom Sign-Off Active'}
              </span>
            </div>

            {/* Exact Order Specs + Safe DEX Reserve Cushion */}
            {(() => {
              const reserveBuffer =
                activeCoinTicker === 'XRP' || activeCoinTicker === 'XLM' ? 0.5 : 0;
              const safeDexQty =
                isSizingFromLiveWallet && verifiedWallet
                  ? Number(
                      Math.max(
                        0,
                        Math.min(selectedSet.quantity, verifiedWallet.spendableCoins - reserveBuffer)
                      ).toFixed(qtyDecimals)
                    )
                  : selectedSet.quantity;

              return (
                <>
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 font-mono">
                    <div className="space-y-1 text-slate-800 dark:text-slate-200">
                      <div>
                        <strong>Rehearsal Size:</strong> {formatCoinQty(selectedSet.quantity)} (1x Spot)
                        {isSizingFromLiveWallet &&
                          verifiedWallet &&
                          (activeCoinTicker === 'XRP' || activeCoinTicker === 'XLM') && (
                            <span className="ml-2 text-emerald-700 dark:text-emerald-400 font-bold">
                              · Safe On-DEX Size: {safeDexQty.toFixed(qtyDecimals)} {activeCoinTicker} (leaves 0.50 {activeCoinTicker} for TrustLine & Offer reserve)
                            </span>
                          )}
                      </div>
                      <div>
                        <span className="text-sky-600 dark:text-sky-400">
                          Buy Pullback Limit: ${formatCoinPrice(selectedSet.buyPrice)}
                        </span>{' '}
                        ·{' '}
                        <span className="text-rose-600 dark:text-rose-400">
                          Safety Stop: ${formatCoinPrice(selectedSet.stopLossPrice)}
                        </span>{' '}
                        ·{' '}
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Target Sell Limit: ${formatCoinPrice(selectedSet.sellPrice)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 font-sans">
                      <button
                        type="button"
                        onClick={() => void handleDispatchSetToWallet('Xaman', false)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>
                          {copiedSpecsSet === selectedSet.setNumber
                            ? 'Set Copied ✓'
                            : 'Copy Set Specs'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCopyMasterTenSetBatch()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-400/60 bg-emerald-50 dark:bg-emerald-900/40 font-semibold text-emerald-900 dark:text-emerald-200 cursor-pointer whitespace-nowrap"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedMasterBatch ? 'All 10 Copied ✓' : 'Copy All 10 Sets'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Plain-English Guide: Why Xaman Shows a QR Code on Computer & How to Use Existing XRP */}
                  {activeCoinTicker === 'XRP' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-emerald-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white">
                          Why &ldquo;Open Xaman DEX&rdquo; Shows an XRPL DEX QR Code on Computer
                        </div>
                        <p>
                          Because Symphony Markets Academy is <strong>100% non-custodial</strong> (no private keys or developer custody), a browser button never silently executes a trade for you. On a computer, Xaman shows an <strong>XRPL DEX QR code</strong>—open <strong>Xaman on your Android phone</strong>, tap the middle blue <strong>Scan QR</strong> button, and Xaman opens its built-in DEX Trade screen right on your phone!
                        </p>
                      </div>
                      <div className="space-y-1 md:border-l md:border-slate-200 dark:md:border-slate-800 md:pl-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          How to Trade Your Existing {isSizingFromLiveWallet && verifiedWallet ? `${verifiedWallet.spendableCoins.toFixed(2)} XRP` : 'XRP'} Balance Inside Xaman
                        </div>
                        <p>
                          Your wallet currently holds <strong>XRP</strong> (not USD dollars yet), so you are already holding the coin! Inside Xaman DEX: <strong>(1)</strong> select pair <span className="font-mono font-semibold">XRP / RLUSD</span>, <strong>(2)</strong> tap <strong>Sell XRP (Limit)</strong> for <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">{safeDexQty.toFixed(2)} XRP</span> at <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">${formatCoinPrice(selectedSet.sellPrice)}</span> and <strong>Slide to Sign</strong>, then <strong>(3)</strong> once filled into RLUSD, place your <strong>Buy XRP (Limit)</strong> at <span className="font-mono font-semibold text-sky-600 dark:text-sky-400">${formatCoinPrice(selectedSet.buyPrice)}</span>!
                        </p>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="https://xumm.app/detect/xapp:xumm.dex"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => void handleDispatchSetToWallet('Xaman', false)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <span>Launch Xaman DEX (Scan QR on PC · Direct on Android)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://link.trustwallet.com/open_url?coin_id=144&url=https://xrpl.org"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => void handleDispatchSetToWallet('TrustWallet', false)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <span>Open Trust Wallet Mobile App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => void handleSignInBrowserWalletExtension()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>EVM Extension Check</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRawPayloadJson((v) => !v)}
                className="text-slate-600 dark:text-slate-400 hover:underline font-medium ml-auto cursor-pointer whitespace-nowrap"
              >
                {showRawPayloadJson ? 'Hide DEX Payload JSON' : 'Inspect DEX Payload JSON'}
              </button>
            </div>

            {walletActionFeedback && (
              <div className="px-3 py-2 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-medium">
                {walletActionFeedback}
              </div>
            )}

            {showRawPayloadJson && (
              <pre className="text-[11px] font-mono text-sky-300 overflow-x-auto bg-slate-950 p-3 rounded-lg border border-slate-800">
                {selectedSet.trustWalletTxPayload}
              </pre>
            )}
          </div>
        )}

        {/* 4-Column Plain-English Explanation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="font-mono font-bold text-sky-700 dark:text-sky-400">
              1. WHAT THE TOOL DID
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {selectedSet.whatItDid}
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 font-mono text-[11px] text-slate-500 space-y-0.5">
              <div>
                Set Size: {formatCoinQty(selectedSet.quantity)}
                {selectedSet.cappedBySpotWallet ? ' (1x Spot Wallet Cap)' : ''}
              </div>
              <div>Buy Entry: ${formatCoinPrice(selectedSet.buyPrice)}</div>
              <div>Safety Stop: ${formatCoinPrice(selectedSet.stopLossPrice)}</div>
              <div>Sell Exit: ${formatCoinPrice(selectedSet.sellPrice)}</div>
              <div className="text-emerald-700 dark:text-emerald-400 font-semibold">
                Balance After Set: {selectedSet.cumulativeCoinsAfter.toFixed(qtyDecimals)} {activeCoinTicker} ($
                {selectedSet.cumulativeBalanceAfter.toFixed(2)})
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              2. WHY IT CHOSE THAT BUY POINT
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedSet.whyItBought}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="font-mono font-bold text-amber-700 dark:text-amber-400">
              3. WHY IT CHOSE THAT SELL POINT
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedSet.whyItSold}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-500/30 space-y-2">
            <div className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
              4. STUDENT TAKEAWAY LESSON
            </div>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
              {selectedSet.studentLesson}
            </p>
          </div>
        </div>
      </div>

      {/* Gemini AI Masterclass Explanation Panel (When Triggered) */}
      {aiError && (
        <div className="p-3.5 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-3">
          <span>{aiError}</span>
          <button
            type="button"
            disabled={isGeneratingAi}
            onClick={() => void handleGenerateAiExplanation()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
            <span>{isGeneratingAi ? 'Loading...' : 'Retry AI Debrief'}</span>
          </button>
        </div>
      )}

      {aiExplanation && (
        <div className="rounded-xl border-2 border-amber-400 dark:border-amber-400/70 bg-amber-50/50 dark:bg-amber-950/20 p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-amber-200 dark:border-amber-500/30 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>AI MASTERCLASS DEBRIEF OF YOUR 10-SET RUN</span>
            </div>
            <button
              type="button"
              onClick={() => setAiExplanation(null)}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Close ✕
            </button>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {aiExplanation.headline}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-800 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                What the 10-Set Automation Did
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {aiExplanation.whatTheEngineDid}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-800 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                Why Trading in 10-Set Batches Works
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {aiExplanation.whyTenSetsMatter}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-800 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                Why the Controlled Stop-Losses Mattered
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {aiExplanation.stopLossLesson ||
                  'Sets #03 and #07 exited cleanly at their pre-planned -1.0R (2%) Safety Stop-Loss marks. Capping losses to pennies kept your capital intact so a single +2.0R winner immediately erased the dip and compounded the 10-set rehearsal projection upward.'}
              </p>
            </div>
          </div>

          {aiExplanation.advancedStudentTakeaways?.length > 0 && (
            <div className="pt-2 space-y-1.5 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">
                3 Key Lessons for Your Next 10 Sets:
              </div>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                {aiExplanation.advancedStudentTakeaways.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-3 border-t border-amber-200/80 dark:border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
            <p className="text-slate-700 dark:text-slate-300">
              <strong>Ready to move from rehearsal to your real XRP account?</strong> Open the 4-Step Real XRPL Bridge to check your RLUSD TrustLine, safe XRP reserve size, and live XRPL orderbook.
            </p>
            <button
              type="button"
              onClick={() => {
                if (!isWalletGateUnlocked) {
                  handleClassroomQuickUnlock();
                }
                onSelectSymbol('XRPUSDT');
                setWalletNetwork('Xaman_XRPL');
                setExecutionMode('trust_wallet_live');
                setShowRealXrpBridge(true);
                window.setTimeout(() => {
                  document
                    .getElementById('real-xrpl-execution-bridge')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 90);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Trade My Real XRP Account On-Chain</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Full 10-Set Comparison Table (Tucked cleanly by default to reduce screen clutter) */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFullLedgerTable((v) => !v)}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/70 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-between gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
        >
          <span>
            {showFullLedgerTable
              ? 'Hide Full 10-Set Comparison Table'
              : 'Show Full 10-Set Side-by-Side Comparison Table (All 10 Rows)'}
          </span>
          {showFullLedgerTable ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {showFullLedgerTable && (
          <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">Set #</th>
                  <th className="py-2.5 px-3 font-semibold">Note</th>
                  <th className="py-2.5 px-3 font-semibold">Technical Setup & Clue</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">Size ({activeCoinTicker})</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">Buy Point</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">Safety Stop</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">Sell Point</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">Result</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">
                    {isSizingFromLiveWallet ? 'Live Wallet Plan After' : 'Balance After'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {visibleSets.map((row) => {
                  const isSelected = row.setNumber === selectedSetNumber;
                  const isWin = row.outcome === 'WIN_TARGET_HIT';
                  return (
                    <tr
                      key={row.setNumber}
                      onClick={() => {
                        setSelectedSetNumber(row.setNumber);
                        if (symphonyAudioEnabled) {
                          playTradeSetSymphonyNote({
                            setNumber: row.setNumber,
                            outcome: row.outcome,
                            winOrdinalIndex: row.winOrdinalIndex,
                            rMultiple: row.rMultiple,
                          });
                        }
                      }}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-sky-50/80 dark:bg-sky-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        Set #{row.setNumber < 10 ? `0${row.setNumber}` : row.setNumber}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-amber-700 dark:text-amber-400 whitespace-nowrap">
                        {row.musicalNote.glyph} {row.musicalNote.noteName}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                        {row.patternBadge}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200 tabular-nums whitespace-nowrap">
                        {formatCoinQtyCompact(row.quantity)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-sky-600 dark:text-sky-400 tabular-nums whitespace-nowrap">
                        ${formatCoinPrice(row.buyPrice)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-rose-600 dark:text-rose-400 tabular-nums whitespace-nowrap">
                        ${formatCoinPrice(row.stopLossPrice)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                        ${formatCoinPrice(row.sellPrice)}
                      </td>
                      <td
                        className={`py-2.5 px-3 font-mono font-bold tabular-nums whitespace-nowrap ${
                          isWin
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isWin
                          ? `+${row.rMultiple}R (+$${row.pnlUsd.toFixed(2)})`
                          : `-1.0R ($${row.pnlUsd.toFixed(2)})`}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                        {row.cumulativeCoinsAfter.toFixed(qtyDecimals)} {activeCoinTicker} ($
                        {row.cumulativeBalanceAfter.toFixed(2)})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Use at Your Own Risk & Self-Custody Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>
            <strong>Use at Your Own Risk:</strong> Automated 10-Set Buy & Sell signals are for educational mastery and non-custodial self-custody execution. Never risk more than 2% per set.
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono text-sky-600 dark:text-sky-400">
          <span>Click any bar above to hear its note & inspect its lesson</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </section>
  );
};
