import { demoJobBody, type Scene } from "../scene";

export const delegationScene: Scene = {
  name: "delegation",
  title: "Delegated agents draw down the one shared job budget",
  summary: "a grandchild's spend reduces the coordinator's capacity; no child budget exists",
  async run(context) {
    const job = await context.createJob(demoJobBody("Delegation proof — ACME"));
    const coordinator = await context.attach(job, "ResearchCoordinator", "coordinator");
    const research = await context.delegate(job, coordinator, "ResearchAgent", "research");
    const verification = await context.delegate(job, research, "VerificationAgent", "verification");
    context.checkEqual(
      "the grandchild's parent is the research agent",
      verification.parentAgentId,
      research.id,
    );

    const parentSpend = context.requireApproved(
      await context.spend(job, coordinator, "market-data", "0.30", "coordinator-market-data"),
      "the coordinator reserves 0.30",
    );
    context.checkAmount("0.70 remains for the whole team", parentSpend.remainingCapacity, "0.70");

    const childSpend = context.requireApproved(
      await context.spend(job, verification, "verification", "0.40", "verify-claims-1"),
      "the grandchild reserves 0.40 from the same budget",
    );
    context.checkAmount("0.30 remains after the child", childSpend.remainingCapacity, "0.30");

    const overReach = await context.spend(
      job,
      verification,
      "verification",
      "0.40",
      "verify-claims-2",
    );
    context.checkDenied(
      overReach,
      "JOB_BUDGET_EXCEEDED",
      "the child cannot exceed the shared remainder",
    );
    await context.checkBudget(job, { reserved: "0.70", available: "0.30" });
  },
};
