import type { ServiceSpend } from "@reins/core";
import { formatAmount, microsOf, percentOf } from "@/lib/money";
import { BarRow } from "./bar-row";
import { Panel } from "./panel";

function Swatch({ fill, label }: { fill: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className={`size-2 rounded-full ${fill}`} aria-hidden />
      {label}
    </span>
  );
}

export function SpendByServiceCard({ services }: { services: readonly ServiceSpend[] }) {
  const totals = services.map((item) => ({
    item,
    settled: microsOf(item.settled),
    committed: microsOf(item.committed),
  }));
  const largest = Math.max(0, ...totals.map((row) => row.settled + row.committed));

  return (
    <Panel
      title="Spend by service"
      description="Settled payments and capacity still committed, per paid service."
    >
      <div className="mb-4 flex gap-4">
        <Swatch fill="bg-settled" label="Settled" />
        <Swatch fill="bg-reserved" label="Committed" />
      </div>
      {totals.length === 0 ? (
        <p className="rounded-[14px] border border-dashed border-line px-4 py-5 text-center text-sm text-muted">
          No service has been paid for yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3.5" aria-label="Spend by service">
          {totals.map(({ item, settled, committed }) => (
            <BarRow
              key={item.service}
              label={
                <>
                  <span className="font-mono text-[13px]">{item.service}</span>
                  <span className="ml-2 text-xs text-caption">
                    {item.purchases} {item.purchases === 1 ? "purchase" : "purchases"}
                  </span>
                </>
              }
              value={
                <>
                  <span className="sr-only">Settled </span>
                  {formatAmount(item.settled)}
                  <span className="text-caption">
                    <span aria-hidden> / </span>
                    <span className="sr-only">, committed </span>
                    {formatAmount(item.committed)}
                  </span>
                </>
              }
              parts={[
                { key: "settled", percent: percentOf(settled, largest), fill: "bg-settled" },
                { key: "committed", percent: percentOf(committed, largest), fill: "bg-reserved" },
              ]}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}
