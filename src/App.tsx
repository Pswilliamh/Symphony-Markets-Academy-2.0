/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  KeyRound,
  Layers,
  Lock,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { AcademyCampusHub } from './components/AcademyCampusHub';
import {
  AcademyAdminConsoleModal,
  AcademyPasscodeGateCard,
  AcademyTierLevel,
} from './components/AcademyTierGateAndAdminBar';
import { CandleEducationDeck } from './components/CandleEducationDeck';
import { CandlestickChart } from './components/CandlestickChart';
import { CandlestickSymphonyComposer } from './components/CandlestickSymphonyComposer';
import { ChartScreenshotScanner } from './components/ChartScreenshotScanner';
import { CoinHistoryAndFoundersModule } from './components/CoinHistoryAndFoundersModule';
import { DayTraderSkillSuite } from './components/DayTraderSkillSuite';
import { DecentralizedAiDexDesk } from './components/DecentralizedAiDexDesk';
import { FibonacciSymphonyGeometryModule } from './components/FibonacciSymphonyGeometryModule';
import { FibonacciSymphonyMarkersStudio } from './components/FibonacciSymphonyMarkersStudio';
import { ForexEducationModule } from './components/ForexEducationModule';
import { KsbcGoldTrainingPage } from './components/KsbcGoldTrainingPage';
import { LandingPageView, PublicPageTab } from './components/LandingPageView';
import { LiveAiSignalHelper } from './components/LiveAiSignalHelper';
import { MarketCyclesEducationModule } from './components/MarketCyclesEducationModule';
import {
  ONE_BY_ONE_CHECKLIST_STORAGE_KEY,
  OneByOneChecklistState,
  OneByOneTradeChecklist,
  loadPersistedChecklistState,
} from './components/OneByOneTradeChecklist';
import { OpenMediaAndDocumentLibrary } from './components/OpenMediaAndDocumentLibrary';
import { PortfolioAndToolsSection } from './components/PortfolioAndToolsSection';
import {
  ImportedAutoTraderDexSet,
  RiskSimulatorPanel,
} from './components/RiskSimulatorPanel';
import { StartHereRoadmap } from './components/StartHereRoadmap';
import { SupportResistanceRadarCard } from './components/SupportResistanceRadarCard';
import { SymphonyCandlestickBackdrop, SymphonyHarpLogo } from './components/SymphonyHarpLogo';
import { TenSetAutoTraderLab } from './components/TenSetAutoTraderLab';
import { XrplCameraQrScanner } from './components/XrplCameraQrScanner';
import {
  AcademyAdminSettingsState,
  AcademyPublicGatesState,
  DEFAULT_ADMIN_SETTINGS_STATE,
  DEFAULT_PUBLIC_GATES_STATE,
  User,
  auth,
  fetchAcademyAdminSettingsFromFirestore,
  fetchAcademyPublicGatesFromFirestore,
  isBootstrapOwnerEmail,
  onAuthStateChanged,
  saveAcademyConfigurationToFirestore,
  signInWithGoogleForAcademyAdmin,
  signOutGoogleWalletGate,
} from './firebase';
import {
  calculateFibonacciLevels,
  enrichCandlesWithIndicators,
  fetchMarketData,
} from './services/marketData';
import {
  AssetSymbol,
  BotStrategyConfig,
  Candle,
  InstrumentType,
  MarketStats,
  PaperPosition,
  PriceAlert,
  Timeframe,
  TradeSide,
  WatchedWallet,
} from './types/market';

import {
  AcademyModuleId,
  WorkshopChapterId,
  buildStandaloneModuleUrl,
  getLessonById,
  getModuleById,
  parseStandaloneModuleFromUrl,
} from './config/academyModules';

export default function App() {
  const initialStandalone = useMemo(() => parseStandaloneModuleFromUrl(), []);
  const [standaloneModuleId, setStandaloneModuleId] = useState<AcademyModuleId | null>(
    initialStandalone.moduleId
  );
  const [viewMode, setViewMode] = useState<'landing' | 'app'>(
    initialStandalone.moduleId ? 'app' : 'landing'
  );
  const [appViewStage, setAppViewStage] = useState<'hub' | 'module'>(
    initialStandalone.moduleId ? 'module' : 'hub'
  );
  const [publicPage, setPublicPage] = useState<PublicPageTab>('welcome');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [symbol, setSymbol] = useState<AssetSymbol>('XRPUSDT');
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [activeChapterId, setActiveChapterId] = useState<WorkshopChapterId>(
    initialStandalone.lessonId ?? 'start-here'
  );
  const [copiedStandaloneLink, setCopiedStandaloneLink] = useState<boolean>(false);

  const [publicGates, setPublicGates] = useState<AcademyPublicGatesState>(
    DEFAULT_PUBLIC_GATES_STATE
  );
  const [adminSettings, setAdminSettings] = useState<AcademyAdminSettingsState>(
    DEFAULT_ADMIN_SETTINGS_STATE
  );
  const [academyUser, setAcademyUser] = useState<User | null>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [adminPreviewStudentGate, setAdminPreviewStudentGate] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminBusy, setAdminBusy] = useState<boolean>(false);
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [intermediateUnlocked, setIntermediateUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('symphony_int_unlocked') === '1';
    } catch {
      return false;
    }
  });
  const [advancedUnlocked, setAdvancedUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('symphony_adv_unlocked') === '1';
    } catch {
      return false;
    }
  });
  const [oneByOneChecklist, setOneByOneChecklist] = useState<OneByOneChecklistState>(() =>
    loadPersistedChecklistState()
  );

  useEffect(() => {
    try {
      localStorage.setItem(ONE_BY_ONE_CHECKLIST_STORAGE_KEY, JSON.stringify(oneByOneChecklist));
    } catch {
      // Ignore storage quota errors in restricted preview modes
    }
  }, [oneByOneChecklist]);

  // Market State for BTC, XRP, and XLM
  const [candlesBySymbol, setCandlesBySymbol] = useState<Record<AssetSymbol, Candle[]>>({
    BTCUSDT: [],
    XRPUSDT: [],
    XLMUSDT: [],
  });
  const [statsBySymbol, setStatsBySymbol] = useState<Record<AssetSymbol, MarketStats | null>>({
    BTCUSDT: null,
    XRPUSDT: null,
    XLMUSDT: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Chart Overlay Toggles & Candle Selection (Clean simple view by default: Candles + Green/Red Risk Box)
  const [selectedCandleIndex, setSelectedCandleIndex] = useState<number | null>(null);
  const [showFibOverlay, setShowFibOverlay] = useState<boolean>(false);
  const [showTrendBands, setShowTrendBands] = useState<boolean>(false);
  const [showRiskOverlay, setShowRiskOverlay] = useState<boolean>(true);
  const [tradeDeskSubView, setTradeDeskSubView] = useState<
    'simple_desk' | 'chart_scanner' | 'alerts_checklist'
  >('simple_desk');

  // Risk Manager Simulator Parameters ($5 1x Spot Wallet default for guided learning)
  const [accountBalance, setAccountBalance] = useState<number>(5);
  const [entryPrice, setEntryPrice] = useState<number>(2.42);
  const [stopDistancePct, setStopDistancePct] = useState<number>(2.0);
  const [riskPercent, setRiskPercent] = useState<number>(2.0);
  const [rrRatio, setRrRatio] = useState<number>(2);
  const [tradeSide, setTradeSide] = useState<TradeSide>('long');
  const [instrument, setInstrument] = useState<InstrumentType>('spot');
  const [leverage, setLeverage] = useState<number>(1);
  const [beginnerFocusMode, setBeginnerFocusMode] = useState<boolean>(true);

  // Bottom Workspace Section Tab
  const [activeBottomTab, setActiveBottomTab] = useState<
    'portfolio' | 'wallets' | 'bot_sandbox' | 'alerts'
  >('portfolio');

  // Paper Positions State
  const [positions, setPositions] = useState<PaperPosition[]>([
    {
      id: 'pos_initial_xrp',
      symbol: 'XRPUSDT',
      instrument: 'futures',
      side: 'long',
      entryPrice: 2.385,
      stopLoss: 2.3254,
      takeProfit: 2.5042,
      quantity: 3355.7,
      notionalUsd: 8003.34,
      marginRequiredUsd: 1600.67,
      leverage: 5,
      liquidationPrice: 1.9462,
      riskAmountUsd: 200.0,
      riskPercent: 2.0,
      rewardAmountUsd: 400.0,
      rrRatio: 2,
      openedAt: '08:30 AM',
      status: 'open',
    },
    {
      id: 'pos_initial_xlm',
      symbol: 'XLMUSDT',
      instrument: 'spot',
      side: 'long',
      entryPrice: 0.402,
      stopLoss: 0.3919,
      takeProfit: 0.4222,
      quantity: 19801.98,
      notionalUsd: 7960.39,
      marginRequiredUsd: 7960.39,
      leverage: 1,
      liquidationPrice: null,
      riskAmountUsd: 200.0,
      riskPercent: 2.0,
      rewardAmountUsd: 400.0,
      rrRatio: 2,
      openedAt: 'Yesterday',
      status: 'closed',
      exitPrice: 0.4215,
      realizedPnlUsd: 386.14,
      closeReason: '1:2 Target Hit',
    },
  ]);

  // Read-Only Public Wallets State (Starts empty so only the user's own wallet addresses appear)
  const [watchedWallets, setWatchedWallets] = useState<WatchedWallet[]>([]);

  // Strategy Bot Sandbox State
  const [botStrategies, setBotStrategies] = useState<BotStrategyConfig[]>([
    {
      id: 'bot_fib_xrp',
      name: 'XRP Fibonacci 61.8% Pullback + 2% Risk Sizing',
      symbol: 'XRPUSDT',
      active: true,
      entryTrigger: 'fib_618_pullback',
      riskPerTradePct: 2.0,
      rrTarget: 2,
      leverage: 3,
      exchangeSandbox: 'Binance Paper API',
      twoFactorVerified: true,
      simulatedTradesCount: 18,
      winRatePct: 61.1,
      netPnlUsd: 840.5,
    },
    {
      id: 'bot_ema_xlm',
      name: 'XLM EMA 20/50 Trend + Bullish Engulfing Filter',
      symbol: 'XLMUSDT',
      active: true,
      entryTrigger: 'bullish_engulfing_reversal',
      riskPerTradePct: 2.0,
      rrTarget: 2,
      leverage: 2,
      exchangeSandbox: 'Stellar SDEX Sandbox',
      twoFactorVerified: true,
      simulatedTradesCount: 14,
      winRatePct: 57.1,
      netPnlUsd: 520.2,
    },
  ]);

  // Price Alerts State
  const [alerts, setAlerts] = useState<PriceAlert[]>([
    {
      id: 'al_1',
      symbol: 'XRPUSDT',
      condition: 'above',
      targetPrice: 2.52,
      note: 'XRP upper swing resistance test',
      triggered: false,
    },
    {
      id: 'al_2',
      symbol: 'XLMUSDT',
      condition: 'below',
      targetPrice: 0.398,
      note: 'XLM Fibonacci 61.8% retracement support zone',
      triggered: false,
    },
  ]);

  const [alertBanner, setAlertBanner] = useState<string | null>(null);
  const [embeddedXrplAddress, setEmbeddedXrplAddress] = useState<string>(() => {
    try {
      const saved = (localStorage.getItem('symphony_user_xaman_address_v1') || '').trim();
      // Never pre-fill legacy Binance public demo address
      if (!saved || saved === 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh') return '';
      return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(saved) ? saved : '';
    } catch {
      return '';
    }
  });
  const [topWalletDraft, setTopWalletDraft] = useState<string>(embeddedXrplAddress);
  const [showTopWalletSyncDrawer, setShowTopWalletSyncDrawer] = useState<boolean>(false);
  const [showTopWalletCameraScanner, setShowTopWalletCameraScanner] = useState<boolean>(false);
  const [importedXrplDexSet, setImportedXrplDexSet] =
    useState<ImportedAutoTraderDexSet | null>(null);

  const handleSaveUserXrplAddress = (nextAddr: string) => {
    const clean = nextAddr.trim();
    const safeAddr = clean === 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh' ? '' : clean;
    setEmbeddedXrplAddress(safeAddr);
    setTopWalletDraft(safeAddr);
    try {
      if (safeAddr) {
        localStorage.setItem('symphony_user_xaman_address_v1', safeAddr);
      } else {
        localStorage.removeItem('symphony_user_xaman_address_v1');
      }
    } catch {
      // Ignore storage errors
    }
  };

  // Sync Dark Mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Load Public SHA-256 Passcode Gates & Orientation Video Metadata on Boot
  useEffect(() => {
    let active = true;
    fetchAcademyPublicGatesFromFirestore()
      .then((gates) => {
        if (active) setPublicGates(gates);
      })
      .catch(() => {
        // Fallback to built-in SHA-256 defaults if offline
      });
    return () => {
      active = false;
    };
  }, []);

  // Sync Firebase Google Auth Session (Supports Both Primary Owner & Separate Admin Google Login)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setAcademyUser(u);
      if (!u || !u.emailVerified) {
        setIsAdminUser(false);
        return;
      }
      if (isBootstrapOwnerEmail(u.email)) {
        setIsAdminUser(true);
        try {
          const settings = await fetchAcademyAdminSettingsFromFirestore();
          setAdminSettings(settings);
        } catch {
          // Settings doc may not have been initialized yet
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleUnlockIntermediate = () => {
    setIntermediateUnlocked(true);
    try {
      sessionStorage.setItem('symphony_int_unlocked', '1');
    } catch {
      // Ignore storage restriction
    }
  };

  const handleUnlockAdvanced = () => {
    setAdvancedUnlocked(true);
    try {
      sessionStorage.setItem('symphony_adv_unlocked', '1');
    } catch {
      // Ignore storage restriction
    }
  };

  const handleLockStudentSessionGates = () => {
    setIntermediateUnlocked(false);
    setAdvancedUnlocked(false);
    try {
      sessionStorage.removeItem('symphony_int_unlocked');
      sessionStorage.removeItem('symphony_adv_unlocked');
    } catch {
      // Ignore storage restriction
    }
  };

  const handleGoogleAdminSignIn = async () => {
    setAdminBusy(true);
    setAdminAuthError(null);
    try {
      const signedUser = await signInWithGoogleForAcademyAdmin();
      setAcademyUser(signedUser);
      if (!signedUser.emailVerified) {
        setIsAdminUser(false);
        setAdminAuthError('Please use a Google account with a verified email address.');
        return;
      }

      if (isBootstrapOwnerEmail(signedUser.email)) {
        setIsAdminUser(true);
        setAdminPreviewStudentGate(false);
        const settings = await fetchAcademyAdminSettingsFromFirestore();
        setAdminSettings(settings);
        setAlertBanner(
          `Admin Access Active (${signedUser.email}): All Beginner, Intermediate & Advanced sections unlocked.`
        );
        return;
      }

      try {
        const settings = await fetchAcademyAdminSettingsFromFirestore();
        if (
          settings.secondaryAdminEmail &&
          signedUser.email &&
          settings.secondaryAdminEmail.toLowerCase() === signedUser.email.toLowerCase()
        ) {
          setIsAdminUser(true);
          setAdminPreviewStudentGate(false);
          setAdminSettings(settings);
          setAlertBanner(
            `Separate Admin Google Login Verified (${signedUser.email}): All curriculum tiers unlocked.`
          );
        } else {
          setIsAdminUser(false);
        }
      } catch {
        setIsAdminUser(false);
        setAdminAuthError(
          `Signed in as ${signedUser.email}, which is not yet registered as a Separate Admin Google Login. Sign in once with PsWilliamh@gmail.com to add this email in Admin Settings.`
        );
      }
    } catch (err: unknown) {
      setAdminAuthError(
        err instanceof Error ? err.message : 'Google Sign-In was cancelled or blocked by browser.'
      );
    } finally {
      setAdminBusy(false);
    }
  };

  const handleGoogleAdminSignOut = async () => {
    setAdminBusy(true);
    setAdminAuthError(null);
    try {
      await signOutGoogleWalletGate(academyUser?.uid);
      setAcademyUser(null);
      setIsAdminUser(false);
      setAdminPreviewStudentGate(false);
    } finally {
      setAdminBusy(false);
    }
  };

  const handleSaveAdminConfiguration = async (draft: {
    intermediatePasscodePlain: string;
    advancedPasscodePlain: string;
    intermediateGateEnabled: boolean;
    advancedGateEnabled: boolean;
    orientationVideoUrl: string;
    orientationVideoTitle: string;
    secondaryAdminEmail: string;
  }) => {
    if (!academyUser) return;
    setAdminBusy(true);
    setAdminAuthError(null);
    try {
      const saved = await saveAcademyConfigurationToFirestore({
        user: academyUser,
        ...draft,
      });
      setPublicGates(saved.publicGates);
      setAdminSettings(saved.adminSettings);
      setAlertBanner(
        'Saved Intermediate & Advanced passcodes, Separate Admin Google Login, and Orientation Video settings.'
      );
    } catch (err: unknown) {
      setAdminAuthError(
        err instanceof Error ? err.message : 'Unable to save Admin configuration right now.'
      );
    } finally {
      setAdminBusy(false);
    }
  };

  const isTierLocked = (tier: AcademyTierLevel): boolean => {
    if (tier === 'beginner' || tier === 'open_library') return false;
    if (isAdminUser && !adminPreviewStudentGate) return false;
    if (tier === 'intermediate') {
      return publicGates.intermediateGateEnabled && !intermediateUnlocked;
    }
    if (tier === 'advanced') {
      return publicGates.advancedGateEnabled && !advancedUnlocked;
    }
    return false;
  };

  // Fetch initial market data for BTCUSDT, XRPUSDT, and XLMUSDT
  useEffect(() => {
    let cancelled = false;
    async function loadAllCoins() {
      setIsLoading(true);
      const [btcData, xrpData, xlmData] = await Promise.all([
        fetchMarketData('BTCUSDT', timeframe),
        fetchMarketData('XRPUSDT', timeframe),
        fetchMarketData('XLMUSDT', timeframe),
      ]);
      if (cancelled) return;

      setCandlesBySymbol({
        BTCUSDT: btcData.candles,
        XRPUSDT: xrpData.candles,
        XLMUSDT: xlmData.candles,
      });
      setStatsBySymbol({
        BTCUSDT: btcData.stats,
        XRPUSDT: xrpData.stats,
        XLMUSDT: xlmData.stats,
      });

      const currentPrice =
        symbol === 'BTCUSDT'
          ? btcData.stats.lastPrice
          : symbol === 'XRPUSDT'
          ? xrpData.stats.lastPrice
          : xlmData.stats.lastPrice;
      const dec = symbol === 'BTCUSDT' ? 2 : 4;
      setEntryPrice(Number(currentPrice.toFixed(dec)));
      const activeList =
        symbol === 'BTCUSDT'
          ? btcData.candles
          : symbol === 'XRPUSDT'
          ? xrpData.candles
          : xlmData.candles;
      setSelectedCandleIndex(activeList.length - 1);
      setIsLoading(false);
    }
    loadAllCoins();
    return () => {
      cancelled = true;
    };
  }, [timeframe]);

  // Live Real-Time Tick Stream Simulation / Polling Updater
  useEffect(() => {
    const interval = setInterval(() => {
      setCandlesBySymbol((prev) => {
        const next: Record<AssetSymbol, Candle[]> = { ...prev };
        (['BTCUSDT', 'XRPUSDT', 'XLMUSDT'] as AssetSymbol[]).forEach((sym) => {
          const list = prev[sym];
          if (!list || list.length === 0) return;
          const dec = sym === 'BTCUSDT' ? 2 : 4;
          const updated = [...list];
          const last = { ...updated[updated.length - 1] };
          const microDelta = (Math.random() - 0.492) * last.close * 0.0018;
          const newClose = Number(Math.max(0.01, last.close + microDelta).toFixed(dec));
          last.close = newClose;
          last.high = Number(Math.max(last.high, newClose).toFixed(dec));
          last.low = Number(Math.min(last.low, newClose).toFixed(dec));
          last.volume = Math.round(
            last.volume + Math.random() * (sym === 'BTCUSDT' ? 18 : 18000)
          );
          updated[updated.length - 1] = last;
          next[sym] = enrichCandlesWithIndicators(updated);
        });
        return next;
      });

      setStatsBySymbol((prevStats) => {
        const nextStats = { ...prevStats };
        (['BTCUSDT', 'XRPUSDT', 'XLMUSDT'] as AssetSymbol[]).forEach((sym) => {
          const st = prevStats[sym];
          const list = candlesBySymbol[sym];
          if (!st || !list || list.length === 0) return;
          const latestClose = list[list.length - 1].close;
          nextStats[sym] = {
            ...st,
            lastPrice: latestClose,
            high24h: Math.max(st.high24h, latestClose),
            low24h: Math.min(st.low24h, latestClose),
          };
        });
        return nextStats;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [candlesBySymbol]);

  // Check Threshold Alerts against Live Prices
  useEffect(() => {
    const btcNow = statsBySymbol.BTCUSDT?.lastPrice;
    const xrpNow = statsBySymbol.XRPUSDT?.lastPrice;
    const xlmNow = statsBySymbol.XLMUSDT?.lastPrice;
    if (!xrpNow || !xlmNow) return;

    setAlerts((prev) =>
      prev.map((al) => {
        if (al.triggered) return al;
        const price =
          al.symbol === 'BTCUSDT'
            ? btcNow ?? 91450
            : al.symbol === 'XRPUSDT'
            ? xrpNow
            : xlmNow;
        const hit =
          (al.condition === 'above' && price >= al.targetPrice) ||
          (al.condition === 'below' && price <= al.targetPrice);
        if (hit) {
          const timeStr = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          const dec = al.symbol === 'BTCUSDT' ? 2 : 4;
          setAlertBanner(
            `Alert Triggered: ${al.symbol} crossed ${al.condition} $${al.targetPrice.toFixed(
              dec
            )} (${al.note})`
          );
          return { ...al, triggered: true, triggeredAt: timeStr };
        }
        return al;
      })
    );
  }, [
    statsBySymbol.BTCUSDT?.lastPrice,
    statsBySymbol.XRPUSDT?.lastPrice,
    statsBySymbol.XLMUSDT?.lastPrice,
  ]);

  const activeCandles = candlesBySymbol[symbol] || [];
  const activeStats = statsBySymbol[symbol];
  const livePrice =
    activeCandles.length > 0
      ? activeCandles[activeCandles.length - 1].close
      : activeStats?.lastPrice ||
        (symbol === 'BTCUSDT' ? 91450 : symbol === 'XRPUSDT' ? 2.42 : 0.415);

  const fibLevels = useMemo(() => calculateFibonacciLevels(activeCandles), [activeCandles]);

  const stopDistRatio = Math.max(0.002, stopDistancePct / 100);
  const currentStopLoss =
    tradeSide === 'long' ? entryPrice * (1 - stopDistRatio) : entryPrice * (1 + stopDistRatio);
  const currentTakeProfit =
    tradeSide === 'long'
      ? entryPrice * (1 + stopDistRatio * rrRatio)
      : entryPrice * (1 - stopDistRatio * rrRatio);

  const handleSelectSymbol = (newSym: AssetSymbol) => {
    setSymbol(newSym);
    const list = candlesBySymbol[newSym];
    const dec = newSym === 'BTCUSDT' ? 2 : 4;
    if (list && list.length > 0) {
      const latest = list[list.length - 1].close;
      setEntryPrice(Number(latest.toFixed(dec)));
      setSelectedCandleIndex(list.length - 1);
    } else {
      const fallback = newSym === 'BTCUSDT' ? 91450 : newSym === 'XRPUSDT' ? 2.42 : 0.415;
      setEntryPrice(Number(fallback.toFixed(dec)));
    }
  };

  const handleOpenPaperPosition = (
    newPos: Omit<PaperPosition, 'id' | 'openedAt' | 'status'>
  ) => {
    const created: PaperPosition = {
      ...newPos,
      id: `pos_${Date.now()}`,
      openedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'open',
    };
    setPositions((prev) => [created, ...prev]);
    setActiveBottomTab('portfolio');
    const coinLabel =
      created.symbol === 'BTCUSDT' ? 'BTC' : created.symbol === 'XRPUSDT' ? 'XRP' : 'XLM';
    const priceDec = created.symbol === 'BTCUSDT' ? 2 : 4;
    const qtyStr =
      created.symbol === 'BTCUSDT'
        ? created.quantity.toFixed(6)
        : created.quantity.toLocaleString();
    setAlertBanner(
      `Logged Simulated ${created.side.toUpperCase()} Position: ${qtyStr} ${coinLabel} at $${created.entryPrice.toFixed(
        priceDec
      )} (2% Risk Cap)`
    );
  };

  const handleClosePosition = (id: string, exitPrice: number) => {
    setPositions((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const diff = p.side === 'long' ? exitPrice - p.entryPrice : p.entryPrice - exitPrice;
        const realizedPnlUsd = Number((diff * p.quantity).toFixed(2));
        return {
          ...p,
          status: 'closed',
          exitPrice,
          realizedPnlUsd,
          closeReason: 'Market Close',
        };
      })
    );
  };

  const handleToggleBot = (id: string) => {
    setBotStrategies((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b))
    );
  };

  const handleRunBotBacktest = (id: string) => {
    setBotStrategies((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const deltaTrades = 3;
        const addedPnl = Number(((Math.random() * 1.4 - 0.25) * 180).toFixed(2));
        return {
          ...b,
          simulatedTradesCount: b.simulatedTradesCount + deltaTrades,
          netPnlUsd: Number((b.netPnlUsd + addedPnl).toFixed(2)),
          winRatePct: Math.min(78, Math.max(48, b.winRatePct + (addedPnl >= 0 ? 1.2 : -1.1))),
        };
      })
    );
    setAlertBanner('Completed 10-bar historical candle simulation with 2% position sizing.');
  };

  const btcLive =
    candlesBySymbol.BTCUSDT.length > 0
      ? candlesBySymbol.BTCUSDT[candlesBySymbol.BTCUSDT.length - 1].close
      : statsBySymbol.BTCUSDT?.lastPrice ?? 91450;
  const xrpLive =
    candlesBySymbol.XRPUSDT.length > 0
      ? candlesBySymbol.XRPUSDT[candlesBySymbol.XRPUSDT.length - 1].close
      : statsBySymbol.XRPUSDT?.lastPrice ?? 2.42;
  const xlmLive =
    candlesBySymbol.XLMUSDT.length > 0
      ? candlesBySymbol.XLMUSDT[candlesBySymbol.XLMUSDT.length - 1].close
      : statsBySymbol.XLMUSDT?.lastPrice ?? 0.415;

  // Keep browser Back/Forward synced with ?module=... standalone direct links
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseStandaloneModuleFromUrl();
      if (parsed.moduleId) {
        setStandaloneModuleId(parsed.moduleId);
        setViewMode('app');
        setAppViewStage('module');
        if (parsed.lessonId) {
          setActiveChapterId(parsed.lessonId);
        }
      } else {
        setStandaloneModuleId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const clearStandaloneQueryParam = () => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('module') || url.searchParams.has('lesson')) {
        url.searchParams.delete('module');
        url.searchParams.delete('lesson');
        window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
      }
    } catch {
      // Ignore history API restrictions
    }
  };

  const navigatePublicPage = (page: PublicPageTab) => {
    clearStandaloneQueryParam();
    setStandaloneModuleId(null);
    setPublicPage(page);
    setViewMode('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openCampusHub = () => {
    clearStandaloneQueryParam();
    setStandaloneModuleId(null);
    setViewMode('app');
    setAppViewStage('hub');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openModuleInCampus = (moduleId: AcademyModuleId, lessonId?: WorkshopChapterId) => {
    const mod = getModuleById(moduleId);
    const targetLesson =
      lessonId && mod.lessons.some((l) => l.id === lessonId) ? lessonId : mod.lessons[0].id;
    clearStandaloneQueryParam();
    setStandaloneModuleId(null);
    setActiveChapterId(targetLesson);
    setViewMode('app');
    setAppViewStage('module');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openStandaloneModule = (moduleId: AcademyModuleId, lessonId?: WorkshopChapterId) => {
    const mod = getModuleById(moduleId);
    const targetLesson =
      lessonId && mod.lessons.some((l) => l.id === lessonId) ? lessonId : mod.lessons[0].id;
    try {
      const nextUrl = buildStandaloneModuleUrl(
        moduleId,
        targetLesson !== mod.lessons[0].id ? targetLesson : undefined
      );
      window.history.pushState({}, '', nextUrl);
    } catch {
      // Ignore history API restrictions
    }
    setStandaloneModuleId(moduleId);
    setActiveChapterId(targetLesson);
    setViewMode('app');
    setAppViewStage('module');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToChapter = (targetSectionId?: string) => {
    if (!targetSectionId) {
      openCampusHub();
      return;
    }
    const lesson = getLessonById(targetSectionId);
    setActiveChapterId(lesson.id);
    setViewMode('app');
    setAppViewStage('module');
    if (standaloneModuleId) {
      if (lesson.moduleId !== standaloneModuleId) {
        openStandaloneModule(lesson.moduleId, lesson.id);
        return;
      }
      try {
        const mod = getModuleById(standaloneModuleId);
        const nextUrl = buildStandaloneModuleUrl(
          standaloneModuleId,
          lesson.id !== mod.lessons[0].id ? lesson.id : undefined
        );
        window.history.replaceState({}, '', nextUrl);
      } catch {
        // Ignore history restrictions
      }
    }
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 30);
  };

  const handleEnterApp = (targetSectionId?: string) => {
    if (!targetSectionId) {
      openCampusHub();
      return;
    }
    navigateToChapter(targetSectionId);
  };

  const activeLesson = useMemo(() => getLessonById(activeChapterId), [activeChapterId]);
  const activeModule = useMemo(
    () => getModuleById(standaloneModuleId ?? activeLesson.moduleId),
    [standaloneModuleId, activeLesson.moduleId]
  );

  // Sync browser tab title when in standalone single-module mode
  useEffect(() => {
    if (standaloneModuleId) {
      document.title = `${activeModule.standaloneBrandTitle} · Symphony Markets Academy`;
    } else {
      document.title = 'Symphony Markets Academy — Self-Custody Market Education';
    }
  }, [standaloneModuleId, activeModule.standaloneBrandTitle]);

  const activeLessonIdxInModule = useMemo(() => {
    const idx = activeModule.lessons.findIndex((l) => l.id === activeLesson.id);
    return idx >= 0 ? idx : 0;
  }, [activeModule.lessons, activeLesson.id]);

  const prevLessonInModule =
    activeLessonIdxInModule > 0 ? activeModule.lessons[activeLessonIdxInModule - 1] : null;
  const nextLessonInModule =
    activeLessonIdxInModule < activeModule.lessons.length - 1
      ? activeModule.lessons[activeLessonIdxInModule + 1]
      : null;

  const activeModuleLocked = isTierLocked(activeModule.requiredTier);
  const isStandaloneMode = standaloneModuleId !== null;
  const isSingleStageWelcome = !isStandaloneMode && viewMode === 'landing' && publicPage === 'welcome';

  const handleCopyActiveModuleLink = () => {
    const shareUrl = buildStandaloneModuleUrl(activeModule.id);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      void navigator.clipboard.writeText(shareUrl);
    }
    setCopiedStandaloneLink(true);
    setTimeout(() => setCopiedStandaloneLink(false), 2600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* ====================================================================
       * HEADER MODE A: TRUE STANDALONE SINGLE-MODULE APP HEADER (?module=...)
       * ==================================================================== */}
      {isStandaloneMode ? (
        <>
          <header className="flex items-center justify-between gap-4 xl:gap-8 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {/* Zone 1: Clean Standalone Module Title */}
            <div className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
              <SymphonyHarpLogo variant="emblem" className="w-8 h-8" />
              <span className="font-editorial text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {activeModule.standaloneBrandTitle}
              </span>
            </div>

            {/* Zone 2: Only This Module's Lesson/Tool Tabs */}
            <nav
              aria-label={`${activeModule.standaloneBrandTitle} Navigation`}
              className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600 dark:text-slate-400"
            >
              {activeModule.lessons.map((lesson) => {
                const isCurrent = lesson.id === activeLesson.id;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => openStandaloneModule(activeModule.id, lesson.id)}
                    className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isCurrent
                        ? 'text-emerald-700 dark:text-emerald-400 font-semibold underline underline-offset-8 decoration-2'
                        : 'hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {lesson.tabLabel}
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Quick Wallet Sync (Trade Desk) + Primary Action */}
            <div className="flex items-center gap-2 shrink-0">
              {activeModule.id === 'trade-desk' && (
                <button
                  type="button"
                  onClick={() => setShowTopWalletSyncDrawer((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    embeddedXrplAddress
                      ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                      : 'border-sky-500/60 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-mono">
                    {embeddedXrplAddress
                      ? `${embeddedXrplAddress.slice(0, 6)}...${embeddedXrplAddress.slice(-4)}`
                      : 'Sync Xaman Wallet'}
                  </span>
                </button>
              )}
              {activeModuleLocked || isAdminUser ? (
                <button
                  type="button"
                  onClick={() => setShowAdminModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 shrink-0" />
                  <span>{isAdminUser ? 'Admin Console' : 'Unlock Passcode'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCopyActiveModuleLink}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedStandaloneLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 shrink-0" />
                      <span>Copy Module Link</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </header>

          {/* Mobile & Tablet Standalone Tabs (Only This Module's Tabs) */}
          {activeModule.lessons.length > 1 && (
            <nav className="lg:hidden flex items-center gap-4 overflow-x-auto px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-400">
              {activeModule.lessons.map((lesson) => {
                const isCurrent = lesson.id === activeLesson.id;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => openStandaloneModule(activeModule.id, lesson.id)}
                    className={`whitespace-nowrap shrink-0 cursor-pointer ${
                      isCurrent ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : ''
                    }`}
                  >
                    {lesson.tabLabel}
                  </button>
                );
              })}
            </nav>
          )}
        </>
      ) : (
        /* ====================================================================
         * HEADER MODE B: STANDARD SYMPHONY MARKETS ACADEMY HEADER
         * ==================================================================== */
        <>
          <header className="flex items-center justify-between gap-4 xl:gap-8 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {/* Zone 1: Brand Emblem + Wordmark */}
            <a
              href="#welcome"
              onClick={(e) => {
                e.preventDefault();
                navigatePublicPage('welcome');
              }}
              className="relative overflow-hidden inline-flex items-center gap-2.5 font-editorial text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white pl-2 pr-3.5 py-1 rounded-xl bg-gradient-to-r from-amber-200/80 via-sky-100/95 to-amber-100/80 dark:from-sky-500/25 dark:via-amber-400/20 dark:to-sky-500/20 border border-amber-300/60 dark:border-sky-400/30 whitespace-nowrap shrink-0"
            >
              <SymphonyCandlestickBackdrop className="opacity-25 dark:opacity-35" />
              <SymphonyHarpLogo variant="emblem" className="relative z-10 w-8 h-8 sm:w-9 sm:h-9" />
              <span className="relative z-10">Symphony Markets Academy</span>
            </a>

            {/* Zone 2: 5 Concise Single-Line Links */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
              <button
                type="button"
                onClick={() => navigatePublicPage('symphony')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'landing' && publicPage === 'symphony'
                    ? 'text-amber-600 dark:text-amber-400 font-semibold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ♪ Symphony
              </button>
              <button
                type="button"
                onClick={() => navigatePublicPage('cycles')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'landing' && publicPage === 'cycles'
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Market Cycles
              </button>
              <button
                type="button"
                onClick={() => navigatePublicPage('ksbc')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'landing' && publicPage === 'ksbc'
                    ? 'text-amber-700 dark:text-amber-400 font-semibold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                KSBC Gold
              </button>
              <button
                type="button"
                onClick={() => navigatePublicPage('guide')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'landing' && publicPage === 'guide'
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Open Library
              </button>
              <button
                type="button"
                onClick={() => navigatePublicPage('story')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'landing' && publicPage === 'story'
                    ? 'text-sky-600 dark:text-sky-400 font-semibold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Our Story
              </button>
            </nav>

            {/* Zone 3: 1 Primary Action */}
            <div className="flex items-center gap-3 shrink-0">
              {viewMode === 'landing' ? (
                <button
                  type="button"
                  onClick={() => openCampusHub()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Academy Campus
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setDarkMode((d) => !d)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {darkMode ? 'Light UI' : 'Dark UI'}
                </button>
              )}
            </div>
          </header>

          {/* Mobile & Tablet Compact Page Switcher */}
          <nav className="lg:hidden flex items-center gap-4 overflow-x-auto px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-400">
            <button
              type="button"
              onClick={() => navigatePublicPage('welcome')}
              className={`whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'landing' && publicPage === 'welcome'
                  ? 'text-sky-600 dark:text-sky-400 font-semibold'
                  : ''
              }`}
            >
              Welcome
            </button>
            <button
              type="button"
              onClick={() => navigatePublicPage('symphony')}
              className={`whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'landing' && publicPage === 'symphony'
                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                  : ''
              }`}
            >
              ♪ Symphony
            </button>
            <button
              type="button"
              onClick={() => navigatePublicPage('cycles')}
              className={`whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'landing' && publicPage === 'cycles'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : ''
              }`}
            >
              Market Cycles
            </button>
            <button
              type="button"
              onClick={() => navigatePublicPage('ksbc')}
              className={`whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'landing' && publicPage === 'ksbc'
                  ? 'text-amber-700 dark:text-amber-400 font-semibold'
                  : ''
              }`}
            >
              KSBC Gold
            </button>
            <button
              type="button"
              onClick={() => navigatePublicPage('guide')}
              className={`whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'landing' && publicPage === 'guide'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : ''
              }`}
            >
              Open Library
            </button>
            <button
              type="button"
              onClick={() => navigatePublicPage('story')}
              className={`whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'landing' && publicPage === 'story'
                  ? 'text-sky-600 dark:text-sky-400 font-semibold'
                  : ''
              }`}
            >
              Our Story
            </button>
            <button
              type="button"
              onClick={() => openCampusHub()}
              className={`whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'app' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''
              }`}
            >
              Academy Campus
            </button>
          </nav>
        </>
      )}

      {/* Alert Notification Toast Bar */}
      {alertBanner && viewMode === 'app' && (
        <div className="bg-sky-500/10 border-b border-sky-500/30 px-6 py-2.5 flex items-center justify-between gap-4 text-xs">
          <span className="font-medium text-sky-700 dark:text-sky-300">{alertBanner}</span>
          <button
            type="button"
            onClick={() => setAlertBanner(null)}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium whitespace-nowrap shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {viewMode === 'landing' && !isStandaloneMode ? (
        <main className="flex-1 flex flex-col">
          <LandingPageView
            activePage={publicPage}
            onNavigatePage={navigatePublicPage}
            onEnterApp={handleEnterApp}
            btcLivePrice={btcLive}
            xrpLivePrice={xrpLive}
            xlmLivePrice={xlmLive}
            symbol={symbol}
            onSelectSymbol={handleSelectSymbol}
            candles={activeCandles}
          />
        </main>
      ) : (
        /* Main Training Workspace Container (1440px max-w) */
        <main id="workspace" className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
          {!isStandaloneMode && appViewStage === 'hub' ? (
            <AcademyCampusHub
              isTierLocked={isTierLocked}
              isAdminUser={isAdminUser}
              adminPreviewStudentGate={adminPreviewStudentGate}
              onToggleAdminPreviewStudentGate={() => setAdminPreviewStudentGate((p) => !p)}
              onOpenAdminModal={() => setShowAdminModal(true)}
              onOpenModule={openModuleInCampus}
              onOpenStandaloneModule={openStandaloneModule}
            />
          ) : (
            <>
              {/* Slim Single-Module Navigation Bar (Shown Only Inside Campus Mode; Hidden in Standalone Mode Since Standalone Header Already Has the Tabs!) */}
              {!isStandaloneMode && (
                <nav
                  aria-label={`${activeModule.title} Navigation`}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                >
                  <div className="flex flex-wrap items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => openCampusHub()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                      <span>All Modules</span>
                    </button>

                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      <span className={`font-mono mr-1.5 ${activeModule.accentTextClass}`}>
                        {activeModule.numberLabel}
                      </span>
                      <span>{activeModule.title}</span>
                    </div>
                  </div>

                  {/* Only This Module's Tabs */}
                  {activeModule.lessons.length > 1 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {activeModule.lessons.map((lesson) => {
                        const isCurrent = lesson.id === activeLesson.id;
                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => openModuleInCampus(activeModule.id, lesson.id)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              isCurrent
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {activeModuleLocked && <Lock className="w-3 h-3 opacity-80 shrink-0" />}
                            <span>{lesson.tabLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Shareable Standalone Link + Standalone View Toggle */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openStandaloneModule(activeModule.id, activeLesson.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span>Standalone View</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyActiveModuleLink}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {copiedStandaloneLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            Copied
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 shrink-0" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    {(activeModuleLocked || isAdminUser) && (
                      <button
                        type="button"
                        onClick={() => setShowAdminModal(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 shrink-0" />
                        <span>{isAdminUser ? 'Admin' : 'Unlock'}</span>
                      </button>
                    )}
                  </div>
                </nav>
              )}

              {/* PASSCODE GATE: Shown Cleanly If This Module Requires Intermediate or Advanced Passcode */}
              {activeModuleLocked &&
                (activeModule.requiredTier === 'intermediate' ||
                  activeModule.requiredTier === 'advanced') && (
                  <AcademyPasscodeGateCard
                    requiredTier={activeModule.requiredTier}
                    chapterNumber={activeModule.numberLabel}
                    chapterTitle={activeModule.title}
                    chaptersInTier={activeModule.lessons.map((l) => ({
                      number: l.stepNumber,
                      fullTitle: l.fullTitle,
                    }))}
                    publicGates={publicGates}
                    onUnlockIntermediate={handleUnlockIntermediate}
                    onUnlockAdvanced={handleUnlockAdvanced}
                    onOpenBeginnerStart={() =>
                      isStandaloneMode
                        ? openStandaloneModule('foundations')
                        : openModuleInCampus('foundations')
                    }
                    onOpenPublicLibrary={() =>
                      isStandaloneMode
                        ? openStandaloneModule('library')
                        : openModuleInCampus('library')
                    }
                    onOpenAdminModal={() => setShowAdminModal(true)}
                    isAdminUser={isAdminUser}
                    adminPreviewStudentGate={adminPreviewStudentGate}
                    onExitStudentPreview={() => setAdminPreviewStudentGate(false)}
                  />
                )}

              {/* ====================================================================
               * ACTIVE MODULE LESSON CONTENT (ONLY 1 FOCUSED LESSON AT A TIME)
               * ==================================================================== */}
              {!activeModuleLocked && (
                <>
                  {activeLesson.id === 'start-here' && (
                    <section id="start-here">
                      <StartHereRoadmap
                symbol={symbol}
                onSelectSymbol={handleSelectSymbol}
                candles={activeCandles}
                fibLevels={fibLevels}
                livePrice={livePrice}
                accountBalance={accountBalance}
                entryPrice={entryPrice}
                stopLoss={currentStopLoss}
                takeProfit={currentTakeProfit}
                riskPercent={riskPercent}
                rrRatio={rrRatio}
                instrument={instrument}
                leverage={leverage}
                tradeSide={tradeSide}
                onActivateFiveDollarPreset={() => {
                  setAccountBalance(5);
                  setInstrument('spot');
                  setLeverage(1);
                  setRiskPercent(2.0);
                  setStopDistancePct(2.0);
                  setRrRatio(2);
                  setTradeSide('long');
                  setEntryPrice(Number(livePrice.toFixed(symbol === 'BTCUSDT' ? 2 : 4)));
                  setAlertBanner(
                    'Activated $5 Real-Wallet Learning Preset: $5.00 Budget · 1x Spot (Zero Leverage) · 10-Cent Safety Exit'
                  );
                }}
                onJumpToWalletWatch={() => {
                  setActiveBottomTab('wallets');
                  navigateToChapter('portfolio-ledger');
                }}
                beginnerFocusMode={beginnerFocusMode}
                onToggleBeginnerFocusMode={() => navigateToChapter('skill-desk')}
              />
            </section>
          )}

          {activeLesson.id === 'coin-history' && (
            <section id="coin-history">
              <CoinHistoryAndFoundersModule
                btcLivePrice={btcLive}
                xrpLivePrice={xrpLive}
                xlmLivePrice={xlmLive}
                onSelectSymbolAndTrain={(sym, targetId) => {
                  handleSelectSymbol(sym);
                  navigateToChapter(targetId || 'ten-set-auto-trader');
                }}
                onOpenKsbcGoldLedger={() =>
                  isStandaloneMode
                    ? openStandaloneModule('ksbc')
                    : openModuleInCampus('ksbc')
                }
              />
            </section>
          )}

          {activeLesson.id === 'cycle-bull-vs-bear' && (
            <section id="cycle-bull-vs-bear">
              <MarketCyclesEducationModule
                symbol={symbol}
                onSelectSymbol={handleSelectSymbol}
                candles={activeCandles}
                btcLivePrice={btcLive}
                xrpLivePrice={xrpLive}
                xlmLivePrice={xlmLive}
                onEnterApp={handleEnterApp}
                onlyPart="bull_vs_bear"
                sectionNumberOverride="03"
              />
            </section>
          )}

          {activeLesson.id === 'cycle-four-seasons' && (
            <section id="cycle-four-seasons">
              <MarketCyclesEducationModule
                symbol={symbol}
                onSelectSymbol={handleSelectSymbol}
                candles={activeCandles}
                btcLivePrice={btcLive}
                xrpLivePrice={xrpLive}
                xlmLivePrice={xlmLive}
                onEnterApp={handleEnterApp}
                onlyPart="four_seasons"
                sectionNumberOverride="04"
              />
            </section>
          )}

          {activeLesson.id === 'cycle-monthly-rhythms' && (
            <section id="cycle-monthly-rhythms">
              <MarketCyclesEducationModule
                symbol={symbol}
                onSelectSymbol={handleSelectSymbol}
                candles={activeCandles}
                btcLivePrice={btcLive}
                xrpLivePrice={xrpLive}
                xlmLivePrice={xlmLive}
                onEnterApp={handleEnterApp}
                onlyPart="monthly_rhythms"
                sectionNumberOverride="05"
              />
            </section>
          )}

          {activeLesson.id === 'cycle-four-year-clock' && (
            <section id="cycle-four-year-clock">
              <MarketCyclesEducationModule
                symbol={symbol}
                onSelectSymbol={handleSelectSymbol}
                candles={activeCandles}
                btcLivePrice={btcLive}
                xrpLivePrice={xrpLive}
                xlmLivePrice={xlmLive}
                onEnterApp={handleEnterApp}
                onlyPart="four_year_cycles"
                sectionNumberOverride="06"
              />
            </section>
          )}

          {activeLesson.id === 'market-symphony' && (
            <section id="market-symphony">
              <CandlestickSymphonyComposer
                symbol={symbol}
                onSelectSymbol={handleSelectSymbol}
                candles={activeCandles}
                livePrice={livePrice}
                btcLivePrice={btcLive}
                xrpLivePrice={xrpLive}
                xlmLivePrice={xlmLive}
              />
            </section>
          )}

          {activeLesson.id === 'candlestick-guide' && (
            <section id="candlestick-guide">
                  <CandleEducationDeck
                    symbol={symbol}
                    candles={activeCandles}
                    selectedCandleIndex={selectedCandleIndex}
                    onSelectCandle={setSelectedCandleIndex}
                    fibLevels={fibLevels}
                    livePrice={livePrice}
                    onUsePriceAsEntry={(price) => {
                      setEntryPrice(price);
                      const dec = symbol === 'BTCUSDT' ? 2 : 4;
                      setAlertBanner(
                        `Set Planned Entry Price to $${price.toFixed(dec)} from Section 08 Candlestick & Fibonacci Guide`
                      );
                    }}
                  />
                </section>
              )}

              {activeLesson.id === 'fibonacci-symphony-geometry' && (
                <section id="fibonacci-symphony-geometry">
                  <FibonacciSymphonyGeometryModule
                    symbol={symbol}
                    onSelectSymbol={handleSelectSymbol}
                    candles={activeCandles}
                    livePrice={livePrice}
                    onApplySetupToSimulator={({
                      entryPrice: ep,
                      stopLossPrice,
                      takeProfitPrice,
                      rrRatio: rr,
                    }) => {
                      setEntryPrice(ep);
                      const stopPct = Math.max(
                        0.5,
                        Math.min(10, Number((((ep - stopLossPrice) / ep) * 100).toFixed(2)))
                      );
                      setStopDistancePct(stopPct);
                      setRrRatio(rr);
                      const dec = symbol === 'BTCUSDT' ? 2 : 4;
                      setAlertBanner(
                        `Loaded 3-Point Fibonacci Setup (${symbol.replace(
                          'USDT',
                          ''
                        )}) onto XRPL Trade Desk: Point C Buy $${ep.toFixed(
                          dec
                        )} · 78.6% Stop $${stopLossPrice.toFixed(
                          dec
                        )} · 161.8% Target $${takeProfitPrice.toFixed(dec)}`
                      );
                      navigateToChapter('risk-chart');
                    }}
                  />
                </section>
              )}

              {activeLesson.id === 'fibonacci-symphony-markers' && (
                <section id="fibonacci-symphony-markers">
                  <FibonacciSymphonyMarkersStudio
                    symbol={symbol}
                    onSelectSymbol={handleSelectSymbol}
                    candles={activeCandles}
                    livePrice={livePrice}
                    btcLivePrice={btcLive}
                    xrpLivePrice={xrpLive}
                    xlmLivePrice={xlmLive}
                    onSendMarkerSetupToOrderDesk={({
                      symbol: targetSym,
                      entryPrice: ep,
                      stopLossPrice,
                      takeProfitPrice,
                      rrRatio: rr,
                      markerLabel,
                    }) => {
                      handleSelectSymbol(targetSym);
                      setEntryPrice(ep);
                      const stopPct = Math.max(
                        0.5,
                        Math.min(10, Number((((ep - stopLossPrice) / ep) * 100).toFixed(2)))
                      );
                      setStopDistancePct(stopPct);
                      setRrRatio(rr);
                      setTradeSide('long');
                      setShowRiskOverlay(true);
                      const dec = targetSym === 'BTCUSDT' ? 2 : 4;
                      setAlertBanner(
                        `Loaded ${markerLabel} (${targetSym.replace(
                          'USDT',
                          ''
                        )}) onto XRPL Trade Desk: Buy $${ep.toFixed(
                          dec
                        )} · 78.6% Stop $${stopLossPrice.toFixed(
                          dec
                        )} · Sell $${takeProfitPrice.toFixed(dec)}`
                      );
                      navigateToChapter('risk-chart');
                    }}
                  />
                </section>
              )}

              {activeLesson.id === 'ai-buy-sell-helper' && (
                <section id="ai-buy-sell-helper">
                  <LiveAiSignalHelper
                    symbol={symbol}
                    onSelectSymbol={handleSelectSymbol}
                    timeframe={timeframe}
                    candles={activeCandles}
                    stats={activeStats}
                    fibLevels={fibLevels}
                    livePrice={livePrice}
                    btcLivePrice={btcLive}
                    xrpLivePrice={xrpLive}
                    xlmLivePrice={xlmLive}
                    accountBalance={accountBalance}
                    riskPercent={riskPercent}
                    onApplyRecommendationToChart={({
                      entryPrice: recEntry,
                      stopDistancePct: recStopPct,
                      rrRatio: recRr,
                    }) => {
                      setEntryPrice(recEntry);
                      setStopDistancePct(recStopPct);
                      setRrRatio(recRr);
                      setTradeSide('long');
                      setShowRiskOverlay(true);
                      const dec = symbol === 'BTCUSDT' ? 2 : 4;
                      setAlertBanner(
                        `Loaded AI Examiner Levels onto XRPL Trade Desk (${symbol}): Buy $${recEntry.toFixed(
                          dec
                        )} · Stop ${recStopPct}% · 1:${recRr} Target (Use at Your Own Risk)`
                      );
                      navigateToChapter('risk-chart');
                    }}
                  />
                </section>
              )}

              {activeLesson.id === 'portfolio-ledger' && (
                <section id="portfolio-ledger">
                  <PortfolioAndToolsSection
                    activeSectionTab={activeBottomTab}
                    onSectionTabChange={setActiveBottomTab}
                    positions={positions}
                    onClosePosition={handleClosePosition}
                    btcPrice={btcLive}
                    xrpPrice={xrpLive}
                    xlmPrice={xlmLive}
                    candles={activeCandles}
                    watchedWallets={watchedWallets}
                    onAddWallet={(w) => setWatchedWallets((prev) => [w, ...prev])}
                    onRemoveWallet={(id) =>
                      setWatchedWallets((prev) => prev.filter((item) => item.id !== id))
                    }
                    botStrategies={botStrategies}
                    onToggleBot={handleToggleBot}
                    onRunBotBacktest={handleRunBotBacktest}
                    alerts={alerts}
                    onAddAlert={(newAl) =>
                      setAlerts((prev) => [
                        { ...newAl, id: `al_${Date.now()}`, triggered: false },
                        ...prev,
                      ])
                    }
                    onDeleteAlert={(id) => setAlerts((prev) => prev.filter((a) => a.id !== id))}
                  />
                </section>
              )}

              {activeLesson.id === 'skill-desk' && (
                <section id="skill-desk">
                  <DayTraderSkillSuite
                    symbol={symbol}
                    onSelectSymbol={handleSelectSymbol}
                    candles={activeCandles}
                    stats={activeStats}
                    fibLevels={fibLevels}
                    livePrice={livePrice}
                    accountBalance={accountBalance}
                    entryPrice={entryPrice}
                    onEntryPriceChange={setEntryPrice}
                    stopLoss={currentStopLoss}
                    takeProfit={currentTakeProfit}
                    stopDistancePct={stopDistancePct}
                    riskPercent={riskPercent}
                    rrRatio={rrRatio}
                    tradeSide={tradeSide}
                    instrument={instrument}
                    leverage={leverage}
                    positions={positions}
                    onOpenPaperPosition={handleOpenPaperPosition}
                    onAddAlert={(newAl) => {
                      setAlerts((prev) => [
                        { ...newAl, id: `al_${Date.now()}`, triggered: false },
                        ...prev,
                      ]);
                      setAlertBanner(
                        `Armed Alert: ${newAl.symbol} ${newAl.condition} $${newAl.targetPrice.toFixed(
                          newAl.symbol === 'BTCUSDT' ? 2 : 4
                        )}`
                      );
                    }}
                  />
                </section>
              )}

              {activeLesson.id === 'risk-chart' && (
                <div id="risk-chart" className="space-y-5">
                  {/* ==========================================================
                   * CALM, CLUTTER-FREE 3-VIEW WORKSPACE BAR FOR MODULE 3
                   * ========================================================== */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTradeDeskSubView('simple_desk')}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          tradeDeskSubView === 'simple_desk'
                            ? 'bg-slate-900 dark:bg-sky-600 text-white'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                        <span>1. Simple Trade Desk</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTradeDeskSubView('chart_scanner')}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          tradeDeskSubView === 'chart_scanner'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>2. Scan Chart Screenshot (AI)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTradeDeskSubView('alerts_checklist')}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          tradeDeskSubView === 'alerts_checklist'
                            ? 'bg-sky-600 text-white'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <BellRing className="w-3.5 h-3.5 shrink-0" />
                        <span>3. Alerts &amp; 1-by-1 Checklist</span>
                      </button>
                    </div>

                    {/* Compact Wallet Status Button (Opens Sync Drawer Only When Clicked) */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowTopWalletSyncDrawer((v) => !v)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          embeddedXrplAddress
                            ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                            : 'border-sky-500/50 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50'
                        }`}
                      >
                        <Wallet className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-mono">
                          {embeddedXrplAddress
                            ? `Xaman: ${embeddedXrplAddress.slice(0, 6)}...${embeddedXrplAddress.slice(-4)}`
                            : 'Sync Xaman Wallet'}
                        </span>
                      </button>
                      {embeddedXrplAddress && (
                        <button
                          type="button"
                          onClick={() => {
                            handleSaveUserXrplAddress('');
                            setAlertBanner('Cleared saved Xaman wallet address.');
                          }}
                          aria-label="Clear saved Xaman wallet address"
                          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* On-Demand Xaman Wallet Sync Drawer (Hidden by default to keep screen calm) */}
                  {showTopWalletSyncDrawer && (
                    <div className="rounded-xl border border-sky-400/50 bg-white dark:bg-slate-900 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                            Connect Your Own Android Xaman Wallet (Read-Only Watch)
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Scan your Android Xaman Receive QR with this camera or paste your public{' '}
                            <span className="font-mono">r...</span> address. Your secret keys stay
                            100% inside Android Xaman.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowTopWalletSyncDrawer(false);
                            setShowTopWalletCameraScanner(false);
                          }}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                        >
                          Close ✕
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowTopWalletCameraScanner((v) => !v)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {showTopWalletCameraScanner
                              ? 'Close Camera'
                              : 'Scan Android Receive QR'}
                          </span>
                        </button>
                        <input
                          type="text"
                          value={topWalletDraft}
                          onChange={(e) => setTopWalletDraft(e.target.value)}
                          placeholder="Or paste your public r... address"
                          className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = topWalletDraft.trim();
                            if (!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(trimmed)) {
                              setAlertBanner(
                                'Please enter a valid public XRPL address starting with "r", or use Scan Android Receive QR.'
                              );
                              return;
                            }
                            handleSaveUserXrplAddress(trimmed);
                            setShowTopWalletSyncDrawer(false);
                            setShowTopWalletCameraScanner(false);
                            setAlertBanner(
                              `Synced your Xaman wallet (${trimmed.slice(0, 8)}...${trimmed.slice(-5)})!`
                            );
                          }}
                          className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Sync
                        </button>
                      </div>

                      {showTopWalletCameraScanner && (
                        <XrplCameraQrScanner
                          onClose={() => setShowTopWalletCameraScanner(false)}
                          onAddressScanned={(scannedAddr) => {
                            setShowTopWalletCameraScanner(false);
                            setShowTopWalletSyncDrawer(false);
                            handleSaveUserXrplAddress(scannedAddr);
                            setAlertBanner(
                              `Scanned your Android Xaman Receive QR (${scannedAddr.slice(0, 8)}...${scannedAddr.slice(-5)})!`
                            );
                          }}
                        />
                      )}
                    </div>
                  )}

                  {/* ==========================================================
                   * VIEW 1: SIMPLE TRADE DESK (CLEAN, SPACIOUS, STEP-BY-STEP)
                   * ========================================================== */}
                  {tradeDeskSubView === 'simple_desk' && (
                    <div className="space-y-5">
                      {/* Compact Single-Row Coin Selector + Live Price */}
                      <section className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleSelectSymbol('XRPUSDT')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              symbol === 'XRPUSDT'
                                ? 'bg-sky-600 text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            XRP (${xrpLive.toFixed(4)})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectSymbol('BTCUSDT')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              symbol === 'BTCUSDT'
                                ? 'bg-amber-600 text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            BTC ($
                            {btcLive.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                            )
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectSymbol('XLMUSDT')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              symbol === 'XLMUSDT'
                                ? 'bg-sky-600 text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            XLM (${xlmLive.toFixed(4)})
                          </button>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                          <div>
                            <span className="font-sans text-slate-500 dark:text-slate-400 mr-1.5">
                              Live:
                            </span>
                            <strong className="text-sm text-slate-900 dark:text-white">
                              $
                              {symbol === 'BTCUSDT'
                                ? livePrice.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : livePrice.toFixed(4)}
                            </strong>
                          </div>
                          <span
                            className={`font-semibold ${
                              (activeStats?.priceChangePercent24h ?? 0) >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {(activeStats?.priceChangePercent24h ?? 0) >= 0 ? '+' : ''}
                            {(activeStats?.priceChangePercent24h ?? 1.84).toFixed(2)}% (24h)
                          </span>
                        </div>
                      </section>

                      {/* Main 2-Column Clean Workspace: Visual Chart + Step-by-Step Order Desk */}
                      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-7 xl:col-span-8">
                          {isLoading && activeCandles.length === 0 ? (
                            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-8 h-[440px] flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                              Loading {symbol} chart...
                            </div>
                          ) : (
                            <CandlestickChart
                              symbol={symbol}
                              timeframe={timeframe}
                              onTimeframeChange={setTimeframe}
                              candles={activeCandles}
                              fibLevels={fibLevels}
                              selectedCandleIndex={selectedCandleIndex}
                              onSelectCandle={setSelectedCandleIndex}
                              entryPrice={entryPrice}
                              stopLoss={currentStopLoss}
                              takeProfit={currentTakeProfit}
                              tradeSide={tradeSide}
                              showFibOverlay={showFibOverlay}
                              onToggleFibOverlay={() => setShowFibOverlay((v) => !v)}
                              showTrendBands={showTrendBands}
                              onToggleTrendBands={() => setShowTrendBands((v) => !v)}
                              showRiskOverlay={showRiskOverlay}
                              onToggleRiskOverlay={() => setShowRiskOverlay((v) => !v)}
                              accountBalance={accountBalance}
                              riskPercent={riskPercent}
                              rrRatio={rrRatio}
                              stopDistancePct={stopDistancePct}
                              onEntryPriceChange={setEntryPrice}
                              onStopDistancePctChange={setStopDistancePct}
                              onRrRatioChange={setRrRatio}
                            />
                          )}
                        </div>

                        <div className="lg:col-span-5 xl:col-span-4">
                          <RiskSimulatorPanel
                            symbol={symbol}
                            livePrice={livePrice}
                            atr14={activeStats?.atr14 ?? livePrice * 0.015}
                            accountBalance={accountBalance}
                            onAccountBalanceChange={setAccountBalance}
                            entryPrice={entryPrice}
                            onEntryPriceChange={setEntryPrice}
                            stopDistancePct={stopDistancePct}
                            onStopDistancePctChange={setStopDistancePct}
                            riskPercent={riskPercent}
                            onRiskPercentChange={setRiskPercent}
                            rrRatio={rrRatio}
                            onRrRatioChange={setRrRatio}
                            tradeSide={tradeSide}
                            onTradeSideChange={setTradeSide}
                            instrument={instrument}
                            onInstrumentChange={setInstrument}
                            leverage={leverage}
                            onLeverageChange={setLeverage}
                            onOpenPaperPosition={handleOpenPaperPosition}
                            connectedXrplAddress={embeddedXrplAddress}
                            onChangeXrplAddress={(addr) => handleSaveUserXrplAddress(addr)}
                            onSwitchToXrpSymbol={() => handleSelectSymbol('XRPUSDT')}
                            importedTenSet={importedXrplDexSet}
                          />
                        </div>
                      </section>
                    </div>
                  )}

                  {/* ==========================================================
                   * VIEW 2: OPTION B — SCAN ANY CHART SCREENSHOT (AI STUDY HELPER)
                   * ========================================================== */}
                  {tradeDeskSubView === 'chart_scanner' && (
                    <ChartScreenshotScanner
                      accountBalance={accountBalance}
                      riskPercent={riskPercent}
                      connectedXrplAddress={embeddedXrplAddress}
                      onStageSetupIntoDesk={(payload) => {
                        handleSelectSymbol('XRPUSDT');
                        setInstrument('spot');
                        setLeverage(1);
                        setTradeSide('long');
                        setShowRiskOverlay(true);
                        setEntryPrice(payload.buyPrice);
                        setRrRatio(payload.rrRatio);
                        setImportedXrplDexSet({
                          ...payload,
                          nonce: Date.now(),
                        });
                        setTradeDeskSubView('simple_desk');
                        setAlertBanner(
                          `Loaded ${payload.setupName} onto your Simple Trade Desk (Entry $${payload.buyPrice.toFixed(
                            4
                          )} · Target $${payload.sellPrice.toFixed(4)})!`
                        );
                      }}
                    />
                  )}

                  {/* ==========================================================
                   * VIEW 3: SUPPORT/RESISTANCE ALERTS & 1-BY-1 CHECKLIST
                   * ========================================================== */}
                  {tradeDeskSubView === 'alerts_checklist' && (
                    <div className="space-y-6">
                      <SupportResistanceRadarCard
                        symbol={symbol}
                        livePrice={livePrice}
                        candles={activeCandles}
                        fibLevels={fibLevels}
                        connectedXrplAddress={embeddedXrplAddress}
                        onLoadSetIntoDex={(payload) => {
                          handleSelectSymbol('XRPUSDT');
                          setInstrument('spot');
                          setLeverage(1);
                          setTradeSide('long');
                          setShowRiskOverlay(true);
                          if (payload.walletAddress) {
                            handleSaveUserXrplAddress(payload.walletAddress);
                          }
                          setImportedXrplDexSet({
                            ...payload,
                            nonce: Date.now(),
                          });
                          setTradeDeskSubView('simple_desk');
                          setAlertBanner(
                            `Staged ${payload.setupName} into Simple Trade Desk — Buy $${payload.buyPrice.toFixed(
                              4
                            )} · Sell $${payload.sellPrice.toFixed(4)} (${payload.quantityXrp} XRP)!`
                          );
                        }}
                        onAddPriceAlert={(newAl) =>
                          setAlerts((prev) => [
                            { ...newAl, id: `al_${Date.now()}`, triggered: false },
                            ...prev,
                          ])
                        }
                        onNotifyBanner={(msg) => setAlertBanner(msg)}
                      />

                      <OneByOneTradeChecklist
                        contextStep="step14"
                        xrpLivePrice={xrpLive}
                        connectedXrplAddress={embeddedXrplAddress}
                        checklistState={oneByOneChecklist}
                        onChangeChecklistState={setOneByOneChecklist}
                        onLoadSetIntoDex={(payload) => {
                          handleSelectSymbol('XRPUSDT');
                          setInstrument('spot');
                          setLeverage(1);
                          setTradeSide('long');
                          setShowRiskOverlay(true);
                          if (payload.walletAddress) {
                            handleSaveUserXrplAddress(payload.walletAddress);
                          }
                          setImportedXrplDexSet({
                            ...payload,
                            nonce: Date.now(),
                          });
                          setTradeDeskSubView('simple_desk');
                          const numStr =
                            payload.setNumber < 10
                              ? `0${payload.setNumber}`
                              : String(payload.setNumber);
                          setAlertBanner(
                            `Loaded Set #${numStr} (${payload.setupName}) into Simple Trade Desk — ${payload.quantityXrp} XRP Ready!`
                          );
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {activeLesson.id === 'ten-set-auto-trader' && (
                <div id="ten-set-auto-trader" className="space-y-6">
                  <OneByOneTradeChecklist
                    contextStep="step15"
                    xrpLivePrice={xrpLive}
                    connectedXrplAddress={embeddedXrplAddress}
                    checklistState={oneByOneChecklist}
                    onChangeChecklistState={setOneByOneChecklist}
                    onLoadSetIntoDex={(payload) => {
                      handleSelectSymbol('XRPUSDT');
                      setInstrument('spot');
                      setLeverage(1);
                      setTradeSide('long');
                      setShowRiskOverlay(true);
                      if (payload.walletAddress) {
                        setEmbeddedXrplAddress(payload.walletAddress);
                      }
                      setImportedXrplDexSet({
                        ...payload,
                        nonce: Date.now(),
                      });
                      const numStr =
                        payload.setNumber < 10
                          ? `0${payload.setNumber}`
                          : String(payload.setNumber);
                      setAlertBanner(
                        `Loaded Set #${numStr} (${payload.setupName}) into Section 14 Embedded XRPL DEX — ${payload.quantityXrp} XRP Ready!`
                      );
                      navigateToChapter('risk-chart');
                    }}
                  />

                  <section>
                    <TenSetAutoTraderLab
                      symbol={symbol}
                      onSelectSymbol={handleSelectSymbol}
                      candles={activeCandles}
                      fibLevels={fibLevels}
                      livePrice={livePrice}
                      btcLivePrice={btcLive}
                      xrpLivePrice={xrpLive}
                      xlmLivePrice={xlmLive}
                      accountBalance={accountBalance}
                      riskPercent={riskPercent}
                      onLogSetPositionToPortfolio={handleOpenPaperPosition}
                      onSendSetToEmbeddedXrplDex={(payload) => {
                        handleSelectSymbol('XRPUSDT');
                        setInstrument('spot');
                        setLeverage(1);
                        setTradeSide('long');
                        setShowRiskOverlay(true);
                        if (payload.walletAddress) {
                          setEmbeddedXrplAddress(payload.walletAddress);
                        }
                        setOneByOneChecklist((prev) => ({
                          ...prev,
                          sets: {
                            ...prev.sets,
                            [payload.setNumber]: {
                              ...(prev.sets[payload.setNumber] || {
                                staged: false,
                                receiptChecked: false,
                                signedInWallet: false,
                                filledAndLogged: false,
                                note: '',
                              }),
                              staged: true,
                            },
                          },
                        }));
                        setImportedXrplDexSet({
                          ...payload,
                          nonce: Date.now(),
                        });
                        const numStr =
                          payload.setNumber < 10
                            ? `0${payload.setNumber}`
                            : String(payload.setNumber);
                        setAlertBanner(
                          `Loaded Set #${numStr} (${payload.setupName}) into Section 14 Embedded XRPL DEX — ${payload.quantityXrp} XRP Ready!`
                        );
                        navigateToChapter('risk-chart');
                      }}
                    />
                  </section>
                </div>
              )}

              {activeLesson.id === 'ai-dex-lab' && (
                <div id="ai-dex-lab" className="space-y-6">
                  <section>
                    <DecentralizedAiDexDesk
                      symbol={symbol}
                      candles={activeCandles}
                      stats={activeStats}
                      livePrice={livePrice}
                      accountBalance={accountBalance}
                      entryPrice={entryPrice}
                      stopLoss={currentStopLoss}
                      takeProfit={currentTakeProfit}
                      riskPercent={riskPercent}
                      rrRatio={rrRatio}
                      tradeSide={tradeSide}
                      onOpenPaperPosition={handleOpenPaperPosition}
                    />
                  </section>

                  {/* End-of-Process Graduation & Self-Custody Stewardship Capstone Summary */}
                  <section
                    aria-label="Symphony Markets Academy Graduation Capstone"
                    className="rounded-xl border border-emerald-500/40 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6"
                  >
                    <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Step 16 of 16 · End of the Academy Process</span>
                        <span aria-hidden="true">·</span>
                        <span>Learn → Rehearse → Execute Stewardship Complete</span>
                      </div>
                      <h2
                        className="font-editorial text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white"
                        style={{ textWrap: 'balance' }}
                      >
                        Graduation Protocol: How Symphony Markets Stewards Operate Going Forward
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300 max-w-[70ch] leading-relaxed">
                        You have walked the full 16-step progression in intentional order—learning the market’s natural seasons first, reading Fibonacci sheet music and rehearsing on paper second, and executing calm, non-custodial limit orders last.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-1.5">
                        <div className="font-mono font-semibold text-sky-700 dark:text-sky-400">
                          I. Seasons & Rhythm First (01–07)
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          Always identify whether we are in an <strong>Ascending Eagle</strong> or <strong>Descending Eagle</strong> season and check the monthly/4-year clock before hunting setups.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-1.5">
                        <div className="font-mono font-semibold text-amber-700 dark:text-amber-400">
                          II. Fibonacci & Paper Proof (08–12)
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          Map 61.8% retracement support and 127.2% / 161.8% extension targets, verify at least a <strong>1:2 Risk-to-Reward</strong> ratio, and test new ideas in the Paper Ledger first.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl border border-emerald-400/50 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1.5">
                        <div className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                          III. One-by-One Self-Custody (13–16)
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          Keep 100% Spot self-custody (zero leverage, 2% max risk). Execute <strong>one limit order at a time</strong> in Section 14 or step-by-step from the Section 15 10-Set Sequencer.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => navigateToChapter('risk-chart')}
                        className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Open Live Chart &amp; XRPL DEX →
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateToChapter('ten-set-auto-trader')}
                        className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Open 10-Set Sequencer
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateToChapter('open-library')}
                        className="px-4 py-2.5 rounded-lg border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-xs sm:text-sm font-semibold text-sky-700 dark:text-sky-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Open Media &amp; Document Library
                      </button>
                    </div>
                  </section>
                </div>
              )}

                  {activeLesson.id === 'open-library' && (
                    <section id="open-library">
                      <OpenMediaAndDocumentLibrary
                        orientationVideoUrl={publicGates.orientationVideoUrl}
                        orientationVideoTitle={publicGates.orientationVideoTitle}
                        isAdminUnlocked={isAdminUser}
                        onOpenAdminConsole={() => setShowAdminModal(true)}
                        onJumpToBeginnerStart={() =>
                          isStandaloneMode
                            ? openStandaloneModule('foundations')
                            : openModuleInCampus('foundations')
                        }
                      />
                    </section>
                  )}

                  {activeLesson.id === 'ksbc-gold' && (
                    <section id="ksbc-gold">
                      <KsbcGoldTrainingPage
                        onEnterApp={handleEnterApp}
                        xrpLivePrice={xrpLive}
                      />
                    </section>
                  )}

                  {activeLesson.id === 'forex-guide' && (
                    <section id="forex-guide">
                      <ForexEducationModule
                        onOpenCryptoFoundations={() =>
                          isStandaloneMode
                            ? openStandaloneModule('foundations')
                            : openModuleInCampus('foundations')
                        }
                        onOpenFibonacciStudio={() =>
                          isStandaloneMode
                            ? openStandaloneModule('fibonacci')
                            : openModuleInCampus('fibonacci')
                        }
                      />
                    </section>
                  )}
                </>
              )}

              {/* Calm Module-Scoped Prev / Next Footer (Only Shown When Module Has Multiple Lessons & Is Unlocked) */}
              {!activeModuleLocked && activeModule.lessons.length > 1 && (
                <section
                  aria-label="Lesson Navigation"
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center">
                    {prevLessonInModule ? (
                      <button
                        type="button"
                        onClick={() =>
                          isStandaloneMode
                            ? openStandaloneModule(activeModule.id, prevLessonInModule.id)
                            : openModuleInCampus(activeModule.id, prevLessonInModule.id)
                        }
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                        <span>Previous: {prevLessonInModule.tabLabel}</span>
                      </button>
                    ) : !isStandaloneMode ? (
                      <button
                        type="button"
                        onClick={() => openCampusHub()}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                        <span>Back to Academy Campus</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {activeModule.standaloneBrandTitle}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      Tab {activeLessonIdxInModule + 1} of {activeModule.lessons.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-end">
                    {nextLessonInModule ? (
                      <button
                        type="button"
                        onClick={() =>
                          isStandaloneMode
                            ? openStandaloneModule(activeModule.id, nextLessonInModule.id)
                            : openModuleInCampus(activeModule.id, nextLessonInModule.id)
                        }
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <span>Next: {nextLessonInModule.tabLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    ) : !isStandaloneMode ? (
                      <button
                        type="button"
                        onClick={() => openCampusHub()}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <span>Done · Choose Next Module</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          openStandaloneModule(activeModule.id, activeModule.lessons[0].id)
                        }
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        <span>Return to First Tab</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      )}

      {/* Instructor Admin & Student Passcode Console Modal */}
      <AcademyAdminConsoleModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        currentUser={academyUser}
        isAdminUser={isAdminUser}
        publicGates={publicGates}
        adminSettings={adminSettings}
        intermediateUnlocked={intermediateUnlocked}
        advancedUnlocked={advancedUnlocked}
        onUnlockIntermediate={handleUnlockIntermediate}
        onUnlockAdvanced={handleUnlockAdvanced}
        onLockStudentSessionGates={handleLockStudentSessionGates}
        onGoogleAdminSignIn={handleGoogleAdminSignIn}
        onGoogleAdminSignOut={handleGoogleAdminSignOut}
        onSaveConfiguration={handleSaveAdminConfiguration}
        authError={adminAuthError}
        isBusy={adminBusy}
      />

      {/* Quiet Footer (Adapts Cleanly for Standalone Single-Module Mode vs Full Academy) */}
      <footer
        className={`border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 ${
          isSingleStageWelcome ? '' : 'mt-8'
        }`}
      >
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <SymphonyHarpLogo variant="vector" className="w-5 h-5" />
            <span>
              {isStandaloneMode
                ? `${activeModule.standaloneBrandTitle} · Symphony Markets Academy (Zero Custody · Educational Use Only).`
                : 'Symphony Markets Academy — Free Open-Source No-Scam Zone Sandbox (Hypothetical Simulation · Zero Custody · Not Financial Advice).'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isStandaloneMode ? (
              <>
                <button
                  type="button"
                  onClick={handleCopyActiveModuleLink}
                  className="text-sky-600 dark:text-sky-400 hover:underline underline-offset-2 font-medium cursor-pointer"
                >
                  {copiedStandaloneLink ? '✓ Module Link Copied' : `Copy ?module=${activeModule.id}`}
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setDarkMode((d) => !d)}
                  className="hover:text-slate-900 dark:hover:text-white underline underline-offset-2 cursor-pointer"
                >
                  {darkMode ? 'Light Theme' : 'Dark Theme'}
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setShowAdminModal(true)}
                  className="hover:text-slate-900 dark:hover:text-white underline underline-offset-2 cursor-pointer"
                >
                  Passcode / Admin
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => openCampusHub()}
                  className="text-emerald-700 dark:text-emerald-400 hover:underline underline-offset-2 font-semibold cursor-pointer"
                >
                  All Modules →
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigatePublicPage('guide')}
                  className="text-emerald-700 dark:text-emerald-400 hover:underline underline-offset-2 font-semibold cursor-pointer"
                >
                  Free Ebook (PDF &amp; EPUB)
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => navigatePublicPage('story')}
                  className="text-sky-600 dark:text-sky-400 hover:underline underline-offset-2 font-medium cursor-pointer"
                >
                  Analemma Ventures · Digital Visual Resume Pro 1.0 Node
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setDarkMode((d) => !d)}
                  className="hover:text-slate-900 dark:hover:text-white underline underline-offset-2 cursor-pointer"
                >
                  {darkMode ? 'Light Theme' : 'Dark Theme'}
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() =>
                    viewMode === 'landing' ? openCampusHub() : navigatePublicPage('welcome')
                  }
                  className="hover:text-slate-900 dark:hover:text-white underline underline-offset-2 cursor-pointer"
                >
                  {viewMode === 'landing' ? 'Open Academy Campus' : 'Return to Welcome Stage'}
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
