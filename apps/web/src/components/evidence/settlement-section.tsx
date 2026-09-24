import type { AuthorizationState, AuthorizationView } from "@reins/core";
import { AuthorizationChip } from "@/components/status/chips";
import { formatTime } from "@/lib/labels";
import { formatAmount } from "@/lib/money";
import { EvidenceRow, EvidenceSection, Pending } from "./evidence-row";
import { HashValue } from "./hash-value";

const paymentWords: Record<AuthorizationState, string> = {
  RESERVED: "Capacity is reserved; the payment has not settled yet.",
  SETTLED: "The payment settled.",
  UNRESOLVED:
    "The payment outcome is unknown. Its capacity stays committed until it is reconciled.",
  RELEASED: "The payment did not go through. Its capacity was returned to the job.",
};

export function SettlementSections({
  authorization,
  currency,
}: {
  authorization: AuthorizationView;
  currency: string;
}) {
  return (
    <>
      <EvidenceSection step={4} title="Reservation">
        <dl>
          <EvidenceRow label="Reserved">
            <span className="font-mono tabular-nums">{formatAmount(authorization.amount)}</span>{" "}
            {currency} reserved before execution
          </EvidenceRow>
          <EvidenceRow label="Authorization">
            <span className="font-mono text-[14px] break-all">{authorization.id}</span>
          </EvidenceRow>
          <EvidenceRow label="Reserved at">{formatTime(authorization.createdAt)}</EvidenceRow>
        </dl>
      </EvidenceSection>
      <EvidenceSection step={5} title="Payment">
        <dl>
          <EvidenceRow label="State">
            <span className="flex flex-col items-start gap-1.5">
              <AuthorizationChip state={authorization.state} />
              <span className="text-sm text-muted">{paymentWords[authorization.state]}</span>
            </span>
          </EvidenceRow>
          <EvidenceRow label="Network">
            {authorization.network ?? <Pending>Not settled yet</Pending>}
          </EvidenceRow>
          <EvidenceRow label="Transaction">
            {authorization.txHash ? (
              <HashValue value={authorization.txHash} label="transaction hash" />
            ) : (
              <Pending>Not settled yet</Pending>
            )}
          </EvidenceRow>
          {authorization.resolvedAt && (
            <EvidenceRow label="Resolved at">{formatTime(authorization.resolvedAt)}</EvidenceRow>
          )}
        </dl>
      </EvidenceSection>
      <EvidenceSection step={6} title="Deliverable">
        <dl>
          <EvidenceRow label="Result">
            {authorization.deliverable ?? <Pending>No deliverable recorded yet</Pending>}
          </EvidenceRow>
        </dl>
      </EvidenceSection>
    </>
  );
}
