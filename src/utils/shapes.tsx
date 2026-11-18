import React from 'react';

// Editorial high-contrast shape palette tuned for Alabaster Paper (#FCFBF8) surfaces
export const COLORS: Record<string, string> = {
  ink: '#171717',
  vermilion: '#D9381E',
  stone: '#787670',
  blue: '#1D4ED8',
  red: '#D9381E',
  green: '#1F6F54',
  amber: '#B45309',
  purple: '#5B21B6',
  teal: '#0F766E',
  cyan: '#D9381E',
  navy: '#171717',
  white: '#FCFBF8',
};

export const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'hex'] as const;
export type ShapeName = typeof SHAPES[number];

function starPath(cx: number, cy: number, R: number, r: number, p = 5): string {
  let d = '';
  for (let i = 0; i < p * 2; i++) {
    const ang = (Math.PI / p) * i - Math.PI / 2;
    const rad = i % 2 ? r : R;
    d += (i ? 'L' : 'M') + (cx + rad * Math.cos(ang)).toFixed(1) + ' ' + (cy + rad * Math.sin(ang)).toFixed(1) + ' ';
  }
  return d + 'Z';
}

function hexPath(cx: number, cy: number, R: number): string {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI / 3) * i - Math.PI / 6;
    d += (i ? 'L' : 'M') + (cx + R * Math.cos(ang)).toFixed(1) + ' ' + (cy + R * Math.sin(ang)).toFixed(1) + ' ';
  }
  return d + 'Z';
}

interface ShapeProps {
  name: string;
  color?: string;
  size?: number;
  filled?: boolean;
  className?: string;
}

export const Shape: React.FC<ShapeProps> = ({
  name,
  color = 'ink',
  size = 34,
  filled = true,
  className = '',
}) => {
  const c = COLORS[color] || color || '#171717';
  const s = size;
  const h = s / 2;
  const strokeWidth = Math.max(2, Math.round(s / 11));

  const fillAttr = filled ? c : 'none';
  const strokeAttr = filled ? 'none' : c;

  let content: React.ReactNode = null;

  switch (name) {
    case 'circle':
      content = (
        <circle
          cx={h}
          cy={h}
          r={Math.max(2, h - strokeWidth - 1)}
          fill={fillAttr}
          stroke={strokeAttr}
          strokeWidth={strokeWidth}
        />
      );
      break;
    case 'square':
      content = (
        <rect
          x={strokeWidth}
          y={strokeWidth}
          width={s - strokeWidth * 2}
          height={s - strokeWidth * 2}
          rx={Math.max(2, Math.round(s / 9))}
          fill={fillAttr}
          stroke={strokeAttr}
          strokeWidth={strokeWidth}
        />
      );
      break;
    case 'triangle':
      content = (
        <polygon
          points={`${h},${strokeWidth} ${s - strokeWidth},${s - strokeWidth} ${strokeWidth},${s - strokeWidth}`}
          fill={fillAttr}
          stroke={strokeAttr}
          strokeWidth={strokeWidth}
        />
      );
      break;
    case 'diamond':
      content = (
        <polygon
          points={`${h},${strokeWidth} ${s - strokeWidth},${h} ${h},${s - strokeWidth} ${strokeWidth},${h}`}
          fill={fillAttr}
          stroke={strokeAttr}
          strokeWidth={strokeWidth}
        />
      );
      break;
    case 'star':
      content = (
        <path
          d={starPath(h, h, h - strokeWidth, (h - strokeWidth) / 2.3, 5)}
          fill={fillAttr}
          stroke={strokeAttr}
          strokeWidth={strokeWidth}
        />
      );
      break;
    case 'hex':
      content = (
        <path
          d={hexPath(h, h, h - strokeWidth)}
          fill={fillAttr}
          stroke={strokeAttr}
          strokeWidth={strokeWidth}
        />
      );
      break;
    default:
      content = (
        <circle
          cx={h}
          cy={h}
          r={h - strokeWidth - 1}
          fill={fillAttr}
          stroke={strokeAttr}
          strokeWidth={strokeWidth}
        />
      );
  }

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      className={`shape-svg inline-block shrink-0 ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {content}
    </svg>
  );
};
