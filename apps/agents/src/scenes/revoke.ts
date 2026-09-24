import { demoJobBody, type Scene } from "../scene";

export const revokeScene: Scene = {
  name: "revoke",
  title: "The operator revokes the job while agents are working",
  summary: "new spends fail with JOB_NOT_ACTIVE; the existing reservation still counts",
  async run(context) {
    const job = await context.createJob(demoJobBody("Revocation proof — ACME"));
    const agent = await context.attach(job, "ResearchAgent", "research");
    context.requireApproved(
      await context.spend(job, agent, "web-research", "0.30", "research-before-revoke"),
      "the agent reserves 0.30 before the revoke",
    );

    await context.client.revoke(job.id, { agentId: null });
    context.say("operator pressed REVOKE on the job");
    const detail = await context.client.getJob(job.id);
    context.checkEqual("the job is REVOKED", detail.job.status, "REVOKED");

    context.checkDenied(
      await context.spend(job, agent, "market-data", "0.10", "research-after-revoke"),
      "JOB_NOT_ACTIVE",
      "the next spend is denied",
    );
    await context.checkBudget(job, { reserved: "0.30", available: "0.70" });
    context.say("the 0.30 reservation is still tracked; revocation did not erase it");
  },
};
