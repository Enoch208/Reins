import { demoJobBody, type Scene } from "../scene";

export const timeoutScene: Scene = {
  name: "timeout",
  title: "A timed-out purchase stays counted until reconciliation",
  summary: "UNRESOLVED keeps its capacity; reconcile to RELEASED returns it",
  async run(context) {
    const job = await context.createJob(demoJobBody("Reconciliation proof — ACME"));
    const coordinator = await context.attach(job, "ResearchCoordinator", "coordinator");
    const research = await context.delegate(job, coordinator, "ResearchAgent", "research");
    const market = await context.delegate(job, coordinator, "MarketDataAgent", "market-data");

    const stuck = context.requireApproved(
      await context.spend(job, research, "web-research", "0.40", "research-timeout"),
      "the research agent reserves 0.40",
    );
    const unresolved = await context.client.markUnresolved(stuck.authorizationId, {
      reason: "provider did not answer before the deadline",
    });
    context.say("the purchase outcome is unknown: authorization marked UNRESOLVED");
    context.checkEqual("the authorization is UNRESOLVED", unresolved.state, "UNRESOLVED");
    await context.checkBudget(job, { reserved: "0", unresolved: "0.40", available: "0.60" });

    context.requireApproved(
      await context.spend(job, market, "market-data", "0.40", "market-data-1"),
      "the market-data agent reserves 0.40",
    );
    context.checkDenied(
      await context.spend(job, market, "market-data", "0.40", "market-data-2"),
      "JOB_BUDGET_EXCEEDED",
      "the unresolved 0.40 still blocks a further 0.40",
    );

    const reconciled = await context.client.reconcile(stuck.authorizationId, {
      outcome: "RELEASED",
      txHash: null,
      network: null,
    });
    context.say("reconciliation confirms no payment was made: authorization RELEASED");
    context.checkEqual("the authorization is RELEASED", reconciled.state, "RELEASED");
    await context.checkBudget(job, { reserved: "0.40", unresolved: "0", available: "0.60" });

    context.requireApproved(
      await context.spend(job, market, "market-data", "0.40", "market-data-2-after-reconcile"),
      "the released capacity is spendable again",
    );
    await context.checkBudget(job, { reserved: "0.80", available: "0.20" });
  },
};
