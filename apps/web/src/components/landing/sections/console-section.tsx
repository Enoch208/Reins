import { Cancel01Icon, Clock01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef } from "react";
import stageArt from "@/assets/landing/console-stage.webp";
import { cx } from "@/lib/cx";
import { revealDelay } from "../reveal-delay";
import { useFitScale } from "../use-fit-scale";

type TileTone = "reserved" | "settled" | "denied";

interface Column {
  readonly state: string;
  readonly icon: IconSvgElement;
  readonly tone: TileTone;
  readonly tiles: readonly string[];
}

const sideItems = ["Overview", "Jobs", "Agents", "Ledger", "Evidence", "Policies"] as const;

const columns: readonly Column[] = [
  {
    state: "RESERVED",
    icon: Clock01Icon,
    tone: "reserved",
    tiles: ["MARKET DATA", "VERIFY"],
  },
  {
    state: "SETTLED",
    icon: Tick02Icon,
    tone: "settled",
    tiles: ["RESEARCH API", "ENRICHMENT"],
  },
  {
    state: "DENIED",
    icon: Cancel01Icon,
    tone: "denied",
    tiles: ["PREMIUM DATASET", "UNLISTED VENDOR"],
  },
];

const consoleDesignWidth = 1260;

export function ConsoleSection() {
  const faceRef = useRef<HTMLDivElement>(null);
  useFitScale(faceRef, consoleDesignWidth);

  return (
    <section className="section" id="console">
      <div className="section-head" data-reveal>
        <h2 className="section-title">
          One console
          <br />
          for every job you <span className="serif">fund</span>
        </h2>
        <p className="section-sub">
          Budgets, reservations and receipts share one surface, so every amount an agent commits
          traces back to the job that caused it.
        </p>
      </div>
      <div className="console-stage" data-reveal style={revealDelay(0.18)}>
        <img
          className="console-stage-art"
          src={stageArt}
          alt=""
          width={1896}
          height={829}
          loading="lazy"
          decoding="async"
        />
        <div className="console-stage-face" ref={faceRef}>
          <div className="app" aria-hidden>
            <div className="app-bar">
              <i className="dot" />
              <i className="dot" />
              <i className="dot" />
              <span className="title">reins / jobs · competitor intelligence</span>
            </div>
            <aside className="app-side">
              {sideItems.map((item, index) => (
                <div key={item} className={cx("side-item", index === 0 && "on")}>
                  <i />
                  {item}
                </div>
              ))}
            </aside>
            <div className="app-main">
              {columns.map((column) => (
                <div key={column.state}>
                  <div className="col-head">
                    <span>{column.state}</span>
                    <span>
                      <HugeiconsIcon icon={column.icon} size={14} strokeWidth={2} />
                    </span>
                  </div>
                  {column.tiles.map((chip) => (
                    <div key={chip} className={cx("tile", column.tone)}>
                      <span className="chip">{chip}</span>
                      <div className="bar" />
                      <div className="bar" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
