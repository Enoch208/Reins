import { ArrowRight01Icon, StopCircleIcon, SubnodeAddIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AgentStatusChip } from "@/components/status/chips";
import { cx } from "@/lib/cx";
import { agentAnchor, type AgentNode } from "./agent-tree";
import { ConfirmAction } from "./confirm-action";

export function AgentRow({
  node,
  depth,
  canRevoke,
  onRevoke,
}: {
  node: AgentNode;
  depth: number;
  canRevoke: boolean;
  onRevoke: (agentId: string) => Promise<void>;
}) {
  const { agent, successor, predecessor } = node;
  const replaced = agent.status === "REPLACED";

  return (
    <li id={agentAnchor(agent.id)} className="scroll-mt-24">
      <div
        className={cx(
          "flex items-start gap-2.5 rounded-[16px] border border-line/80 px-4 py-3",
          replaced ? "bg-white/30" : "bg-white/55",
        )}
      >
        {depth > 0 && (
          <HugeiconsIcon
            icon={SubnodeAddIcon}
            size={16}
            strokeWidth={1.8}
            className="mt-1 shrink-0 text-faint"
            aria-hidden
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className={cx("truncate font-medium", replaced && "text-muted line-through")}>
              {depth > 0 && <span className="sr-only">Delegated agent: </span>}
              {agent.name}
            </p>
            <AgentStatusChip status={agent.status} size="sm" />
          </div>
          <p className="truncate text-sm text-caption">{agent.role}</p>
          {predecessor && (
            <p className="mt-1 text-xs text-caption">
              Replaces{" "}
              <a
                href={`#${agentAnchor(predecessor.id)}`}
                className="text-accent-ink underline-offset-2 hover:underline"
              >
                {predecessor.name}
              </a>
            </p>
          )}
          {successor && (
            <a
              href={`#${agentAnchor(successor.id)}`}
              className="mt-1 inline-flex items-center gap-1 text-xs text-accent-ink underline-offset-2 hover:underline"
            >
              Replaced by {successor.name}
              <HugeiconsIcon icon={ArrowRight01Icon} size={12} strokeWidth={2} aria-hidden />
            </a>
          )}
          {canRevoke && agent.status === "ACTIVE" && (
            <div className="mt-2.5 flex justify-end">
              <ConfirmAction
                icon={StopCircleIcon}
                label="Revoke"
                accessibleLabel={`Revoke ${agent.name}`}
                question={`Stop ${agent.name} from receiving new authorizations?`}
                confirmLabel="Revoke agent"
                onConfirm={() => onRevoke(agent.id)}
              />
            </div>
          )}
        </div>
      </div>
      {node.children.length > 0 && (
        <ul className="mt-2 ml-4 flex flex-col gap-2 border-l border-line pl-3 sm:ml-6 sm:pl-4">
          {node.children.map((child) => (
            <AgentRow
              key={child.agent.id}
              node={child}
              depth={depth + 1}
              canRevoke={canRevoke}
              onRevoke={onRevoke}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
