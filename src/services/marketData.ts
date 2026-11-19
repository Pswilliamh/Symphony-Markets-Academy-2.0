import {
  AssetSymbol,
  Candle,
  CandlePatternInfo,
  CandlePatternType,
  FibonacciLevel,
  MarketStats,
  Timeframe,
} from '../types/market';

export const CANDLE_PATTERNS: Record<CandlePatternType, CandlePatternInfo> = {
  bullish_engulfing: {
    id: 'bullish_engulfing',
    name: 'Bullish Engulfing',
    bias: 'Bullish',
    whatItIs:
      'A two-candle reversal pattern where a full-bodied green (up) candle completely engulfs the real body of the preceding red (down) candle.',
    whatItDoes:
      'Shows that buyers stepped in aggressively after a downward move, absorbing all available selling pressure and pushing the close above the prior open.',
    sentimentMeaning:
      'Signals a strong shift from seller dominance to buyer conviction, particularly when forming near a support level or Fibonacci 61.8% retracement.',
    confirmationTip:
      'Look for above-average volume on the engulfing candle and wait for the next candle to hold above the midpoint of the green body before sizing a position.',
  },
  bearish_engulfing: {
    id: 'bearish_engulfing',
    name: 'Bearish Engulfing',
    bias: 'Bearish',
    whatItIs:
      'A two-candle pattern where a large red (down) real body completely overlaps and closes below the prior green (up) candle body.',
    whatItDoes:
      'Demonstrates that supply overwhelmed demand after an upward push, erasing the entire prior period’s gains.',
    sentimentMeaning:
      'Indicates buyer exhaustion and potential short-term trend distribution or pullback near resistance.',
    confirmationTip:
      'Check whether the pattern forms near swing highs or upper Bollinger bands, and place protective stops slightly above the highest wick.',
  },
  hammer: {
    id: 'hammer',
    name: 'Hammer (Pin Bar)',
    bias: 'Bullish',
    whatItIs:
      'A single candle with a small real body near the top of its range and a long lower shadow at least twice the length of the body.',
    whatItDoes:
      'Sellers drove the price sharply lower during the session, but buyers rejected those lower prices and bid the asset back near its opening/high level.',
    sentimentMeaning:
      'Reflects strong demand rejection of lower prices (liquidity sweep below support) and potential exhaustion of downward momentum.',
    confirmationTip:
      'The lower wick often marks a clear invalidation level for a 2% risk stop-loss placement if subsequent price action confirms upward follow-through.',
  },
  shooting_star: {
    id: 'shooting_star',
    name: 'Shooting Star',
    bias: 'Bearish',
    whatItIs:
      'A single candle with a compact real body near the session low and an extended upper shadow at least twice the height of the body.',
    whatItDoes:
      'Buyers attempted a breakout higher during the period, but sellers stepped in at higher prices and forced the close back near the open/low.',
    sentimentMeaning:
      'Signals overhead supply rejection and profit-taking after a rally, warning that upward momentum may be stalling.',
    confirmationTip:
      'Most meaningful after a multi-candle advance or near major historical resistance levels.',
  },
  doji: {
    id: 'doji',
    name: 'Doji (Equilibrium)',
    bias: 'Neutral / Indecision',
    whatItIs:
      'A candle where the opening and closing prices are virtually identical, resulting in a cross-like shape with upper and lower shadows.',
    whatItDoes:
      'Neither buyers nor sellers could maintain control by the close of the period, leaving price in temporary equilibrium.',
    sentimentMeaning:
      'Represents market indecision and a pause in trend momentum. After a prolonged trend, it warns that conviction is fading.',
    confirmationTip:
      'Never trade a Doji in isolation—wait for the following candle to break above the Doji high or below the Doji low to confirm direction.',
  },
  morning_star: {
    id: 'morning_star',
    name: 'Morning Star',
    bias: 'Bullish',
    whatItIs:
      'A three-candle bottom reversal pattern: a tall bearish candle, a small-bodied indecision candle at the low, followed by a strong bullish candle closing above the first candle’s midpoint.',
    whatItDoes:
      'Maps a complete transition from panic selling (candle 1) to stabilization (candle 2) to renewed institutional/spot accumulation (candle 3).',
    sentimentMeaning:
      'High-conviction bullish turnaround structure showing that sellers ran out of inventory.',
    confirmationTip:
      'Risk managers typically anchor the stop-loss just beneath the lowest wick of the middle star candle.',
  },
  marubozu_bull: {
    id: 'marubozu_bull',
    name: 'Bullish Marubozu',
    bias: 'Bullish',
    whatItIs:
      'A long green candle with minimal or no upper and lower shadows, opening near the period low and closing near the period high.',
    whatItDoes:
      'Buyers controlled the order book from the opening bell through the close without allowing any meaningful pullback.',
    sentimentMeaning:
      'Demonstrates sustained directional momentum and strong breakout participation.',
    confirmationTip:
      'Because chasing extended candles widens stop distance, disciplined traders often wait for a 38.2%–50% retracement of the Marubozu body.',
  },
  marubozu_bear: {
    id: 'marubozu_bear',
    name: 'Bearish Marubozu',
    bias: 'Bearish',
    whatItIs:
      'A long red candle with very small wicks, opening near the high and closing at or near the low of the period.',
    whatItDoes:
      'Sellers dominated the entire interval with continuous market sell orders and minimal buyer bounce.',
    sentimentMeaning:
      'Indicates strong downward pressure and breakdown momentum.',
    confirmationTip:
      'Avoid catching a falling knife immediately; wait for volatility stabilization or a clear support test.',
  },
};

export function detectCandlePattern(candles: Candle[], index: number): CandlePatternInfo | undefined {
  if (index < 2 || index >= candles.length) return undefined;
  const c = candles[index];
  const prev = candles[index - 1];
  const prev2 = candles[index - 2];

  const range = c.high - c.low;
  if (range <= 0) return undefined;

  const body = Math.abs(c.close - c.open);
  const upperWick = c.high - Math.max(c.open, c.close);
  const lowerWick = Math.min(c.open, c.close) - c.low;
  const isBull = c.close >= c.open;
  const prevBody = Math.abs(prev.close - prev.open);
  const prevIsBull = prev.close >= prev.open;

  // 1. Morning Star (3-candle check)
  const prev2Body = Math.abs(prev2.close - prev2.open);
  const prev2Range = Math.max(prev2.high - prev2.low, 1e-8);
  if (
    prev2.close < prev2.open &&
    prev2Body > prev2Range * 0.5 &&
    prevBody < prev2Body * 0.4 &&
    isBull &&
    c.close > (prev2.open + prev2.close) / 2
  ) {
    return CANDLE_PATTERNS.morning_star;
  }

  // 2. Bullish Engulfing
  if (
    !prevIsBull &&
    isBull &&
    body > prevBody * 1.08 &&
    c.close >= prev.open &&
    c.open <= prev.close &&
    prevBody / Math.max(prev.high - prev.low, 1e-8) > 0.25
  ) {
    return CANDLE_PATTERNS.bullish_engulfing;
  }

  // 3. Bearish Engulfing
  if (
    prevIsBull &&
    !isBull &&
    body > prevBody * 1.08 &&
    c.open >= prev.close &&
    c.close <= prev.open &&
    prevBody / Math.max(prev.high - prev.low, 1e-8) > 0.25
  ) {
    return CANDLE_PATTERNS.bearish_engulfing;
  }

  // 4. Hammer
  if (lowerWick >= body * 2.1 && upperWick <= body * 0.65 && body / range >= 0.12) {
    return CANDLE_PATTERNS.hammer;
  }

  // 5. Shooting Star
  if (upperWick >= body * 2.1 && lowerWick <= body * 0.65 && body / range >= 0.12) {
    return CANDLE_PATTERNS.shooting_star;
  }

  // 6. Doji
  if (body / range <= 0.08) {
    return CANDLE_PATTERNS.doji;
  }

  // 7. Marubozu
  if (body / range >= 0.85) {
    return isBull ? CANDLE_PATTERNS.marubozu_bull : CANDLE_PATTERNS.marubozu_bear;
  }

  return undefined;
}

export function enrichCandlesWithIndicators(rawCandles: Candle[]): Candle[] {
  const result: Candle[] = rawCandles.map((c) => ({ ...c }));
  const emaPeriod = 20;
  const smaPeriod = 50;
  const bbPeriod = 20;
  const k = 2 / (emaPeriod + 1);

  for (let i = 0; i < result.length; i++) {
    // EMA 20
    if (i === 0) {
      result[i].ema20 = result[i].close;
    } else {
      result[i].ema20 = result[i].close * k + (result[i - 1].ema20 ?? result[i].close) * (1 - k);
    }

    // SMA 50
    const startSma = Math.max(0, i - smaPeriod + 1);
    const sliceSma = result.slice(startSma, i + 1);
    result[i].sma50 = sliceSma.reduce((acc, item) => acc + item.close, 0) / sliceSma.length;

    // Bollinger Bands (20, 2)
    const startBb = Math.max(0, i - bbPeriod + 1);
    const sliceBb = result.slice(startBb, i + 1);
    const mean = sliceBb.reduce((acc, item) => acc + item.close, 0) / sliceBb.length;
    const variance =
      sliceBb.reduce((acc, item) => acc + Math.pow(item.close - mean, 2), 0) / sliceBb.length;
    const stdDev = Math.sqrt(variance);
    result[i].bbUpper = mean + 2 * stdDev;
    result[i].bbLower = mean - 2 * stdDev;

    // Detect educational candlestick pattern
    result[i].detectedPattern = detectCandlePattern(result, i);
  }

  return result;
}

export function calculateFibonacciLevels(candles: Candle[]): FibonacciLevel[] {
  if (candles.length === 0) return [];
  const recent = candles.slice(-60);
  const swingHigh = Math.max(...recent.map((c) => c.high));
  const swingLow = Math.min(...recent.map((c) => c.low));
  const diff = swingHigh - swingLow;

  const specs: Array<{
    ratio: number;
    label: string;
    colorHex: string;
    zoneName: string;
    educationalNote: string;
  }> = [
    {
      ratio: 0,
      label: '0.0% (Swing High)',
      colorHex: '#EF4444',
      zoneName: 'Upper Resistance Peak',
      educationalNote: 'Recent local swing high where supply previously capped upward price movement.',
    },
    {
      ratio: 0.236,
      label: '23.6% Retracement',
      colorHex: '#F97316',
      zoneName: 'Shallow Momentum Pullback',
      educationalNote: 'Shallow consolidation level common during strong high-volume breakouts.',
    },
    {
      ratio: 0.382,
      label: '38.2% Retracement',
      colorHex: '#EAB308',
      zoneName: 'First Trend Support Zone',
      educationalNote: 'Classic technical pullback level where trend-following buyers often test demand.',
    },
    {
      ratio: 0.5,
      label: '50.0% Equilibrium',
      colorHex: '#10B981',
      zoneName: 'Mean Equilibrium Midpoint',
      educationalNote: 'Halfway retracement of the prior impulse wave; key balance point between buyers and sellers.',
    },
    {
      ratio: 0.618,
      label: '61.8% Golden Ratio',
      colorHex: '#06B6D4',
      zoneName: 'Golden Pocket Support Zone',
      educationalNote: 'Primary Fibonacci golden ratio level (1 / 1.618) watched closely for high-R:R reversal setups.',
    },
    {
      ratio: 0.786,
      label: '78.6% Deep Retracement',
      colorHex: '#6366F1',
      zoneName: 'Deep Structural Defense',
      educationalNote: 'Last major retracement zone before a full test of the prior swing low origin.',
    },
    {
      ratio: 1,
      label: '100.0% (Swing Low)',
      colorHex: '#8B5CF6',
      zoneName: 'Base Demand Origin',
      educationalNote: 'Origin of the measured upward move; breaking below invalidates the current bullish swing structure.',
    },
  ];

  return specs.map((spec) => ({
    ...spec,
    price: swingHigh - diff * spec.ratio,
  }));
}

export function computeHistoricalMetrics(candles: Candle[]): {
  atr14: number;
  annualizedVolatilityPct: number;
} {
  if (candles.length < 3) {
    return { atr14: 0.01, annualizedVolatilityPct: 45 };
  }

  const trs: number[] = [];
  const logReturns: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      cur.high - cur.low,
      Math.abs(cur.high - prev.close),
      Math.abs(cur.low - prev.close)
    );
    trs.push(tr);

    if (prev.close > 0 && cur.close > 0) {
      logReturns.push(Math.log(cur.close / prev.close));
    }
  }

  const last14 = trs.slice(-14);
  const atr14 = last14.reduce((a, b) => a + b, 0) / Math.max(1, last14.length);

  const meanReturn = logReturns.reduce((a, b) => a + b, 0) / Math.max(1, logReturns.length);
  const variance =
    logReturns.reduce((acc, r) => acc + Math.pow(r - meanReturn, 2), 0) /
    Math.max(1, logReturns.length - 1);
  // Annualized assuming hourly/intraday scaling
  const annualizedVolatilityPct = Math.min(180, Math.max(18, Math.sqrt(variance) * Math.sqrt(365 * 24) * 100));

  return { atr14, annualizedVolatilityPct };
}

function generateFallbackCandles(symbol: AssetSymbol, timeframe: Timeframe): Candle[] {
  const basePrice = symbol === 'BTCUSDT' ? 91450 : symbol === 'XRPUSDT' ? 2.42 : 0.415;
  const decimals = symbol === 'BTCUSDT' ? 2 : 4;
  const stepMs =
    timeframe === '15m'
      ? 15 * 60 * 1000
      : timeframe === '1h'
      ? 60 * 60 * 1000
      : timeframe === '4h'
      ? 4 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;

  const now = Date.now();
  const count = 72;
  const candles: Candle[] = [];
  let price = basePrice * 0.94;

  for (let i = count; i >= 0; i--) {
    const time = now - i * stepMs;
    const wave = Math.sin(i * 0.22) * (basePrice * 0.012) + Math.cos(i * 0.11) * (basePrice * 0.008);
    const open = price;
    const delta = wave + ((i % 5 === 0 ? 1 : -0.6) * basePrice * 0.006);
    const close = Math.max(basePrice * 0.5, open + delta);
    const high = Math.max(open, close) + basePrice * (i % 7 === 0 ? 0.016 : 0.005);
    const low = Math.min(open, close) - basePrice * (i % 6 === 0 ? 0.017 : 0.005);
    const volume =
      (symbol === 'BTCUSDT' ? 28_500 : symbol === 'XRPUSDT' ? 14_500_000 : 8_200_000) *
      (0.7 + ((i * 19) % 10) * 0.08);

    candles.push({
      time,
      open: Number(open.toFixed(decimals)),
      high: Number(high.toFixed(decimals)),
      low: Number(low.toFixed(decimals)),
      close: Number(close.toFixed(decimals)),
      volume: Math.round(volume),
    });
    price = close;
  }

  return enrichCandlesWithIndicators(candles);
}

export async function fetchMarketData(
  symbol: AssetSymbol,
  timeframe: Timeframe
): Promise<{ candles: Candle[]; stats: MarketStats }> {
  const baseAsset: MarketStats['baseAsset'] =
    symbol === 'BTCUSDT' ? 'BTC' : symbol === 'XRPUSDT' ? 'XRP' : 'XLM';
  const assetName =
    symbol === 'BTCUSDT'
      ? 'Bitcoin (BTC)'
      : symbol === 'XRPUSDT'
      ? 'XRP Ledger (XRP)'
      : 'Stellar Lumens (XLM)';

  try {
    const [klinesRes, tickerRes] = await Promise.all([
      fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=75`),
      fetch(`https://data-api.binance.vision/api/v3/ticker/24hr?symbol=${symbol}`),
    ]);

    if (!klinesRes.ok || !tickerRes.ok) {
      throw new Error('Public exchange endpoint unavailable');
    }

    const klinesData = (await klinesRes.json()) as Array<[number, string, string, string, string, string]>;
    const tickerData = (await tickerRes.json()) as {
      lastPrice: string;
      priceChange: string;
      priceChangePercent: string;
      highPrice: string;
      lowPrice: string;
      quoteVolume: string;
    };

    const rawCandles: Candle[] = klinesData.map((k) => ({
      time: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));

    const candles = enrichCandlesWithIndicators(rawCandles);
    const { atr14, annualizedVolatilityPct } = computeHistoricalMetrics(candles);

    const stats: MarketStats = {
      symbol,
      baseAsset,
      name: assetName,
      lastPrice: parseFloat(tickerData.lastPrice),
      priceChange24h: parseFloat(tickerData.priceChange),
      priceChangePercent24h: parseFloat(tickerData.priceChangePercent),
      high24h: parseFloat(tickerData.highPrice),
      low24h: parseFloat(tickerData.lowPrice),
      volume24hUsd: parseFloat(tickerData.quoteVolume),
      atr14,
      annualizedVolatilityPct,
      dexSpreadBps: symbol === 'BTCUSDT' ? 1.8 : symbol === 'XRPUSDT' ? 4.2 : 6.8,
      dexLiquidityUsd:
        symbol === 'BTCUSDT' ? 185_000_000 : symbol === 'XRPUSDT' ? 48_900_000 : 19_400_000,
      isLiveStream: true,
    };

    return { candles, stats };
  } catch {
    const candles = generateFallbackCandles(symbol, timeframe);
    const last = candles[candles.length - 1];
    const first = candles[0];
    const change = last.close - first.open;
    const changePct = (change / first.open) * 100;
    const { atr14, annualizedVolatilityPct } = computeHistoricalMetrics(candles);

    const stats: MarketStats = {
      symbol,
      baseAsset,
      name: assetName,
      lastPrice: last.close,
      priceChange24h: change,
      priceChangePercent24h: changePct,
      high24h: Math.max(...candles.slice(-24).map((c) => c.high)),
      low24h: Math.min(...candles.slice(-24).map((c) => c.low)),
      volume24hUsd:
        symbol === 'BTCUSDT'
          ? 24_800_000_000
          : symbol === 'XRPUSDT'
          ? 1_420_000_000
          : 385_000_000,
      atr14,
      annualizedVolatilityPct,
      dexSpreadBps: symbol === 'BTCUSDT' ? 2.1 : symbol === 'XRPUSDT' ? 4.5 : 7.1,
      dexLiquidityUsd:
        symbol === 'BTCUSDT' ? 178_000_000 : symbol === 'XRPUSDT' ? 46_200_000 : 18_750_000,
      isLiveStream: false,
    };

    return { candles, stats };
  }
}

export async function fetchPublicWalletBalance(
  network: 'Bitcoin' | 'XRPL' | 'Xaman Wallet (XRPL)' | 'Stellar' | 'TrustWallet Multi-Chain',
  address: string
): Promise<{
  btcBalance: number;
  xrpBalance: number;
  xlmBalance: number;
  usdtBalance: number;
  isLiveChain: boolean;
}> {
  const trimmed = address.trim();
  try {
    if (
      (trimmed.startsWith('bc1') || trimmed.startsWith('1') || trimmed.startsWith('3')) &&
      trimmed.length >= 26
    ) {
      const res = await fetch(`https://mempool.space/api/address/${trimmed}`);
      if (res.ok) {
        const data = (await res.json()) as {
          chain_stats?: { funded_txo_sum?: number; spent_txo_sum?: number };
        };
        const funded = Number(data?.chain_stats?.funded_txo_sum || 0);
        const spent = Number(data?.chain_stats?.spent_txo_sum || 0);
        const sats = Math.max(0, funded - spent);
        return {
          btcBalance: Number((sats / 100_000_000).toFixed(6)),
          xrpBalance: 0,
          xlmBalance: 0,
          usdtBalance: 0,
          isLiveChain: true,
        };
      }
    }

    if (trimmed.startsWith('G') && trimmed.length >= 50) {
      const res = await fetch(`https://horizon.stellar.org/accounts/${trimmed}`);
      if (res.ok) {
        const data = (await res.json()) as {
          balances: Array<{ asset_type: string; asset_code?: string; balance: string }>;
        };
        let xlm = 0;
        let usdt = 0;
        for (const b of data.balances) {
          if (b.asset_type === 'native') xlm += parseFloat(b.balance);
          if (b.asset_code === 'USDC' || b.asset_code === 'USDT') usdt += parseFloat(b.balance);
        }
        return { btcBalance: 0, xrpBalance: 0, xlmBalance: xlm, usdtBalance: usdt, isLiveChain: true };
      }
      if (res.status === 404) {
        return { btcBalance: 0, xrpBalance: 0, xlmBalance: 0, usdtBalance: 0, isLiveChain: true };
      }
    }

    if (trimmed.startsWith('r') && trimmed.length >= 25) {
      const res = await fetch('https://xrplcluster.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'account_info',
          params: [{ account: trimmed, strict: true, ledger_index: 'validated' }],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          result?: { error?: string; account_data?: { Balance?: string } };
        };
        const drops = data?.result?.account_data?.Balance;
        if (drops) {
          return {
            btcBalance: 0,
            xrpBalance: parseInt(drops, 10) / 1_000_000,
            xlmBalance: 0,
            usdtBalance: 0,
            isLiveChain: true,
          };
        }
        if (data?.result?.error === 'actNotFound') {
          return {
            btcBalance: 0,
            xrpBalance: 0,
            xlmBalance: 0,
            usdtBalance: 0,
            isLiveChain: true,
          };
        }
      }
    }
  } catch {
    // Fallback to deterministic educational balance below
  }

  // Deterministic educational read-only balance based on address characters
  const hash = trimmed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isXrpFocused = network === 'XRPL' || network === 'Xaman Wallet (XRPL)';
  return {
    btcBalance: network === 'Bitcoin' ? Number((0.0005 + (hash % 120) / 100000).toFixed(6)) : 0,
    xrpBalance: network !== 'Stellar' && network !== 'Bitcoin' ? 1850 + (hash % 4200) : 0,
    xlmBalance: !isXrpFocused && network !== 'Bitcoin' ? 6400 + ((hash * 7) % 15000) : 0,
    usdtBalance: network === 'Bitcoin' ? 0 : 1200 + ((hash * 3) % 3800),
    isLiveChain: false,
  };
}
