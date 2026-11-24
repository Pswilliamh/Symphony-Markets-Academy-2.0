import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  cancelOffer,
  createOffer,
  getAddress,
  isInstalled,
  setTrustline,
} from '@gemwallet/api';
import {
  Camera,
  CheckCircle2,
  ClipboardPaste,
  Copy,
  ExternalLink,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Volume2,
  Wallet,
  XCircle,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  AssetSymbol,
  InstrumentType,
  PaperPosition,
  TradeSide,
} from '../types/market';
import {
  playFibonacciHarmonicInterval,
  playTradeSetSymphonyNote,
} from '../utils/tenSetSymphonyAudio';
import { XrplCameraQrScanner } from './XrplCameraQrScanner';

const XRPL_RLUSD_ISSUER = 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De';
const XRPL_RLUSD_HEX = '524C555344000000000000000000000000000000';
const XAMAN_RLUSD_TRUSTLINE_URL = `https://xrpl.services/?issuer=${XRPL_RLUSD_ISSUER}&currency=${XRPL_RLUSD_HEX}&limit=100000`;
const SOLOGENIC_XRP_RLUSD_URL = `https://sologenic.org/trade?market=XRP%2F${XRPL_RLUSD_HEX}%2B${XRPL_RLUSD_ISSUER}`;

export interface ImportedAutoTraderDexSet {
  nonce: number;
  setNumber: number;
  setupName: string;
  buyPrice: number;
  stopLossPrice: number;
  sellPrice: number;
  quantityXrp: number;
  rrRatio: number;
  walletAddress?: string;
}

interface CrossmarkWindow {
  xrpl?: {
    crossmark?: {
      signInAndWait?: () => Promise<{
        response?: { data?: { address?: string } };
      }>;
      signAndSubmitAndWait?: (tx: Record<string, unknown>) => Promise<{
        response?: {
          data?: {
            resp?: {
              result?: {
                hash?: string;
                engine_result?: string;
              };
            };
          };
        };
      }>;
    };
  };
}

interface XrplBookRow {
  priceUsd: number;
  xrpSize: number;
  rlusdTotal: number;
}

interface XrplOrderbookState {
  pair: string;
  ledgerIndex: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  asks: XrplBookRow[];
  bids: XrplBookRow[];
  fetchedAt: string;
}

interface XrplOpenOfferItem {
  seq: number;
  side: 'BUY_XRP' | 'SELL_XRP';
  xrpAmount: number;
  usdAmount: number;
  limitPriceUsd: number;
}

interface XrplAccountSnapshot {
  activated: boolean;
  account: string;
  totalXrp: number;
  reservedXrp: number;
  spendableXrp: number;
  hasRlusdTrustline: boolean;
  rlusdBalance: number;
  openOffers: XrplOpenOfferItem[];
}

interface RiskSimulatorPanelProps {
  symbol: AssetSymbol;
  livePrice: number;
  atr14: number;
  accountBalance: number;
  onAccountBalanceChange: (val: number) => void;
  entryPrice: number;
  onEntryPriceChange: (val: number) => void;
  stopDistancePct: number;
  onStopDistancePctChange: (val: number) => void;
  riskPercent: number;
  onRiskPercentChange: (val: number) => void;
  rrRatio: number;
  onRrRatioChange: (val: number) => void;
  tradeSide: TradeSide;
  onTradeSideChange: (side: TradeSide) => void;
  instrument: InstrumentType;
  onInstrumentChange: (inst: InstrumentType) => void;
  leverage: number;
  onLeverageChange: (lev: number) => void;
  onOpenPaperPosition: (pos: Omit<PaperPosition, 'id' | 'openedAt' | 'status'>) => void;
  connectedXrplAddress?: string;
  onChangeXrplAddress?: (addr: string) => void;
  onSwitchToXrpSymbol?: () => void;
  importedTenSet?: ImportedAutoTraderDexSet | null;
}

const QUICK_AUTO_SET_TEMPLATES: Array<{
  setNumber: number;
  name: string;
  dipPct: number;
  stopPct: number;
  rr: number;
}> = [
  { setNumber: 1, name: 'Set #01 · Fib 61.8% Golden Pocket', dipPct: 0.018, stopPct: 1.8, rr: 2.0 },
  { setNumber: 2, name: 'Set #02 · Bullish Hammer Support', dipPct: 0.014, stopPct: 1.6, rr: 2.0 },
  { setNumber: 3, name: 'Set #03 · EMA-20 Trend Pullback', dipPct: 0.011, stopPct: 1.5, rr: 2.0 },
  { setNumber: 4, name: 'Set #04 · Fib 50% Equilibrium', dipPct: 0.016, stopPct: 1.7, rr: 2.5 },
  { setNumber: 5, name: 'Set #05 · Higher-Low Continuation', dipPct: 0.012, stopPct: 1.5, rr: 2.0 },
  { setNumber: 6, name: 'Set #06 · Liquidity Sweep Bounce', dipPct: 0.022, stopPct: 2.0, rr: 1.5 },
  { setNumber: 7, name: 'Set #07 · Range Midpoint Retest', dipPct: 0.013, stopPct: 1.6, rr: 2.0 },
  { setNumber: 8, name: 'Set #08 · Fib 78.6% Deep Value', dipPct: 0.025, stopPct: 2.0, rr: 2.2 },
  { setNumber: 9, name: 'Set #09 · Ascending Channel Floor', dipPct: 0.015, stopPct: 1.6, rr: 2.0 },
  { setNumber: 10, name: 'Set #10 · 161.8% Golden Wave', dipPct: 0.019, stopPct: 1.8, rr: 3.0 },
];

export const RiskSimulatorPanel: React.FC<RiskSimulatorPanelProps> = ({
  symbol,
  livePrice,
  atr14,
  accountBalance,
  onAccountBalanceChange,
  entryPrice,
  onEntryPriceChange,
  stopDistancePct,
  onStopDistancePctChange,
  riskPercent,
  onRiskPercentChange,
  rrRatio,
  onRrRatioChange,
  tradeSide,
  onTradeSideChange,
  instrument,
  onInstrumentChange,
  leverage,
  onLeverageChange,
  onOpenPaperPosition,
  connectedXrplAddress = '',
  onChangeXrplAddress,
  onSwitchToXrpSymbol,
  importedTenSet = null,
}) => {
  const [executionMode, setExecutionMode] = useState<'paper' | 'xrpl_dex'>('paper');
  const [optionPremiumPct, setOptionPremiumPct] = useState<number>(3.5);

  // Embedded XRPL DEX Live State
  const [walletInput, setWalletInput] = useState<string>(connectedXrplAddress);
  const [orderbook, setOrderbook] = useState<XrplOrderbookState | null>(null);
  const [bookLoading, setBookLoading] = useState<boolean>(false);
  const [acctSnapshot, setAcctSnapshot] = useState<XrplAccountSnapshot | null>(null);
  const [acctLoading, setAcctLoading] = useState<boolean>(false);

  // Clear, plain-English Spot DEX order controls:
  // - SELL_TARGET = Sell my XRP higher at Profit Target ($ takeProfit)
  // - SELL_ENTRY  = Sell my XRP right near Live / Entry price ($ customDexPrice or entry)
  // - BUY_ENTRY   = Buy XRP using RLUSD dollars ($ customDexPrice or entry)
  const [dexOrderAction, setDexOrderAction] = useState<'SELL_TARGET' | 'SELL_ENTRY' | 'BUY_ENTRY'>(
    'SELL_TARGET'
  );
  // Default to explicit '2' XRP so typing or testing 2 XRP never silently turns into 0.948 XRP!
  const [customXrpOrderQty, setCustomXrpOrderQty] = useState<string>('2');
  const [useAutoRiskXrpQty, setUseAutoRiskXrpQty] = useState<boolean>(false);
  const [customDexLimitPrice, setCustomDexLimitPrice] = useState<string>('');
  const [activeLoadedSetLabel, setActiveLoadedSetLabel] = useState<string | null>(null);
  const [selectedQuickSetNum, setSelectedQuickSetNum] = useState<number>(1);
  const [showPasteBox, setShowPasteBox] = useState<boolean>(false);
  const [manualPasteText, setManualPasteText] = useState<string>('');

  const [dexStatusMsg, setDexStatusMsg] = useState<string | null>(null);
  const [dexErrorMsg, setDexErrorMsg] = useState<string | null>(null);
  const [dexBusy, setDexBusy] = useState<boolean>(false);
  const [showMobileQr, setShowMobileQr] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedField, setCopiedField] = useState<'json' | 'qty' | 'price' | null>(null);

  // Direct Xaman Android QR Connect & 1-Swipe Signing State
  const [xamanApiConfigured, setXamanApiConfigured] = useState<boolean | null>(null);
  const [xamanUserToken, setXamanUserToken] = useState<string>(() => {
    try {
      return localStorage.getItem('symphony_xaman_user_token_v1') || '';
    } catch {
      return '';
    }
  });
  const [xamanConnectedViaQr, setXamanConnectedViaQr] = useState<boolean>(false);
  const [showXamanConnectPanel, setShowXamanConnectPanel] = useState<boolean>(false);
  const [xamanActivePayload, setXamanActivePayload] = useState<{
    kind: 'signin' | 'trustset' | 'offercreate';
    uuid: string;
    qrPng: string;
    nextAlways: string;
    pushed: boolean;
    title: string;
    subtitle: string;
  } | null>(null);
  const [xamanFallbackQrUrl, setXamanFallbackQrUrl] = useState<string>('');
  const [xamanFallbackTrustlineQrUrl, setXamanFallbackTrustlineQrUrl] = useState<string>('');
  const [xamanFallbackTab, setXamanFallbackTab] = useState<'dex' | 'trustline'>('dex');
  const [xamanPayloadState, setXamanPayloadState] = useState<
    'idle' | 'waiting' | 'opened' | 'signed' | 'cancelled' | 'expired'
  >('idle');
  const [showTabletCameraScanner, setShowTabletCameraScanner] = useState<boolean>(false);

  const baseAsset = symbol === 'BTCUSDT' ? 'BTC' : symbol === 'XRPUSDT' ? 'XRP' : 'XLM';
  const decimals = symbol === 'BTCUSDT' ? 2 : 4;

  // In Spot / Embedded XRPL DEX mode, always keep chart in Long/Spot orientation so
  // Profit Target stays ABOVE entry and Safety Stop stays BELOW entry (no upside-down futures shorts!)
  const effectiveChartSide: TradeSide =
    executionMode === 'xrpl_dex' ? 'long' : tradeSide;

  useEffect(() => {
    if (connectedXrplAddress && !walletInput) {
      setWalletInput(connectedXrplAddress);
    }
  }, [connectedXrplAddress, walletInput]);

  const calculations = useMemo(() => {
    const safeEntry = entryPrice > 0 ? entryPrice : livePrice;
    const stopDistRatio = Math.max(0.002, stopDistancePct / 100);

    const stopLoss =
      effectiveChartSide === 'long'
        ? safeEntry * (1 - stopDistRatio)
        : safeEntry * (1 + stopDistRatio);

    const takeProfit =
      effectiveChartSide === 'long'
        ? safeEntry * (1 + stopDistRatio * rrRatio)
        : safeEntry * (1 - stopDistRatio * rrRatio);

    const riskAmountUsd = accountBalance * (riskPercent / 100);
    const rewardAmountUsd = riskAmountUsd * rrRatio;

    const perUnitPriceRisk = Math.max(Math.abs(safeEntry - stopLoss), 1e-6);
    const quantity = riskAmountUsd / perUnitPriceRisk;
    const notionalUsd = quantity * safeEntry;

    const effectiveLeverage = instrument === 'spot' ? 1 : leverage;
    const marginRequiredUsd =
      instrument === 'options'
        ? riskAmountUsd
        : notionalUsd / Math.max(1, effectiveLeverage);

    const maintenanceMarginUsd =
      instrument === 'futures' ? notionalUsd * 0.005 : 0;

    let liquidationPrice: number | null = null;
    if (instrument === 'futures' && effectiveLeverage > 1) {
      const liqMove = (1 / effectiveLeverage) * 0.92;
      liquidationPrice =
        effectiveChartSide === 'long'
          ? Math.max(0.0001, safeEntry * (1 - liqMove))
          : safeEntry * (1 + liqMove);
    }

    const isStopBeyondLiquidation =
      liquidationPrice !== null &&
      ((effectiveChartSide === 'long' && stopLoss <= liquidationPrice) ||
        (effectiveChartSide === 'short' && stopLoss >= liquidationPrice));

    const liveDiff =
      effectiveChartSide === 'long' ? livePrice - safeEntry : safeEntry - livePrice;
    const liveSimulatedPnlUsd = quantity * liveDiff;

    const optionBreakEvenPrice =
      effectiveChartSide === 'long'
        ? safeEntry * (1 + optionPremiumPct / 100)
        : safeEntry * (1 - optionPremiumPct / 100);

    return {
      safeEntry,
      stopLoss,
      takeProfit,
      riskAmountUsd,
      rewardAmountUsd,
      quantity,
      notionalUsd,
      marginRequiredUsd,
      maintenanceMarginUsd,
      liquidationPrice,
      isStopBeyondLiquidation,
      liveSimulatedPnlUsd,
      optionBreakEvenPrice,
    };
  }, [
    entryPrice,
    livePrice,
    stopDistancePct,
    effectiveChartSide,
    rrRatio,
    accountBalance,
    riskPercent,
    instrument,
    leverage,
    optionPremiumPct,
  ]);

  const fetchLiveXrplBook = useCallback(async () => {
    setBookLoading(true);
    try {
      const resp = await fetch('/api/xrpl-orderbook');
      const data = (await resp.json()) as XrplOrderbookState & { error?: string };
      if (!resp.ok || data.error) {
        throw new Error(data.error || 'Unable to load XRPL orderbook.');
      }
      setOrderbook(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to reach XRPL CLOB.';
      setDexErrorMsg(msg);
    } finally {
      setBookLoading(false);
    }
  }, []);

  const syncXrplAccount = useCallback(
    async (addrToQuery?: string) => {
      const target = (addrToQuery ?? walletInput).trim();
      if (!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(target)) {
        setDexErrorMsg('Enter a valid public XRPL address starting with r...');
        return;
      }
      setAcctLoading(true);
      setDexErrorMsg(null);
      try {
        const resp = await fetch('/api/xrpl-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account: target }),
        });
        const data = (await resp.json()) as XrplAccountSnapshot & { error?: string };
        if (!resp.ok || data.error) {
          throw new Error(data.error || 'XRPL account lookup failed.');
        }
        setAcctSnapshot(data);
        onChangeXrplAddress?.(target);

        // Smart beginner helper: if wallet holds XRP (>0.5) and $0.00 RLUSD, default to SELL XRP
        // so the student isn't stuck trying to buy XRP with $0.00 RLUSD!
        if (data.activated && data.spendableXrp >= 0.5 && data.rlusdBalance < 0.25) {
          setDexOrderAction((prev) => (prev === 'BUY_ENTRY' ? 'SELL_TARGET' : prev));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'XRPL account sync failed.';
        setDexErrorMsg(msg);
      } finally {
        setAcctLoading(false);
      }
    },
    [walletInput, onChangeXrplAddress]
  );

  // Keep Step 1 wallet input in lockstep with the top-of-screen Sync My Xaman Wallet bar
  useEffect(() => {
    const clean = (connectedXrplAddress || '').trim();
    setWalletInput(clean);
    if (!clean) {
      setAcctSnapshot(null);
      setXamanConnectedViaQr(false);
      return;
    }
    if (/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(clean) && executionMode === 'xrpl_dex') {
      void syncXrplAccount(clean);
    }
  }, [connectedXrplAddress, executionMode]);

  // Automatically load live XRPL CLOB when switching to Embedded XRPL DEX mode
  useEffect(() => {
    if (executionMode !== 'xrpl_dex') return;
    if (tradeSide !== 'long') {
      onTradeSideChange('long');
    }
    if (instrument !== 'spot') {
      onInstrumentChange('spot');
    }
    void fetchLiveXrplBook();
    if (/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(walletInput.trim())) {
      void syncXrplAccount(walletInput.trim());
    }
  }, [executionMode, fetchLiveXrplBook]);

  // Receive 1-Tap Set #1..#10 sent directly from TenSetAutoTraderLab
  useEffect(() => {
    if (!importedTenSet) return;
    setExecutionMode('xrpl_dex');
    onInstrumentChange('spot');
    onLeverageChange(1);
    onTradeSideChange('long');

    const safeBuy = Number(importedTenSet.buyPrice.toFixed(4));
    const safeStop = Number(importedTenSet.stopLossPrice.toFixed(4));
    const safeSell = Number(importedTenSet.sellPrice.toFixed(4));
    const computedStopPct =
      safeBuy > 0
        ? Math.max(0.5, Math.min(10, Number((((safeBuy - safeStop) / safeBuy) * 100).toFixed(2))))
        : 2.0;

    onEntryPriceChange(safeBuy);
    onStopDistancePctChange(computedStopPct);
    onRrRatioChange(importedTenSet.rrRatio || 2);

    setSelectedQuickSetNum(importedTenSet.setNumber);
    setUseAutoRiskXrpQty(false);
    const cleanXrpQty = Math.max(0.5, Number((importedTenSet.quantityXrp || 2).toFixed(2)));
    setCustomXrpOrderQty(String(cleanXrpQty));

    // If user holds XRP and $0 RLUSD (the most common starting state), stage Target Sell!
    const hasRlusdToBuy = (acctSnapshot?.rlusdBalance ?? 0) >= 0.5;
    if (hasRlusdToBuy) {
      setDexOrderAction('BUY_ENTRY');
      setCustomDexLimitPrice(safeBuy.toFixed(4));
    } else {
      setDexOrderAction('SELL_TARGET');
      setCustomDexLimitPrice(safeSell.toFixed(4));
    }

    if (importedTenSet.walletAddress && /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(importedTenSet.walletAddress.trim())) {
      setWalletInput(importedTenSet.walletAddress.trim());
      void syncXrplAccount(importedTenSet.walletAddress.trim());
    }

    const numLabel =
      importedTenSet.setNumber < 10
        ? `0${importedTenSet.setNumber}`
        : String(importedTenSet.setNumber);
    setActiveLoadedSetLabel(
      `Loaded Auto-Trader Set #${numLabel} (${importedTenSet.setupName}): Buy Dip $${safeBuy.toFixed(
        4
      )} · Target Sell $${safeSell.toFixed(4)}`
    );
    setDexErrorMsg(null);
  }, [importedTenSet]);

  // Apply any Set #01-#10 right inside Embedded XRPL DEX without leaving Section 06
  const handleLoadBuiltInAutoSet = (setNum: number) => {
    const tpl =
      QUICK_AUTO_SET_TEMPLATES.find((t) => t.setNumber === setNum) ||
      QUICK_AUTO_SET_TEMPLATES[0];
    setSelectedQuickSetNum(tpl.setNumber);
    if (symbol !== 'XRPUSDT') {
      onSwitchToXrpSymbol?.();
    }
    onInstrumentChange('spot');
    onTradeSideChange('long');

    const refPrice = orderbook?.bestAsk || livePrice || 1.0;
    const buyDip = Number((refPrice * (1 - tpl.dipPct)).toFixed(4));
    const sellTarget = Number((buyDip * (1 + (tpl.stopPct / 100) * tpl.rr)).toFixed(4));

    onEntryPriceChange(buyDip);
    onStopDistancePctChange(tpl.stopPct);
    onRrRatioChange(tpl.rr);

    const hasRlusdToBuy = (acctSnapshot?.rlusdBalance ?? 0) >= 0.5;
    if (hasRlusdToBuy) {
      setDexOrderAction('BUY_ENTRY');
      setCustomDexLimitPrice(buyDip.toFixed(4));
    } else {
      setDexOrderAction('SELL_TARGET');
      setCustomDexLimitPrice(sellTarget.toFixed(4));
    }

    // Keep user's explicit XRP quantity (e.g. 2 XRP) or cap safely inside spendable XRP
    setUseAutoRiskXrpQty(false);
    const currentParsed = Number(customXrpOrderQty);
    const maxSafeFromWallet =
      acctSnapshot?.activated && acctSnapshot.spendableXrp > 0.6
        ? Number(Math.max(0.5, acctSnapshot.spendableXrp - 0.5).toFixed(2))
        : 2;
    const nextQty =
      currentParsed >= 0.5
        ? Math.min(currentParsed, maxSafeFromWallet > 0.5 ? maxSafeFromWallet : currentParsed)
        : Math.min(2, maxSafeFromWallet);
    setCustomXrpOrderQty(String(Number(nextQty.toFixed(2))));

    setActiveLoadedSetLabel(
      `${tpl.name} Loaded — Buy Dip $${buyDip.toFixed(4)} · Target Sell $${sellTarget.toFixed(4)}`
    );
    playTradeSetSymphonyNote({
      setNumber: tpl.setNumber,
      outcome: 'WIN_TARGET_HIT',
      winOrdinalIndex: Math.min(7, tpl.setNumber),
      rMultiple: tpl.rr,
    });
  };

  // Parse copied text from "Copy Set Specs" or "Copy All 10 Sets" in TenSetAutoTraderLab
  const parseCopiedAutoTraderString = (rawText: string): boolean => {
    const cleaned = rawText.trim();
    if (!cleaned) return false;

    // Matches formats like:
    // "Symphony Markets Academy Set #1 (XRP/USD 1x Spot) | Buy 5.30 XRP @ $0.9940 | Safety Stop $0.9760 | Target Sell $1.0300"
    // or "Set #01: BUY 5.30 XRP @ $0.9940 | STOP $0.9760 | SELL $1.0300"
    const setMatch = cleaned.match(/Set\s*#0?(\d+)/i);
    const buyMatch = cleaned.match(/Buy\s+([\d.]+)\s*(?:XRP|XLM|BTC)?\s*@\s*\$([\d.]+)/i);
    const stopMatch = cleaned.match(/Stop\s*\$([\d.]+)/i);
    const sellMatch = cleaned.match(/Sell\s*\$([\d.]+)/i);

    if (!buyMatch && !sellMatch) {
      setDexErrorMsg(
        'Could not find Set Buy/Sell prices in pasted text. Tap any Set #01–#10 button above to load automatically!'
      );
      return false;
    }

    const parsedSetNum = setMatch ? Math.min(10, Math.max(1, Number(setMatch[1]))) : 1;
    const parsedQty = buyMatch ? Number(buyMatch[1]) : 2;
    const parsedBuy = buyMatch ? Number(buyMatch[2]) : livePrice;
    const parsedStop = stopMatch ? Number(stopMatch[1]) : parsedBuy * 0.98;
    const parsedSell = sellMatch ? Number(sellMatch[1]) : parsedBuy * 1.04;

    if (symbol !== 'XRPUSDT') {
      onSwitchToXrpSymbol?.();
    }
    onInstrumentChange('spot');
    onTradeSideChange('long');
    onEntryPriceChange(Number(parsedBuy.toFixed(4)));

    if (parsedBuy > 0 && parsedStop > 0 && parsedBuy > parsedStop) {
      const pct = Math.max(0.5, Math.min(10, ((parsedBuy - parsedStop) / parsedBuy) * 100));
      onStopDistancePctChange(Number(pct.toFixed(2)));
    }

    const maxSafe =
      acctSnapshot?.activated && acctSnapshot.spendableXrp > 0.6
        ? Math.max(0.5, acctSnapshot.spendableXrp - 0.5)
        : parsedQty;
    const safeQty = Number(Math.max(0.5, Math.min(parsedQty || 2, maxSafe)).toFixed(2));

    setSelectedQuickSetNum(parsedSetNum);
    setUseAutoRiskXrpQty(false);
    setCustomXrpOrderQty(String(safeQty));

    const hasRlusdToBuy = (acctSnapshot?.rlusdBalance ?? 0) >= 0.5;
    if (hasRlusdToBuy) {
      setDexOrderAction('BUY_ENTRY');
      setCustomDexLimitPrice(parsedBuy.toFixed(4));
    } else {
      setDexOrderAction('SELL_TARGET');
      setCustomDexLimitPrice(parsedSell.toFixed(4));
    }

    setActiveLoadedSetLabel(
      `Pasted Set #0${parsedSetNum}: Size ${safeQty} XRP · Buy Dip $${parsedBuy.toFixed(
        4
      )} · Target Sell $${parsedSell.toFixed(4)}`
    );
    setDexErrorMsg(null);
    setShowPasteBox(false);
    setManualPasteText('');
    return true;
  };

  const handlePasteFromClipboard = async () => {
    setDexErrorMsg(null);
    try {
      if (navigator.clipboard?.readText) {
        const clip = await navigator.clipboard.readText();
        if (clip && parseCopiedAutoTraderString(clip)) {
          return;
        }
      }
      setShowPasteBox((v) => !v);
    } catch {
      // Browser blocked automatic clipboard read -> show 1-line paste box
      setShowPasteBox(true);
    }
  };

  // Generate crisp local SVG/DataURL QR code for mobile Xaman signing (zero external image URLs)
  const xamanDexDeepLink = useMemo(() => {
    return `https://xaman.app/detect/xapp:xumm.dex?issuer=${XRPL_RLUSD_ISSUER}&currency=${XRPL_RLUSD_HEX}`;
  }, []);

  useEffect(() => {
    if (!showMobileQr) return;
    let active = true;
    QRCode.toDataURL(xamanDexDeepLink, {
      width: 196,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        // Ignore QR render fallback
      });

    let pollTimer: ReturnType<typeof setInterval> | null = null;
    if (/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(walletInput.trim())) {
      pollTimer = setInterval(() => {
        void syncXrplAccount(walletInput.trim());
      }, 6000);
    }

    return () => {
      active = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [showMobileQr, xamanDexDeepLink, walletInput, syncXrplAccount]);

  // Check if server has XAMAN_API_KEY & XAMAN_API_SECRET configured when XRPL DEX tab opens
  useEffect(() => {
    if (executionMode !== 'xrpl_dex' || xamanApiConfigured !== null) return;
    let active = true;
    fetch('/api/xaman/status')
      .then((r) => r.json())
      .then((data: { configured?: boolean }) => {
        if (active) setXamanApiConfigured(Boolean(data?.configured));
      })
      .catch(() => {
        if (active) setXamanApiConfigured(false);
      });
    return () => {
      active = false;
    };
  }, [executionMode, xamanApiConfigured]);

  // Generate local fallback QR codes for Android Xaman when Xaman API keys are not yet set in Secrets
  useEffect(() => {
    if (!showXamanConnectPanel) return;
    let active = true;
    QRCode.toDataURL(xamanDexDeepLink, {
      width: 212,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => {
        if (active) setXamanFallbackQrUrl(url);
      })
      .catch(() => {});

    QRCode.toDataURL(XAMAN_RLUSD_TRUSTLINE_URL, {
      width: 212,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => {
        if (active) setXamanFallbackTrustlineQrUrl(url);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [showXamanConnectPanel, xamanDexDeepLink]);

  // Poll active Xaman live payload UUID until user slides to sign on Android Xaman
  useEffect(() => {
    if (!xamanActivePayload?.uuid) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const resp = await fetch(
          `/api/xaman/payload/${encodeURIComponent(xamanActivePayload.uuid)}`
        );
        if (!resp.ok || cancelled) return;
        const data = (await resp.json()) as {
          resolved?: boolean;
          signed?: boolean;
          cancelled?: boolean;
          expired?: boolean;
          opened?: boolean;
          account?: string | null;
          txid?: string | null;
          dispatchedResult?: string | null;
          userToken?: string | null;
        };
        if (cancelled) return;

        if (data.opened && !data.resolved) {
          setXamanPayloadState('opened');
        }

        if (data.resolved) {
          if (data.signed) {
            setXamanPayloadState('signed');
            if (data.userToken) {
              setXamanUserToken(data.userToken);
              try {
                localStorage.setItem('symphony_xaman_user_token_v1', data.userToken);
              } catch {
                // Ignore storage errors
              }
            }
            if (data.account && /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(data.account)) {
              setWalletInput(data.account);
              onChangeXrplAddress?.(data.account);
              setXamanConnectedViaQr(true);
              void syncXrplAccount(data.account);
            } else if (/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(walletInput.trim())) {
              void syncXrplAccount(walletInput.trim());
            }

            if (xamanActivePayload.kind === 'signin') {
              setDexStatusMsg(
                `Android Xaman Wallet Connected (${data.account?.slice(0, 8)}...${data.account?.slice(-5)})! Ready for 1-swipe QR signing.`
              );
            } else if (xamanActivePayload.kind === 'trustset') {
              setDexStatusMsg(
                `RLUSD TrustLine signed on Android Xaman!${
                  data.txid ? ` Tx: ${data.txid.slice(0, 12)}...` : ''
                }`
              );
            } else {
              setDexStatusMsg(
                `XRPL Order signed on Android Xaman (${data.dispatchedResult || 'Submitted'})!${
                  data.txid ? ` Tx: ${data.txid.slice(0, 12)}...` : ''
                }`
              );
            }
            setXamanActivePayload(null);
          } else if (data.expired) {
            setXamanPayloadState('expired');
            setDexErrorMsg('Xaman QR request expired after 5 minutes. Tap again to generate a fresh QR.');
            setXamanActivePayload(null);
          } else {
            setXamanPayloadState('cancelled');
            setDexErrorMsg('Request was declined in Android Xaman. No transaction was submitted.');
            setXamanActivePayload(null);
          }
        }
      } catch {
        // Keep polling gently on transient hiccup
      }
    };

    const timer = setInterval(() => void poll(), 2500);
    void poll();
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [xamanActivePayload, onChangeXrplAddress, syncXrplAccount, walletInput]);

  const requestXamanPayload = async (params: {
    kind: 'signin' | 'trustset' | 'offercreate';
    title: string;
    subtitle: string;
    instruction: string;
    txjson?: Record<string, unknown>;
  }) => {
    setDexErrorMsg(null);
    setDexStatusMsg(null);
    setShowXamanConnectPanel(true);

    if (xamanApiConfigured === false) {
      setXamanActivePayload(null);
      setXamanFallbackTab(params.kind === 'trustset' ? 'trustline' : 'dex');
      return;
    }

    setDexBusy(true);
    try {
      const resp = await fetch('/api/xaman/payload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: params.kind,
          txjson: params.txjson,
          instruction: params.instruction,
          userToken: xamanUserToken || undefined,
        }),
      });
      const data = (await resp.json()) as {
        configured?: boolean;
        uuid?: string;
        qrPng?: string;
        nextAlways?: string;
        pushed?: boolean;
        error?: string;
      };

      if (resp.status === 503 || data.configured === false) {
        setXamanApiConfigured(false);
        setXamanActivePayload(null);
        setXamanFallbackTab(params.kind === 'trustset' ? 'trustline' : 'dex');
        return;
      }

      if (!resp.ok || !data.uuid) {
        setDexErrorMsg(data.error || 'Could not create Xaman Android QR request.');
        return;
      }

      setXamanApiConfigured(true);
      setXamanPayloadState('waiting');
      setXamanActivePayload({
        kind: params.kind,
        uuid: data.uuid,
        qrPng: data.qrPng || '',
        nextAlways: data.nextAlways || `https://xumm.app/sign/${data.uuid}`,
        pushed: Boolean(data.pushed),
        title: params.title,
        subtitle: params.subtitle,
      });
    } catch (err: unknown) {
      setDexErrorMsg(err instanceof Error ? err.message : 'Unable to reach Xaman bridge.');
    } finally {
      setDexBusy(false);
    }
  };

  // Compute crystal-clear XRPL DEX order size & limit price
  // NEVER silently replace user's "2 XRP" with 0.948 XRP unless they explicitly clicked "Auto 2% Risk"!
  const xrplStagedOrder = useMemo(() => {
    const autoRiskCapXrp = acctSnapshot?.activated
      ? Math.max(
          0.5,
          Math.min(calculations.quantity, Math.max(0.5, acctSnapshot.spendableXrp - 0.5))
        )
      : Math.max(
          0.5,
          Math.min(calculations.quantity, accountBalance / Math.max(0.01, calculations.safeEntry))
        );

    const parsedCustom = Number(customXrpOrderQty);
    const rawChosenQty = useAutoRiskXrpQty
      ? autoRiskCapXrp
      : parsedCustom > 0
      ? parsedCustom
      : 2;
    const xrpQty = Number(Math.max(0.1, rawChosenQty).toFixed(4));

    const isBuyXrp = dexOrderAction === 'BUY_ENTRY';
    const defaultActionPrice =
      dexOrderAction === 'SELL_TARGET'
        ? Number(calculations.takeProfit.toFixed(4))
        : dexOrderAction === 'SELL_ENTRY'
        ? Number((orderbook?.bestBid || livePrice || calculations.safeEntry).toFixed(4))
        : Number(calculations.safeEntry.toFixed(4));

    const parsedCustomPrice = Number(customDexLimitPrice);
    const limitPrice = Number(
      (parsedCustomPrice > 0 ? parsedCustomPrice : defaultActionPrice).toFixed(4)
    );

    const rlusdTotal = Number((xrpQty * limitPrice).toFixed(4));
    const dropsStr = String(Math.max(1, Math.round(xrpQty * 1_000_000)));

    const rlusdAmountObj = {
      currency: XRPL_RLUSD_HEX,
      issuer: XRPL_RLUSD_ISSUER,
      value: String(rlusdTotal),
    };

    // On XRPL OfferCreate:
    // - TakerGets = asset YOU give up (sell)
    // - TakerPays = asset YOU receive (buy)
    const takerGets = isBuyXrp ? rlusdAmountObj : dropsStr;
    const takerPays = isBuyXrp ? dropsStr : rlusdAmountObj;

    const rawOfferCreateJson = {
      TransactionType: 'OfferCreate',
      Account: walletInput.trim() || 'rYourPublicXrplWalletAddress',
      TakerGets: takerGets,
      TakerPays: takerPays,
    };

    const exceedsSpendableXrp =
      !isBuyXrp &&
      Boolean(acctSnapshot?.activated) &&
      xrpQty > Math.max(0, (acctSnapshot?.spendableXrp ?? 0) - 0.2);

    const needsMoreRlusdToBuy =
      isBuyXrp &&
      Boolean(acctSnapshot?.activated) &&
      rlusdTotal > (acctSnapshot?.rlusdBalance ?? 0) + 0.01;

    return {
      isBuyXrp,
      xrpQty,
      autoRiskCapXrp: Number(autoRiskCapXrp.toFixed(2)),
      limitPrice,
      rlusdTotal,
      dropsStr,
      takerGets,
      takerPays,
      rawOfferCreateJson,
      exceedsSpendableXrp,
      needsMoreRlusdToBuy,
    };
  }, [
    acctSnapshot,
    calculations.quantity,
    calculations.safeEntry,
    calculations.takeProfit,
    accountBalance,
    customXrpOrderQty,
    useAutoRiskXrpQty,
    customDexLimitPrice,
    dexOrderAction,
    orderbook?.bestBid,
    livePrice,
    walletInput,
  ]);

  const handleCopyHelper = (kind: 'json' | 'qty' | 'price', text: string) => {
    void navigator.clipboard?.writeText(text);
    setCopiedField(kind);
    setTimeout(() => setCopiedField(null), 2200);
  };

  const handleConnectCrossmark = async () => {
    setDexErrorMsg(null);
    setDexStatusMsg(null);
    const crossmark = (window as unknown as CrossmarkWindow).xrpl?.crossmark;
    if (!crossmark?.signInAndWait) {
      setDexErrorMsg(
        'Crossmark browser extension is for desktop Chrome/Edge. On Android/iOS, paste your r... address above and use "Open Xaman DEX on This Device" in Step 4!'
      );
      return;
    }
    setDexBusy(true);
    try {
      const res = await crossmark.signInAndWait();
      const addr = res?.response?.data?.address;
      if (addr) {
        setWalletInput(addr);
        setDexStatusMsg(`Connected Crossmark XRPL wallet (${addr.slice(0, 8)}...${addr.slice(-5)}).`);
        await syncXrplAccount(addr);
      }
    } catch (err: unknown) {
      setDexErrorMsg(err instanceof Error ? err.message : 'Crossmark sign-in cancelled.');
    } finally {
      setDexBusy(false);
    }
  };

  const handleConnectGemWallet = async () => {
    setDexErrorMsg(null);
    setDexStatusMsg(null);
    setDexBusy(true);
    try {
      const check = await isInstalled();
      if (!check?.result?.isInstalled) {
        setDexErrorMsg(
          'GemWallet browser extension is for desktop browsers. On Android/iOS, paste your r... address above and tap "Open Xaman DEX on This Device" in Step 4!'
        );
        return;
      }
      const addrResp = await getAddress();
      const addr = addrResp?.result?.address;
      if (addr) {
        setWalletInput(addr);
        setDexStatusMsg(`Connected GemWallet XRPL wallet (${addr.slice(0, 8)}...${addr.slice(-5)}).`);
        await syncXrplAccount(addr);
      } else {
        setDexErrorMsg('GemWallet connection was declined or locked.');
      }
    } catch (err: unknown) {
      setDexErrorMsg(err instanceof Error ? err.message : 'GemWallet connection error.');
    } finally {
      setDexBusy(false);
    }
  };

  const handleSignEmbeddedOfferCrossmark = async () => {
    setDexErrorMsg(null);
    setDexStatusMsg(null);
    const crossmark = (window as unknown as CrossmarkWindow).xrpl?.crossmark;
    if (!crossmark?.signAndSubmitAndWait) {
      setDexErrorMsg(
        'Crossmark desktop extension not detected. On your Android phone/tablet, tap the green "Open Xaman DEX on This Device" button right above!'
      );
      return;
    }
    setDexBusy(true);
    try {
      const txPayload: Record<string, unknown> = {
        TransactionType: 'OfferCreate',
        TakerGets: xrplStagedOrder.takerGets,
        TakerPays: xrplStagedOrder.takerPays,
      };
      if (/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(walletInput.trim())) {
        txPayload.Account = walletInput.trim();
      }
      const resp = await crossmark.signAndSubmitAndWait(txPayload);
      const txHash = resp?.response?.data?.resp?.result?.hash;
      const engineResult = resp?.response?.data?.resp?.result?.engine_result;
      playTradeSetSymphonyNote({
        setNumber: dexOrderAction === 'SELL_TARGET' ? 10 : 1,
        outcome: 'WIN_TARGET_HIT',
        winOrdinalIndex: dexOrderAction === 'SELL_TARGET' ? 7 : 3,
        rMultiple: rrRatio,
      });
      setDexStatusMsg(
        `XRPL OfferCreate submitted (${engineResult || 'Signed'})${
          txHash ? ` · Hash ${txHash.slice(0, 10)}...` : ''
        }`
      );
      await fetchLiveXrplBook();
      if (/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(walletInput.trim())) {
        await syncXrplAccount(walletInput.trim());
      }
    } catch (err: unknown) {
      setDexErrorMsg(err instanceof Error ? err.message : 'Crossmark OfferCreate cancelled.');
    } finally {
      setDexBusy(false);
    }
  };

  const handleSignEmbeddedOfferGemWallet = async () => {
    setDexErrorMsg(null);
    setDexStatusMsg(null);
    setDexBusy(true);
    try {
      const check = await isInstalled();
      if (!check?.result?.isInstalled) {
        setDexErrorMsg(
          'GemWallet desktop extension not detected. On your Android phone/tablet, tap the green "Open Xaman DEX on This Device" button right above!'
        );
        return;
      }
      const res = await createOffer({
        takerGets: xrplStagedOrder.takerGets,
        takerPays: xrplStagedOrder.takerPays,
      });
      if (res?.result?.hash) {
        playTradeSetSymphonyNote({
          setNumber: dexOrderAction === 'SELL_TARGET' ? 10 : 1,
          outcome: 'WIN_TARGET_HIT',
          winOrdinalIndex: dexOrderAction === 'SELL_TARGET' ? 7 : 3,
          rMultiple: rrRatio,
        });
        setDexStatusMsg(
          `XRPL OfferCreate broadcast via GemWallet! Hash: ${res.result.hash.slice(0, 12)}...`
        );
        await fetchLiveXrplBook();
        if (/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(walletInput.trim())) {
          await syncXrplAccount(walletInput.trim());
        }
      } else {
        setDexErrorMsg('Order signature was declined in GemWallet.');
      }
    } catch (err: unknown) {
      setDexErrorMsg(err instanceof Error ? err.message : 'GemWallet OfferCreate failed.');
    } finally {
      setDexBusy(false);
    }
  };

  const handleEnableRlusdTrustlineGemWallet = async () => {
    setDexErrorMsg(null);
    setDexStatusMsg(null);
    setDexBusy(true);
    try {
      const check = await isInstalled();
      if (check?.result?.isInstalled) {
        const res = await setTrustline({
          limitAmount: {
            currency: XRPL_RLUSD_HEX,
            issuer: XRPL_RLUSD_ISSUER,
            value: '100000',
          },
        });
        if (res?.result?.hash) {
          setDexStatusMsg(`RLUSD TrustLine enabled! Hash: ${res.result.hash.slice(0, 10)}...`);
          if (/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(walletInput.trim())) {
            await syncXrplAccount(walletInput.trim());
          }
          return;
        }
      }
      const crossmark = (window as unknown as CrossmarkWindow).xrpl?.crossmark;
      if (crossmark?.signAndSubmitAndWait) {
        await crossmark.signAndSubmitAndWait({
          TransactionType: 'TrustSet',
          LimitAmount: {
            currency: XRPL_RLUSD_HEX,
            issuer: XRPL_RLUSD_ISSUER,
            value: '100000',
          },
        });
        setDexStatusMsg('RLUSD TrustLine submitted via Crossmark!');
        if (/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(walletInput.trim())) {
          await syncXrplAccount(walletInput.trim());
        }
        return;
      }
      setDexStatusMsg(
        'On Android/iOS, tap "Add RLUSD in Xaman App" right in Step 1B above (or open Xaman → + Add → RLUSD).'
      );
    } catch (err: unknown) {
      setDexErrorMsg(err instanceof Error ? err.message : 'TrustSet request cancelled.');
    } finally {
      setDexBusy(false);
    }
  };

  const handleCancelOpenOffer = async (offerSeq: number) => {
    setDexErrorMsg(null);
    setDexStatusMsg(null);
    setDexBusy(true);
    try {
      const check = await isInstalled();
      if (check?.result?.isInstalled) {
        const res = await cancelOffer({ offerSequence: offerSeq });
        if (res?.result?.hash) {
          setDexStatusMsg(`Cancelled Offer #${offerSeq} (${res.result.hash.slice(0, 10)}...).`);
          await syncXrplAccount(walletInput.trim());
          return;
        }
      }
      const crossmark = (window as unknown as CrossmarkWindow).xrpl?.crossmark;
      if (crossmark?.signAndSubmitAndWait) {
        await crossmark.signAndSubmitAndWait({
          TransactionType: 'OfferCancel',
          OfferSequence: offerSeq,
        });
        setDexStatusMsg(`Cancelled Offer #${offerSeq} via Crossmark.`);
        await syncXrplAccount(walletInput.trim());
        return;
      }
      setDexErrorMsg(
        `Open Xaman DEX on your device to cancel Offer #${offerSeq}, or connect GemWallet/Crossmark on desktop.`
      );
    } catch (err: unknown) {
      setDexErrorMsg(err instanceof Error ? err.message : 'OfferCancel failed.');
    } finally {
      setDexBusy(false);
    }
  };

  const handleApplyAtrStop = () => {
    if (livePrice <= 0 || atr14 <= 0) return;
    const atrPct = Math.min(12, Math.max(0.5, ((atr14 * 1.5) / livePrice) * 100));
    onStopDistancePctChange(Number(atrPct.toFixed(2)));
  };

  const handleSubmitPaperOrder = () => {
    playFibonacciHarmonicInterval({
      rootHz: 256.87,
      targetHz: effectiveChartSide === 'long' ? 415.3 : 192.43,
      tone: effectiveChartSide === 'long' ? 'warm_chord' : 'cello',
    });
    onOpenPaperPosition({
      symbol,
      instrument,
      side: effectiveChartSide,
      entryPrice: Number(calculations.safeEntry.toFixed(decimals)),
      stopLoss: Number(calculations.stopLoss.toFixed(decimals)),
      takeProfit: Number(calculations.takeProfit.toFixed(decimals)),
      quantity: Number(calculations.quantity.toFixed(symbol === 'BTCUSDT' ? 6 : 2)),
      notionalUsd: Number(calculations.notionalUsd.toFixed(2)),
      marginRequiredUsd: Number(calculations.marginRequiredUsd.toFixed(2)),
      leverage: instrument === 'spot' ? 1 : leverage,
      liquidationPrice: calculations.liquidationPrice
        ? Number(calculations.liquidationPrice.toFixed(decimals))
        : null,
      riskAmountUsd: Number(calculations.riskAmountUsd.toFixed(2)),
      riskPercent,
      rewardAmountUsd: Number(calculations.rewardAmountUsd.toFixed(2)),
      rrRatio,
    });
  };

  const syncedWalletUsdApprox =
    acctSnapshot?.activated
      ? Number(
          (
            acctSnapshot.spendableXrp * (livePrice || 1) +
            acctSnapshot.rlusdBalance
          ).toFixed(2)
        )
      : null;

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-5 flex flex-col gap-5">
      {/* Header + Embedded Execution Mode Switcher */}
      <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Risk Manager & Embedded Order Desk
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {executionMode === 'xrpl_dex'
                ? 'Step-by-Step Real XRPL DEX (1x Spot · Non-Custodial)'
                : `2% Account Risk Cap · 1:${rrRatio} R:R · Paper Simulator`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onRiskPercentChange(2.0);
              onRrRatioChange(2);
              onTradeSideChange('long');
              onEntryPriceChange(Number(livePrice.toFixed(decimals)));
              setCustomDexLimitPrice('');
            }}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Reset 2% / 1:2
          </button>
        </div>

        {/* Mode Switcher: Paper Simulator vs Embedded XRPL DEX */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setExecutionMode('paper')}
            className={`py-2 px-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              executionMode === 'paper'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Paper Risk Simulator
          </button>
          <button
            type="button"
            onClick={() => {
              setExecutionMode('xrpl_dex');
              onInstrumentChange('spot');
              onLeverageChange(1);
              onTradeSideChange('long');
            }}
            className={`py-2 px-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              executionMode === 'xrpl_dex'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300'
            }`}
          >
            ⚡ Embedded XRPL DEX
          </button>
        </div>
      </div>

      {/* Instrument & Side Segmented Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Instrument Structure
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            {(['spot', 'futures', 'options'] as InstrumentType[]).map((inst) => (
              <button
                key={inst}
                type="button"
                disabled={executionMode === 'xrpl_dex' && inst !== 'spot'}
                onClick={() => onInstrumentChange(inst)}
                className={`py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  instrument === inst
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {inst}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            {executionMode === 'xrpl_dex'
              ? 'Spot Wallet Action (No Shorting)'
              : 'Eagle Directional Bias'}
          </label>
          {executionMode === 'xrpl_dex' ? (
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  onTradeSideChange('long');
                  setDexOrderAction('SELL_TARGET');
                  setCustomDexLimitPrice('');
                }}
                className={`py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  dexOrderAction !== 'BUY_ENTRY'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sell My XRP → $
              </button>
              <button
                type="button"
                onClick={() => {
                  onTradeSideChange('long');
                  setDexOrderAction('BUY_ENTRY');
                  setCustomDexLimitPrice('');
                }}
                className={`py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  dexOrderAction === 'BUY_ENTRY'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Buy XRP ← $
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onTradeSideChange('long')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  tradeSide === 'long'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {instrument === 'options' ? 'Long Call (Eagle ↑)' : 'Buy / Ascend ↑'}
              </button>
              <button
                type="button"
                onClick={() => onTradeSideChange('short')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  tradeSide === 'short'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {instrument === 'options' ? 'Long Put (Eagle ↓)' : 'Short / Descend ↓'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Account Balance ($ USD) & Entry Price ($) Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="sim-account-balance"
              className="text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Total Wallet Budget ($ USD)
            </label>
            <div className="flex items-center gap-1.5 text-[11px]">
              {syncedWalletUsdApprox !== null && syncedWalletUsdApprox > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => onAccountBalanceChange(syncedWalletUsdApprox)}
                    className="font-semibold text-amber-600 dark:text-amber-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    My Wallet (${syncedWalletUsdApprox})
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  onAccountBalanceChange(5);
                  onInstrumentChange('spot');
                  onLeverageChange(1);
                }}
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                $5
              </button>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <button
                type="button"
                onClick={() => onAccountBalanceChange(100)}
                className="font-medium text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                $100
              </button>
            </div>
          </div>
          <input
            id="sim-account-balance"
            type="number"
            min={1}
            step="any"
            value={accountBalance}
            onChange={(e) => onAccountBalanceChange(Math.max(1, Number(e.target.value)))}
            className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {executionMode === 'xrpl_dex' && accountBalance <= 4 && (
            <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
              Note: This box is your <strong>total dollar budget ($)</strong>. To sell or buy an exact coin amount like <strong>2 XRP</strong>, set <strong>Step 2: Exact XRP Coins</strong> below!
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="sim-entry-price"
              className="text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Buy Entry / Reference Price ($)
            </label>
            <button
              type="button"
              onClick={() => {
                onEntryPriceChange(Number(livePrice.toFixed(decimals)));
                setCustomDexLimitPrice('');
              }}
              className="text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Use Live (${livePrice.toFixed(decimals)})
            </button>
          </div>
          <input
            id="sim-entry-price"
            type="number"
            step="0.0001"
            value={entryPrice}
            onChange={(e) => onEntryPriceChange(Math.max(0.0001, Number(e.target.value)))}
            className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Symphony Musical Buy / Stop / Sell Marker Audition Bar (Accurate labels for Spot & Short!) */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
          <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Musical Markers:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              playFibonacciHarmonicInterval({
                rootHz: 256.87,
                targetHz: 415.3,
                tone: 'warm_chord',
              })
            }
            className="px-2 py-1 rounded border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 font-mono font-medium hover:bg-sky-500/20 cursor-pointer whitespace-nowrap shrink-0"
          >
            ♫ {effectiveChartSide === 'short' ? 'Short' : 'Buy'} ${calculations.safeEntry.toFixed(decimals)}
          </button>
          <button
            type="button"
            onClick={() =>
              playFibonacciHarmonicInterval({
                rootHz: 192.43,
                targetHz: 256.87,
                tone: 'cello',
              })
            }
            className="px-2 py-1 rounded border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-mono font-medium hover:bg-rose-500/20 cursor-pointer whitespace-nowrap shrink-0"
          >
            ♩ Stop ${calculations.stopLoss.toFixed(decimals)}
          </button>
          <button
            type="button"
            onClick={() =>
              playFibonacciHarmonicInterval({
                rootHz: 432,
                targetHz: 432 * 1.618,
                tone: 'warm_chord',
              })
            }
            className="px-2 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono font-medium hover:bg-emerald-500/20 cursor-pointer whitespace-nowrap shrink-0"
          >
            ♬ {effectiveChartSide === 'short' ? 'Cover' : 'Sell TP'} ${calculations.takeProfit.toFixed(decimals)}
          </button>
        </div>
      </div>

      {/* Sliders: Account Risk % & Stop-Loss Distance % (Collapsible/Compact in DEX Mode, Full in Paper Mode) */}
      <div className="space-y-4 pt-0.5">
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Account Risk Cap:{' '}
              <strong className="font-mono tabular-nums text-sky-600 dark:text-sky-400">
                {riskPercent.toFixed(1)}%
              </strong>
            </span>
            <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
              Max Loss: -${calculations.riskAmountUsd.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={5.0}
            step={0.5}
            value={riskPercent}
            onChange={(e) => onRiskPercentChange(Number(e.target.value))}
            aria-label="Account Risk Threshold Percentage"
            className="w-full accent-sky-500 cursor-pointer"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            <span>0.5% Conservative</span>
            <span className="text-sky-500 font-medium">2.0% Standard Cap</span>
            <span>5.0% High Risk</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Stop-Loss Distance:{' '}
              <strong className="font-mono tabular-nums text-rose-500">
                {stopDistancePct.toFixed(2)}%
              </strong>
            </span>
            <button
              type="button"
              onClick={handleApplyAtrStop}
              className="text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Set 1.5x ATR (${(atr14 * 1.5).toFixed(4)})
            </button>
          </div>
          <input
            type="range"
            min={0.5}
            max={10.0}
            step={0.25}
            value={stopDistancePct}
            onChange={(e) => onStopDistancePctChange(Number(e.target.value))}
            aria-label="Stop-Loss Distance Percentage"
            className="w-full accent-rose-500 cursor-pointer"
          />
        </div>

        {/* Risk-Reward Ratio Selector */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Risk-Reward Profit Target Ratio
          </span>
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            {[1.5, 2, 3].map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => onRrRatioChange(ratio)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  rrRatio === ratio
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                1:{ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional Futures Leverage or Options Premium Controls */}
        {executionMode === 'paper' && instrument === 'futures' && (
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Perpetual Futures Leverage:{' '}
                <strong className="font-mono text-amber-500">{leverage}x</strong>
              </span>
              <span className="font-mono text-slate-500 dark:text-slate-400">
                Init Margin: ${calculations.marginRequiredUsd.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={leverage}
              onChange={(e) => onLeverageChange(Number(e.target.value))}
              aria-label="Futures Leverage Multiplier"
              className="w-full accent-amber-500 cursor-pointer"
            />
            {calculations.isStopBeyondLiquidation && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                Warning: At {leverage}x leverage, estimated liquidation ($
                {calculations.liquidationPrice?.toFixed(decimals)}) triggers before your stop-loss ($
                {calculations.stopLoss.toFixed(decimals)}). Reduce leverage or tighten stop distance.
              </p>
            )}
          </div>
        )}

        {executionMode === 'paper' && instrument === 'options' && (
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Option Contract Premium (% of Spot):{' '}
                <strong className="font-mono text-sky-500">{optionPremiumPct.toFixed(1)}%</strong>
              </span>
              <span className="font-mono text-slate-500 dark:text-slate-400">
                Breakeven: ${calculations.optionBreakEvenPrice.toFixed(decimals)}
              </span>
            </div>
            <input
              type="range"
              min={1.0}
              max={10.0}
              step={0.5}
              value={optionPremiumPct}
              onChange={(e) => setOptionPremiumPct(Number(e.target.value))}
              aria-label="Option Premium Percentage"
              className="w-full accent-sky-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Long options cap maximum loss to the premium paid (${calculations.riskAmountUsd.toFixed(2)}) without margin liquidation risk, but require price to pass ${calculations.optionBreakEvenPrice.toFixed(decimals)} before expiry.
            </p>
          </div>
        )}
      </div>

      {/* Real-Time Calculated Stop-Loss & Profit Target Summary */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Safety Stop Below ({riskPercent.toFixed(1)}% Risk)
            </div>
            <div className="text-sm font-mono font-semibold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
              ${calculations.stopLoss.toFixed(decimals)}
            </div>
            <div className="text-xs font-mono text-rose-600/80 dark:text-rose-400/80 tabular-nums">
              Max Risk: -${calculations.riskAmountUsd.toFixed(2)}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Profit Target Sell (1:{rrRatio} R:R)
            </div>
            <div className="text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
              ${calculations.takeProfit.toFixed(decimals)}
            </div>
            <div className="text-xs font-mono text-emerald-600/80 dark:text-emerald-400/80 tabular-nums">
              Target Gain: +${calculations.rewardAmountUsd.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Formula Sizing Telemetry Rows (Clarified so students distinguish Formula Size vs Exact DEX Size) */}
        <div className="space-y-1.5 text-xs font-mono tabular-nums pt-1">
          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/70">
            <span className="font-sans text-slate-500 dark:text-slate-400">
              2% Risk-Formula Size ({baseAsset})
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {calculations.quantity.toLocaleString(undefined, {
                maximumFractionDigits: symbol === 'BTCUSDT' ? 6 : 2,
              })}{' '}
              {baseAsset}
            </span>
          </div>
          {executionMode === 'paper' && (
            <>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/70">
                <span className="font-sans text-slate-500 dark:text-slate-400">
                  Total Notional Exposure
                </span>
                <span className="text-slate-800 dark:text-slate-200">
                  ${calculations.notionalUsd.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="font-sans text-slate-500 dark:text-slate-400">
                  Mark-to-Market vs. Live (${livePrice.toFixed(decimals)})
                </span>
                <span
                  className={
                    calculations.liveSimulatedPnlUsd >= 0
                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-rose-600 dark:text-rose-400 font-semibold'
                  }
                >
                  {calculations.liveSimulatedPnlUsd >= 0 ? '+' : ''}$
                  {calculations.liveSimulatedPnlUsd.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* ====================================================================
         * EXECUTION FOOTER: PAPER SIMULATOR OR STEP-BY-STEP EMBEDDED XRPL DEX
         * ==================================================================== */}
        {executionMode === 'paper' ? (
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleSubmitPaperOrder}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Log Simulated {effectiveChartSide === 'long' ? 'Long' : 'Short'} Position ({baseAsset})
            </button>
            <button
              type="button"
              onClick={() => {
                setExecutionMode('xrpl_dex');
                onInstrumentChange('spot');
                onLeverageChange(1);
                onTradeSideChange('long');
                if (symbol !== 'XRPUSDT') {
                  onSwitchToXrpSymbol?.();
                }
              }}
              className="w-full py-2 px-3 border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Place Real Order in Embedded XRPL DEX (Step-by-Step) →
            </button>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/[0.04] dark:bg-slate-950 p-3.5 space-y-4">
            {/* Top Header */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Step-by-Step Embedded XRPL DEX (XRP / RLUSD)</span>
              </div>
              <button
                type="button"
                onClick={() => void fetchLiveXrplBook()}
                disabled={bookLoading}
                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3 h-3 ${bookLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Book</span>
              </button>
            </div>

            {symbol !== 'XRPUSDT' && onSwitchToXrpSymbol && (
              <div className="rounded-lg border border-amber-400/50 bg-amber-500/10 p-2.5 flex items-center justify-between gap-2 text-xs">
                <span className="text-amber-900 dark:text-amber-200">
                  XRPL DEX trades real <strong>XRP / RLUSD</strong>. Switch chart from {baseAsset} to XRP?
                </span>
                <button
                  type="button"
                  onClick={onSwitchToXrpSymbol}
                  className="px-2.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Switch to XRP
                </button>
              </div>
            )}

            {/* ==============================================================
             * 1-TAP 10-SET AUTO-TRADER IMPORTER & CLIPBOARD PASTE BRIDGE
             * ============================================================== */}
            <div className="rounded-lg border border-sky-300/70 dark:border-sky-500/35 bg-sky-50/70 dark:bg-slate-900 p-2.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="text-[11px] font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Load Trade #1 – #10 From Auto-Trader (No Manual Copying Needed!)</span>
                </span>
                <button
                  type="button"
                  onClick={() => void handlePasteFromClipboard()}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded border border-sky-400/60 bg-white dark:bg-slate-800 hover:bg-sky-100/60 dark:hover:bg-slate-700 text-[11px] font-semibold text-sky-800 dark:text-sky-200 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ClipboardPaste className="w-3 h-3 shrink-0" />
                  <span>Paste Copied Set</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleLoadBuiltInAutoSet(num)}
                    className={`px-2 py-1 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                      activeLoadedSetLabel && selectedQuickSetNum === num
                        ? 'bg-sky-600 text-white'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-400'
                    }`}
                  >
                    Load Set #0{num}
                  </button>
                ))}
                <select
                  aria-label="Choose Auto-Trader Set 1 to 10"
                  value={selectedQuickSetNum}
                  onChange={(e) => handleLoadBuiltInAutoSet(Number(e.target.value))}
                  className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  {QUICK_AUTO_SET_TEMPLATES.map((t) => (
                    <option key={t.setNumber} value={t.setNumber}>
                      {t.setNumber < 10 ? `#0${t.setNumber}` : `#${t.setNumber}`} ·{' '}
                      {t.name.split('·')[1]?.trim()}
                    </option>
                  ))}
                </select>
              </div>

              {showPasteBox && (
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={manualPasteText}
                    onChange={(e) => setManualPasteText(e.target.value)}
                    placeholder="Long-press Paste your copied Set #1 text here..."
                    className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-mono rounded border border-sky-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => parseCopiedAutoTraderString(manualPasteText)}
                    className="px-2.5 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Apply Set
                  </button>
                </div>
              )}

              {activeLoadedSetLabel && (
                <div className="rounded bg-white/90 dark:bg-slate-950 px-2.5 py-1.5 border border-sky-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong className="text-sky-700 dark:text-sky-400">✓ {activeLoadedSetLabel}</strong>
                  {acctSnapshot?.activated && acctSnapshot.rlusdBalance < 0.25 && (
                    <span>
                      {' '}
                      — Because your wallet currently has <strong>$0.00 RLUSD</strong> and{' '}
                      <strong>{acctSnapshot.spendableXrp} XRP</strong>, you already hold the XRP! Start by{' '}
                      <strong>Selling XRP for RLUSD</strong> below.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ==============================================================
             * STEP 1: DIRECT ANDROID XAMAN QR CONNECT + PUBLIC r... SYNC
             * ============================================================== */}
            <div
              id="xrpl-step1-wallet"
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>Step 1 · Connect Your Android Xaman Wallet</span>
                </span>
                <div className="flex items-center gap-2">
                  {acctSnapshot?.activated && (
                    <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {xamanConnectedViaQr ? '✓ Xaman Paired' : '✓ Synced'}
                    </span>
                  )}
                  {(walletInput.trim() || acctSnapshot) && (
                    <button
                      type="button"
                      onClick={() => {
                        setWalletInput('');
                        setAcctSnapshot(null);
                        setXamanConnectedViaQr(false);
                        setDexStatusMsg(null);
                        setDexErrorMsg(null);
                        onChangeXrplAddress?.('');
                      }}
                      className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Primary Tablet <-> Android Xaman Two-Way QR Buttons (Stacked so text never clips) */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTabletCameraScanner((v) => !v);
                    setShowXamanConnectPanel(false);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {showTabletCameraScanner
                      ? 'Close Tablet Camera Scanner'
                      : 'Scan My Android Xaman Receive QR'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={dexBusy}
                  onClick={() => {
                    setShowTabletCameraScanner(false);
                    if (showXamanConnectPanel && !xamanActivePayload && xamanApiConfigured === false) {
                      setShowXamanConnectPanel(false);
                    } else {
                      void requestXamanPayload({
                        kind: 'signin',
                        title: 'Scan With Xaman on Your Android Phone',
                        subtitle:
                          'Open Xaman on Android → tap the blue center Scan icon → scan this QR code to open XRP / RLUSD DEX or RLUSD TrustLine.',
                        instruction:
                          'Connect your Android Xaman wallet to Symphony Markets Academy XRP Trade Desk.',
                      });
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {showXamanConnectPanel
                      ? 'Hide Xaman QR Panel'
                      : 'Show QR to Open Xaman DEX / TrustLine'}
                  </span>
                </button>
              </div>

              {/* Tablet Camera Scanner: Hold Android Xaman "Receive" QR Up to Sync r... Instantly */}
              {showTabletCameraScanner && (
                <XrplCameraQrScanner
                  onClose={() => setShowTabletCameraScanner(false)}
                  onAddressScanned={(scannedAddr) => {
                    setShowTabletCameraScanner(false);
                    setWalletInput(scannedAddr);
                    onChangeXrplAddress?.(scannedAddr);
                    setXamanConnectedViaQr(true);
                    setDexErrorMsg(null);
                    setDexStatusMsg(
                      `Scanned Android Xaman Receive QR (${scannedAddr.slice(0, 8)}...${scannedAddr.slice(
                        -5
                      )}) — Live balance synced!`
                    );
                    void syncXrplAccount(scannedAddr);
                  }}
                />
              )}

              {/* Live Tablet -> Android Xaman QR Pairing / Signing Box */}
              {showXamanConnectPanel && (
                <div className="rounded-lg border border-sky-400/50 bg-sky-50/70 dark:bg-sky-950/30 p-3 space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                      <span>
                        {xamanActivePayload
                          ? xamanActivePayload.title
                          : 'Scan With Xaman on Your Android Phone'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowXamanConnectPanel(false);
                        setXamanActivePayload(null);
                      }}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer whitespace-nowrap"
                    >
                      Close ✕
                    </button>
                  </div>

                  {xamanActivePayload ? (
                    <div className="flex flex-col items-center text-center gap-2.5 py-1">
                      {xamanActivePayload.pushed && (
                        <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          Push notification sent directly to your paired Android Xaman app — or scan below:
                        </div>
                      )}
                      {xamanActivePayload.qrPng && (
                        <img
                          src={xamanActivePayload.qrPng}
                          alt="Scan with Xaman Wallet on Android"
                          referrerPolicy="no-referrer"
                          className="w-44 h-44 rounded-lg border border-slate-200 bg-white p-1.5"
                        />
                      )}
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs">
                        {xamanActivePayload.subtitle}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <span className="text-[11px] font-mono text-sky-700 dark:text-sky-300">
                          {xamanPayloadState === 'opened'
                            ? 'Opened in Xaman — waiting for your slide-to-sign...'
                            : 'Listening for Android Xaman scan...'}
                        </span>
                        <a
                          href={xamanActivePayload.nextAlways}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 dark:bg-sky-600 text-white text-[11px] font-semibold whitespace-nowrap"
                        >
                          <span>Open on This Device</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setXamanFallbackTab('dex')}
                          className={`py-1 px-2 rounded-md font-semibold transition-colors cursor-pointer ${
                            xamanFallbackTab === 'dex'
                              ? 'bg-sky-600 text-white'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          1. Open Xaman DEX QR
                        </button>
                        <button
                          type="button"
                          onClick={() => setXamanFallbackTab('trustline')}
                          className={`py-1 px-2 rounded-md font-semibold transition-colors cursor-pointer ${
                            xamanFallbackTab === 'trustline'
                              ? 'bg-amber-500 text-slate-950'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          2. RLUSD TrustLine QR
                        </button>
                      </div>

                      <div className="flex flex-col items-center text-center gap-2">
                        {(xamanFallbackTab === 'dex'
                          ? xamanFallbackQrUrl
                          : xamanFallbackTrustlineQrUrl) && (
                          <img
                            src={
                              xamanFallbackTab === 'dex'
                                ? xamanFallbackQrUrl
                                : xamanFallbackTrustlineQrUrl
                            }
                            alt="Scan with Xaman app on Android"
                            className="w-40 h-40 rounded-lg border border-slate-200 bg-white p-1.5"
                          />
                        )}
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                          {xamanFallbackTab === 'dex' ? (
                            <>
                              Point your <strong>Android Xaman camera</strong> at this QR to open the{' '}
                              <strong>XRP / RLUSD DEX</strong> directly on your Android signing wallet,
                              while keeping your tablet synced to your public{' '}
                              <span className="font-mono">r...</span> address below.
                            </>
                          ) : (
                            <>
                              Point your <strong>Android Xaman camera</strong> at this QR to enable the
                              one-time <strong>RLUSD TrustLine</strong> on your Android wallet (locks 0.2
                              XRP refundable reserve).
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                  placeholder="Or paste public r... address to watch balance"
                  className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  disabled={acctLoading}
                  onClick={() => void syncXrplAccount()}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {acctLoading ? 'Syncing...' : 'Sync'}
                </button>
              </div>

              {acctSnapshot && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-[11px] font-mono tabular-nums space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-slate-600 dark:text-slate-400">
                      Spendable XRP (after {acctSnapshot.reservedXrp} XRP reserve):
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {acctSnapshot.spendableXrp} XRP
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-slate-600 dark:text-slate-400">
                      RLUSD Dollar Balance:
                    </span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      ${acctSnapshot.rlusdBalance.toFixed(2)} RLUSD
                    </span>
                  </div>

                  {!acctSnapshot.hasRlusdTrustline && acctSnapshot.activated && (
                    <div className="pt-2 mt-1 border-t border-amber-300/60 dark:border-slate-800 font-sans space-y-1.5">
                      <div className="text-amber-800 dark:text-amber-300 font-semibold leading-snug">
                        One-Time Step 1B Needed: Enable RLUSD so your wallet can receive USD when you sell XRP (locks 0.2 XRP refundable reserve).
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            void requestXamanPayload({
                              kind: 'trustset',
                              title: 'Scan With Android Xaman to Enable RLUSD',
                              subtitle:
                                'Slide to sign this one-time RLUSD TrustLine on your Android Xaman wallet (0.2 XRP refundable reserve).',
                              instruction:
                                'Enable one-time RLUSD TrustLine on XRPL so your wallet can receive RLUSD when selling XRP.',
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <QrCode className="w-3 h-3" />
                          <span>Scan QR in Android Xaman</span>
                        </button>
                        <a
                          href={XAMAN_RLUSD_TRUSTLINE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-amber-500/60 bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 font-semibold text-[11px] whitespace-nowrap shrink-0"
                        >
                          <span>Open Xaman App</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => void handleEnableRlusdTrustlineGemWallet()}
                          className="px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-[11px] cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Desktop Extension
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <details className="text-[11px] text-slate-500 dark:text-slate-400">
                <summary className="cursor-pointer font-medium hover:text-slate-800 dark:hover:text-slate-200">
                  Using Desktop Chrome Extension? (GemWallet / Crossmark)
                </summary>
                <div className="grid grid-cols-2 gap-1.5 pt-2">
                  <button
                    type="button"
                    disabled={dexBusy}
                    onClick={() => void handleConnectGemWallet()}
                    className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Connect GemWallet
                  </button>
                  <button
                    type="button"
                    disabled={dexBusy}
                    onClick={() => void handleConnectCrossmark()}
                    className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Connect Crossmark
                  </button>
                </div>
              </details>
            </div>

            {/* ==============================================================
             * STEP 2: PICK ACTION, EXACT XRP COINS (e.g. 2 XRP!) & PRICE
             * ============================================================== */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-3">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Step 2 · Choose Sell vs. Buy & Exact XRP Coins to Trade
              </div>

              {/* Plain-English 3-Way Order Choice */}
              <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setDexOrderAction('SELL_TARGET');
                    setCustomDexLimitPrice('');
                  }}
                  className={`px-3 py-2 rounded-lg border text-left font-semibold flex items-center justify-between gap-2 cursor-pointer ${
                    dexOrderAction === 'SELL_TARGET'
                      ? 'border-emerald-500 bg-emerald-600 text-white'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>1. Sell My XRP @ Profit Target (Wait Higher)</span>
                  <span className="font-mono">${calculations.takeProfit.toFixed(4)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDexOrderAction('SELL_ENTRY');
                    setCustomDexLimitPrice('');
                  }}
                  className={`px-3 py-2 rounded-lg border text-left font-semibold flex items-center justify-between gap-2 cursor-pointer ${
                    dexOrderAction === 'SELL_ENTRY'
                      ? 'border-amber-500 bg-amber-500 text-slate-950'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>2. Sell My XRP Now @ Live Market Bid</span>
                  <span className="font-mono">
                    ${(orderbook?.bestBid || livePrice || calculations.safeEntry).toFixed(4)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDexOrderAction('BUY_ENTRY');
                    setCustomDexLimitPrice('');
                  }}
                  className={`px-3 py-2 rounded-lg border text-left font-semibold flex items-center justify-between gap-2 cursor-pointer ${
                    dexOrderAction === 'BUY_ENTRY'
                      ? 'border-sky-500 bg-sky-600 text-white'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>3. Buy XRP Dip (Requires RLUSD Balance)</span>
                  <span className="font-mono">${calculations.safeEntry.toFixed(4)}</span>
                </button>
              </div>

              {/* BIG BOLD EXACT XRP COIN AMOUNT INPUT + 1-TAP CHIPS (NO MORE 2 -> 0.948 CONFUSION!) */}
              <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-slate-950 border border-emerald-300/70 dark:border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <label
                    htmlFor="xrpl-order-qty"
                    className="text-xs font-bold text-slate-900 dark:text-white"
                  >
                    Exact XRP Coins to {xrplStagedOrder.isBuyXrp ? 'Buy' : 'Sell'}:
                  </label>
                  <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    ≈ ${xrplStagedOrder.rlusdTotal.toFixed(2)} RLUSD
                  </span>
                </div>

                {/* 1-Tap Coin Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[1, 2, 4].map((presetCoins) => {
                    const isActive =
                      !useAutoRiskXrpQty && Number(customXrpOrderQty) === presetCoins;
                    return (
                      <button
                        key={presetCoins}
                        type="button"
                        onClick={() => {
                          setUseAutoRiskXrpQty(false);
                          setCustomXrpOrderQty(String(presetCoins));
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold cursor-pointer ${
                          isActive
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-500'
                        }`}
                      >
                        {presetCoins} XRP
                      </button>
                    );
                  })}

                  {acctSnapshot?.activated && acctSnapshot.spendableXrp >= 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setUseAutoRiskXrpQty(false);
                        const halfSafe = Number(
                          Math.max(0.5, (acctSnapshot.spendableXrp - 0.4) * 0.5).toFixed(2)
                        );
                        setCustomXrpOrderQty(String(halfSafe));
                      }}
                      className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-500 cursor-pointer"
                    >
                      50% ({Number(Math.max(0.5, (acctSnapshot.spendableXrp - 0.4) * 0.5).toFixed(1))} XRP)
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setUseAutoRiskXrpQty(true);
                      setCustomXrpOrderQty(String(xrplStagedOrder.autoRiskCapXrp));
                    }}
                    className={`px-2 py-1 rounded-md text-[11px] font-mono font-medium cursor-pointer ${
                      useAutoRiskXrpQty
                        ? 'bg-sky-600 text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    2% Formula ({xrplStagedOrder.autoRiskCapXrp} XRP)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                      XRP Amount (Coins)
                    </span>
                    <input
                      id="xrpl-order-qty"
                      type="number"
                      min={0.1}
                      step="0.1"
                      value={useAutoRiskXrpQty ? xrplStagedOrder.autoRiskCapXrp : customXrpOrderQty}
                      onChange={(e) => {
                        setUseAutoRiskXrpQty(false);
                        setCustomXrpOrderQty(e.target.value);
                      }}
                      className="w-full px-2.5 py-1.5 text-sm font-mono font-bold tabular-nums bg-white dark:bg-slate-900 border-2 border-emerald-500/60 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                      Limit Price ($ RLUSD)
                    </span>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder={xrplStagedOrder.limitPrice.toFixed(4)}
                      value={customDexLimitPrice}
                      onChange={(e) => setCustomDexLimitPrice(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm font-mono font-semibold tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {xrplStagedOrder.exceedsSpendableXrp && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    Heads up: {xrplStagedOrder.xrpQty} XRP is above your safe spendable balance (
                    {Math.max(0, (acctSnapshot?.spendableXrp ?? 0) - 0.2).toFixed(2)} XRP after 0.2 XRP offer reserve).
                  </p>
                )}

                {xrplStagedOrder.needsMoreRlusdToBuy && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                    Your wallet has <strong>${acctSnapshot?.rlusdBalance.toFixed(2)} RLUSD</strong>. Choose{' '}
                    <strong>1. Sell My XRP</strong> or <strong>2. Sell Now</strong> above first so you receive RLUSD dollars!
                  </p>
                )}
              </div>

              {/* Compact Live XRPL Orderbook (Tap Any Bid/Ask to Set Limit Price) */}
              <details className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 text-[11px]">
                <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>
                    View Live XRPL Orderbook {orderbook?.ledgerIndex ? `(#${orderbook.ledgerIndex})` : ''} — Tap Price to Use
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    Bid ${orderbook?.bestBid?.toFixed(4) ?? '--'} / Ask ${orderbook?.bestAsk?.toFixed(4) ?? '--'}
                  </span>
                </summary>
                <div className="grid grid-cols-2 gap-2 pt-2 font-mono tabular-nums">
                  <div className="space-y-1">
                    <div className="text-[10px] font-sans font-semibold text-emerald-700 dark:text-emerald-400">
                      Buyers (Bids)
                    </div>
                    {(orderbook?.bids?.slice(0, 3) || []).map((b, idx) => (
                      <button
                        key={`bid-${idx}`}
                        type="button"
                        onClick={() => setCustomDexLimitPrice(b.priceUsd.toFixed(4))}
                        className="w-full flex items-center justify-between px-1.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 cursor-pointer"
                      >
                        <span>${b.priceUsd.toFixed(4)}</span>
                        <span>{b.xrpSize} XRP</span>
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-sans font-semibold text-rose-700 dark:text-rose-400">
                      Sellers (Asks)
                    </div>
                    {(orderbook?.asks?.slice(0, 3) || []).map((a, idx) => (
                      <button
                        key={`ask-${idx}`}
                        type="button"
                        onClick={() => setCustomDexLimitPrice(a.priceUsd.toFixed(4))}
                        className="w-full flex items-center justify-between px-1.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 dark:text-rose-300 cursor-pointer"
                      >
                        <span>${a.priceUsd.toFixed(4)}</span>
                        <span>{a.xrpSize} XRP</span>
                      </button>
                    ))}
                  </div>
                </div>
              </details>
            </div>

            {/* ==============================================================
             * STEP 3 & STEP 4: PLAIN-ENGLISH RECEIPT + SIGN ON ANDROID OR PC
             * ============================================================== */}
            <div className="space-y-2.5 pt-1">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Step 3 · Check Your Plain-English Receipt & Sign in Wallet
              </div>

              <div className="rounded-lg bg-slate-900 text-slate-100 p-3 text-xs font-mono tabular-nums space-y-1.5 border border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-slate-400">You Are Placing:</span>
                  <span
                    className={`text-sm font-bold ${
                      xrplStagedOrder.isBuyXrp ? 'text-emerald-400' : 'text-amber-300'
                    }`}
                  >
                    {xrplStagedOrder.isBuyXrp ? 'BUY' : 'SELL'} {xrplStagedOrder.xrpQty} XRP
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-sans text-slate-400">At Limit Price:</span>
                  <span className="font-semibold">${xrplStagedOrder.limitPrice.toFixed(4)} per XRP</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800 pt-1.5">
                  <span className="font-sans text-slate-300">
                    {xrplStagedOrder.isBuyXrp ? 'You Pay From Wallet:' : 'You Receive Into Wallet:'}
                  </span>
                  <span className="font-bold text-sky-300">
                    ${xrplStagedOrder.rlusdTotal.toFixed(2)} RLUSD
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>XRPL Network Fee: ~0.000012 XRP</span>
                  <span>Safety Stop Reference: ${calculations.stopLoss.toFixed(4)}</span>
                </div>
              </div>

              {/* PRIMARY FOR TABLET -> ANDROID XAMAN STEP-BY-STEP EXECUTION */}
              <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-3 space-y-2.5">
                <button
                  type="button"
                  disabled={dexBusy}
                  onClick={() =>
                    void requestXamanPayload({
                      kind: 'offercreate',
                      title: `Scan in Android Xaman: ${
                        xrplStagedOrder.isBuyXrp ? 'BUY' : 'SELL'
                      } ${xrplStagedOrder.xrpQty} XRP @ $${xrplStagedOrder.limitPrice.toFixed(4)}`,
                      subtitle: `Pre-filled 1x Spot XRPL OfferCreate (${xrplStagedOrder.xrpQty} XRP ↔ $${xrplStagedOrder.rlusdTotal.toFixed(
                        2
                      )} RLUSD). Review and slide to sign on your Android phone.`,
                      instruction: `${
                        xrplStagedOrder.isBuyXrp ? 'BUY' : 'SELL'
                      } ${xrplStagedOrder.xrpQty} XRP @ $${xrplStagedOrder.limitPrice.toFixed(
                        4
                      )} ($${xrplStagedOrder.rlusdTotal.toFixed(2)} RLUSD) on XRPL DEX.`,
                      txjson: xrplStagedOrder.rawOfferCreateJson,
                    })
                  }
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Step 4 · Open Xaman DEX QR ({xrplStagedOrder.isBuyXrp ? 'Buy' : 'Sell'}{' '}
                    {xrplStagedOrder.xrpQty} XRP)
                  </span>
                </button>

                {showXamanConnectPanel &&
                  (xamanActivePayload?.kind === 'offercreate' ||
                    (!xamanActivePayload && xamanFallbackTab === 'dex')) && (
                    <div className="rounded-lg border border-emerald-500/40 bg-white dark:bg-slate-900 p-3 flex flex-col items-center text-center gap-2">
                      <div className="w-full flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {xamanActivePayload
                            ? 'Scan With Android Xaman (1-Swipe Pre-Filled)'
                            : '1. Scan to Open XRP / RLUSD DEX in Xaman'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowXamanConnectPanel(false);
                            setXamanActivePayload(null);
                          }}
                          className="text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                        >
                          Hide ✕
                        </button>
                      </div>
                      {(xamanActivePayload?.qrPng || xamanFallbackQrUrl) && (
                        <img
                          src={xamanActivePayload?.qrPng || xamanFallbackQrUrl}
                          alt="Scan with Xaman Wallet on Android to place XRPL DEX order"
                          referrerPolicy="no-referrer"
                          className="w-40 h-40 rounded-lg border border-slate-200 bg-white p-1.5"
                        />
                      )}
                      {!xamanActivePayload && (
                        <div className="w-full rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-500/30 px-2.5 py-2 text-left text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                          <strong>Why Xaman opens blank:</strong> Without a KYC Xaman Developer API
                          key, Xaman&apos;s security rules only let this QR open the{' '}
                          <strong>XRP / RLUSD DEX</strong> screen — it will not auto-fill your
                          numbers. Simply enter the <strong>3 exact values below</strong> inside
                          Xaman and slide to sign!
                        </div>
                      )}
                    </div>
                  )}

                {/* Crystal-Clear 4-Step Xaman Entry Ticket */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 space-y-2 text-[11px] text-slate-800 dark:text-slate-200">
                  <div className="font-bold text-slate-900 dark:text-white">
                    Inside Xaman DEX on Android, enter these exact values:
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">1. Pair &amp; Tab:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        XRP/RLUSD · {xrplStagedOrder.isBuyXrp ? 'BUY XRP' : 'SELL XRP'} · Limit
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">2. Limit Price:</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyHelper('price', xrplStagedOrder.limitPrice.toFixed(4))
                        }
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-mono font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer"
                      >
                        <span>${xrplStagedOrder.limitPrice.toFixed(4)}</span>
                        <Copy className="w-3 h-3" />
                        <span>{copiedField === 'price' ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">3. Amount (XRP):</span>
                      <button
                        type="button"
                        onClick={() => handleCopyHelper('qty', String(xrplStagedOrder.xrpQty))}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-mono font-bold text-sky-700 dark:text-sky-400 cursor-pointer"
                      >
                        <span>
                          {xrplStagedOrder.xrpQty} XRP (${xrplStagedOrder.rlusdTotal.toFixed(2)})
                        </span>
                        <Copy className="w-3 h-3" />
                        <span>{copiedField === 'qty' ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                      <strong>4. Execute:</strong> Tap <strong>Place Order</strong> in Xaman and{' '}
                      <strong>Slide to Sign</strong>. Your Limit order stays active 24/7 on the XRP
                      Ledger even when your screen is off.
                    </div>
                  </div>
                </div>

                {/* Verify Order Right After Signing */}
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    disabled={acctLoading || !/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(walletInput.trim())}
                    onClick={() => void syncXrplAccount(walletInput.trim())}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 disabled:opacity-50 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${acctLoading ? 'animate-spin' : ''}`} />
                    <span>
                      {acctLoading
                        ? 'Checking XRPL Ledger...'
                        : 'I Signed in Xaman — Verify My Live Order on XRPL'}
                    </span>
                  </button>

                  <a
                    href={SOLOGENIC_XRP_RLUSD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-sky-500/50 bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-slate-800 text-sky-800 dark:text-sky-300 text-[11px] font-semibold transition-colors"
                  >
                    <span>Or Trade XRP/RLUSD on Sologenic DEX (Pre-Filled Xaman Sign)</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>

                  <a
                    href={xamanDexDeepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors"
                  >
                    <span>Already on Your Android Phone? Open Xaman App Directly</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              </div>

              {/* DESKTOP EXTENSION SIGNING + COMPUTER QR CODE */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  disabled={dexBusy}
                  onClick={() => void handleSignEmbeddedOfferGemWallet()}
                  className="py-2 px-2.5 rounded-lg border border-emerald-600/50 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-slate-800 disabled:opacity-50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Desktop: GemWallet
                </button>
                <button
                  type="button"
                  disabled={dexBusy}
                  onClick={() => void handleSignEmbeddedOfferCrossmark()}
                  className="py-2 px-2.5 rounded-lg border border-sky-600/50 bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-slate-800 disabled:opacity-50 text-sky-800 dark:text-sky-300 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Desktop: Crossmark
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowMobileQr((v) => !v)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    {showMobileQr
                      ? 'Hide Computer QR Code'
                      : 'On Computer? Show QR to Scan With Phone'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyHelper(
                      'json',
                      JSON.stringify(xrplStagedOrder.rawOfferCreateJson, null, 2)
                    )
                  }
                  className="inline-flex items-center gap-1 py-2 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0 cursor-pointer"
                  title="Copy raw XRPL OfferCreate JSON"
                >
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                  <span>{copiedField === 'json' ? 'Copied!' : 'Tx JSON'}</span>
                </button>
              </div>

              {/* Inline Mobile Xaman QR Panel (For Laptop/Desktop Users Scanning With Phone) */}
              {showMobileQr && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex flex-col items-center text-center gap-2">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Viewing on a Computer? Scan With Your Phone&apos;s Xaman App
                  </div>
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="Scan with Xaman app to sign XRP/RLUSD DEX order"
                      className="w-40 h-40 rounded-lg border border-slate-200 p-1 bg-white"
                    />
                  )}
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Opens <strong>XRP / RLUSD</strong> inside Xaman for{' '}
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {xrplStagedOrder.isBuyXrp ? 'BUY' : 'SELL'} {xrplStagedOrder.xrpQty} XRP @ $
                      {xrplStagedOrder.limitPrice.toFixed(4)}
                    </span>
                    . (If you are already on your phone/tablet, tap the green{' '}
                    <strong>Step 4: Open Xaman DEX</strong> button above instead of scanning!)
                  </p>
                </div>
              )}

              {dexStatusMsg && (
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-2 flex items-start gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{dexStatusMsg}</span>
                </div>
              )}

              {dexErrorMsg && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-2 flex items-start gap-1.5 text-[11px] text-rose-700 dark:text-rose-300">
                  <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{dexErrorMsg}</span>
                </div>
              )}

              {/* Live Open Offers on XRPL Ledger with In-App Cancel */}
              {acctSnapshot && acctSnapshot.openOffers.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Your Live Open XRPL Offers ({acctSnapshot.openOffers.length})
                  </div>
                  {acctSnapshot.openOffers.map((off) => (
                    <div
                      key={off.seq}
                      className="flex items-center justify-between gap-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1.5 text-[11px] font-mono tabular-nums"
                    >
                      <div>
                        <span
                          className={
                            off.side === 'BUY_XRP'
                              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                              : 'text-amber-600 dark:text-amber-400 font-semibold'
                          }
                        >
                          {off.side === 'BUY_XRP' ? 'BUY' : 'SELL'} {off.xrpAmount} XRP
                        </span>{' '}
                        <span className="text-slate-500">@ ${off.limitPriceUsd.toFixed(4)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleCancelOpenOffer(off.seq)}
                        className="px-2 py-0.5 rounded border border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-sans font-semibold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Cancel #{off.seq}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
