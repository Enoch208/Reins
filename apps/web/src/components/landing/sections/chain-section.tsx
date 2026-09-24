import { cx } from "@/lib/cx";
import jobArt from "@/assets/landing/chain-job.webp";
import policyArt from "@/assets/landing/chain-policy.webp";
import reservationArt from "@/assets/landing/chain-reservation.webp";
import receiptArt from "@/assets/landing/chain-receipt.webp";
import deliverableArt from "@/assets/landing/chain-deliverable.webp";
import { revealDelay } from "../reveal-delay";

interface Link {
  readonly label: string;
  readonly caption: string;
  readonly art: string;
  readonly artSize: readonly [number, number];
  readonly focus: string;
  readonly delay: number | null;
}

const links: readonly Link[] = [
  {
    label: "JOB",
    caption:
      "Revenue, a spend ceiling, a per-purchase limit, the allowed services and an expiry. Every agent inherits it.",
    art: jobArt,
    artSize: [1400, 788],
    focus: "78% 60%",
    delay: null,
  },
  {
    label: "POLICY",
    caption: "Eight checks, one deterministic answer.",
    art: policyArt,
    artSize: [1400, 933],
    focus: "70% 55%",
    delay: 0.1,
  },
  {
    label: "RESERVATION",
    caption: "Capacity committed before money moves.",
    art: reservationArt,
    artSize: [1400, 788],
    focus: "82% 55%",
    delay: 0.2,
  },
  {
    label: "X LAYER RECEIPT",
    caption: "Settlement evidence on OKX's network.",
    art: receiptArt,
    artSize: [1400, 933],
    focus: "72% 45%",
    delay: 0.3,
  },
  {
    label: "DELIVERABLE",
    caption: "What each purchase produced for the customer.",
    art: deliverableArt,
    artSize: [1400, 788],
    focus: "84% 60%",
    delay: 0.4,
  },
];

export function ChainSection() {
  return (
    <section className="section" id="chain">
      <div className="section-head" data-reveal>
        <h2 className="section-title">
          The causal <span className="serif">chain</span>
          <br />
          behind every payment
        </h2>
      </div>
      <div className="gallery">
        {links.map((link, index) => (
          <figure
            key={link.label}
            className={cx("shot", index === 0 && "big")}
            data-reveal
            style={revealDelay(link.delay)}
          >
            <img
              className="shot-art"
              src={link.art}
              alt=""
              width={link.artSize[0]}
              height={link.artSize[1]}
              loading="lazy"
              decoding="async"
              style={{ objectPosition: link.focus }}
            />
            <span>{link.label}</span>
            <figcaption className="shot-body">
              <p>{link.caption}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
