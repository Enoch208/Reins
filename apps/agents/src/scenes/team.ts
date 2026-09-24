import { demoJobBody, type Scene } from "../scene";

export const teamScene: Scene = {
  name: "team",
  title: "Create a business job and start the agent team",
  summary: "one job, one budget; a coordinator delegates four workers",
  async run(context) {
    const job = await context.createJob(demoJobBody("Competitor Intelligence — ACME"));
    context.checkEqual("job is ACTIVE", job.status, "ACTIVE");
    context.checkEqual("job is labelled demo data", job.isDemoData, true);
    context.checkAmount("job starts with the full 1.00 available", job.budget.available, "1.00");

    const coordinator = await context.attach(job, "ResearchCoordinator", "coordinator");
    const research = await context.delegate(job, coordinator, "ResearchAgent", "research");
    const workers = [
      research,
      await context.delegate(job, coordinator, "MarketDataAgent", "market-data"),
      await context.delegate(job, coordinator, "VerificationAgent", "verification"),
      await context.delegate(job, coordinator, "SynthesisAgent", "synthesis"),
    ];
    context.check(
      "every worker is a child of the coordinator on the same job",
      workers.every((worker) => worker.parentAgentId === coordinator.id && worker.jobId === job.id),
    );

    const detail = await context.client.getJob(job.id);
    context.checkEqual("GET /jobs/:id lists five agents", detail.agents.length, 5);
    context.checkAmount(
      "delegation minted no budget: still 1.00 in total",
      detail.job.budget.maxBudget,
      "1.00",
    );

    const response = await context.spend(
      job,
      research,
      "web-research",
      "0.30",
      "acme-competitor-web-research",
    );
    const approved = context.requireApproved(response, "ResearchAgent reserves 0.30 before paying");
    context.checkEqual("the reservation is RESERVED", approved.state, "RESERVED");
    await context.checkBudget(job, { reserved: "0.30", available: "0.70" });
    context.say(
      "payment execution is not configured yet: the OKX Agentic Wallet / x402 / X Layer " +
        "executor is not connected, so this purchase stops at the reservation and nothing is paid.",
    );
  },
};
