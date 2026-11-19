import React, { useMemo, useState } from 'react';
import videoCoverStopsImg from '../assets/images/video_cover_stops_1794561549253.jpg';
import { CANDLE_PATTERNS } from '../services/marketData';
import {
  AssetSymbol,
  Candle,
  CandlePatternInfo,
  CandlePatternType,
  FibonacciLevel,
} from '../types/market';
import { SectionPromoVideoBanner } from './SectionPromoVideoBanner';

interface CandleEducationDeckProps {
  symbol: AssetSymbol;
  candles: Candle[];
  selectedCandleIndex: number | null;
  onSelectCandle: (index: number) => void;
  fibLevels: FibonacciLevel[];
  livePrice: number;
  onUsePriceAsEntry: (price: number) => void;
}

const PatternAnatomyFlashcardSvg: React.FC<{ patternId: CandlePatternType }> = ({
  patternId,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1.5">
        <span>Visual Flashcard · Anatomical Wick & Body Structure</span>
        <span>Dashed Line = Typical Invalidation / Stop Reference</span>
      </div>

      <svg
        viewBox="0 0 540 156"
        className="w-full h-36 sm:h-40"
        role="img"
        aria-label={`Annotated visual diagram for ${patternId} candlestick formation`}
      >
        {/* Subtle horizontal reference grid */}
        <line x1="16" y1="32" x2="524" y2="32" stroke="#94A3B8" strokeOpacity="0.2" strokeWidth="1" />
        <line x1="16" y1="78" x2="524" y2="78" stroke="#94A3B8" strokeOpacity="0.2" strokeWidth="1" />
        <line x1="16" y1="124" x2="524" y2="124" stroke="#94A3B8" strokeOpacity="0.2" strokeWidth="1" />

        {patternId === 'bullish_engulfing' && (
          <>
            {/* Prior Red Candle */}
            <line x1="115" y1="54" x2="115" y2="112" stroke="#F43F5E" strokeWidth="2.5" />
            <rect x="101" y="66" width="28" height="34" rx="3" fill="#F43F5E" />
            <text x="115" y="46" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#F43F5E">
              1. Prior Seller Bar
            </text>

            {/* Engulfing Green Candle */}
            <line x1="185" y1="28" x2="185" y2="128" stroke="#10B981" strokeWidth="2.5" />
            <rect x="167" y="42" width="36" height="68" rx="3" fill="#10B981" />

            {/* Stop Reference */}
            <line x1="75" y1="134" x2="255" y2="134" stroke="#F43F5E" strokeWidth="1.5" strokeDasharray="5 4" />
            <text x="265" y="137" fontSize="11" fontFamily="monospace" fill="#F43F5E">
              ← Protective Stop Below Low
            </text>

            {/* Callouts */}
            <line x1="208" y1="54" x2="260" y2="54" stroke="#10B981" strokeWidth="1.5" />
            <text x="266" y="57" fontSize="11" fontWeight="bold" fontFamily="sans-serif" fill="#10B981">
              2. Green Body Completely Swallows Red Body
            </text>
            <text x="266" y="76" fontSize="11" fontFamily="sans-serif" fill="#64748B">
              Buyers absorbed all sellers & closed higher
            </text>
          </>
        )}

        {patternId === 'bearish_engulfing' && (
          <>
            {/* Prior Green Candle */}
            <line x1="115" y1="44" x2="115" y2="104" stroke="#10B981" strokeWidth="2.5" />
            <rect x="101" y="56" width="28" height="34" rx="3" fill="#10B981" />
            <text x="115" y="36" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#10B981">
              1. Prior Buyer Bar
            </text>

            {/* Engulfing Red Candle */}
            <line x1="185" y1="26" x2="185" y2="132" stroke="#F43F5E" strokeWidth="2.5" />
            <rect x="167" y="44" width="36" height="72" rx="3" fill="#F43F5E" />

            {/* Stop Reference */}
            <line x1="75" y1="20" x2="255" y2="20" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="5 4" />
            <text x="265" y="24" fontSize="11" fontFamily="monospace" fill="#0284C7">
              ← Resistance / Stop Above High Wick
            </text>

            {/* Callouts */}
            <line x1="208" y1="84" x2="260" y2="84" stroke="#F43F5E" strokeWidth="1.5" />
            <text x="266" y="87" fontSize="11" fontWeight="bold" fontFamily="sans-serif" fill="#F43F5E">
              2. Large Red Body Erases Entire Prior Gain
            </text>
            <text x="266" y="106" fontSize="11" fontFamily="sans-serif" fill="#64748B">
              Supply overwhelmed buyers near ceiling
            </text>
          </>
        )}

        {patternId === 'hammer' && (
          <>
            {/* Hammer Single Candle */}
            <line x1="145" y1="28" x2="145" y2="130" stroke="#10B981" strokeWidth="3" />
            <rect x="127" y="34" width="36" height="24" rx="3" fill="#10B981" />

            {/* Upper Body Callout */}
            <line x1="168" y1="46" x2="235" y2="46" stroke="#10B981" strokeWidth="1.5" />
            <text x="242" y="49" fontSize="11" fontWeight="bold" fontFamily="sans-serif" fill="#10B981">
              Small Real Body Near High (Buyers Won Close)
            </text>

            {/* Long Lower Wick Callout */}
            <line x1="152" y1="96" x2="235" y2="96" stroke="#0284C7" strokeWidth="1.5" />
            <text x="242" y="99" fontSize="11" fontWeight="bold" fontFamily="sans-serif" fill="#0284C7">
              Long Lower Wick (2x+ Body) = Buyers Rejected Drop
            </text>

            {/* Stop Reference */}
            <line x1="85" y1="138" x2="235" y2="138" stroke="#F43F5E" strokeWidth="1.5" strokeDasharray="5 4" />
            <text x="242" y="141" fontSize="11" fontFamily="monospace" fill="#F43F5E">
              ← 2% Risk Stop-Loss Anchor Under Wick Tip
            </text>
          </>
        )}

        {patternId === 'shooting_star' && (
          <>
            {/* Shooting Star Single Candle */}
            <line x1="145" y1="24" x2="145" y2="128" stroke="#F43F5E" strokeWidth="3" />
            <rect x="127" y="98" width="36" height="24" rx="3" fill="#F43F5E" />

            {/* Ceiling Reference */}
            <line x1="85" y1="18" x2="235" y2="18" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="5 4" />
            <text x="242" y="22" fontSize="11" fontFamily="monospace" fill="#D97706">
              ← Failed Breakout Ceiling (Wick High)
            </text>

            {/* Long Upper Wick Callout */}
            <line x1="152" y1="58" x2="235" y2="58" stroke="#F43F5E" strokeWidth="1.5" />
            <text x="242" y="61" fontSize="11" fontWeight="bold" fontFamily="sans-serif" fill="#F43F5E">
              Long Upper Shadow = Sellers Pushed Price Back Down
            </text>

            {/* Body Callout */}
            <line x1="168" y1="110" x2="235" y2="110" stroke="#64748B" strokeWidth="1.5" />
            <text x="242" y="113" fontSize="11" fontFamily="sans-serif" fill="#64748B">
              Compact Body Closes Near Session Low (Caution Chasing!)
            </text>
          </>
        )}

        {patternId === 'doji' && (
          <>
            {/* Doji Cross Candle */}
            <line x1="145" y1="26" x2="145" y2="130" stroke="#F59E0B" strokeWidth="3" />
            <rect x="123" y="75" width="44" height="6" rx="1.5" fill="#F59E0B" />

            <line x1="152" y1="42" x2="235" y2="42" stroke="#64748B" strokeWidth="1.5" />
            <text x="242" y="45" fontSize="11" fontFamily="sans-serif" fill="#64748B">
              Upper Wick: Buyers tried higher, pushed back
            </text>

            <line x1="172" y1="78" x2="235" y2="78" stroke="#D97706" strokeWidth="1.5" />
            <text x="242" y="81" fontSize="11" fontWeight="bold" fontFamily="sans-serif" fill="#D97706">
              Open ≈ Close (Cross Shape = Tug-of-War Tie)
            </text>

            <line x1="152" y1="116" x2="235" y2="116" stroke="#0284C7" strokeWidth="1.5" />
            <text x="242" y="119" fontSize="11" fontFamily="sans-serif" fill="#0284C7">
              Rule: Wait for the NEXT candle to break High or Low
            </text>
          </>
        )}

        {patternId === 'morning_star' && (
          <>
            {/* Candle 1: Tall Bearish */}
            <line x1="85" y1="30" x2="85" y2="108" stroke="#F43F5E" strokeWidth="2.5" />
            <rect x="71" y="38" width="28" height="60" rx="3" fill="#F43F5E" />
            <text x="85" y="24" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#F43F5E">
              1. Selloff
            </text>

            {/* Candle 2: Small Star */}
            <line x1="138" y1="100" x2="138" y2="132" stroke="#F59E0B" strokeWidth="2.5" />
            <rect x="126" y="110" width="24" height="12" rx="2" fill="#F59E0B" />

            {/* Candle 3: Strong Bullish */}
            <line x1="192" y1="36" x2="192" y2="106" stroke="#10B981" strokeWidth="2.5" />
            <rect x="178" y="44" width="28" height="54" rx="3" fill="#10B981" />
            <text x="192" y="28" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#10B981">
              3. Turnaround
            </text>

            {/* Midpoint Line */}
            <line x1="62" y1="68" x2="245" y2="68" stroke="#0284C7" strokeWidth="1.2" strokeDasharray="3 3" />
            <text x="252" y="71" fontSize="11" fontWeight="bold" fontFamily="sans-serif" fill="#10B981">
              Bar 3 Closes Above Bar 1 Midpoint (Buyers Back)
            </text>

            {/* Stop Below Star */}
            <line x1="105" y1="138" x2="245" y2="138" stroke="#F43F5E" strokeWidth="1.5" strokeDasharray="5 4" />
            <text x="252" y="141" fontSize="11" fontFamily="monospace" fill="#F43F5E">
              ← Stop Anchor Beneath Middle Star Low (2)
            </text>
          </>
        )}

        {patternId === 'marubozu_bull' && (
          <>
            {/* Tall Full Green Body */}
            <line x1="145" y1="24" x2="145" y2="132" stroke="#10B981" strokeWidth="2.5" />
            <rect x="125" y="28" width="40" height="100" rx="3" fill="#10B981" />

            <line x1="170" y1="34" x2="235" y2="34" stroke="#10B981" strokeWidth="1.5" />
            <text x="242" y="37" fontSize="11" fontWeight="bold" fontFamily="sans-serif" fill="#10B981">
              Closes at High (Full Buyer Momentum All Hour)
            </text>

            <line x1="115" y1="78" x2="235" y2="78" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="4 4" />
            <text x="242" y="81" fontSize="11" fontFamily="monospace" fill="#0284C7">
              ← Patient 50% Mid-Body Pullback Zone
            </text>

            <line x1="170" y1="124" x2="235" y2="124" stroke="#64748B" strokeWidth="1.5" />
            <text x="242" y="127" fontSize="11" fontFamily="sans-serif" fill="#64748B">
              Opens at Low — Almost Zero Lower Wick
            </text>
          </>
        )}

        {patternId === 'marubozu_bear' && (
          <>
            {/* Tall Full Red Body */}
            <line x1="145" y1="24" x2="145" y2="132" stroke="#F43F5E" strokeWidth="2.5" />
            <rect x="125" y="28" width="40" height="100" rx="3" fill="#F43F5E" />

            <line x1="170" y1="34" x2="235" y2="34" stroke="#64748B" strokeWidth="1.5" />
            <text x="242" y="37" fontSize="11" fontFamily="sans-serif" fill="#64748B">
              Opens Near High — Sellers Dominate Immediately
            </text>

            <line x1="170" y1="80" x2="235" y2="80" stroke="#F43F5E" strokeWidth="1.5" />
            <text x="242" y="83" fontSize="11" fontWeight="bold" fontFamily="sans-serif" fill="#F43F5E">
              Continuous Heavy Selling (Don’t Catch Falling Knife)
            </text>

            <line x1="170" y1="124" x2="235" y2="124" stroke="#D97706" strokeWidth="1.5" />
            <text x="242" y="127" fontSize="11" fontFamily="monospace" fill="#D97706">
              Closes Near Low — Wait for Support Base First
            </text>
          </>
        )}
      </svg>
    </div>
  );
};

export const CandleEducationDeck: React.FC<CandleEducationDeckProps> = ({
  symbol,
  candles,
  selectedCandleIndex,
  onSelectCandle,
  fibLevels,
  livePrice,
  onUsePriceAsEntry,
}) => {
  const [activeTab, setActiveTab] = useState<'patterns' | 'fibonacci'>('patterns');
  const [manualPatternId, setManualPatternId] = useState<CandlePatternType | null>(null);

  const recentDetections = useMemo(() => {
    const items: Array<{ index: number; candle: Candle; pattern: CandlePatternInfo }> = [];
    for (let i = candles.length - 1; i >= 0; i--) {
      const p = candles[i].detectedPattern;
      if (p) {
        items.push({ index: i, candle: candles[i], pattern: p });
      }
      if (items.length >= 8) break;
    }
    return items;
  }, [candles]);

  const activePattern: CandlePatternInfo = useMemo(() => {
    if (manualPatternId) {
      return CANDLE_PATTERNS[manualPatternId];
    }
    if (selectedCandleIndex !== null && candles[selectedCandleIndex]?.detectedPattern) {
      return candles[selectedCandleIndex].detectedPattern!;
    }
    if (recentDetections.length > 0) {
      return recentDetections[0].pattern;
    }
    return CANDLE_PATTERNS.bullish_engulfing;
  }, [manualPatternId, selectedCandleIndex, candles, recentDetections]);

  const decimals = symbol === 'BTCUSDT' ? 2 : 4;

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-5 flex flex-col gap-5">
      {/* Fibonacci Part 1 Video Lesson: The Rhythm of the Crowd */}
      <SectionPromoVideoBanner
        sectionBadge="Fibonacci Part 1 Video · Synced From Google Drive"
        headline="Fibonacci Part 1 — The Rhythm of the Crowd (5:36)"
        description="Watch how collective buyer and seller psychology forms natural Fibonacci retracement bands (38.2%, 50.0%, and the 61.8% Golden Pocket) and why waiting for candlestick confirmation at support protects your 2% risk boundary."
        accentTone="sky"
        tracks={[
          {
            id: 'candle_fib_part1_rhythm',
            tabLabel: 'Fibonacci Part 1: Rhythm of the Crowd',
            title: 'The Rhythm of the Crowd (Fibonacci Part 1)',
            duration: '5:36',
            videoSrc: '/assets/The_Rhythm_of_the_Crowd.mp4',
            driveFileId: '1kCLZNmmcUAXP5XuRcAWfWnkWBXTs3YD5',
            posterSrc: videoCoverStopsImg,
          },
        ]}
      />

      {/* Header & Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Candlestick Anatomy & Fibonacci Retracement Guide
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Interactive pattern recognition and standard technical retracement zones for {symbol}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('patterns')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'patterns'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Candlestick Patterns ({recentDetections.length} Detected)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fibonacci')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'fibonacci'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Fibonacci Price Levels
          </button>
        </div>
      </div>

      {activeTab === 'patterns' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Live Detected Candles & Encyclopedia Selector */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Recent Formations Detected on {symbol}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                {recentDetections.length === 0 ? (
                  <div className="p-4 text-xs text-slate-500 dark:text-slate-400">
                    No multi-candle patterns detected in current window. Select any pattern below to study its structure.
                  </div>
                ) : (
                  recentDetections.slice(0, 5).map(({ index, candle, pattern }) => {
                    const isSelected = selectedCandleIndex === index && !manualPatternId;
                    return (
                      <button
                        key={candle.time}
                        type="button"
                        onClick={() => {
                          setManualPatternId(null);
                          onSelectCandle(index);
                        }}
                        className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2 transition-colors ${
                          isSelected
                            ? 'bg-sky-500/10 text-slate-900 dark:text-white'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold">{pattern.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                            {new Date(candle.time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            · Close ${candle.close.toFixed(decimals)}
                          </div>
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            pattern.bias === 'Bullish'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : pattern.bias === 'Bearish'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {pattern.bias}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Pattern Reference Library */}
            <div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                All Core Candlestick Formations
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.values(CANDLE_PATTERNS).map((pat) => {
                  const isCurrent = activePattern.id === pat.id;
                  return (
                    <button
                      key={pat.id}
                      type="button"
                      onClick={() => setManualPatternId(pat.id)}
                      className={`px-3 py-2 text-left text-xs rounded-lg border transition-colors whitespace-nowrap truncate ${
                        isCurrent
                          ? 'border-sky-500/50 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {pat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Detailed Educational Breakdown */}
          <div className="lg:col-span-7 border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/60 dark:bg-slate-950/60 flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Selected Candlestick Formation
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {activePattern.name}
                  </h3>
                </div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Sentiment Signal:{' '}
                  <strong
                    className={
                      activePattern.bias === 'Bullish'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : activePattern.bias === 'Bearish'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }
                  >
                    {activePattern.bias}
                  </strong>
                </div>
              </div>

              {/* Visual Annotated Candlestick Flashcard */}
              <PatternAnatomyFlashcardSvg patternId={activePattern.id} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white mb-1">
                    1. What It Is (Visual Structure)
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {activePattern.whatItIs}
                  </p>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white mb-1">
                    2. What It Does (Order Book Mechanics)
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {activePattern.whatItDoes}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/70 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white mb-1">
                    3. Market Sentiment & Trend Context
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {activePattern.sentimentMeaning}
                  </p>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white mb-1">
                    4. Risk Management & Confirmation Rule
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {activePattern.confirmationTip}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Educational Note: Candlestick patterns reflect recent buyer/seller balance and should always be paired with strict stop-loss sizing.
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Fibonacci Retracement Color-Coded Table + Visual Schematic */
        <div className="space-y-4">
          {/* Visual Fibonacci Swing-to-Pullback Schematic */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 p-4">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Visual Map: Why Patient Learners Wait for the 50%–61.8% “Discount Zone” Instead of Buying the Ceiling
            </div>
            <svg
              viewBox="0 0 680 130"
              className="w-full h-28 sm:h-32"
              role="img"
              aria-label="Visual Fibonacci retracement diagram showing rally from floor to ceiling, pullback to 61.8% golden zone, and bounce"
            >
              {/* 0% Ceiling Line */}
              <line x1="20" y1="22" x2="660" y2="22" stroke="#F43F5E" strokeWidth="1.2" strokeDasharray="4 4" />
              <text x="655" y="17" textAnchor="end" fontSize="10" fontFamily="monospace" fill="#F43F5E">
                0% Swing Ceiling (FOMO Trap)
              </text>

              {/* 50% - 61.8% Discount Band */}
              <rect x="20" y="64" width="640" height="24" fill="#10B981" fillOpacity="0.13" />
              <line x1="20" y1="64" x2="660" y2="64" stroke="#10B981" strokeWidth="1.2" strokeDasharray="4 4" />
              <line x1="20" y1="88" x2="660" y2="88" stroke="#10B981" strokeWidth="1.5" />
              <text x="655" y="80" textAnchor="end" fontSize="11" fontWeight="bold" fontFamily="monospace" fill="#059669">
                50% – 61.8% Calm “On Sale” Zone
              </text>

              {/* 100% Floor Line */}
              <line x1="20" y1="116" x2="660" y2="116" stroke="#64748B" strokeWidth="1.2" strokeDasharray="4 4" />
              <text x="655" y="112" textAnchor="end" fontSize="10" fontFamily="monospace" fill="#64748B">
                100% Swing Floor
              </text>

              {/* Price Wave Path: Floor -> Ceiling -> 61.8% Pullback -> Continuation */}
              <polyline
                points="40,114 190,22 330,82 475,18"
                fill="none"
                stroke="#0284C7"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Ceiling Warning Dot */}
              <circle cx="190" cy="22" r="5" fill="#F43F5E" />
              <text x="190" y="40" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#F43F5E">
                ✕ Don’t Chase Here
              </text>

              {/* 61.8% Entry Dot */}
              <circle cx="330" cy="82" r="6" fill="#10B981" />
              <text x="330" y="103" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#059669">
                ✓ Patient Entry + Tight Stop
              </text>
            </svg>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Standard Fibonacci retracement ratios (<span className="font-mono">23.6%</span>,{' '}
            <span className="font-mono">38.2%</span>, <span className="font-mono">50.0%</span>,{' '}
            <span className="font-mono">61.8%</span>, <span className="font-mono">78.6%</span>) divide the recent swing range into color-coded visual price zones to help identify potential support and resistance areas. Click any level below to test it as your Planned Entry Price in the Risk Simulator.
          </p>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3 font-medium">Visual Band & Ratio</th>
                  <th className="py-2.5 px-3 font-medium">Zone Classification</th>
                  <th className="py-2.5 px-3 font-medium text-right">Level Price</th>
                  <th className="py-2.5 px-3 font-medium text-right">Distance vs. Live</th>
                  <th className="py-2.5 px-3 font-medium">Technical Meaning</th>
                  <th className="py-2.5 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {fibLevels.map((lvl) => {
                  const distPct = ((lvl.price - livePrice) / Math.max(livePrice, 1e-8)) * 100;
                  return (
                    <tr
                      key={lvl.label}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-medium whitespace-nowrap">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-xs mr-2 align-middle"
                          style={{ backgroundColor: lvl.colorHex }}
                        />
                        {lvl.label}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {lvl.zoneName}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        ${lvl.price.toFixed(decimals)}
                      </td>
                      <td
                        className={`py-2.5 px-3 font-mono tabular-nums text-right whitespace-nowrap ${
                          distPct >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {distPct >= 0 ? '+' : ''}
                        {distPct.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-md">
                        {lvl.educationalNote}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onUsePriceAsEntry(Number(lvl.price.toFixed(decimals)))}
                          className="px-2.5 py-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 rounded-md transition-colors whitespace-nowrap shrink-0"
                        >
                          Use as Entry
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
