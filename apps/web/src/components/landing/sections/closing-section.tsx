import { GithubIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";
import { appRoutes } from "@/lib/routes";

const repositoryUrl = "https://github.com/Enoch208/Reins";

const states = ["RESERVE", "SETTLE", "RELEASE", "RECONCILE", "DELEGATE", "REPLACE", "REVOKE"];

export function ClosingSection() {
  return (
    <>
      <section className="cta" id="cta">
        <div className="section-head" data-reveal style={{ marginBottom: 0 }}>
          <h2 className="section-title">
            Give every job
            <br />a financial <span className="serif">boundary</span>
          </h2>
          <p className="section-sub">
            Reins sits in front of the OKX Agentic Wallet and decides, before any money moves,
            whether an agent may spend.
          </p>
          <div className="cta-actions">
            <Link className="btn-dark" to={appRoutes.dashboard}>
              Open the console
            </Link>
            <a className="btn-ghost" href="#how-it-works">
              See how it works
            </a>
          </div>
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="ask-band">
          <h2>Read the code behind it</h2>
          <a href={repositoryUrl} target="_blank" rel="noreferrer">
            github.com/Enoch208/Reins
          </a>
        </div>
        <div className="tags">
          {states.map((state) => (
            <span key={state} className="tag">
              {state}
            </span>
          ))}
        </div>
        <footer className="foot">
          <small>© 2026 Reins. Runtime spending controls for AI agents.</small>
          <div className="socials">
            <a href={repositoryUrl} target="_blank" rel="noreferrer" aria-label="Reins on GitHub">
              <HugeiconsIcon icon={GithubIcon} size={22} strokeWidth={1.6} aria-hidden />
            </a>
          </div>
        </footer>
      </section>
    </>
  );
}
