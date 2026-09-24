import { demoJobBody, type Scene } from "../scene";

export const policyScene: Scene = {
  name: "policy",
  title: "Job policy rejects disallowed services and oversize purchases",
  summary: "SERVICE_NOT_ALLOWED and PER_PURCHASE_LIMIT_EXCEEDED; a purchase at the cap passes",
  async run(context) {
    const job = await context.createJob(demoJobBody("Policy proof — ACME"));
    const agent = await context.attach(job, "ResearchAgent", "research");

    context.checkDenied(
      await context.spend(job, agent, "image-generation", "0.10", "unapproved-service"),
      "SERVICE_NOT_ALLOWED",
      "a service outside the allow-list is denied",
    );
    context.checkDenied(
      await context.spend(job, agent, "market-data", "0.60", "oversize-purchase"),
      "PER_PURCHASE_LIMIT_EXCEEDED",
      "0.60 over the 0.50 per-purchase cap is denied",
    );
    context.requireApproved(
      await context.spend(job, agent, "market-data", "0.50", "cap-sized-purchase"),
      "exactly 0.50 at the cap is APPROVED",
    );
    await context.checkBudget(job, { reserved: "0.50", available: "0.50" });
  },
};
