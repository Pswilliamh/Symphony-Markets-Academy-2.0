import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Crosshair,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  AssetSymbol,
  Candle,
  FibonacciLevel,
  MarketStats,
  Timeframe,
} from '../types/market';

interface LiveAiSignalHelperProps {
  symbol: AssetSymbol;
  onSelectSymbol: (sym: AssetSymbol) => void;
  timeframe: Timeframe;
  candles: Candle[];
  stats: MarketStats | null;
  fibLevels: FibonacciLevel[];
  livePrice: number;
  btcLivePrice?: number;
  xrpLivePrice: number;
  xlmLivePrice: number;
  accountBalance: number;
  riskPercent: number;
  onApplyRecommendationToChart?: (params: {
    entryPrice: number;
    stopDistancePct: number;
    rrRatio: number;
  }) => void;
}

interface AiScanResponse {
  marketVerdict: 'BUY_ZONE_ACTIVE' | 'WAIT_FOR_PULLBACK_BUY' | 'SELL_RESISTANCE_ALERT';
  verdictHeadline: string;
  recommendedBuy1: number;
  recommendedBuy1Note: string;
  recommendedBuy2: number;
  recommendedBuy2Note: string;
  recommendedStopLoss: number;
  stopLossNote: string;
  recommendedSell1: number;
  recommendedSell2: number;
  recommendedSell3: number;
  sellStrategyNote: string;
  liveMarketWhy: string;
  riskDisclaimer: string;
}

export const LiveAiSignalHelper: React.FC<LiveAiSignalHelperProps> = ({
  symbol,
  onSelectSymbol,
  timeframe,
  candles,
  stats,
  fibLevels,
  livePrice,
  btcLivePrice = 91450,
  xrpLivePrice = 2.42,
  xlmLivePrice = 0.415,
  accountBalance,
  riskPercent,
  onApplyRecommendationToChart,
}) => {
  const [riskAcknowledged, setRiskAcknowledged] = useState<boolean>(true);
  const [isScanningAi, setIsScanningAi] = useState<boolean>(false);
  const [aiScanResult, setAiScanResult] = useState<AiScanResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [lastScannedSymbol, setLastScannedSymbol] = useState<AssetSymbol | null>(null);

  const isBtc = symbol === 'BTCUSDT';
  const priceDecimals = isBtc ? 2 : 4;
  const coinName = symbol === 'BTCUSDT' ? 'BTC' : symbol === 'XRPUSDT' ? 'XRP' : 'XLM';

  const fmtPrice = (val: number) =>
    isBtc
      ? val.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : val.toFixed(4);

  // Real-time deterministic technical computation from the live candle stream
  const liveQuantLevels = useMemo(() => {
    const safePrice =
      livePrice > 0
        ? livePrice
        : symbol === 'BTCUSDT'
        ? 91450
        : symbol === 'XRPUSDT'
        ? 2.42
        : 0.415;
    const recent = candles.slice(-24);
    const high24h =
      stats?.high24h ??
      (recent.length > 0 ? Math.max(...recent.map((c) => c.high)) : safePrice * 1.035);
    const low24h =
      stats?.low24h ??
      (recent.length > 0 ? Math.min(...recent.map((c) => c.low)) : safePrice * 0.965);

    const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
    const ema20 = lastCandle?.ema20 ?? safePrice * 0.996;
    const sma50 = lastCandle?.sma50 ?? safePrice * 0.989;

    // 14-bar RSI calculation
    let gains = 0;
    let losses = 0;
    const rsiSlice = candles.slice(-15);
    for (let i = 1; i < rsiSlice.length; i++) {
      const diff = rsiSlice[i].close - rsiSlice[i - 1].close;
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const rs = losses === 0 ? 1.5 : gains / losses;
    const rsi14 = Math.min(88, Math.max(18, 100 - 100 / (1 + rs)));

    // Extract Fibonacci retracement levels if available
    const fib382 =
      fibLevels.find((f) => Math.abs(f.ratio - 0.382) < 0.02)?.price ??
      high24h - (high24h - low24h) * 0.382;
    const fib500 =
      fibLevels.find((f) => Math.abs(f.ratio - 0.5) < 0.02)?.price ??
      high24h - (high24h - low24h) * 0.5;
    const fib618 =
      fibLevels.find((f) => Math.abs(f.ratio - 0.618) < 0.02)?.price ??
      high24h - (high24h - low24h) * 0.618;
    const fib786 =
      fibLevels.find((f) => Math.abs(f.ratio - 0.786) < 0.02)?.price ??
      high24h - (high24h - low24h) * 0.786;

    // Determine primary Buy 1, Buy 2, Stop-Loss, and Sell 1/2/3 levels
    const buyPoint1 = Number(
      Math.min(safePrice * 0.995, Math.max(fib500, fib618)).toFixed(priceDecimals)
    );
    const buyPoint2 = Number(Math.min(buyPoint1 * 0.985, fib786).toFixed(priceDecimals));
    const stopLoss = Number((buyPoint1 * 0.98).toFixed(priceDecimals)); // 2.0% stop distance from Buy 1
    const riskPerCoin = Math.max(safePrice * 0.005, buyPoint1 - stopLoss);

    const sellPoint1 = Number((buyPoint1 + riskPerCoin * 1.5).toFixed(priceDecimals)); // 1:1.5 R:R
    const sellPoint2 = Number((buyPoint1 + riskPerCoin * 2.0).toFixed(priceDecimals)); // 1:2.0 R:R
    const sellPoint3 = Number(
      Math.max(high24h * 1.012, buyPoint1 + riskPerCoin * 3.0).toFixed(priceDecimals)
    ); // 1:3.0 R:R

    // Position in 24h range (0% = low24h, 100% = high24h)
    const rangeSpan = Math.max(0.0001, high24h - low24h);
    const rangePct = Math.min(100, Math.max(0, ((safePrice - low24h) / rangeSpan) * 100));

    // Determine live posture verdict
    let verdict: 'BUY_ZONE_ACTIVE' | 'WAIT_FOR_PULLBACK_BUY' | 'SELL_RESISTANCE_ALERT' =
      'WAIT_FOR_PULLBACK_BUY';
    let verdictLabel = 'WAIT FOR PULLBACK TO BUY ZONE 1';
    let verdictSummary = `Live ${coinName} is trading in the middle of its range (${rangePct.toFixed(0)}% of 24h range). Avoid chasing; stage limit orders at Buy Point 1 ($${buyPoint1.toLocaleString(undefined, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })}).`;

    if (rsi14 <= 43 || rangePct <= 38) {
      verdict = 'BUY_ZONE_ACTIVE';
      verdictLabel = 'BUY ZONE ACTIVE (NEAR FIBONACCI SUPPORT FLOOR)';
      verdictSummary = `Live ${coinName} is resting near its Fibonacci pullback support floor (${rangePct.toFixed(0)}% of 24h range, RSI ${rsi14.toFixed(1)}). Favorable 1:2 risk-to-reward zone with Stop-Loss at $${stopLoss.toLocaleString(undefined, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })}.`;
    } else if (rsi14 >= 67 || rangePct >= 78) {
      verdict = 'SELL_RESISTANCE_ALERT';
      verdictLabel = 'NEAR CEILING / SELL RESISTANCE ZONE — DO NOT CHASE';
      verdictSummary = `Live ${coinName} is near its 24-hour ceiling (${rangePct.toFixed(0)}% of range, RSI ${rsi14.toFixed(1)}). High risk of pullback—harvest profits near Sell Points or wait for a dip back to $${buyPoint1.toLocaleString(undefined, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })}.`;
    }

    const latestPatternName = lastCandle?.detectedPattern
      ? `${lastCandle.detectedPattern.name} (${lastCandle.detectedPattern.bias})`
      : 'Standard Trend Bar (No Extreme Reversal Wick)';

    const riskDollars = Number(((accountBalance * riskPercent) / 100).toFixed(2));
    const rewardDollarsTp2 = Number((riskDollars * 2).toFixed(2));

    return {
      safePrice,
      high24h,
      low24h,
      ema20,
      sma50,
      rsi14,
      fib382,
      fib500,
      fib618,
      buyPoint1,
      buyPoint2,
      stopLoss,
      sellPoint1,
      sellPoint2,
      sellPoint3,
      rangePct,
      verdict,
      verdictLabel,
      verdictSummary,
      latestPatternName,
      riskDollars,
      rewardDollarsTp2,
    };
  }, [candles, stats, fibLevels, livePrice, symbol, accountBalance, riskPercent, priceDecimals, coinName]);

  // Combine deterministic live levels with AI Deep Scan overrides when available for the current symbol
  const activeSignal = useMemo(() => {
    if (aiScanResult && lastScannedSymbol === symbol) {
      return {
        verdict: aiScanResult.marketVerdict,
        verdictHeadline: aiScanResult.verdictHeadline,
        buy1: Number(aiScanResult.recommendedBuy1 || liveQuantLevels.buyPoint1),
        buy1Note: aiScanResult.recommendedBuy1Note,
        buy2: Number(aiScanResult.recommendedBuy2 || liveQuantLevels.buyPoint2),
        buy2Note: aiScanResult.recommendedBuy2Note,
        stopLoss: Number(aiScanResult.recommendedStopLoss || liveQuantLevels.stopLoss),
        stopLossNote: aiScanResult.stopLossNote,
        sell1: Number(aiScanResult.recommendedSell1 || liveQuantLevels.sellPoint1),
        sell2: Number(aiScanResult.recommendedSell2 || liveQuantLevels.sellPoint2),
        sell3: Number(aiScanResult.recommendedSell3 || liveQuantLevels.sellPoint3),
        sellStrategyNote: aiScanResult.sellStrategyNote,
        liveMarketWhy: aiScanResult.liveMarketWhy,
        riskDisclaimer: aiScanResult.riskDisclaimer,
        isAiEnhanced: true,
      };
    }

    return {
      verdict: liveQuantLevels.verdict,
      verdictHeadline: liveQuantLevels.verdictSummary,
      buy1: liveQuantLevels.buyPoint1,
      buy1Note: `Aligns with the 50%–61.8% Fibonacci Golden Pocket support ($${liveQuantLevels.fib618.toLocaleString(undefined, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })}) where institutional buyers historically step in on pullbacks.`,
      buy2: liveQuantLevels.buyPoint2,
      buy2Note: `Deep-value limit catcher near the lower 78.6% swing floor in case a fast stop-hunt wick sweeps lower before bouncing.`,
      stopLoss: liveQuantLevels.stopLoss,
      stopLossNote: `Placed 2.0% below Buy Point 1. Caps your maximum loss at $${liveQuantLevels.riskDollars.toFixed(2)} (${riskPercent}% of your $${accountBalance} wallet) if support breaks.`,
      sell1: liveQuantLevels.sellPoint1,
      sell2: liveQuantLevels.sellPoint2,
      sell3: liveQuantLevels.sellPoint3,
      sellStrategyNote: `Scale out in 3 calm steps: sell 33% at Sell Point 1 ($${liveQuantLevels.sellPoint1.toLocaleString(undefined, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })}) and move your stop to breakeven; sell 33% at Sell Point 2 ($${liveQuantLevels.sellPoint2.toLocaleString(undefined, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })} for +$${liveQuantLevels.rewardDollarsTp2.toFixed(2)}); let the final 34% ride toward Sell Point 3 ($${liveQuantLevels.sellPoint3.toLocaleString(undefined, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })}).`,
      liveMarketWhy: `${coinName}/USDT is currently trading at $${liveQuantLevels.safePrice.toLocaleString(undefined, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })} with 20 EMA at $${liveQuantLevels.ema20.toLocaleString(undefined, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })}, 50 SMA at $${liveQuantLevels.sma50.toLocaleString(undefined, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })}, and 14-bar RSI at ${liveQuantLevels.rsi14.toFixed(1)}. Latest candle clue: ${liveQuantLevels.latestPatternName}.`,
      riskDisclaimer:
        'USE AT YOUR OWN RISK: These Buy, Stop-Loss, and Sell points are algorithmic technical zones calculated from live chart structure. Markets can break any level on sudden macro news—never risk more than 2% ($0.10 per $5) on a single setup and never use high leverage.',
      isAiEnhanced: false,
    };
  }, [
    aiScanResult,
    lastScannedSymbol,
    symbol,
    liveQuantLevels,
    accountBalance,
    riskPercent,
    priceDecimals,
    coinName,
  ]);

  const handleRunDeepAiScan = async () => {
    setIsScanningAi(true);
    setAiError(null);
    try {
      const recentSummary = candles
        .slice(-6)
        .map(
          (c) =>
            `[O:${c.open.toFixed(priceDecimals)} H:${c.high.toFixed(priceDecimals)} L:${c.low.toFixed(priceDecimals)} C:${c.close.toFixed(priceDecimals)}]`
        )
        .join(' -> ');

      const response = await fetch('/api/ai-buy-sell-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          timeframe,
          livePrice: Number(liveQuantLevels.safePrice.toFixed(priceDecimals)),
          high24h: Number(liveQuantLevels.high24h.toFixed(priceDecimals)),
          low24h: Number(liveQuantLevels.low24h.toFixed(priceDecimals)),
          ema20: Number(liveQuantLevels.ema20.toFixed(priceDecimals)),
          sma50: Number(liveQuantLevels.sma50.toFixed(priceDecimals)),
          rsi14: Number(liveQuantLevels.rsi14.toFixed(1)),
          fib382: Number(liveQuantLevels.fib382.toFixed(priceDecimals)),
          fib500: Number(liveQuantLevels.fib500.toFixed(priceDecimals)),
          fib618: Number(liveQuantLevels.fib618.toFixed(priceDecimals)),
          latestPattern: liveQuantLevels.latestPatternName,
          accountBalance,
          riskPercent,
          recentCandlesSummary: recentSummary,
        }),
      });

      const rawText = await response.text();
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        throw new Error(
          'The AI scan server was briefly refreshing. Please click Scan again in a moment.'
        );
      }
      if (!response.ok) {
        throw new Error(
          typeof data.error === 'string' ? data.error : 'Unable to complete AI Buy & Sell scan.'
        );
      }
      setAiScanResult(data as unknown as AiScanResponse);
      setLastScannedSymbol(symbol);
    } catch (err: unknown) {
      setAiError(
        err instanceof Error ? err.message : 'Unexpected error running AI Buy & Sell scan.'
      );
    } finally {
      setIsScanningAi(false);
    }
  };

  // Compute vertical Y coordinate on the SVG ladder (top = highest price, bottom = lowest price)
  const ladderCoordY = (priceVal: number) => {
    const topPrice = Math.max(activeSignal.sell3 * 1.008, liveQuantLevels.safePrice * 1.02);
    const bottomPrice = Math.min(activeSignal.stopLoss * 0.992, liveQuantLevels.safePrice * 0.97);
    const span = Math.max(0.0001, topPrice - bottomPrice);
    const ratio = (topPrice - priceVal) / span;
    return Math.min(242, Math.max(22, 22 + ratio * 220));
  };

  const liveMarkerY = ladderCoordY(liveQuantLevels.safePrice);

  return (
    <section className="rounded-xl border-2 border-amber-400/80 dark:border-amber-400/50 bg-white dark:bg-slate-900 p-5 sm:p-7 space-y-6">
      {/* Top Disclosure Banner: Explicit "Use at Your Own Risk" Financial Advice / Technical Signal Disclaimer */}
      <div className="rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/30 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-bold text-amber-900 dark:text-amber-200">
              LIVE AI BUY & SELL ZONE HELPER — USE AT YOUR OWN RISK DISCLOSURE
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              This AI helper examines the live market state right now (Moving Averages, RSI Momentum, Candlestick Patterns, and Fibonacci Zones) across <strong>BTC</strong>, <strong>XRP</strong>, and <strong>XLM</strong> to recommend specific <strong>Buy Points</strong>, <strong>Safety Stop-Loss Points</strong>, and <strong>Sell (Take-Profit) Points</strong>. Crypto markets are volatile and no algorithm can guarantee future outcomes. <strong>Use these recommended Buy & Sell points strictly at your own risk</strong>, keep your keys in self-custody, and never risk more than <strong>2% ($0.10 per $5)</strong> on any trade.
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white shrink-0 cursor-pointer select-none bg-white dark:bg-slate-900 px-3.5 py-2 rounded-lg border border-amber-300 dark:border-amber-500/40">
          <input
            type="checkbox"
            checked={riskAcknowledged}
            onChange={(e) => setRiskAcknowledged(e.target.checked)}
            className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
          />
          <span>I Understand — Use at My Own Risk</span>
        </label>
      </div>

      {/* Header & Asset / AI Scan Controls */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Crosshair className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Real-Time Technical Signal Desk (BTC · XRP · XLM)</span>
            <span aria-hidden="true">·</span>
            <span>Timeframe: {timeframe.toUpperCase()}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">
              {activeSignal.isAiEnhanced
                ? '★ Gemini AI Deep Scan Active'
                : '● Live Algorithmic Feed Active'}
            </span>
          </div>
          <h2 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Live AI Market Examiner: Recommended Buy, Stop-Loss & Sell Points
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Coin Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onSelectSymbol('BTCUSDT')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                symbol === 'BTCUSDT'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              BTC (${(btcLivePrice || 91450).toLocaleString(undefined, { maximumFractionDigits: 0 })})
            </button>
            <button
              type="button"
              onClick={() => onSelectSymbol('XRPUSDT')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                symbol === 'XRPUSDT'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              XLM (${(xlmLivePrice || 0.415).toFixed(4)})
            </button>
          </div>

          {/* Deep Gemini AI Scan Trigger */}
          <button
            type="button"
            disabled={isScanningAi || !riskAcknowledged}
            onClick={handleRunDeepAiScan}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {isScanningAi ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning Live Candles with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run Deep AI Market Scan Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {aiError && (
        <div className="p-3.5 rounded-lg border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-800 dark:text-rose-200">
          {aiError} (Showing live algorithmic Fibonacci & EMA levels below.)
        </div>
      )}

      {!riskAcknowledged ? (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-3">
          <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            Please Check “I Understand — Use at My Own Risk” Above to Unlock Live Buy & Sell Points
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            Checking the box confirms you understand these recommended Buy, Stop-Loss, and Sell points are probabilistic technical zones and that you remain in 100% self-custody control of your own decisions.
          </p>
        </div>
      ) : (
        <>
          {/* Live Verdict Banner */}
          <div
            className={`p-4 sm:p-5 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
              activeSignal.verdict === 'BUY_ZONE_ACTIVE'
                ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/25'
                : activeSignal.verdict === 'SELL_RESISTANCE_ALERT'
                ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50/60 dark:bg-rose-950/25'
                : 'border-sky-300 dark:border-sky-500/40 bg-sky-50/60 dark:bg-sky-950/25'
            }`}
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
                <span
                  className={
                    activeSignal.verdict === 'BUY_ZONE_ACTIVE'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : activeSignal.verdict === 'SELL_RESISTANCE_ALERT'
                      ? 'text-rose-700 dark:text-rose-400'
                      : 'text-sky-700 dark:text-sky-400'
                  }
                >
                  LIVE SIGNAL POSTURE: {activeSignal.verdict.replace(/_/g, ' ')}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-600 dark:text-slate-400">
                  Live {coinName}: ${fmtPrice(liveQuantLevels.safePrice)}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-600 dark:text-slate-400">
                  RSI(14): {liveQuantLevels.rsi14.toFixed(1)}
                </span>
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {activeSignal.verdictHeadline}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeSignal.liveMarketWhy}
              </p>
            </div>

            {onApplyRecommendationToChart && (
              <button
                type="button"
                onClick={() => {
                  const stopDistPct = Math.max(
                    0.5,
                    Math.min(
                      10,
                      Number(
                        (
                          (Math.abs(activeSignal.buy1 - activeSignal.stopLoss) /
                            activeSignal.buy1) *
                          100
                        ).toFixed(2)
                      )
                    )
                  );
                  onApplyRecommendationToChart({
                    entryPrice: Number(activeSignal.buy1.toFixed(priceDecimals)),
                    stopDistancePct: stopDistPct,
                    rrRatio: 2,
                  });
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Plot Buy & Sell Lines on Live Chart →
              </button>
            )}
          </div>

          {/* Main 12-Column Split: Visual Price Ladder SVG (Left 5 Cols) + Exact Buy/Stop/Sell Cards (Right 7 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* LEFT 5 COLS: VISUAL BUY & SELL ZONE LADDER DIAGRAM */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-white">
                  Visual Buy & Sell Price Map ({coinName})
                </span>
                <span className="font-mono text-amber-300 tabular-nums">
                  Now: ${fmtPrice(liveQuantLevels.safePrice)}
                </span>
              </div>

              <svg
                viewBox="0 0 420 265"
                className="w-full h-auto"
                role="img"
                aria-label="Visual price ladder showing Recommended Sell Points 1, 2, and 3 at the top, Live Price in the middle, Recommended Buy Points 1 and 2 below, and Safety Stop-Loss at the bottom"
              >
                {/* SELL ZONE BAND (Top Green Profit Harvest Zone) */}
                <rect
                  x="16"
                  y="14"
                  width="388"
                  height="92"
                  rx="6"
                  fill="#10B981"
                  fillOpacity="0.12"
                  stroke="#10B981"
                  strokeOpacity="0.4"
                  strokeWidth="1"
                />
                <text x="26" y="31" fill="#6EE7B7" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  ▲ RECOMMENDED SELL / PROFIT HARVEST ZONES
                </text>

                {/* Sell 3 Line */}
                <line x1="26" y1="45" x2="394" y2="45" stroke="#34D399" strokeWidth="1.5" strokeDasharray="4 3" />
                <text x="30" y="41" fill="#A7F3D0" fontSize="10" fontFamily="monospace">
                  SELL 3 (Breakout 1:3 R:R)
                </text>
                <text x="305" y="41" fill="#6EE7B7" fontSize="10.5" fontWeight="bold" fontFamily="monospace">
                  ${fmtPrice(activeSignal.sell3)}
                </text>

                {/* Sell 2 Line */}
                <line x1="26" y1="72" x2="394" y2="72" stroke="#10B981" strokeWidth="2" />
                <text x="30" y="68" fill="#A7F3D0" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  SELL 2 (Core 1:2 Target)
                </text>
                <text x="305" y="68" fill="#34D399" fontSize="10.5" fontWeight="bold" fontFamily="monospace">
                  ${fmtPrice(activeSignal.sell2)}
                </text>

                {/* Sell 1 Line */}
                <line x1="26" y1="98" x2="394" y2="98" stroke="#34D399" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="30" y="94" fill="#A7F3D0" fontSize="10" fontFamily="monospace">
                  SELL 1 (First 33% Lock-In)
                </text>
                <text x="305" y="94" fill="#A7F3D0" fontSize="10.5" fontWeight="bold" fontFamily="monospace">
                  ${fmtPrice(activeSignal.sell1)}
                </text>

                {/* BUY ZONE BAND (Middle-Lower Cyan/Sky Pullback Zone) */}
                <rect
                  x="16"
                  y="138"
                  width="388"
                  height="68"
                  rx="6"
                  fill="#0EA5E9"
                  fillOpacity="0.14"
                  stroke="#38BDF8"
                  strokeOpacity="0.45"
                  strokeWidth="1"
                />
                <text x="26" y="153" fill="#7DD3FC" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  ● RECOMMENDED BUY / ACCUMULATION ZONES
                </text>

                {/* Buy 1 Line */}
                <line x1="26" y1="172" x2="394" y2="172" stroke="#38BDF8" strokeWidth="2.2" />
                <text x="30" y="168" fill="#E0F2FE" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  BUY POINT 1 (Primary Entry)
                </text>
                <text x="305" y="168" fill="#38BDF8" fontSize="10.5" fontWeight="bold" fontFamily="monospace">
                  ${fmtPrice(activeSignal.buy1)}
                </text>

                {/* Buy 2 Line */}
                <line x1="26" y1="198" x2="394" y2="198" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="4 3" />
                <text x="30" y="194" fill="#BAE6FD" fontSize="10" fontFamily="monospace">
                  BUY POINT 2 (Deep Wick Bid)
                </text>
                <text x="305" y="194" fill="#7DD3FC" fontSize="10.5" fontWeight="bold" fontFamily="monospace">
                  ${fmtPrice(activeSignal.buy2)}
                </text>

                {/* SAFETY STOP-LOSS BAND (Bottom Red Protection Line) */}
                <rect
                  x="16"
                  y="216"
                  width="388"
                  height="38"
                  rx="6"
                  fill="#F43F5E"
                  fillOpacity="0.15"
                  stroke="#F43F5E"
                  strokeOpacity="0.5"
                  strokeWidth="1"
                />
                <line x1="26" y1="242" x2="394" y2="242" stroke="#F43F5E" strokeWidth="2" />
                <text x="30" y="236" fill="#FECDD3" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  ■ SAFETY STOP-LOSS (2% Max Risk)
                </text>
                <text x="305" y="236" fill="#FB7185" fontSize="10.5" fontWeight="bold" fontFamily="monospace">
                  ${fmtPrice(activeSignal.stopLoss)}
                </text>

                {/* DYNAMIC LIVE PRICE POINTER */}
                <g transform={`translate(0, ${Math.min(130, Math.max(108, liveMarkerY))})`}>
                  <rect x="105" y="-11" width="210" height="22" rx="4" fill="#F59E0B" />
                  <text
                    x="210"
                    y="4"
                    textAnchor="middle"
                    fill="#0F172A"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    ★ LIVE NOW: ${fmtPrice(liveQuantLevels.safePrice)}
                  </text>
                </g>
              </svg>

              <div className="text-[11px] text-slate-400 leading-relaxed">
                <strong>Visual Rule:</strong> Wise traders buy in the <strong>Blue Pullback Zone</strong> (`Buy 1` or `Buy 2`), place their safety net at the <strong>Red Stop-Loss Line</strong>, and harvest profits in the <strong>Green Sell Zone</strong> (`Sell 1`, `Sell 2`, `Sell 3`).
              </div>
            </div>

            {/* RIGHT 7 COLS: DETAILED BUY, STOP-LOSS & SELL ACTION CARDS */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
              {/* 1. RECOMMENDED BUY POINTS CARD */}
              <div className="rounded-xl border border-sky-200 dark:border-sky-500/30 bg-sky-50/40 dark:bg-sky-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-800 dark:text-sky-300">
                    <ArrowDownRight className="w-4 h-4 shrink-0" />
                    <span>1. RECOMMENDED BUY POINTS (ENTRY ZONES)</span>
                  </div>
                  <span className="text-[11px] font-mono text-sky-700 dark:text-sky-400">
                    1x Spot Self-Custody
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-500/25 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Buy Point 1 (Primary)
                      </span>
                      <span className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                        ${fmtPrice(activeSignal.buy1)}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {activeSignal.buy1Note}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-500/25 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Buy Point 2 (Deep Value)
                      </span>
                      <span className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                        ${fmtPrice(activeSignal.buy2)}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {activeSignal.buy2Note}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. RECOMMENDED SELL POINTS (3-TIER TAKE PROFIT LADDER) */}
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                    <span>2. RECOMMENDED SELL POINTS (TAKE-PROFIT HARVEST LADDER)</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                    Scale Out in 3 Steps
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-500/25 space-y-1">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Sell Point 1 (Sell 33%)
                    </div>
                    <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      ${fmtPrice(activeSignal.sell1)}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      1.5R Target · Move stop to breakeven
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border-2 border-emerald-500/50 space-y-1">
                    <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      Sell Point 2 (Core 1:2)
                    </div>
                    <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      ${fmtPrice(activeSignal.sell2)}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      2.0R Target (+${liveQuantLevels.rewardDollarsTp2.toFixed(2)} on ${accountBalance})
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-500/25 space-y-1">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Sell Point 3 (Runner 34%)
                    </div>
                    <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      ${fmtPrice(activeSignal.sell3)}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      3.0R Upper Breakout Target
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeSignal.sellStrategyNote}
                </p>
              </div>

              {/* 3. RECOMMENDED SAFETY STOP-LOSS CARD */}
              <div className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>
                      3. RECOMMENDED SAFETY STOP-LOSS EXIT: ${fmtPrice(activeSignal.stopLoss)}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeSignal.stopLossNote}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/30 shrink-0 text-right font-mono tabular-nums">
                  <div className="text-[11px] text-slate-500">Max Risk on ${accountBalance}</div>
                  <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    -${liveQuantLevels.riskDollars.toFixed(2)} ({riskPercent}%)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Self-Custody & Risk Footnote */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{activeSignal.riskDisclaimer}</span>
            </div>
            <div className="font-mono">
              <Target className="w-3.5 h-3.5 inline mr-1 text-sky-500" />
              24h Range: ${fmtPrice(liveQuantLevels.low24h)} – ${fmtPrice(liveQuantLevels.high24h)}
            </div>
          </div>
        </>
      )}
    </section>
  );
};
