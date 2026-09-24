import { demoJobBody, type Scene } from "../scene";

export const concurrencyScene: Scene = {
  name: "concurrency",
  title: "Three agents spend 0.40 at the same instant against a 1.00 budget",
  summary: "exactly two APPROVED, one DENIED; 0.80 committed, 0.20 available",
  async run(context) {
    const job = await context.createJob(demoJobBody("Concurrency proof — ACME"));
    const coordinator = await context.attach(job, "ResearchCoordinator", "coordinator");
    const workers = [
      {
        agent: await context.delegate(job, coordinator, "ResearchAgent", "research"),
        service: "web-research",
      },
      {
        agent: await context.delegate(job, coordinator, "MarketDataAgent", "market-data"),
        service: "market-data",
      },
      {
        agent: await context.delegate(job, coordinator, "VerificationAgent", "verification"),
        service: "verification",
      },
    ];

    context.say("firing three 0.40 spend requests in parallel");
    const responses = await Promise.all(
      workers.map(({ agent, service }) =>
        context.spend(job, agent, service, "0.40", `concurrent-${service}`),
      ),
    );

    const approved = responses.filter((response) => response.decision === "APPROVED");
    const denied = responses.filter((response) => response.decision === "DENIED");
    context.checkEqual("exactly two requests APPROVED", approved.length, 2);
    context.checkEqual("exactly one request DENIED", denied.length, 1);
    context.check(
      "the denial reason is JOB_BUDGET_EXCEEDED",
      denied.every((response) => response.reason === "JOB_BUDGET_EXCEEDED"),
      denied.map((response) => response.reason).join(", "),
    );
    context.check(
      "the two approvals hold distinct authorizations",
      new Set(approved.map((response) => response.authorizationId)).size === approved.length,
    );

    const budget = await context.checkBudget(job, {
      settled: "0",
      reserved: "0.80",
      unresolved: "0",
      available: "0.20",
    });
    context.say(`${budget.reserved} committed, ${budget.available} available — not 1.20 spent`);
  },
};
