import React, { useMemo, useState } from 'react';
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
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
    const pad = (rawMax - rawMin) * 0.08 || 0.01;
    return {
      minPrice: rawMin - pad,
      maxPrice: rawMax + pad,
      maxVolume: Math.max(...visibleCandles.map((c) => c.volume), 1),
    };
  }, [visibleCandles, showRiskOverlay, entryPrice, stopLoss, takeProfit]);

  const width = 920;
  const height = 420;
  const padLeft = 14;
  const padRight = 76;
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

  const activeFibZone = useMemo(() => {
    if (!inspectedCandle || fibLevels.length < 2) return null;
    for (let i = 0; i < fibLevels.length - 1; i++) {
      const upper = fibLevels[i];
      const lower = fibLevels[i + 1];
      if (inspectedCandle.close <= upper.price && inspectedCandle.close >= lower.price) {
        return lower;
      }
    }
    return fibLevels[Math.floor(fibLevels.length / 2)];
  }, [inspectedCandle, fibLevels]);

  const decimals = symbol === 'BTCUSDT' ? 2 : 4;

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

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            {(['15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  timeframe === tf
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Click any candle to inspect pattern & sentiment</span>
          </div>
        </div>

        {/* Layer Toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleRiskOverlay}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              showRiskOverlay
                ? 'bg-sky-500/10 border-sky-500/40 text-sky-600 dark:text-sky-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            1:2 Risk Target Lines
          </button>
          <button
            type="button"
            onClick={onToggleFibOverlay}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              showFibOverlay
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Fibonacci Retracement Bands
          </button>
          <button
            type="button"
            onClick={onToggleTrendBands}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              showTrendBands
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            EMA 20 / SMA 50 / Bollinger
          </button>
        </div>
      </div>

      {/* Inspected Candle Telemetry Bar */}
      {inspectedCandle && (
        <div className="py-3 flex flex-wrap items-center justify-between gap-4 text-xs border-b border-slate-100 dark:border-slate-800/70">
          <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums">
            <span className="text-slate-500 dark:text-slate-400">
              {new Date(inspectedCandle.time).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              O: <strong>${inspectedCandle.open.toFixed(decimals)}</strong>
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              H: <strong>${inspectedCandle.high.toFixed(decimals)}</strong>
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              L: <strong>${inspectedCandle.low.toFixed(decimals)}</strong>
            </span>
            <span
              className={
                inspectedCandle.close >= inspectedCandle.open
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-rose-600 dark:text-rose-400 font-semibold'
              }
            >
              C: ${inspectedCandle.close.toFixed(decimals)}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Vol: {(inspectedCandle.volume / 1_000_000).toFixed(2)}M
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {inspectedCandle.detectedPattern ? (
              <span className="font-medium text-amber-600 dark:text-amber-400">
                Pattern: {inspectedCandle.detectedPattern.name} ({inspectedCandle.detectedPattern.bias})
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                Standard Continuation Bar
              </span>
            )}
            {activeFibZone && (
              <>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  Fib Zone: <strong style={{ color: activeFibZone.colorHex }}>{activeFibZone.label}</strong>
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* SVG Interactive Chart */}
      <div className="relative mt-2 w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[380px] sm:h-[420px] select-none"
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
                  x={width - padRight + 6}
                  y={y + 4}
                  className="fill-slate-400 dark:fill-slate-500 font-mono text-[10px]"
                >
                  ${p.toFixed(decimals)}
                </text>
              </g>
            );
          })}

          {/* Fibonacci Retracement Color-Coded Visual Spectrum Zones */}
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
                      fillOpacity={0.055}
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
                    strokeOpacity={0.75}
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

          {/* Risk Manager Visual Zones (Entry, 2% Stop-Loss, 1:2 Take-Profit) */}
          {showRiskOverlay && entryPrice > 0 && (
            <g>
              {/* Stop Loss Shaded Area */}
              <rect
                x={padLeft}
                y={Math.min(priceToY(entryPrice), priceToY(stopLoss))}
                width={plotWidth}
                height={Math.abs(priceToY(stopLoss) - priceToY(entryPrice))}
                fill="#F43F5E"
                fillOpacity={0.08}
              />
              {/* Take Profit 1:2 Shaded Area */}
              <rect
                x={padLeft}
                y={Math.min(priceToY(entryPrice), priceToY(takeProfit))}
                width={plotWidth}
                height={Math.abs(priceToY(takeProfit) - priceToY(entryPrice))}
                fill="#10B981"
                fillOpacity={0.08}
              />
              {/* Entry Line */}
              <line
                x1={padLeft}
                y1={priceToY(entryPrice)}
                x2={width - padRight}
                y2={priceToY(entryPrice)}
                stroke="#0EA5E9"
                strokeWidth={1.5}
              />
              <text
                x={width - padRight - 145}
                y={priceToY(entryPrice) - 5}
                fill="#0EA5E9"
                className="font-mono text-[10px] font-semibold"
              >
                {tradeSide.toUpperCase()} ENTRY ${entryPrice.toFixed(decimals)}
              </text>

              {/* Stop Loss Line */}
              <line
                x1={padLeft}
                y1={priceToY(stopLoss)}
                x2={width - padRight}
                y2={priceToY(stopLoss)}
                stroke="#F43F5E"
                strokeWidth={1.5}
                strokeDasharray="5 3"
              />
              <text
                x={width - padRight - 155}
                y={priceToY(stopLoss) - 5}
                fill="#F43F5E"
                className="font-mono text-[10px] font-semibold"
              >
                2% STOP LOSS ${stopLoss.toFixed(decimals)}
              </text>

              {/* Take Profit Line */}
              <line
                x1={padLeft}
                y1={priceToY(takeProfit)}
                x2={width - padRight}
                y2={priceToY(takeProfit)}
                stroke="#10B981"
                strokeWidth={1.5}
                strokeDasharray="5 3"
              />
              <text
                x={width - padRight - 165}
                y={priceToY(takeProfit) - 5}
                fill="#10B981"
                className="font-mono text-[10px] font-semibold"
              >
                1:2 TARGET ${takeProfit.toFixed(decimals)}
              </text>
            </g>
          )}

          {/* Trend & Volatility Polylines */}
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
                opacity={0.55}
              />
              <polyline
                fill="none"
                stroke="#64748B"
                strokeWidth={1}
                strokeDasharray="2 2"
                points={bbLowerPoints}
                opacity={0.55}
              />
            </g>
          )}

          {/* Candlesticks & Volume Bars */}
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

            const volHeight = (candle.volume / maxVolume) * 48;
            const isSelected = activeIdx === globalIdx;

            return (
              <g
                key={candle.time}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(globalIdx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSelectCandle(globalIdx)}
              >
                {/* Selection Vertical Guide */}
                {isSelected && (
                  <line
                    x1={xCenter}
                    y1={padTop}
                    x2={xCenter}
                    y2={height - padBottom}
                    stroke="#38BDF8"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    strokeOpacity={0.65}
                  />
                )}

                {/* Volume Subplot Bar */}
                <rect
                  x={xCenter - candleWidth / 2}
                  y={height - padBottom - volHeight}
                  width={candleWidth}
                  height={volHeight}
                  fill={color}
                  fillOpacity={0.18}
                />

                {/* High-Low Wick */}
                <line
                  x1={xCenter}
                  y1={yHigh}
                  x2={xCenter}
                  y2={yLow}
                  stroke={color}
                  strokeWidth={1.35}
                />

                {/* Open-Close Real Body */}
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

                {/* Pattern Marker Triangle */}
                {candle.detectedPattern && (
                  <circle
                    cx={xCenter}
                    cy={isBull ? yLow + 9 : yHigh - 9}
                    r={3.2}
                    fill={
                      candle.detectedPattern.bias === 'Bullish'
                        ? '#10B981'
                        : candle.detectedPattern.bias === 'Bearish'
                        ? '#F43F5E'
                        : '#F59E0B'
                    }
                    stroke="#0F172A"
                    strokeWidth={1}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Quick Educational Strip */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span>
            <strong className="text-sky-500">EMA 20</strong> Short-Term Momentum
          </span>
          <span>·</span>
          <span>
            <strong className="text-purple-400">SMA 50</strong> Structural Trend Baseline
          </span>
          <span>·</span>
          <span>
            <strong className="text-amber-500">● Markers</strong> Detected Candlestick Formation (Click to inspect)
          </span>
        </div>
        <span className="font-mono tabular-nums">
          Showing {visibleCandles.length} periods · Educational Paper Mode
        </span>
      </div>
    </div>
  );
};
