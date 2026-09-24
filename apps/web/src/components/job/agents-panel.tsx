import type { AgentView } from "@reins/core";
import { AgentRow } from "./agent-row";
import { buildAgentTree } from "./agent-tree";

export function AgentsPanel({
  agents,
  canRevoke,
  onRevoke,
}: {
  agents: readonly AgentView[];
  canRevoke: boolean;
  onRevoke: (agentId: string) => Promise<void>;
}) {
  const tree = buildAgentTree(agents);

  return (
    <section aria-labelledby="agents-heading" className="glass rounded-[26px] p-6">
      <div className="flex items-baseline justify-between">
        <h2 id="agents-heading" className="text-lg font-medium">
          Agents
        </h2>
        <p className="text-sm text-caption">{agents.length} on this job</p>
      </div>
      <p className="mt-1 text-sm text-muted">Every agent below draws from the one job budget.</p>
      {tree.length === 0 ? (
        <p className="mt-5 rounded-[16px] border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
          No agents have joined this job yet.
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-2" aria-label="Agent delegation tree">
          {tree.map((node) => (
            <AgentRow
              key={node.agent.id}
              node={node}
              depth={0}
              canRevoke={canRevoke}
              onRevoke={onRevoke}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
