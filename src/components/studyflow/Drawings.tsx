"use client";

import type { CSSProperties } from "react";

/**
 * Hand-drawn-style line illustrations — warm, sketchy outlines that add
 * editorial warmth without emoji or stock imagery. Stroke uses ink-secondary
 * so they sit quietly as accents.
 */

const STROKE = "#6B5D56";
const SW = 1.5;

interface DrawProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function DrawBooks({ size = 96, className, style }: DrawProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      className={className}
      style={style}
      aria-hidden
    >
      <g stroke={STROKE} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* stack of books, slightly skewed for hand-drawn feel */}
        <path d="M14 70 L62 70 L62 78 L14 78 Z" fill="rgba(232,160,172,0.10)" />
        <path d="M14 70 L62 70 L62 78 L14 78 Z" />
        <path d="M18 70 L18 78 M22 70 L22 78" opacity="0.5" />
        <path d="M16 60 L66 60 L66 68 L16 68 Z" fill="rgba(143,168,148,0.10)" />
        <path d="M16 60 L66 60 L66 68 L16 68 Z" />
        <path d="M20 60 L20 68" opacity="0.5" />
        <path d="M22 50 L70 50 L70 58 L22 58 Z" fill="rgba(217,165,102,0.12)" />
        <path d="M22 50 L70 50 L70 58 L22 58 Z" />
        {/* open book on top */}
        <path d="M28 38 L48 36 L48 50 L28 52 Z" fill="rgba(255,255,255,0.5)" />
        <path d="M48 36 L68 38 L68 52 L48 50 Z" fill="rgba(255,255,255,0.5)" />
        <path d="M28 38 L48 36 L68 38 L48 36 Z" />
        <path d="M28 52 L48 50 L68 52" />
        <path d="M48 36 L48 50" />
        <path d="M33 43 L44 42 M33 47 L44 46" opacity="0.6" />
        <path d="M52 42 L63 43 M52 46 L63 47" opacity="0.6" />
        {/* small sparkle */}
        <path d="M76 30 L76 36 M73 33 L79 33" opacity="0.7" />
      </g>
    </svg>
  );
}

export function DrawClock({ size = 96, className, style }: DrawProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      className={className}
      style={style}
      aria-hidden
    >
      <g stroke={STROKE} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* clock face — slightly imperfect circle for hand-drawn feel */}
        <path
          d="M48 14 C68 14 82 28 82 48 C82 68 68 82 48 82 C28 82 14 68 14 48 C14 28 28 14 48 14 Z"
          fill="rgba(255,255,255,0.6)"
        />
        <path d="M48 14 C68 14 82 28 82 48 C82 68 68 82 48 82 C28 82 14 68 14 48 C14 28 28 14 48 14 Z" />
        {/* tick marks */}
        <path d="M48 20 L48 24 M74 48 L70 48 M48 74 L48 70 M22 48 L26 48" opacity="0.6" />
        <path d="M66 30 L63 33 M66 66 L63 63 M30 66 L33 63 M30 30 L33 33" opacity="0.4" />
        {/* hands */}
        <path d="M48 48 L48 32" strokeWidth={2} />
        <path d="M48 48 L60 52" strokeWidth={2} />
        <circle cx="48" cy="48" r="2.5" fill={STROKE} />
        {/* motion lines */}
        <path d="M84 40 L88 38 M84 56 L88 58" opacity="0.5" />
      </g>
    </svg>
  );
}

export function DrawCap({ size = 96, className, style }: DrawProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      className={className}
      style={style}
      aria-hidden
    >
      <g stroke={STROKE} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* mortarboard — diamond top */}
        <path d="M48 22 L82 36 L48 50 L14 36 Z" fill="rgba(232,160,172,0.14)" />
        <path d="M48 22 L82 36 L48 50 L14 36 Z" />
        {/* cap base under board */}
        <path d="M34 41 L34 56 C34 60 40 64 48 64 C56 64 62 60 62 56 L62 41" fill="rgba(255,255,255,0.5)" />
        <path d="M34 41 L34 56 C34 60 40 64 48 64 C56 64 62 60 62 56 L62 41" />
        {/* tassel */}
        <path d="M82 36 L82 54" />
        <path d="M82 54 L78 64 M82 54 L86 64 M82 54 L80 65 M82 54 L84 65" />
        <circle cx="82" cy="34" r="2" fill={STROKE} />
        {/* sparkle */}
        <path d="M24 24 L24 30 M21 27 L27 27" opacity="0.6" />
      </g>
    </svg>
  );
}

export function DrawNotebook({ size = 96, className, style }: DrawProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      className={className}
      style={style}
      aria-hidden
    >
      <g stroke={STROKE} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M26 18 L66 18 L66 80 L26 80 Z" fill="rgba(255,255,255,0.6)" />
        <path d="M26 18 L66 18 L66 80 L26 80 Z" />
        {/* spiral binding */}
        <path d="M26 26 L22 26 M26 34 L22 34 M26 42 L22 42 M26 50 L22 50 M26 58 L22 58 M26 66 L22 66 M26 74 L22 74" />
        {/* lines on page */}
        <path d="M34 32 L58 32 M34 40 L58 40 M34 48 L52 48" opacity="0.5" />
        {/* checkmark */}
        <path d="M58 60 L62 64 L70 54" strokeWidth={2} stroke="#8FA894" />
      </g>
    </svg>
  );
}

export function DrawRocket({ size = 96, className, style }: DrawProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      className={className}
      style={style}
      aria-hidden
    >
      <g stroke={STROKE} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* rocket body */}
        <path d="M48 14 C58 24 62 38 62 52 L62 64 L34 64 L34 52 C34 38 38 24 48 14 Z" fill="rgba(232,160,172,0.14)" />
        <path d="M48 14 C58 24 62 38 62 52 L62 64 L34 64 L34 52 C34 38 38 24 48 14 Z" />
        {/* window */}
        <circle cx="48" cy="38" r="6" fill="rgba(143,168,148,0.2)" />
        <circle cx="48" cy="38" r="6" />
        <circle cx="48" cy="38" r="2.5" fill={STROKE} />
        {/* fins */}
        <path d="M34 56 L26 66 L34 64 Z" fill="rgba(255,255,255,0.5)" />
        <path d="M34 56 L26 66 L34 64 Z" />
        <path d="M62 56 L70 66 L62 64 Z" fill="rgba(255,255,255,0.5)" />
        <path d="M62 56 L70 66 L62 64 Z" />
        {/* flame */}
        <path d="M44 64 L42 74 L46 72 L48 78 L50 72 L54 74 L52 64" strokeWidth={1.5} stroke="#D9A566" fill="rgba(217,165,102,0.2)" />
        {/* stars */}
        <path d="M22 28 L22 32 M20 30 L24 30" opacity="0.6" />
        <path d="M74 22 L74 26 M72 24 L76 24" opacity="0.6" />
      </g>
    </svg>
  );
}
