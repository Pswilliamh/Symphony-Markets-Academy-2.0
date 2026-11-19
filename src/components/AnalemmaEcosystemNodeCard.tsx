import React, { useState } from 'react';
import { ArrowRight, Check, Copy, Cpu, ExternalLink, Layers, Sparkles } from 'lucide-react';
import { PublicPageTab } from './LandingPageView';

interface AnalemmaEcosystemNodeCardProps {
  onNavigatePage: (page: PublicPageTab) => void;
  onEnterApp: (targetSectionId?: string) => void;
}

export const AnalemmaEcosystemNodeCard: React.FC<AnalemmaEcosystemNodeCardProps> = ({
  onNavigatePage,
  onEnterApp,
}) => {
  const [copiedMode, setCopiedMode] = useState<'url' | 'embed' | null>(null);

  const liveNodeUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://symphony-markets.app';

  const resumeEmbedSnippet = `<iframe src="${liveNodeUrl}" title="Symphony Markets Academy — Analemma Ventures Systems Knowledge Engineering Simulator" width="100%" height="720" style="border:1px solid rgba(56,189,248,0.3);border-radius:12px;" loading="lazy"></iframe>`;

  const handleCopy = async (mode: 'url' | 'embed') => {
    const text = mode === 'url' ? liveNodeUrl : resumeEmbedSnippet;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMode(mode);
      window.setTimeout(() => setCopiedMode(null), 2500);
    } catch {
      setCopiedMode(mode);
      window.setTimeout(() => setCopiedMode(null), 2500);
    }
  };

  return (
    <section className="rounded-xl border border-sky-300/60 dark:border-sky-500/30 bg-gradient-to-br from-slate-50 via-white to-amber-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-sky-700 dark:text-sky-400">
            <Cpu className="w-3.5 h-3.5 shrink-0" />
            <span>Analemma Ventures Ecosystem</span>
            <span aria-hidden="true">·</span>
            <span>Systems Knowledge Engineering Proof-of-Concept</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-700 dark:text-amber-400">
              Digital Visual Resume Pro 1.0 Ready
            </span>
          </div>
          <h2 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Turning Complex Financial Mechanics Into Zero-Intimidation Visual Architecture
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Within the broader <strong>Analemma Ventures</strong> portfolio,{' '}
            <strong>Symphony Markets Academy</strong> operates as a live educational flagship for{' '}
            <strong>Systems Knowledge Engineering</strong>—translating institutional market math
            into calm, verifiable visual models that partners, educators, and sponsors can test
            firsthand or embed directly inside <strong>Digital Visual Resume Pro 1.0</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void handleCopy('url')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            {copiedMode === 'url' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Copied Node Link</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>Copy Live Node Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => void handleCopy('embed')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {copiedMode === 'embed' ? (
              <>
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Copied Visual Resume Embed</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 shrink-0" />
                <span>Copy Digital Visual Resume Pro 1.0 Embed</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Systems Knowledge Engineering Visual Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <div className="font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400">
              NODE 01 · x · y = k AMM MATH
            </div>
            <strong className="block text-slate-900 dark:text-white">
              Transparent Liquidity & Sub-Penny Rails
            </strong>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Visualizes Automated Market Maker constant-product pools, bps spread friction, and
              $5 XRPL/Stellar self-custody reserves without middlemen.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onEnterApp('ai-dex-lab')}
            className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
          >
            <span>Test AMM DEX Node</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <div className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              NODE 02 · 1:2 RISK GEOMETRY
            </div>
            <strong className="block text-slate-900 dark:text-white">
              10-Cent Safety Net & 10-Set Sequencer
            </strong>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Demonstrates asymmetric 2% position sizing ($0.10 = 1R) across 2,500 Monte Carlo
              paths and 10-trade statistical batches.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onEnterApp('ten-set-auto-trader')}
            className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            <span>Launch 10-Set Lab</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <div className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
              NODE 03 · CRYSTALLINE RWA
            </div>
            <strong className="block text-slate-900 dark:text-white">
              Open-Source Abundance Columns
            </strong>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Replaces opaque steel-vault claims with illuminated crystalline proof-of-reserve
              columns connected 1:1 to XRPL TrustSet gates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigatePage('ksbc')}
            className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
          >
            <span>Open KSBC Crystalline RWA</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <div className="font-mono text-[11px] font-bold text-purple-600 dark:text-purple-400">
              NODE 04 · EMOTIONAL REGULATION
            </div>
            <strong className="block text-slate-900 dark:text-white">
              Candlestick Symphony & 16-Yr Cycle GPS
            </strong>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Transforms market volatility into Concert Harp & Cello intervals alongside a 2012–2028
              4-year cycle compass to defeat panic-selling.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigatePage('symphony')}
              className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
            >
              <span>♪ Music</span>
            </button>
            <span className="text-slate-400">·</span>
            <button
              type="button"
              onClick={() => onNavigatePage('cycles')}
              className="inline-flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
            >
              <span>Cycle GPS →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Presentation & Digital Visual Resume Pro 1.0 Integration Bar */}
      <div className="p-3.5 rounded-lg bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          <span>
            <strong>Live Presentation Node:</strong> Designed for seamless live demonstration inside{' '}
            <span className="font-mono font-semibold text-slate-900 dark:text-white">
              Digital Visual Resume Pro 1.0
            </span>{' '}
            for educators, sponsors, and institutional reviewers.
          </span>
        </div>
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>100% Non-Custodial · Open Math</span>
        </span>
      </div>
    </section>
  );
};
