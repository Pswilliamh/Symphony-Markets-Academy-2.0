import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  KeyRound,
  Lock,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface XRayHotspot {
  id: 'fake_yield' | 'fake_stop' | 'seed_phish' | 'withdrawal_trap';
  pinNumber: string;
  shortLabel: string;
  scamElementTitle: string;
  howTheTrapWorks: string;
  whyPeopleFallForIt: string;
  noScamZoneStandard: string;
}

const XRAY_HOTSPOTS: XRayHotspot[] = [
  {
    id: 'fake_yield',
    pinNumber: '01',
    shortLabel: '01 · Guaranteed Daily Yield Meter',
    scamElementTitle: 'Trap 01: “Guaranteed +3.4% Daily AI Bot Return” Banner',
    howTheTrapWorks:
      'Scam websites paint a smooth, ever-rising profit counter on your screen using simple JavaScript math—not real market trades. Early tiny withdrawals are sometimes paid from newer victims’ deposits to hook you into depositing thousands more.',
    whyPeopleFallForIt:
      'Seeing a green balance tick upward every single hour triggers excitement and false trust before a beginner realizes no real exchange trade ever happened.',
    noScamZoneStandard:
      'Real markets move up and down every day—nobody on earth can guarantee daily percentage profits. Symphony Markets Academy shows real live volatility, losses as well as gains, and teaches disciplined 2% risk sizing.',
  },
  {
    id: 'fake_stop',
    pinNumber: '02',
    shortLabel: '02 · Fake “Stop Trading” Button',
    scamElementTitle: 'Trap 02: Deceptive “STOP TRADING / PROTECT FUNDS” Button',
    howTheTrapWorks:
      'The exact scam that inspired Symphony Markets Academy: a sleek button on a fake broker dashboard that claims to halt trading and protect your balance, while in reality your deposit was stolen the moment you sent it.',
    whyPeopleFallForIt:
      'Beginners feel safe when they see a big emergency brake button on a professional-looking dashboard, assuming regulators verify every website.',
    noScamZoneStandard:
      'True protection never comes from a custodial website button. It comes from holding coins in your own self-custody wallet and placing verifiable on-chain limit/stop rules whose open-source math you can audit on GitHub.',
  },
  {
    id: 'seed_phish',
    pinNumber: '03',
    shortLabel: '03 · 12-Word Secret Phrase Box',
    scamElementTitle: 'Trap 03: “Verify / Sync Your 12-Word Recovery Phrase” Popup',
    howTheTrapWorks:
      'Phishing sites, fake customer-support chats, and fake airdrop pages ask you to type your 12- or 24-word secret recovery phrase to “sync your wallet,” “claim rewards,” or “fix a stuck transaction.”',
    whyPeopleFallForIt:
      'It looks like a normal login or verification form, and scammers create artificial urgency (“Your wallet will be restricted in 15 minutes”).',
    noScamZoneStandard:
      'Your 12/24-word phrase IS the master key to all your funds—never type it into any website or share it with anyone. Symphony Markets Academy only ever reads Public Receive Addresses (starting with r... or G...), which are 100% read-only.',
  },
  {
    id: 'withdrawal_trap',
    pinNumber: '04',
    shortLabel: '04 · “Pay Fee to Withdraw” Lock',
    scamElementTitle: 'Trap 04: “Deposit $250 Tax / Gas Fee to Unlock Withdrawal”',
    howTheTrapWorks:
      'After showing fake profits (for example turning $200 into “$6,400” on screen), the scam platform blocks your withdrawal and demands an upfront external payment for “liquidity tax,” “AML clearance,” or “VIP gas.”',
    whyPeopleFallForIt:
      'Victims feel so close to receiving the large displayed balance that they send good money after bad trying to unlock it.',
    noScamZoneStandard:
      'Legitimate blockchains never ask you to wire extra money to a company to unlock your own wallet. On Stellar (XLM) and XRP Ledger (XRP), network fees are fractions of a penny (~$0.00005) deducted automatically on-chain.',
  },
];

export const ScamScreenXRayInspector: React.FC = () => {
  const [selectedId, setSelectedId] = useState<XRayHotspot['id']>('fake_stop');

  const activeSpot =
    XRAY_HOTSPOTS.find((item) => item.id === selectedId) ?? XRAY_HOTSPOTS[1];

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <Eye className="w-4 h-4 shrink-0" />
            <span>Interactive Visual Scam X-Ray · Learn to Spot Deception in 5 Seconds</span>
          </div>
          <h3 className="font-editorial text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Anatomy of a Deceptive Crypto Website vs. The No-Scam Zone
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Click any numbered red warning pin (<strong>01</strong>–<strong>04</strong>) on the simulated scam screen below to X-ray how fraudulent trading platforms trick beginners—and see the exact honest rule that protects you.
          </p>
        </div>

        {/* Pin Selector Strip */}
        <div className="flex flex-wrap items-center gap-1.5">
          {XRAY_HOTSPOTS.map((spot) => {
            const isSelected = spot.id === selectedId;
            return (
              <button
                key={spot.id}
                type="button"
                onClick={() => setSelectedId(spot.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-rose-400'
                }`}
              >
                Pin {spot.pinNumber}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split: Left = Visual X-Ray Mock Scam Screen, Right = Detailed Word-by-Word Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 6 Cols: Simulated Scam Interface Under X-Ray */}
        <div className="lg:col-span-6 rounded-xl border border-rose-500/35 bg-slate-950 text-slate-100 p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800 text-[11px] font-mono text-rose-400">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              SIMULATED SCAM SITE SPECIMEN (DO NOT TRUST SITES LIKE THIS)
            </span>
            <span>X-RAY ACTIVE</span>
          </div>

          <div className="space-y-3 my-auto">
            {/* Hotspot 01: Fake Guaranteed Yield Meter */}
            <button
              type="button"
              onClick={() => setSelectedId('fake_yield')}
              className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                selectedId === 'fake_yield'
                  ? 'bg-rose-500/20 border-rose-400'
                  : 'bg-slate-900/90 border-slate-800 hover:border-rose-500/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-white">
                    “VIP Quantum AI Auto-Bot: +3.4% Guaranteed Every Day!”
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                    Fake Displayed Profit: $500.00 → “$6,420.00” (Rigged Counter)
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-xs font-bold shrink-0">
                01
              </span>
            </button>

            {/* Hotspot 02: Fake "STOP TRADING" Emergency Button */}
            <button
              type="button"
              onClick={() => setSelectedId('fake_stop')}
              className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                selectedId === 'fake_stop'
                  ? 'bg-rose-500/20 border-rose-400'
                  : 'bg-slate-900/90 border-slate-800 hover:border-rose-500/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-white">
                    [ STOP TRADING — INSTANT CAPITAL PROTECTION ]
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Unwired decoy button—clicks do nothing while deposits are drained
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-xs font-bold shrink-0">
                02
              </span>
            </button>

            {/* Hotspot 03: 12-Word Secret Phrase Phishing Input */}
            <button
              type="button"
              onClick={() => setSelectedId('seed_phish')}
              className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                selectedId === 'seed_phish'
                  ? 'bg-rose-500/20 border-rose-400'
                  : 'bg-slate-900/90 border-slate-800 hover:border-rose-500/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-white">
                    “Enter Your 12-Word Secret Recovery Phrase to Sync Wallet”
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    [ word1  word2  word3 ... ] ← Instant full-wallet theft trap
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-xs font-bold shrink-0">
                03
              </span>
            </button>

            {/* Hotspot 04: Advance-Fee Withdrawal Lock */}
            <button
              type="button"
              onClick={() => setSelectedId('withdrawal_trap')}
              className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                selectedId === 'withdrawal_trap'
                  ? 'bg-rose-500/20 border-rose-400'
                  : 'bg-slate-900/90 border-slate-800 hover:border-rose-500/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-white">
                    “Withdrawal Frozen: Deposit $250 Fee to Release Funds”
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Classic advance-fee extortion—never send extra money to unlock funds
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-xs font-bold shrink-0">
                04
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            Click any row above (01–04) to read the full explanation on the right.
          </div>
        </div>

        {/* Right 6 Cols: Full Detailed Explanation + No-Scam Zone Antidote */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                X-RAY INSPECTION · PIN {activeSpot.pinNumber}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {activeSpot.shortLabel}
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {activeSpot.scamElementTitle}
              </h4>
              <div className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  <strong className="text-rose-700 dark:text-rose-400">
                    How the Deception Works:
                  </strong>{' '}
                  {activeSpot.howTheTrapWorks}
                </p>
                <p>
                  <strong className="text-slate-900 dark:text-white">
                    Why Good People Get Caught:
                  </strong>{' '}
                  {activeSpot.whyPeopleFallForIt}
                </p>
              </div>
            </div>
          </div>

          {/* Green Shield Box: Symphony Markets Academy No-Scam Zone Antidote */}
          <div className="p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Symphony Markets Academy No-Scam Zone Protection</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {activeSpot.noScamZoneStandard}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
