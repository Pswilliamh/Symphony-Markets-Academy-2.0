import React, { useRef, useState } from 'react';
import { ExternalLink, Film, Play } from 'lucide-react';

export interface PromoVideoTrack {
  id: string;
  tabLabel: string;
  title: string;
  duration: string;
  videoSrc: string;
  driveFileId: string;
  posterSrc?: string;
}

interface SectionPromoVideoBannerProps {
  sectionBadge: string;
  headline: string;
  description: string;
  tracks: PromoVideoTrack[];
  accentTone?: 'amber' | 'sky' | 'emerald';
}

const VIDEO_MEDIA_FOLDER_URL =
  'https://drive.google.com/drive/folders/1UbpPHFwQ9WSu7X1-O8qmNk7UCyroS5og';

export const SectionPromoVideoBanner: React.FC<SectionPromoVideoBannerProps> = ({
  sectionBadge,
  headline,
  description,
  tracks,
  accentTone = 'sky',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeTrackIdx, setActiveTrackIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const activeTrack = tracks[activeTrackIdx] ?? tracks[0];
  if (!activeTrack) return null;

  const borderTone =
    accentTone === 'amber'
      ? 'border-amber-300/70 dark:border-amber-500/35'
      : accentTone === 'emerald'
      ? 'border-emerald-300/70 dark:border-emerald-500/35'
      : 'border-sky-300/70 dark:border-sky-500/35';

  const badgeTone =
    accentTone === 'amber'
      ? 'text-amber-700 dark:text-amber-400'
      : accentTone === 'emerald'
      ? 'text-emerald-700 dark:text-emerald-400'
      : 'text-sky-700 dark:text-sky-400';

  const playBtnTone =
    accentTone === 'amber'
      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
      : accentTone === 'emerald'
      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
      : 'bg-sky-500 hover:bg-sky-400 text-slate-950';

  return (
    <div
      className={`rounded-xl border ${borderTone} bg-white dark:bg-slate-900 p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center`}
    >
      {/* Video Player Column */}
      <div className="lg:col-span-6 space-y-2">
        {tracks.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {tracks.map((trk, idx) => {
              const isSelected = idx === activeTrackIdx;
              return (
                <button
                  key={trk.id}
                  type="button"
                  onClick={() => {
                    setActiveTrackIdx(idx);
                    setIsPlaying(false);
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-sky-600 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {trk.tabLabel} ({trk.duration})
                </button>
              );
            })}
          </div>
        )}

        <div className="relative aspect-16/9 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xs">
          <video
            ref={videoRef}
            key={activeTrack.videoSrc}
            src={activeTrack.videoSrc}
            poster={activeTrack.posterSrc}
            controls
            playsInline
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full object-contain bg-slate-950"
          />

          {!isPlaying && (
            <div className="pointer-events-none absolute inset-x-0 top-0 bottom-11 bg-gradient-to-t from-black/75 via-black/20 to-black/30 flex items-center justify-center p-4">
              <button
                type="button"
                onClick={() => {
                  const el = videoRef.current;
                  if (el) {
                    void el.play();
                  }
                }}
                className={`pointer-events-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-lg ${playBtnTone} text-xs sm:text-sm font-bold shadow-lg transition-transform duration-150 hover:scale-105 cursor-pointer`}
              >
                <Play className="w-4 h-4 fill-current shrink-0" />
                <span>
                  Play {activeTrack.title} ({activeTrack.duration})
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Section Video Context Column */}
      <div className="lg:col-span-6 space-y-2.5 text-xs sm:text-sm">
        <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${badgeTone}`}>
          <Film className="w-3.5 h-3.5 shrink-0" />
          <span>{sectionBadge}</span>
        </div>

        <h3 className="font-editorial text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
          {headline}
        </h3>

        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{description}</p>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <a
            href={`https://drive.google.com/file/d/${activeTrack.driveFileId}/view`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 hover:underline"
          >
            <span>Open “{activeTrack.title}” in Drive</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>

          <a
            href={VIDEO_MEDIA_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline"
          >
            All Promo Videos Folder ↗
          </a>
        </div>
      </div>
    </div>
  );
};
