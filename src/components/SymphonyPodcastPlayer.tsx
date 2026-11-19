import React, { useRef, useState } from 'react';
import { SymphonyHarpLogo } from './SymphonyHarpLogo';

export const PODCAST_AUDIO_SRC =
  '/assets/aistudio/Crypto_Self_Custody_and_AI_Content_Studios_31209789.m4a';

export interface PodcastChapter {
  id: string;
  part: 'Part I · Defensive Self-Custody' | 'Part II · Offensive AI Content Studio';
  timestampLabel: string;
  startSeconds: number;
  title: string;
  summary: string;
}

export const PODCAST_CHAPTERS: PodcastChapter[] = [
  {
    id: 'ch_fake_stop',
    part: 'Part I · Defensive Self-Custody',
    timestampLabel: '00:00',
    startSeconds: 0,
    title: '01. The Fake “Stop Trading” Button & Predatory UI Theater',
    summary:
      'Why centralized scam dashboards ignore user commands like a locked casino exit—and how Symphony Markets Academy was born as the architectural antidote.',
  },
  {
    id: 'ch_covenant',
    part: 'Part I · Defensive Self-Custody',
    timestampLabel: '06:10',
    startSeconds: 370,
    title: '02. Cognitive Overload & The No-Scam Zone Covenant',
    summary:
      'How bad actors weaponize jargon anxiety to sell fake VIP signal groups, and how Ambassador William Hardrick’s Certificate of Agreement sets an ethical boundary.',
  },
  {
    id: 'ch_vault_window',
    part: 'Part I · Defensive Self-Custody',
    timestampLabel: '09:11',
    startSeconds: 551,
    title: '03. The Brass Vault vs. The Bulletproof Glass Window',
    summary:
      'Visualizing asymmetric cryptography: your 12-word recovery phrase is the physical brass key, while your public address (r... / G...) is a read-only viewing window.',
  },
  {
    id: 'ch_five_dollar_rails',
    part: 'Part I · Defensive Self-Custody',
    timestampLabel: '14:02',
    startSeconds: 842,
    title: '04. The $5 Real-Wallet Sandbox & Escaping the Gas Trap',
    summary:
      'Why $5 of real money builds emotional discipline without ruin, why sub-penny XRPL & Stellar rails beat $50 gas auctions, and the 1-Coin Subway Card Reserve.',
  },
  {
    id: 'ch_ten_cent_safety',
    part: 'Part I · Defensive Self-Custody',
    timestampLabel: '21:36',
    startSeconds: 1296,
    title: '05. 1x Spot Ownership & The 10-Cent Safety Net (2% Rule)',
    summary:
      'How 1x Spot ownership gives you the luxury of time with zero liquidation risk, and how risking 1 dime ($0.10 = 1R) to target 2 dimes ($0.20 = 2R) silences panic.',
  },
  {
    id: 'ch_ai_time_machine_amm',
    part: 'Part I · Defensive Self-Custody',
    timestampLabel: '28:03',
    startSeconds: 1683,
    title: '06. Plain-English AI Mentor, 2,500-Path Time Machine & AMM Cylinders',
    summary:
      'Translating RSI and Hammer candlesticks into human psychology, testing setups across 2,500 Monte Carlo paths, x*y=k AMM pool depth, and 3-step Gold RWA proof (39:13).',
  },
  {
    id: 'ch_one_person_one_problem',
    part: 'Part II · Offensive AI Content Studio',
    timestampLabel: '41:02',
    startSeconds: 2462,
    title: '07. Generating Capital From Zero: The “One Person, One Problem” Rule',
    summary:
      'Transitioning from defensive capital preservation to offensive capital generation: why hyper-specific niches beat generalist AI copywriting.',
  },
  {
    id: 'ch_ai_content_b2b',
    part: 'Part II · Offensive AI Content Studio',
    timestampLabel: '44:45',
    startSeconds: 2685,
    title: '08. AI-Powered Content Studios & Custom B2B Audit Pipelines',
    summary:
      'Using constrained prompt chains and human quality-control to perform custom local SEO and website audits rather than generic cold-email spam.',
  },
  {
    id: 'ch_mrr_community',
    part: 'Part II · Offensive AI Content Studio',
    timestampLabel: '48:16',
    startSeconds: 2896,
    title: '09. Monthly Recurring Revenue (MRR), Mini-Courses & Community Flywheels',
    summary:
      'Replacing one-off freelance projects with monthly retainers, packaging proven workflows into a 60–90 min curriculum, and “Start small, start simple, start now.”',
  },
];

function formatTimecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

interface SymphonyPodcastPlayerProps {
  compact?: boolean;
}

export const SymphonyPodcastPlayer: React.FC<SymphonyPodcastPlayerProps> = ({
  compact = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(3466); // 57m 46s default metadata duration
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showChaptersInCompact, setShowChaptersInCompact] = useState<boolean>(false);

  const activeChapter =
    [...PODCAST_CHAPTERS]
      .reverse()
      .find((ch) => currentTime >= ch.startSeconds) ?? PODCAST_CHAPTERS[0];

  const togglePlayPause = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
    } else {
      el.pause();
    }
  };

  const handleSeekToSeconds = (targetSeconds: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(duration || 3466, targetSeconds));
    setCurrentTime(el.currentTime);
    if (el.paused) {
      void el.play();
    }
  };

  const handleSkipDelta = (deltaSeconds: number) => {
    const el = audioRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(duration || 3466, el.currentTime + deltaSeconds));
    el.currentTime = next;
    setCurrentTime(next);
  };

  const handleCycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
      {/* Hidden/Synced Native HTML5 Streaming Audio Element */}
      <audio
        ref={audioRef}
        src={PODCAST_AUDIO_SRC}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          if (e.currentTarget.duration && Number.isFinite(e.currentTarget.duration)) {
            setDuration(e.currentTarget.duration);
          }
        }}
      />

      {/* Top Audio Studio Stream Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <SymphonyHarpLogo variant="emblem" className="w-10 h-10 sm:w-11 sm:h-11" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-amber-300">
                <span>Official Streaming Audio Podcast</span>
                <span aria-hidden="true">·</span>
                <span>57 min 46 sec</span>
                <span aria-hidden="true">·</span>
                <span>M4A Stream</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white truncate">
                Crypto Self-Custody & AI Content Studios (Two-Blueprint Deep Dive)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCycleSpeed}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-amber-300 border border-slate-700 cursor-pointer"
              title="Change podcast playback speed"
            >
              {playbackRate}x Speed
            </button>

            <a
              href={PODCAST_AUDIO_SRC}
              download="Symphony_Markets_Crypto_Self_Custody_and_AI_Content_Studios.m4a"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors whitespace-nowrap"
            >
              Download Audio (.m4a)
            </a>
          </div>
        </div>

        {/* Transport Controls + Interactive Scrubbing Timeline */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={togglePlayPause}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              {isPlaying ? '⏸ Pause Podcast' : '▶ Stream Podcast'}
            </button>

            <button
              type="button"
              onClick={() => handleSkipDelta(-15)}
              className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 cursor-pointer"
              title="Rewind 15 seconds"
            >
              -15s
            </button>

            <button
              type="button"
              onClick={() => handleSkipDelta(30)}
              className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 cursor-pointer"
              title="Fast-forward 30 seconds"
            >
              +30s
            </button>
          </div>

          {/* Interactive Range Scrubber + Timecode */}
          <div className="flex-1 flex items-center gap-3">
            <span className="text-xs font-mono tabular-nums text-sky-300 shrink-0">
              {formatTimecode(currentTime)}
            </span>

            <input
              type="range"
              min={0}
              max={Math.round(duration || 3466)}
              value={Math.round(currentTime)}
              onChange={(e) => handleSeekToSeconds(Number(e.target.value))}
              aria-label="Seek audio podcast timeline"
              className="w-full h-2 bg-slate-800 rounded-lg accent-amber-400 cursor-pointer"
            />

            <span className="text-xs font-mono tabular-nums text-slate-400 shrink-0">
              {formatTimecode(duration)}
            </span>
          </div>
        </div>

        {/* Now Playing Chapter Banner + Compact Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/90 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-emerald-400 shrink-0">
              Now at {activeChapter.timestampLabel}:
            </span>
            <span className="font-semibold text-slate-100 truncate">
              {activeChapter.title}
            </span>
          </div>

          {compact && (
            <button
              type="button"
              onClick={() => setShowChaptersInCompact((v) => !v)}
              className="text-amber-300 hover:text-amber-200 font-semibold hover:underline cursor-pointer whitespace-nowrap shrink-0"
            >
              {showChaptersInCompact
                ? 'Hide 9-Chapter Index ▲'
                : 'Jump to Any Chapter (9 Chapters) ▼'}
            </button>
          )}
        </div>
      </div>

      {/* Interactive 9-Chapter Timestamp Breakdown */}
      {(!compact || showChaptersInCompact) && (
        <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-950/60 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="text-slate-600 dark:text-slate-300">
              <strong>Interactive Episode Chapters:</strong> Click any timestamp below to jump directly to that section of the 57:46 deep dive.
            </div>
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              Part I: $5 Self-Custody (00:00–41:01) · Part II: AI Content Studios (41:02–57:46)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PODCAST_CHAPTERS.map((ch) => {
              const isCurrent = activeChapter.id === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleSeekToSeconds(ch.startSeconds)}
                  className={`text-left p-3.5 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                    isCurrent
                      ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/25'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-400 dark:hover:border-sky-500'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-mono font-semibold text-sky-600 dark:text-sky-400">
                        ▶ {ch.timestampLabel}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 truncate">
                        {ch.part}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {ch.title}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ch.summary}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
