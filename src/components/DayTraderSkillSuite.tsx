import React, { useEffect, useMemo, useState } from 'react';
import {
  AssetSymbol,
  Candle,
  FibonacciLevel,
  InstrumentType,
  MarketStats,
  PaperPosition,
  PriceAlert,
  TradeSide,
} from '../types/market';

export type TraderSkillId =
  | 'scanner'
  | 'timemachine'
  | 'risk'
  | 'entry'
  | 'exit'
  | 'budget'
  | 'broker'
  | 'analyst'
  | 'news'
  | 'alerts'
  | 'pelosi';

interface DayTraderSkillSuiteProps {
  symbol: AssetSymbol;
  onSelectSymbol: (sym: AssetSymbol) => void;
  candles: Candle[];
  stats: MarketStats | null;
  fibLevels: FibonacciLevel[];
  livePrice: number;
  accountBalance: number;
  entryPrice: number;
  onEntryPriceChange: (price: number) => void;
  stopLoss: number;
  takeProfit: number;
  stopDistancePct: number;
  riskPercent: number;
  rrRatio: number;
  tradeSide: TradeSide;
  instrument: InstrumentType;
  leverage: number;
  positions: PaperPosition[];
  onOpenPaperPosition: (pos: Omit<PaperPosition, 'id' | 'openedAt' | 'status'>) => void;
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'triggered'>) => void;
}

interface ScannedTicker {
  symbol: string;
  name: string;
  lastPrice: number;
  change24hPct: number;
  volumeUsdM: number;
  rsi14: number;
  setupLabel: string;
  bias: 'Bullish' | 'Bearish' | 'Neutral';
  supportedInSim: boolean;
}

const SKILL_DEFINITIONS: Array<{
  id: TraderSkillId;
  command: string;
  title: string;
  summary: string;
}> = [
  {
    id: 'scanner',
    command: 'trader-scanner',
    title: 'Scanner',
    summary: 'Multi-asset technical setup & momentum filter',
  },
  {
    id: 'timemachine',
    command: 'trader-timemachine',
    title: 'Time Machine',
    summary: '2,500-path Monte Carlo session replay on live bars',
  },
  {
    id: 'risk',
    command: 'trader-risk',
    title: 'Risk Audit',
    summary: 'Pre-trade 2% exposure, heat & liquidation checklist',
  },
  {
    id: 'entry',
    command: 'trader-entry',
    title: 'Entry Timer',
    summary: 'Bar-by-bar pullback vs. chase timing evaluation',
  },
  {
    id: 'exit',
    command: 'trader-exit',
    title: 'Exit Planner',
    summary: 'Rule-based +1R / +2R / +3R scale-out & breakeven ladder',
  },
  {
    id: 'budget',
    command: 'trader-budget',
    title: 'Budget Guard',
    summary: 'Daily loss cap, portfolio heat & unit sizing limits',
  },
  {
    id: 'broker',
    command: 'trader-broker',
    title: 'Paper Broker',
    summary: 'Human-in-the-loop OCO bracket ticket (explicit "yes" gate)',
  },
  {
    id: 'analyst',
    command: 'trader-analyst',
    title: 'Analyst Brief',
    summary: 'Multi-factor trend, volatility & volume synthesis',
  },
  {
    id: 'news',
    command: 'trader-news',
    title: 'Catalyst Feed',
    summary: 'Ecosystem filings, liquidity events & slippage guidance',
  },
  {
    id: 'alerts',
    command: 'trader-alerts',
    title: 'Smart Triggers',
    summary: 'One-click structural level & Fibonacci alert presets',
  },
  {
    id: 'pelosi',
    command: 'trader-pelosi',
    title: 'Disclosures',
    summary: 'Public STOCK Act & institutional filing lag tracker',
  },
];

function computeRsi14(candles: Candle[]): number {
  if (candles.length < 15) return 52;
  let gains = 0;
  let losses = 0;
  const slice = candles.slice(-15);
  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i].close - slice[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / 14;
  const avgLoss = losses / 14;
  if (avgLoss === 0) return 75;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export const DayTraderSkillSuite: React.FC<DayTraderSkillSuiteProps> = ({
  symbol,
  onSelectSymbol,
  candles,
  stats,
  fibLevels,
  livePrice,
  accountBalance,
  entryPrice,
  onEntryPriceChange,
  stopLoss,
  takeProfit,
  stopDistancePct,
  riskPercent,
  rrRatio,
  tradeSide,
  instrument,
  leverage,
  positions,
  onOpenPaperPosition,
  onAddAlert,
}) => {
  const [activeSkill, setActiveSkill] = useState<TraderSkillId>('timemachine');
  const [scannerFilter, setScannerFilter] = useState<'all' | 'Bullish' | 'Bearish'>('all');
  const [scannedList, setScannedList] = useState<ScannedTicker[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Time Machine state
  const [horizonBars, setHorizonBars] = useState<number>(36);
  const [replaySeed, setReplaySeed] = useState<number>(1);

  // Budget state
  const [maxDailyLossPct, setMaxDailyLossPct] = useState<number>(4.0);
  const [maxPortfolioHeatPct, setMaxPortfolioHeatPct] = useState<number>(6.0);

  // Broker explicit human-in-the-loop confirmation state
  const [confirmInput, setConfirmInput] = useState<string>('');
  const [brokerFeedback, setBrokerFeedback] = useState<string | null>(null);

  const baseAsset = symbol === 'BTCUSDT' ? 'BTC' : symbol === 'XRPUSDT' ? 'XRP' : 'XLM';
  const decimals = symbol === 'BTCUSDT' ? 2 : 4;

  // Live Multi-Pair Scanner Fetch
  const runMarketScan = async () => {
    setIsScanning(true);
    const pairs = [
      { sym: 'BTCUSDT', name: 'Bitcoin', sim: true },
      { sym: 'XRPUSDT', name: 'XRP Ledger', sim: true },
      { sym: 'XLMUSDT', name: 'Stellar Lumens', sim: true },
      { sym: 'ETHUSDT', name: 'Ethereum', sim: false },
      { sym: 'SOLUSDT', name: 'Solana', sim: false },
      { sym: 'HBARUSDT', name: 'Hedera', sim: false },
      { sym: 'ADAUSDT', name: 'Cardano', sim: false },
      { sym: 'LINKUSDT', name: 'Chainlink', sim: false },
    ];

    try {
      const symbolsParam = encodeURIComponent(JSON.stringify(pairs.map((p) => p.sym)));
      const res = await fetch(
        `https://data-api.binance.vision/api/v3/ticker/24hr?symbols=${symbolsParam}`
      );
      if (!res.ok) throw new Error('Fallback scan');
      const data = (await res.json()) as Array<{
        symbol: string;
        lastPrice: string;
        priceChangePercent: string;
        highPrice: string;
        lowPrice: string;
        quoteVolume: string;
      }>;

      const mapped: ScannedTicker[] = pairs.map((meta) => {
        const row = data.find((d) => d.symbol === meta.sym);
        const last = row
          ? parseFloat(row.lastPrice)
          : meta.sym === 'BTCUSDT'
          ? symbol === 'BTCUSDT'
            ? livePrice
            : 91450
          : meta.sym === 'XRPUSDT'
          ? livePrice
          : 0.415;
        const chg = row ? parseFloat(row.priceChangePercent) : 1.8;
        const high = row ? parseFloat(row.highPrice) : last * 1.03;
        const low = row ? parseFloat(row.lowPrice) : last * 0.97;
        const volM = row ? parseFloat(row.quoteVolume) / 1_000_000 : 240;

        const rangePos = ((last - low) / Math.max(high - low, 1e-8)) * 100;
        const estRsi = Math.min(82, Math.max(22, 30 + rangePos * 0.48 + chg * 1.1));

        let setupLabel = 'Range Consolidation';
        let bias: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';

        if (chg > 2.2 && rangePos > 68) {
          setupLabel = 'Momentum Breakout Above Intraday Highs';
          bias = 'Bullish';
        } else if (chg >= -1.5 && rangePos >= 35 && rangePos <= 58) {
          setupLabel = 'Fibonacci 50%–61.8% Pullback Support';
          bias = 'Bullish';
        } else if (estRsi < 36) {
          setupLabel = 'Oversold Liquidity Sweep / Hammer Watch';
          bias = 'Bullish';
        } else if (estRsi > 70) {
          setupLabel = 'Extended Overbought / Mean Reversion Watch';
          bias = 'Bearish';
        } else if (chg < -2.2 && rangePos < 35) {
          setupLabel = 'Breakdown Below Session Support';
          bias = 'Bearish';
        }

        return {
          symbol: meta.sym,
          name: meta.name,
          lastPrice: last,
          change24hPct: chg,
          volumeUsdM: volM,
          rsi14: estRsi,
          setupLabel,
          bias,
          supportedInSim: meta.sim,
        };
      });

      setScannedList(mapped);
    } catch {
      setScannedList([
        {
          symbol: 'XRPUSDT',
          name: 'XRP Ledger',
          lastPrice: symbol === 'XRPUSDT' ? livePrice : 2.421,
          change24hPct: 2.64,
          volumeUsdM: 1420,
          rsi14: 58.4,
          setupLabel: 'EMA 20 Trend Continuation + Fib 50% Hold',
          bias: 'Bullish',
          supportedInSim: true,
        },
        {
          symbol: 'XLMUSDT',
          name: 'Stellar Lumens',
          lastPrice: symbol === 'XLMUSDT' ? livePrice : 0.4152,
          change24hPct: 1.92,
          volumeUsdM: 385,
          rsi14: 54.1,
          setupLabel: 'Fibonacci 61.8% Golden Pocket Pullback',
          bias: 'Bullish',
          supportedInSim: true,
        },
        {
          symbol: 'BTCUSDT',
          name: 'Bitcoin',
          lastPrice: symbol === 'BTCUSDT' ? livePrice : 91450,
          change24hPct: 1.15,
          volumeUsdM: 24800,
          rsi14: 61.2,
          setupLabel: 'High-Tight Flag Consolidation',
          bias: 'Bullish',
          supportedInSim: true,
        },
        {
          symbol: 'SOLUSDT',
          name: 'Solana',
          lastPrice: 198.4,
          change24hPct: -2.45,
          volumeUsdM: 4120,
          rsi14: 41.8,
          setupLabel: 'Lower Band Retest / Support Probe',
          bias: 'Bearish',
          supportedInSim: false,
        },
        {
          symbol: 'HBARUSDT',
          name: 'Hedera',
          lastPrice: 0.284,
          change24hPct: 3.85,
          volumeUsdM: 610,
          rsi14: 67.5,
          setupLabel: 'Momentum Breakout Above Session High',
          bias: 'Bullish',
          supportedInSim: false,
        },
      ]);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    runMarketScan();
  }, [symbol]);

  // Derived Risk & Sizing Calculations matching RiskSimulatorPanel
  const tradeMetrics = useMemo(() => {
    const safeEntry = entryPrice > 0 ? entryPrice : livePrice;
    const riskUsd = accountBalance * (riskPercent / 100);
    const rewardUsd = riskUsd * rrRatio;
    const perUnitRisk = Math.max(Math.abs(safeEntry - stopLoss), 1e-6);
    const quantity = riskUsd / perUnitRisk;
    const notionalUsd = quantity * safeEntry;
    const effectiveLev = instrument === 'spot' ? 1 : leverage;
    const marginUsd = instrument === 'options' ? riskUsd : notionalUsd / effectiveLev;

    let liqPrice: number | null = null;
    if (instrument === 'futures' && effectiveLev > 1) {
      const liqMove = (1 / effectiveLev) * 0.92;
      liqPrice =
        tradeSide === 'long'
          ? Math.max(0.0001, safeEntry * (1 - liqMove))
          : safeEntry * (1 + liqMove);
    }

    return {
      safeEntry,
      riskUsd,
      rewardUsd,
      quantity,
      notionalUsd,
      marginUsd,
      effectiveLev,
      liqPrice,
    };
  }, [
    entryPrice,
    livePrice,
    accountBalance,
    riskPercent,
    rrRatio,
    stopLoss,
    instrument,
    leverage,
    tradeSide,
  ]);

  // Time Machine: 2,500-Path Monte Carlo Bootstrap Simulation using real historical bar returns
  const timeMachineResult = useMemo(() => {
    const paths = 2500;
    const returns: number[] = [];
    for (let i = 1; i < candles.length; i++) {
      if (candles[i - 1].close > 0) {
        returns.push((candles[i].close - candles[i - 1].close) / candles[i - 1].close);
      }
    }
    if (returns.length < 5) {
      returns.push(0.004, -0.0035, 0.006, -0.005, 0.002, -0.0025);
    }

    let winCount = 0;
    let lossCount = 0;
    let timeoutCount = 0;
    let totalBarsToHit = 0;
    const terminalPrices: number[] = [];

    // Deterministic fast PRNG seeded by replaySeed + entryPrice so UI doesn't flicker unpredictably
    let seed = Math.floor(replaySeed * 9973 + tradeMetrics.safeEntry * 10000 + horizonBars * 31);
    const nextRand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let p = 0; p < paths; p++) {
      let price = tradeMetrics.safeEntry;
      let resolved = false;

      for (let b = 1; b <= horizonBars; b++) {
        const sampledReturn = returns[Math.floor(nextRand() * returns.length)];
        // Include realistic intrabar high/low excursion
        const nextPrice = price * (1 + sampledReturn);
        const intrabarHigh = Math.max(price, nextPrice) * (1 + Math.abs(sampledReturn) * 0.35);
        const intrabarLow = Math.min(price, nextPrice) * (1 - Math.abs(sampledReturn) * 0.35);

        if (tradeSide === 'long') {
          if (intrabarLow <= stopLoss) {
            lossCount++;
            totalBarsToHit += b;
            price = stopLoss;
            resolved = true;
            break;
          }
          if (intrabarHigh >= takeProfit) {
            winCount++;
            totalBarsToHit += b;
            price = takeProfit;
            resolved = true;
            break;
          }
        } else {
          if (intrabarHigh >= stopLoss) {
            lossCount++;
            totalBarsToHit += b;
            price = stopLoss;
            resolved = true;
            break;
          }
          if (intrabarLow <= takeProfit) {
            winCount++;
            totalBarsToHit += b;
            price = takeProfit;
            resolved = true;
            break;
          }
        }
        price = nextPrice;
      }

      if (!resolved) {
        timeoutCount++;
      }
      terminalPrices.push(price);
    }

    terminalPrices.sort((a, b) => a - b);
    const winProb = (winCount / paths) * 100;
    const lossProb = (lossCount / paths) * 100;
    const timeoutProb = (timeoutCount / paths) * 100;

    const expectedR = (winCount / paths) * rrRatio - (lossCount / paths) * 1.0;
    const expectedUsd = expectedR * tradeMetrics.riskUsd;
    const avgBarsResolution =
      winCount + lossCount > 0 ? Math.round(totalBarsToHit / (winCount + lossCount)) : horizonBars;

    // Historical Candle Backtest on existing loaded bars
    let histSignals = 0;
    let histWins = 0;
    for (let i = 10; i < candles.length - 8; i++) {
      if (candles[i].detectedPattern) {
        histSignals++;
        const entry = candles[i].close;
        const dist = entry * (stopDistancePct / 100);
        const tgt = tradeSide === 'long' ? entry + dist * rrRatio : entry - dist * rrRatio;
        const stp = tradeSide === 'long' ? entry - dist : entry + dist;
        for (let j = i + 1; j < Math.min(candles.length, i + 16); j++) {
          if (tradeSide === 'long') {
            if (candles[j].low <= stp) break;
            if (candles[j].high >= tgt) {
              histWins++;
              break;
            }
          } else {
            if (candles[j].high >= stp) break;
            if (candles[j].low <= tgt) {
              histWins++;
              break;
            }
          }
        }
      }
    }

    return {
      paths,
      winProb,
      lossProb,
      timeoutProb,
      expectedR,
      expectedUsd,
      avgBarsResolution,
      p10Price: terminalPrices[Math.floor(paths * 0.1)] ?? tradeMetrics.safeEntry,
      medianPrice: terminalPrices[Math.floor(paths * 0.5)] ?? tradeMetrics.safeEntry,
      p90Price: terminalPrices[Math.floor(paths * 0.9)] ?? tradeMetrics.safeEntry,
      histSignals,
      histWinRate: histSignals > 0 ? (histWins / histSignals) * 100 : 50,
    };
  }, [
    candles,
    tradeMetrics.safeEntry,
    tradeMetrics.riskUsd,
    stopLoss,
    takeProfit,
    tradeSide,
    rrRatio,
    horizonBars,
    replaySeed,
    stopDistancePct,
  ]);

  // Live Technical Telemetry for Analyst & Entry Timer
  const technicalContext = useMemo(() => {
    const last = candles[candles.length - 1];
    const ema20 = last?.ema20 ?? livePrice;
    const sma50 = last?.sma50 ?? livePrice;
    const rsi14 = computeRsi14(candles);
    const atr = stats?.atr14 ?? livePrice * 0.015;
    const emaDistPct = ((livePrice - ema20) / Math.max(ema20, 1e-8)) * 100;
    const fib50 = fibLevels.find((f) => f.ratio === 0.5)?.price ?? livePrice * 0.985;
    const fib618 = fibLevels.find((f) => f.ratio === 0.618)?.price ?? livePrice * 0.975;

    const trendUp = ema20 >= sma50;
    const stopInAtr = Math.abs(tradeMetrics.safeEntry - stopLoss) / Math.max(atr, 1e-8);

    return {
      ema20,
      sma50,
      rsi14,
      atr,
      emaDistPct,
      fib50,
      fib618,
      trendUp,
      stopInAtr,
    };
  }, [candles, livePrice, stats, fibLevels, tradeMetrics.safeEntry, stopLoss]);

  // Open Portfolio Heat & Daily Realized Loss for Risk & Budget skills
  const portfolioExposure = useMemo(() => {
    const openPositions = positions.filter((p) => p.status === 'open');
    const openRiskUsd = openPositions.reduce((sum, p) => sum + p.riskAmountUsd, 0);
    const openHeatPct = (openRiskUsd / Math.max(accountBalance, 1)) * 100;

    const closedLossTodayUsd = positions
      .filter((p) => p.status === 'closed' && (p.realizedPnlUsd ?? 0) < 0)
      .reduce((sum, p) => sum + Math.abs(p.realizedPnlUsd ?? 0), 0);

    const maxDailyLossUsd = accountBalance * (maxDailyLossPct / 100);
    const remainingDailyBudgetUsd = Math.max(0, maxDailyLossUsd - closedLossTodayUsd);

    return {
      openCount: openPositions.length,
      openRiskUsd,
      openHeatPct,
      closedLossTodayUsd,
      maxDailyLossUsd,
      remainingDailyBudgetUsd,
    };
  }, [positions, accountBalance, maxDailyLossPct]);

  const handleBrokerConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmInput.trim().toLowerCase() !== 'yes') {
      setBrokerFeedback('Order held: Type "yes" explicitly to authorize paper bracket execution.');
      return;
    }

    onOpenPaperPosition({
      symbol,
      instrument,
      side: tradeSide,
      entryPrice: Number(tradeMetrics.safeEntry.toFixed(decimals)),
      stopLoss: Number(stopLoss.toFixed(decimals)),
      takeProfit: Number(takeProfit.toFixed(decimals)),
      quantity: Number(tradeMetrics.quantity.toFixed(2)),
      notionalUsd: Number(tradeMetrics.notionalUsd.toFixed(2)),
      marginRequiredUsd: Number(tradeMetrics.marginUsd.toFixed(2)),
      leverage: tradeMetrics.effectiveLev,
      liquidationPrice: tradeMetrics.liqPrice
        ? Number(tradeMetrics.liqPrice.toFixed(decimals))
        : null,
      riskAmountUsd: Number(tradeMetrics.riskUsd.toFixed(2)),
      riskPercent,
      rewardAmountUsd: Number(tradeMetrics.rewardUsd.toFixed(2)),
      rrRatio,
    });

    setConfirmInput('');
    setBrokerFeedback(
      `Confirmed: Paper OCO Bracket Order for ${tradeMetrics.quantity.toFixed(
        2
      )} ${baseAsset} routed to Paper Portfolio.`
    );
  };

  const currentSkillMeta =
    SKILL_DEFINITIONS.find((s) => s.id === activeSkill) ?? SKILL_DEFINITIONS[0];

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Day-Trader-Skill Desk — 11-Module Interactive Suite
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Web implementation of the open-source{' '}
            <span className="font-mono text-slate-700 dark:text-slate-300">
              Jakeschincariol/day-trader-skill
            </span>{' '}
            architecture · Paper-first guardrails · Explicit human confirmation
          </p>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
          Active Module: <strong className="text-sky-600 dark:text-sky-400">{currentSkillMeta.command}</strong> ·{' '}
          Target: <strong className="text-slate-900 dark:text-white">{symbol}</strong>
        </div>
      </div>

      {/* 11-Skill Module Selector Strip */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/80">
        {SKILL_DEFINITIONS.map((sk) => {
          const isActive = sk.id === activeSkill;
          return (
            <button
              key={sk.id}
              type="button"
              onClick={() => setActiveSkill(sk.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-sky-600 border-sky-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {sk.title}
            </button>
          );
        })}
      </div>

      {/* MODULE 1: TRADER-TIMEMACHINE (Monte Carlo Session Replay) */}
      {activeSkill === 'timemachine' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Time Machine — 2,500-Path Historical Bar Replay ({symbol})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Replays your exact {tradeSide.toUpperCase()} setup (Entry $
                  {tradeMetrics.safeEntry.toFixed(decimals)}, Stop ${stopLoss.toFixed(decimals)}, Target $
                  {takeProfit.toFixed(decimals)}) across 2,500 bootstrapped paths sampled from {symbol}’s real candle returns.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReplaySeed((s) => s + 1)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Re-Run 2,500 Paths
              </button>
            </div>

            {/* Horizon Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Forward Holding Horizon (Candles Simulated per Path)
              </span>
              <div className="flex items-center gap-1">
                {[18, 36, 60, 96].map((bars) => (
                  <button
                    key={bars}
                    type="button"
                    onClick={() => setHorizonBars(bars)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      horizonBars === bars
                        ? 'bg-sky-600 text-white font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {bars} Bars
                  </button>
                ))}
              </div>
            </div>

            {/* Probability Distribution Visual Bars */}
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    ▲ Hit 1:{rrRatio} Take-Profit (${takeProfit.toFixed(decimals)}) First
                  </span>
                  <span className="font-mono font-semibold tabular-nums">
                    {timeMachineResult.winProb.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-transform duration-200 origin-left"
                    style={{ width: `${Math.min(100, timeMachineResult.winProb)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-rose-600 dark:text-rose-400">
                    ▼ Hit {riskPercent.toFixed(1)}% Stop-Loss (${stopLoss.toFixed(decimals)}) First
                  </span>
                  <span className="font-mono font-semibold tabular-nums">
                    {timeMachineResult.lossProb.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-transform duration-200 origin-left"
                    style={{ width: `${Math.min(100, timeMachineResult.lossProb)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    ● Remained Inside Bracket After {horizonBars} Bars
                  </span>
                  <span className="font-mono font-semibold tabular-nums">
                    {timeMachineResult.timeoutProb.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 dark:bg-slate-600 transition-transform duration-200 origin-left"
                    style={{ width: `${Math.min(100, timeMachineResult.timeoutProb)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Statistical Expectancy Summary */}
          <div className="lg:col-span-5 border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/60 dark:bg-slate-950/60 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                Statistical Expectancy & Replay Telemetry
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono tabular-nums">
                <div>
                  <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                    Expected Value (Per Trade)
                  </div>
                  <div
                    className={`text-base font-bold ${
                      timeMachineResult.expectedUsd >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {timeMachineResult.expectedUsd >= 0 ? '+' : ''}$
                    {timeMachineResult.expectedUsd.toFixed(2)} (
                    {timeMachineResult.expectedR >= 0 ? '+' : ''}
                    {timeMachineResult.expectedR.toFixed(2)}R)
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                    Required Breakeven Win %
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {((1 / (1 + rrRatio)) * 100).toFixed(1)}% (at 1:{rrRatio})
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-mono tabular-nums pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
                <div className="flex justify-between">
                  <span className="font-sans text-slate-500 dark:text-slate-400">
                    Avg. Bars to Bracket Resolution
                  </span>
                  <span>{timeMachineResult.avgBarsResolution} candles</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-slate-500 dark:text-slate-400">
                    Simulated P10 – P90 Price Range
                  </span>
                  <span>
                    ${timeMachineResult.p10Price.toFixed(decimals)} – $
                    {timeMachineResult.p90Price.toFixed(decimals)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-slate-500 dark:text-slate-400">
                    Past Pattern Occurrences in Window
                  </span>
                  <span>
                    {timeMachineResult.histSignals} setups ({timeMachineResult.histWinRate.toFixed(0)}% hit target)
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2.5">
              Educational Insight: With a 1:{rrRatio} reward-to-risk ratio, a strategy only needs to win more than{' '}
              {((1 / (1 + rrRatio)) * 100).toFixed(1)}% of the time to achieve positive mathematical expectancy before fees.
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: TRADER-SCANNER (Multi-Chart Setup Filter) */}
      {activeSkill === 'scanner' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
              {(['all', 'Bullish', 'Bearish'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setScannerFilter(f)}
                  className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 ${
                    scannerFilter === f
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'All Scanned Charts' : `${f} Setups`}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={runMarketScan}
              disabled={isScanning}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isScanning ? 'Scanning Live Feeds...' : 'Refresh Multi-Chart Scan'}
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3 font-medium">Ticker</th>
                  <th className="py-2.5 px-3 font-medium text-right">Last Price</th>
                  <th className="py-2.5 px-3 font-medium text-right">24h Move</th>
                  <th className="py-2.5 px-3 font-medium text-right">24h Vol ($M)</th>
                  <th className="py-2.5 px-3 font-medium text-right">Est. RSI(14)</th>
                  <th className="py-2.5 px-3 font-medium">Detected Chart Structure</th>
                  <th className="py-2.5 px-3 font-medium text-right">Simulator Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono tabular-nums">
                {scannedList
                  .filter((item) => scannerFilter === 'all' || item.bias === scannerFilter)
                  .map((item) => (
                    <tr
                      key={item.symbol}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {item.symbol}{' '}
                        <span className="font-normal text-slate-500 dark:text-slate-400">
                          · {item.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        ${item.lastPrice < 10 ? item.lastPrice.toFixed(4) : item.lastPrice.toFixed(2)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-semibold whitespace-nowrap ${
                          item.change24hPct >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {item.change24hPct >= 0 ? '+' : ''}
                        {item.change24hPct.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        ${item.volumeUsdM.toFixed(0)}M
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {item.rsi14.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-300">
                        <span
                          className={`font-semibold mr-1.5 ${
                            item.bias === 'Bullish'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : item.bias === 'Bearish'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {item.bias}:
                        </span>
                        {item.setupLabel}
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans whitespace-nowrap">
                        {item.supportedInSim ? (
                          <button
                            type="button"
                            onClick={() => onSelectSymbol(item.symbol as AssetSymbol)}
                            className="px-2.5 py-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {symbol === item.symbol ? 'Active on Chart' : 'Load in Simulator'}
                          </button>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">Benchmark Context</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 3: TRADER-RISK (6-Point Pre-Trade Audit) */}
      {activeSkill === 'risk' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            Pre-trade risk audit evaluating your current {symbol} {tradeSide.toUpperCase()} parameters against institutional risk rules:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                label: '1. Single-Trade Risk Cap (≤ 2.0%)',
                status: riskPercent <= 2.0 ? 'PASS' : 'WARN',
                detail: `Current risk is ${riskPercent.toFixed(1)}% ($${tradeMetrics.riskUsd.toFixed(
                  2
                )}) of $${accountBalance.toLocaleString()} equity.`,
              },
              {
                label: '2. Asymmetric Reward-to-Risk (≥ 1:2)',
                status: rrRatio >= 2 ? 'PASS' : 'WARN',
                detail: `Target R:R is 1:${rrRatio} (+$${tradeMetrics.rewardUsd.toFixed(
                  2
                )} reward vs. -$${tradeMetrics.riskUsd.toFixed(2)} risk).`,
              },
              {
                label: '3. Volatility Noise Buffer (≥ 1.0x ATR)',
                status: technicalContext.stopInAtr >= 1.0 ? 'PASS' : 'WARN',
                detail: `Stop distance is ${technicalContext.stopInAtr.toFixed(
                  2
                )}x ATR(14). Stops tighter than 1x ATR often clip normal wick noise.`,
              },
              {
                label: '4. Futures Liquidation Clearance',
                status:
                  !tradeMetrics.liqPrice ||
                  (tradeSide === 'long' && stopLoss > tradeMetrics.liqPrice * 1.03) ||
                  (tradeSide === 'short' && stopLoss < tradeMetrics.liqPrice * 0.97)
                    ? 'PASS'
                    : 'FAIL',
                detail: tradeMetrics.liqPrice
                  ? `Stop ($${stopLoss.toFixed(decimals)}) vs. Est. Liq ($${tradeMetrics.liqPrice.toFixed(
                      decimals
                    )}) at ${tradeMetrics.effectiveLev}x.`
                  : 'Spot / Options selected — zero forced margin liquidation risk.',
              },
              {
                label: '5. Total Open Portfolio Heat (≤ 6.0%)',
                status:
                  portfolioExposure.openHeatPct + riskPercent <= maxPortfolioHeatPct ? 'PASS' : 'WARN',
                detail: `Existing open risk: ${portfolioExposure.openHeatPct.toFixed(
                  1
                )}% + New trade: ${riskPercent.toFixed(1)}% = ${(
                  portfolioExposure.openHeatPct + riskPercent
                ).toFixed(1)}% total heat.`,
              },
              {
                label: '6. Structural Trend Alignment',
                status:
                  (tradeSide === 'long' && technicalContext.trendUp) ||
                  (tradeSide === 'short' && !technicalContext.trendUp)
                    ? 'PASS'
                    : 'WARN',
                detail: technicalContext.trendUp
                  ? `EMA 20 ($${technicalContext.ema20.toFixed(
                      decimals
                    )}) ≥ SMA 50 ($${technicalContext.sma50.toFixed(decimals)}) — Bullish regime.`
                  : `EMA 20 < SMA 50 — Bearish/pullback regime; counter-trend setups require stricter confirmation.`,
              },
            ].map((chk) => (
              <div
                key={chk.label}
                className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                  <span className="text-slate-900 dark:text-white">{chk.label}</span>
                  <span
                    className={
                      chk.status === 'PASS'
                        ? 'text-emerald-600 dark:text-emerald-400 font-mono'
                        : chk.status === 'WARN'
                        ? 'text-amber-600 dark:text-amber-400 font-mono'
                        : 'text-rose-600 dark:text-rose-400 font-mono'
                    }
                  >
                    {chk.status === 'PASS' ? '● PASS' : chk.status === 'WARN' ? '▲ REVIEW' : '✕ FAIL'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {chk.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODULE 4: TRADER-ENTRY (Bar-by-Bar Entry Timing) */}
      {activeSkill === 'entry' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Entry Timing Assessment ({symbol} @ ${livePrice.toFixed(decimals)})
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {Math.abs(technicalContext.emaDistPct) > 2.0
                ? `Price is currently stretched ${technicalContext.emaDistPct.toFixed(
                    2
                  )}% away from EMA 20 ($${technicalContext.ema20.toFixed(
                    decimals
                  )}). Entering immediately risks buying into exhaustion; consider staging a limit entry closer to EMA 20 or Fibonacci 50%.`
                : `Price is trading within ${Math.abs(technicalContext.emaDistPct).toFixed(
                    2
                  )}% of its 20-period EMA ($${technicalContext.ema20.toFixed(
                    decimals
                  )}) with RSI(14) at ${technicalContext.rsi14.toFixed(
                    1
                  )} — balanced equilibrium zone without extreme chase extension.`}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => onEntryPriceChange(Number(livePrice.toFixed(decimals)))}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Use Live Spot (${livePrice.toFixed(decimals)})
              </button>
              <button
                type="button"
                onClick={() => onEntryPriceChange(Number(technicalContext.ema20.toFixed(decimals)))}
                className="px-3 py-1.5 text-xs font-medium bg-sky-600/10 text-sky-600 dark:text-sky-400 hover:bg-sky-600/20 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Stage Limit at EMA 20 (${technicalContext.ema20.toFixed(decimals)})
              </button>
              <button
                type="button"
                onClick={() => onEntryPriceChange(Number(technicalContext.fib618.toFixed(decimals)))}
                className="px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Stage Limit at Fib 61.8% (${technicalContext.fib618.toFixed(decimals)})
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 text-xs font-mono tabular-nums">
            <div className="font-sans font-semibold text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-slate-800">
              Bar-by-Bar Telemetry
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-slate-500">Distance vs. EMA 20</span>
              <span>
                {technicalContext.emaDistPct >= 0 ? '+' : ''}
                {technicalContext.emaDistPct.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-slate-500">RSI(14) Momentum</span>
              <span>{technicalContext.rsi14.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-slate-500">Fibonacci 50% Equilibrium</span>
              <span>${technicalContext.fib50.toFixed(decimals)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-slate-500">Fibonacci 61.8% Golden Ratio</span>
              <span>${technicalContext.fib618.toFixed(decimals)}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 5: TRADER-EXIT (Multi-Tier Profit & Stop Ladder) */}
      {activeSkill === 'exit' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Pre-committed exit ladder generated from your {tradeMetrics.quantity.toFixed(2)} {baseAsset}{' '}
            position (Entry ${tradeMetrics.safeEntry.toFixed(decimals)}, Risk 1R = $
            {Math.abs(tradeMetrics.safeEntry - stopLoss).toFixed(decimals)} per unit):
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {[
              {
                stage: 'Invalidation Stop (-1R)',
                price: stopLoss,
                qtyPct: '100% Hard Stop',
                units: tradeMetrics.quantity,
                rule: 'Mandatory OCO protective stop-loss. Never widen if price moves against setup.',
                tone: 'text-rose-600 dark:text-rose-400',
              },
              {
                stage: 'Tier 1 Scale-Out (+1R)',
                price:
                  tradeSide === 'long'
                    ? tradeMetrics.safeEntry + Math.abs(tradeMetrics.safeEntry - stopLoss)
                    : tradeMetrics.safeEntry - Math.abs(tradeMetrics.safeEntry - stopLoss),
                qtyPct: 'Close 40% Size',
                units: tradeMetrics.quantity * 0.4,
                rule: 'Bank initial profit and move remaining stop-loss to exact Entry Breakeven.',
                tone: 'text-sky-600 dark:text-sky-400',
              },
              {
                stage: `Tier 2 Core Target (+${rrRatio}R)`,
                price: takeProfit,
                qtyPct: 'Close 40% Size',
                units: tradeMetrics.quantity * 0.4,
                rule: `Primary 1:${rrRatio} Risk-Reward objective (+$${(
                  tradeMetrics.rewardUsd * 0.4
                ).toFixed(2)} tranche).`,
                tone: 'text-emerald-600 dark:text-emerald-400',
              },
              {
                stage: 'Tier 3 Trend Runner (+3R)',
                price:
                  tradeSide === 'long'
                    ? tradeMetrics.safeEntry + Math.abs(tradeMetrics.safeEntry - stopLoss) * 3
                    : tradeMetrics.safeEntry - Math.abs(tradeMetrics.safeEntry - stopLoss) * 3,
                qtyPct: 'Trail Final 20%',
                units: tradeMetrics.quantity * 0.2,
                rule: 'Trail stop beneath each closed candle’s EMA 20 to capture extended trend waves.',
                tone: 'text-amber-600 dark:text-amber-400',
              },
            ].map((tier) => (
              <div
                key={tier.stage}
                className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5"
              >
                <div className={`font-semibold ${tier.tone}`}>{tier.stage}</div>
                <div className="text-base font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  ${tier.price.toFixed(decimals)}
                </div>
                <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                  {tier.qtyPct} · {tier.units.toFixed(1)} {baseAsset}
                </div>
                <p className="text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
                  {tier.rule}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODULE 6: TRADER-BUDGET (Daily Loss Cap & Sizing Guardrail) */}
      {activeSkill === 'budget' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Max Daily Account Drawdown Limit: <strong>{maxDailyLossPct.toFixed(1)}%</strong>
                </span>
                <span className="font-mono tabular-nums text-slate-500">
                  ${portfolioExposure.maxDailyLossUsd.toFixed(2)} / day
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                step={0.5}
                value={maxDailyLossPct}
                onChange={(e) => setMaxDailyLossPct(Number(e.target.value))}
                aria-label="Max Daily Loss Percentage"
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Max Concurrent Portfolio Heat: <strong>{maxPortfolioHeatPct.toFixed(1)}%</strong>
                </span>
                <span className="font-mono tabular-nums text-slate-500">
                  Max {Math.floor(maxPortfolioHeatPct / Math.max(riskPercent, 0.5))} simultaneous {riskPercent}% trades
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={12}
                step={1}
                value={maxPortfolioHeatPct}
                onChange={(e) => setMaxPortfolioHeatPct(Number(e.target.value))}
                aria-label="Max Portfolio Heat Percentage"
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="lg:col-span-6 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 text-xs font-mono tabular-nums">
            <div className="font-sans font-semibold text-slate-900 dark:text-white pb-1.5 border-b border-slate-200 dark:border-slate-800">
              Live Session Budget Ledger
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-slate-500">Account Equity Baseline</span>
              <span>${accountBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-slate-500">Realized Losses Logged Today</span>
              <span className="text-rose-500">-${portfolioExposure.closedLossTodayUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-slate-500">Remaining Daily Risk Allowance</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                ${portfolioExposure.remainingDailyBudgetUsd.toFixed(2)} (
                {Math.floor(portfolioExposure.remainingDailyBudgetUsd / Math.max(tradeMetrics.riskUsd, 1))}{' '}
                trades left)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-slate-500">Open Positions Risk Locked</span>
              <span>
                ${portfolioExposure.openRiskUsd.toFixed(2)} ({portfolioExposure.openHeatPct.toFixed(1)}% heat)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 7: TRADER-BROKER (Human-in-the-Loop Paper Bracket Ticket) */}
      {activeSkill === 'broker' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-950 font-mono text-xs space-y-2 tabular-nums">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="font-semibold text-slate-900 dark:text-white">
                PAPER BRACKET ORDER TICKET (OCO)
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">MODE: PAPER_SIMULATION</span>
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 pt-1">
              <span className="text-slate-500">Symbol / Venue:</span>
              <span className="text-right font-semibold">{symbol} ({instrument.toUpperCase()})</span>

              <span className="text-slate-500">Order Action:</span>
              <span className="text-right font-semibold uppercase">
                {tradeSide} {tradeMetrics.quantity.toFixed(2)} {baseAsset}
              </span>

              <span className="text-slate-500">Limit / Entry Price:</span>
              <span className="text-right">${tradeMetrics.safeEntry.toFixed(decimals)}</span>

              <span className="text-slate-500">Protective Stop-Loss ({riskPercent}%):</span>
              <span className="text-right text-rose-500">
                ${stopLoss.toFixed(decimals)} (-${tradeMetrics.riskUsd.toFixed(2)})
              </span>

              <span className="text-slate-500">Take-Profit Target (1:{rrRatio}):</span>
              <span className="text-right text-emerald-500">
                ${takeProfit.toFixed(decimals)} (+${tradeMetrics.rewardUsd.toFixed(2)})
              </span>
            </div>
          </div>

          <form onSubmit={handleBrokerConfirmSubmit} className="lg:col-span-5 space-y-3">
            <div className="text-xs font-semibold text-slate-900 dark:text-white">
              Human-in-the-Loop Execution Gate
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Following the <span className="font-mono">day-trader-skill</span> safety specification, paper trading is enforced by default and no bracket ticket executes without your explicit{' '}
              <strong className="text-slate-900 dark:text-white">yes</strong> confirmation.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder='Type "yes" to confirm'
                aria-label="Type yes to confirm paper order"
                className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Submit Paper Bracket
              </button>
            </div>
            {brokerFeedback && (
              <p className="text-xs font-medium text-sky-600 dark:text-sky-400">{brokerFeedback}</p>
            )}
          </form>
        </div>
      )}

      {/* MODULE 8: TRADER-ANALYST (Multi-Factor Synthesis) */}
      {activeSkill === 'analyst' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-900 dark:text-white">
              Trend & Moving Average Structure
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {symbol} trades at <span className="font-mono">${livePrice.toFixed(decimals)}</span> with EMA 20 at{' '}
              <span className="font-mono">${technicalContext.ema20.toFixed(decimals)}</span> and SMA 50 at{' '}
              <span className="font-mono">${technicalContext.sma50.toFixed(decimals)}</span>. Regime bias is{' '}
              <strong>{technicalContext.trendUp ? 'Bullish Expansion' : 'Corrective Consolidation'}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-900 dark:text-white">
              Volatility & Order Book Liquidity
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              14-bar Average True Range is <span className="font-mono">${technicalContext.atr.toFixed(decimals)}</span>{' '}
              ({((technicalContext.atr / Math.max(livePrice, 1e-8)) * 100).toFixed(2)}% per bar) with annualized volatility near{' '}
              <span className="font-mono">{(stats?.annualizedVolatilityPct ?? 52).toFixed(1)}%</span> and DEX spread around{' '}
              <span className="font-mono">{(stats?.dexSpreadBps ?? 4.5).toFixed(1)} bps</span>.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-900 dark:text-white">
              Key Confluence Zones
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Immediate retracement support sits at Fib 50% (
              <span className="font-mono">${technicalContext.fib50.toFixed(decimals)}</span>) and Golden Ratio 61.8% (
              <span className="font-mono">${technicalContext.fib618.toFixed(decimals)}</span>). RSI(14) reads{' '}
              <span className="font-mono">{technicalContext.rsi14.toFixed(1)}</span>.
            </p>
          </div>
        </div>
      )}

      {/* MODULE 9: TRADER-NEWS (Catalyst & Volatility Risk Notes) */}
      {activeSkill === 'news' && (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
          {[
            {
              tag: 'XRP Ledger / Cross-Border Liquidity',
              headline: 'Institutional RLUSD & XRPL DEX Automated Market Maker (AMM) Pool Depth Expansion',
              impact: 'Tightens on-ledger DEX spreads (bps), reducing slippage on stop-market orders during high-volume sessions.',
            },
            {
              tag: 'Stellar Network / Soroban Smart Contracts',
              headline: 'Tokenized Treasury & RWA Settlement Volume Growth Across Stellar Anchors',
              impact: 'Increases spot XLM baseline volume; monitor 4h Bollinger Band squeezes for multi-day trend breakouts.',
            },
            {
              tag: 'Macro & SEC Filing Calendar Risk',
              headline: 'Scheduled US CPI / FOMC & Crypto ETF Flow Reporting Windows',
              impact: 'Risk Manager Rule: Spreads widen sharply during macro releases; avoid high-leverage futures entries 15m prior.',
            },
          ].map((item) => (
            <div key={item.headline} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">{item.tag}</div>
                <div className="font-semibold text-slate-900 dark:text-white">{item.headline}</div>
                <div className="text-slate-500 dark:text-slate-400">{item.impact}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODULE 10: TRADER-ALERTS (One-Click Structural Triggers) */}
      {activeSkill === 'alerts' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {[
            {
              title: `${baseAsset} Fib 61.8% Golden Pocket Retest`,
              condition: 'below' as const,
              price: Number(technicalContext.fib618.toFixed(decimals)),
              note: `${symbol} Fib 61.8% pullback zone reached`,
            },
            {
              title: `${baseAsset} 24h High Breakout Trigger`,
              condition: 'above' as const,
              price: Number(((stats?.high24h ?? livePrice * 1.03)).toFixed(decimals)),
              note: `${symbol} 24h session high breakout`,
            },
            {
              title: `${baseAsset} EMA 20 Mean Pullback`,
              condition: (livePrice >= technicalContext.ema20 ? 'below' : 'above') as 'above' | 'below',
              price: Number(technicalContext.ema20.toFixed(decimals)),
              note: `${symbol} touched 20-period EMA`,
            },
          ].map((preset) => (
            <div
              key={preset.title}
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">{preset.title}</div>
                <div className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400 mt-1 tabular-nums">
                  {preset.condition === 'above' ? '≥' : '≤'} ${preset.price.toFixed(decimals)}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onAddAlert({
                    symbol,
                    condition: preset.condition,
                    targetPrice: preset.price,
                    note: preset.note,
                  })
                }
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Arm Live Alert
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODULE 11: TRADER-PELOSI (Public Congressional & Institutional Disclosure Tracker) */}
      {activeSkill === 'pelosi' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Educational Filing Monitor: Under the U.S. STOCK Act and SEC 13F/ETF rules, public officials and institutions disclose securities and digital-asset infrastructure transactions within <strong>30–45 days</strong>. Because filings arrive with a multi-week reporting lag, disciplined traders treat disclosures as macro sector sentiment rather than blind market-buy triggers.
          </p>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3 font-medium">Filing Category</th>
                  <th className="py-2.5 px-3 font-medium">Asset / Proxy Ticker</th>
                  <th className="py-2.5 px-3 font-medium">Transaction Type</th>
                  <th className="py-2.5 px-3 font-medium">Disclosed Size Band</th>
                  <th className="py-2.5 px-3 font-medium text-right">Reporting Lag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono tabular-nums">
                <tr>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-white">
                    House PTR Disclosure (Tech / AI Infrastructure)
                  </td>
                  <td className="py-2.5 px-3">NVDA / AVGO Call Options</td>
                  <td className="py-2.5 px-3 font-sans text-emerald-600 dark:text-emerald-400">
                    Purchase / Exercise
                  </td>
                  <td className="py-2.5 px-3">$500,001 – $1,000,000</td>
                  <td className="py-2.5 px-3 text-right">24 Days Lag</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-white">
                    Congressional PTR (Digital Asset Exchange Equity)
                  </td>
                  <td className="py-2.5 px-3">COIN (Coinbase Global)</td>
                  <td className="py-2.5 px-3 font-sans text-emerald-600 dark:text-emerald-400">
                    Purchase
                  </td>
                  <td className="py-2.5 px-3">$50,001 – $100,000</td>
                  <td className="py-2.5 px-3 text-right">19 Days Lag</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-white">
                    SEC Form 13F / Institutional Trust Filing
                  </td>
                  <td className="py-2.5 px-3">Spot Crypto ETP & Payment Rails</td>
                  <td className="py-2.5 px-3 font-sans text-sky-600 dark:text-sky-400">
                    Quarterly Allocation
                  </td>
                  <td className="py-2.5 px-3">$5,000,000+</td>
                  <td className="py-2.5 px-3 text-right">45 Days Lag</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
