import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Film,
  Headphones,
  Play,
  ShieldCheck,
} from 'lucide-react';
import founderDeskImg from '../assets/images/founder_desk_story_1794561548330.jpg';
import goldRwaBlueprintImg from '../assets/images/infographic_gold_rwa_blueprint_1794621089543.jpg';
import noScamCompassImg from '../assets/images/no_scam_compass_1794561548457.jpg';
import videoCoverStopsImg from '../assets/images/video_cover_stops_1794561549253.jpg';
import videoCoverWalletImg from '../assets/images/video_cover_wallet_1794561551281.jpg';
import {
  createFunctionalOperationsManualPdfBlob,
  createNoScamZonePdfBlob,
} from '../utils/pdfGuideGenerator';
import { SymphonyPodcastPlayer } from './SymphonyPodcastPlayer';

export interface OpenMediaAndDocumentLibraryProps {
  orientationVideoUrl: string;
  orientationVideoTitle: string;
  isAdminUnlocked: boolean;
  onOpenAdminConsole?: () => void;
  onJumpToBeginnerStart?: () => void;
}

const GEOMETRY_PDF_LOCAL_URL =
  '/assets/aistudio/geometry-of-creation-and-commerce_9e656496.pdf';
const RHYTHM_OF_THE_CROWD_VIDEO_URL = '/assets/The_Rhythm_of_the_Crowd.mp4';
const ORGANIC_RHYTHM_VIDEO_URL = '/assets/The_Organic_Rhythm_of_Trading.mp4';
const ANTIDOTE_LOOSE_CYCLES_VIDEO_URL = '/assets/The_Antidote_to_Loose_Cycles.mp4';
const SURVIVAL_FINANCE_VIDEO_URL = '/assets/Survival_Finance_Traditional_Markets.mp4';
const FIVE_DOLLAR_BLUEPRINT_VIDEO_URL =
  '/assets/aistudio/Symphony_Markets__The__5_Blueprint_781e68ab.mp4';
const VIDEO_MEDIA_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1UbpPHFwQ9WSu7X1-O8qmNk7UCyroS5og';
const SHARED_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1hPDCoTd5K4163HsDW7_LtQXXB8VvBkv3';

type OpenDocumentId =
  | 'operations_manual'
  | 'geometry_creation'
  | 'book_pdf'
  | 'manifesto'
  | 'certificate'
  | 'companion';

interface OpenLibraryDocumentItem {
  id: OpenDocumentId;
  indexLabel: string;
  title: string;
  subtitle: string;
  formatMeta: string;
  filename: string;
  inlinePreviewSrc: string;
  directHref?: string;
  highlights: string[];
}

const OPEN_DOCUMENTS: OpenLibraryDocumentItem[] = [
  {
    id: 'operations_manual',
    indexLabel: '01 · NEW · Functional Operations & Step-by-Step How-To Manual',
    title: 'Symphony Markets Academy: Functional Features & Step-by-Step How-To Manual',
    subtitle:
      'Complete 4-page hands-on manual covering the 6 standalone modules, Android Xaman camera QR wallet sync, RLUSD TrustLine, live Support/Resistance & Android ntfy push alerts, and 24/7 XRPL Limit Buy/Sell execution.',
    formatMeta: '4-Page Printable Step-by-Step PDF · Works Offline & on Vercel',
    filename: 'symphony-markets-functional-how-to-manual.pdf',
    inlinePreviewSrc: '',
    highlights: [
      'Step-by-step Android Xaman wallet sync via Tablet Camera QR or public r... address (zero API keys, zero KYC) + one-time RLUSD TrustLine setup.',
      'How to activate Tablet Live Chime Alerts and Free Android Phone Lock-Screen Push Notifications (ntfy) for Support & Resistance zones.',
      'Exact 4-step process to place 24/7 XRPL Limit Buy & Limit Sell orders in Android Xaman DEX or Sologenic DEX and verify live orders on-chain.',
      'Includes the 30-second Vercel / custom-domain Firebase Authorized Domains checklist for Admin Google Sign-In.',
    ],
  },
  {
    id: 'geometry_creation',
    indexLabel: '02 · Sacred Geometry & Market Structure',
    title: 'The Geometry of Creation & Commerce (144 / 233 & 3-Point Fibonacci Extensions)',
    subtitle:
      'Connects Fibonacci retracements and 3-point extensions (100%, 127.2%, 161.8%) with the 13-note musical octave and the 144 / 233 structural framework.',
    formatMeta: '3-Page Illustrated Study PDF · Open Public Access',
    filename: 'geometry-of-creation-and-commerce.pdf',
    inlinePreviewSrc: GEOMETRY_PDF_LOCAL_URL,
    directHref: GEOMETRY_PDF_LOCAL_URL,
    highlights: [
      'Why Fibonacci retracements measure pullbacks while 3-point extensions (Point A → B → C) project 127.2% and 161.8% institutional profit targets.',
      'How the 13-note chromatic octave (8 white + 5 black keys in groups of 2 and 3) mirrors market harmonic ratios.',
      '4-step standard operating procedure for disciplined, non-emotional trade planning.',
    ],
  },
  {
    id: 'book_pdf',
    indexLabel: '03 · Complete Free Book (PDF & EPUB)',
    title: 'Quantum Analemma A.I. Technology Cycle',
    subtitle:
      'Complete book edition by Spiritual Sciences Pneumatology Researcher William Hardrick, DQP-KS — open for all readers in PDF and EPUB.',
    formatMeta: 'Full Book · PDF (765 KB) + EPUB (1.3 MB)',
    filename: 'quantum-analemma-a-i-technology-cycle.pdf',
    inlinePreviewSrc: '/api/drive-pdf?doc=book_pdf',
    highlights: [
      'Explores cyclic order, sovereign cognition, and ethical AI technology cycles.',
      'Explains why sound stewardship requires patient seasonal timing rather than impulsive shortcuts.',
      'Includes both printable desktop PDF and mobile e-reader EPUB editions.',
    ],
  },
  {
    id: 'manifesto',
    indexLabel: '04 · Beginner Protection Guide',
    title: 'The “No-Scam Zone” Manifesto & $5 Real-Wallet Starter Guide',
    subtitle:
      'Essential safety checklist before any student connects a self-custody wallet or tests a $5 Spot swap.',
    formatMeta: 'Official Starter PDF · Open Public Access',
    filename: 'no-scam-zone-manifesto.pdf',
    inlinePreviewSrc: '/api/drive-pdf?doc=manifesto',
    highlights: [
      'How to recognize fake stop-loss buttons, gas-card bots, and 12-word seed-phrase traps.',
      'Why sub-penny Stellar (XLM) and XRP Ledger (XRPL) rails protect a $5 training wallet.',
      'Step-by-step math behind the 2% ("10-Cent Safety Net") risk rule.',
    ],
  },
  {
    id: 'certificate',
    indexLabel: '05 · Ethical Classroom Covenant',
    title: 'Certificate of Commitment & No-Scam Zone Ethical Agreement',
    subtitle:
      '“If you’re looking for a scam, you won’t find one here.” — Our open non-custodial classroom pledge.',
    formatMeta: 'Covenant PDF · Annalima Ventures',
    filename: 'no-scam-zone-certificate.pdf',
    inlinePreviewSrc: '/api/drive-pdf?doc=certificate',
    highlights: [
      'Radical self-custody: zero deposits, zero private keys, and zero VIP signal upsells.',
      'Open-source formulas for every stop-loss, fee, and R-multiple calculation.',
      'Commitment to teaching students to trust sound mathematical structure rather than emotional hype.',
    ],
  },
  {
    id: 'companion',
    indexLabel: '06 · 4-Pillar Study Companion',
    title: 'The Sovereign Mind & The Honest Market (Reader’s Companion)',
    subtitle:
      'Study guide uniting calm breathing (Pneuma), proportional risk geometry, and ethical AI guardrails.',
    formatMeta: '4-Pillar Study PDF · Open Public Access',
    filename: 'quantum-analemma-companion.pdf',
    inlinePreviewSrc: '/api/drive-pdf?doc=companion',
    highlights: [
      'Pillar 1: Pausing FOMO and emotional urgency before entering any market.',
      'Pillar 2: Respecting proportional balance and the 10-cent risk boundary.',
      'Pillar 3 & 4: Using AI strictly as an educational shield under radical transparency.',
    ],
  },
];

interface OpenVideoTrack {
  id: string;
  label: string;
  title: string;
  duration: string;
  summary: string;
  src: string;
  poster: string;
}

const OPEN_VIDEO_TRACKS: OpenVideoTrack[] = [
  {
    id: 'vid_organic_rhythm',
    label: '01 · Organic Rhythm of Trading (7:03)',
    title: 'Symphony Markets Academy: The Organic Rhythm of Trading (7:03)',
    duration: '7:03',
    summary:
      'Flagship botanical & architectural lesson uniting 8-Hour Harp & Cello Candlestick Notes, Hebrew Gematria (144 Garden of Eden / 233 Tree of Life = 1.618 Φ), 61.8% Golden Pocket rebounds, and 3-Point Fibonacci Extensions (100% & 161.8% Golden Target) with the 2% ($0.10) risk cap.',
    src: ORGANIC_RHYTHM_VIDEO_URL,
    poster: videoCoverStopsImg,
  },
  {
    id: 'vid_antidote_loose_cycles',
    label: '02 · Antidote to Loose Cycles (6:14)',
    title: 'Symphony Markets Academy: The Antidote to Loose Cycles (6:14)',
    duration: '6:14',
    summary:
      'Exposes how opaque market-maker middlemen extract spread markups and trap retail FOMO at 161.8% extension walls—presenting the open-math antidote: x · y = k AMM reserves, KSBC 999.9 Gold RWA transparency, the 2,500-Path Time Machine, and the Late 2026 Cycle GPS.',
    src: ANTIDOTE_LOOSE_CYCLES_VIDEO_URL,
    poster: noScamCompassImg,
  },
  {
    id: 'vid_survival_finance',
    label: '03 · Survival Finance & Markets (5:07)',
    title: 'Symphony Markets Academy: Survival Finance & Traditional Markets (5:07)',
    duration: '5:07',
    summary:
      'Contrasts retail casino speculation with institutional risk defense ("survival always comes before profit") across the $5 Real-Wallet Roadmap, 33.3% breakeven win-rate math at 1:2 R:R, 144/233 Fibonacci geometry, and the 16-Year Logarithmic Cycle Map (2012–2028).',
    src: SURVIVAL_FINANCE_VIDEO_URL,
    poster: founderDeskImg,
  },
  {
    id: 'vid_rhythm_of_crowd',
    label: '04 · Fibonacci Part 1: Rhythm of the Crowd (5:36)',
    title: 'Fibonacci Part 1: The Rhythm of the Crowd & Harmonic Market Geometry',
    duration: '5:36',
    summary:
      'Explores how collective market psychology moves in Fibonacci waves (38.2%, 50%, 61.8% Golden Pocket, and 161.8% extensions)—connecting natural harmonic ratios to disciplined, non-emotional entries and exits.',
    src: RHYTHM_OF_THE_CROWD_VIDEO_URL,
    poster: videoCoverStopsImg,
  },
  {
    id: 'vid_blueprint',
    label: '05 · The $5 Blueprint (4:40)',
    title: 'Symphony Markets Academy: The $5 Blueprint & 10-Cent Safety Net',
    duration: '4:40',
    summary:
      'Walks beginners step by step through why 1x Spot, sub-penny XRP/XLM fees, and a 2% stop-loss protect a $5 learning budget.',
    src: FIVE_DOLLAR_BLUEPRINT_VIDEO_URL,
    poster: videoCoverWalletImg,
  },
  {
    id: 'vid_sandbox',
    label: '06 · No-Scam Sandbox (5:45)',
    title: 'Symphony Markets Academy: Full Open-Source Classroom Walkthrough',
    duration: '5:45',
    summary:
      'Shows how the Beginner, Intermediate, and Advanced modules work together without ever taking custody of student funds.',
    src: '/assets/symphony-welcome.mp4',
    poster: founderDeskImg,
  },
  {
    id: 'vid_antidote',
    label: '07 · Antidote to Predation (6:04)',
    title: 'The Antidote to Predation & Market Symphony Harmony',
    duration: '6:04',
    summary:
      'Explains why real trading mastery is not a 1-2-3 get-rich gimmick, exposing rigged platforms and showing calm harmonic structure.',
    src: '/assets/symphony-antidote.mp4',
    poster: noScamCompassImg,
  },
  {
    id: 'vid_symphony_promo',
    label: '08 · Symphony Notes Reel (0:10)',
    title: 'Symphony Markets Academy: Golden Harp & Deep Cello Candlestick Notes',
    duration: '0:10',
    summary:
      'Short visual reel demonstrating how green ascending and red pullback candles translate into musical intervals.',
    src: '/api/drive-video/1R_Cy_uBTBjVgLjCqseoAjPxm0oqh5e9g',
    poster: videoCoverStopsImg,
  },
  {
    id: 'vid_ksbc_promo',
    label: '09 · KSBC Gold RWA Reel (0:10)',
    title: 'KSBC Gold RWA: Crystalline Proof-of-Reserve & Open Math',
    duration: '0:10',
    summary:
      'Short reel illustrating physical gold reserve transparency paired with open constant-product AMM math.',
    src: '/api/drive-video/1vvE86gSwiJeR7LxLPZcGfxbxw5EbPWM7',
    poster: goldRwaBlueprintImg,
  },
];

function mapDriveFileIdToLocalVideo(id: string): string {
  if (id === '1kCLZNmmcUAXP5XuRcAWfWnkWBXTs3YD5') return RHYTHM_OF_THE_CROWD_VIDEO_URL;
  if (id === '1s-wUCvu1e3p3Rp93k1mzgi1TYHBuHw3i') return ORGANIC_RHYTHM_VIDEO_URL;
  if (id === '1RCuSGFs76KSTkdQBPDXrSN5ND8y_ZBBi') return ANTIDOTE_LOOSE_CYCLES_VIDEO_URL;
  if (id === '1pCtFdKXo6Fhd88QnSCoH95qlRTXAf5Dj') return SURVIVAL_FINANCE_VIDEO_URL;
  return `/api/drive-video/${id}`;
}

function resolveOrientationMedia(rawUrl: string): { type: 'video' | 'iframe'; src: string } | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch?.[1]) {
    return { type: 'video', src: mapDriveFileIdToLocalVideo(driveMatch[1]) };
  }
  const driveIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (trimmed.includes('drive.google.com') && driveIdParam?.[1]) {
    return { type: 'video', src: mapDriveFileIdToLocalVideo(driveIdParam[1]) };
  }
  if (
    trimmed.startsWith('/assets/') ||
    trimmed.startsWith('/api/drive-video/') ||
    trimmed.endsWith('.mp4') ||
    trimmed.endsWith('.webm')
  ) {
    return { type: 'video', src: trimmed };
  }
  return { type: 'iframe', src: trimmed };
}

export const OpenMediaAndDocumentLibrary: React.FC<OpenMediaAndDocumentLibraryProps> = ({
  orientationVideoUrl,
  orientationVideoTitle,
  isAdminUnlocked,
  onOpenAdminConsole,
  onJumpToBeginnerStart,
}) => {
  const [libraryTab, setLibraryTab] = useState<'documents' | 'videos' | 'podcast'>('documents');
  const [selectedDocId, setSelectedDocId] = useState<OpenDocumentId>('operations_manual');
  const [showInlineReader, setShowInlineReader] = useState<boolean>(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string>('vid_organic_rhythm');
  const [operationsManualBlobUrl, setOperationsManualBlobUrl] = useState<string>('');

  // Generate client-side 4-page Functional Operations PDF URL so it previews & downloads cleanly everywhere (including Vercel)
  useEffect(() => {
    const blob = createFunctionalOperationsManualPdfBlob();
    const url = URL.createObjectURL(blob);
    setOperationsManualBlobUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, []);

  const activeDoc = OPEN_DOCUMENTS.find((d) => d.id === selectedDocId) ?? OPEN_DOCUMENTS[0];
  const resolvedActivePreviewSrc =
    activeDoc.id === 'operations_manual' ? operationsManualBlobUrl : activeDoc.inlinePreviewSrc;
  const resolvedActiveDirectHref =
    activeDoc.id === 'operations_manual' ? operationsManualBlobUrl : activeDoc.directHref;
  const resolvedOrientation = resolveOrientationMedia(orientationVideoUrl);
  const activeTrack =
    OPEN_VIDEO_TRACKS.find((t) => t.id === selectedVideoId) ?? OPEN_VIDEO_TRACKS[0];

  const handleDownloadDocument = async (
    docKey:
      | 'operations_manual'
      | 'geometry_creation'
      | 'manifesto'
      | 'certificate'
      | 'companion'
      | 'book_pdf'
      | 'book_epub',
    filename: string
  ) => {
    setDownloadingId(docKey);
    try {
      if (docKey === 'operations_manual') {
        const blob = createFunctionalOperationsManualPdfBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        return;
      }

      if (docKey === 'geometry_creation') {
        const link = document.createElement('a');
        link.href = GEOMETRY_PDF_LOCAL_URL;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const res = await fetch(`/api/drive-pdf?doc=${docKey}&download=1`);
      if (!res.ok) {
        throw new Error('Fallback to generated starter PDF');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      if (docKey === 'manifesto') {
        const fallbackBlob = createNoScamZonePdfBlob();
        const url = URL.createObjectURL(fallbackBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Open-Access Sanctuary Header & Honest Stewardship Framing */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>100% Open Public Library</span>
              <span aria-hidden="true">·</span>
              <span>Zero Passcode Required</span>
              <span aria-hidden="true">·</span>
              <span>Documents, Videos & Audio Podcast</span>
            </div>
            <h2
              className="font-editorial text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-snug"
              style={{ textWrap: 'balance' }}
            >
              Open Media & Document Reading Room
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Learning how markets breathe is <strong>not a simple 1-2-3 shortcut</strong>—it is a patient, progressive craft. Every book, PDF study sheet, walkthrough video, and podcast episode in this library remains <strong>completely open without a password</strong> so anyone can read, watch, and build a strong foundation before entering cohort-guided Intermediate or Advanced labs.
            </p>
          </div>

          {/* Interactive Sub-Library Switcher */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setLibraryTab('documents')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                libraryTab === 'documents'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Open Document Library (6 PDFs + EPUB)</span>
            </button>
            <button
              type="button"
              onClick={() => setLibraryTab('videos')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                libraryTab === 'videos'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5 shrink-0" />
              <span>Open Video Library</span>
            </button>
            <button
              type="button"
              onClick={() => setLibraryTab('podcast')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                libraryTab === 'podcast'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Headphones className="w-3.5 h-3.5 shrink-0" />
              <span>Audio Podcast</span>
            </button>
          </div>
        </div>

        {/* Dedicated Orientation Video Banner (Ready for the Instructor's Upcoming Video!) */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="text-slate-500 dark:text-slate-400">
              <span>Course Orientation Film</span>
              <span aria-hidden="true" className="mx-1.5">
                ·
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {orientationVideoTitle}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              {resolvedOrientation
                ? 'Instructor Orientation Video is live and ready to watch inside the Open Video Library tab.'
                : 'Dedicated orientation video stage is pre-wired for your Beginner → Intermediate → Advanced course film—meanwhile, all 9 full-length Academy lessons and reels are open to watch right now.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setLibraryTab('videos');
                if (resolvedOrientation) {
                  setSelectedVideoId('orientation_custom');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 shrink-0" />
              <span>
                {resolvedOrientation ? 'Watch Orientation Video' : 'Open Video Player'}
              </span>
            </button>
            {isAdminUnlocked && onOpenAdminConsole && (
              <button
                type="button"
                onClick={onOpenAdminConsole}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Attach / Update Orientation Video Link
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================
       * TAB 1: OPEN DOCUMENT & PDF READING ROOM (ZERO PASSWORD)
       * ======================================================================== */}
      {libraryTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: 5 Open Documents Selector */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>Select any study guide or book to read inline</span>
              <a
                href={SHARED_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline font-medium whitespace-nowrap shrink-0"
              >
                <span>Google Drive Folder</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>

            {OPEN_DOCUMENTS.map((docItem) => {
              const isSelected = docItem.id === activeDoc.id;
              return (
                <button
                  key={docItem.id}
                  type="button"
                  onClick={() => {
                    setSelectedDocId(docItem.id);
                    setShowInlineReader(true);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'border-sky-500 bg-white dark:bg-slate-900 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{docItem.indexLabel}</span>
                    <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                      Open Read
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                    {docItem.title}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {docItem.subtitle}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Active Document Details, Direct Downloads & Inline PDF Reader */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
            <div className="space-y-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span>{activeDoc.indexLabel}</span>
                <span aria-hidden="true" className="mx-1.5">
                  ·
                </span>
                <span>{activeDoc.formatMeta}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
                {activeDoc.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeDoc.subtitle}
              </p>
            </div>

            <ul className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              {activeDoc.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* Action Bar: Download PDF, Optional EPUB, Toggle Inline Reader */}
            <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleDownloadDocument(activeDoc.id, activeDoc.filename)}
                disabled={downloadingId === activeDoc.id}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>
                  {downloadingId === activeDoc.id
                    ? 'Downloading PDF...'
                    : `Download ${activeDoc.filename}`}
                </span>
              </button>

              {activeDoc.id === 'book_pdf' && (
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadDocument(
                      'book_epub',
                      'quantum-analemma-a-i-technology-cycle.epub'
                    )
                  }
                  disabled={downloadingId === 'book_epub'}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>
                    {downloadingId === 'book_epub' ? 'Downloading EPUB...' : 'Download EPUB Edition'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowInlineReader((v) => !v)}
                className="px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {showInlineReader ? 'Hide Inline PDF Reader' : 'Read PDF Inline'}
              </button>

              {resolvedActiveDirectHref && (
                <a
                  href={resolvedActiveDirectHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0"
                >
                  <span>Open Full Tab</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              )}
            </div>

            {showInlineReader && resolvedActivePreviewSrc && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-950">
                <iframe
                  key={resolvedActivePreviewSrc}
                  src={resolvedActivePreviewSrc}
                  title={activeDoc.title}
                  className="w-full h-[520px] border-0"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================
       * TAB 2: OPEN VIDEO & ORIENTATION LIBRARY (ZERO PASSWORD)
       * ======================================================================== */}
      {libraryTab === 'videos' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {resolvedOrientation && (
                <button
                  type="button"
                  onClick={() => setSelectedVideoId('orientation_custom')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedVideoId === 'orientation_custom'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  ★ Course Orientation Video
                </button>
              )}
              {OPEN_VIDEO_TRACKS.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setSelectedVideoId(track.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedVideoId === track.id
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {track.label}
                </button>
              ))}
            </div>

            <a
              href={VIDEO_MEDIA_DRIVE_FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0"
            >
              <span>All Promo Videos Drive Folder</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 aspect-16/9">
              {selectedVideoId === 'orientation_custom' && resolvedOrientation ? (
                resolvedOrientation.type === 'video' ? (
                  <video
                    key={resolvedOrientation.src}
                    src={resolvedOrientation.src}
                    controls
                    playsInline
                    className="w-full h-full object-contain bg-slate-950"
                  />
                ) : (
                  <iframe
                    src={resolvedOrientation.src}
                    title={orientationVideoTitle}
                    allow="autoplay; fullscreen"
                    className="w-full h-full border-0"
                  />
                )
              ) : (
                <video
                  key={activeTrack.src}
                  src={activeTrack.src}
                  poster={activeTrack.poster}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain bg-slate-950"
                />
              )}
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="space-y-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span>Open Video Lesson</span>
                  <span aria-hidden="true" className="mx-1.5">
                    ·
                  </span>
                  <span className="font-mono tabular-nums">
                    {selectedVideoId === 'orientation_custom' ? 'Orientation' : activeTrack.duration}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {selectedVideoId === 'orientation_custom'
                    ? orientationVideoTitle
                    : activeTrack.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedVideoId === 'orientation_custom'
                    ? 'Official instructor orientation explaining why Symphony Markets Academy progresses deliberately from Beginner Foundations into Intermediate Charting & Risk and Advanced 10-Set Execution.'
                    : activeTrack.summary}
                </p>
              </div>

              {onJumpToBeginnerStart && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={onJumpToBeginnerStart}
                    className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Start Open Beginner Chapter 01 →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
       * TAB 3: OPEN AUDIO PODCAST STREAM (ZERO PASSWORD)
       * ======================================================================== */}
      {libraryTab === 'podcast' && (
        <div className="space-y-4">
          <SymphonyPodcastPlayer />
        </div>
      )}
    </div>
  );
};
