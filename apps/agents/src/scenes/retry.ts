import { demoJobBody, type Scene } from "../scene";

export const retryScene: Scene = {
  name: "retry",
  title: "An agent retries the same operation after an interrupted response",
  summary: "one operationId, one authorization, one reservation",
  async run(context) {
    const job = await context.createJob(demoJobBody("Retry proof — ACME"));
    const agent = await context.attach(job, "MarketDataAgent", "market-data");
    const operationId = "acme-market-data-nvda";

    const first = context.requireApproved(
      await context.spend(job, agent, "market-data", "0.30", operationId),
      "the first attempt is APPROVED",
    );
    context.say("response treated as lost; the agent retries the same operationId");
    const second = context.requireApproved(
      await context.spend(job, agent, "market-data", "0.30", operationId),
      "the retry is APPROVED",
    );

    context.checkEqual("the first attempt is not a replay", first.replayed, false);
    context.checkEqual("the retry is a replay", second.replayed, true);
    context.checkEqual(
      "the retry returns the same authorizationId",
      second.authorizationId,
      first.authorizationId,
    );
    await context.checkBudget(job, { reserved: "0.30", available: "0.70" });

    const ledger = await context.client.ledger(job.id);
    const authorizationIds = new Set(
      ledger.flatMap((entry) => (entry.authorization === null ? [] : [entry.authorization.id])),
    );
    context.checkEqual("the ledger holds exactly one authorization", authorizationIds.size, 1);
  },
};
