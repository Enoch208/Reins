import type { AgentView } from "@reins/core";

export interface AgentNode {
  readonly agent: AgentView;
  readonly successor: AgentView | null;
  readonly predecessor: AgentView | null;
  readonly children: readonly AgentNode[];
}

export function buildAgentTree(agents: readonly AgentView[]): readonly AgentNode[] {
  const ids = new Set(agents.map((agent) => agent.id));
  const byId = new Map(agents.map((agent) => [agent.id, agent]));
  const successorOf = new Map(
    agents.flatMap((agent) =>
      agent.replacesAgentId === null ? [] : [[agent.replacesAgentId, agent] as const],
    ),
  );
  const sorted = [...agents].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const nodeFor = (agent: AgentView): AgentNode => ({
    agent,
    successor: successorOf.get(agent.id) ?? null,
    predecessor: agent.replacesAgentId === null ? null : (byId.get(agent.replacesAgentId) ?? null),
    children: sorted.filter((child) => child.parentAgentId === agent.id).map(nodeFor),
  });

  return sorted
    .filter((agent) => agent.parentAgentId === null || !ids.has(agent.parentAgentId))
    .map(nodeFor);
}

export const agentAnchor = (agentId: string): string => `agent-${agentId}`;
