import type { ReactNode } from "react";

export function EvidenceRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line/60 py-3 last:border-b-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
      <dt className="text-sm text-caption">{label}</dt>
      <dd className="min-w-0 text-[15px] text-ink">{children}</dd>
    </div>
  );
}

export function Pending({ children }: { children: ReactNode }) {
  return <span className="text-muted italic">{children}</span>;
}

export function EvidenceSection({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`evidence-step-${String(step)}`}
      className="glass rounded-[22px] p-5 sm:p-6"
    >
      <h2
        id={`evidence-step-${String(step)}`}
        className="mb-2 flex items-center gap-3 text-base font-medium"
      >
        <span className="flex size-6 items-center justify-center rounded-full border border-line bg-white/80 font-mono text-xs text-muted">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
