import React from 'react';
import symphonyHarpEmblemImg from '../assets/images/symphony_harp_logo_1794639103234.jpg';

export { symphonyHarpEmblemImg };

interface SymphonyHarpLogoProps {
  className?: string;
  size?: number;
  variant?: 'emblem' | 'vector';
}

/**
 * Symphony Markets Academy Official Logo:
 * A crypto-medallion crest featuring a golden Symphony Harp whose vertical
 * strings are glowing emerald & cyan market candlesticks (with wicks and bodies)
 * and golden musical notes floating upward from the harmonic curve.
 */
export const SymphonyHarpLogo: React.FC<SymphonyHarpLogoProps> = ({
  className = 'w-9 h-9',
  size,
  variant = 'vector',
}) => {
  if (variant === 'emblem') {
    return (
      <img
        src={symphonyHarpEmblemImg}
        alt="Symphony Markets Academy Logo — Golden harp with candlestick strings and floating musical notes"
        width={size}
        height={size}
        className={`rounded-full object-cover border border-amber-400/70 shadow-sm shrink-0 select-none ${className}`}
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label="Symphony Markets Academy Logo — Golden harp with candlestick strings and floating musical notes"
      className={`shrink-0 select-none ${className}`}
    >
      <defs>
        <linearGradient
          id="symphonyCoinBg"
          x1="6"
          y1="6"
          x2="58"
          y2="58"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#071936" />
          <stop offset="100%" stopColor="#0F294A" />
        </linearGradient>
        <linearGradient
          id="symphonyGold"
          x1="8"
          y1="8"
          x2="56"
          y2="56"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Crypto Medallion Outer Double-Ring Crest */}
      <circle
        cx="32"
        cy="32"
        r="29.5"
        fill="url(#symphonyCoinBg)"
        stroke="url(#symphonyGold)"
        strokeWidth="2.5"
      />
      <circle
        cx="32"
        cy="32"
        r="26.2"
        stroke="url(#symphonyGold)"
        strokeOpacity="0.55"
        strokeWidth="0.9"
      />

      {/* HARP STRINGS AS GLOWING GREEN & RED MARKET CANDLESTICKS (Wicks + Candle Bodies) */}
      {/* String 1: Emerald Bullish Candlestick */}
      <line x1="21.5" y1="20" x2="21.5" y2="47.5" stroke="#10B981" strokeWidth="1.35" strokeLinecap="round" />
      <rect x="19.8" y="32" width="3.4" height="8.5" rx="0.8" fill="#10B981" stroke="#6EE7B7" strokeWidth="0.5" />

      {/* String 2: Ruby Red Pullback Candlestick (Harmonic Rest) */}
      <line x1="26" y1="21.5" x2="26" y2="47.5" stroke="#F43F5E" strokeWidth="1.35" strokeLinecap="round" />
      <rect x="24.3" y="29" width="3.4" height="9" rx="0.8" fill="#E11D48" stroke="#FDA4AF" strokeWidth="0.5" />

      {/* String 3: Emerald Breakout Candlestick */}
      <line x1="30.5" y1="24" x2="30.5" y2="47.5" stroke="#34D399" strokeWidth="1.35" strokeLinecap="round" />
      <rect x="28.8" y="27" width="3.4" height="8.5" rx="0.8" fill="#10B981" stroke="#A7F3D0" strokeWidth="0.5" />

      {/* String 4: Ruby Red Consolidation Candlestick */}
      <line x1="35" y1="27.5" x2="35" y2="45" stroke="#FB7185" strokeWidth="1.35" strokeLinecap="round" />
      <rect x="33.3" y="30" width="3.4" height="7" rx="0.8" fill="#E11D48" stroke="#FDA4AF" strokeWidth="0.5" />

      {/* String 5: Upper Harmonic Emerald Candlestick */}
      <line x1="39.5" y1="26.5" x2="39.5" y2="39" stroke="#34D399" strokeWidth="1.35" strokeLinecap="round" />
      <rect x="37.9" y="28.5" width="3.2" height="5.5" rx="0.8" fill="#10B981" stroke="#6EE7B7" strokeWidth="0.5" />

      {/* SYMPHONY HARP GOLDEN CLASSICAL FRAME */}
      {/* Classical Fluted Column Pillar (Left) */}
      <path
        d="M16.5 18V47.5"
        stroke="url(#symphonyGold)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Column Capital & Base Rings */}
      <rect x="14.2" y="16.2" width="4.8" height="2.2" rx="0.8" fill="url(#symphonyGold)" />
      <rect x="14.5" y="24.5" width="4.2" height="1.6" rx="0.6" fill="url(#symphonyGold)" />
      <rect x="14.5" y="41.5" width="4.2" height="1.6" rx="0.6" fill="url(#symphonyGold)" />

      {/* Harmonic S-Curve Neck (Double Gold Contour) */}
      <path
        d="M18 18C24.5 17.5 28 24 34 26.2C38.2 27.6 41.5 23.5 44.5 24.8C46.4 25.6 46.6 28 45.2 30.5L34.5 47.5"
        stroke="url(#symphonyGold)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner Soundboard Diagonal Line */}
      <path
        d="M31.5 47.5L43 29"
        stroke="url(#symphonyGold)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* Stepped Harp Pedestal Base */}
      <path
        d="M13.5 48H37.5"
        stroke="url(#symphonyGold)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M12.5 50.2H38.5"
        stroke="url(#symphonyGold)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* FLOATING GOLDEN MUSICAL NOTES RISING FROM THE HARP */}
      {/* Note 1: Golden Eighth Note (♪) */}
      <g transform="translate(31, 11.5)">
        <ellipse
          cx="2.4"
          cy="7.2"
          rx="2.1"
          ry="1.5"
          transform="rotate(-20 2.4 7.2)"
          fill="#FDE68A"
        />
        <path
          d="M4.1 6.8V1.2C5.9 1.8 7 3.1 6.7 4.9"
          stroke="#FDE68A"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Note 2: Beamed Sixteenth Notes (♫) */}
      <g transform="translate(36.5, 16)">
        <ellipse
          cx="2"
          cy="6.8"
          rx="1.9"
          ry="1.4"
          transform="rotate(-20 2 6.8)"
          fill="#FBBF24"
        />
        <path
          d="M3.6 6.4V1.5L8 0.6V5.5"
          stroke="#FDE68A"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse
          cx="6.4"
          cy="5.9"
          rx="1.9"
          ry="1.4"
          transform="rotate(-20 6.4 5.9)"
          fill="#FBBF24"
        />
      </g>

      {/* Note 3: High Floating Golden Eighth Note (♪) */}
      <g transform="translate(42.5, 10.5)">
        <ellipse
          cx="2.2"
          cy="6.5"
          rx="1.9"
          ry="1.4"
          transform="rotate(-20 2.2 6.5)"
          fill="#FDE68A"
        />
        <path
          d="M3.8 6.1V1C5.4 1.6 6.4 2.7 6.1 4.3"
          stroke="#FDE68A"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

interface BackdropCandleItem {
  x: number;
  wickTop: number;
  wickBottom: number;
  bodyTop: number;
  bodyHeight: number;
  bullish: boolean;
  delay: string;
}

const HARMONIC_BANNER_CANDLES: BackdropCandleItem[] = [
  { x: 18, wickTop: 14, wickBottom: 52, bodyTop: 24, bodyHeight: 18, bullish: true, delay: '0s' },
  { x: 44, wickTop: 18, wickBottom: 56, bodyTop: 28, bodyHeight: 16, bullish: false, delay: '0.35s' },
  { x: 70, wickTop: 10, wickBottom: 48, bodyTop: 18, bodyHeight: 21, bullish: true, delay: '0.7s' },
  { x: 96, wickTop: 16, wickBottom: 54, bodyTop: 25, bodyHeight: 15, bullish: true, delay: '1.05s' },
  { x: 122, wickTop: 20, wickBottom: 58, bodyTop: 30, bodyHeight: 18, bullish: false, delay: '1.4s' },
  { x: 148, wickTop: 12, wickBottom: 50, bodyTop: 20, bodyHeight: 20, bullish: true, delay: '0.25s' },
  { x: 174, wickTop: 8, wickBottom: 46, bodyTop: 15, bodyHeight: 22, bullish: true, delay: '0.6s' },
  { x: 200, wickTop: 18, wickBottom: 55, bodyTop: 27, bodyHeight: 16, bullish: false, delay: '0.95s' },
  { x: 226, wickTop: 11, wickBottom: 49, bodyTop: 19, bodyHeight: 19, bullish: true, delay: '1.3s' },
  { x: 252, wickTop: 19, wickBottom: 56, bodyTop: 28, bodyHeight: 17, bullish: false, delay: '0.45s' },
  { x: 278, wickTop: 9, wickBottom: 47, bodyTop: 16, bodyHeight: 22, bullish: true, delay: '0.8s' },
  { x: 304, wickTop: 14, wickBottom: 51, bodyTop: 22, bodyHeight: 18, bullish: true, delay: '1.15s' },
  { x: 330, wickTop: 19, wickBottom: 55, bodyTop: 29, bodyHeight: 15, bullish: false, delay: '1.5s' },
  { x: 356, wickTop: 7, wickBottom: 45, bodyTop: 14, bodyHeight: 23, bullish: true, delay: '0.2s' },
];

/**
 * Faded, semi-transparent animated red and green candlesticks moving gently
 * up and down behind the Symphony Markets Academy brand banner—visualizing the market
 * as a harmonic musical score rather than chaotic noise.
 */
export const SymphonyCandlestickBackdrop: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 376 64"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`pointer-events-none select-none absolute inset-0 w-full h-full ${className}`}
    >
      {/* Subtle 5-Line Musical Staff / Harmonic Frequency Grid */}
      <line x1="0" y1="16" x2="376" y2="16" stroke="#D97706" strokeOpacity="0.12" strokeWidth="0.7" />
      <line x1="0" y1="32" x2="376" y2="32" stroke="#0284C7" strokeOpacity="0.12" strokeWidth="0.7" />
      <line x1="0" y1="48" x2="376" y2="48" stroke="#10B981" strokeOpacity="0.12" strokeWidth="0.7" />

      {/* Gentle Harmonic Sine Wave Connecting the Candlesticks */}
      <path
        d="M 0 38 Q 48 16, 96 32 T 192 28 T 288 30 T 376 20"
        fill="none"
        stroke="#F59E0B"
        strokeOpacity="0.24"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Faded Animated Green & Red Candlesticks */}
      {HARMONIC_BANNER_CANDLES.map((c) => {
        const strokeColor = c.bullish ? '#10B981' : '#F43F5E';
        const fillColor = c.bullish ? '#059669' : '#E11D48';
        return (
          <g
            key={c.x}
            className={c.bullish ? 'symphony-candle-up' : 'symphony-candle-down'}
            style={{
              animationDelay: c.delay,
              transformOrigin: `${c.x}px 32px`,
            }}
          >
            <line
              x1={c.x}
              y1={c.wickTop}
              x2={c.x}
              y2={c.wickBottom}
              stroke={strokeColor}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <rect
              x={c.x - 4.2}
              y={c.bodyTop}
              width="8.4"
              height={c.bodyHeight}
              rx="1.8"
              fill={fillColor}
            />
          </g>
        );
      })}
    </svg>
  );
};

