export type AssetSymbol = 'BTCUSDT' | 'XRPUSDT' | 'XLMUSDT';

export type Timeframe = '15m' | '1h' | '4h' | '1d';

export type InstrumentType = 'spot' | 'futures' | 'options';

export type TradeSide = 'long' | 'short';

export type CandlePatternType =
  | 'bullish_engulfing'
  | 'bearish_engulfing'
  | 'hammer'
  | 'shooting_star'
  | 'doji'
  | 'morning_star'
  | 'marubozu_bull'
  | 'marubozu_bear';

export interface CandlePatternInfo {
  id: CandlePatternType;
  name: string;
  bias: 'Bullish' | 'Bearish' | 'Neutral / Indecision';
  whatItIs: string;
  whatItDoes: string;
  sentimentMeaning: string;
  confirmationTip: string;
}

export interface DetectedPattern {
  candleIndex: number;
  time: number;
  pattern: CandlePatternInfo;
  priceAtDetection: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20?: number;
  sma50?: number;
  bbUpper?: number;
  bbLower?: number;
  detectedPattern?: CandlePatternInfo;
}

export interface FibonacciLevel {
  ratio: number;
  label: string;
  price: number;
  colorHex: string;
  zoneName: string;
  educationalNote: string;
}

export interface MarketStats {
  symbol: AssetSymbol;
  baseAsset: 'BTC' | 'XRP' | 'XLM';
  name: string;
  lastPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  volume24hUsd: number;
  atr14: number;
  annualizedVolatilityPct: number;
  dexSpreadBps: number;
  dexLiquidityUsd: number;
  isLiveStream: boolean;
}

export interface PaperPosition {
  id: string;
  symbol: AssetSymbol;
  instrument: InstrumentType;
  side: TradeSide;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  quantity: number;
  notionalUsd: number;
  marginRequiredUsd: number;
  leverage: number;
  liquidationPrice: number | null;
  riskAmountUsd: number;
  riskPercent: number;
  rewardAmountUsd: number;
  rrRatio: number;
  openedAt: string;
  status: 'open' | 'closed';
  exitPrice?: number;
  realizedPnlUsd?: number;
  closeReason?: string;
}

export interface WatchedWallet {
  id: string;
  label: string;
  network: 'Bitcoin' | 'XRPL' | 'Xaman Wallet (XRPL)' | 'Stellar' | 'TrustWallet Multi-Chain';
  address: string;
  btcBalance?: number;
  xrpBalance: number;
  xlmBalance: number;
  usdtBalance: number;
  lastSynced: string;
  isLiveChain: boolean;
}

export interface PriceAlert {
  id: string;
  symbol: AssetSymbol;
  condition: 'above' | 'below';
  targetPrice: number;
  note: string;
  triggered: boolean;
  triggeredAt?: string;
}

export interface BotStrategyConfig {
  id: string;
  name: string;
  symbol: AssetSymbol;
  active: boolean;
  entryTrigger: 'fib_618_pullback' | 'ema_20_50_cross' | 'bullish_engulfing_reversal' | 'bollinger_breakout';
  riskPerTradePct: number;
  rrTarget: number;
  leverage: number;
  exchangeSandbox: 'Binance Paper API' | 'XRPL DEX Testnet' | 'Stellar SDEX Sandbox';
  twoFactorVerified: boolean;
  simulatedTradesCount: number;
  winRatePct: number;
  netPnlUsd: number;
}
