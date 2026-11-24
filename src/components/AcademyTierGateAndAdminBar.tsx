import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  KeyRound,
  Lock,
  LogOut,
  Settings,
  ShieldCheck,
  Unlock,
  Video,
} from 'lucide-react';
import {
  AcademyAdminSettingsState,
  AcademyPublicGatesState,
  DEFAULT_ADVANCED_PASSCODE,
  DEFAULT_INTERMEDIATE_PASSCODE,
  PRIMARY_OWNER_ADMIN_EMAIL,
  User,
  hashAcademyPasscode,
  isBootstrapOwnerEmail,
} from '../firebase';

export type AcademyTierLevel = 'beginner' | 'intermediate' | 'advanced' | 'open_library';

export interface AcademyProgressBannerProps {
  activeTier: AcademyTierLevel;
  intermediateUnlocked: boolean;
  advancedUnlocked: boolean;
  isAdminUser: boolean;
  adminPreviewStudentGate: boolean;
  onToggleAdminPreviewStudentGate: () => void;
  onOpenAdminModal: () => void;
  onOpenLibraryChapter: () => void;
  orientationVideoUrl: string;
  orientationVideoTitle: string;
}

export const AcademyProgressBanner: React.FC<AcademyProgressBannerProps> = ({
  intermediateUnlocked,
  advancedUnlocked,
  isAdminUser,
  adminPreviewStudentGate,
  onToggleAdminPreviewStudentGate,
  onOpenAdminModal,
  onOpenLibraryChapter,
  orientationVideoUrl,
}) => {
  const effectiveIntOpen = (isAdminUser && !adminPreviewStudentGate) || intermediateUnlocked;
  const effectiveAdvOpen = (isAdminUser && !adminPreviewStudentGate) || advancedUnlocked;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3.5 flex flex-col xl:flex-row xl:items-center justify-between gap-3 text-xs">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-white">
            Progressive Mastery Path (Not a 1-2-3 Shortcut)
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
            I. Beginners: Open
          </span>
          <span aria-hidden="true">·</span>
          <span
            className={
              effectiveIntOpen
                ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                : 'text-amber-700 dark:text-amber-400 font-medium'
            }
          >
            II. Intermediate: {effectiveIntOpen ? 'Unlocked' : 'Passcode Gate'}
          </span>
          <span aria-hidden="true">·</span>
          <span
            className={
              effectiveAdvOpen
                ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                : 'text-amber-700 dark:text-amber-400 font-medium'
            }
          >
            III. Advanced: {effectiveAdvOpen ? 'Unlocked' : 'Passcode Gate'}
          </span>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={onOpenLibraryChapter}
            className="text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer whitespace-nowrap"
          >
            IV. Open Media & Document Library (Free Read) →
          </button>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Students master Open Foundations & Market Seasons (01–07) first, rehearse Charting & Fibonacci on Paper in Intermediate (08–12), and graduate to Single-Trade & 10-Set Self-Custody XRPL DEX Execution in Advanced (13–16).
          {orientationVideoUrl ? ' Includes your custom Course Orientation Video inside Open Library.' : ''}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {isAdminUser && (
          <button
            type="button"
            onClick={onToggleAdminPreviewStudentGate}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              adminPreviewStudentGate
                ? 'bg-amber-500 text-slate-950 border-amber-500'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span>
              {adminPreviewStudentGate ? 'Viewing as Student (Gates Active)' : 'Preview Student Gate'}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenAdminModal}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            isAdminUser
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
        >
          {isAdminUser ? (
            <>
              <Settings className="w-3.5 h-3.5 shrink-0" />
              <span>Admin Console (All Tiers Open)</span>
            </>
          ) : (
            <>
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span>Passcode / Admin Google Login</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export interface AcademyPasscodeGateCardProps {
  requiredTier: 'intermediate' | 'advanced';
  chapterNumber: string;
  chapterTitle: string;
  chaptersInTier: Array<{ number: string; fullTitle: string }>;
  publicGates: AcademyPublicGatesState;
  onUnlockIntermediate: () => void;
  onUnlockAdvanced: () => void;
  onOpenBeginnerStart: () => void;
  onOpenPublicLibrary: () => void;
  onOpenAdminModal: () => void;
  isAdminUser: boolean;
  adminPreviewStudentGate: boolean;
  onExitStudentPreview: () => void;
}

export const AcademyPasscodeGateCard: React.FC<AcademyPasscodeGateCardProps> = ({
  requiredTier,
  chapterNumber,
  chapterTitle,
  chaptersInTier,
  publicGates,
  onUnlockIntermediate,
  onUnlockAdvanced,
  onOpenBeginnerStart,
  onOpenPublicLibrary,
  onOpenAdminModal,
  isAdminUser,
  adminPreviewStudentGate,
  onExitStudentPreview,
}) => {
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [gateError, setGateError] = useState<string | null>(null);
  const [justUnlockedMsg, setJustUnlockedMsg] = useState<string | null>(null);

  const tierLabel = requiredTier === 'intermediate' ? 'Intermediate' : 'Advanced';

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    setGateError(null);
    const trimmed = passcodeInput.trim();
    if (!trimmed) {
      setGateError(`Please enter your ${tierLabel} cohort passcode.`);
      return;
    }

    const inputHash = hashAcademyPasscode(trimmed);

    // Advanced passcode unlocks BOTH Intermediate and Advanced so advanced students never type twice
    if (inputHash === publicGates.advancedPasscodeHash) {
      onUnlockIntermediate();
      onUnlockAdvanced();
      setJustUnlockedMsg('Advanced & Intermediate curriculum unlocked.');
      setPasscodeInput('');
      return;
    }

    if (requiredTier === 'intermediate' && inputHash === publicGates.intermediatePasscodeHash) {
      onUnlockIntermediate();
      setJustUnlockedMsg('Intermediate curriculum unlocked.');
      setPasscodeInput('');
      return;
    }

    if (requiredTier === 'advanced' && inputHash === publicGates.intermediatePasscodeHash) {
      onUnlockIntermediate();
      setGateError(
        'That passcode unlocked the Intermediate tier! Enter your Advanced cohort passcode (or sign in as Admin) to open Advanced Section ' +
          chapterNumber +
          '.'
      );
      return;
    }

    setGateError(
      `Passcode did not match the active ${tierLabel} cohort key. Check with your instructor or explore the Open Beginner & Library sections below.`
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
      {isAdminUser && adminPreviewStudentGate && (
        <div className="rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-amber-900 dark:text-amber-200 font-medium">
            Admin Student-Preview Active: You are seeing the exact passcode gate students see before unlocking {tierLabel} chapters.
          </span>
          <button
            type="button"
            onClick={onExitStudentPreview}
            className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            Resume Admin Full Access
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
            <Lock className="w-4 h-4 shrink-0" />
            <span>{tierLabel} Curriculum Passcode Gate</span>
            <span aria-hidden="true">·</span>
            <span>Section {chapterNumber}</span>
          </div>

          <h2
            className="font-editorial text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-snug"
            style={{ textWrap: 'balance' }}
          >
            {chapterNumber}. {chapterTitle}
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-[66ch]">
            Real market stewardship is <strong>not a simple 1-2-3 overnight formula</strong>. To protect students from rushing into live risk or multi-order execution before understanding market structure, Symphony Markets Academy paces training across three intentional stages: <strong>Open Beginner Foundations</strong>, <strong>Intermediate Chart & Fibonacci Risk</strong>, and <strong>Advanced 10-Set & On-Chain DEX Stewardship</strong>.
          </p>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Chapters Unlocked in {tierLabel} Tier ({chaptersInTier.length} Sections):
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
              {chaptersInTier.map((item) => (
                <li key={item.number} className="flex items-start gap-2">
                  <span className="font-mono text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                    {item.number}.
                  </span>
                  <span>{item.fullTitle}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Open-Access Escape Hatches */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onOpenBeginnerStart}
              className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Go to Module 1: Foundations (Open)
            </button>
            <button
              type="button"
              onClick={onOpenPublicLibrary}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-800 dark:text-emerald-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Open Media & Document Library (No Password) →</span>
            </button>
          </div>
        </div>

        {/* Right Column: Student Passcode Form + Separate Admin Google Sign-In */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 sm:p-6 space-y-5">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Enter {tierLabel} Student Passcode
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Enter the cohort passcode shared by your instructor to unlock all {tierLabel} sections in this browser session.
            </p>
          </div>

          <form onSubmit={handleVerifyPasscode} className="space-y-3">
            <div>
              <label
                htmlFor={`gate-passcode-${requiredTier}`}
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                {tierLabel} Access Passcode
              </label>
              <input
                id={`gate-passcode-${requiredTier}`}
                type="text"
                autoComplete="off"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder={`Enter ${tierLabel} passcode...`}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {gateError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
                {gateError}
              </p>
            )}
            {justUnlockedMsg && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                {justUnlockedMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              <Unlock className="w-4 h-4 shrink-0" />
              <span>Unlock {tierLabel} Sections</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Instructor & Admin Full Access
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Sign in with your authorized Admin Google login to unlock Beginner, Intermediate, and Advanced simultaneously and manage student passcodes.
            </p>
            <button
              type="button"
              onClick={onOpenAdminModal}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Admin Google Sign-In & Passcode Console</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export interface AcademyAdminConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  isAdminUser: boolean;
  publicGates: AcademyPublicGatesState;
  adminSettings: AcademyAdminSettingsState;
  intermediateUnlocked: boolean;
  advancedUnlocked: boolean;
  onUnlockIntermediate: () => void;
  onUnlockAdvanced: () => void;
  onLockStudentSessionGates: () => void;
  onGoogleAdminSignIn: () => Promise<void>;
  onGoogleAdminSignOut: () => Promise<void>;
  onSaveConfiguration: (draft: {
    intermediatePasscodePlain: string;
    advancedPasscodePlain: string;
    intermediateGateEnabled: boolean;
    advancedGateEnabled: boolean;
    orientationVideoUrl: string;
    orientationVideoTitle: string;
    secondaryAdminEmail: string;
  }) => Promise<void>;
  authError: string | null;
  isBusy: boolean;
}

export const AcademyAdminConsoleModal: React.FC<AcademyAdminConsoleModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isAdminUser,
  publicGates,
  adminSettings,
  intermediateUnlocked,
  advancedUnlocked,
  onUnlockIntermediate,
  onUnlockAdvanced,
  onLockStudentSessionGates,
  onGoogleAdminSignIn,
  onGoogleAdminSignOut,
  onSaveConfiguration,
  authError,
  isBusy,
}) => {
  const [quickStudentCode, setQuickStudentCode] = useState<string>('');
  const [quickCodeMsg, setQuickCodeMsg] = useState<string | null>(null);

  const [draftIntCode, setDraftIntCode] = useState<string>(
    adminSettings.intermediatePasscodeLabel || DEFAULT_INTERMEDIATE_PASSCODE
  );
  const [draftAdvCode, setDraftAdvCode] = useState<string>(
    adminSettings.advancedPasscodeLabel || DEFAULT_ADVANCED_PASSCODE
  );
  const [draftIntEnabled, setDraftIntEnabled] = useState<boolean>(
    publicGates.intermediateGateEnabled
  );
  const [draftAdvEnabled, setDraftAdvEnabled] = useState<boolean>(
    publicGates.advancedGateEnabled
  );
  const [draftVideoUrl, setDraftVideoUrl] = useState<string>(publicGates.orientationVideoUrl);
  const [draftVideoTitle, setDraftVideoTitle] = useState<string>(
    publicGates.orientationVideoTitle
  );
  const [draftSecondaryEmail, setDraftSecondaryEmail] = useState<string>(
    adminSettings.secondaryAdminEmail
  );
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [copiedCurrentHost, setCopiedCurrentHost] = useState<boolean>(false);

  React.useEffect(() => {
    setDraftIntCode(adminSettings.intermediatePasscodeLabel || DEFAULT_INTERMEDIATE_PASSCODE);
    setDraftAdvCode(adminSettings.advancedPasscodeLabel || DEFAULT_ADVANCED_PASSCODE);
    setDraftSecondaryEmail(adminSettings.secondaryAdminEmail || '');
  }, [
    adminSettings.intermediatePasscodeLabel,
    adminSettings.advancedPasscodeLabel,
    adminSettings.secondaryAdminEmail,
  ]);

  React.useEffect(() => {
    setDraftIntEnabled(publicGates.intermediateGateEnabled);
    setDraftAdvEnabled(publicGates.advancedGateEnabled);
    setDraftVideoUrl(publicGates.orientationVideoUrl);
    setDraftVideoTitle(publicGates.orientationVideoTitle);
  }, [
    publicGates.intermediateGateEnabled,
    publicGates.advancedGateEnabled,
    publicGates.orientationVideoUrl,
    publicGates.orientationVideoTitle,
  ]);

  if (!isOpen) return null;

  const handleQuickPasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = quickStudentCode.trim();
    if (!cleaned) return;
    const h = hashAcademyPasscode(cleaned);
    if (h === publicGates.advancedPasscodeHash) {
      onUnlockIntermediate();
      onUnlockAdvanced();
      setQuickCodeMsg('Unlocked both Intermediate and Advanced sections.');
      setQuickStudentCode('');
      return;
    }
    if (h === publicGates.intermediatePasscodeHash) {
      onUnlockIntermediate();
      setQuickCodeMsg('Unlocked Intermediate sections.');
      setQuickStudentCode('');
      return;
    }
    setQuickCodeMsg('Passcode did not match Intermediate or Advanced cohort keys.');
  };

  const handleAdminSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveFeedback(null);
    await onSaveConfiguration({
      intermediatePasscodePlain: draftIntCode,
      advancedPasscodePlain: draftAdvCode,
      intermediateGateEnabled: draftIntEnabled,
      advancedGateEnabled: draftAdvEnabled,
      orientationVideoUrl: draftVideoUrl,
      orientationVideoTitle: draftVideoTitle,
      secondaryAdminEmail: draftSecondaryEmail,
    });
    setSaveFeedback(
      'Saved passcodes (SHA-256 hashed), Separate Admin Google Email, and Orientation Video settings to Firestore.'
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Course Access & Instructor Admin Console"
      className="fixed inset-0 z-50 bg-slate-950/65 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 my-8 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-sky-600 dark:text-sky-400">
              Symphony Markets Academy · Progressive 3-Tier Access & Separate Admin Login
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {isAdminUser
                ? 'Instructor Admin Console (Full Curriculum Unlocked)'
                : 'Student Passcode Unlock & Admin Google Sign-In'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            Close ✕
          </button>
        </div>

        {/* Section A: Quick Student Cohort Passcode Unlock */}
        {!isAdminUser && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">
                Student Cohort Passcode Unlock
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                Intermediate: {intermediateUnlocked ? 'Unlocked' : 'Locked'} · Advanced:{' '}
                {advancedUnlocked ? 'Unlocked' : 'Locked'}
              </span>
            </div>
            <form onSubmit={handleQuickPasscodeSubmit} className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={quickStudentCode}
                onChange={(e) => setQuickStudentCode(e.target.value)}
                placeholder="Enter Intermediate or Advanced passcode..."
                className="flex-1 min-w-[210px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Unlock Tier
              </button>
              {(intermediateUnlocked || advancedUnlocked) && (
                <button
                  type="button"
                  onClick={() => {
                    onLockStudentSessionGates();
                    setQuickCodeMsg('Re-locked Intermediate & Advanced gates for this browser.');
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Lock Tiers
                </button>
              )}
            </form>
            {quickCodeMsg && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                {quickCodeMsg}
              </p>
            )}
          </div>
        )}

        {/* Section B: Admin Google Authentication (Primary Owner OR Separate Admin Google Login) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Instructor / Admin Google Sign-In
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Supports both your primary owner Google login ({PRIMARY_OWNER_ADMIN_EMAIL}) and a dedicated Separate Admin Google Login.
              </p>
            </div>

            {currentUser ? (
              <button
                type="button"
                onClick={() => void onGoogleAdminSignOut()}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Sign Out ({currentUser.email})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void onGoogleAdminSignIn()}
                disabled={isBusy}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{isBusy ? 'Connecting Google...' : 'Sign In as Admin with Google'}</span>
              </button>
            )}
          </div>

          {currentUser && !isAdminUser && (
            <div className="rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="font-semibold">
                Signed in as {currentUser.email} (Standard Student Account)
              </div>
              <p>
                To authorize <strong>{currentUser.email}</strong> as your Separate Admin Google Login, sign in once with <strong>{PRIMARY_OWNER_ADMIN_EMAIL}</strong>, paste <strong>{currentUser.email}</strong> into the “Separate Admin Google Email” box, and click Save.
              </p>
            </div>
          )}

          {authError && (
            <div className="space-y-2">
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{authError}</p>
              {authError.includes('unauthorized-domain') && typeof window !== 'undefined' && (
                <div className="rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/30 p-3 text-xs text-amber-950 dark:text-amber-200 space-y-2 leading-relaxed">
                  <div className="font-bold">
                    Quick 30-Second Fix for Your Vercel / Custom Domain:
                  </div>
                  <p>
                    Firebase protects Google Sign-In with an Authorized Domains list. Add your
                    current domain once in Firebase Console:
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-amber-300/60 dark:border-amber-500/30 font-mono text-[11px] font-semibold text-slate-900 dark:text-white">
                      {window.location.hostname}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard?.writeText) {
                          void navigator.clipboard.writeText(window.location.hostname);
                        }
                        setCopiedCurrentHost(true);
                        setTimeout(() => setCopiedCurrentHost(false), 2000);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedCurrentHost ? 'Copied!' : 'Copy Domain'}</span>
                    </button>
                    <a
                      href="https://console.firebase.google.com/project/gen-lang-client-0139446450/authentication/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-semibold"
                    >
                      <span>Open Firebase Authorized Domains</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    In Firebase Console → <strong>Authorized domains</strong> → click{' '}
                    <strong>Add domain</strong> → paste <strong>{window.location.hostname}</strong>{' '}
                    → Refresh this page. (Meanwhile, you can enter your cohort passcode in the box
                    above to unlock Module 2 &amp; 3 right away!)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section C: Full Admin Configuration Form (Visible Only When Verified Admin Is Signed In) */}
        {isAdminUser && (
          <form onSubmit={(e) => void handleAdminSave(e)} className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Verified Admin Active (
                {isBootstrapOwnerEmail(currentUser?.email)
                  ? 'Primary Owner Login'
                  : 'Authorized Separate Admin Google Login'}
                ) — Beginner, Intermediate & Advanced All Open
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Intermediate Section Passcode
                </label>
                <input
                  type="text"
                  value={draftIntCode}
                  onChange={(e) => setDraftIntCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white"
                />
                <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftIntEnabled}
                    onChange={(e) => setDraftIntEnabled(e.target.checked)}
                  />
                  <span>Require passcode for Module 2: Fibonacci &amp; Charts</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Advanced Section Passcode
                </label>
                <input
                  type="text"
                  value={draftAdvCode}
                  onChange={(e) => setDraftAdvCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white"
                />
                <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftAdvEnabled}
                    onChange={(e) => setDraftAdvEnabled(e.target.checked)}
                  />
                  <span>Require passcode for Module 3: Trade Desk &amp; Bonus Labs</span>
                </label>
              </div>
            </div>

            {/* Separate Admin Google Login Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Separate Admin Google Login Email (Optional Dedicated Admin Gmail)
              </label>
              <input
                type="email"
                value={draftSecondaryEmail}
                onChange={(e) => setDraftSecondaryEmail(e.target.value)}
                placeholder="e.g. your.separate.admin@gmail.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Stored strictly in private Admin settings (`/academyAdmin/settings`). Signing in with either {PRIMARY_OWNER_ADMIN_EMAIL} or this separate Google email unlocks full Admin access.
              </p>
            </div>

            {/* Upcoming Producer Video Slot */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Video className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>Course Orientation Video Slot (For the New Video You Are Producing)</span>
              </div>
              <input
                type="text"
                value={draftVideoTitle}
                onChange={(e) => setDraftVideoTitle(e.target.value)}
                placeholder="Orientation Video Title..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
              />
              <input
                type="url"
                value={draftVideoUrl}
                onChange={(e) => setDraftVideoUrl(e.target.value)}
                placeholder="Paste Google Drive video link or https://...mp4 when your video is ready"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
              />
            </div>

            {saveFeedback && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                {saveFeedback}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={isBusy}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isBusy ? 'Saving to Firestore...' : 'Save Passcodes, Separate Admin & Video'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
