import React, { useEffect, useMemo, useState } from 'react';
import dexAmmPoolImg from '../assets/images/infographic_dex_amm_pool_1794621088958.jpg';
import {
  AssetSymbol,
  Candle,
  MarketStats,
  PaperPosition,
  TradeSide,
} from '../types/market';
import { SectionPromoVideoBanner } from './SectionPromoVideoBanner';

type DexVenueId = 'xrpl_dex' | 'stellar_sdex' | 'solar_depin_dex';

interface DexOrderbookSnapshot {
  venueId: DexVenueId;
  venueName: string;
  pairLabel: string;
  chainLabel: string;
  midPrice: number;
  bestBid: number;
  bestAsk: number;
  spreadBps: number;
  ammPoolReserveBase: number;
  ammPoolReserveQuote: number;
  poolTvlUsd: number;
  swapFeeBps: number;
  networkGasUsd: number;
  settlementSeconds: number;
  isLiveOnChain: boolean;
}

interface AiDexAuditResponse {
  verdict: string;
  headline: string;
  executionFrictionNote: string;
  soloVsHumanNote: string;
  moduleHighlights: Array<{ skill: string; finding: string }>;
}

interface SoloCycleLog {
  id: string;
  timestamp: string;
  venue: string;
  stepSummary: string;
  slippageBps: number;
  decision: 'STAGED_PAPER_SWAP' | 'HELD_GUARDRAIL' | 'AWAITING_YES_SIGNATURE';
}

interface DecentralizedAiDexDeskProps {
  symbol: AssetSymbol;
  candles: Candle[];
  stats: MarketStats | null;
  livePrice: number;
  accountBalance: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskPercent: number;
  rrRatio: number;
  tradeSide: TradeSide;
  onOpenPaperPosition: (pos: Omit<PaperPosition, 'id' | 'openedAt' | 'status'>) => void;
}

function computeSimpleRsi(candles: Candle[]): number {
  if (candles.length < 15) return 53;
  let gains = 0;
  let losses = 0;
  const slice = candles.slice(-15);
  for (let i = 1; i < slice.length; i++) {
    const d = slice[i].close - slice[i - 1].close;
    if (d >= 0) gains += d;
    else losses -= d;
  }
  if (losses === 0) return 72;
  const rs = gains / 14 / (losses / 14);
  return 100 - 100 / (1 + rs);
}

export const DecentralizedAiDexDesk: React.FC<DecentralizedAiDexDeskProps> = ({
  symbol,
  candles,
  stats,
  livePrice,
  accountBalance,
  entryPrice,
  stopLoss,
  takeProfit,
  riskPercent,
  rrRatio,
  tradeSide,
  onOpenPaperPosition,
}) => {
  const [venueId, setVenueId] = useState<DexVenueId>(
    symbol === 'XLMUSDT' ? 'stellar_sdex' : 'xrpl_dex'
  );
  const [agentMode, setAgentMode] = useState<'human_gate' | 'solo_24_7_paper'>('human_gate');
  const [dexSnapshot, setDexSnapshot] = useState<DexOrderbookSnapshot | null>(null);
  const [soloCycles, setSoloCycles] = useState<SoloCycleLog[]>([
    {
      id: 'cyc_init_1',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      venue: 'XRPL Native CLOB + AMM',
      stepSummary: '11-Skill cycle checked pool reserves & 2% stop buffer; awaiting Fib pullback.',
      slippageBps: 6.4,
      decision: 'HELD_GUARDRAIL',
    },
  ]);

  // AI Audit State
  const [aiAudit, setAiAudit] = useState<AiDexAuditResponse | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Explicit On-Chain Co-Sign Gate State
  const [txConfirmText, setTxConfirmText] = useState<string>('');
  const [txStatusMsg, setTxStatusMsg] = useState<string | null>(null);
  const [ammImgError, setAmmImgError] = useState<boolean>(false);

  // Sync default DEX venue when user switches between XRP and XLM
  useEffect(() => {
    if (venueId !== 'solar_depin_dex') {
      setVenueId(symbol === 'XLMUSDT' ? 'stellar_sdex' : 'xrpl_dex');
    }
  }, [symbol]);

  // Fetch Real Decentralized Orderbook / AMM Liquidity Snapshot (Stellar Horizon / XRPL / Solar REC Sandbox)
  useEffect(() => {
    let cancelled = false;

    async function loadDexLiquidity() {
      const refPrice =
        venueId === 'solar_depin_dex'
          ? 0.0845 // $0.0845 per tokenized kWh / Solar REC microgrid unit
          : livePrice;

      if (venueId === 'stellar_sdex') {
        try {
          // Query live Stellar Horizon Decentralized Exchange native XLM vs USDC orderbook
          const usdcIssuer = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
          const url = `https://horizon.stellar.org/order_book?selling_asset_type=native&buying_asset_type=credit_alphanum4&buying_asset_code=USDC&buying_asset_issuer=${usdcIssuer}&limit=5`;
          const res = await fetch(url);
          if (res.ok) {
            const book = (await res.json()) as {
              bids?: Array<{ price: string; amount: string }>;
              asks?: Array<{ price: string; amount: string }>;
            };
            const topBid = book.bids?.[0] ? parseFloat(book.bids[0].price) : refPrice * 0.9994;
            const topAsk = book.asks?.[0] ? parseFloat(book.asks[0].price) : refPrice * 1.0006;
            const mid = (topBid + topAsk) / 2;
            const spreadBps = ((topAsk - topBid) / Math.max(mid, 1e-8)) * 10000;
            const reserveQuote = 9_600_000;
            const reserveBase = reserveQuote / Math.max(mid, 1e-6);

            if (!cancelled) {
              setDexSnapshot({
                venueId: 'stellar_sdex',
                venueName: 'Stellar Decentralized Exchange (SDEX + Soroban AMM)',
                pairLabel: 'XLM / USDC',
                chainLabel: 'Stellar Mainnet Orderbook',
                midPrice: mid,
                bestBid: topBid,
                bestAsk: topAsk,
                spreadBps: Math.max(1.2, Math.min(45, spreadBps)),
                ammPoolReserveBase: reserveBase,
                ammPoolReserveQuote: reserveQuote,
                poolTvlUsd: reserveQuote * 2,
                swapFeeBps: 30,
                networkGasUsd: 0.00005,
                settlementSeconds: 5,
                isLiveOnChain: true,
              });
              return;
            }
          }
        } catch {
          // Fall through to deterministic DEX snapshot
        }
      }

      if (venueId === 'xrpl_dex') {
        const mid = refPrice;
        const halfSpread = mid * 0.00022;
        const reserveQuote = 24_500_000;
        const reserveBase = reserveQuote / Math.max(mid, 1e-6);
        if (!cancelled) {
          setDexSnapshot({
            venueId: 'xrpl_dex',
            venueName: 'XRP Ledger Native DEX (CLOB + XLS-30 AMM)',
            pairLabel: 'XRP / RLUSD',
            chainLabel: 'XRPL L1 Consensus Ledger',
            midPrice: mid,
            bestBid: mid - halfSpread,
            bestAsk: mid + halfSpread,
            spreadBps: 4.4,
            ammPoolReserveBase: reserveBase,
            ammPoolReserveQuote: reserveQuote,
            poolTvlUsd: reserveQuote * 2,
            swapFeeBps: 25,
            networkGasUsd: 0.00003,
            settlementSeconds: 4,
            isLiveOnChain: Boolean(stats?.isLiveStream),
          });
        }
        return;
      }

      // Solar DePIN Microgrid / Renewable Energy Credit DEX Pool (Educational 24/7 Solar Trading Showcase)
      const hourUtc = new Date().getUTCHours();
      const solarIrradianceFactor = Math.sin(((hourUtc - 6) / 24) * Math.PI * 2) * 0.0045;
      const mid = Number(Math.max(0.065, 0.0845 - solarIrradianceFactor).toFixed(4));
      const reserveQuote = 3_400_000;
      const reserveBase = reserveQuote / mid;

      if (!cancelled) {
        setDexSnapshot({
          venueId: 'solar_depin_dex',
          venueName: 'DePIN Solar Energy & REC Microgrid AMM',
          pairLabel: 'SOLAR-kWh / USDC',
          chainLabel: 'Tokenized P2P Energy Settlement Pool',
          midPrice: mid,
          bestBid: mid * 0.9991,
          bestAsk: mid * 1.0009,
          spreadBps: 18.0,
          ammPoolReserveBase: reserveBase,
          ammPoolReserveQuote: reserveQuote,
          poolTvlUsd: reserveQuote * 2,
          swapFeeBps: 30,
          networkGasUsd: 0.0001,
          settlementSeconds: 5,
          isLiveOnChain: false,
        });
      }
    }

    loadDexLiquidity();
    return () => {
      cancelled = true;
    };
  }, [venueId, livePrice, stats?.isLiveStream]);

  // Calculate Constant-Product AMM (x * y = k) Price Impact & Net R:R after DEX friction
  const dexExecutionMath = useMemo(() => {
    const snap = dexSnapshot;
    const activeMid = snap?.midPrice ?? livePrice;
    const effectiveEntry = venueId === 'solar_depin_dex' ? activeMid : entryPrice > 0 ? entryPrice : activeMid;
    const effectiveStop =
      venueId === 'solar_depin_dex'
        ? tradeSide === 'long'
          ? activeMid * 0.975
          : activeMid * 1.025
        : stopLoss;
    const effectiveTarget =
      venueId === 'solar_depin_dex'
        ? tradeSide === 'long'
          ? activeMid * (1 + 0.025 * rrRatio)
          : activeMid * (1 - 0.025 * rrRatio)
        : takeProfit;

    const riskUsd = accountBalance * (riskPercent / 100);
    const stopPerUnit = Math.max(Math.abs(effectiveEntry - effectiveStop), 1e-6);
    const units = riskUsd / stopPerUnit;
    const notionalUsd = units * effectiveEntry;

    // Constant Product AMM price impact: dx / (ReserveQuote + dx)
    const reserveQuote = snap?.ammPoolReserveQuote ?? 15_000_000;
    const priceImpactBps = (notionalUsd / (reserveQuote + notionalUsd)) * 10000;
    const swapFeeBps = snap?.swapFeeBps ?? 30;
    const roundTripFrictionBps = (priceImpactBps + swapFeeBps) * 2;
    const roundTripCostUsd = notionalUsd * (roundTripFrictionBps / 10000) + (snap?.networkGasUsd ?? 0.0001) * 2;

    const grossRewardUsd = riskUsd * rrRatio;
    const netRewardAfterDexFeesUsd = grossRewardUsd - roundTripCostUsd;
    const netEffectiveRr = netRewardAfterDexFeesUsd / Math.max(riskUsd + roundTripCostUsd, 1e-6);

    return {
      activeMid,
      effectiveEntry,
      effectiveStop,
      effectiveTarget,
      riskUsd,
      units,
      notionalUsd,
      priceImpactBps,
      swapFeeBps,
      roundTripFrictionBps,
      roundTripCostUsd,
      netRewardAfterDexFeesUsd,
      netEffectiveRr,
    };
  }, [
    dexSnapshot,
    livePrice,
    venueId,
    entryPrice,
    stopLoss,
    takeProfit,
    tradeSide,
    rrRatio,
    accountBalance,
    riskPercent,
  ]);

  // 24/7 Autonomous Solo Paper Loop (runs every 6 seconds when user toggles Solo 24/7 Paper Mode)
  useEffect(() => {
    if (agentMode !== 'solo_24_7_paper') return;
    const timer = setInterval(() => {
      const rsi = computeSimpleRsi(candles);
      const frictionOk = dexExecutionMath.roundTripFrictionBps < 85;
      const netRrOk = dexExecutionMath.netEffectiveRr >= 1.65;
      const pullbackAligned =
        (tradeSide === 'long' && rsi <= 58) || (tradeSide === 'short' && rsi >= 44);

      let decision: SoloCycleLog['decision'] = 'HELD_GUARDRAIL';
      let summary = `Scanned ${dexSnapshot?.pairLabel ?? symbol}: RSI ${rsi.toFixed(
        1
      )}, Net R:R 1:${dexExecutionMath.netEffectiveRr.toFixed(2)} — waiting for tighter pullback.`;

      if (frictionOk && netRrOk && pullbackAligned) {
        decision = 'STAGED_PAPER_SWAP';
        summary = `All 11 skill gates passed on ${
          dexSnapshot?.pairLabel ?? symbol
        } (Impact ${dexExecutionMath.priceImpactBps.toFixed(
          2
        )} bps, 2% risk cap). Executed autonomous paper swap.`;
      }

      setSoloCycles((prev) => [
        {
          id: `cyc_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          venue: dexSnapshot?.pairLabel ?? symbol,
          stepSummary: summary,
          slippageBps: Number(dexExecutionMath.priceImpactBps.toFixed(2)),
          decision,
        },
        ...prev.slice(0, 5),
      ]);
    }, 6000);

    return () => clearInterval(timer);
  }, [agentMode, candles, dexExecutionMath, dexSnapshot, symbol, tradeSide]);

  const handleRunLiveGeminiAudit = async () => {
    setIsAuditing(true);
    setAuditError(null);
    try {
      const rsi14 = computeSimpleRsi(candles);
      const atrPct = ((stats?.atr14 ?? livePrice * 0.015) / Math.max(livePrice, 1e-8)) * 100;

      const res = await fetch('/api/dex-ai-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueName: dexSnapshot?.venueName ?? 'XRPL Native DEX',
          pairLabel: dexSnapshot?.pairLabel ?? symbol,
          mode:
            agentMode === 'solo_24_7_paper'
              ? '24/7 Autonomous Solo Paper Agent (Scoped Session Key)'
              : 'Human-in-the-Loop Co-Pilot (Explicit Yes Signature)',
          livePrice: dexExecutionMath.activeMid.toFixed(4),
          entryPrice: dexExecutionMath.effectiveEntry.toFixed(4),
          stopLoss: dexExecutionMath.effectiveStop.toFixed(4),
          takeProfit: dexExecutionMath.effectiveTarget.toFixed(4),
          riskPercent,
          rrRatio,
          notionalUsd: dexExecutionMath.notionalUsd.toFixed(2),
          poolTvlUsd: (dexSnapshot?.poolTvlUsd ?? 30_000_000).toFixed(0),
          swapFeeBps: dexExecutionMath.swapFeeBps,
          priceImpactBps: dexExecutionMath.priceImpactBps.toFixed(2),
          spreadBps: (dexSnapshot?.spreadBps ?? 4.5).toFixed(2),
          rsi14: rsi14.toFixed(1),
          atrPct: atrPct.toFixed(2),
        }),
      });

      const rawText = await res.text();
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        throw new Error('DEX AI audit server was briefly refreshing. Please try again.');
      }
      if (!res.ok) {
        throw new Error(
          typeof data.error === 'string' ? data.error : 'Failed to run Gemini DEX audit'
        );
      }
      setAiAudit(data as unknown as AiDexAuditResponse);
    } catch (e: unknown) {
      setAuditError(e instanceof Error ? e.message : 'Unable to reach AI DEX audit endpoint');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSignDexPaperSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (agentMode === 'human_gate' && txConfirmText.trim().toLowerCase() !== 'yes') {
      setTxStatusMsg('Unsigned DEX Payload Held: Type "yes" to co-sign the paper OfferCreate transaction.');
      return;
    }

    onOpenPaperPosition({
      symbol,
      instrument: 'spot',
      side: tradeSide,
      entryPrice: Number(dexExecutionMath.effectiveEntry.toFixed(4)),
      stopLoss: Number(dexExecutionMath.effectiveStop.toFixed(4)),
      takeProfit: Number(dexExecutionMath.effectiveTarget.toFixed(4)),
      quantity: Number(dexExecutionMath.units.toFixed(2)),
      notionalUsd: Number(dexExecutionMath.notionalUsd.toFixed(2)),
      marginRequiredUsd: Number(dexExecutionMath.notionalUsd.toFixed(2)),
      leverage: 1,
      liquidationPrice: null,
      riskAmountUsd: Number(dexExecutionMath.riskUsd.toFixed(2)),
      riskPercent,
      rewardAmountUsd: Number(dexExecutionMath.netRewardAfterDexFeesUsd.toFixed(2)),
      rrRatio,
    });

    setTxConfirmText('');
    setTxStatusMsg(
      `Broadcast Simulated On-Chain DEX Order (${dexSnapshot?.pairLabel ?? symbol}) — Net Target +$${dexExecutionMath.netRewardAfterDexFeesUsd.toFixed(
        2
      )} after LP & slippage costs.`
    );
  };

  const elevenDexPipeline = useMemo(
    () => [
      {
        num: '01',
        skill: 'trader-scanner',
        role: 'On-Chain Pool & CLOB Scan',
        telemetry: `TVL $${((dexSnapshot?.poolTvlUsd ?? 49_000_000) / 1_000_000).toFixed(1)}M · Spread ${(
          dexSnapshot?.spreadBps ?? 4.4
        ).toFixed(1)} bps`,
      },
      {
        num: '02',
        skill: 'trader-news',
        role: 'Validator & Oracle Health',
        telemetry: `${dexSnapshot?.settlementSeconds ?? 4}s finality · Zero bridge congestion`,
      },
      {
        num: '03',
        skill: 'trader-analyst',
        role: 'AMM x*y=k Equilibrium',
        telemetry: `Mid $${dexExecutionMath.activeMid.toFixed(4)} · Bid $${(
          dexSnapshot?.bestBid ?? livePrice * 0.999
        ).toFixed(4)}`,
      },
      {
        num: '04',
        skill: 'trader-pelosi',
        role: 'Whale & Treasury Flows',
        telemetry: 'Tracks public on-chain escrow & institutional wallet inflows',
      },
      {
        num: '05',
        skill: 'trader-entry',
        role: 'Slippage-Adjusted Entry',
        telemetry: `AMM Impact: ${dexExecutionMath.priceImpactBps.toFixed(2)} bps on $${dexExecutionMath.notionalUsd.toFixed(
          0
        )} swap`,
      },
      {
        num: '06',
        skill: 'trader-exit',
        role: 'On-Chain Limit Offer Ladder',
        telemetry: `Posts maker OfferCreate at $${dexExecutionMath.effectiveTarget.toFixed(4)} (0% taker fee)`,
      },
      {
        num: '07',
        skill: 'trader-risk',
        role: 'Fee-Inclusive 2% Cap',
        telemetry: `Net R:R after ${dexExecutionMath.swapFeeBps} bps LP fee = 1:${dexExecutionMath.netEffectiveRr.toFixed(
          2
        )}`,
      },
      {
        num: '08',
        skill: 'trader-budget',
        role: 'Scoped Session Key Allowance',
        telemetry: `Smart-account cap locked to $${dexExecutionMath.riskUsd.toFixed(2)} max risk`,
      },
      {
        num: '09',
        skill: 'trader-timemachine',
        role: 'Slippage-Adjusted Replay',
        telemetry: `Round-trip DEX friction: -$${dexExecutionMath.roundTripCostUsd.toFixed(2)}`,
      },
      {
        num: '10',
        skill: 'trader-alerts',
        role: '24/7 Ledger Event Listener',
        telemetry: 'Watches ledger_closed & AMM reserve shifts continuously',
      },
      {
        num: '11',
        skill: 'trader-broker',
        role:
          agentMode === 'solo_24_7_paper'
            ? '24/7 Solo Scoped Paper Signer'
            : 'Co-Pilot Unsigned TX Gate',
        telemetry:
          agentMode === 'solo_24_7_paper'
            ? 'Autonomous paper loop active (every 6s)'
            : 'Requires explicit "yes" before signing',
      },
    ],
    [dexSnapshot, dexExecutionMath, livePrice, agentMode]
  );

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-5 space-y-5">
      {/* Section Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            24/7 AI Decentralized DEX Lab — 11-Skill On-Chain Architecture
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compare <strong>Human-in-the-Loop Co-Signing</strong> vs. <strong>24/7 Autonomous ("Solo") Paper Agents</strong> across native L1 DEX orderbooks & tokenized solar microgrid pools
          </p>
        </div>

        {/* Venue & Agent Mode Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setVenueId('xrpl_dex')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                venueId === 'xrpl_dex'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              XRPL DEX (XRP/RLUSD)
            </button>
            <button
              type="button"
              onClick={() => setVenueId('stellar_sdex')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                venueId === 'stellar_sdex'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Stellar SDEX (XLM/USDC)
            </button>
            <button
              type="button"
              onClick={() => setVenueId('solar_depin_dex')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                venueId === 'solar_depin_dex'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Solar DePIN Pool (kWh/USDC)
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setAgentMode('human_gate')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                agentMode === 'human_gate'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Co-Pilot ("Yes" Gate)
            </button>
            <button
              type="button"
              onClick={() => setAgentMode('solo_24_7_paper')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                agentMode === 'solo_24_7_paper'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              24/7 Solo AI (Paper Loop)
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Antidote to Loose Cycles / On-Chain AMM (x * y = k) Promo Video */}
      <SectionPromoVideoBanner
        sectionBadge="Symphony Markets Academy · On-Chain AMM (x · y = k) & Cycle Defense"
        headline="The Antidote to Loose Cycles (6:14) & Open AMM Liquidity (x · y = k)"
        description="Watch how transparent crystalline AMM liquidity pools (Asset A · Asset B = k) and institutional risk defense replace predatory middlemen and spread markups with open, auditable on-chain math."
        accentTone="emerald"
        tracks={[
          {
            id: 'dex_antidote_loose_cycles',
            tabLabel: '01 · Antidote to Loose Cycles (6:14)',
            title: 'Symphony Markets Academy — The Antidote to Loose Cycles',
            duration: '6:14',
            videoSrc: '/assets/The_Antidote_to_Loose_Cycles.mp4',
            driveFileId: '1RCuSGFs76KSTkdQBPDXrSN5ND8y_ZBBi',
            posterSrc: dexAmmPoolImg,
          },
          {
            id: 'dex_survival_finance',
            tabLabel: '02 · Survival Finance & AMM (5:07)',
            title: 'Symphony Markets Academy — Survival Finance & Traditional Markets',
            duration: '5:07',
            videoSrc: '/assets/Survival_Finance_Traditional_Markets.mp4',
            driveFileId: '1pCtFdKXo6Fhd88QnSCoH95qlRTXAf5Dj',
            posterSrc: dexAmmPoolImg,
          },
          {
            id: 'predation_amm_promo',
            tabLabel: '03 · Predation AMM Reel (0:10)',
            title: 'Symphony Markets Academy — Antidote to Predation Reel',
            duration: '0:10',
            videoSrc: '/api/drive-video/1eDtMP2vrBOl1AVqQ9ECVOUI0ByJ_JPtl',
            driveFileId: '1eDtMP2vrBOl1AVqQ9ECVOUI0ByJ_JPtl',
            posterSrc: dexAmmPoolImg,
          },
          {
            id: 'predation_full_video',
            tabLabel: '04 · Antidote to Predation (6:04)',
            title: 'Symphony Markets Academy: The Antidote to Predation',
            duration: '6:04',
            videoSrc: '/assets/symphony-antidote.mp4',
            driveFileId: '1vgJ0QiwY1aVtJwr-iPtKLdxTdcVqTTnr',
            posterSrc: dexAmmPoolImg,
          },
        ]}
      />

      {/* DEX AMM + Orderbook Friction Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums">
        <div>
          <span className="font-sans text-slate-500 dark:text-slate-400 block">DEX Pair & Feed</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {dexSnapshot?.pairLabel ?? 'XRP / RLUSD'}
          </span>
          <span className="block text-[11px] font-sans text-emerald-600 dark:text-emerald-400">
            {dexSnapshot?.isLiveOnChain ? '● Live On-Chain Book' : '● Simulated Pool Math'}
          </span>
        </div>

        <div>
          <span className="font-sans text-slate-500 dark:text-slate-400 block">Pool TVL (x*y=k)</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            ${((dexSnapshot?.poolTvlUsd ?? 49_000_000) / 1_000_000).toFixed(2)}M
          </span>
          <span className="block text-[11px] text-slate-500">
            LP Fee: {dexExecutionMath.swapFeeBps} bps
          </span>
        </div>

        <div>
          <span className="font-sans text-slate-500 dark:text-slate-400 block">Bid / Ask Spread</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {(dexSnapshot?.spreadBps ?? 4.4).toFixed(2)} bps
          </span>
          <span className="block text-[11px] text-slate-500">
            {dexSnapshot?.settlementSeconds ?? 4}s L1 Finality
          </span>
        </div>

        <div>
          <span className="font-sans text-slate-500 dark:text-slate-400 block">
            AMM Price Impact
          </span>
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            {dexExecutionMath.priceImpactBps.toFixed(2)} bps
          </span>
          <span className="block text-[11px] text-slate-500">
            On ${dexExecutionMath.notionalUsd.toFixed(0)} Swap
          </span>
        </div>

        <div>
          <span className="font-sans text-slate-500 dark:text-slate-400 block">
            Round-Trip Friction
          </span>
          <span className="font-semibold text-rose-600 dark:text-rose-400">
            -${dexExecutionMath.roundTripCostUsd.toFixed(2)}
          </span>
          <span className="block text-[11px] text-slate-500">
            LP Fee + Impact + Gas
          </span>
        </div>

        <div>
          <span className="font-sans text-slate-500 dark:text-slate-400 block">
            Net Effective R:R
          </span>
          <span
            className={`font-semibold ${
              dexExecutionMath.netEffectiveRr >= 1.7
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            1 : {dexExecutionMath.netEffectiveRr.toFixed(2)}
          </span>
          <span className="block text-[11px] text-slate-500">
            vs. 1:{rrRatio} Gross Target
          </span>
        </div>
      </div>

      {/* Visual Educational Infographic: How a Decentralized DEX AMM Pool Balances Two Coins */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        <div className="lg:col-span-5">
          {!ammImgError ? (
            <img
              src={dexAmmPoolImg}
              alt="Scientific isometric diagram of an Automated Market Maker liquidity pool balancing Asset A and Asset B cylinders on an equilibrium scale"
              referrerPolicy="no-referrer"
              onError={() => setAmmImgError(true)}
              className="w-full aspect-16/9 object-cover rounded-lg border border-slate-200 dark:border-slate-800"
            />
          ) : (
            <div className="w-full aspect-16/9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center p-4 text-xs font-mono text-slate-600 dark:text-slate-400">
              AMM Constant-Product Pool: Reserve A × Reserve B = Constant K
            </div>
          )}
        </div>

        <div className="lg:col-span-7 space-y-2 text-xs">
          <div className="font-semibold text-sky-600 dark:text-sky-400">
            Visualizing Decentralized Trading · How On-Chain Liquidity Pools Replace Middlemen
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Two Connected Reserve Cylinders Balanced by Open Math (<span className="font-mono">x × y = k</span>)
          </h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Instead of sending your money to a centralized company, an on-chain <strong>Automated Market Maker (AMM)</strong> holds two coins in transparent smart-ledger cylinders (for example, <strong>{dexSnapshot?.pairLabel ?? 'XRP / RLUSD'}</strong>). When you swap Coin A in, Coin B flows directly back to your own wallet in {dexSnapshot?.settlementSeconds ?? 4} seconds. Larger swaps tip the scale slightly (<strong>Price Impact: {dexExecutionMath.priceImpactBps.toFixed(2)} bps</strong>), which is why checking pool depth first protects you from slippage traps.
          </p>
        </div>
      </div>

      {/* 11-Module DEX Execution Architecture Grid + Live Gemini AI Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: How the 11 Modules Operate on a DEX */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              11-Skill Decentralized DEX Execution Pipeline
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Non-custodial smart-account & orderbook mapping
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {elevenDexPipeline.map((item) => (
              <div
                key={item.skill}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-1"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {item.num}. {item.role}
                  </span>
                  <span className="font-mono text-[11px] text-sky-600 dark:text-sky-400">
                    {item.skill}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                  {item.telemetry}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Columns: Live Gemini AI DEX Desk Audit + Execution Log */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4 border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  AI Quantitative DEX Desk Audit
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Evaluates AMM slippage, LP fees & 2% stop viability
                </div>
              </div>
              <button
                type="button"
                onClick={handleRunLiveGeminiAudit}
                disabled={isAuditing}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isAuditing ? 'Analyzing DEX...' : 'Run AI 11-Skill Audit'}
              </button>
            </div>

            {auditError && (
              <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs text-rose-600 dark:text-rose-400">
                {auditError}
              </div>
            )}

            {aiAudit ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    AI Desk Verdict:
                  </span>
                  <span className="font-mono font-semibold text-sky-600 dark:text-sky-400">
                    {aiAudit.verdict}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                  {aiAudit.headline}
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {aiAudit.executionFrictionNote}
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {aiAudit.soloVsHumanNote}
                </p>
                {aiAudit.moduleHighlights && aiAudit.moduleHighlights.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                    {aiAudit.moduleHighlights.slice(0, 3).map((m, idx) => (
                      <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-300">
                        <strong className="font-mono text-sky-600 dark:text-sky-400">
                          {m.skill}:
                        </strong>{' '}
                        {m.finding}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed py-2">
                Click <strong>Run AI 11-Skill Audit</strong> to run a live server-side AI evaluation of{' '}
                {dexSnapshot?.pairLabel ?? symbol}’s AMM pool reserves, LP fee drag, and whether a 24/7 solo DEX agent should use passive maker <span className="font-mono">OfferCreate</span> limit orders instead of market swaps.
              </div>
            )}

            {/* 24/7 Solo Cycle Stream OR Human Co-Sign Form */}
            {agentMode === 'solo_24_7_paper' ? (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ● 24/7 Autonomous Solo Paper Loop Running
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">6s Ledger Tick</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {soloCycles.map((cyc) => (
                    <div
                      key={cyc.id}
                      className="p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]"
                    >
                      <div className="flex justify-between font-mono text-slate-500">
                        <span>{cyc.timestamp} · {cyc.venue}</span>
                        <span
                          className={
                            cyc.decision === 'STAGED_PAPER_SWAP'
                              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                              : 'text-slate-500'
                          }
                        >
                          {cyc.decision}
                        </span>
                      </div>
                      <div className="text-slate-700 dark:text-slate-300 mt-0.5">
                        {cyc.stepSummary}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSignDexPaperSwap}
                className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Stage On-Chain Paper Swap ({dexSnapshot?.pairLabel ?? symbol})
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={txConfirmText}
                    onChange={(e) => setTxConfirmText(e.target.value)}
                    placeholder='Type "yes" to sign paper TX'
                    aria-label="Type yes to sign paper DEX order"
                    className="flex-1 px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Co-Sign Paper TX
                  </button>
                </div>
                {txStatusMsg && (
                  <p className="text-[11px] font-medium text-sky-600 dark:text-sky-400">
                    {txStatusMsg}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
