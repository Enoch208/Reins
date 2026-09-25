import type { AgentView, CreateJobBody, JobView, PurchaseResponse } from "@reins/core";
import { SceneAbort, type Scene, type SceneContext } from "../scene";
import { requireFundedWallet, requireService } from "./purchase";

const jobLifetimeMs = 30 * 60 * 1000;
const agentNames = ["ResearchAgent", "MarketDataAgent", "VerificationAgent"] as const;

function raceJobBody(): CreateJobBody {
  return {
    title: "Competitor Intelligence — ACME",
    customer: "ACME",
    revenue: "5.00",
    maxBudget: "0.02",
    maxPerPurchase: "0.01",
    allowedServices: ["market-data"],
    expiresAt: new Date(Date.now() + jobLifetimeMs).toISOString(),
    delegationAllowed: true,
    isDemoData: true,
  };
}

function describe(agent: AgentView, response: PurchaseResponse): string {
  if (response.decision === "DENIED") {
    return `${agent.name.padEnd(18)} DENIED   ${response.reason}`;
  }
  return `${agent.name.padEnd(18)} ${response.outcome.padEnd(8)} tx ${response.authorization.txHash ?? "none"}`;
}

async function buyAtOnce(
  context: SceneContext,
  job: JobView,
  agents: readonly AgentView[],
  serviceUrl: string,
): Promise<readonly PurchaseResponse[]> {
  const url = new URL("/market-data?instId=BTC-USDT", serviceUrl).href;
  const responses = await Promise.all(
    agents.map((agent) =>
      context.client.purchase(job.id, {
        agentId: agent.id,
        service: "market-data",
        operationId: `race-${agent.name}-${crypto.randomUUID()}`,
        url,
        maxAmount: "0.01",
      }),
    ),
  );
  agents.forEach((agent, index) => {
    const response = responses[index];
    if (response !== undefined) context.say(describe(agent, response));
  });
  return responses;
}

export function raceScene(serviceUrl: string | null): Scene {
  return {
    name: "race",
    title: "Three agents buy at the same instant; the job can afford two",
    summary: "real concurrent purchases on X Layer; two settle, one is denied",
    async run(context) {
      if (serviceUrl === null) {
        throw new SceneAbort("set PAID_SERVICE_URL to the Reins paid service base URL");
      }
      await requireFundedWallet(context);
      await requireService(context, serviceUrl);
      const job = await context.createJob(raceJobBody());
      const coordinator = await context.attach(job, "Coordinator", "coordinator");
      const agents: AgentView[] = [];
      for (const name of agentNames) {
        agents.push(await context.delegate(job, coordinator, name, "research"));
      }
      context.say("three purchases fired at the same instant");
      const responses = await buyAtOnce(context, job, agents, serviceUrl);
      const settled = responses.filter(
        (response) => response.decision === "APPROVED" && response.outcome === "SETTLED",
      );
      const denied = responses.filter(
        (response) => response.decision === "DENIED" && response.reason === "JOB_BUDGET_EXCEEDED",
      );
      context.checkEqual("two purchases settled on X Layer", settled.length, 2);
      context.checkEqual("one purchase denied for budget", denied.length, 1);
      await context.checkBudget(job, { settled: "0.02", reserved: "0.00", available: "0.00" });
    },
  };
}
