import type {
  AgentView,
  BudgetView,
  CreateJobBody,
  DecimalAmount,
  DenialReason,
  JobView,
  SpendApproved,
  SpendResponse,
} from "@reins/core";
import type { ReinsClient } from "./client";
import { sameAmount } from "./money";
import { SpendTable, type Writer } from "./transcript";

export interface Scene {
  readonly name: string;
  readonly title: string;
  readonly summary: string;
  run(context: SceneContext): Promise<void>;
}

export class SceneAbort extends Error {
  override readonly name = "SceneAbort";
}

export const demoServices = ["market-data", "web-research", "verification", "enrichment"] as const;

const jobLifetimeMs = 45 * 60 * 1000;

export function demoJobBody(title: string): CreateJobBody {
  return {
    title,
    customer: "ACME",
    revenue: "5.00",
    maxBudget: "1.00",
    maxPerPurchase: "0.50",
    allowedServices: demoServices,
    expiresAt: new Date(Date.now() + jobLifetimeMs).toISOString(),
    delegationAllowed: true,
    isDemoData: true,
  };
}

type BudgetField = keyof BudgetView;

const budgetFields: readonly BudgetField[] = [
  "maxBudget",
  "settled",
  "reserved",
  "unresolved",
  "available",
];

function describeDecision(response: SpendResponse): string {
  if (response.decision === "DENIED") {
    return `DENIED ${response.reason}`;
  }
  return response.replayed ? "APPROVED (replayed)" : "APPROVED";
}

export class SceneContext {
  readonly failures: string[] = [];
  readonly client: ReinsClient;
  private readonly writer: Writer;
  private readonly table = new SpendTable();

  constructor(client: ReinsClient, writer: Writer) {
    this.client = client;
    this.writer = writer;
  }

  say(text: string): void {
    this.table.flush(this.writer);
    this.writer.line(`  ${text}`);
  }

  check(label: string, passed: boolean, detail = ""): void {
    this.table.flush(this.writer);
    const suffix = passed || detail.length === 0 ? "" : ` (${detail})`;
    this.writer.line(`  ${passed ? "[pass]" : "[FAIL]"} ${label}${suffix}`);
    if (!passed) {
      this.failures.push(`${label}${suffix}`);
    }
  }

  checkEqual<T extends string | number | boolean | null>(label: string, actual: T, expected: T) {
    this.check(label, actual === expected, `expected ${String(expected)}, got ${String(actual)}`);
  }

  checkAmount(label: string, actual: DecimalAmount, expected: DecimalAmount): void {
    this.check(label, sameAmount(actual, expected), `expected ${expected}, got ${actual}`);
  }

  async createJob(body: CreateJobBody): Promise<JobView> {
    const job = await this.client.createJob(body);
    this.say(`job "${job.title}" created (${job.id}), demo data: ${String(job.isDemoData)}`);
    this.say(
      `budget ${job.budget.maxBudget} ${job.currency}, per purchase ${job.maxPerPurchase}, ` +
        `services ${job.allowedServices.join(", ")}, expires ${job.expiresAt}`,
    );
    return job;
  }

  async attach(job: JobView, name: string, role: string): Promise<AgentView> {
    const agent = await this.client.attachAgent(job.id, { name, role });
    this.say(`attached ${agent.name} (${agent.role})`);
    return agent;
  }

  async delegate(job: JobView, parent: AgentView, name: string, role: string): Promise<AgentView> {
    const agent = await this.client.delegate(job.id, { parentAgentId: parent.id, name, role });
    this.say(`${parent.name} delegated ${agent.name} (${agent.role})`);
    return agent;
  }

  async spend(
    job: JobView,
    agent: AgentView,
    service: string,
    amount: DecimalAmount,
    operationId: string,
  ): Promise<SpendResponse> {
    const response = await this.client.spend(job.id, {
      agentId: agent.id,
      service,
      amount,
      operationId,
    });
    this.record(agent, service, amount, response);
    return response;
  }

  record(agent: AgentView, service: string, amount: DecimalAmount, response: SpendResponse): void {
    this.table.add([
      agent.name,
      service,
      amount,
      describeDecision(response),
      response.remainingCapacity,
    ]);
  }

  requireApproved(response: SpendResponse, label: string): SpendApproved {
    this.check(label, response.decision === "APPROVED", describeDecision(response));
    if (response.decision !== "APPROVED") {
      throw new SceneAbort(`${label}: cannot continue without an approved reservation`);
    }
    return response;
  }

  checkDenied(response: SpendResponse, reason: DenialReason, label: string): void {
    const passed = response.decision === "DENIED" && response.reason === reason;
    this.check(label, passed, `expected DENIED ${reason}, got ${describeDecision(response)}`);
  }

  async checkBudget(job: JobView, expected: Partial<Record<BudgetField, DecimalAmount>>) {
    const { budget } = (await this.client.getJob(job.id)).job;
    this.say(
      `GET /jobs/:id budget: max ${budget.maxBudget}, settled ${budget.settled}, ` +
        `reserved ${budget.reserved}, unresolved ${budget.unresolved}, available ${budget.available}`,
    );
    for (const field of budgetFields) {
      const amount = expected[field];
      if (amount !== undefined) {
        this.checkAmount(`${field} is ${amount}`, budget[field], amount);
      }
    }
    return budget;
  }
}
