import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Check,
  Copy,
  Image as ImageIcon,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import { ImportedAutoTraderDexSet } from './RiskSimulatorPanel';

export interface ScannedChartAnalysis {
  assetLabel: string;
  timeframeLabel: string;
  marketBias: string;
  direction: 'BUY' | 'SELL' | 'WAIT' | string;
  entryPrice: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  supportLevel: number;
  resistanceLevel: number;
  riskRewardRatio: number;
  plainSummary: string;
  keyObservations: string[];
  cautionNote: string;
}

interface ChartScreenshotScannerProps {
  accountBalance: number;
  riskPercent: number;
  connectedXrplAddress?: string;
  onStageSetupIntoDesk: (payload: Omit<ImportedAutoTraderDexSet, 'nonce'>) => void;
}

function formatSmartPrice(val: number): string {
  if (!Number.isFinite(val) || val <= 0) return '0.00';
  if (val >= 100) return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (val >= 10) return val.toFixed(3);
  return val.toFixed(4);
}

/**
 * Downscales large phone/tablet screenshots onto an offscreen canvas (max 1400px)
 * so uploads stay fast, crisp for Gemini vision, and well below payload limits.
 */
async function compressImageToBase64(file: File): Promise<{
  base64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  previewDataUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const img = new window.Image();
      img.onerror = () => reject(new Error('Invalid image file. Please pick a PNG or JPG screenshot.'));
      img.onload = () => {
        const maxDim = 1400;
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.max(1, Math.round(w * ratio));
          h = Math.max(1, Math.round(h * ratio));
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const fallbackMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          resolve({
            base64: dataUrl.split(',')[1] || '',
            mimeType: fallbackMime,
            previewDataUrl: dataUrl,
          });
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const outMime: 'image/jpeg' | 'image/png' = file.size < 650_000 && file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const compressedUrl = canvas.toDataURL(outMime, 0.88);
        resolve({
          base64: compressedUrl.split(',')[1] || '',
          mimeType: outMime,
          previewDataUrl: compressedUrl,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const ChartScreenshotScanner: React.FC<ChartScreenshotScannerProps> = ({
  accountBalance,
  riskPercent,
  connectedXrplAddress,
  onStageSetupIntoDesk,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [budgetInput, setBudgetInput] = useState<number>(Math.max(5, Math.round(accountBalance || 100)));
  const [riskInput, setRiskInput] = useState<number>(Math.max(0.5, Math.min(5, riskPercent || 2)));
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ScannedChartAnalysis | null>(null);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  const handleFileSelected = async (file: File | null | undefined) => {
    if (!file) return;
    setErrorMsg(null);
    setResult(null);
    setAnalyzing(true);
    try {
      const prepared = await compressImageToBase64(file);
      setPreviewUrl(prepared.previewDataUrl);

      const resp = await fetch('/api/analyze-chart-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: prepared.base64,
          mimeType: prepared.mimeType,
          budgetUsd: budgetInput,
          riskPct: riskInput,
        }),
      });

      const data = (await resp.json()) as {
        ok?: boolean;
        analysis?: ScannedChartAnalysis;
        error?: string;
      };

      if (!resp.ok || !data.ok || !data.analysis) {
        throw new Error(data.error || 'Could not analyze that chart screenshot. Please try another clear image.');
      }

      setResult(data.analysis);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Chart scan failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setPreviewUrl('');
    setResult(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Compute exact 2% Risk Dollar Math from the scanned setup
  const safeBudget = Math.max(5, budgetInput || 100);
  const safeRiskPct = Math.max(0.5, Math.min(5, riskInput || 2));
  const riskDollars = safeBudget * (safeRiskPct / 100);
  const computedRr =
    result && result.entryPrice > 0 && Math.abs(result.entryPrice - result.stopLossPrice) > 0
      ? Number(
          (
            Math.abs(result.takeProfitPrice - result.entryPrice) /
            Math.abs(result.entryPrice - result.stopLossPrice)
          ).toFixed(2)
        )
      : result?.riskRewardRatio || 2;
  const potentialRewardDollars = riskDollars * Math.max(0.5, computedRr);

  const normalizedDir = String(result?.direction || 'BUY').toUpperCase();
  const isWait = normalizedDir === 'WAIT';
  const isSell = normalizedDir === 'SELL';

  const handleCopyTicket = () => {
    if (!result) return;
    const ticket = [
      `Symphony Chart Scan — ${result.assetLabel} (${result.timeframeLabel})`,
      `${isWait ? 'Wait / Watch' : isSell ? 'Sell around' : 'Buy around'}: $${formatSmartPrice(result.entryPrice)}`,
      `Target: $${formatSmartPrice(result.takeProfitPrice)} · Stop Loss: $${formatSmartPrice(result.stopLossPrice)} (1:${computedRr} R:R)`,
      `Potential: +$${potentialRewardDollars.toFixed(2)} on $${safeBudget} · Max Risk: -$${riskDollars.toFixed(2)} (${safeRiskPct}%)`,
    ].join('\n');
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(ticket);
    }
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleStageToTradeDesk = () => {
    if (!result || result.entryPrice <= 0) return;
    const buyP = Math.min(result.entryPrice, result.takeProfitPrice);
    const sellP = Math.max(result.entryPrice, result.takeProfitPrice);
    const stopP = result.stopLossPrice > 0 ? result.stopLossPrice : buyP * 0.98;
    const qty = Math.max(1, Number((safeBudget / Math.max(0.01, result.entryPrice)).toFixed(2)));
    onStageSetupIntoDesk({
      setNumber: 1,
      setupName: `Chart Scan: ${result.assetLabel} (${result.timeframeLabel})`,
      buyPrice: buyP,
      stopLossPrice: stopP,
      sellPrice: sellP,
      quantityXrp: Math.min(qty, 50),
      rrRatio: Math.max(1, Math.min(5, computedRr || 2)),
      walletAddress: connectedXrplAddress || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Calm 1-Line Header */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Honest Educational Chart Scanner · Crypto, Forex, Gold &amp; Stocks</span>
            </div>
            <h2 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Upload Any Chart Screenshot → Simple 3-Line Trade Card
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Snap or upload any candlestick chart (TradingView, Xaman, Coinbase, or Forex). Get
              calm Support, Resistance, and exact 2% Risk math—with zero hype or fake win-rate
              promises.
            </p>
          </div>

          {/* Simple 2-Number Budget Strip */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs">
            <label className="space-y-1">
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Practice Budget ($)
              </span>
              <input
                type="number"
                min={5}
                step={5}
                value={budgetInput}
                onChange={(e) => setBudgetInput(Math.max(5, Number(e.target.value) || 5))}
                className="w-24 px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-semibold text-slate-900 dark:text-white tabular-nums"
              />
            </label>
            <label className="space-y-1">
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Max Risk (%)
              </span>
              <select
                value={riskInput}
                onChange={(e) => setRiskInput(Number(e.target.value))}
                className="w-20 px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-semibold text-slate-900 dark:text-white"
              >
                <option value={1}>1%</option>
                <option value={2}>2%</option>
                <option value={3}>3%</option>
              </select>
            </label>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => void handleFileSelected(e.target.files?.[0])}
        />

        {/* Upload Dropzone (Shown before a screenshot is picked) */}
        {!previewUrl && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void handleFileSelected(e.dataTransfer.files?.[0]);
            }}
            className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/60 p-8 sm:p-10 text-center space-y-4"
          >
            <div className="mx-auto w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="text-base font-bold text-slate-900 dark:text-white">
                Drop a Chart Screenshot Here or Tap Below
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Works with XRP, BTC, XLM, EUR/USD Forex, Gold, or Stocks (PNG, JPG, WEBP)
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 shrink-0" />
                <span>Choose Chart Screenshot</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>Take Photo / Library</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {analyzing && (
          <div className="rounded-xl border border-sky-500/30 bg-sky-50/50 dark:bg-sky-950/20 p-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
            <Sparkles className="w-6 h-6 text-sky-600 dark:text-sky-400 animate-spin shrink-0" />
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Reading candles, support floors &amp; resistance ceilings...
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Calculating your 3-line setup card with {safeRiskPct}% risk protection on $
                {safeBudget}.
              </p>
            </div>
          </div>
        )}

        {/* Honest Error Display */}
        {errorMsg && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-300">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-rose-400/50 font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Try Another Screenshot
            </button>
          </div>
        )}

        {/* Clean Scantrader-Inspired Result Layout */}
        {previewUrl && !analyzing && result && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Uploaded Chart Preview */}
            <div className="lg:col-span-6 space-y-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950">
                <img
                  src={previewUrl}
                  alt={`Uploaded chart for ${result.assetLabel}`}
                  className="w-full max-h-[380px] object-contain"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Detected: <strong className="text-slate-900 dark:text-white">{result.assetLabel}</strong> ·{' '}
                  {result.timeframeLabel} · {result.marketBias}
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Scan Another Chart</span>
                </button>
              </div>
            </div>

            {/* Right: Ultra-Clean 3-Line Trade Setup Card + Plain-English Breakdown */}
            <div className="lg:col-span-6 space-y-4">
              {/* THE 3-LINE TRADE CARD (Simple, Calm, Zero Hype) */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Symphony Educational Setup · {result.assetLabel}
                  </span>
                  <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    1:{computedRr} R:R
                  </span>
                </div>

                {/* Line 1: Entry */}
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                  {isWait ? 'Wait / Watch near' : isSell ? 'Sell around' : 'Buy around'} $
                  {formatSmartPrice(result.entryPrice)}
                </div>

                {/* Line 2: Target & Stop Loss */}
                <div className="flex flex-wrap items-center gap-3 text-sm font-mono tabular-nums">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    Target: ${formatSmartPrice(result.takeProfitPrice)}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">
                    Stop Loss: ${formatSmartPrice(result.stopLossPrice)}
                  </span>
                </div>

                {/* Line 3: Plain Dollar Potential vs Max Risk */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-mono tabular-nums">
                  <span className="text-slate-700 dark:text-slate-300">
                    Potential:{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      +${potentialRewardDollars.toFixed(2)}
                    </strong>{' '}
                    on ${safeBudget}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    Max Risk:{' '}
                    <strong className="text-rose-600 dark:text-rose-400">
                      -${riskDollars.toFixed(2)}
                    </strong>{' '}
                    ({safeRiskPct}%)
                  </span>
                </div>

                {/* Visual Green/Red Proportionality Bar */}
                <div className="pt-1 space-y-1">
                  <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                    <div
                      className="bg-rose-500 h-full"
                      style={{ width: `${Math.max(12, Math.min(50, (1 / (1 + Math.max(0.5, computedRr))) * 100))}%` }}
                      title="Risk Zone"
                    />
                    <div
                      className="bg-emerald-500 h-full flex-1"
                      title="Potential Reward Zone"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span>Support Floor: ${formatSmartPrice(result.supportLevel)}</span>
                    <span>Resistance Ceiling: ${formatSmartPrice(result.resistanceLevel)}</span>
                  </div>
                </div>
              </div>

              {/* Plain-English Summary + 3 Structural Notes */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-2.5 text-xs">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {result.plainSummary}
                </p>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                  {(result.keyObservations || []).slice(0, 3).map((obs, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-mono text-sky-600 dark:text-sky-400 font-bold shrink-0">
                        {idx + 1}.
                      </span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
                <p className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                  {result.cautionNote} Educational analysis only — always verify live price on your
                  wallet or broker before placing a Limit order.
                </p>
              </div>

              {/* Simple Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleStageToTradeDesk}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Stage Into Trade Desk</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={handleCopyTicket}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ticket Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy 3-Line Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
