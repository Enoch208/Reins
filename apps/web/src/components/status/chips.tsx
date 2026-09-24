import {
  Alert02Icon,
  CancelCircleIcon,
  CheckmarkBadge01Icon,
  CheckmarkCircle02Icon,
  LockIcon,
  MinusSignCircleIcon,
  StopCircleIcon,
  TestTube01Icon,
  UserSwitchIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { AgentStatus, AuthorizationState, JobStatus, SpendDecision } from "@reins/core";
import { StatusChip, type Tone } from "./status-chip";

type ChipSpec = { readonly tone: Tone; readonly icon: IconSvgElement; readonly label: string };

const decisionSpecs: Record<SpendDecision, ChipSpec> = {
  APPROVED: { tone: "approved", icon: CheckmarkCircle02Icon, label: "Approved" },
  DENIED: { tone: "denied", icon: CancelCircleIcon, label: "Denied" },
};

const authorizationSpecs: Record<AuthorizationState, ChipSpec> = {
  RESERVED: { tone: "reserved", icon: LockIcon, label: "Reserved" },
  SETTLED: { tone: "settled", icon: CheckmarkBadge01Icon, label: "Settled" },
  RELEASED: { tone: "released", icon: MinusSignCircleIcon, label: "Released" },
  UNRESOLVED: { tone: "unresolved", icon: Alert02Icon, label: "Unresolved" },
};

const jobSpecs: Record<JobStatus, ChipSpec> = {
  ACTIVE: { tone: "approved", icon: CheckmarkCircle02Icon, label: "Active" },
  REVOKED: { tone: "revoked", icon: StopCircleIcon, label: "Revoked" },
  COMPLETED: { tone: "settled", icon: CheckmarkBadge01Icon, label: "Completed" },
};

const agentSpecs: Record<AgentStatus, ChipSpec> = {
  ACTIVE: { tone: "approved", icon: CheckmarkCircle02Icon, label: "Active" },
  REPLACED: { tone: "released", icon: UserSwitchIcon, label: "Replaced" },
  REVOKED: { tone: "revoked", icon: StopCircleIcon, label: "Revoked" },
};

type Size = "sm" | "md";

export function DecisionChip({ decision, size }: { decision: SpendDecision; size?: Size }) {
  return <StatusChip {...decisionSpecs[decision]} size={size ?? "md"} />;
}

export function AuthorizationChip({ state, size }: { state: AuthorizationState; size?: Size }) {
  return <StatusChip {...authorizationSpecs[state]} size={size ?? "md"} />;
}

export function JobStatusChip({ status, size }: { status: JobStatus; size?: Size }) {
  return <StatusChip {...jobSpecs[status]} size={size ?? "md"} />;
}

export function AgentStatusChip({ status, size }: { status: AgentStatus; size?: Size }) {
  return <StatusChip {...agentSpecs[status]} size={size ?? "md"} />;
}

export function DemoDataChip() {
  return <StatusChip tone="neutral" icon={TestTube01Icon} label="Demo data" size="sm" />;
}
