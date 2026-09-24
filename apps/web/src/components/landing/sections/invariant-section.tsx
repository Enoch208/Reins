const notes = ["Before authorization.", "Not eventually.", "Not after settlement."] as const;

export function InvariantSection() {
  return (
    <section className="invariant-band" id="invariant">
      <div className="invariant" data-reveal>
        <div className="invariant-main">
          <span className="eyebrow">THE ONE RULE REINS ENFORCES</span>
          <p className="formula">
            Settled <span className="op">+</span> Reserved <span className="le">≤</span> Budget
          </p>
          <p className="invariant-sub">
            Every agent on a job, delegated children and replacement workers included, draws on this
            single line. A request that would break it is denied before any money moves.
          </p>
        </div>
        <ul className="invariant-notes">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
