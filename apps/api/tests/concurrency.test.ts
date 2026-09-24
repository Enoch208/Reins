import type { SpendResponse } from "@reins/core";
import { formatMicros } from "@reins/core";
import { describe, expect, it } from "vitest";
import {
  approvedId,
  attachAgent,
  budgetOf,
  createJob,
  expectInvariant,
  spend,
  transition,
  resetDatabaseBetweenTests,
  type Reply,
} from "./support";

resetDatabaseBetweenTests();

function approvals(replies: readonly Reply<SpendResponse>[]) {
  return replies.filter((reply) => reply.body.decision === "APPROVED");
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}

describe("proof 1: concurrent reservations never exceed the budget", () => {
  it("25 parallel 0.10 requests against a 1.00 budget approve exactly 10", async () => {
    const job = await createJob({ maxBudget: "1.00", maxPerPurchase: "0.50" });
    const team = await Promise.all(
      Array.from({ length: 5 }, (_, index) => attachAgent(job.id, `Agent-${String(index)}`)),
    );
    const replies = await Promise.all(
      Array.from({ length: 25 }, (_, index) =>
        spend(job.id, { agentId: team[index % team.length]?.id ?? "", amount: "0.10" }),
      ),
    );
    expect(replies.every((reply) => reply.status === 200)).toBe(true);
    expect(approvals(replies)).toHaveLength(10);
    expect(replies.filter((reply) => reply.body.decision === "DENIED")).toHaveLength(15);
    expect(await budgetOf(job.id)).toMatchObject({ reserved: "1.00", available: "0.00" });
    await expectInvariant(job.id);
  });

  it("40 parallel requests of mixed sizes stay within the budget", async () => {
    const job = await createJob({ maxBudget: "2.00", maxPerPurchase: "0.50" });
    const agent = await attachAgent(job.id);
    const amounts = Array.from({ length: 40 }, (_, index) =>
      formatMicros(((index % 5) + 1) * 70_000),
    );
    const replies = await Promise.all(
      amounts.map((amount) => spend(job.id, { agentId: agent.id, amount })),
    );
    const books = await expectInvariant(job.id);
    const approvedTotal = approvals(replies).reduce(
      (total, reply) =>
        total + (reply.body.decision === "APPROVED" ? Number(reply.body.reserved) * 1e6 : 0),
      0,
    );
    expect(Math.round(approvedTotal)).toBe(books.reservedSum);
    expect(books.reservedSum).toBeLessThanOrEqual(2_000_000);
    expect(books.reservedSum).toBeGreaterThan(2_000_000 - 350_000);
  });
});

describe("proof 2 under contention: one operationId, one authority", () => {
  it("20 concurrent retries of the same operation create exactly one authorization", async () => {
    const job = await createJob();
    const agent = await attachAgent(job.id);
    const replies = await Promise.all(
      Array.from({ length: 20 }, () =>
        spend(job.id, { agentId: agent.id, operationId: "same-op" }),
      ),
    );
    const ids = new Set(replies.map((reply) => approvedId(reply)));
    expect(ids.size).toBe(1);
    const fresh = replies.filter(
      (reply) => reply.body.decision === "APPROVED" && !reply.body.replayed,
    );
    expect(fresh).toHaveLength(1);
    const books = await expectInvariant(job.id);
    expect(books.reservedSum).toBe(400_000);
    expect(books.committedCounter).toBe(400_000);
  });
});

describe("proof 12: settled + reserved + unresolved never exceeds maxBudget", () => {
  it.each([1, 7, 42, 2026])("randomised interleaving with seed %i", async (seed) => {
    const random = seededRandom(seed);
    const job = await createJob({ maxBudget: "3.00", maxPerPurchase: "0.60" });
    const team = await Promise.all(
      Array.from({ length: 4 }, (_, index) => attachAgent(job.id, `Worker-${String(index)}`)),
    );
    const live: string[] = [];
    const pick = <T>(items: readonly T[]): T | undefined =>
      items[Math.floor(random() * items.length)];
    for (let round = 0; round < 8; round += 1) {
      const operations = Array.from({ length: 30 }, (_, index) => {
        const roll = random();
        const target = pick(live);
        if (roll < 0.55 || target === undefined) {
          const amount = formatMicros(Math.floor(random() * 600_000) + 1);
          const operationId =
            random() < 0.1 ? `dup-${String(round)}` : `op-${String(round)}-${String(index)}`;
          return spend(job.id, { agentId: pick(team)?.id ?? "", amount, operationId }).then(
            (reply) => {
              expect(reply.status).toBe(200);
              if (reply.body.decision === "APPROVED") {
                live.push(reply.body.authorizationId);
              }
            },
          );
        }
        const action = pick(["settle", "release", "unresolved", "reconcile"] as const) ?? "release";
        const payload =
          action === "settle"
            ? { txHash: `0x${String(round)}${String(index)}`, network: "xlayer", deliverable: null }
            : action === "reconcile"
              ? random() < 0.5
                ? { outcome: "SETTLED", txHash: "0xrec", network: "xlayer" }
                : { outcome: "RELEASED", txHash: null, network: null }
              : { reason: "randomised" };
        return transition(target, action, payload).then((reply) => {
          expect([200, 409]).toContain(reply.status);
        });
      });
      await Promise.all(operations);
      await expectInvariant(job.id);
    }
    const books = await expectInvariant(job.id);
    const budget = await budgetOf(job.id);
    expect(Number(budget.available) * 1e6).toBeCloseTo(
      books.maxBudgetMicros - books.settledSum - books.reservedSum - books.unresolvedSum,
    );
  });
});
