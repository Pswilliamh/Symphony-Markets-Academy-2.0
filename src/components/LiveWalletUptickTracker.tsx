import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface LiveWalletUptickTrackerProps {
  walletAddress: string;
  walletLabel: string;
  coinTicker: 'BTC' | 'XRP' | 'XLM';
  totalCoins: number;
  spendableCoins: number;
  reservedCoins: number;
  livePrice: number;
  recommendedBuyPrice: number;
  recommendedSellPrice: number;
  onLiveLedgerSync?: (update: {
    totalCoins: number;
    spendableCoins: number;
    reservedCoins: number;
    checkedAt: string;
  }) => void;
}

interface LiveXrplAmmSnapshot {
  poolAccount: string;
  poolXrp: number;
  poolRlusd: number;
  poolTvlUsd: number;
  ammSpotPrice: number;
  tradingFeePct: number;
}

interface LiveOnChainExtras {
  rlusdBalance: number;
  ammLpBalance: number;
  openDexOffersCount: number;
  ownerCount: number;
  lastSyncedAt: string;
}

interface SessionBaseline {
  coins: number;
  stableUsd: number;
  priceAtStart: number;
  totalUsdAtStart: number;
  startedAt: string;
}

const RLUSD_HEX = '524C555344000000000000000000000000000000';
const RLUSD_ISSUER = 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De';

export const LiveWalletUptickTracker: React.FC<LiveWalletUptickTrackerProps> = ({
  walletAddress,
  walletLabel,
  coinTicker,
  totalCoins,
  spendableCoins,
  reservedCoins,
  livePrice,
  recommendedBuyPrice,
  recommendedSellPrice,
  onLiveLedgerSync,
}) => {
  const [liveCoins, setLiveCoins] = useState<number>(totalCoins);
  const [liveSpendable, setLiveSpendable] = useState<number>(spendableCoins);
  const [liveReserved, setLiveReserved] = useState<number>(reservedCoins);
  const [onChainExtras, setOnChainExtras] = useState<LiveOnChainExtras>({
    rlusdBalance: 0,
    ammLpBalance: 0,
    openDexOffersCount: 0,
    ownerCount: 0,
    lastSyncedAt: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  });
  const [xrplAmmPool, setXrplAmmPool] = useState<LiveXrplAmmSnapshot | null>(null);
  const [isSyncingLedger, setIsSyncingLedger] = useState<boolean>(false);
  const [showVolumeMethods, setShowVolumeMethods] = useState<boolean>(true);
  const [baseline, setBaseline] = useState<SessionBaseline>(() => ({
    coins: totalCoins,
    stableUsd: 0,
    priceAtStart: livePrice,
    totalUsdAtStart: totalCoins * livePrice,
    startedAt: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  }));

  const qtyDecimals = coinTicker === 'BTC' ? 6 : 4;
  const priceDecimals = coinTicker === 'BTC' ? 2 : 4;

  // Keep local coin state synced if user switches wallet address
  useEffect(() => {
    setLiveCoins(totalCoins);
    setLiveSpendable(spendableCoins);
    setLiveReserved(reservedCoins);
    setBaseline({
      coins: totalCoins,
      stableUsd: 0,
      priceAtStart: livePrice,
      totalUsdAtStart: totalCoins * livePrice,
      startedAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, coinTicker]);

  const syncLiveLedgerAndAmm = useCallback(async () => {
    const trimmed = walletAddress.trim();
    if (!trimmed) return;
    setIsSyncingLedger(true);
    const nowStamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    try {
      if (coinTicker === 'XRP' && trimmed.startsWith('r')) {
        const [acctRes, linesRes, offersRes, ammRes] = await Promise.all([
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
              method: 'amm_info',
              params: [
                {
                  asset: { currency: 'XRP' },
                  asset2: { currency: RLUSD_HEX, issuer: RLUSD_ISSUER },
                },
              ],
            }),
          }),
        ]);

        const [acctJson, linesJson, offersJson, ammJson] = await Promise.all([
          acctRes.json().catch(() => null),
          linesRes.json().catch(() => null),
          offersRes.json().catch(() => null),
          ammRes.json().catch(() => null),
        ]);

        const drops = acctJson?.result?.account_data?.Balance;
        const ownerCount = Number(acctJson?.result?.account_data?.OwnerCount || 0);
        if (drops !== undefined) {
          const exactTotalXrp = Number((Number(drops) / 1_000_000).toFixed(6));
          // XRPL Mainnet Reserve: 1.0 XRP Base Reserve + 0.2 XRP per owned object (TrustLine / Offer / LP Token)
          const exactReserve = Number(Math.min(exactTotalXrp, 1 + ownerCount * 0.2).toFixed(4));
          const exactSpendable = Number(Math.max(0, exactTotalXrp - exactReserve).toFixed(4));

          setLiveCoins(exactTotalXrp);
          setLiveReserved(exactReserve);
          setLiveSpendable(exactSpendable);

          if (onLiveLedgerSync && Math.abs(exactTotalXrp - totalCoins) >= 0.0001) {
            onLiveLedgerSync({
              totalCoins: Number(exactTotalXrp.toFixed(4)),
              spendableCoins: exactSpendable,
              reservedCoins: exactReserve,
              checkedAt: nowStamp,
            });
          }
        }

        // Parse real RLUSD / USD stablecoin & XLS-30 AMM LP token lines
        const rawLines: Array<{ currency?: string; balance?: string; account?: string }> =
          Array.isArray(linesJson?.result?.lines) ? linesJson.result.lines : [];
        let rlusdSum = 0;
        let lpTokenSum = 0;
        for (const ln of rawLines) {
          const cur = String(ln.currency || '');
          const bal = Number(ln.balance || 0);
          if (cur === RLUSD_HEX || cur === 'USD' || cur === 'USDC') {
            rlusdSum += Math.max(0, bal);
          } else if (cur.length === 40 && cur.startsWith('03')) {
            lpTokenSum += Math.max(0, bal);
          }
        }

        const openOffers = Array.isArray(offersJson?.result?.offers)
          ? offersJson.result.offers.length
          : 0;

        setOnChainExtras({
          rlusdBalance: Number(rlusdSum.toFixed(4)),
          ammLpBalance: Number(lpTokenSum.toFixed(4)),
          openDexOffersCount: openOffers,
          ownerCount,
          lastSyncedAt: nowStamp,
        });

        // Parse real live XRPL XRP/RLUSD AMM Pool volume & liquidity
        const ammObj = ammJson?.result?.amm;
        if (ammObj?.amount && ammObj?.amount2?.value) {
          const poolXrp = Number(ammObj.amount) / 1_000_000;
          const poolRlusd = Number(ammObj.amount2.value);
          const feeBps = Number(ammObj.trading_fee || 315); // 315 = 0.315% on XRPL
          if (poolXrp > 0 && poolRlusd > 0) {
            setXrplAmmPool({
              poolAccount: String(ammObj.account || 'rhWTXC2m2gGGA9WozUaoMm6kLAVPb1tcS3'),
              poolXrp,
              poolRlusd,
              poolTvlUsd: poolRlusd * 2,
              ammSpotPrice: poolRlusd / poolXrp,
              tradingFeePct: feeBps / 1000,
            });
          }
        }
      } else if (
        coinTicker === 'BTC' &&
        (trimmed.startsWith('bc1') || trimmed.startsWith('1') || trimmed.startsWith('3'))
      ) {
        const res = await fetch(`https://mempool.space/api/address/${trimmed}`);
        if (res.ok) {
          const data = await res.json();
          const sats = Math.max(
            0,
            Number(data?.chain_stats?.funded_txo_sum || 0) -
              Number(data?.chain_stats?.spent_txo_sum || 0)
          );
          const exactBtc = Number((sats / 100_000_000).toFixed(6));
          setLiveCoins(exactBtc);
          setLiveSpendable(exactBtc);
          setOnChainExtras((prev) => ({ ...prev, lastSyncedAt: nowStamp }));
        }
      } else if (coinTicker === 'XLM' && trimmed.startsWith('G')) {
        const res = await fetch(`https://horizon.stellar.org/accounts/${trimmed}`);
        if (res.ok) {
          const data = await res.json();
          const native = (data?.balances || []).find(
            (b: { asset_type?: string }) => b.asset_type === 'native'
          );
          if (native?.balance) {
            const exactXlm = Number(Number(native.balance).toFixed(4));
            const spendXlm = Number(Math.max(0, exactXlm - 1).toFixed(4));
            setLiveCoins(exactXlm);
            setLiveSpendable(spendXlm);
            setOnChainExtras((prev) => ({ ...prev, lastSyncedAt: nowStamp }));
          }
        }
      }
    } catch {
      // Keep previous reading on transient network hiccup
    } finally {
      setIsSyncingLedger(false);
    }
  }, [walletAddress, coinTicker, onLiveLedgerSync, totalCoins]);

  // Poll live blockchain & AMM pool every 12 seconds automatically
  useEffect(() => {
    void syncLiveLedgerAndAmm();
    const interval = setInterval(() => {
      void syncLiveLedgerAndAmm();
    }, 12000);
    return () => clearInterval(interval);
  }, [syncLiveLedgerAndAmm]);

  const liveTotalUsd = useMemo(
    () => liveCoins * livePrice + onChainExtras.rlusdBalance,
    [liveCoins, livePrice, onChainExtras.rlusdBalance]
  );

  const usdDelta = liveTotalUsd - baseline.totalUsdAtStart;
  const usdDeltaPct =
    baseline.totalUsdAtStart > 0 ? (usdDelta / baseline.totalUsdAtStart) * 100 : 0;
  const coinDelta = liveCoins - baseline.coins;

  // Safe on-DEX trade size leaving 0.50 XRP/XLM cushion for XRPL 0.20 XRP RLUSD TrustLine + Offer reserve
  const safeTradeCoins = useMemo(() => {
    if (coinTicker === 'XRP' || coinTicker === 'XLM') {
      return Number(Math.max(0, liveSpendable - 0.5).toFixed(2));
    }
    return Number(liveSpendable.toFixed(6));
  }, [coinTicker, liveSpendable]);

  const projectedFlipGainCoins = useMemo(() => {
    if (safeTradeCoins <= 0 || recommendedBuyPrice <= 0 || recommendedSellPrice <= 0) return 0;
    const rlusdProceeds = safeTradeCoins * recommendedSellPrice;
    const boughtBackCoins = rlusdProceeds / recommendedBuyPrice;
    return Math.max(0, boughtBackCoins - safeTradeCoins);
  }, [safeTradeCoins, recommendedBuyPrice, recommendedSellPrice]);

  const handleResetBaseline = () => {
    setBaseline({
      coins: liveCoins,
      stableUsd: onChainExtras.rlusdBalance,
      priceAtStart: livePrice,
      totalUsdAtStart: liveTotalUsd,
      startedAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    });
  };

  return (
    <div className="rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-white dark:bg-slate-900 overflow-hidden text-xs">
      {/* Header Bar */}
      <div className="px-4 py-2.5 bg-emerald-50/80 dark:bg-emerald-950/30 border-b border-emerald-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-bold text-slate-900 dark:text-white">
            Live $5 Real-Wallet Uptick & On-Chain Market Volume Monitor ({walletLabel})
          </span>
          <span aria-hidden="true" className="text-slate-400">
            ·
          </span>
          <span className="font-mono text-slate-600 dark:text-slate-300 tabular-nums">
            Auto-Syncing Ledger Every 12s ({onChainExtras.lastSyncedAt})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetBaseline}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Baseline ({baseline.startedAt})</span>
          </button>

          <button
            type="button"
            disabled={isSyncingLedger}
            onClick={() => void syncLiveLedgerAndAmm()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncingLedger ? 'animate-spin' : ''}`} />
            <span>Sync Ledger Now</span>
          </button>
        </div>
      </div>

      {/* 3-Column Live Uptick Readout */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 font-mono tabular-nums">
        {/* Column 1: Live Real-Wallet Dollar Value Uptick */}
        <div className="p-3.5 space-y-1">
          <div className="font-sans text-slate-500 dark:text-slate-400 font-medium">
            1. Live Real-Wallet Value (Market Price Uptick)
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-base font-bold text-slate-900 dark:text-white">
              ${liveTotalUsd.toFixed(4)}
            </span>
            <span
              className={`text-xs font-bold ${
                usdDelta > 0.0001
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : usdDelta < -0.0001
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {usdDelta >= 0 ? '+' : ''}
              ${usdDelta.toFixed(4)} ({usdDelta >= 0 ? '+' : ''}
              {usdDeltaPct.toFixed(2)}%)
            </span>
          </div>
          <p className="font-sans text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
            Baseline @ {baseline.startedAt}: ${baseline.totalUsdAtStart.toFixed(4)} ({coinTicker} $
            {baseline.priceAtStart.toFixed(priceDecimals)} → Now ${livePrice.toFixed(priceDecimals)})
          </p>
        </div>

        {/* Column 2: Real On-Chain Coin + RLUSD + Open DEX Offer Delta */}
        <div className="p-3.5 space-y-1">
          <div className="font-sans text-slate-500 dark:text-slate-400 font-medium">
            2. On-Chain Coins & Active DEX Orders
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {liveCoins.toFixed(qtyDecimals)} {coinTicker}
            </span>
            <span
              className={`text-xs font-bold ${
                coinDelta > 0.00001
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : coinDelta < -0.00001
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              ({coinDelta >= 0 ? '+' : ''}
              {coinDelta.toFixed(qtyDecimals)} {coinTicker})
            </span>
          </div>
          <div className="font-sans text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
            <span>Spendable: {liveSpendable.toFixed(2)}</span>
            <span aria-hidden="true">·</span>
            <span>Reserve: {liveReserved.toFixed(2)}</span>
            {coinTicker === 'XRP' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  RLUSD: ${onChainExtras.rlusdBalance.toFixed(2)}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-sky-700 dark:text-sky-400 font-semibold">
                  Open DEX Offers: {onChainExtras.openDexOffersCount}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Column 3: Live XRPL Market Volume Pool Telemetry */}
        <div className="p-3.5 space-y-1">
          <div className="font-sans text-slate-500 dark:text-slate-400 font-medium">
            3. Live XRPL Market Volume Pool (XRP / RLUSD)
          </div>
          {xrplAmmPool ? (
            <>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                  +{xrplAmmPool.tradingFeePct.toFixed(3)}% Fee / Swap
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  (${(xrplAmmPool.poolTvlUsd / 1_000_000).toFixed(2)}M Pool TVL)
                </span>
              </div>
              <p className="font-sans text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                {Math.round(xrplAmmPool.poolXrp).toLocaleString()} XRP + $
                {Math.round(xrplAmmPool.poolRlusd).toLocaleString()} RLUSD live on XRPL
                {onChainExtras.ammLpBalance > 0
                  ? ` · Your LP Share: ${onChainExtras.ammLpBalance.toFixed(2)}`
                  : ''}
              </p>
            </>
          ) : (
            <>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                1x Spot Self-Custody Ready
              </div>
              <p className="font-sans text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Every real trade signed in your wallet syncs here automatically within 12 seconds.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Collapsible Toggle for the 2 Real Ways Students Add Real Volume & See Wallet Uptick */}
      <div className="border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setShowVolumeMethods((v) => !v)}
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/70 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-between gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 cursor-pointer"
        >
          <span>
            $5 Training Method · 2 Real Ways Students Grow Their Actual Wallet Balance On-Chain
          </span>
          {showVolumeMethods ? (
            <ChevronUp className="w-4 h-4 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 shrink-0" />
          )}
        </button>

        {showVolumeMethods && (
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 bg-white dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800">
            {/* Way 1: Active 2-Step DEX Flip for Existing Coins */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 dark:text-white">
                  Way 1 · Active $5 DEX Trade Flip (Sell Rally → Buy Pullback)
                </span>
                <span className="font-mono text-[11px] font-semibold text-sky-700 dark:text-sky-400">
                  +{projectedFlipGainCoins.toFixed(2)} {coinTicker} Est.
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Because your wallet already holds <strong>{liveSpendable.toFixed(2)} {coinTicker}</strong>, you grow your actual coin count by selling a small rally into <strong>RLUSD</strong> (regulated USD on XRPL) and buying back more {coinTicker} on the dip:
              </p>
              <ol className="space-y-1 text-slate-700 dark:text-slate-300 list-decimal list-inside font-medium">
                <li>
                  <strong>Scan Xaman DEX QR</strong> (middle blue Scan button in Xaman Android) and choose <span className="font-mono">XRP / RLUSD</span>.
                </li>
                <li>
                  <strong>Sell {safeTradeCoins > 0 ? safeTradeCoins.toFixed(2) : '4.50'} {coinTicker}</strong> (Limit) at Target{' '}
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                    ${recommendedSellPrice.toFixed(priceDecimals)}
                  </span>{' '}
                  (keeps 0.50 XRP cushion for the refundable 0.20 XRP RLUSD reserve).
                </li>
                <li>
                  When price dips to{' '}
                  <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">
                    ${recommendedBuyPrice.toFixed(priceDecimals)}
                  </span>
                  , <strong>Buy {coinTicker}</strong> with that RLUSD — your wallet climbs by{' '}
                  <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                    +{projectedFlipGainCoins.toFixed(2)} real {coinTicker}
                  </strong>{' '}
                  and Box #2 above turns green automatically!
                </li>
              </ol>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href="https://xumm.app/detect/xapp:xumm.dex"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold whitespace-nowrap shrink-0"
                >
                  <span>Open Xaman DEX (XRP / RLUSD)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={`https://sologenic.org/trade?market=XRP%2F${RLUSD_HEX}%2B${RLUSD_ISSUER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold whitespace-nowrap shrink-0"
                >
                  <span>Sologenic XRPL Orderbook</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Way 2: Real 24/7 XRPL Market Volume Pool (XLS-30 Native AMM) */}
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 dark:text-white">
                  Way 2 · Real 24/7 Market Volume Pool (XRPL Native AMM)
                </span>
                <span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  {xrplAmmPool ? `${xrplAmmPool.tradingFeePct.toFixed(3)}%` : '0.315%'} Swap Fee
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Want real global trading volume working on a <strong>$5 ({Math.min(4, Math.max(2, safeTradeCoins)).toFixed(1)} XRP)</strong> classroom wallet without timing candles? The XRP Ledger has a built-in <strong>XLS-30 Automated Market Maker (`XRP / RLUSD`)</strong> holding{' '}
                <strong className="font-mono">
                  ${xrplAmmPool ? (xrplAmmPool.poolTvlUsd / 1_000_000).toFixed(2) : '3.75'}M
                </strong>{' '}
                in real liquidity right now:
              </p>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Single-Sided XRP Deposit:</strong> Deposit e.g. <span className="font-mono font-semibold">3.00–4.00 XRP</span> single-sided via Xaman’s AMM xApp—every real trade through the pool pays a <strong>0.315% swap fee</strong> into the pool automatically.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Honest Stewardship Lesson:</strong> Holding an AMM LP token locks a refundable <span className="font-mono">0.20 XRP</span> reserve, and AMMs rebalance between XRP & RLUSD as price moves—so students witness real DeFi liquidity math firsthand!
                  </span>
                </li>
              </ul>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href="https://xumm.app/detect/xapp:magnetic.dex"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold whitespace-nowrap shrink-0"
                >
                  <span>Open XRPL AMM Pool in Xaman</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={`https://xrpscan.com/account/${
                    xrplAmmPool?.poolAccount || 'rhWTXC2m2gGGA9WozUaoMm6kLAVPb1tcS3'
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold whitespace-nowrap shrink-0"
                >
                  <span>Inspect Live XRPL Pool</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
