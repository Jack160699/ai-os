/**
 * Abstract system constellations — SVG only, CSS-driven slow motion (no JS).
 * Variants match narrative: broken → forming → modules → control.
 */
export function SectionSystemGraphic({ variant = "fragmented", className = "" }) {
  const base = "sx-sys-graphic w-full max-w-3xl select-none text-[rgb(148,180,220)]";

  if (variant === "fragmented") {
    return (
      <div className={`${base} ${className}`} aria-hidden>
        <svg viewBox="0 0 480 140" className="h-28 w-full sm:h-32" fill="none">
          <line x1="40" y1="90" x2="120" y2="45" className="sx-sys-line sx-sys-line--faint sx-sys-line--dash" />
          <line x1="120" y1="45" x2="200" y2="95" className="sx-sys-line sx-sys-line--broken sx-sys-line--faint" />
          <line x1="200" y1="95" x2="290" y2="40" className="sx-sys-line sx-sys-line--faint" />
          <line x1="290" y1="40" x2="380" y2="100" className="sx-sys-line sx-sys-line--ghost" />
          <line x1="380" y1="100" x2="440" y2="55" className="sx-sys-line sx-sys-line--dash sx-sys-line--faint" />
          <circle cx="40" cy="90" r="3" className="sx-sys-node" />
          <circle cx="120" cy="45" r="2.5" className="sx-sys-node sx-sys-node--dim" />
          <circle cx="200" cy="95" r="2.5" className="sx-sys-node sx-sys-node--dim" />
          <circle cx="290" cy="40" r="3" className="sx-sys-node" />
          <circle cx="380" cy="100" r="2" className="sx-sys-node sx-sys-node--dim" />
          <circle cx="440" cy="55" r="2" className="sx-sys-node sx-sys-node--off" />
        </svg>
      </div>
    );
  }

  if (variant === "forming") {
    return (
      <div className={`${base} ${className}`} aria-hidden>
        <svg viewBox="0 0 480 140" className="h-28 w-full sm:h-32" fill="none">
          <line x1="48" y1="88" x2="130" y2="42" className="sx-sys-line sx-sys-line--draw sx-sys-delay-1" />
          <line x1="130" y1="42" x2="215" y2="92" className="sx-sys-line sx-sys-line--draw sx-sys-delay-2" />
          <line x1="215" y1="92" x2="305" y2="38" className="sx-sys-line sx-sys-line--draw sx-sys-delay-3" />
          <line x1="305" y1="38" x2="395" y2="98" className="sx-sys-line sx-sys-line--draw sx-sys-delay-4" />
          <line x1="395" y1="98" x2="448" y2="52" className="sx-sys-line sx-sys-line--draw sx-sys-delay-5" />
          <circle cx="48" cy="88" r="3" className="sx-sys-node sx-sys-node--pulse" />
          <circle cx="130" cy="42" r="2.8" className="sx-sys-node sx-sys-node--pulse sx-sys-delay-1" />
          <circle cx="215" cy="92" r="2.8" className="sx-sys-node sx-sys-node--pulse sx-sys-delay-2" />
          <circle cx="305" cy="38" r="3" className="sx-sys-node sx-sys-node--pulse sx-sys-delay-3" />
          <circle cx="395" cy="98" r="2.6" className="sx-sys-node sx-sys-node--pulse sx-sys-delay-4" />
          <circle cx="448" cy="52" r="2.6" className="sx-sys-node sx-sys-node--pulse sx-sys-delay-5" />
        </svg>
      </div>
    );
  }

  if (variant === "modules") {
    return (
      <div className={`${base} ${className}`} aria-hidden>
        <svg viewBox="0 0 480 150" className="h-32 w-full sm:h-36" fill="none">
          <g className="sx-sys-module">
            <rect x="32" y="40" width="120" height="70" rx="10" className="sx-sys-mod-rect" />
            <line x1="52" y1="62" x2="100" y2="62" className="sx-sys-line sx-sys-line--inner" />
            <line x1="52" y1="78" x2="92" y2="78" className="sx-sys-line sx-sys-line--inner" />
            <circle cx="130" cy="75" r="2.5" className="sx-sys-node" />
          </g>
          <g className="sx-sys-module sx-sys-delay-2">
            <rect x="180" y="32" width="120" height="86" rx="10" className="sx-sys-mod-rect" />
            <line x1="200" y1="55" x2="255" y2="55" className="sx-sys-line sx-sys-line--inner" />
            <circle cx="240" cy="88" r="2.5" className="sx-sys-node sx-sys-node--pulse" />
          </g>
          <g className="sx-sys-module sx-sys-delay-4">
            <rect x="328" y="44" width="120" height="62" rx="10" className="sx-sys-mod-rect" />
            <line x1="348" y1="68" x2="408" y2="68" className="sx-sys-line sx-sys-line--inner" />
          </g>
          <line x1="152" y1="75" x2="180" y2="75" className="sx-sys-line sx-sys-line--bridge" />
          <line x1="300" y1="75" x2="328" y2="75" className="sx-sys-line sx-sys-line--bridge" />
        </svg>
      </div>
    );
  }

  /* control */
  return (
    <div className={`${base} ${className}`} aria-hidden>
      <svg viewBox="0 0 480 120" className="h-24 w-full sm:h-28" fill="none">
        <rect x="36" y="28" width="168" height="64" rx="12" className="sx-sys-panel-outline sx-sys-panel-glow" />
        <line x1="56" y1="52" x2="150" y2="52" className="sx-sys-line sx-sys-line--inner" />
        <line x1="56" y1="68" x2="130" y2="68" className="sx-sys-line sx-sys-line--inner" />
        <circle cx="170" cy="60" r="3" className="sx-sys-node sx-sys-node--pulse" />
        <line x1="204" y1="60" x2="276" y2="60" className="sx-sys-line sx-sys-line--bridge" />
        <circle cx="276" cy="60" r="3" className="sx-sys-node sx-sys-node--pulse sx-sys-delay-2" />
        <rect x="308" y="28" width="136" height="64" rx="12" className="sx-sys-panel-outline sx-sys-panel-glow sx-sys-delay-3" />
        <line x1="328" y1="50" x2="404" y2="50" className="sx-sys-line sx-sys-line--inner" />
        <line x1="328" y1="66" x2="388" y2="66" className="sx-sys-line sx-sys-line--inner" />
      </svg>
    </div>
  );
}
