import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  BellRing,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Layers,
  Send,
  ShieldCheck,
  Smartphone,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { AssetSymbol, Candle, FibonacciLevel, PriceAlert } from '../types/market';
import { playFibonacciHarmonicInterval } from '../utils/tenSetSymphonyAudio';
import { TEN_SET_CHECKLIST_TEMPLATES } from './OneByOneTradeChecklist';
import { ImportedAutoTraderDexSet } from './RiskSimulatorPanel';

interface SupportResistanceRadarCardProps {
  symbol: AssetSymbol;
  livePrice: number;
  candles: Candle[];
  fibLevels: FibonacciLevel[];
  connectedXrplAddress?: string;
  onLoadSetIntoDex: (payload: Omit<ImportedAutoTraderDexSet, 'nonce'>) => void;
  onAddPriceAlert: (alert: Omit<PriceAlert, 'id' | 'triggered'>) => void;
  onNotifyBanner: (msg: string) => void;
}

type RadarTab = 'radar' | 'builder' | 'guide';

const NTFY_STORAGE_KEY = 'symphony_markets_ntfy_topic_v1';

export const SupportResistanceRadarCard: React.FC<SupportResistanceRadarCardProps> = ({
  symbol,
  livePrice,
  candles,
  fibLevels,
  connectedXrplAddress,
  onLoadSetIntoDex,
  onAddPriceAlert,
  onNotifyBanner,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<RadarTab>('radar');

  // Notification Controls
  const [alertsArmed, setAlertsArmed] = useState<boolean>(false);
  const [proximityPct, setProximityPct] = useState<number>(0.6);
  const [browserNotifStatus, setBrowserNotifStatus] = useState<
    'default' | 'granted' | 'denied' | 'unsupported'
  >(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });
  const [ntfyTopic, setNtfyTopic] = useState<string>(() => {
    try {
      return localStorage.getItem(NTFY_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [ntfyFeedback, setNtfyFeedback] = useState<string | null>(null);
  const [ntfySending, setNtfySending] = useState<boolean>(false);
  const [recentAlertLog, setRecentAlertLog] = useState<
    Array<{ time: string; zone: 'SUPPORT' | 'RESISTANCE'; message: string }>
  >([]);
  const lastAlertSentRef = useRef<{ zone: string; ts: number }>({ zone: '', ts: 0 });

  // Tab 2: Limit Order Builder (Live S/R OR Any of the 10 Auto-Trader Setups)
  const [selectedSource, setSelectedSource] = useState<'live_sr' | number>('live_sr');
  const [orderQtyXrp, setOrderQtyXrp] = useState<string>('2');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const decimals = symbol === 'BTCUSDT' ? 2 : 4;
  const baseAsset = symbol === 'BTCUSDT' ? 'BTC' : symbol === 'XRPUSDT' ? 'XRP' : 'XLM';
  const safeLive = livePrice > 0 ? livePrice : symbol === 'BTCUSDT' ? 92000 : 2.42;

  // Persist optional ntfy topic locally
  useEffect(() => {
    try {
      if (ntfyTopic.trim()) {
        localStorage.setItem(NTFY_STORAGE_KEY, ntfyTopic.trim());
      } else {
        localStorage.removeItem(NTFY_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [ntfyTopic]);

  // Compute live Support & Resistance levels from recent candles + Fibonacci levels
  const srLevels = useMemo(() => {
    const recent = candles.slice(-36);
    const swingLow =
      recent.length > 0
        ? Math.min(...recent.map((c) => c.low))
        : Number((safeLive * 0.965).toFixed(decimals));
    const swingHigh =
      recent.length > 0
        ? Math.max(...recent.map((c) => c.high))
        : Number((safeLive * 1.038).toFixed(decimals));

    const fib618 = fibLevels.find((f) => Math.abs(f.ratio - 0.618) < 0.01)?.price;
    const fib500 = fibLevels.find((f) => Math.abs(f.ratio - 0.5) < 0.01)?.price;
    const fib382 = fibLevels.find((f) => Math.abs(f.ratio - 0.382) < 0.01)?.price;

    // Ensure primary support is cleanly below livePrice and primary resistance is cleanly above livePrice
    const rawSupportCandidates = [fib618, fib500, swingLow].filter(
      (p): p is number => typeof p === 'number' && p > 0 && p < safeLive * 0.998
    );
    const primarySupport =
      rawSupportCandidates.length > 0
        ? Math.max(...rawSupportCandidates)
        : Number((safeLive * 0.982).toFixed(decimals));

    const deepSupport =
      swingLow < primarySupport * 0.996
        ? swingLow
        : Number((primarySupport * 0.982).toFixed(decimals));

    const rawResistanceCandidates = [fib382, swingHigh].filter(
      (p): p is number => typeof p === 'number' && p > safeLive * 1.002
    );
    const primaryResistance =
      rawResistanceCandidates.length > 0
        ? Math.min(...rawResistanceCandidates)
        : Number((safeLive * 1.028).toFixed(decimals));

    const extendedTarget = Number(
      Math.max(
        primaryResistance * 1.018,
        safeLive + (primaryResistance - primarySupport) * 0.618
      ).toFixed(decimals)
    );

    const distToSupportPct = ((safeLive - primarySupport) / safeLive) * 100;
    const distToResistancePct = ((primaryResistance - safeLive) / safeLive) * 100;
    const stopBelowSupport = Number((primarySupport * 0.982).toFixed(decimals));
    const riskPerUnit = Math.max(0.0001, primarySupport - stopBelowSupport);
    const rrRatio = Number(
      Math.max(1.5, Math.min(4.0, (primaryResistance - primarySupport) / riskPerUnit)).toFixed(1)
    );

    let zoneStatus: 'OPTIMAL_SUPPORT' | 'OPTIMAL_RESISTANCE' | 'MID_RANGE' = 'MID_RANGE';
    let statusHeadline = 'Mid-Range · Place 24/7 Limit Orders Ahead & Wait';
    if (distToSupportPct <= proximityPct) {
      zoneStatus = 'OPTIMAL_SUPPORT';
      statusHeadline = `Optimal Support Zone Reached ($${primarySupport.toFixed(decimals)}) — Limit Buy Window`;
    } else if (distToResistancePct <= proximityPct) {
      zoneStatus = 'OPTIMAL_RESISTANCE';
      statusHeadline = `Optimal Resistance Zone Reached ($${primaryResistance.toFixed(decimals)}) — Limit Sell Window`;
    }

    return {
      primarySupport: Number(primarySupport.toFixed(decimals)),
      deepSupport: Number(deepSupport.toFixed(decimals)),
      primaryResistance: Number(primaryResistance.toFixed(decimals)),
      extendedTarget: Number(extendedTarget.toFixed(decimals)),
      stopBelowSupport,
      distToSupportPct,
      distToResistancePct,
      rrRatio,
      zoneStatus,
      statusHeadline,
    };
  }, [candles, fibLevels, safeLive, decimals, proximityPct]);

  // Send optional free ntfy Android push via our server relay
  const pushToAndroidNtfy = async (title: string, message: string, isTest = false) => {
    const cleanTopic = ntfyTopic.trim();
    if (!cleanTopic) return;
    if (isTest) {
      setNtfySending(true);
      setNtfyFeedback(null);
    }
    try {
      const resp = await fetch('/api/notify-ntfy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: cleanTopic,
          title,
          message,
          priority: isTest ? 'default' : 'high',
        }),
      });
      const data = (await resp.json()) as { ok?: boolean; error?: string };
      if (!resp.ok || !data.ok) {
        if (isTest) setNtfyFeedback(data.error || 'Could not send test alert.');
        return;
      }
      if (isTest) {
        setNtfyFeedback(`Test alert sent to ntfy topic "${cleanTopic}"! Check your Android phone.`);
      }
    } catch {
      if (isTest) setNtfyFeedback('Network error sending ntfy test ping.');
    } finally {
      if (isTest) setNtfySending(false);
    }
  };

  // Live Watcher: Fires in-app chime + Browser Notification + optional Android ntfy push
  useEffect(() => {
    if (!alertsArmed) return;
    if (srLevels.zoneStatus === 'MID_RANGE') return;

    const now = Date.now();
    const zoneKey = `${symbol}:${srLevels.zoneStatus}`;
    // Cooldown of 90 seconds per zone so we never spam
    if (lastAlertSentRef.current.zone === zoneKey && now - lastAlertSentRef.current.ts < 90_000) {
      return;
    }

    lastAlertSentRef.current = { zone: zoneKey, ts: now };

    const isSupport = srLevels.zoneStatus === 'OPTIMAL_SUPPORT';
    const title = isSupport
      ? `Symphony Radar: ${baseAsset} at Support Buy Zone`
      : `Symphony Radar: ${baseAsset} at Resistance Sell Zone`;
    const body = isSupport
      ? `${baseAsset} is $${safeLive.toFixed(decimals)} (near $${srLevels.primarySupport.toFixed(
          decimals
        )} support). Target sell: $${srLevels.primaryResistance.toFixed(decimals)} (1:${srLevels.rrRatio} R:R).`
      : `${baseAsset} is $${safeLive.toFixed(decimals)} (near $${srLevels.primaryResistance.toFixed(
          decimals
        )} resistance). Review your Limit Sell or take-profit target.`;

    // 1. In-app banner + gentle harmonic chime
    onNotifyBanner(`${title} — ${body}`);
    playFibonacciHarmonicInterval({
      rootHz: 432,
      targetHz: isSupport ? 528 : 648,
      tone: 'harp',
    });

    // 2. Local Alert History Log
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setRecentAlertLog((prev) => [
      { time: timeLabel, zone: isSupport ? 'SUPPORT' : 'RESISTANCE', message: body },
      ...prev.slice(0, 4),
    ]);

    // 3. Native Browser / Android Chrome Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
      } catch {
        // Ignore mobile iframe Notification constructor restriction
      }
    }

    // 4. Optional Android Lock-Screen Push via ntfy
    if (ntfyTopic.trim().length >= 6) {
      void pushToAndroidNtfy(title, body, false);
    }
  }, [alertsArmed, srLevels, symbol, baseAsset, safeLive, decimals, onNotifyBanner, ntfyTopic]);

  const handleRequestBrowserNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setBrowserNotifStatus('unsupported');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setBrowserNotifStatus(perm);
      if (perm === 'granted') {
        setAlertsArmed(true);
        onNotifyBanner('Live Support & Resistance notifications enabled for this device.');
      }
    } catch {
      setBrowserNotifStatus('denied');
    }
  };

  // Compute the active Limit Buy & Limit Sell Recipe (from Live S/R OR any of the 10 Auto-Trader Setups)
  const limitRecipe = useMemo(() => {
    const qty = Math.max(0.5, Number(orderQtyXrp) || 2);
    if (selectedSource === 'live_sr') {
      return {
        setNumber: 1,
        label: `Live ${baseAsset} Support & Resistance`,
        buySupportPrice: srLevels.primarySupport,
        stopPrice: srLevels.stopBelowSupport,
        sellResistancePrice: srLevels.primaryResistance,
        rr: srLevels.rrRatio,
        qty,
      };
    }

    const tpl =
      TEN_SET_CHECKLIST_TEMPLATES.find((t) => t.setNumber === selectedSource) ??
      TEN_SET_CHECKLIST_TEMPLATES[0];
    const buyPrice = Number((safeLive * (1 - tpl.dipPct)).toFixed(decimals));
    const stopPrice = Number((buyPrice * (1 - tpl.stopPct / 100)).toFixed(decimals));
    const sellPrice = Number((buyPrice * (1 + (tpl.stopPct / 100) * tpl.rr)).toFixed(decimals));
    const numStr = tpl.setNumber < 10 ? `0${tpl.setNumber}` : String(tpl.setNumber);
    return {
      setNumber: tpl.setNumber,
      label: `Set #${numStr} · ${tpl.setupName}`,
      buySupportPrice: buyPrice,
      stopPrice,
      sellResistancePrice: sellPrice,
      rr: tpl.rr,
      qty,
    };
  }, [selectedSource, orderQtyXrp, baseAsset, srLevels, safeLive, decimals]);

  const handleCopyText = (key: string, text: string) => {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text);
    }
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const handleStageIntoDex = (customLabel?: string) => {
    onLoadSetIntoDex({
      setNumber: limitRecipe.setNumber,
      setupName: customLabel || limitRecipe.label,
      buyPrice: limitRecipe.buySupportPrice,
      stopLossPrice: limitRecipe.stopPrice,
      sellPrice: limitRecipe.sellResistancePrice,
      quantityXrp: limitRecipe.qty,
      rrRatio: limitRecipe.rr,
      walletAddress: connectedXrplAddress || undefined,
    });
  };

  return (
    <section
      aria-label="Support and Resistance Market Radar and 24/7 Limit Order Builder"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
    >
      {/* Collapsible Top Bar */}
      <div className="p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
          className="flex-1 text-left flex items-start sm:items-center gap-3 cursor-pointer group"
        >
          <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/70 text-sky-700 dark:text-sky-400 shrink-0 mt-0.5 sm:mt-0">
            {alertsArmed ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors">
                Market Radar: Support &amp; Resistance Alerts + 24/7 Limit Order Guide
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {alertsArmed ? 'Alerts Armed' : 'Ready to Arm'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                Support ${srLevels.primarySupport.toFixed(decimals)} (-
                {srLevels.distToSupportPct.toFixed(2)}%)
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-700 dark:text-amber-400 font-semibold">
                Resistance ${srLevels.primaryResistance.toFixed(decimals)} (+
                {srLevels.distToResistancePct.toFixed(2)}%)
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-sans text-slate-700 dark:text-slate-300">
                {srLevels.zoneStatus === 'OPTIMAL_SUPPORT'
                  ? 'Optimal Buy Zone Active'
                  : srLevels.zoneStatus === 'OPTIMAL_RESISTANCE'
                  ? 'Optimal Sell Zone Active'
                  : 'Mid-Range · Set Limit Orders Ahead'}
              </span>
            </div>
          </div>
        </button>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              const next = !alertsArmed;
              setAlertsArmed(next);
              if (next) {
                onNotifyBanner(
                  `Armed ${baseAsset} Support ($${srLevels.primarySupport.toFixed(
                    decimals
                  )}) & Resistance ($${srLevels.primaryResistance.toFixed(decimals)}) notifications.`
                );
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              alertsArmed
                ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-500'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {alertsArmed ? (
              <BellRing className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <Bell className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{alertsArmed ? 'Alerts Armed (On)' : 'Arm Live Alerts'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>{isExpanded ? 'Hide Radar & Guide' : 'Open Radar & Limit Guide'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Workspace */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-5 bg-slate-50/50 dark:bg-slate-950/40">
          {/* 3 Clean Functional Sub-Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'radar' as const, label: '1. Live Support/Resistance & Notifications', icon: BellRing },
                { id: 'builder' as const, label: '2. Copy From 10 Setups → Stage Limit Order', icon: Layers },
                { id: 'guide' as const, label: '3. How to Set 24/7 Limit Orders in Xaman', icon: BookOpen },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ==============================================================
           * TAB 1: LIVE SUPPORT & RESISTANCE RADAR + NOTIFICATIONS
           * ============================================================== */}
          {activeTab === 'radar' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left: Live Support & Resistance Ladder */}
              <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">
                    Live {baseAsset} Optimal Trade Zones
                  </div>
                  <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    Current Price: ${safeLive.toFixed(decimals)} · Est. R:R 1:{srLevels.rrRatio}
                  </span>
                </div>

                {/* 3-Tier Visual Zone Cards */}
                <div className="space-y-2.5 text-xs">
                  {/* Resistance Ceiling */}
                  <div className="rounded-lg border border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                        <span>Resistance Ceiling (Optimal Limit Sell Zone)</span>
                      </div>
                      <div className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        Primary: <strong>${srLevels.primaryResistance.toFixed(decimals)}</strong> (+
                        {srLevels.distToResistancePct.toFixed(2)}% above) · Extended: $
                        {srLevels.extendedTarget.toFixed(decimals)}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSource('live_sr');
                          handleStageIntoDex(`Live ${baseAsset} Resistance Limit Sell`);
                        }}
                        className="px-2.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold whitespace-nowrap cursor-pointer"
                      >
                        Stage Sell in DEX →
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onAddPriceAlert({
                            symbol,
                            condition: 'above',
                            targetPrice: srLevels.primaryResistance,
                            note: `${baseAsset} reached optimal Resistance Sell zone`,
                          });
                          onNotifyBanner(
                            `Added Resistance Sell Alert for ${baseAsset} above $${srLevels.primaryResistance.toFixed(
                              decimals
                            )}.`
                          );
                        }}
                        className="px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-[11px] font-semibold whitespace-nowrap cursor-pointer"
                      >
                        + Watch Alert
                      </button>
                    </div>
                  </div>

                  {/* Live Mark Divider */}
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {srLevels.statusHeadline}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      Live: ${safeLive.toFixed(decimals)}
                    </span>
                  </div>

                  {/* Support Floor */}
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                        <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                        <span>Support Floor / 61.8% Pocket (Optimal Limit Buy Zone)</span>
                      </div>
                      <div className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        Primary: <strong>${srLevels.primarySupport.toFixed(decimals)}</strong> (-
                        {srLevels.distToSupportPct.toFixed(2)}% below) · Deep Floor: $
                        {srLevels.deepSupport.toFixed(decimals)}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSource('live_sr');
                          handleStageIntoDex(`Live ${baseAsset} Support Limit Buy`);
                        }}
                        className="px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold whitespace-nowrap cursor-pointer"
                      >
                        Stage Buy in DEX →
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onAddPriceAlert({
                            symbol,
                            condition: 'below',
                            targetPrice: srLevels.primarySupport,
                            note: `${baseAsset} reached optimal Support Buy zone`,
                          });
                          onNotifyBanner(
                            `Added Support Buy Alert for ${baseAsset} below $${srLevels.primarySupport.toFixed(
                              decimals
                            )}.`
                          );
                        }}
                        className="px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-[11px] font-semibold whitespace-nowrap cursor-pointer"
                      >
                        + Watch Alert
                      </button>
                    </div>
                  </div>
                </div>

                {recentAlertLog.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      Recent Triggered Notifications
                    </div>
                    {recentAlertLog.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-2 text-slate-600 dark:text-slate-400"
                      >
                        <span>
                          <strong
                            className={
                              item.zone === 'SUPPORT'
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-amber-700 dark:text-amber-400'
                            }
                          >
                            {item.zone}:
                          </strong>{' '}
                          {item.message}
                        </span>
                        <span className="font-mono shrink-0">{item.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Notification Delivery Settings (Tablet + Free Android Phone Push) */}
              <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>Away-From-Screen Notification Settings</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Get alerted the moment price arrives near Support or Resistance — zero KYC and
                    zero API keys required.
                  </p>
                </div>

                {/* Alert Proximity Sensitivity */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Alert Sensitivity (Before Touching Level):
                    </span>
                    <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
                      Within {proximityPct}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[0.3, 0.6, 1.2].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setProximityPct(pct)}
                        className={`py-1.5 px-2 rounded-md border font-mono font-semibold transition-colors cursor-pointer ${
                          proximityPct === pct
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        ±{pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Channel 1: Browser / Tablet Notifications */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      1. Tablet / Browser Pop-Up + Chime
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {browserNotifStatus === 'granted'
                        ? 'Enabled'
                        : browserNotifStatus === 'denied'
                        ? 'Blocked'
                        : 'Optional'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRequestBrowserNotifications()}
                    className="w-full py-1.5 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    {browserNotifStatus === 'granted'
                      ? 'Browser Notifications Active ✓'
                      : 'Allow Tablet / Browser Notifications'}
                  </button>
                </div>

                {/* Channel 2: Free Android Lock-Screen Push via ntfy */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 space-y-2">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    2. Free Android Phone Push (ntfy App · Zero Account)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Install the free <strong>ntfy</strong> app on Android, subscribe to your own
                    private topic name, and enter that same name here:
                  </p>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={ntfyTopic}
                      onChange={(e) => setNtfyTopic(e.target.value)}
                      placeholder="e.g. symphony-xrp-alerts-782"
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      disabled={ntfySending || ntfyTopic.trim().length < 6}
                      onClick={() =>
                        void pushToAndroidNtfy(
                          `Symphony Markets Test (${baseAsset})`,
                          `Connected! Live ${baseAsset} is $${safeLive.toFixed(
                            decimals
                          )}. Support: $${srLevels.primarySupport.toFixed(
                            decimals
                          )} · Resistance: $${srLevels.primaryResistance.toFixed(decimals)}.`,
                          true
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Send className="w-3 h-3 shrink-0" />
                      <span>{ntfySending ? 'Sending...' : 'Test Ping'}</span>
                    </button>
                  </div>
                  {ntfyFeedback && (
                    <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      {ntfyFeedback}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==============================================================
           * TAB 2: COPY & STAGE FROM 10 SETUPS OR LIVE S/R (24/7 LIMIT READY)
           * ============================================================== */}
          {activeTab === 'builder' && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Pick Your Support/Resistance Source (Live Levels OR Any of the 10 Setups)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Choose a setup below, copy the exact Buy &amp; Sell Limit numbers into Xaman, or
                    tap <strong>Load Into XRPL DEX Below</strong> so your order sits on the XRPL
                    orderbook 24/7.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <select
                    aria-label="Choose Live Support Resistance or 10-Set Setup"
                    value={String(selectedSource)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedSource(val === 'live_sr' ? 'live_sr' : Number(val));
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="live_sr">
                      Live {baseAsset} Support &amp; Resistance Levels
                    </option>
                    {TEN_SET_CHECKLIST_TEMPLATES.map((tpl) => (
                      <option key={tpl.setNumber} value={String(tpl.setNumber)}>
                        Set #{tpl.setNumber < 10 ? `0${tpl.setNumber}` : tpl.setNumber} ·{' '}
                        {tpl.setupName} (1:{tpl.rr})
                      </option>
                    ))}
                  </select>

                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Qty:</span>
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={orderQtyXrp}
                      onChange={(e) => setOrderQtyXrp(e.target.value)}
                      className="w-14 bg-transparent font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                    />
                    <span className="font-mono text-slate-500">XRP</span>
                  </label>
                </div>
              </div>

              {/* Side-by-Side 24/7 Limit Buy (Support) & Limit Sell (Resistance) Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Limit Buy Card */}
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">
                      Order A · 24/7 Limit BUY at Support
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      Needs RLUSD in Wallet
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono tabular-nums">
                    <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5">
                      <div className="font-sans text-[11px] text-slate-500">Buy Limit Price</div>
                      <div className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                        ${limitRecipe.buySupportPrice.toFixed(decimals)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5">
                      <div className="font-sans text-[11px] text-slate-500">Order Size</div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {limitRecipe.qty} XRP ($
                        {(limitRecipe.qty * limitRecipe.buySupportPrice).toFixed(2)})
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText('buyPrice', limitRecipe.buySupportPrice.toFixed(decimals))
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      {copiedKey === 'buyPrice' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {copiedKey === 'buyPrice' ? 'Copied Buy Price' : 'Copy Buy Price'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStageIntoDex(`${limitRecipe.label} (Limit Buy)`)}
                      className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                    >
                      Load Into XRPL DEX ↓
                    </button>
                  </div>
                </div>

                {/* Limit Sell Card */}
                <div className="rounded-xl border border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-amber-800 dark:text-amber-300">
                      Order B · 24/7 Limit SELL at Resistance
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      Needs XRP in Wallet
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono tabular-nums">
                    <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5">
                      <div className="font-sans text-[11px] text-slate-500">Sell Limit Price</div>
                      <div className="text-base font-bold text-amber-700 dark:text-amber-400">
                        ${limitRecipe.sellResistancePrice.toFixed(decimals)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5">
                      <div className="font-sans text-[11px] text-slate-500">You Receive</div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        ${(limitRecipe.qty * limitRecipe.sellResistancePrice).toFixed(2)} RLUSD
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          'sellPrice',
                          limitRecipe.sellResistancePrice.toFixed(decimals)
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      {copiedKey === 'sellPrice' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {copiedKey === 'sellPrice' ? 'Copied Sell Price' : 'Copy Sell Price'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStageIntoDex(`${limitRecipe.label} (Limit Sell)`)}
                      className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer"
                    >
                      Load Into XRPL DEX ↓
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                <span>
                  Safety Stop Reference: <strong className="font-mono">${limitRecipe.stopPrice.toFixed(decimals)}</strong> · Risk-to-Reward:{' '}
                  <strong className="font-mono">1:{limitRecipe.rr}</strong>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      'full',
                      `${limitRecipe.label} | Qty: ${limitRecipe.qty} XRP | Limit Buy (Support): $${limitRecipe.buySupportPrice.toFixed(
                        decimals
                      )} | Limit Sell (Resistance): $${limitRecipe.sellResistancePrice.toFixed(
                        decimals
                      )} | Stop Ref: $${limitRecipe.stopPrice.toFixed(decimals)}`
                    )
                  }
                  className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>
                    {copiedKey === 'full'
                      ? 'Copied Full Order Summary ✓'
                      : 'Copy Full Buy + Sell Summary'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ==============================================================
           * TAB 3: STEP-BY-STEP GUIDE FOR 24/7 SELF-CUSTODY LIMIT ORDERS
           * ============================================================== */}
          {activeTab === 'guide' && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Zero Private Keys Shared · Zero AI Bot Risk · Runs 24/7 on XRPL</span>
                </div>
                <h4 className="font-editorial text-lg font-bold text-slate-900 dark:text-white">
                  How to Set a 24/7 Limit Buy &amp; Limit Sell Order in Xaman (So XRPL Executes While You Sleep)
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                  An XRPL Limit Order is already a built-in 24/7 robot on the blockchain. Once you
                  sign it in Xaman, you can close your tablet and go about your day — the XRP Ledger
                  automatically executes your exact price the moment the market touches Support or
                  Resistance.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2">
                  <div className="font-mono font-bold text-sky-700 dark:text-sky-400">
                    Step 01 · Check Which Side You Place First
                  </div>
                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 leading-relaxed">
                    <li>
                      <strong>Wallet holds XRP + $0.00 RLUSD:</strong> Start with a{' '}
                      <strong>Limit Sell at Resistance</strong> (e.g., Sell {limitRecipe.qty} XRP at{' '}
                      <span className="font-mono font-semibold">
                        ${limitRecipe.sellResistancePrice.toFixed(decimals)}
                      </span>
                      ). When it fills, RLUSD lands in your wallet.
                    </li>
                    <li>
                      <strong>Wallet already holds RLUSD dollars:</strong> Start with a{' '}
                      <strong>Limit Buy at Support</strong> (e.g., Buy {limitRecipe.qty} XRP at{' '}
                      <span className="font-mono font-semibold">
                        ${limitRecipe.buySupportPrice.toFixed(decimals)}
                      </span>
                      ). When price dips to support, XRP lands in your wallet.
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2">
                  <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    Step 02 · Place a Limit BUY Order at Support (Waiting Lower)
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                    <li>Open <strong>Xaman</strong> on Android → open <strong>DEX Trade</strong> (XRP / RLUSD).</li>
                    <li>Switch order type from Market to <strong>Limit</strong> and select <strong>Buy XRP</strong>.</li>
                    <li>Enter your Support price (<strong>${limitRecipe.buySupportPrice.toFixed(decimals)}</strong>) and amount (<strong>{limitRecipe.qty} XRP</strong>).</li>
                    <li>Verify the RLUSD total and <strong>slide to sign</strong>. Your order now waits on-chain 24/7!</li>
                  </ol>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2">
                  <div className="font-mono font-bold text-amber-700 dark:text-amber-400">
                    Step 03 · Place a Limit SELL Order at Resistance (Waiting Higher)
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                    <li>Confirm your <strong>RLUSD TrustLine</strong> is active (one-time Step 1B).</li>
                    <li>In Xaman <strong>DEX Trade</strong> (XRP / RLUSD), choose <strong>Limit → Sell XRP</strong>.</li>
                    <li>Enter your Resistance target (<strong>${limitRecipe.sellResistancePrice.toFixed(decimals)}</strong>) and amount (<strong>{limitRecipe.qty} XRP</strong>).</li>
                    <li><strong>Slide to sign.</strong> Even with your phone off, XRPL swaps your XRP to RLUSD the instant price hits resistance.</li>
                  </ol>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2">
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    Step 04 · Complete the Cycle &amp; Cancel Anytime
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    You stay in 100% control at every moment. Every open limit order appears
                    automatically under <strong>Step 1 Synced Wallet</strong> on your tablet and
                    inside Xaman&apos;s <strong>Open Orders</strong> tab. If market conditions
                    change, cancel with one tap (fee ~0.000012 XRP) and stage the next set from your
                    1-by-1 Checklist.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
