import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Eye,
  KeyRound,
  Lock,
  Settings,
} from 'lucide-react';
import {
  ACADEMY_MODULES,
  AcademyModuleId,
  AcademyModuleMeta,
  BONUS_LABS_MODULE,
  CORE_ACADEMY_MODULES,
  WorkshopChapterId,
  buildStandaloneModuleUrl,
} from '../config/academyModules';
import { AcademyTierLevel } from './AcademyTierGateAndAdminBar';

interface AcademyCampusHubProps {
  isTierLocked: (tier: AcademyTierLevel) => boolean;
  isAdminUser: boolean;
  adminPreviewStudentGate: boolean;
  onToggleAdminPreviewStudentGate: () => void;
  onOpenAdminModal: () => void;
  onOpenModule: (moduleId: AcademyModuleId, lessonId?: WorkshopChapterId) => void;
  onOpenStandaloneModule: (moduleId: AcademyModuleId, lessonId?: WorkshopChapterId) => void;
}

export const AcademyCampusHub: React.FC<AcademyCampusHubProps> = ({
  isTierLocked,
  isAdminUser,
  adminPreviewStudentGate,
  onToggleAdminPreviewStudentGate,
  onOpenAdminModal,
  onOpenModule,
  onOpenStandaloneModule,
}) => {
  const [copiedModuleId, setCopiedModuleId] = useState<AcademyModuleId | null>(null);
  const [showBonusLabs, setShowBonusLabs] = useState<boolean>(false);

  const handleCopyStandaloneLink = (mod: AcademyModuleMeta) => {
    const shareUrl = buildStandaloneModuleUrl(mod.id);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      void navigator.clipboard.writeText(shareUrl);
    }
    setCopiedModuleId(mod.id);
    setTimeout(() => {
      setCopiedModuleId((prev) => (prev === mod.id ? null : prev));
    }, 2800);
  };

  return (
    <div className="space-y-8">
      {/* Calm Campus Header + Admin / Passcode Utility */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Symphony Markets Academy · Modular Campus · One Focused Room at a Time
          </div>
          <h1
            className="font-editorial text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight"
            style={{ textWrap: 'balance' }}
          >
            Choose a Focused Module — Or Share Its Standalone Link
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Each module opens in its own clean space without extra menus or distractions. Use{' '}
            <strong>Copy Standalone Link</strong> on any card to send students directly into that
            single room as if it were its own lightweight app.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {isAdminUser && (
            <button
              type="button"
              onClick={onToggleAdminPreviewStudentGate}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                adminPreviewStudentGate
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span>
                {adminPreviewStudentGate ? 'Viewing as Student' : 'Preview Student Gates'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAdminModal}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isAdminUser
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
            }`}
          >
            {isAdminUser ? (
              <>
                <Settings className="w-3.5 h-3.5 shrink-0" />
                <span>Admin Console (All Unlocked)</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span>Passcode / Admin Login</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* The 4 Core Focused Modules (2x2 Balanced Grid) */}
      <section aria-label="4 Core Academy Modules" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {CORE_ACADEMY_MODULES.map((mod) => {
          const locked = isTierLocked(mod.requiredTier);
          const isCopied = copiedModuleId === mod.id;

          return (
            <article
              key={mod.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-4">
                {/* Quiet Unboxed Kicker Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400">
                    <span className={`font-mono font-bold ${mod.accentTextClass}`}>
                      {mod.numberLabel}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{mod.accessLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {mod.lessons.length} {mod.lessons.length === 1 ? 'Room' : 'Tabs'}
                    </span>
                  </div>
                  {locked && (
                    <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>Passcode</span>
                    </span>
                  )}
                </div>

                {/* Title & Summary */}
                <div className="space-y-1.5">
                  <h2
                    className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug"
                    style={{ textWrap: 'balance' }}
                  >
                    {mod.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {mod.summary}
                  </p>
                </div>

                {/* Included Clean Lesson Links (Click directly into any tab) */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Inside this module:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mod.lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => onOpenModule(mod.id, lesson.id)}
                        className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {lesson.tabLabel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Row: Open Module + Standalone Direct Link */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenModule(mod.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${mod.accentButtonClass}`}
                  >
                    <span>Open {mod.numberLabel}</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenStandaloneModule(mod.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>Standalone View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyStandaloneLink(mod)}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          Link Copied
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 shrink-0" />
                        <span>Copy ?module={mod.id}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {mod.audienceNote}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Quiet Collapsible Optional Bonus Labs Strip (Tucked Out of the Way) */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowBonusLabs((v) => !v)}
          aria-expanded={showBonusLabs}
          className="w-full px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
        >
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Optional Deep-Dive</span>
              <span aria-hidden="true">·</span>
              <span>Hidden from Main 4-Module Flow to Keep Students Calm</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              Extra Labs: Live AI Market Examiner, 11-Skill Desk &amp; 24/7 DEX Architecture
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
            <span>{showBonusLabs ? 'Hide Bonus Labs' : 'Show Bonus Labs'}</span>
            {showBonusLabs ? (
              <ChevronUp className="w-4 h-4 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 shrink-0" />
            )}
          </span>
        </button>

        {showBonusLabs && (
          <div className="px-6 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                {BONUS_LABS_MODULE.summary}
              </p>
              <div className="flex flex-wrap gap-2">
                {BONUS_LABS_MODULE.lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => onOpenModule('bonus-labs', lesson.id)}
                    className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {lesson.tabLabel} →
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenStandaloneModule('bonus-labs')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>Standalone View</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopyStandaloneLink(BONUS_LABS_MODULE)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedModuleId === 'bonus-labs' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      Link Copied
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 shrink-0" />
                    <span>Copy ?module=bonus-labs</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Quick Standalone Link Reference Cheat Sheet for the Instructor */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-5 space-y-2.5">
        <div className="text-xs font-bold text-slate-900 dark:text-white">
          Instructor Direct-Link Directory (Each Link Opens Only That Module With Its Own Clean Header)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          {ACADEMY_MODULES.filter((m) => m.isCoreModule).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleCopyStandaloneLink(m)}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-400 text-left transition-colors cursor-pointer"
            >
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">
                ?module={m.id}
              </span>
              <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 whitespace-nowrap shrink-0">
                {copiedModuleId === m.id ? '✓ Copied' : 'Copy'}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
