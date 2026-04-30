import { useId } from 'react';

const SPLASH_COLORS = {
  purple: 'var(--holi-purple)',
  saffron: 'var(--holi-saffron)',
  blush: 'var(--holi-blush)',
  mango: 'var(--holi-mango)',
};

// Dekoratives, weich gerendertes Color-Splash-Blob – pure SVG, keine Assets.
export const Splash = ({ color = 'purple', size = 220, opacity = 0.5, className = '', style = {} }) => {
  const fill = SPLASH_COLORS[color] || color;
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      style={{ filter: 'blur(14px)', ...style }}
    >
      <defs>
        <radialGradient id={id} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={fill} stopOpacity={opacity} />
          <stop offset="55%" stopColor={fill} stopOpacity={opacity * 0.5} />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill={`url(#${id})`} />
    </svg>
  );
};
