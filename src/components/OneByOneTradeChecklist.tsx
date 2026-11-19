import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Download,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { ImportedAutoTraderDexSet } from './RiskSimulatorPanel';

export interface OneByOneSetProgress {
  staged: boolean;
  receiptChecked: boolean;
  signedInWallet: boolean;
  filledAndLogged: boolean;
  note: string;
}

export interface OneByOneChecklistState {
  preFlight: {
    walletConnected: boolean;
    rlusdTrustline: boolean;
    startingLegChecked: boolean;
  };
  sets: Record<number, OneByOneSetProgress>;
}

export interface AutoSetChecklistMeta {
  setNumber: number;
  setupName: string;
  dipPct: number;
  stopPct: number;
  rr: number;
}

export const TEN_SET_CHECKLIST_TEMPLATES: AutoSetChecklistMeta[] = [
  { setNumber: 1, setupName: 'Fib 61.8% Golden Pocket', dipPct: 0.018, stopPct: 1.8, rr: 2.0 },
  { setNumber: 2, setupName: 'Bullish Hammer Support', dipPct: 0.014, stopPct: 1.6, rr: 2.0 },
  { setNumber: 3, setupName: 'EMA-20 Trend Pullback', dipPct: 0.011, stopPct: 1.5, rr: 2.0 },
  { setNumber: 4, setupName: 'Fib 50% Equilibrium', dipPct: 0.016, stopPct: 1.7, rr: 2.5 },
  { setNumber: 5, setupName: 'Higher-Low Continuation', dipPct: 0.012, stopPct: 1.5, rr: 2.0 },
  { setNumber: 6, setupName: 'Liquidity Sweep Bounce', dipPct: 0.022, stopPct: 2.0, rr: 1.5 },
  { setNumber: 7, setupName: 'Range Midpoint Retest', dipPct: 0.013, stopPct: 1.6, rr: 2.0 },
  { setNumber: 8, setupName: 'Fib 78.6% Deep Value', dipPct: 0.025, stopPct: 2.0, rr: 2.2 },
  { setNumber: 9, setupName: 'Ascending Channel Floor', dipPct: 0.015, stopPct: 1.6, rr: 2.0 },
  { setNumber: 10, setupName: '161.8% Golden Wave', dipPct: 0.019, stopPct: 1.8, rr: 3.0 },
];

export const ONE_BY_ONE_CHECKLIST_STORAGE_KEY = 'symphony_markets_1by1_checklist_v1';

export function createInitialChecklistState(): OneByOneChecklistState {
  const sets: Record<number, OneByOneSetProgress> = {};
  for (let i = 1; i <= 10; i++) {
    sets[i] = {
      staged: false,
      receiptChecked: false,
      signedInWallet: false,
      filledAndLogged: false,
      note: '',
    };
  }
  return {
    preFlight: {
      walletConnected: false,
      rlusdTrustline: false,
      startingLegChecked: false,
    },
    sets,
  };
}

export function loadPersistedChecklistState(): OneByOneChecklistState {
  const fallback = createInitialChecklistState();
  try {
    const raw = localStorage.getItem(ONE_BY_ONE_CHECKLIST_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<OneByOneChecklistState>;
    const merged = createInitialChecklistState();
    if (parsed.preFlight) {
      merged.preFlight = {
        walletConnected: Boolean(parsed.preFlight.walletConnected),
        rlusdTrustline: Boolean(parsed.preFlight.rlusdTrustline),
        startingLegChecked: Boolean(parsed.preFlight.startingLegChecked),
      };
    }
    if (parsed.sets) {
      for (let i = 1; i <= 10; i++) {
        const s = parsed.sets[i];
        if (s) {
          merged.sets[i] = {
            staged: Boolean(s.staged),
            receiptChecked: Boolean(s.receiptChecked),
            signedInWallet: Boolean(s.signedInWallet),
            filledAndLogged: Boolean(s.filledAndLogged),
            note: typeof s.note === 'string' ? s.note : '',
          };
        }
      }
    }
    return merged;
  } catch {
    return fallback;
  }
}

interface OneByOneTradeChecklistProps {
  contextStep: 'step14' | 'step15';
  xrpLivePrice: number;
  connectedXrplAddress?: string;
  checklistState: OneByOneChecklistState;
  onChangeChecklistState: React.Dispatch<React.SetStateAction<OneByOneChecklistState>>;
  onLoadSetIntoDex: (payload: Omit<ImportedAutoTraderDexSet, 'nonce'>) => void;
  defaultExpanded?: boolean;
}

export const OneByOneTradeChecklist: React.FC<OneByOneTradeChecklistProps> = ({
  contextStep,
  xrpLivePrice,
  connectedXrplAddress,
  checklistState,
  onChangeChecklistState,
  onLoadSetIntoDex,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [confirmingReset, setConfirmingReset] = useState<boolean>(false);
  const [worksheetDownloadedMsg, setWorksheetDownloadedMsg] = useState<string | null>(null);

  const safeXrp = xrpLivePrice > 0.05 ? xrpLivePrice : 2.42;

  const stats = useMemo(() => {
    const preFlightDone =
      (checklistState.preFlight.walletConnected ? 1 : 0) +
      (checklistState.preFlight.rlusdTrustline ? 1 : 0) +
      (checklistState.preFlight.startingLegChecked ? 1 : 0);

    let completedSets = 0;
    let firstIncompleteSet: number | null = null;

    for (let i = 1; i <= 10; i++) {
      const s = checklistState.sets[i];
      const isDone = Boolean(s?.filledAndLogged);
      if (isDone) {
        completedSets++;
      } else if (firstIncompleteSet === null) {
        firstIncompleteSet = i;
      }
    }

    return {
      preFlightDone,
      completedSets,
      firstIncompleteSet,
      progressPct: Math.round(((preFlightDone + completedSets * 4) / 43) * 100),
    };
  }, [checklistState]);

  const togglePreFlight = (key: keyof OneByOneChecklistState['preFlight']) => {
    onChangeChecklistState((prev) => ({
      ...prev,
      preFlight: {
        ...prev.preFlight,
        [key]: !prev.preFlight[key],
      },
    }));
  };

  const toggleSetField = (
    setNumber: number,
    field: 'staged' | 'receiptChecked' | 'signedInWallet' | 'filledAndLogged'
  ) => {
    onChangeChecklistState((prev) => {
      const current = prev.sets[setNumber] || {
        staged: false,
        receiptChecked: false,
        signedInWallet: false,
        filledAndLogged: false,
        note: '',
      };
      return {
        ...prev,
        sets: {
          ...prev.sets,
          [setNumber]: {
            ...current,
            [field]: !current[field],
          },
        },
      };
    });
  };

  const updateSetNote = (setNumber: number, note: string) => {
    onChangeChecklistState((prev) => {
      const current = prev.sets[setNumber] || {
        staged: false,
        receiptChecked: false,
        signedInWallet: false,
        filledAndLogged: false,
        note: '',
      };
      return {
        ...prev,
        sets: {
          ...prev.sets,
          [setNumber]: {
            ...current,
            note,
          },
        },
      };
    });
  };

  const handleStageSet = (tpl: AutoSetChecklistMeta) => {
    const buyPrice = Number((safeXrp * (1 - tpl.dipPct)).toFixed(4));
    const stopLossPrice = Number((buyPrice * (1 - tpl.stopPct / 100)).toFixed(4));
    const sellPrice = Number((buyPrice * (1 + (tpl.stopPct / 100) * tpl.rr)).toFixed(4));

    onChangeChecklistState((prev) => ({
      ...prev,
      sets: {
        ...prev.sets,
        [tpl.setNumber]: {
          ...(prev.sets[tpl.setNumber] || {
            staged: false,
            receiptChecked: false,
            signedInWallet: false,
            filledAndLogged: false,
            note: '',
          }),
          staged: true,
        },
      },
    }));

    onLoadSetIntoDex({
      setNumber: tpl.setNumber,
      setupName: tpl.setupName,
      buyPrice,
      stopLossPrice,
      sellPrice,
      quantityXrp: 2,
      rrRatio: tpl.rr,
      walletAddress: connectedXrplAddress || undefined,
    });
  };

  const handleDownloadPrintableWorksheet = () => {
    const checkMark = (done: boolean) => (done ? '☑' : '☐');
    const dateStr = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const rowsHtml = TEN_SET_CHECKLIST_TEMPLATES.map((tpl) => {
      const s = checklistState.sets[tpl.setNumber];
      const numLabel = tpl.setNumber < 10 ? `0${tpl.setNumber}` : String(tpl.setNumber);
      const buyDip = (safeXrp * (1 - tpl.dipPct)).toFixed(4);
      const sellTarget = (Number(buyDip) * (1 + (tpl.stopPct / 100) * tpl.rr)).toFixed(4);
      const escapedNote = (s?.note || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `
        <tr>
          <td class="mono bold">#${numLabel}</td>
          <td><strong>${tpl.setupName}</strong><br/><span class="muted">Buy Dip ~$${buyDip} · Target Sell ~$${sellTarget} · 1:${tpl.rr.toFixed(1)}</span></td>
          <td class="center">${checkMark(Boolean(s?.staged))}</td>
          <td class="center">${checkMark(Boolean(s?.receiptChecked))}</td>
          <td class="center">${checkMark(Boolean(s?.signedInWallet))}</td>
          <td class="center">${checkMark(Boolean(s?.filledAndLogged))}</td>
          <td>${escapedNote || '<span class="muted">__________________________</span>'}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Symphony Markets Academy — 1-by-1 Student Trade Checklist (Set #01 to #10)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 28px; line-height: 1.45; }
    h1 { font-size: 20px; margin: 0 0 4px 0; }
    .sub { font-size: 12px; color: #475569; margin-bottom: 18px; }
    .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; }
    .box h2 { font-size: 13px; margin: 0 0 8px 0; text-transform: none; }
    .preflight { list-style: none; padding: 0; margin: 0; font-size: 12px; }
    .preflight li { margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 8px; text-align: left; vertical-align: top; }
    th { background: #f8fafc; font-weight: 600; }
    .center { text-align: center; font-size: 15px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .bold { font-weight: 700; }
    .muted { color: #64748b; font-size: 11px; }
    .footer { margin-top: 16px; font-size: 11px; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    @media print { .no-print { display: none; } body { margin: 14px; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:14px;">
    <button onclick="window.print()" style="padding:8px 14px;background:#059669;color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer;">Print This Checklist</button>
  </div>
  <h1>Symphony Markets Academy — 1-by-1 Student Trade Checklist (Set #01 → #10)</h1>
  <div class="sub">
    Printed ${dateStr} · Reference Live XRP Price: $${safeXrp.toFixed(4)} · Completed: ${stats.completedSets}/10 Sets · 1x Spot Self-Custody Only (Zero Leverage)
  </div>

  <div class="box">
    <h2>One-Time Wallet Pre-Flight (Complete Before Set #01)</h2>
    <ul class="preflight">
      <li>${checkMark(checklistState.preFlight.walletConnected)} <strong>Step 1:</strong> Connected read-only public XRPL address (<code>r...</code>) & kept safe base reserve cushion (never trade 100% of XRP).</li>
      <li>${checkMark(checklistState.preFlight.rlusdTrustline)} <strong>Step 1B:</strong> Enabled one-time <strong>RLUSD TrustLine</strong> so wallet can receive RLUSD dollars when selling XRP.</li>
      <li>${checkMark(checklistState.preFlight.startingLegChecked)} <strong>Golden Rule:</strong> Wallet holds XRP + $0.00 RLUSD → start by <strong>Selling XRP</strong>. Wallet holds RLUSD → <strong>Buy XRP Dip</strong>.</li>
    </ul>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:48px;">Set</th>
        <th>Setup & Reference Levels</th>
        <th class="center" style="width:68px;">1. Staged<br/><span class="muted">(Exact XRP)</span></th>
        <th class="center" style="width:74px;">2. Receipt<br/><span class="muted">Checked</span></th>
        <th class="center" style="width:72px;">3. Signed<br/><span class="muted">in Wallet</span></th>
        <th class="center" style="width:74px;">4. Filled<br/><span class="muted">& Logged</span></th>
        <th style="width:190px;">Student Trade Note / Fill Price</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="footer">
    <strong>One-by-One Rule:</strong> Never stack all 10 orders at once on a small wallet. Finish and confirm Set #01 before staging Set #02 so your XRP reserves remain free and every trade stays calm and intentional. Educational self-custody training only — not financial advice.
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Symphony_Markets_1by1_Student_Trade_Checklist.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setWorksheetDownloadedMsg('Downloaded printable HTML checklist — open it anytime to print.');
    setTimeout(() => setWorksheetDownloadedMsg(null), 5000);
  };

  return (
    <section
      aria-label="1-by-1 Student Trade Checklist (Set #01 to #10)"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
    >
      {/* Collapsible Header Bar */}
      <div className="p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
          className="flex-1 text-left flex items-start sm:items-center gap-3 cursor-pointer group"
        >
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                1-by-1 Student Trade Checklist (Set #01 → #10)
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Synced across Live Chart DEX &amp; 10-Set Sequencer
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
              <span>Pre-Flight {stats.preFlightDone}/3</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {stats.completedSets} / 10 Sets Completed
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {stats.firstIncompleteSet !== null
                  ? `Active Focus: Set #${
                      stats.firstIncompleteSet < 10
                        ? `0${stats.firstIncompleteSet}`
                        : stats.firstIncompleteSet
                    }`
                  : 'All 10 Sets Completed'}
              </span>
            </div>

            {/* Slim Progress Bar */}
            <div className="w-full max-w-md h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${stats.progressPct}%` }}
                className="h-full rounded-full bg-emerald-600 transition-all duration-200"
              />
            </div>
          </div>
        </button>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadPrintableWorksheet}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Printable Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isExpanded) {
                setIsExpanded(true);
                setTimeout(() => window.print(), 120);
              } else {
                window.print();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            <span>Print View</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>{isExpanded ? 'Collapse Checklist' : 'Open 1-by-1 Checklist'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {worksheetDownloadedMsg && (
        <div className="px-5 py-2 border-t border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-xs font-medium text-emerald-800 dark:text-emerald-300">
          {worksheetDownloadedMsg}
        </div>
      )}

      {/* Expanded Body */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-5 bg-slate-50/50 dark:bg-slate-950/40">
          {/* Zone A: One-Time Pre-Flight Check */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">
                Before Trade #1 · One-Time Wallet Pre-Flight ({stats.preFlightDone}/3)
              </div>
              <span className="text-slate-500 dark:text-slate-400">
                Complete once in Live Chart &amp; XRPL DEX before running Set #01
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklistState.preFlight.walletConnected}
                  onChange={() => togglePreFlight('walletConnected')}
                  className="mt-0.5 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-slate-700 dark:text-slate-300 leading-snug">
                  <strong>1. Connect Public r... Address</strong> &amp; leave a safe XRP reserve
                  cushion (never trade 100% of your balance).
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklistState.preFlight.rlusdTrustline}
                  onChange={() => togglePreFlight('rlusdTrustline')}
                  className="mt-0.5 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-slate-700 dark:text-slate-300 leading-snug">
                  <strong>2. Enable RLUSD TrustLine</strong> (one-time Step 1B so your wallet can
                  receive RLUSD dollars when selling XRP).
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklistState.preFlight.startingLegChecked}
                  onChange={() => togglePreFlight('startingLegChecked')}
                  className="mt-0.5 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-slate-700 dark:text-slate-300 leading-snug">
                  <strong>3. Verify Starting Leg:</strong> Hold XRP + $0 RLUSD →{' '}
                  <strong>Sell XRP first</strong>; hold RLUSD → <strong>Buy XRP Dip</strong>.
                </span>
              </label>
            </div>
          </div>

          {/* Zone B: 10-Set One-by-One Tracker Grid */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">
                Set #01 → Set #10 One-by-One Execution Log (Live XRP Ref: ${safeXrp.toFixed(4)})
              </div>
              <span className="text-slate-500 dark:text-slate-400">
                Finish and check off one set before loading the next
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {TEN_SET_CHECKLIST_TEMPLATES.map((tpl) => {
                const progress = checklistState.sets[tpl.setNumber] || {
                  staged: false,
                  receiptChecked: false,
                  signedInWallet: false,
                  filledAndLogged: false,
                  note: '',
                };
                const isComplete = progress.filledAndLogged;
                const isNextUp = stats.firstIncompleteSet === tpl.setNumber;
                const numLabel = tpl.setNumber < 10 ? `0${tpl.setNumber}` : String(tpl.setNumber);
                const buyDip = Number((safeXrp * (1 - tpl.dipPct)).toFixed(4));
                const sellTarget = Number(
                  (buyDip * (1 + (tpl.stopPct / 100) * tpl.rr)).toFixed(4)
                );

                return (
                  <div
                    key={tpl.setNumber}
                    className={`rounded-lg border p-3.5 space-y-3 transition-colors ${
                      isComplete
                        ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : isNextUp
                        ? 'border-sky-400 dark:border-sky-600 bg-white dark:bg-slate-900'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                            Set #{numLabel}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {tpl.setupName}
                          </span>
                          {isComplete && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Done</span>
                            </span>
                          )}
                          {!isComplete && isNextUp && (
                            <span className="font-semibold text-sky-700 dark:text-sky-400">
                              · Active Next
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          Buy Dip ${buyDip.toFixed(4)} · Target Sell ${sellTarget.toFixed(4)} · 1:
                          {tpl.rr.toFixed(1)} R:R
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStageSet(tpl)}
                        className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isNextUp
                            ? 'bg-sky-600 hover:bg-sky-500 text-white'
                            : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {contextStep === 'step14'
                          ? `Load #${numLabel} in DEX`
                          : `Open #${numLabel} in XRPL DEX →`}
                      </button>
                    </div>

                    {/* 4 Micro-Step Checkboxes */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                      <label className="flex items-center gap-1.5 p-1.5 rounded border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={progress.staged}
                          onChange={() => toggleSetField(tpl.setNumber, 'staged')}
                          className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 cursor-pointer"
                        />
                        <span className="text-slate-700 dark:text-slate-300 truncate">
                          1. Staged XRP
                        </span>
                      </label>

                      <label className="flex items-center gap-1.5 p-1.5 rounded border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={progress.receiptChecked}
                          onChange={() => toggleSetField(tpl.setNumber, 'receiptChecked')}
                          className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 cursor-pointer"
                        />
                        <span className="text-slate-700 dark:text-slate-300 truncate">
                          2. Receipt OK
                        </span>
                      </label>

                      <label className="flex items-center gap-1.5 p-1.5 rounded border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={progress.signedInWallet}
                          onChange={() => toggleSetField(tpl.setNumber, 'signedInWallet')}
                          className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 cursor-pointer"
                        />
                        <span className="text-slate-700 dark:text-slate-300 truncate">
                          3. Signed
                        </span>
                      </label>

                      <label className="flex items-center gap-1.5 p-1.5 rounded border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={progress.filledAndLogged}
                          onChange={() => toggleSetField(tpl.setNumber, 'filledAndLogged')}
                          className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 cursor-pointer"
                        />
                        <span className="text-slate-700 dark:text-slate-300 truncate font-semibold">
                          4. Filled
                        </span>
                      </label>
                    </div>

                    {/* Optional 1-Line Student Note */}
                    <input
                      type="text"
                      value={progress.note}
                      onChange={(e) => updateSetNote(tpl.setNumber, e.target.value)}
                      placeholder={`Student note for Set #${numLabel} (e.g. Sold 2 XRP @ $${sellTarget.toFixed(
                        4
                      )})...`}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer: Discipline Reminder + Inline Two-Step Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              Saved automatically in this browser · Keep only <strong>1 active set</strong> open at
              a time so your wallet reserves stay free and every decision stays calm.
            </span>

            <div className="flex items-center gap-2 shrink-0">
              {confirmingReset ? (
                <>
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">
                    Clear all 10 checkboxes?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeChecklistState(createInitialChecklistState());
                      setConfirmingReset(false);
                    }}
                    className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Confirm Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingReset(false)}
                    className="px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingReset(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>Reset Progress</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
