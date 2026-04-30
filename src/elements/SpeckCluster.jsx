import { useMemo } from 'react';

const SPECK_COLORS = {
  purple: 'var(--holi-purple)',
  saffron: 'var(--holi-saffron)',
  blush: 'var(--holi-blush)',
  mango: 'var(--holi-mango)',
};

// Bunte Pulver-Punkte wie auf dem Holi-Brand-Board. Positionen sind
// pseudo-zufällig, aber stabil pro Mount via useMemo.
export const SpeckCluster = ({ color = 'saffron', count = 14, size = 120, className = '', style = {} }) => {
  const fill = SPECK_COLORS[color] || color;
  const dots = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        cx: Math.random() * 100,
        cy: Math.random() * 100,
        r: 0.6 + Math.random() * 1.6,
        o: 0.4 + Math.random() * 0.5,
      })),
    [count]
  );
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      style={style}
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={fill} opacity={d.o} />
      ))}
    </svg>
  );
};
