import type { EvidenceView, LedgerEntryView } from "@reins/core";
import { DecisionChip } from "@/components/status/chips";
import { formatTime } from "@/lib/labels";
import { formatAmount } from "@/lib/money";
import { DenialBanner } from "./denial-banner";
import { EvidenceRow, EvidenceSection, Pending } from "./evidence-row";
import { PolicyResults } from "./policy-results";
import { SettlementSections } from "./settlement-section";

export function EvidenceDetail({
  evidence,
  entry,
}: {
  evidence: EvidenceView;
  entry: LedgerEntryView;
}) {
  const { job } = evidence;
  const agent = evidence.agents.find((item) => item.id === entry.agentId) ?? null;
  const parent = evidence.agents.find((item) => item.id === entry.parentAgentId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      {entry.decision === "DENIED" && <DenialBanner entry={entry} currency={job.currency} />}
      <EvidenceSection step={1} title="Purchase">
        <dl>
          <EvidenceRow label="Service">
            <span className="font-mono text-[14px]">{entry.service}</span>
          </EvidenceRow>
          <EvidenceRow label="Amount">
            <span className="font-mono tabular-nums">{formatAmount(entry.amount)}</span>{" "}
            {job.currency}
          </EvidenceRow>
          <EvidenceRow label="Operation">
            <span className="font-mono text-[14px] break-all">{entry.operationId}</span>
          </EvidenceRow>
          <EvidenceRow label="Requested at">{formatTime(entry.createdAt)}</EvidenceRow>
        </dl>
      </EvidenceSection>
      <EvidenceSection step={2} title="Requested by">
        <dl>
          <EvidenceRow label="Agent">
            {agent ? (
              <>
                {agent.name} <span className="text-muted">· {agent.role}</span>
              </>
            ) : (
              (entry.agentName ?? <Pending>Agent not on this job</Pending>)
            )}
          </EvidenceRow>
          <EvidenceRow label="Delegated by">
            {parent ? parent.name : <Pending>No parent agent</Pending>}
          </EvidenceRow>
          <EvidenceRow label="Job">
            {job.title} <span className="text-muted">· {job.customer}</span>
          </EvidenceRow>
        </dl>
      </EvidenceSection>
      <EvidenceSection step={3} title="Policy decision">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <DecisionChip decision={entry.decision} />
          <span className="text-sm text-muted">
            <span className="font-mono tabular-nums">
              {formatAmount(entry.availableAtDecision)}
            </span>{" "}
            {job.currency} available at decision
          </span>
        </div>
        <PolicyResults entry={entry} />
      </EvidenceSection>
      {entry.authorization ? (
        <SettlementSections authorization={entry.authorization} currency={job.currency} />
      ) : (
        <EvidenceSection step={4} title="Reservation">
          <p className="text-[15px] text-muted">
            {entry.decision === "DENIED"
              ? "Nothing was reserved and no payment was attempted. The job budget is unchanged by this request."
              : "The API returned no authorization for this approved request."}
          </p>
        </EvidenceSection>
      )}
    </div>
  );
}
