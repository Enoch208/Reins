import { demoJobBody, type Scene } from "../scene";

export const replacementScene: Scene = {
  name: "replacement",
  title: "A worker that already spent is replaced mid-job",
  summary: "the replacement sees only the remaining 0.40, never a fresh allowance",
  async run(context) {
    const job = await context.createJob(demoJobBody("Replacement proof — ACME"));
    const agentA = await context.attach(job, "ResearchAgent-A", "research");
    context.requireApproved(
      await context.spend(job, agentA, "web-research", "0.30", "research-a-sources"),
      "agent A reserves 0.30",
    );
    const second = context.requireApproved(
      await context.spend(job, agentA, "enrichment", "0.30", "research-a-enrichment"),
      "agent A reserves another 0.30",
    );
    context.checkAmount("agent A leaves 0.40 on the job", second.remainingCapacity, "0.40");

    const agentB = await context.client.replace(job.id, {
      agentId: agentA.id,
      name: "ResearchAgent-B",
    });
    context.say(`${agentA.name} replaced by ${agentB.name}`);
    context.checkEqual("B records that it replaces A", agentB.replacesAgentId, agentA.id);
    context.checkEqual("B works on the same job", agentB.jobId, job.id);

    const detail = await context.client.getJob(job.id);
    const retired = detail.agents.find((agent) => agent.id === agentA.id);
    context.checkEqual("agent A is REPLACED", retired?.status ?? null, "REPLACED");

    context.checkDenied(
      await context.spend(job, agentA, "web-research", "0.10", "research-a-after-replacement"),
      "AGENT_REVOKED",
      "the replaced agent A can no longer spend",
    );
    context.checkDenied(
      await context.spend(job, agentB, "web-research", "0.50", "research-b-full-allowance"),
      "JOB_BUDGET_EXCEEDED",
      "B cannot spend 0.50 when only 0.40 remains",
    );
    const fits = context.requireApproved(
      await context.spend(job, agentB, "web-research", "0.40", "research-b-remaining"),
      "B can spend the remaining 0.40",
    );
    context.checkAmount("nothing remains after B", fits.remainingCapacity, "0");
    await context.checkBudget(job, { reserved: "1.00", available: "0" });
  },
};
