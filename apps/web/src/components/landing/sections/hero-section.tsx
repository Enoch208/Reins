import { MouseScroll01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type TypedSegment, useTypewriter } from "../use-typewriter";

const segments: readonly TypedSegment[] = [
  { text: "Runtime spending controls", delay: 900, step: 30 },
  { text: "for teams of AI agents", delay: 2100, step: 30 },
  { text: "One job, one budget,", delay: 400, step: 52 },
  { text: "across ", delay: 1500, step: 52 },
  { text: "every agent", delay: 1800, step: 52 },
];

export function HeroSection() {
  const [subFirst, subSecond, titleFirst, titleLead, titleAccent] = useTypewriter(segments);

  return (
    <section className="hero" id="hero">
      <p className="hero-sub">
        <span className="sr-only">Runtime spending controls for teams of AI agents</span>
        <span className="tline" aria-hidden>
          {subFirst}
        </span>
        <span className="tline" aria-hidden>
          {subSecond}
        </span>
      </p>
      <h1 className="hero-title">
        <span className="sr-only">One job, one budget, across every agent</span>
        <span className="tline" aria-hidden>
          {titleFirst}
        </span>
        <span className="tline serif" aria-hidden>
          {titleLead}
          <em className="accent">{titleAccent}</em>
        </span>
      </h1>
      <div className="scroll-cue" aria-hidden>
        <span>SCROLL DOWN</span>
        <HugeiconsIcon icon={MouseScroll01Icon} size={22} strokeWidth={1.4} />
      </div>
    </section>
  );
}
