import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Coins,
  Compass,
  Landmark,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { AssetSymbol } from '../types/market';

export type HistoryCoinKey = 'BTC' | 'XRP' | 'XLM' | 'KSBC';

interface CoinHistoryAndFoundersModuleProps {
  btcLivePrice: number;
  xrpLivePrice: number;
  xlmLivePrice: number;
  onSelectSymbolAndTrain?: (symbol: AssetSymbol, targetSectionId?: string) => void;
  onOpenKsbcGoldLedger?: () => void;
}

interface FounderBio {
  name: string;
  role: string;
  contribution: string;
}

interface CoinHistoryProfile {
  key: HistoryCoinKey;
  ticker: string;
  fullName: string;
  launchYear: string;
  genesisDate: string;
  tagline: string;
  accentColorHex: string;
  badgeClass: string;
  whatItRepresents: string;
  whyStudentsTrainWithIt: string;
  supplyAndScarcity: string;
  speedAndFee: string;
  smallestUnitLesson: string;
  founders: FounderBio[];
  historicalMilestones: Array<{ year: string; event: string }>;
  trainSymbol?: AssetSymbol;
}

const COIN_PROFILES: CoinHistoryProfile[] = [
  {
    key: 'BTC',
    ticker: 'BTC',
    fullName: 'Bitcoin — Digital Gold & Sovereign Scarce Reserve',
    launchYear: '2008 / 2009',
    genesisDate: 'Oct 31, 2008 Whitepaper · Jan 3, 2009 Genesis Block',
    tagline: 'Peer-to-Peer Electronic Cash & The 21-Million Hard-Cap Anchor of the 4-Year Cycle',
    accentColorHex: '#F59E0B',
    badgeClass: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
    whatItRepresents:
      'Bitcoin represents mathematical digital scarcity and monetary sovereignty. Created in response to the 2008 global banking bailouts, Bitcoin proved for the first time in human history that two people anywhere on Earth could hold and transfer scarce digital value without trusting a central bank or middleman—governed by an unbreakable 21,000,000 BTC supply cap and the 4-Year Halving clock.',
    whyStudentsTrainWithIt:
      'Students often think they need $90,000+ to buy Bitcoin—which is a myth! Every 1 BTC is divisible into 100,000,000 Satoshis ("sats"). That means a $5.00 training budget buys over 5,000 real Satoshis in self-custody, letting students train with the exact macro bellwether that drives the entire crypto market.',
    supplyAndScarcity:
      '21,000,000 BTC maximum supply forever. Block reward cuts in half every 210,000 blocks (~4 years): 50 → 25 → 12.5 → 6.25 → 3.125 BTC (April 2024 Halving).',
    speedAndFee:
      '~10 minutes per L1 block (~$0.50–$2.50 on-chain fee; sub-penny on Lightning Network). Zero Base Reserve lock on native bc1... SegWit addresses.',
    smallestUnitLesson:
      '1 BTC = 100,000,000 Satoshis (0.00000001 BTC). With $5.00, you manage ~0.000055 BTC (~5,500 sats) using our 2% ($0.10) risk rule.',
    founders: [
      {
        name: 'Satoshi Nakamoto',
        role: 'Pseudonymous Creator & Protocol Architect (2008–2010)',
        contribution:
          'Published the 9-page "Bitcoin: A Peer-to-Peer Electronic Cash System" whitepaper on October 31, 2008, mined Block #0 on January 3, 2009 with the embedded London Times bank-bailout headline, and stepped away in April 2011—leaving his ~1.1M BTC untouched forever so Bitcoin would have no ruler.',
      },
      {
        name: 'Hal Finney (1956–2014)',
        role: 'Cryptographic Pioneer & First Transaction Recipient',
        contribution:
          'Creator of Reusable Proof-of-Work (RPOW, 2004), first person after Satoshi to run the Bitcoin software (tweeting "Running bitcoin" on Jan 10, 2009), and recipient of the very first 10 BTC transaction in Block #170 on January 12, 2009.',
      },
      {
        name: 'Adam Back, Nick Szabo & Wei Dai',
        role: 'Cypherpunk Predecessors Cited in the Bitcoin Blueprint',
        contribution:
          'Developed the foundational building blocks Satoshi combined: Adam Back invented Hashcash proof-of-work (1997), Wei Dai proposed b-money (1998), and Nick Szabo designed Bit Gold and coined the term "Smart Contracts."',
      },
    ],
    historicalMilestones: [
      {
        year: 'Oct 31, 2008',
        event: 'Satoshi Nakamoto publishes the Bitcoin whitepaper on the Cryptography Mailing List.',
      },
      {
        year: 'Jan 3, 2009',
        event: 'Genesis Block #0 mined: "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks."',
      },
      {
        year: 'May 22, 2010',
        event: 'Bitcoin Pizza Day: Laszlo Hanyecz pays 10,000 BTC for two pizzas—first real-world goods transaction.',
      },
      {
        year: '2012 · 2016 · 2020 · 2024',
        event: 'Four historic Bitcoin Halvings establish the 4-Year Market Cycle GPS taught across Symphony Markets Academy.',
      },
    ],
    trainSymbol: 'BTCUSDT',
  },
  {
    key: 'XRP',
    ticker: 'XRP',
    fullName: 'XRP & The XRP Ledger (XRPL) — High-Speed Global Settlement & Native DEX',
    launchYear: '2011 – 2012',
    genesisDate: 'Engineered 2011 · XRPL Mainnet Launched June 2012',
    tagline: '3–5 Second Global Value Transfer, Sub-Penny Fees & The First Built-In Layer-1 DEX',
    accentColorHex: '#0EA5E9',
    badgeClass: 'text-sky-700 dark:text-sky-400 bg-sky-500/10 border-sky-500/30',
    whatItRepresents:
      'XRP represents high-speed, energy-efficient global settlement and bridge liquidity. Recognizing that proof-of-work mining consumed massive electricity and took 10+ minutes to settle, XRPL’s creators engineered a Federated Consensus Ledger that settles cross-border payments and decentralized orderbook trades in 3 to 5 seconds for ~$0.0001.',
    whyStudentsTrainWithIt:
      'Because XRPL fees are a fraction of a penny (~0.00001 XRP burned per transaction) and the XRP Ledger has a built-in Central Limit Order Book (CLOB) + Automated Market Maker (XLS-30 AMM) right on Layer 1, a student with $5–$6 in Xaman or Trust Wallet can practice real non-custodial limit orders without losing money to gas fees.',
    supplyAndScarcity:
      '100,000,000,000 XRP pre-created at Genesis (zero inflation). A tiny fraction of XRP (drops) is permanently burned on every transaction to prevent ledger spam.',
    speedAndFee:
      '3–5 second finality · ~$0.0001 transaction fee · 1 XRP Base Reserve (reduced from 20 → 10 → 1 XRP in Dec 2024) + 0.2 XRP per Trustline.',
    smallestUnitLesson:
      '1 XRP = 1,000,000 Drops. Personal r... wallets in Xaman or Trust Wallet require NO Destination Tag when sending to yourself—tags are only for shared exchange accounts.',
    founders: [
      {
        name: 'David Schwartz ("JoelKatz")',
        role: 'Co-Creator of the XRP Ledger & Chief Cryptographer',
        contribution:
          'Enterprise cryptographer who co-designed the XRPL consensus mechanism, native Layer-1 decentralized exchange (DEX), pathfinding engine, and XLS-30 Automated Market Maker architecture.',
      },
      {
        name: 'Arthur Britto & Jed McCaleb',
        role: 'Co-Creators of the XRP Ledger (2011–2012)',
        contribution:
          'Initiated development of a consensus ledger in 2011 that replaced mining with validator agreement, launching the XRP Ledger in June 2012 alongside David Schwartz.',
      },
      {
        name: 'Chris Larsen',
        role: 'Fintech Pioneer & Co-Founder of OpenCoin / Ripple (Sept 2012)',
        contribution:
          'Co-founder of E-Loan and Prosper who joined the XRPL architects in September 2012 to build institutional cross-border payment corridors and enterprise treasury infrastructure.',
      },
    ],
    historicalMilestones: [
      {
        year: 'June 2012',
        event: 'XRP Ledger goes live with the world’s first built-in Layer-1 Decentralized Exchange (CLOB).',
      },
      {
        year: 'July 13, 2023',
        event: 'Landmark U.S. Federal Court ruling confirms programmatic XRP sales on public exchanges are not securities.',
      },
      {
        year: 'March & Dec 2024',
        event: 'Native XLS-30 AMM Liquidity Pools go live on XRPL, and Base Reserve drops from 10 XRP down to just 1 XRP.',
      },
    ],
    trainSymbol: 'XRPUSDT',
  },
  {
    key: 'XLM',
    ticker: 'XLM',
    fullName: 'Stellar Lumens (XLM) — Human-Scale Financial Inclusion & Anchor Rails',
    launchYear: '2014',
    genesisDate: 'Launched July 31, 2014 via the Non-Profit Stellar Development Foundation',
    tagline: 'Connecting Everyday Families, Cash-to-Crypto Anchors & Global Remittances',
    accentColorHex: '#10B981',
    badgeClass: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    whatItRepresents:
      'Stellar (XLM) represents open-access financial inclusion for individuals and families worldwide—especially the unbanked. Guided by a non-profit mandate, Stellar connects local currencies, cash ramps (like MoneyGram locations), USDC stablecoins, and real-world assets on a single sub-penny decentralized exchange (SDEX).',
    whyStudentsTrainWithIt:
      'At ~$0.14–$0.42 per coin and a network fee of 0.00001 XLM (100 Stroops = 1/1000th of a cent), a $5.00 student wallet holds 12 to 35+ whole XLM coins. That makes position-sizing math, 2% stop-losses, and 1:2 profit targets remarkably intuitive to see and practice.',
    supplyAndScarcity:
      '50,000,000,000 XLM fixed maximum supply (after the Stellar community voted in Nov 2019 to permanently burn 55 billion XLM and end all protocol inflation).',
    speedAndFee:
      '~3–5 second ledger close · ~0.00001 XLM fee · 1 XLM Base Reserve for G... public accounts.',
    smallestUnitLesson:
      '1 XLM = 10,000,000 Stroops. Stellar addresses start with capital G... and allow atomic multi-currency path payments across the built-in SDEX.',
    founders: [
      {
        name: 'Jed McCaleb & Joyce Kim',
        role: 'Co-Founders of the Stellar Network & Stellar Development Foundation (2014)',
        contribution:
          'Founded Stellar in July 2014 as an open-source, non-profit public infrastructure focused on human-scale cross-border payments and financial access for developing economies.',
      },
      {
        name: 'Prof. David Mazières',
        role: 'Chief Scientist & Author of the Stellar Consensus Protocol (SCP)',
        contribution:
          'Stanford Computer Science Professor who authored the Federated Byzantine Agreement (FBA) / Stellar Consensus Protocol whitepaper in 2015—enabling provably safe decentralized consensus without energy mining.',
      },
      {
        name: 'Denelle Dixon',
        role: 'CEO & Executive Director, Stellar Development Foundation',
        contribution:
          'Former Mozilla COO who led Stellar’s expansion into global humanitarian aid disbursements (UNHCR), MoneyGram cash-to-USDC anchors in 180+ countries, and Soroban smart contracts.',
      },
    ],
    historicalMilestones: [
      {
        year: 'July 2014 / 2015',
        event: 'Stellar launches with non-profit SDF charter and upgrades to the Stanford-authored Stellar Consensus Protocol (SCP).',
      },
      {
        year: 'November 2019',
        event: '55 Billion XLM permanently burned—fixing total supply at 50 Billion XLM with zero future inflation.',
      },
      {
        year: '2022 – 2026',
        event: 'Global cash-to-crypto anchors, UNHCR humanitarian aid rails, and Soroban smart contracts go live on Stellar Mainnet.',
      },
    ],
    trainSymbol: 'XLMUSDT',
  },
  {
    key: 'KSBC',
    ticker: 'KSBC',
    fullName: 'KSBC Gold (Kingdom Symphony Bible Coin) — Crystalline Real-World Asset Standard',
    launchYear: '2024 – 2026 RWA Era',
    genesisDate: 'Crystalline RWA Architecture · Active Gold Ledger Training Launching Now',
    tagline: 'Open Source Abundance: 999.9 Gold in Transparent Crystalline Columns on Public Ledger Rails',
    accentColorHex: '#D97706',
    badgeClass: 'text-amber-800 dark:text-amber-300 bg-amber-500/15 border-amber-500/40',
    whatItRepresents:
      'KSBC (Kingdom Symphony Bible Coin) represents the union of tangible Real-World Asset (RWA) gold stewardship, transparent on-chain verification, and the "No-Scam Zone" ethic. Instead of hiding wealth behind closed steel vaults or 440 Hz fear-based hype, KSBC symbolizes Open Source Abundance—encasing physical 999.9 fine gold reserves in illuminated crystalline columns wired 1:1 to public XRPL and Stellar ledger proofs.',
    whyStudentsTrainWithIt:
      'As KSBC transitions into an active Real-World Asset training coin on our Gold Ledger, students learn how real physical commodities (grams and troy ounces of 999.9 gold) are tokenized via XRPL/Stellar Trustlines, backed by conservative equity cushions (40%+ safety buffer), and traded on open-source x · y = k Automated Market Makers.',
    supplyAndScarcity:
      '100% Reserve-Backed RWA Architecture: Every KSBC Gold Ledger unit maps directly to verifiable physical gold weight (1/100th gram or 1/100th troy oz tiers) with zero unbacked minting.',
    speedAndFee:
      'Powered by XRPL & Stellar RWA Trustline rails (3–5 second settlement, ~$0.0001 network fee, 0.2 XRP / 0.5 XLM opt-in Trustline spam shield).',
    smallestUnitLesson:
      'Teaches the difference between casino futures leverage (where a 5% dip wipes out 20x debt) and Crystalline RWA Stewardship (where visible gold equity cushions protect families).',
    founders: [
      {
        name: 'William Hardrick, DQP-KS',
        role: 'Founder & Systems Knowledge Architect · Analemma Ventures & Symphony Markets Academy',
        contribution:
          'Spiritual Sciences Pneumatology Researcher (DQP-KS) and author of "Quantum Analemma A.I. Technology Cycle" & "The Sovereign Mind & The Honest Market." Created Symphony Markets Academy and the KSBC Crystalline Gold RWA blueprint after witnessing predatory "stop-trading" scams harm everyday beginners—building a 100% free, non-custodial sanctuary grounded in 432 Hz / 528 Hz emotional regulation and mathematical discipline.',
      },
      {
        name: 'Analemma Ventures & Symphony Classroom Community',
        role: 'Open-Source Educators, Students & Self-Custody Stewards',
        contribution:
          'Advancing ethical Systems Knowledge Engineering across XRPL, Stellar, Bitcoin, and Real-World Asset (RWA) Gold Ledgers—“learning how to manage and understand what the system is doing.”',
      },
    ],
    historicalMilestones: [
      {
        year: 'Origin Mission',
        event: 'Born as the direct antidote to rigged custodial platforms—establishing the 4 Pillars: Sovereign Breath (Pneuma), Sacred Geometry of Risk, AI as a Shield, and Radical Ethics.',
      },
      {
        year: 'Crystalline RWA Shift',
        event: 'Replaced closed steel vault imagery with transparent crystalline columns symbolizing 100% visible, verifiable Open Source Abundance.',
      },
      {
        year: 'Active RWA Gold Ledger',
        event: 'Activating live KSBC Real-World Asset Gold Ledger training so students can practice Trustline verification, gold-backed AMM liquidity, and 1x Spot stewardship.',
      },
    ],
  },
];

export const CoinHistoryAndFoundersModule: React.FC<CoinHistoryAndFoundersModuleProps> = ({
  btcLivePrice = 91450,
  xrpLivePrice = 2.42,
  xlmLivePrice = 0.415,
  onSelectSymbolAndTrain,
  onOpenKsbcGoldLedger,
}) => {
  const [selectedCoin, setSelectedCoin] = useState<HistoryCoinKey>('BTC');

  const activeProfile =
    COIN_PROFILES.find((c) => c.key === selectedCoin) ?? COIN_PROFILES[0];

  const getLivePriceLabel = (key: HistoryCoinKey) => {
    if (key === 'BTC') {
      return `$${(btcLivePrice || 91450).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    if (key === 'XRP') return `$${(xrpLivePrice || 2.42).toFixed(4)}`;
    if (key === 'XLM') return `$${(xlmLivePrice || 0.415).toFixed(4)}`;
    return 'RWA Gold Ledger ($2,650/oz Ref)';
  };

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Landmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Origins, Purpose & Architects</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-sky-600 dark:text-sky-400">
              BTC · XRP · XLM · KSBC Gold RWA
            </span>
          </div>
          <h2 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            History of Our Coins: What They Represent & Their Founders
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Before trading any asset, wise stewards understand <strong>why it was built</strong>, <strong>who architected its ledger</strong>, and <strong>what problem it solves</strong>. Select any of our 4 classroom coins below to explore its founders, history, and live training role.
          </p>
        </div>

        {/* 4-Coin Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
          {COIN_PROFILES.map((coin) => {
            const isSelected = coin.key === selectedCoin;
            return (
              <button
                key={coin.key}
                type="button"
                onClick={() => setSelectedCoin(coin.key)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {coin.ticker} · {coin.key === 'KSBC' ? 'KSBC Gold' : getLivePriceLabel(coin.key)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual 2008 -> 2026 Historical Lineage Timeline SVG */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 sm:p-5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-white">
            Visual Lineage: How Our 4 Classroom Coins Connect Across History (Click Any Era Node)
          </span>
          <span className="font-mono text-amber-300">
            2008 Scarcity → 2012 High-Speed DEX → 2014 Global Inclusion → 2026 Crystalline RWA Gold
          </span>
        </div>

        <svg
          viewBox="0 0 920 118"
          className="w-full h-auto"
          role="img"
          aria-label="Historical timeline connecting Bitcoin 2008, XRP Ledger 2012, Stellar 2014, and KSBC Gold RWA 2026"
        >
          {/* Connecting Horizontal Line */}
          <line
            x1="95"
            y1="52"
            x2="825"
            y2="52"
            stroke="#334155"
            strokeWidth="3"
            strokeDasharray="6 4"
          />

          {COIN_PROFILES.map((c, idx) => {
            const x = 115 + idx * 230;
            const active = c.key === selectedCoin;
            return (
              <g
                key={c.key}
                className="cursor-pointer"
                onClick={() => setSelectedCoin(c.key)}
              >
                <rect
                  x={x - 95}
                  y="12"
                  width="190"
                  height="88"
                  rx="10"
                  fill={active ? '#1E293B' : '#0F172A'}
                  stroke={active ? c.accentColorHex : '#334155'}
                  strokeWidth={active ? '2.2' : '1'}
                />
                <circle
                  cx={x}
                  cy="34"
                  r="11"
                  fill={c.accentColorHex}
                  fillOpacity={active ? '1' : '0.8'}
                />
                <text
                  x={x}
                  y="38"
                  textAnchor="middle"
                  fill="#0F172A"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {c.ticker}
                </text>
                <text
                  x={x}
                  y="60"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {c.launchYear} · {c.ticker}
                </text>
                <text
                  x={x}
                  y="76"
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {c.key === 'BTC'
                    ? 'Satoshi Nakamoto · 21M Cap'
                    : c.key === 'XRP'
                    ? 'Schwartz, McCaleb, Britto'
                    : c.key === 'XLM'
                    ? 'McCaleb, Kim, Mazières'
                    : 'William Hardrick, DQP-KS'}
                </text>
                <text
                  x={x}
                  y="91"
                  textAnchor="middle"
                  fill={c.accentColorHex}
                  fontSize="8.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {getLivePriceLabel(c.key)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Coin Spotlight Card */}
      <div className="rounded-xl border-2 border-sky-400/60 dark:border-sky-500/40 bg-slate-50/60 dark:bg-slate-950 p-5 sm:p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`px-2.5 py-0.5 rounded-md border font-mono font-bold ${activeProfile.badgeClass}`}
              >
                {activeProfile.ticker} · {activeProfile.launchYear}
              </span>
              <span className="font-mono text-slate-500 dark:text-slate-400">
                {activeProfile.genesisDate}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                Live: {getLivePriceLabel(activeProfile.key)}
              </span>
            </div>
            <h3 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {activeProfile.fullName}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-sky-700 dark:text-sky-400">
              {activeProfile.tagline}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeProfile.trainSymbol && onSelectSymbolAndTrain ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    onSelectSymbolAndTrain(
                      activeProfile.trainSymbol!,
                      'ten-set-auto-trader'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Train 10-Set Sequencer with {activeProfile.ticker} →
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSelectSymbolAndTrain(activeProfile.trainSymbol!, 'risk-chart')
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Open Live {activeProfile.ticker} Chart</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              onOpenKsbcGoldLedger && (
                <button
                  type="button"
                  onClick={onOpenKsbcGoldLedger}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Open Active KSBC Gold RWA Ledger Desk →</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* 2-Column Core Meaning + Why Students Train With It */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Compass className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>1. What {activeProfile.ticker} Represents & Why It Exists</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeProfile.whatItRepresents}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                2. How Students Train With {activeProfile.ticker} in Symphony Markets Academy
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeProfile.whyStudentsTrainWithIt}
            </p>
          </div>
        </div>

        {/* 3 Key Technical Specs Strip (Supply, Speed/Fee, Smallest Student Unit) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-mono font-bold text-amber-700 dark:text-amber-400">
              SUPPLY & SCARCITY RULE
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeProfile.supplyAndScarcity}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-mono font-bold text-sky-700 dark:text-sky-400">
              SPEED, FEE & WALLET RESERVE
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeProfile.speedAndFee}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              $5 STUDENT FRACTIONAL UNIT
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeProfile.smallestUnitLesson}
            </p>
          </div>
        </div>

        {/* Founders & Architects Cards + Historical Milestones */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left 7 Cols: Founders & Core Architects */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Founders, Creators & Core Architects of {activeProfile.ticker}</span>
            </div>

            <div className="space-y-2.5">
              {activeProfile.founders.map((founder) => (
                <div
                  key={founder.name}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {founder.name}
                    </span>
                    <span className="font-mono text-[11px] text-sky-700 dark:text-sky-400">
                      {founder.role}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {founder.contribution}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right 5 Cols: Key Historical Milestones */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Defining Historical Moments ({activeProfile.ticker})</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              {activeProfile.historicalMilestones.map((m) => (
                <div
                  key={m.year}
                  className="pb-2.5 last:pb-0 border-b last:border-b-0 border-slate-100 dark:border-slate-800 space-y-0.5"
                >
                  <div className="font-mono font-bold text-amber-700 dark:text-amber-400">
                    {m.year}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {m.event}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick 4-Coin Classroom Comparison Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400">
              <th className="py-2.5 px-3 font-semibold">Coin</th>
              <th className="py-2.5 px-3 font-semibold">Launch</th>
              <th className="py-2.5 px-3 font-semibold">Founders / Architects</th>
              <th className="py-2.5 px-3 font-semibold">What It Represents</th>
              <th className="py-2.5 px-3 font-semibold font-mono">Smallest Unit</th>
              <th className="py-2.5 px-3 font-semibold">Train Now</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {COIN_PROFILES.map((row) => (
              <tr
                key={row.key}
                onClick={() => setSelectedCoin(row.key)}
                className={`cursor-pointer transition-colors ${
                  row.key === selectedCoin
                    ? 'bg-sky-50/70 dark:bg-sky-950/30'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                }`}
              >
                <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                  {row.ticker}
                </td>
                <td className="py-2.5 px-3 font-mono whitespace-nowrap">{row.launchYear}</td>
                <td className="py-2.5 px-3">
                  {row.founders.map((f) => f.name.split(' (')[0]).join(', ')}
                </td>
                <td className="py-2.5 px-3 max-w-xs">{row.tagline}</td>
                <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                  {row.key === 'BTC'
                    ? '1 Satoshi (0.00000001)'
                    : row.key === 'XRP'
                    ? '1 Drop (0.000001)'
                    : row.key === 'XLM'
                    ? '1 Stroop (0.0000001)'
                    : '1/100g Crystalline Gold'}
                </td>
                <td className="py-2.5 px-3 whitespace-nowrap">
                  {row.trainSymbol && onSelectSymbolAndTrain ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSymbolAndTrain(row.trainSymbol!, 'ten-set-auto-trader');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-md cursor-pointer"
                    >
                      <span>Train {row.ticker}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    onOpenKsbcGoldLedger && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenKsbcGoldLedger();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-md cursor-pointer"
                      >
                        <span>Gold RWA Ledger</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Classroom Takeaway Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong>Why We Teach All 4 Together:</strong> Bitcoin (`BTC`) sets the 4-year macro supply cycle; `XRP` and `XLM` provide sub-penny 3-second DEX settlement; and `KSBC Gold` anchors tangible Real-World Asset stewardship.
          </span>
        </div>
      </div>
    </section>
  );
};
