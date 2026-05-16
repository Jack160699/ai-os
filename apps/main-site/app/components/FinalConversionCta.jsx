import Link from "next/link";
import { CONTACT } from "@stratxcel/config";
import { SectionReveal } from "./SectionReveal";

function waHref(prefill) {
  const digits = String(CONTACT.whatsapp || "").replace(/[^\d]/g, "");
  const q = prefill ? `?text=${encodeURIComponent(prefill)}` : "";
  return `https://wa.me/${digits}${q}`;
}

const primaryBtn =
  "sx-cta-primary inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-sky-500/32 bg-[#0B0F19]/95 px-8 text-[14px] font-semibold tracking-[-0.016em] text-[#E5E7EB] transition-[transform,box-shadow,border-color] duration-300 ease-out active:translate-y-0 sm:w-auto sm:min-w-[12.5rem]";

const secondaryBtn =
  "inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-white/[0.16] bg-white/[0.05] px-8 text-[14px] font-semibold tracking-[-0.016em] text-[#E5E7EB] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] backdrop-blur-md transition-[transform,background-color,border-color] duration-300 ease-out hover:border-white/22 hover:bg-white/[0.08] active:translate-y-0 sm:w-auto sm:min-w-[12.5rem]";

/**
 * Final homepage CTA — keeps `#final-cta` for sticky CTA visibility logic.
 */
export function FinalConversionCta() {
  return (
    <section id="final-cta" className="sx-section-space sx-cta-focus-zone">
      <SectionReveal>
        <div className="sx-container sx-container--narrow">
          <div className="sx-hero-soft-in relative mx-auto max-w-[36rem] overflow-hidden rounded-[1.75rem] border border-white/[0.1] bg-[#0B0F19]/55 px-6 py-10 text-center shadow-[0_0_0_1px_rgba(0,0,0,0.5)_inset,0_32px_80px_-40px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:rounded-[2rem] sm:px-10 sm:py-12">
            <div
              className="pointer-events-none absolute -left-1/3 top-0 h-[55%] w-[90%] rounded-full bg-sky-500/[0.06] blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-1/4 bottom-0 h-[45%] w-[70%] rounded-full bg-indigo-500/[0.05] blur-3xl"
              aria-hidden
            />

            <div className="relative">
              <h2 className="text-balance text-[1.4rem] font-semibold leading-snug tracking-[-0.032em] text-zinc-50 sm:text-[1.65rem] lg:text-[1.75rem]">
                Ready to simplify and grow your business?
              </h2>
              <p className="mx-auto mt-5 max-w-[40ch] text-[15px] leading-relaxed text-zinc-400 sm:text-[16px]">
                One calm next step. Tell us what you&apos;re building — we&apos;ll meet you with honesty, not hype.
              </p>

              <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <Link href="/#contact" className={primaryBtn}>
                  Book Free Call
                </Link>
                <a
                  href={waHref("Hi — I'd like to chat with StratXcel about growing my business.")}
                  className={secondaryBtn}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chat on WhatsApp
                </a>
              </div>

              <p className="mt-8 text-[12px] leading-relaxed tracking-[0.02em] text-zinc-500">
                Real people. Thoughtful replies. No spammy follow-ups.
              </p>
            </div>
          </div>
        </div>
      </SectionReveal>
    </section>
  );
}
