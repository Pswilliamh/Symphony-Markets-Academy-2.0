import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';
import {
  AssetSymbol,
  Candle,
  FibonacciLevel,
  Timeframe,
  TradeSide,
} from '../types/market';

interface CandlestickChartProps {
  symbol: AssetSymbol;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  candles: Candle[];
  fibLevels: FibonacciLevel[];
  selectedCandleIndex: number | null;
  onSelectCandle: (index: number) => void;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  tradeSide: TradeSide;
  showFibOverlay: boolean;
  onToggleFibOverlay: () => void;
  showTrendBands: boolean;
  onToggleTrendBands: () => void;
  showRiskOverlay: boolean;
  onToggleRiskOverlay: () => void;
  // Option A — Floating 3-Line Dollar Setup Card + Quick Nudge Controls
  accountBalance?: number;
  riskPercent?: number;
  rrRatio?: number;
  stopDistancePct?: number;
  onEntryPriceChange?: (val: number) => void;
  onStopDistancePctChange?: (val: number) => void;
  onRrRatioChange?: (val: number) => void;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  symbol,
  timeframe,
  onTimeframeChange,
  candles,
  fibLevels,
  selectedCandleIndex,
  onSelectCandle,
  entryPrice,
  stopLoss,
  takeProfit,
  tradeSide,
  showFibOverlay,
  onToggleFibOverlay,
  showTrendBands,
  onToggleTrendBands,
  showRiskOverlay,
  onToggleRiskOverlay,
  accountBalance = 100,
  riskPercent = 2,
  rrRatio = 2,
  stopDistancePct = 2,
  onEntryPriceChange,
  onStopDistancePctChange,
  onRrRatioChange,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);

  const visibleCandles = useMemo(() => candles.slice(-56), [candles]);
  const indexOffset = Math.max(0, candles.length - visibleCandles.length);

  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (visibleCandles.length === 0) {
      return { minPrice: 0, maxPrice: 1, maxVolume: 1 };
    }
    const lows = visibleCandles.map((c) => c.low);
    const highs = visibleCandles.map((c) => c.high);
    if (showRiskOverlay && entryPrice > 0) {
      lows.push(stopLoss, takeProfit, entryPrice);
      highs.push(stopLoss, takeProfit, entryPrice);
    }
    const rawMin = Math.min(...lows);
    const rawMax = Math.max(...highs);
    const pad = (rawMax - rawMin) * 0.1 || 0.01;
    return {
      minPrice: rawMin - pad,
      maxPrice: rawMax + pad,
      maxVolume: Math.max(...visibleCandles.map((c) => c.volume), 1),
    };
  }, [visibleCandles, showRiskOverlay, entryPrice, stopLoss, takeProfit]);

  const width = 920;
  const height = 420;
  const padLeft = 14;
  const padRight = 84;
  const padTop = 20;
  const padBottom = 34;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const priceToY = (p: number) => {
    const ratio = (p - minPrice) / Math.max(maxPrice - minPrice, 1e-8);
    return padTop + plotHeight * (1 - Math.min(1, Math.max(0, ratio)));
  };

  const activeIdx =
    hoveredIndex !== null
      ? hoveredIndex
      : selectedCandleIndex !== null
      ? selectedCandleIndex
      : candles.length - 1;
  const inspectedCandle = candles[activeIdx] || candles[candles.length - 1];

  const decimals = symbol === 'BTCUSDT' ? 2 : 4;
  const safeBudget = Math.max(1, accountBalance || 5);
  const safeRiskPct = Math.max(0.5, riskPercent || 2);
  const safeRr = Math.max(1, rrRatio || 2);
  const maxRiskUsd = safeBudget * (safeRiskPct / 100);
  const potentialRewardUsd = maxRiskUsd * safeRr;

  // Nudge step = 0.25% of current entry price
  const handleNudgeEntry = (dir: 1 | -1) => {
    if (!onEntryPriceChange || entryPrice <= 0) return;
    const step = Math.max(symbol === 'BTCUSDT' ? 25 : 0.0025, entryPrice * 0.0025);
    const next = Number(Math.max(0.0001, entryPrice + dir * step).toFixed(decimals));
    onEntryPriceChange(next);
  };

  const emaPoints = useMemo(() => {
    return visibleCandles
      .map((c, idx) => {
        const x = padLeft + ((idx + 0.5) / visibleCandles.length) * plotWidth;
        const y = priceToY(c.ema20 ?? c.close);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [visibleCandles, minPrice, maxPrice]);

  const smaPoints = useMemo(() => {
    return visibleCandles
      .map((c, idx) => {
        const x = padLeft + ((idx + 0.5) / visibleCandles.length) * plotWidth;
        const y = priceToY(c.sma50 ?? c.close);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [visibleCandles, minPrice, maxPrice]);

  const bbUpperPoints = useMemo(() => {
    return visibleCandles
      .map((c, idx) => {
        const x = padLeft + ((idx + 0.5) / visibleCandles.length) * plotWidth;
        const y = priceToY(c.bbUpper ?? c.high);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [visibleCandles, minPrice, maxPrice]);

  const bbLowerPoints = useMemo(() => {
    return visibleCandles
      .map((c, idx) => {
        const x = padLeft + ((idx + 0.5) / visibleCandles.length) * plotWidth;
        const y = priceToY(c.bbLower ?? c.low);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [visibleCandles, minPrice, maxPrice]);

  // Visual Risk/Reward Box geometry (starts cleanly at ~35% across chart so price history stays crisp on the left)
  const zoneStartX = padLeft + plotWidth * 0.34;
  const zoneWidth = plotWidth * 0.66;
  const yEntry = priceToY(entryPrice);
  const yStop = priceToY(stopLoss);
  const yTarget = priceToY(takeProfit);
  const rewardTop = Math.min(yEntry, yTarget);
  const rewardHeight = Math.max(4, Math.abs(yTarget - yEntry));
  const riskTop = Math.min(yEntry, yStop);
  const riskHeight = Math.max(4, Math.abs(yStop - yEntry));

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 space-y-4">
      {/* Clean Minimal Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            {(['15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  timeframe === tf
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {inspectedCandle && (
            <div className="hidden md:flex items-center gap-2 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              <span>
                Close:{' '}
                <strong
                  className={
                    inspectedCandle.close >= inspectedCandle.open
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }
                >
                  ${inspectedCandle.close.toFixed(decimals)}
                </strong>
              </span>
              {inspectedCandle.detectedPattern && (
                <>
                  <span>·</span>
                  <span className="font-sans font-medium text-amber-600 dark:text-amber-400">
                    {inspectedCandle.detectedPattern.name}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Clean Single "Chart Layers" Toggle Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayerMenu((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>Chart Layers</span>
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 mt-1.5 z-20 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-2 space-y-1 text-xs">
              <button
                type="button"
                onClick={onToggleRiskOverlay}
                className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium flex items-center justify-between cursor-pointer ${
                  showRiskOverlay
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>Green / Red Risk Box</span>
                <span>{showRiskOverlay ? 'ON' : 'OFF'}</span>
              </button>
              <button
                type="button"
                onClick={onToggleFibOverlay}
                className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium flex items-center justify-between cursor-pointer ${
                  showFibOverlay
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>Fibonacci Bands</span>
                <span>{showFibOverlay ? 'ON' : 'OFF'}</span>
              </button>
              <button
                type="button"
                onClick={onToggleTrendBands}
                className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium flex items-center justify-between cursor-pointer ${
                  showTrendBands
                    ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>EMA 20 / SMA 50</span>
                <span>{showTrendBands ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
       * OPTION A: ULTRA-SIMPLE 3-LINE "AT-A-GLANCE" TRADE SETUP CARD
       * Visible cleanly right above candles on mobile & neatly integrated on desktop
       * ==================================================================== */}
      {showRiskOverlay && entryPrice > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-950/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {tradeSide === 'long' ? 'Buy around' : 'Short around'} ${entryPrice.toFixed(decimals)}
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                Target: ${takeProfit.toFixed(decimals)}
              </span>
              <span className="mx-1.5 text-slate-400">·</span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                Stop Loss: ${stopLoss.toFixed(decimals)}
              </span>
              <span className="mx-1.5 text-slate-400">·</span>
              <span className="text-slate-500 dark:text-slate-400">1:{safeRr} R:R</span>
            </div>
          </div>

          <div className="sm:text-right font-mono tabular-nums text-xs space-y-0.5 shrink-0">
            <div className="text-slate-700 dark:text-slate-300">
              Potential:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">
                +${potentialRewardUsd.toFixed(2)}
              </strong>{' '}
              on ${safeBudget.toFixed(0)}
            </div>
            <div className="text-slate-600 dark:text-slate-400">
              Max Risk:{' '}
              <strong className="text-rose-600 dark:text-rose-400">
                -${maxRiskUsd.toFixed(2)}
              </strong>{' '}
              ({safeRiskPct}%)
            </div>
          </div>
        </div>
      )}

      {/* SVG Interactive Chart with Prominent Green Profit Box & Red Risk Box */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[340px] sm:h-[400px] select-none"
          role="img"
          aria-label={`Interactive candlestick chart for ${symbol}`}
        >
          {/* Horizontal Price Grid Lines */}
          {[0.15, 0.35, 0.55, 0.75, 0.9].map((ratio, i) => {
            const p = maxPrice - (maxPrice - minPrice) * ratio;
            const y = priceToY(p);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800/70"
                  strokeDasharray="3 3"
                />
                <text
                  x={width - padRight + 8}
                  y={y + 4}
                  className="fill-slate-400 dark:fill-slate-500 font-mono text-[10px]"
                >
                  ${p.toFixed(decimals)}
                </text>
              </g>
            );
          })}

          {/* Optional Fibonacci Retracement Bands (Off by default for visual simplicity) */}
          {showFibOverlay &&
            fibLevels.map((lvl, idx) => {
              const y = priceToY(lvl.price);
              const nextLvl = fibLevels[idx + 1];
              const nextY = nextLvl ? priceToY(nextLvl.price) : y;
              return (
                <g key={lvl.label}>
                  {nextLvl && (
                    <rect
                      x={padLeft}
                      y={Math.min(y, nextY)}
                      width={plotWidth}
                      height={Math.abs(nextY - y)}
                      fill={lvl.colorHex}
                      fillOpacity={0.045}
                    />
                  )}
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke={lvl.colorHex}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    strokeOpacity={0.65}
                  />
                  <text
                    x={padLeft + 6}
                    y={y - 4}
                    fill={lvl.colorHex}
                    className="font-mono text-[9.5px] font-medium"
                  >
                    Fib {lvl.label} (${lvl.price.toFixed(decimals)})
                  </text>
                </g>
              );
            })}

          {/* OPTION A: Crisp Scantrader-Style Green Profit Zone & Red Stop-Loss Zone */}
          {showRiskOverlay && entryPrice > 0 && (
            <g>
              {/* Vertical Setup Anchor Divider */}
              <line
                x1={zoneStartX}
                y1={padTop}
                x2={zoneStartX}
                y2={height - padBottom}
                stroke="#94A3B8"
                strokeWidth={1}
                strokeDasharray="4 4"
                strokeOpacity={0.6}
              />

              {/* Green Reward Zone Box */}
              <rect
                x={zoneStartX}
                y={rewardTop}
                width={zoneWidth}
                height={rewardHeight}
                fill="#10B981"
                fillOpacity={0.14}
              />
              {/* Red Risk Zone Box */}
              <rect
                x={zoneStartX}
                y={riskTop}
                width={zoneWidth}
                height={riskHeight}
                fill="#F43F5E"
                fillOpacity={0.14}
              />

              {/* Take Profit Line + Right-Axis Solid Price Tag + Inline Dollar Label */}
              <line
                x1={zoneStartX}
                y1={yTarget}
                x2={width - padRight}
                y2={yTarget}
                stroke="#10B981"
                strokeWidth={1.75}
              />
              <rect
                x={zoneStartX + 10}
                y={Math.max(padTop + 4, yTarget - 11)}
                width={158}
                height={20}
                rx={4}
                fill="#059669"
                fillOpacity={0.92}
              />
              <text
                x={zoneStartX + 18}
                y={Math.max(padTop + 17, yTarget + 2)}
                fill="#FFFFFF"
                className="font-mono text-[10px] font-bold"
              >
                TP · +${potentialRewardUsd.toFixed(2)} (1:{safeRr})
              </text>
              <rect
                x={width - padRight + 4}
                y={yTarget - 10}
                width={74}
                height={20}
                rx={4}
                fill="#10B981"
              />
              <text
                x={width - padRight + 10}
                y={yTarget + 4}
                fill="#FFFFFF"
                className="font-mono text-[10px] font-bold"
              >
                ${takeProfit.toFixed(decimals)}
              </text>

              {/* Entry Line + Right-Axis Price Tag */}
              <line
                x1={zoneStartX}
                y1={yEntry}
                x2={width - padRight}
                y2={yEntry}
                stroke="#0284C7"
                strokeWidth={1.75}
              />
              <circle cx={zoneStartX} cy={yEntry} r={4} fill="#0284C7" stroke="#FFFFFF" strokeWidth={1.5} />
              <rect
                x={width - padRight + 4}
                y={yEntry - 10}
                width={74}
                height={20}
                rx={4}
                fill="#0284C7"
              />
              <text
                x={width - padRight + 10}
                y={yEntry + 4}
                fill="#FFFFFF"
                className="font-mono text-[10px] font-bold"
              >
                ${entryPrice.toFixed(decimals)}
              </text>

              {/* Stop Loss Line + Right-Axis Solid Price Tag + Inline Dollar Label */}
              <line
                x1={zoneStartX}
                y1={yStop}
                x2={width - padRight}
                y2={yStop}
                stroke="#E11D48"
                strokeWidth={1.75}
              />
              <rect
                x={zoneStartX + 10}
                y={Math.min(height - padBottom - 22, yStop - 9)}
                width={142}
                height={20}
                rx={4}
                fill="#E11D48"
                fillOpacity={0.92}
              />
              <text
                x={zoneStartX + 18}
                y={Math.min(height - padBottom - 9, yStop + 4)}
                fill="#FFFFFF"
                className="font-mono text-[10px] font-bold"
              >
                SL · -${maxRiskUsd.toFixed(2)} ({safeRiskPct}%)
              </text>
              <rect
                x={width - padRight + 4}
                y={yStop - 10}
                width={74}
                height={20}
                rx={4}
                fill="#E11D48"
              />
              <text
                x={width - padRight + 10}
                y={yStop + 4}
                fill="#FFFFFF"
                className="font-mono text-[10px] font-bold"
              >
                ${stopLoss.toFixed(decimals)}
              </text>
            </g>
          )}

          {/* Optional Trend Lines (Off by default so chart stays ultra-clean) */}
          {showTrendBands && (
            <g>
              <polyline
                fill="none"
                stroke="#38BDF8"
                strokeWidth={1.5}
                points={emaPoints}
                opacity={0.85}
              />
              <polyline
                fill="none"
                stroke="#A855F7"
                strokeWidth={1.4}
                points={smaPoints}
                opacity={0.75}
              />
              <polyline
                fill="none"
                stroke="#64748B"
                strokeWidth={1}
                strokeDasharray="2 2"
                points={bbUpperPoints}
                opacity={0.45}
              />
              <polyline
                fill="none"
                stroke="#64748B"
                strokeWidth={1}
                strokeDasharray="2 2"
                points={bbLowerPoints}
                opacity={0.45}
              />
            </g>
          )}

          {/* Candlesticks & Subtle Volume */}
          {visibleCandles.map((candle, idx) => {
            const globalIdx = indexOffset + idx;
            const slotWidth = plotWidth / visibleCandles.length;
            const xCenter = padLeft + (idx + 0.5) * slotWidth;
            const candleWidth = Math.max(4, Math.min(11, slotWidth * 0.65));

            const isBull = candle.close >= candle.open;
            const color = isBull ? '#10B981' : '#F43F5E';

            const yHigh = priceToY(candle.high);
            const yLow = priceToY(candle.low);
            const yOpen = priceToY(candle.open);
            const yClose = priceToY(candle.close);
            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

            const volHeight = (candle.volume / maxVolume) * 36;
            const isSelected = activeIdx === globalIdx;

            return (
              <g
                key={candle.time}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(globalIdx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSelectCandle(globalIdx)}
              >
                {isSelected && (
                  <line
                    x1={xCenter}
                    y1={padTop}
                    x2={xCenter}
                    y2={height - padBottom}
                    stroke="#38BDF8"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    strokeOpacity={0.55}
                  />
                )}

                <rect
                  x={xCenter - candleWidth / 2}
                  y={height - padBottom - volHeight}
                  width={candleWidth}
                  height={volHeight}
                  fill={color}
                  fillOpacity={0.12}
                />

                <line
                  x1={xCenter}
                  y1={yHigh}
                  x2={xCenter}
                  y2={yLow}
                  stroke={color}
                  strokeWidth={1.35}
                />

                <rect
                  x={xCenter - candleWidth / 2}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={color}
                  rx={1}
                  stroke={isSelected ? '#FACC15' : 'none'}
                  strokeWidth={isSelected ? 1.5 : 0}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Simple Visual Nudge Controls (Adjust Entry, Stop Width, or Reward Ratio in 1 Tap) */}
      {(onEntryPriceChange || onStopDistancePctChange || onRrRatioChange) && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {onEntryPriceChange && (
              <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-1">
                <span className="px-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Move Entry
                </span>
                <button
                  type="button"
                  onClick={() => handleNudgeEntry(-1)}
                  aria-label="Nudge entry price lower"
                  className="p-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeEntry(1)}
                  aria-label="Nudge entry price higher"
                  className="p-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {onStopDistancePctChange && (
              <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-1">
                <span className="px-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Stop
                </span>
                {[1.5, 2, 3].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => onStopDistancePctChange(pct)}
                    className={`px-2 py-1 rounded text-[11px] font-mono font-semibold cursor-pointer ${
                      Math.abs(stopDistancePct - pct) < 0.2
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            )}

            {onRrRatioChange && (
              <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-1">
                <span className="px-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Target
                </span>
                {[2, 3].map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => onRrRatioChange(ratio)}
                    className={`px-2 py-1 rounded text-[11px] font-mono font-semibold cursor-pointer ${
                      rrRatio === ratio
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    1:{ratio}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Green = Reward · Red = Max Risk
          </span>
        </div>
      )}
    </div>
  );
};
