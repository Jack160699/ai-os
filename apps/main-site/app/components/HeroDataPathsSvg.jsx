/** Subtle animated routes — SVG stroke-dash, luxury tempo. */
export function HeroDataPathsSvg() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[2] h-full min-h-[100dvh] w-full opacity-[0.55]"
      viewBox="0 0 1200 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="sx-hero-path-grad-a" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(148,163,184)" stopOpacity="0" />
          <stop offset="45%" stopColor="rgb(186,198,220)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="rgb(148,163,184)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sx-hero-path-grad-b" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgb(96,165,250)" stopOpacity="0" />
          <stop offset="50%" stopColor="rgb(147,197,253)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="rgb(96,165,250)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        className="sx-hero-path-flow"
        d="M -40 320 Q 280 220 520 380 T 1240 300"
        fill="none"
        stroke="url(#sx-hero-path-grad-a)"
        strokeWidth="0.75"
        vectorEffect="nonScalingStroke"
      />
      <path
        className="sx-hero-path-flow sx-hero-path-flow-delayed"
        d="M -20 620 C 200 720 420 480 620 560 S 980 480 1220 640"
        fill="none"
        stroke="url(#sx-hero-path-grad-b)"
        strokeWidth="0.65"
        vectorEffect="nonScalingStroke"
      />
      <path
        className="sx-hero-path-flow-reverse"
        d="M 200 -20 Q 340 200 280 420 T 520 920"
        fill="none"
        stroke="url(#sx-hero-path-grad-a)"
        strokeWidth="0.55"
        vectorEffect="nonScalingStroke"
      />
    </svg>
  );
}
