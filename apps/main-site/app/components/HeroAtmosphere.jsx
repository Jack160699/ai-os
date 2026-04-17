/** Slow parallax light fields — pure CSS, no interaction. */
export function HeroAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] min-h-[100dvh] overflow-hidden" aria-hidden>
      <div className="sx-hero-orbit-a absolute -left-[25%] top-[-15%] h-[65%] w-[70%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.14),transparent_68%)] blur-[100px]" />
      <div className="sx-hero-orbit-b absolute -right-[20%] top-[20%] h-[55%] w-[60%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(148,163,184,0.1),transparent_70%)] blur-[90px]" />
      <div className="sx-hero-orbit-c absolute bottom-[-10%] left-[15%] h-[50%] w-[85%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.55),transparent_65%)] blur-[80px]" />
    </div>
  );
}
