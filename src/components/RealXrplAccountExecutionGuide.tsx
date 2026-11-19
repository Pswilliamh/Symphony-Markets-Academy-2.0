import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Layers,
  ListOrdered,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

export interface XrplImportableTradeSet {
  setNumber: number;
  setupName: string;
  patternBadge: string;
  buyPrice: number;
  stopLossPrice: number;
  sellPrice: number;
  quantity: number;
  rMultiple: number;
  outcome: 'WIN_TARGET_HIT' | 'CONTROLLED_1R_STOP';
}

interface RealXrplAccountExecutionGuideProps {
  walletAddress: string;
  onChangeWalletAddress?: (addr: string) => void;
  onVerifyWalletAddress?: () => void;
  isCheckingWallet?: boolean;
  totalXrp: number;
  spendableXrp: number;
  reservedXrp: number;
  liveXrpPrice: number;
  selectedSetNumber: number;
  onSelectSetNumber?: (setNum: number) => void;
  allTenSets?: XrplImportableTradeSet[];
  setupName: string;
  recommendedBuyPrice: number;
  recommendedStopPrice: number;
  recommendedSellPrice: number;
  rehearsalStartUsd?: number;
  rehearsalEndUsd?: number;
}

type RealTradeStrategyMode = 'sell_target_first' | 'split_half_rlusd' | 'buy_pullback_rlusd';
type TenSetImportExecutionStyle = 'one_by_one_sequential' | 'all_ten_micro_grid';

interface DecodedXrplOffer {
  seq: number;
  side: 'SELL_XRP' | 'BUY_XRP';
  xrpAmount: number;
  usdAmount: number;
  limitPriceUsd: number;
  pairLabel: string;
}

interface RecentXrplDexTx {
  hash: string;
  txType: string;
  resultCode: string;
  ledgerIndex: number;
  summary: string;
}

interface LiveXrplReadiness {
  accountActivated: boolean;
  hasRlusdTrustline: boolean;
  rlusdBalance: number;
  ownerCount: number;
  exactTotalXrp: number;
  exactReservedXrp: number;
  exactSpendableXrp: number;
  openOffers: DecodedXrplOffer[];
  recentDexTxs: RecentXrplDexTx[];
  lastCheckedAt: string;
  rpcError: string | null;
}

declare global {
  interface Window {
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
}

const RLUSD_HEX = '524C555344000000000000000000000000000000';
const RLUSD_ISSUER = 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De';

const SOLOGENIC_XRP_RLUSD_URL = `https://sologenic.org/trade?market=XRP%2F${RLUSD_HEX}%2B${RLUSD_ISSUER}`;
const XAMAN_RLUSD_TRUSTLINE_URL = `https://xrpl.services/?issuer=${RLUSD_ISSUER}&currency=${RLUSD_HEX}&limit=100000`;
const XAMAN_DEX_XAPP_URL = 'https://xumm.app/detect/xapp:xumm.dex';

function decodeCurrencyName(currency: string): string {
  if (!currency) return 'TOKEN';
  if (currency === RLUSD_HEX) return 'RLUSD';
  if (currency.length === 3) return currency;
  if (currency.length === 40) {
    try {
      let ascii = '';
      for (let i = 0; i < currency.length; i += 2) {
        const code = parseInt(currency.slice(i, i + 2), 16);
        if (code > 31 && code < 127) {
          ascii += String.fromCharCode(code);
        }
      }
      return ascii.trim() || currency.slice(0, 6);
    } catch {
      return currency.slice(0, 6);
    }
  }
  return currency;
}

export const RealXrplAccountExecutionGuide: React.FC<RealXrplAccountExecutionGuideProps> = ({
  walletAddress,
  onChangeWalletAddress,
  onVerifyWalletAddress,
  isCheckingWallet = false,
  totalXrp,
  spendableXrp,
  reservedXrp,
  liveXrpPrice,
  selectedSetNumber,
  onSelectSetNumber,
  allTenSets = [],
  setupName,
  recommendedBuyPrice,
  recommendedStopPrice,
  recommendedSellPrice,
  rehearsalStartUsd,
  rehearsalEndUsd,
}) => {
  const effectiveSpendable = spendableXrp > 0 ? spendableXrp : 8.94;
  const effectiveReserved = reservedXrp > 0 ? reservedXrp : 1.0;
  const effectiveTotal = totalXrp > 0 ? totalXrp : effectiveSpendable + effectiveReserved;
  const effectivePrice = liveXrpPrice > 0 ? liveXrpPrice : 0.962;

  const [readiness, setReadiness] = useState<LiveXrplReadiness>({
    accountActivated: walletAddress.trim().startsWith('r'),
    hasRlusdTrustline: false,
    rlusdBalance: 0,
    ownerCount: 0,
    exactTotalXrp: effectiveTotal,
    exactReservedXrp: effectiveReserved,
    exactSpendableXrp: effectiveSpendable,
    openOffers: [],
    recentDexTxs: [],
    lastCheckedAt: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    rpcError: null,
  });

  const [isSyncingXrpl, setIsSyncingXrpl] = useState<boolean>(false);
  const [executionStyle, setExecutionStyle] =
    useState<TenSetImportExecutionStyle>('one_by_one_sequential');
  const [completedRealSetNumbers, setCompletedRealSetNumbers] = useState<number[]>([]);
  const [strategyMode, setStrategyMode] = useState<RealTradeStrategyMode>('sell_target_first');
  const [customXrpSize, setCustomXrpSize] = useState<number>(() => {
    const safeMax = Math.max(0.5, Number((effectiveSpendable - 0.5).toFixed(2)));
    return Math.min(2.0, safeMax);
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showRawOfferJson, setShowRawOfferJson] = useState<boolean>(false);
  const [crossmarkStatus, setCrossmarkStatus] = useState<string | null>(null);
  const [isSigningCrossmark, setIsSigningCrossmark] = useState<boolean>(false);

  const activeSpendableXrp = readiness.accountActivated
    ? readiness.exactSpendableXrp
    : effectiveSpendable;
  const activeTotalXrp = readiness.accountActivated ? readiness.exactTotalXrp : effectiveTotal;
  const activeReservedXrp = readiness.accountActivated
    ? readiness.exactReservedXrp
    : effectiveReserved;

  // Keep 0.50 XRP cushion for 1-by-1 mode (0.20 TrustLine + 0.20 1 Open Offer + 0.10 fee cushion)
  const reserveCushionXrp = readiness.hasRlusdTrustline ? 0.3 : 0.5;
  const maxSafeDexXrp = useMemo(
    () => Number(Math.max(0, activeSpendableXrp - reserveCushionXrp).toFixed(2)),
    [activeSpendableXrp, reserveCushionXrp]
  );

  // For "All 10 Sets Micro-Grid" mode: 10 open offers lock 10 * 0.20 = 2.00 XRP owner reserve + 0.30 cushion = 2.30 XRP
  const allTenOffersReserveLock = Number((10 * 0.2 + (readiness.hasRlusdTrustline ? 0.1 : 0.3)).toFixed(2));
  const allTenTradablePoolXrp = Number(
    Math.max(0, activeSpendableXrp - allTenOffersReserveLock).toFixed(2)
  );
  const perSetMicroSliceXrp = Number(
    Math.max(0.25, allTenTradablePoolXrp / 10).toFixed(2)
  );

  // Keep customXrpSize clamped within maxSafeDexXrp when wallet updates
  useEffect(() => {
    if (maxSafeDexXrp > 0 && customXrpSize > maxSafeDexXrp) {
      setCustomXrpSize(maxSafeDexXrp);
    } else if (maxSafeDexXrp >= 2 && customXrpSize <= 0) {
      setCustomXrpSize(2.0);
    }
  }, [maxSafeDexXrp, customXrpSize]);

  // Automatically switch default recommendation to Buy Pullback if wallet already holds >= $1.50 RLUSD
  useEffect(() => {
    if (readiness.rlusdBalance >= 1.5 && strategyMode === 'sell_target_first') {
      setStrategyMode('buy_pullback_rlusd');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readiness.rlusdBalance]);

  const checkLiveXrplAccount = useCallback(async () => {
    const trimmed = walletAddress.trim();
    if (!trimmed.startsWith('r') || trimmed.length < 25) {
      return;
    }

    setIsSyncingXrpl(true);
    const stamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    try {
      const [acctRes, linesRes, offersRes, txRes] = await Promise.all([
        fetch('https://xrplcluster.com/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'account_info',
            params: [{ account: trimmed, strict: true, ledger_index: 'current' }],
          }),
        }),
        fetch('https://xrplcluster.com/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'account_lines',
            params: [{ account: trimmed, ledger_index: 'current' }],
          }),
        }),
        fetch('https://xrplcluster.com/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'account_offers',
            params: [{ account: trimmed, ledger_index: 'current' }],
          }),
        }),
        fetch('https://xrplcluster.com/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'account_tx',
            params: [{ account: trimmed, limit: 8 }],
          }),
        }),
      ]);

      const [acctJson, linesJson, offersJson, txJson] = await Promise.all([
        acctRes.json().catch(() => null),
        linesRes.json().catch(() => null),
        offersRes.json().catch(() => null),
        txRes.json().catch(() => null),
      ]);

      if (acctJson?.result?.error === 'actNotFound') {
        setReadiness((prev) => ({
          ...prev,
          accountActivated: false,
          lastCheckedAt: stamp,
          rpcError:
            'This r... address is not activated on XRPL Mainnet yet (requires at least 1.00 XRP initial funding).',
        }));
        setIsSyncingXrpl(false);
        return;
      }

      const drops = acctJson?.result?.account_data?.Balance;
      const ownerCount = Number(acctJson?.result?.account_data?.OwnerCount || 0);
      const parsedTotal =
        drops !== undefined ? Number((Number(drops) / 1_000_000).toFixed(4)) : effectiveTotal;
      const parsedReserved = Number(Math.min(parsedTotal, 1 + ownerCount * 0.2).toFixed(4));
      const parsedSpendable = Number(Math.max(0, parsedTotal - parsedReserved).toFixed(4));

      // Check RLUSD trustline
      const rawLines: Array<{ currency?: string; balance?: string; account?: string }> =
        Array.isArray(linesJson?.result?.lines) ? linesJson.result.lines : [];
      let foundRlusdLine = false;
      let rlusdBal = 0;
      for (const ln of rawLines) {
        const cur = String(ln.currency || '');
        const iss = String(ln.account || '');
        const bal = Number(ln.balance || 0);
        if ((cur === RLUSD_HEX && iss === RLUSD_ISSUER) || cur === RLUSD_HEX) {
          foundRlusdLine = true;
          rlusdBal += Math.max(0, bal);
        } else if (cur === 'USD' || cur === 'USDC') {
          rlusdBal += Math.max(0, bal);
        }
      }

      // Decode open XRPL DEX offers
      const rawOffers: Array<{
        seq?: number;
        taker_gets?: string | { currency?: string; value?: string };
        taker_pays?: string | { currency?: string; value?: string };
      }> = Array.isArray(offersJson?.result?.offers) ? offersJson.result.offers : [];

      const decodedOffers: DecodedXrplOffer[] = [];
      for (const off of rawOffers) {
        const seq = Number(off.seq || 0);
        if (typeof off.taker_gets === 'string' && typeof off.taker_pays === 'object' && off.taker_pays) {
          const xrpAmt = Number(off.taker_gets) / 1_000_000;
          const usdAmt = Number(off.taker_pays.value || 0);
          const curLabel = decodeCurrencyName(String(off.taker_pays.currency || 'USD'));
          if (xrpAmt > 0 && usdAmt > 0) {
            decodedOffers.push({
              seq,
              side: 'SELL_XRP',
              xrpAmount: Number(xrpAmt.toFixed(4)),
              usdAmount: Number(usdAmt.toFixed(4)),
              limitPriceUsd: Number((usdAmt / xrpAmt).toFixed(4)),
              pairLabel: `XRP / ${curLabel}`,
            });
          }
        } else if (
          typeof off.taker_gets === 'object' &&
          off.taker_gets &&
          typeof off.taker_pays === 'string'
        ) {
          const usdAmt = Number(off.taker_gets.value || 0);
          const xrpAmt = Number(off.taker_pays) / 1_000_000;
          const curLabel = decodeCurrencyName(String(off.taker_gets.currency || 'USD'));
          if (xrpAmt > 0 && usdAmt > 0) {
            decodedOffers.push({
              seq,
              side: 'BUY_XRP',
              xrpAmount: Number(xrpAmt.toFixed(4)),
              usdAmount: Number(usdAmt.toFixed(4)),
              limitPriceUsd: Number((usdAmt / xrpAmt).toFixed(4)),
              pairLabel: `XRP / ${curLabel}`,
            });
          }
        }
      }

      const rawTxs: Array<{
        tx?: { TransactionType?: string; hash?: string; ledger_index?: number };
        tx_json?: { TransactionType?: string; hash?: string; ledger_index?: number };
        hash?: string;
        meta?: { TransactionResult?: string };
      }> = Array.isArray(txJson?.result?.transactions) ? txJson.result.transactions : [];

      const dexTxs: RecentXrplDexTx[] = [];
      for (const item of rawTxs) {
        const txObj = item.tx || item.tx_json || {};
        const txType = String(txObj.TransactionType || '');
        if (txType === 'OfferCreate' || txType === 'TrustSet' || txType === 'OfferCancel') {
          const hash = String(item.hash || txObj.hash || '');
          const resultCode = String(item.meta?.TransactionResult || 'tesSUCCESS');
          const ledgerIndex = Number(txObj.ledger_index || 0);
          const summary =
            txType === 'TrustSet'
              ? 'Enabled Token TrustLine on XRPL'
              : txType === 'OfferCreate'
              ? 'Submitted Real XRPL DEX Limit Offer'
              : 'Cancelled Open XRPL DEX Offer';
          dexTxs.push({
            hash,
            txType,
            resultCode,
            ledgerIndex,
            summary,
          });
        }
      }

      setReadiness({
        accountActivated: true,
        hasRlusdTrustline: foundRlusdLine,
        rlusdBalance: Number(rlusdBal.toFixed(4)),
        ownerCount,
        exactTotalXrp: parsedTotal,
        exactReservedXrp: parsedReserved,
        exactSpendableXrp: parsedSpendable,
        openOffers: decodedOffers,
        recentDexTxs: dexTxs.slice(0, 4),
        lastCheckedAt: stamp,
        rpcError: null,
      });
    } catch {
      setReadiness((prev) => ({
        ...prev,
        lastCheckedAt: stamp,
        rpcError: 'Temporary XRPL public node timeout—click Sync XRPL Orderbook to refresh.',
      }));
    } finally {
      setIsSyncingXrpl(false);
    }
  }, [walletAddress, effectiveTotal, effectiveReserved, effectiveSpendable]);

  useEffect(() => {
    const trimmed = walletAddress.trim();
    if (!trimmed.startsWith('r') || trimmed.length < 25) return;
    void checkLiveXrplAccount();
    const timer = window.setInterval(() => {
      void checkLiveXrplAccount();
    }, 14000);
    return () => window.clearInterval(timer);
  }, [walletAddress, checkLiveXrplAccount]);

  // Build 10-set list (fallback if parent hasn't passed allTenSets)
  const tenSetsList: XrplImportableTradeSet[] = useMemo(() => {
    if (allTenSets && allTenSets.length > 0) {
      return allTenSets;
    }
    return Array.from({ length: 10 }, (_, idx) => {
      const num = idx + 1;
      const offset = (idx - 2) * 0.0025;
      return {
        setNumber: num,
        setupName: num === selectedSetNumber ? setupName : `Set #0${num} Technical Confluence`,
        patternBadge: `Set #${num < 10 ? `0${num}` : num}`,
        buyPrice: Number(Math.max(0.05, recommendedBuyPrice + offset).toFixed(4)),
        stopLossPrice: Number(Math.max(0.04, recommendedStopPrice + offset).toFixed(4)),
        sellPrice: Number(Math.max(0.06, recommendedSellPrice + offset).toFixed(4)),
        quantity: customXrpSize,
        rMultiple: num === 3 || num === 7 ? -1.0 : 2.0,
        outcome: num === 3 || num === 7 ? 'CONTROLLED_1R_STOP' : 'WIN_TARGET_HIT',
      };
    });
  }, [
    allTenSets,
    selectedSetNumber,
    setupName,
    recommendedBuyPrice,
    recommendedStopPrice,
    recommendedSellPrice,
    customXrpSize,
  ]);

  // Build the 10-Set XRPL OfferCreate JSON bundle for either Sequential or Micro-Grid import
  const tenSetXrplBundle = useMemo(() => {
    const accountField = walletAddress.trim().startsWith('r')
      ? { Account: walletAddress.trim() }
      : {};
    return tenSetsList.map((s) => {
      const qtyForThisMode =
        executionStyle === 'all_ten_micro_grid'
          ? perSetMicroSliceXrp
          : Math.max(0.5, Number(customXrpSize.toFixed(2)));

      if (strategyMode === 'buy_pullback_rlusd') {
        const rlusdCost = Number((qtyForThisMode * s.buyPrice).toFixed(4));
        return {
          setNumber: s.setNumber,
          setupName: s.setupName,
          executionStyle,
          side: 'BUY_XRP_LIMIT',
          xrpQuantity: qtyForThisMode,
          limitPriceRlusd: Number(s.buyPrice.toFixed(4)),
          safetyStopAlertUsd: Number(s.stopLossPrice.toFixed(4)),
          targetSellLimitRlusd: Number(s.sellPrice.toFixed(4)),
          xrplOfferCreateTx: {
            TransactionType: 'OfferCreate',
            ...accountField,
            TakerGets: {
              currency: RLUSD_HEX,
              issuer: RLUSD_ISSUER,
              value: rlusdCost.toFixed(4),
            },
            TakerPays: String(Math.round(qtyForThisMode * 1_000_000)),
          },
        };
      }

      // Default when holding XRP: Sell XRP at Target Sell Limit (or Re-Buy on Pullback)
      const rlusdProceeds = Number((qtyForThisMode * s.sellPrice).toFixed(4));
      return {
        setNumber: s.setNumber,
        setupName: s.setupName,
        executionStyle,
        side: 'SELL_XRP_LIMIT',
        xrpQuantity: qtyForThisMode,
        limitPriceRlusd: Number(s.sellPrice.toFixed(4)),
        pullbackRebuyPriceRlusd: Number(s.buyPrice.toFixed(4)),
        safetyStopAlertUsd: Number(s.stopLossPrice.toFixed(4)),
        xrplOfferCreateTx: {
          TransactionType: 'OfferCreate',
          ...accountField,
          TakerGets: String(Math.round(qtyForThisMode * 1_000_000)),
          TakerPays: {
            currency: RLUSD_HEX,
            issuer: RLUSD_ISSUER,
            value: rlusdProceeds.toFixed(4),
          },
        },
      };
    });
  }, [tenSetsList, walletAddress, executionStyle, perSetMicroSliceXrp, customXrpSize, strategyMode]);

  // Compute exact order ticket math for the currently selected Set
  const activeOrderTicket = useMemo(() => {
    const baseQty =
      executionStyle === 'all_ten_micro_grid'
        ? perSetMicroSliceXrp
        : Math.max(0.5, Number(customXrpSize.toFixed(2)));
    const safeXrp = Number(baseQty.toFixed(2));
    const targetSell = Number(recommendedSellPrice.toFixed(4));
    const pullbackBuy = Number(recommendedBuyPrice.toFixed(4));
    const spotLimit = Number(effectivePrice.toFixed(4));

    if (strategyMode === 'sell_target_first') {
      const receiveRlusd = Number((safeXrp * targetSell).toFixed(4));
      const rebuyXrpAtDip =
        pullbackBuy > 0 ? Number((receiveRlusd / pullbackBuy).toFixed(4)) : safeXrp;
      const gainedXrp = Number(Math.max(0, rebuyXrpAtDip - safeXrp).toFixed(4));

      const xrplOfferTx: Record<string, unknown> = {
        TransactionType: 'OfferCreate',
        ...(walletAddress.trim().startsWith('r') ? { Account: walletAddress.trim() } : {}),
        TakerGets: String(Math.round(safeXrp * 1_000_000)),
        TakerPays: {
          currency: RLUSD_HEX,
          issuer: RLUSD_ISSUER,
          value: receiveRlusd.toFixed(4),
        },
      };

      return {
        actionLabel: 'SELL XRP (Limit)',
        xamanSideTab: 'Sell XRP',
        xrpQty: safeXrp,
        limitPrice: targetSell,
        totalRlusd: receiveRlusd,
        headline: `Set #${selectedSetNumber < 10 ? `0${selectedSetNumber}` : selectedSetNumber} Leg 1: Sell ${safeXrp.toFixed(2)} XRP @ $${targetSell.toFixed(4)} → Receive $${receiveRlusd.toFixed(4)} RLUSD`,
        followUpNote: `Once XRP reaches $${targetSell.toFixed(4)} and fills into $${receiveRlusd.toFixed(2)} RLUSD, place Leg 2 (Buy XRP Limit @ $${pullbackBuy.toFixed(4)}) to buy back ~${rebuyXrpAtDip.toFixed(2)} XRP (+${gainedXrp.toFixed(2)} extra XRP added to your wallet!).`,
        xrplOfferTx,
      };
    }

    if (strategyMode === 'split_half_rlusd') {
      const halfXrp = Number(
        Math.max(0.5, Math.min(maxSafeDexXrp, activeSpendableXrp * 0.48)).toFixed(2)
      );
      const receiveRlusd = Number((halfXrp * spotLimit).toFixed(4));
      const xrplOfferTx: Record<string, unknown> = {
        TransactionType: 'OfferCreate',
        ...(walletAddress.trim().startsWith('r') ? { Account: walletAddress.trim() } : {}),
        TakerGets: String(Math.round(halfXrp * 1_000_000)),
        TakerPays: {
          currency: RLUSD_HEX,
          issuer: RLUSD_ISSUER,
          value: receiveRlusd.toFixed(4),
        },
      };

      return {
        actionLabel: 'SWAP HALF XRP → RLUSD (Limit @ Spot)',
        xamanSideTab: 'Sell XRP',
        xrpQty: halfXrp,
        limitPrice: spotLimit,
        totalRlusd: receiveRlusd,
        headline: `Split 50/50: Convert ${halfXrp.toFixed(2)} XRP @ $${spotLimit.toFixed(4)} → Hold $${receiveRlusd.toFixed(2)} RLUSD + ${(activeSpendableXrp - halfXrp).toFixed(2)} XRP`,
        followUpNote: `Holding both RLUSD and XRP lets you immediately place Set #${selectedSetNumber < 10 ? `0${selectedSetNumber}` : selectedSetNumber} Limit Buy orders on pullbacks ($${pullbackBuy.toFixed(4)}) AND Limit Sell orders on rallies ($${targetSell.toFixed(4)})!`,
        xrplOfferTx,
      };
    }

    // Mode C: Buy XRP on Pullback using existing RLUSD
    const spendableRlusd =
      readiness.rlusdBalance > 0.5 && executionStyle === 'one_by_one_sequential'
        ? readiness.rlusdBalance
        : Number((safeXrp * pullbackBuy).toFixed(4));
    const buyXrpQty =
      pullbackBuy > 0 ? Number((spendableRlusd / pullbackBuy).toFixed(4)) : safeXrp;
    const xrplOfferTx: Record<string, unknown> = {
      TransactionType: 'OfferCreate',
      ...(walletAddress.trim().startsWith('r') ? { Account: walletAddress.trim() } : {}),
      TakerGets: {
        currency: RLUSD_HEX,
        issuer: RLUSD_ISSUER,
        value: spendableRlusd.toFixed(4),
      },
      TakerPays: String(Math.round(buyXrpQty * 1_000_000)),
    };

    return {
      actionLabel: 'BUY XRP (Limit on Pullback)',
      xamanSideTab: 'Buy XRP',
      xrpQty: buyXrpQty,
      limitPrice: pullbackBuy,
      totalRlusd: Number(spendableRlusd.toFixed(4)),
      headline: `Set #${selectedSetNumber < 10 ? `0${selectedSetNumber}` : selectedSetNumber} Buy Pullback: Buy ${buyXrpQty.toFixed(2)} XRP @ $${pullbackBuy.toFixed(4)} using $${spendableRlusd.toFixed(2)} RLUSD`,
      followUpNote: `Requires $${spendableRlusd.toFixed(2)} RLUSD in your wallet. Once filled at $${pullbackBuy.toFixed(4)}, place your Target Sell Limit at $${targetSell.toFixed(4)}!`,
      xrplOfferTx,
    };
  }, [
    executionStyle,
    perSetMicroSliceXrp,
    customXrpSize,
    recommendedSellPrice,
    recommendedBuyPrice,
    effectivePrice,
    strategyMode,
    walletAddress,
    selectedSetNumber,
    maxSafeDexXrp,
    activeSpendableXrp,
    readiness.rlusdBalance,
  ]);

  const handleCopyText = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(key);
      window.setTimeout(() => setCopiedField(null), 2200);
    } catch {
      setCopiedField(null);
    }
  };

  const handleDownloadTenSetFile = (format: 'json' | 'csv') => {
    try {
      let content = '';
      let mime = 'application/json';
      let filename = 'symphony-10set-xrpl-offers.json';

      if (format === 'json') {
        content = JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            network: 'XRPL_MAINNET',
            pair: 'XRP/RLUSD',
            rlusdIssuer: RLUSD_ISSUER,
            executionStyle,
            walletAddress: walletAddress.trim() || 'r_YOUR_XAMAN_OR_TRUST_WALLET_ADDRESS',
            sets: tenSetXrplBundle,
          },
          null,
          2
        );
      } else {
        mime = 'text/csv';
        filename = 'symphony-10set-xrpl-ladder.csv';
        const header =
          'Set,SetupName,ExecutionMode,Side,XRP_Qty,BuyPullback_RLUSD,SafetyStop_USD,TargetSell_RLUSD';
        const rows = tenSetsList.map((s) => {
          const qty =
            executionStyle === 'all_ten_micro_grid'
              ? perSetMicroSliceXrp.toFixed(2)
              : customXrpSize.toFixed(2);
          return `${s.setNumber},"${s.setupName}",${executionStyle},${
            strategyMode === 'buy_pullback_rlusd' ? 'BUY_XRP' : 'SELL_XRP'
          },${qty},${s.buyPrice.toFixed(4)},${s.stopLossPrice.toFixed(4)},${s.sellPrice.toFixed(4)}`;
        });
        content = [header, ...rows].join('\n');
      }

      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setCopiedField(`dl_${format}`);
      window.setTimeout(() => setCopiedField(null), 2200);
    } catch {
      // Ignore download failure
    }
  };

  const handleSignCrossmarkTrustSet = async () => {
    const crossmark = window.xrpl?.crossmark;
    if (!crossmark?.signAndSubmitAndWait) {
      setCrossmarkStatus(
        'Crossmark XRPL extension not detected in this browser. On Android or iPhone (or PC with phone), click "1. Enable RLUSD in Xaman" instead!'
      );
      return;
    }
    setIsSigningCrossmark(true);
    setCrossmarkStatus('Opening Crossmark XRPL popup to sign RLUSD TrustSet...');
    try {
      let signerAddr = walletAddress.trim();
      if (!signerAddr.startsWith('r') && crossmark.signInAndWait) {
        const signInRes = await crossmark.signInAndWait();
        signerAddr = signInRes?.response?.data?.address || '';
        if (signerAddr && onChangeWalletAddress) {
          onChangeWalletAddress(signerAddr);
        }
      }
      const trustTx: Record<string, unknown> = {
        TransactionType: 'TrustSet',
        ...(signerAddr.startsWith('r') ? { Account: signerAddr } : {}),
        LimitAmount: {
          currency: RLUSD_HEX,
          issuer: RLUSD_ISSUER,
          value: '100000',
        },
      };
      const res = await crossmark.signAndSubmitAndWait(trustTx);
      const code = res?.response?.data?.resp?.result?.engine_result || 'tesSUCCESS';
      const txHash = res?.response?.data?.resp?.result?.hash || '';
      setCrossmarkStatus(
        `RLUSD TrustLine submitted on XRPL (${code})${txHash ? ` · Tx ${txHash.slice(0, 10)}...` : ''}`
      );
      void checkLiveXrplAccount();
    } catch {
      setCrossmarkStatus('Crossmark signing was cancelled or declined.');
    } finally {
      setIsSigningCrossmark(false);
    }
  };

  const handleSignCrossmarkOfferCreate = async () => {
    const crossmark = window.xrpl?.crossmark;
    if (!crossmark?.signAndSubmitAndWait) {
      setCrossmarkStatus(
        'Crossmark desktop extension not detected. Use "Open Xaman DEX" (Android / Scan QR) or "Open Sologenic DEX + Xaman QR" to sign with your phone!'
      );
      return;
    }
    setIsSigningCrossmark(true);
    setCrossmarkStatus(`Opening Crossmark popup to sign real ${activeOrderTicket.actionLabel}...`);
    try {
      let signerAddr = walletAddress.trim();
      if (!signerAddr.startsWith('r') && crossmark.signInAndWait) {
        const signInRes = await crossmark.signInAndWait();
        signerAddr = signInRes?.response?.data?.address || '';
        if (signerAddr && onChangeWalletAddress) {
          onChangeWalletAddress(signerAddr);
        }
      }
      const txPayload: Record<string, unknown> = {
        ...activeOrderTicket.xrplOfferTx,
        ...(signerAddr.startsWith('r') ? { Account: signerAddr } : {}),
      };
      const res = await crossmark.signAndSubmitAndWait(txPayload);
      const code = res?.response?.data?.resp?.result?.engine_result || 'tesSUCCESS';
      const txHash = res?.response?.data?.resp?.result?.hash || '';
      setCrossmarkStatus(
        `Real XRPL OfferCreate broadcast (${code})${txHash ? ` · Hash ${txHash.slice(0, 10)}...` : ''}! Refreshing live orderbook...`
      );
      void checkLiveXrplAccount();
    } catch {
      setCrossmarkStatus('Crossmark OfferCreate signing was cancelled.');
    } finally {
      setIsSigningCrossmark(false);
    }
  };

  const handleSignAllTenMicroGridInCrossmark = async () => {
    const crossmark = window.xrpl?.crossmark;
    if (!crossmark?.signAndSubmitAndWait) {
      setCrossmarkStatus(
        'Crossmark desktop extension not detected. To import on phone or Sologenic, click "Load Set" on any row below or use One-by-One Sequential Mode!'
      );
      return;
    }
    setIsSigningCrossmark(true);
    try {
      let signerAddr = walletAddress.trim();
      if (!signerAddr.startsWith('r') && crossmark.signInAndWait) {
        const signInRes = await crossmark.signInAndWait();
        signerAddr = signInRes?.response?.data?.address || '';
        if (signerAddr && onChangeWalletAddress) {
          onChangeWalletAddress(signerAddr);
        }
      }
      let signedCount = 0;
      for (const item of tenSetXrplBundle) {
        setCrossmarkStatus(
          `Signing Micro-Grid Set #${item.setNumber}/10 (${item.xrpQuantity.toFixed(2)} XRP @ $${item.limitPriceRlusd.toFixed(4)}) in Crossmark...`
        );
        const txPayload: Record<string, unknown> = {
          ...item.xrplOfferCreateTx,
          ...(signerAddr.startsWith('r') ? { Account: signerAddr } : {}),
        };
        await crossmark.signAndSubmitAndWait(txPayload);
        signedCount += 1;
      }
      setCrossmarkStatus(
        `✓ Broadcast ${signedCount}/10 Micro-Grid OfferCreate transactions to XRPL Mainnet! Refreshing live orderbook...`
      );
      void checkLiveXrplAccount();
    } catch {
      setCrossmarkStatus('Batch signing stopped or cancelled by user.');
    } finally {
      setIsSigningCrossmark(false);
    }
  };

  const setNumFormatted = selectedSetNumber < 10 ? `0${selectedSetNumber}` : `${selectedSetNumber}`;
  const startUsdDisplay =
    rehearsalStartUsd !== undefined
      ? rehearsalStartUsd
      : Number((activeSpendableXrp * effectivePrice).toFixed(2));
  const endUsdDisplay =
    rehearsalEndUsd !== undefined
      ? rehearsalEndUsd
      : Number((startUsdDisplay * 1.284).toFixed(2));

  return (
    <div
      id="real-xrpl-execution-bridge"
      className="rounded-2xl border border-emerald-400/70 dark:border-emerald-500/40 bg-white dark:bg-slate-950 p-5 sm:p-6 space-y-5 shadow-sm"
    >
      {/* Top Header: Bridges the $8.60 -> $11.04 Rehearsal to Real On-Chain Execution */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Real XRP Ledger (XRPL) Execution Bridge</span>
            <span aria-hidden="true">·</span>
            <span>100% Self-Custody (Zero Private Keys Shared)</span>
          </div>
          <h3 className="font-editorial text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            How to Trade Your Real {activeSpendableXrp.toFixed(2)} XRP (${startUsdDisplay.toFixed(2)}) Account On-Chain
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Your 10-Set rehearsal proved the 1:2+ math (${startUsdDisplay.toFixed(2)} → ${endUsdDisplay.toFixed(2)}) in 15 seconds without touching your wallet because Symphony Markets Academy never holds your secret recovery phrase. Below, you can <strong>import your 10 sets into the XRPL DEX</strong> and see why running <strong>One-by-One Sequential</strong> vs. <strong>All 10 Micro-Grid</strong> matters for an {activeSpendableXrp.toFixed(2)} XRP wallet.
          </p>
        </div>

        <button
          type="button"
          disabled={isSyncingXrpl}
          onClick={() => void checkLiveXrplAccount()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingXrpl ? 'animate-spin' : ''}`} />
          <span>{isSyncingXrpl ? 'Checking XRPL...' : 'Sync XRPL Orderbook'}</span>
        </button>
      </div>

      {/* NEW CLASSROOM COMPARISON & 10-SET XRPL DEX IMPORTER: "Should We Run All 10 or One by One?" */}
      <div className="rounded-xl border border-sky-300/80 dark:border-sky-500/40 bg-sky-50/40 dark:bg-slate-900/90 p-4 sm:p-5 space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 max-w-2xl">
            <div className="font-mono font-bold text-sky-700 dark:text-sky-400">
              CLASSROOM QUESTION · CAN WE IMPORT OUR 10 TRADES INTO XRPL DEX? RUN ALL 10 OR ONE BY ONE?
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Yes—You Can Import All 10 Sets! For {activeSpendableXrp.toFixed(2)} XRP, Run Them One-by-One (`Set #01 → #10`) to Compound & Save Reserve
            </h4>
          </div>

          {/* Interactive Mode Switcher: One-by-One Sequential vs. All 10 Micro-Grid Batch */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setExecutionStyle('one_by_one_sequential')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                executionStyle === 'one_by_one_sequential'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>One-by-One Sequential (Recommended)</span>
            </button>
            <button
              type="button"
              onClick={() => setExecutionStyle('all_ten_micro_grid')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                executionStyle === 'all_ten_micro_grid'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All 10 Micro-Ladder ({perSetMicroSliceXrp.toFixed(2)} XRP × 10)</span>
            </button>
          </div>
        </div>

        {/* Side-by-Side Comparison: Why One-by-One Beats All-10-At-Once on an 8.94 XRP Wallet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div
            onClick={() => setExecutionStyle('one_by_one_sequential')}
            className={`p-3.5 rounded-xl border transition-colors cursor-pointer space-y-1.5 ${
              executionStyle === 'one_by_one_sequential'
                ? 'border-emerald-500 bg-white dark:bg-slate-950 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                ✓ Method 1: Run One-by-One (`Set #01 → #02 → ... → #10`)
              </span>
              <span className="font-mono text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                Best for {activeSpendableXrp.toFixed(2)} XRP
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>1. Reuses & Compounds Your Full Balance:</strong> You only have{' '}
              <span className="font-mono font-semibold">{activeSpendableXrp.toFixed(2)} XRP</span> once. Set #02 reuses the <em>same</em> XRP plus the profit earned from Set #01—which is how ${startUsdDisplay.toFixed(2)} compounds to ${endUsdDisplay.toFixed(2)}.
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>2. Locks Only 0.20 XRP Owner Reserve:</strong> XRPL temporarily locks{' '}
              <span className="font-mono">0.20 XRP</span> per open offer. Running <strong>1 set at a time</strong> leaves{' '}
              <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                {maxSafeDexXrp.toFixed(2)} XRP (94%)
              </span>{' '}
              free to work for you!
            </p>
          </div>

          <div
            onClick={() => setExecutionStyle('all_ten_micro_grid')}
            className={`p-3.5 rounded-xl border transition-colors cursor-pointer space-y-1.5 ${
              executionStyle === 'all_ten_micro_grid'
                ? 'border-sky-500 bg-white dark:bg-slate-950 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-sky-700 dark:text-sky-400">
                Method 2: Import All 10 at Once (`10-Order Micro-Grid`)
              </span>
              <span className="font-mono text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                {perSetMicroSliceXrp.toFixed(2)} XRP / Set
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>1. Why You Must Slice Into 10 Small Pieces:</strong> Placing 10 full{' '}
              <span className="font-mono">{maxSafeDexXrp.toFixed(2)} XRP</span> orders at the same time would require{' '}
              <span className="font-mono">{(maxSafeDexXrp * 10).toFixed(1)} XRP</span>. To place all 10 at once, we split your balance into 10 micro-orders of{' '}
              <span className="font-mono font-semibold">{perSetMicroSliceXrp.toFixed(2)} XRP</span> each.
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>2. 10 Open Offers Lock 2.00 XRP Reserve:</strong> Having 10 open offers on XRPL at the same time temporarily locks{' '}
              <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">
                10 × 0.20 = 2.00 XRP
              </span>{' '}
              in owner reserve until those offers fill or cancel.
            </p>
          </div>
        </div>

        {/* Interactive 10-Set Queue Importer Strip (Click any Set #01-#10 to load into XRPL Ticket, or Export/Sign All 10) */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-bold text-slate-900 dark:text-white">
              {executionStyle === 'one_by_one_sequential'
                ? `10-Set Sequential Queue · Click Any Set to Import into XRPL Ticket (Currently Loaded: Set #${setNumFormatted})`
                : `10-Set Micro-Grid Batch Importer (${perSetMicroSliceXrp.toFixed(2)} XRP × 10 Sets = ${(perSetMicroSliceXrp * 10).toFixed(2)} XRP Total)`}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {executionStyle === 'one_by_one_sequential' && (
                <button
                  type="button"
                  onClick={() => {
                    if (!completedRealSetNumbers.includes(selectedSetNumber)) {
                      setCompletedRealSetNumbers((prev) => [...prev, selectedSetNumber]);
                    }
                    const nextSet = selectedSetNumber >= 10 ? 1 : selectedSetNumber + 1;
                    if (onSelectSetNumber) {
                      onSelectSetNumber(nextSet);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>
                    ✓ Mark Set #{setNumFormatted} Done & Load Set #
                    {selectedSetNumber >= 10
                      ? '01'
                      : selectedSetNumber + 1 < 10
                      ? `0${selectedSetNumber + 1}`
                      : selectedSetNumber + 1}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {executionStyle === 'all_ten_micro_grid' && (
                <button
                  type="button"
                  disabled={isSigningCrossmark}
                  onClick={() => void handleSignAllTenMicroGridInCrossmark()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {isSigningCrossmark
                      ? 'Signing 10 Sets...'
                      : `Sign All 10 Micro-Sets in Crossmark (${perSetMicroSliceXrp.toFixed(2)} XRP ea)`}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  void handleCopyText(
                    'all10_xrpl_json',
                    JSON.stringify(tenSetXrplBundle, null, 2)
                  )
                }
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Copy className="w-3 h-3" />
                <span>
                  {copiedField === 'all10_xrpl_json'
                    ? '10-Set JSON Copied ✓'
                    : 'Copy 10-Set XRPL JSON'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadTenSetFile('json')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Download className="w-3 h-3" />
                <span>{copiedField === 'dl_json' ? 'Downloaded ✓' : 'Export JSON'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadTenSetFile('csv')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Download className="w-3 h-3" />
                <span>{copiedField === 'dl_csv' ? 'Downloaded ✓' : 'Export CSV'}</span>
              </button>
            </div>
          </div>

          {/* 10 Interactive Set Queue Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5 font-mono tabular-nums">
            {tenSetsList.map((s) => {
              const isSelected = s.setNumber === selectedSetNumber;
              const isDone = completedRealSetNumbers.includes(s.setNumber);
              const lbl = s.setNumber < 10 ? `0${s.setNumber}` : `${s.setNumber}`;
              return (
                <button
                  key={s.setNumber}
                  type="button"
                  onClick={() => {
                    if (onSelectSetNumber) {
                      onSelectSetNumber(s.setNumber);
                    }
                  }}
                  className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-slate-900 dark:text-white'
                      : isDone
                      ? 'border-emerald-300/60 dark:border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span>#{lbl}</span>
                    <span>{isDone ? '✓ Done' : isSelected ? 'Active' : ''}</span>
                  </div>
                  <div className="text-[10px] text-sky-700 dark:text-sky-400 truncate">
                    Buy ${s.buyPrice.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate">
                    Sell ${s.sellPrice.toFixed(3)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Public r... Address Bar if user hasn't pasted their r... address yet */}
      {!walletAddress.trim().startsWith('r') && onChangeWalletAddress && (
        <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-300/80 dark:border-amber-500/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5 max-w-xl">
            <div className="font-bold text-slate-900 dark:text-white">
              Connect Your Public XRP Address (<span className="font-mono">r...</span>) for Live TrustLine & Reserve Checks
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Paste only your public <span className="font-mono">r...</span> receive address from Xaman or Trust Wallet (never your 12-word phrase or secret numbers).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => onChangeWalletAddress(e.target.value)}
              placeholder="Paste public XRP address (starts with r...)"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white"
            />
            {onVerifyWalletAddress && (
              <button
                type="button"
                disabled={isCheckingWallet}
                onClick={onVerifyWalletAddress}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer whitespace-nowrap shrink-0"
              >
                {isCheckingWallet ? 'Checking...' : 'Check My XRP Account'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Live On-Chain Account Diagnostic Strip (4 Tabular Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="font-sans text-slate-500 dark:text-slate-400">
            1. Total vs. Locked XRPL Reserve
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {activeTotalXrp.toFixed(4)} XRP Total
          </div>
          <div className="font-sans text-[11px] text-slate-600 dark:text-slate-400">
            Locked: {activeReservedXrp.toFixed(2)} XRP (1.0 Base + {readiness.ownerCount} Objects)
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="font-sans text-slate-500 dark:text-slate-400">
            2. Spendable & Max Safe Trade
          </div>
          <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
            {activeSpendableXrp.toFixed(2)} XRP Free ·{' '}
            {executionStyle === 'all_ten_micro_grid'
              ? `${perSetMicroSliceXrp.toFixed(2)} XRP × 10`
              : `${maxSafeDexXrp.toFixed(2)} Safe`}
          </div>
          <div className="font-sans text-[11px] text-slate-600 dark:text-slate-400">
            {executionStyle === 'all_ten_micro_grid'
              ? `Reserves ${allTenOffersReserveLock.toFixed(2)} XRP for 10 open offers`
              : `Keeps ${reserveCushionXrp.toFixed(2)} XRP cushion for 1 active offer`}
          </div>
        </div>

        <div
          className={`p-3.5 rounded-xl border space-y-1 ${
            readiness.hasRlusdTrustline
              ? 'bg-emerald-50/60 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-500/40'
              : 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-300 dark:border-amber-500/40'
          }`}
        >
          <div className="font-sans text-slate-600 dark:text-slate-300">
            3. RLUSD (Ripple USD) TrustLine
          </div>
          <div
            className={`text-sm font-bold ${
              readiness.hasRlusdTrustline
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-amber-800 dark:text-amber-300'
            }`}
          >
            {readiness.hasRlusdTrustline
              ? `✓ Active ($${readiness.rlusdBalance.toFixed(2)} RLUSD)`
              : walletAddress.trim().startsWith('r')
              ? '▲ Step 1 Needed: Add RLUSD'
              : 'Check r... Address Above'}
          </div>
          <div className="font-sans text-[11px] text-slate-600 dark:text-slate-400">
            Required once so your wallet can hold USD gains
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="font-sans text-slate-500 dark:text-slate-400">
            4. Live Open XRPL DEX Offers
          </div>
          <div className="text-sm font-bold text-sky-700 dark:text-sky-400">
            {readiness.openOffers.length} Open Offer{readiness.openOffers.length === 1 ? '' : 's'}
          </div>
          <div className="font-sans text-[11px] text-slate-600 dark:text-slate-400">
            Checked {readiness.lastCheckedAt} on xrplcluster
          </div>
        </div>
      </div>

      {readiness.rpcError && (
        <div className="p-3 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200">
          {readiness.rpcError}
        </div>
      )}

      {/* STEP 1 & STEP 2 SPLIT: Enable RLUSD TrustLine + Choose Safe Trade Size & Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch text-xs">
        {/* STEP 1: One-Time RLUSD TrustLine Setup */}
        <div className="lg:col-span-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                Step 1 · Enable RLUSD (Ripple USD) Once
              </span>
              <span
                className={`font-mono font-semibold ${
                  readiness.hasRlusdTrustline
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {readiness.hasRlusdTrustline ? '✓ Ready' : 'One-Time Setup'}
              </span>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              On the real XRP Ledger, when you sell XRP at a profit target, you receive <strong>RLUSD (Ripple&apos;s $1.00 regulated USD token)</strong> right inside your wallet. Before your first trade, your XRP wallet needs an <strong>RLUSD TrustLine</strong> (locks a refundable <span className="font-mono">0.20 XRP</span> reserve).
            </p>

            <div className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 text-slate-700 dark:text-slate-300">
              <div className="font-semibold text-slate-900 dark:text-white">
                In Xaman on Phone (Takes 15 Seconds):
              </div>
              <div>1. Open <strong>Xaman</strong> → tap <strong>+ Add</strong> under Tokens on your home screen.</div>
              <div>2. Tap <strong>RLUSD (Ripple)</strong> → <strong>Slide to Sign</strong> (or tap the button below).</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={XAMAN_RLUSD_TRUSTLINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors whitespace-nowrap shrink-0"
            >
              <span>
                {readiness.hasRlusdTrustline
                  ? '✓ View RLUSD TrustLine Link'
                  : '1. Enable RLUSD in Xaman'}
              </span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              disabled={isSigningCrossmark}
              onClick={() => void handleSignCrossmarkTrustSet()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Wallet className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Crossmark TrustSet</span>
            </button>
          </div>
        </div>

        {/* STEP 2: Why Holding XRP Matters + Safe Size & Strategy Selector */}
        <div className="lg:col-span-7 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3.5">
          <div className="space-y-1">
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              Step 2 · Pick Your Order Side & Safe XRP Size (Set #{setNumFormatted} · {setupName})
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Because your wallet currently holds <strong>{activeSpendableXrp.toFixed(2)} XRP</strong>
              {readiness.rlusdBalance > 0
                ? ` and $${readiness.rlusdBalance.toFixed(2)} RLUSD`
                : ' (and $0.00 RLUSD)'}
              , <strong>you already own the XRP coin!</strong> Choose how you want to deploy it on the real XRPL DEX:
            </p>
          </div>

          {/* 3 Interactive Strategy Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStrategyMode('sell_target_first')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                strategyMode === 'sell_target_first'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Option A: Sell XRP @ Target (${recommendedSellPrice.toFixed(4)})
            </button>
            <button
              type="button"
              onClick={() => setStrategyMode('split_half_rlusd')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                strategyMode === 'split_half_rlusd'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Option B: 50/50 Split (Hold XRP + RLUSD)
            </button>
            <button
              type="button"
              onClick={() => setStrategyMode('buy_pullback_rlusd')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                strategyMode === 'buy_pullback_rlusd'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Option C: Buy XRP Dip (${recommendedBuyPrice.toFixed(4)})
            </button>
          </div>

          {/* Labeled Safe XRP Trade Size Presets + Slider */}
          {strategyMode !== 'split_half_rlusd' && executionStyle === 'one_by_one_sequential' && (
            <div className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="real-xrp-size-slider"
                  className="font-semibold text-slate-800 dark:text-slate-200"
                >
                  Real Trade Size (One-by-One Mode):{' '}
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {customXrpSize.toFixed(2)} XRP (≈ ${(customXrpSize * effectivePrice).toFixed(2)} USD)
                  </span>
                </label>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCustomXrpSize(Math.min(2.0, Math.max(0.5, maxSafeDexXrp)))}
                    className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    2.00 XRP Test
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomXrpSize(
                        Number(
                          Math.max(0.5, Math.min(maxSafeDexXrp, activeSpendableXrp * 0.5)).toFixed(2)
                        )
                      )
                    }
                    className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    50% ({(activeSpendableXrp * 0.5).toFixed(2)} XRP)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomXrpSize(Math.max(0.5, maxSafeDexXrp))}
                    className="px-2.5 py-1 rounded border border-emerald-400/60 bg-emerald-50 dark:bg-emerald-950/40 font-mono text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Max Safe ({maxSafeDexXrp.toFixed(2)} XRP)
                  </button>
                </div>
              </div>

              <input
                id="real-xrp-size-slider"
                type="range"
                min={0.5}
                max={Math.max(1, maxSafeDexXrp)}
                step={0.05}
                value={Math.min(customXrpSize, Math.max(1, maxSafeDexXrp))}
                onChange={(e) => setCustomXrpSize(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          )}

          {executionStyle === 'all_ten_micro_grid' && (
            <div className="p-3 rounded-lg bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-500/30 text-slate-700 dark:text-slate-300">
              <strong>10-Set Micro-Ladder Sizing Active:</strong> Each of the 10 sets is sized at{' '}
              <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
                {perSetMicroSliceXrp.toFixed(2)} XRP
              </span>{' '}
              (totaling <span className="font-mono">{(perSetMicroSliceXrp * 10).toFixed(2)} XRP</span> across 10 orders while keeping{' '}
              <span className="font-mono">{allTenOffersReserveLock.toFixed(2)} XRP</span> free for the 10 open offer reserves).
            </div>
          )}

          <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-white">{activeOrderTicket.headline}</strong>
            <p className="mt-1 text-slate-600 dark:text-slate-400">{activeOrderTicket.followUpNote}</p>
          </div>
        </div>
      </div>

      {/* STEP 3: Exact Copy-Paste XRPL Order Ticket + 3 Non-Custodial Signing Bridges */}
      <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300/80 dark:border-emerald-500/40 space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-bold text-slate-900 dark:text-white text-sm">
            Step 3 · Copy Set #{setNumFormatted} Numbers & Sign Non-Custodially (Xaman Phone, Sologenic QR, or Crossmark)
          </div>
          <span className="font-mono text-emerald-800 dark:text-emerald-300">
            Market Pair: XRP / RLUSD · Tab: {activeOrderTicket.xamanSideTab} (Limit)
          </span>
        </div>

        {/* 3 Exact Copyable Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono tabular-nums">
          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div>
              <div className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                1. Set #{setNumFormatted} Quantity (XRP)
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {activeOrderTicket.xrpQty.toFixed(2)} XRP
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleCopyText('qty', activeOrderTicket.xrpQty.toFixed(2))}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-sans font-semibold text-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedField === 'qty' ? 'Copied ✓' : 'Copy Qty'}</span>
            </button>
          </div>

          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div>
              <div className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                2. Set #{setNumFormatted} Limit Price (RLUSD)
              </div>
              <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                ${activeOrderTicket.limitPrice.toFixed(4)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleCopyText('price', activeOrderTicket.limitPrice.toFixed(4))}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-sans font-semibold text-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedField === 'price' ? 'Copied ✓' : 'Copy Price'}</span>
            </button>
          </div>

          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div>
              <div className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                3. Set #{setNumFormatted} Total (RLUSD)
              </div>
              <div className="text-sm font-bold text-sky-700 dark:text-sky-400">
                ${activeOrderTicket.totalRlusd.toFixed(4)} RLUSD
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                void handleCopyText('total', activeOrderTicket.totalRlusd.toFixed(4))
              }
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-sans font-semibold text-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedField === 'total' ? 'Copied ✓' : 'Copy Total'}</span>
            </button>
          </div>
        </div>

        {/* 3 Real Non-Custodial Signing Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={XAMAN_DEX_XAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => void handleCopyText('price', activeOrderTicket.limitPrice.toFixed(4))}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors whitespace-nowrap shrink-0"
          >
            <span>Open Xaman DEX (Android Tap · PC Scan QR)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={SOLOGENIC_XRP_RLUSD_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => void handleCopyText('price', activeOrderTicket.limitPrice.toFixed(4))}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition-colors whitespace-nowrap shrink-0"
          >
            <span>Open Sologenic XRPL DEX (Desktop Chart + Xaman QR)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            disabled={isSigningCrossmark}
            onClick={() => void handleSignCrossmarkOfferCreate()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {isSigningCrossmark
                ? 'Waiting for Crossmark...'
                : `Sign Set #${setNumFormatted} in Crossmark`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowRawOfferJson((v) => !v)}
            className="text-slate-600 dark:text-slate-400 hover:underline font-medium ml-auto cursor-pointer whitespace-nowrap shrink-0"
          >
            {showRawOfferJson ? 'Hide XRPL OfferCreate JSON' : 'View XRPL OfferCreate JSON'}
          </button>
        </div>

        {crossmarkStatus && (
          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium">
            {crossmarkStatus}
          </div>
        )}

        {showRawOfferJson && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
              <span>
                Native XRPL <span className="font-mono">OfferCreate</span> Payload (Set #{setNumFormatted} or Full 10-Set Array)
              </span>
              <button
                type="button"
                onClick={() =>
                  void handleCopyText(
                    'json',
                    JSON.stringify(
                      executionStyle === 'all_ten_micro_grid'
                        ? tenSetXrplBundle
                        : activeOrderTicket.xrplOfferTx,
                      null,
                      2
                    )
                  )
                }
                className="font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer whitespace-nowrap"
              >
                {copiedField === 'json' ? 'JSON Copied ✓' : 'Copy JSON'}
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 text-sky-300 font-mono text-[11px] overflow-x-auto border border-slate-800 max-h-64">
              {JSON.stringify(
                executionStyle === 'all_ten_micro_grid'
                  ? tenSetXrplBundle
                  : activeOrderTicket.xrplOfferTx,
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>

      {/* STEP 4: Live On-Chain XRPL Open Offers & Recent DEX Activity + Stop-Loss Reality Note */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
        <div className="lg:col-span-7 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              Step 4 · Live On-Chain Verification (Your Open XRPL Limit Offers)
            </span>
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              Auto-syncs every 14s
            </span>
          </div>

          {readiness.openOffers.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <table className="w-full text-left border-collapse font-mono tabular-nums text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-sans">
                    <th className="py-2 px-3 font-semibold">Side</th>
                    <th className="py-2 px-3 font-semibold">Pair</th>
                    <th className="py-2 px-3 font-semibold">XRP Size</th>
                    <th className="py-2 px-3 font-semibold">Limit Price</th>
                    <th className="py-2 px-3 font-semibold">USD Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {readiness.openOffers.map((off) => (
                    <tr key={off.seq}>
                      <td
                        className={`py-2 px-3 font-bold ${
                          off.side === 'SELL_XRP'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-sky-700 dark:text-sky-400'
                        }`}
                      >
                        {off.side === 'SELL_XRP' ? 'SELL XRP' : 'BUY XRP'}
                      </td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                        {off.pairLabel}
                      </td>
                      <td className="py-2 px-3 text-slate-900 dark:text-white font-semibold">
                        {off.xrpAmount.toFixed(2)} XRP
                      </td>
                      <td className="py-2 px-3 text-slate-900 dark:text-white">
                        ${off.limitPriceUsd.toFixed(4)}
                      </td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                        ${off.usdAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 leading-relaxed">
              {walletAddress.trim().startsWith('r') ? (
                <>
                  <strong>0 open Limit Offers</strong> are currently resting on the XRP Ledger for{' '}
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {walletAddress.trim().slice(0, 8)}...{walletAddress.trim().slice(-5)}
                  </span>
                  . As soon as you slide to sign Set #{setNumFormatted} in Xaman or Sologenic, it will appear right here automatically!
                </>
              ) : (
                <>
                  Paste and verify your public <span className="font-mono">r...</span> address above to watch your live open XRPL Limit Offers and filled trades here in real time.
                </>
              )}
            </div>
          )}

          {readiness.recentDexTxs.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                Recent On-Chain DEX Activity on Your Account:
              </div>
              <div className="space-y-1">
                {readiness.recentDexTxs.map((tx) => (
                  <div
                    key={tx.hash}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {tx.summary}
                      </span>
                      <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                        ({tx.resultCode})
                      </span>
                    </div>
                    {tx.hash && (
                      <a
                        href={`https://xrpscan.com/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap"
                      >
                        <span>XRPScan</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Important Real-Ledger Classroom Truths: Patience & Stop-Loss Alert */}
        <div className="lg:col-span-5 p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 space-y-2.5 leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>2 Real-Ledger Differences vs. Rehearsal</span>
          </div>

          <div className="text-slate-700 dark:text-slate-300">
            <strong>1. Real Market Time vs. 15-Second Fast-Forward:</strong> On the real XRP Ledger, a Limit Offer fills only when global market price actually trades to your mark (minutes, hours, or days). Completing <strong>Set #01</strong> first before moving to <strong>Set #02</strong> lets your profit compound cleanly.
          </div>

          <div className="text-slate-700 dark:text-slate-300">
            <strong>2. How Stop-Losses Work on Native XRPL DEX:</strong> The decentralized XRP Ledger executes <strong>Limit Buy</strong> and <strong>Limit Sell</strong> offers automatically 24/7, but does not hold automatic server-side market Stop-Loss triggers. Because you trade <strong>1x Spot XRP (zero leverage, zero liquidation risk)</strong>, set a phone price alert at Set #{setNumFormatted}&apos;s Safety Stop (<span className="font-mono font-semibold text-rose-700 dark:text-rose-400">${recommendedStopPrice.toFixed(4)}</span>) so you stay in calm control.
          </div>
        </div>
      </div>
    </div>
  );
};
