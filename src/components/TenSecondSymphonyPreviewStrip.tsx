import React, { useEffect, useRef, useState } from 'react';
import { Music, Square, Volume2 } from 'lucide-react';

interface TenSecondSymphonyPreviewStripProps {
  onOpenSymphonyModule: () => void;
}

interface PreviewNoteStep {
  index: number;
  type: 'green_harp' | 'red_cello';
  symbol: string;
  label: string;
  noteName: string;
  freq: number;
  y: number;
  bodyHeight: number;
}

const PREVIEW_STEPS: PreviewNoteStep[] = [
  {
    index: 0,
    type: 'green_harp',
    symbol: '♪',
    label: 'Rising Harp',
    noteName: 'C4',
    freq: 256.87,
    y: 30,
    bodyHeight: 14,
  },
  {
    index: 1,
    type: 'green_harp',
    symbol: '♫',
    label: 'Expansion',
    noteName: 'E4',
    freq: 323.63,
    y: 22,
    bodyHeight: 16,
  },
  {
    index: 2,
    type: 'red_cello',
    symbol: '♩',
    label: 'Calm Cello Rest',
    noteName: 'D4 Rest',
    freq: 192.43,
    y: 27,
    bodyHeight: 12,
  },
  {
    index: 3,
    type: 'green_harp',
    symbol: '♪',
    label: 'Support Bounce',
    noteName: 'G4',
    freq: 384.87,
    y: 18,
    bodyHeight: 16,
  },
  {
    index: 4,
    type: 'green_harp',
    symbol: '♬',
    label: '432 Hz Harmony',
    noteName: 'A4',
    freq: 432.0,
    y: 13,
    bodyHeight: 17,
  },
  {
    index: 5,
    type: 'red_cello',
    symbol: '♩',
    label: 'Patient Breath',
    noteName: 'E3 Cello',
    freq: 161.82,
    y: 21,
    bodyHeight: 13,
  },
  {
    index: 6,
    type: 'green_harp',
    symbol: '♫',
    label: '528 Hz Ascent',
    noteName: 'C5',
    freq: 528.0,
    y: 9,
    bodyHeight: 17,
  },
  {
    index: 7,
    type: 'green_harp',
    symbol: '♬',
    label: 'Abundance Chord',
    noteName: 'E5',
    freq: 647.27,
    y: 6,
    bodyHeight: 16,
  },
];

export const TenSecondSymphonyPreviewStrip: React.FC<TenSecondSymphonyPreviewStripProps> = ({
  onOpenSymphonyModule,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeStepIdx, setActiveStepIdx] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(10);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timersRef = useRef<number[]>([]);

  const stopPreview = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
    setActiveStepIdx(null);
    setSecondsLeft(10);
  };

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const startTenSecondPreview = () => {
    if (isPlaying) {
      stopPreview();
      return;
    }

    stopPreview();

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const now = ctx.currentTime;

      // Warm Concert Hall Low-Pass + Gentle Delay
      const masterFilter = ctx.createBiquadFilter();
      masterFilter.type = 'lowpass';
      masterFilter.frequency.setValueAtTime(1750, now);

      const delay = ctx.createDelay();
      delay.delayTime.setValueAtTime(0.26, now);
      const feedback = ctx.createGain();
      feedback.gain.setValueAtTime(0.24, now);
      const wet = ctx.createGain();
      wet.gain.setValueAtTime(0.22, now);

      masterFilter.connect(ctx.destination);
      masterFilter.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      wet.connect(ctx.destination);

      const scheduleHarpNote = (freq: number, startOffset: number, duration: number) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, now + startOffset);
        osc2.frequency.setValueAtTime(freq * 2, now + startOffset);

        gain.gain.setValueAtTime(0.0001, now + startOffset);
        gain.gain.linearRampToValueAtTime(0.095, now + startOffset + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + startOffset + duration);

        const harmonicGain = ctx.createGain();
        harmonicGain.gain.setValueAtTime(0.022, now + startOffset);

        osc1.connect(gain);
        osc2.connect(harmonicGain);
        harmonicGain.connect(gain);
        gain.connect(masterFilter);

        osc1.start(now + startOffset);
        osc2.start(now + startOffset);
        osc1.stop(now + startOffset + duration + 0.05);
        osc2.stop(now + startOffset + duration + 0.05);
      };

      const scheduleCalmCelloRest = (freq: number, startOffset: number, duration: number) => {
        const celloOsc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        const celloFilter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        celloOsc.type = 'sawtooth';
        subOsc.type = 'sine';
        celloOsc.frequency.setValueAtTime(freq, now + startOffset);
        subOsc.frequency.setValueAtTime(freq * 0.5, now + startOffset);

        celloFilter.type = 'lowpass';
        celloFilter.frequency.setValueAtTime(420, now + startOffset);

        // Slow, soothing bowed envelope (never startling)
        gain.gain.setValueAtTime(0.0001, now + startOffset);
        gain.gain.linearRampToValueAtTime(0.075, now + startOffset + 0.28);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + startOffset + duration);

        celloOsc.connect(celloFilter);
        subOsc.connect(celloFilter);
        celloFilter.connect(gain);
        gain.connect(masterFilter);

        celloOsc.start(now + startOffset);
        subOsc.start(now + startOffset);
        celloOsc.stop(now + startOffset + duration + 0.06);
        subOsc.stop(now + startOffset + duration + 0.06);
      };

      // Underlying warm Cello root drone for emotional calm
      scheduleCalmCelloRest(128.43, 0, 9.8);

      const stepDurationSec = 1.18;
      PREVIEW_STEPS.forEach((step, idx) => {
        const offsetSec = idx * stepDurationSec;
        if (step.type === 'green_harp') {
          scheduleHarpNote(step.freq, offsetSec, 1.45);
          if (idx === PREVIEW_STEPS.length - 1) {
            // Final resolving triad chord at 8.3s - 10.0s
            scheduleHarpNote(256.87, offsetSec + 0.08, 1.7);
            scheduleHarpNote(384.87, offsetSec + 0.16, 1.65);
            scheduleHarpNote(528.0, offsetSec + 0.24, 1.6);
          }
        } else {
          scheduleCalmCelloRest(step.freq, offsetSec, 1.4);
        }

        const uiTimer = window.setTimeout(() => {
          setActiveStepIdx(idx);
        }, offsetSec * 1000);
        timersRef.current.push(uiTimer);
      });

      for (let sec = 1; sec <= 10; sec += 1) {
        const countdownId = window.setTimeout(() => {
          setSecondsLeft(Math.max(0, 10 - sec));
        }, sec * 1000);
        timersRef.current.push(countdownId);
      }

      const endId = window.setTimeout(() => {
        stopPreview();
      }, 10100);
      timersRef.current.push(endId);

      setIsPlaying(true);
      setActiveStepIdx(0);
      setSecondsLeft(10);
    } catch {
      setIsPlaying(false);
    }
  };

  const activeStep = activeStepIdx !== null ? PREVIEW_STEPS[activeStepIdx] : null;

  return (
    <div className="px-4 py-2.5 bg-gradient-to-r from-amber-50/90 via-white to-emerald-50/80 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={startTenSecondPreview}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            isPlaying
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
          }`}
        >
          {isPlaying ? (
            <>
              <Square className="w-3 h-3 fill-current shrink-0" />
              <span>Stop ({secondsLeft}s)</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 shrink-0" />
              <span>♪ 10s Symphony Preview</span>
            </>
          )}
        </button>

        <div className="min-w-0 text-xs">
          <div className="font-semibold text-slate-900 dark:text-white truncate">
            {isPlaying && activeStep ? (
              <span>
                Playing Candle {activeStep.index + 1}/8:{' '}
                <span
                  className={
                    activeStep.type === 'green_harp'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }
                >
                  {activeStep.symbol} {activeStep.label} ({activeStep.noteName})
                </span>
              </span>
            ) : (
              <span>
                Hear the Market: Green Candles = Rising Harp (♪) · Red Candles = Calm Cello Rest (♩)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
            Replaces retail trading anxiety & panic-selling with calm emotional regulation and pattern recognition.
          </p>
        </div>
      </div>

      {/* Synchronized Mini 8-Bar Audio-Visual Candlestick Staff + Deep Link */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
        <svg
          viewBox="0 0 176 44"
          className="w-40 h-9 rounded-md bg-slate-950 border border-slate-800 px-1 shrink-0"
          role="img"
          aria-label="Synchronized 8-bar candlestick musical staff preview"
        >
          {[11, 22, 33].map((staffY) => (
            <line
              key={staffY}
              x1="4"
              y1={staffY}
              x2="172"
              y2={staffY}
              stroke="#F59E0B"
              strokeOpacity="0.2"
              strokeWidth="0.8"
            />
          ))}
          {PREVIEW_STEPS.map((s, idx) => {
            const x = 14 + idx * 21;
            const isCurrent = activeStepIdx === idx;
            const isGreen = s.type === 'green_harp';
            const strokeColor = isGreen ? '#10B981' : '#F43F5E';
            const fillColor = isCurrent
              ? '#FDE68A'
              : isGreen
              ? '#10B981'
              : '#FB7185';

            return (
              <g key={s.index}>
                <line
                  x1={x}
                  y1={Math.max(3, s.y - 4)}
                  x2={x}
                  y2={Math.min(41, s.y + s.bodyHeight + 4)}
                  stroke={strokeColor}
                  strokeWidth={isCurrent ? '2' : '1.3'}
                />
                <rect
                  x={x - 4}
                  y={s.y}
                  width="8"
                  height={s.bodyHeight}
                  rx="1.5"
                  fill={fillColor}
                  fillOpacity={isCurrent ? 0.95 : 0.72}
                />
                {isCurrent && (
                  <text
                    x={x}
                    y={Math.max(9, s.y - 2)}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#FEF08A"
                  >
                    {s.symbol}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <button
          type="button"
          onClick={() => {
            stopPreview();
            onOpenSymphonyModule();
          }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer whitespace-nowrap"
        >
          <Music className="w-3.5 h-3.5 shrink-0" />
          <span>Full Score →</span>
        </button>
      </div>
    </div>
  );
};
