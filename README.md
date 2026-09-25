<div align="center">

# Reins

**The runtime financial control layer for autonomous companies.**

One job. One budget. Across every AI agent.

[Live site](https://usereins.xyz) · [Live console](https://usereins.xyz/dashboard) · [How it works](#how-a-purchase-works) · [Architecture](#architecture) · [Run it](#run-it-locally)

</div>

https://github.com/user-attachments/assets/bb278ffa-ea22-4c33-b4f3-b401e4cc798f

## The problem

AI agents can already discover services and pay for them on their own. Put several agents on the same customer job and budget control becomes a distributed systems problem. Three agents each check a 1.00 budget, each see enough, and each spend 0.40. Every decision was reasonable. Together they spent 1.20.

Checking the balance is not enough. The check and the spend have to be one atomic step, shared by every agent on the job.

## What Reins does

You give an AI team a **job and a budget**, not the company wallet. Every agent on the job, including delegated children and replacement workers, draws from that one budget. Reins **reserves budget before any payment**, so parallel agents can never collectively overspend.

```text
settled + reserved + unresolved  <=  approved job budget
```

Reins holds this line **before authorization**, not after settlement.

- **Atomic reservations.** Concurrent requests serialise on the job row. The one that doesn't fit is denied before anything is signed.
- **Delegation and replacement never mint money.** A child or replacement agent spends from the same job budget, and no agent ever has its own budget.
- **Idempotent retries.** One operation ID gets one authorization. A retry returns the original decision and never pays twice.
- **Timeouts keep counting.** An uncertain payment stays `UNRESOLVED` and holds its budget until the chain proves what happened.
- **Instant revocation.** New spending stops at once, and existing reservations stay counted.
- **Evidence for every decision.** Each approval or denial traces from the job through every policy check and the reservation to the X Layer transaction.

**Reins decides. OKX executes. X Layer settles.**

## Proven on X Layer mainnet

Real payments, made by the OKX Agentic Wallet through Reins, each confirmed on-chain:

| What happened                                                                                                                                                                                                            | Transactions                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **The race (production, shown in the video).** Three agents buy market data at the same instant against a job that can afford two. Two settle; the third is denied with `JOB_BUDGET_EXCEEDED` before anything is signed. | [`0xadf87651…10533b`](https://www.oklink.com/xlayer/tx/0xadf8765191313199c6cc4d3341d867449f27d1439fadfd552a18752bac10533b), [`0x805662f5…a7db83`](https://www.oklink.com/xlayer/tx/0x805662f584f90357fc6d6811a908711904081fb6bdcb78bf8d0e36f448a7db83) |
| The same race, run earlier from a development machine.                                                                                                                                                                   | [`0xe9a403c2…55686d`](https://www.oklink.com/xlayer/tx/0xe9a403c2daf727b6f23fd670954a0c15f6804f5e1dddfae94f1b55915f55686d), [`0xf1a54d8a…4ecdfd`](https://www.oklink.com/xlayer/tx/0xf1a54d8a428756aabb51a94a53e470473fb43668ae12bc9a286d448f024ecdfd) |
| A single purchase for 0.01 USDT0. A retry with the same operation ID returned the same authorization and paid nothing.                                                                                                   | [`0x8d837b72…6487dc`](https://www.oklink.com/xlayer/tx/0x8d837b72fd52693cdbc1979e840b486d12a1b838d8a04d102cc13a15c86487dc)                                                                                                                             |

## Architecture

```mermaid
flowchart LR
    subgraph Team["AI agent team (one job)"]
        R[Research agent]
        M[Market-data agent]
        V[Verification agent]
    end

    subgraph Reins["Reins: decides"]
        API[API<br/>Hono + zod]
        POL[Policy engine<br/>pure functions]
        DB[(Postgres<br/>job row = the lock)]
        REC[Reconciler<br/>every 15 s]
        UI[Operator console]
    end

    subgraph OKX["OKX Onchain OS: executes"]
        W[Agentic Wallet<br/>keys in secure enclave]
        X[x402 payment]
    end

    S[Paid service<br/>x402 seller]
    L[(X Layer: settles<br/>USDT0 transfer)]

    R & M & V -->|spend request| API
    API --> POL --> DB
    API -->|sign only| W
    W --> X --> S
    S -->|settle| L
    API -->|confirm receipt| L
    REC -->|resolve UNRESOLVED| L
    UI --> API
```

| Layer                  | Owns                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Reins**              | Budgets, policy, authorization, reservations, delegation, idempotency, revocation, reconciliation, accounting and evidence |
| **OKX Agentic Wallet** | Keys, signing and payment execution. Reins never stores a private key.                                                     |
| **x402**               | The machine-native payment handshake between buyer and seller                                                              |
| **X Layer**            | Settlement and the transaction receipt that Reins checks before it marks a purchase settled                                |

## How a purchase works

```mermaid
sequenceDiagram
    autonumber
    participant A as Agent
    participant R as Reins
    participant S as Paid service
    participant W as OKX Agentic Wallet
    participant L as X Layer

    A->>R: purchase(url, price cap, operationId)
    R->>S: probe without paying
    S-->>R: 402 PAYMENT-REQUIRED (network, asset, amount, payTo)
    R->>R: policy checks + atomic reservation
    alt denied
        R-->>A: DENIED + reason (nothing is signed)
    else reserved
        R->>W: sign x402 payload
        W-->>R: signature (key never leaves the enclave)
        R->>R: persist payer, nonce, validBefore
        R->>S: replay with payment
        S->>L: settle USDT0 transfer
        R->>L: read receipt, match the transfer
        R-->>A: SETTLED + data + tx hash
    end
```

1. An agent asks Reins to buy from a URL, with a price cap and an operation ID.
2. Reins probes the URL without paying and reads the x402 challenge.
3. Reins runs the policy checks in a fixed order and reserves exactly the quoted price against the shared job budget.
4. The OKX Agentic Wallet signs the payment inside OKX's secure enclave.
5. Reins stores the payer, nonce and expiry **before** sending, replays the request with the signature, and marks the purchase settled only once a matching USDT0 transfer is confirmed on X Layer.
6. If anything is uncertain after the signature leaves (a timeout, a dropped response), the purchase stays `UNRESOLVED` and keeps its budget. The reconciler resolves it from the chain: a used nonce means settled, and an expired unused one means released.

### Policy, in order

The first check that fails becomes the denial reason, so every decision is deterministic and explainable.

| #   | Check                                   | Denial reason                 |
| --- | --------------------------------------- | ----------------------------- |
| 1   | Job is active                           | `JOB_NOT_ACTIVE`              |
| 2   | Job has not expired                     | `JOB_EXPIRED`                 |
| 3   | Service is on the job's allow-list      | `SERVICE_NOT_ALLOWED`         |
| 4   | Amount is within the per-purchase limit | `PER_PURCHASE_LIMIT_EXCEEDED` |
| 5   | Agent belongs to the job                | `AGENT_NOT_IN_JOB`            |
| 6   | Agent has not been revoked              | `AGENT_REVOKED`               |
| 7   | Budget capacity is available (atomic)   | `JOB_BUDGET_EXCEEDED`         |

An operation ID Reins has already seen skips the checks and returns its original authorization.

### Authorization states

```mermaid
stateDiagram-v2
    [*] --> RESERVED: policy passed, capacity reserved
    [*] --> DENIED: a check failed
    RESERVED --> SETTLED: on-chain transfer confirmed
    RESERVED --> RELEASED: definitive failure
    RESERVED --> UNRESOLVED: outcome uncertain
    UNRESOLVED --> SETTLED: reconciler finds it on-chain
    UNRESOLVED --> RELEASED: signature expired unused
```

A denial creates no authorization at all; it is recorded as a decision with its reason and the capacity at that moment. A timeout never releases budget. Only a definitive failure does.

### The one statement that holds the line

A reservation is a single conditional `UPDATE` inside the transaction that also writes the authorization and the spend request:

```ts
await tx
  .update(jobs)
  .set({ committedMicros: sql`${jobs.committedMicros} + ${amountMicros}::bigint` })
  .where(
    and(
      eq(jobs.id, jobId),
      eq(jobs.status, "ACTIVE"),
      sql`${jobs.settledMicros} + ${jobs.committedMicros} + ${amountMicros}::bigint <= ${jobs.maxBudgetMicros}`,
    ),
  )
  .returning();
```

- **The row lock serialises concurrent requests**, and a zero-row result is a denial. There is no read-then-check-then-write in application code.
- **A Postgres `CHECK` constraint** (`jobs_budget_invariant`) is the backstop.
- **Money is integer micro-USDT** throughout, never floating point.

## Tested, not claimed

**149 tests** pass. They include truly parallel requests against a real Postgres, never a mocked lock.

| Proof                                           | Test                                                                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Concurrent reservations never exceed the budget | 25 parallel 0.10 requests against a 1.00 budget approve exactly 10; 40 parallel requests of mixed sizes stay within the budget |
| One operation ID, one authority                 | 20 concurrent retries of the same operation create exactly one authorization                                                   |
| Settled + reserved + unresolved ≤ budget        | randomised concurrent interleavings across seeds, asserted after every round                                                   |
| Timeouts do not release budget                  | an uncertain outcome stays `UNRESOLVED` and keeps counting                                                                     |
| Reconciliation settles correctly                | `UNRESOLVED` resolves to `SETTLED` or `RELEASED` from chain state                                                              |
| Definitive failures release                     | capacity returns only on a definitive failure                                                                                  |
| Delegated agents share the budget               | a child agent draws from the parent's job budget                                                                               |
| Replacements inherit what remains               | a replacement worker gets the remaining budget and history, never a fresh one                                                  |
| Revoked, expired and disallowed requests reject | each is denied with its reason; existing reservations stay counted                                                             |
| Per-purchase caps hold                          | an oversized request is denied before any reservation                                                                          |

The demo agent team (`apps/agents`) replays each scenario against the live API and asserts the outcome: team, concurrency, retry, delegation, replacement, policy, revoke, timeout. It also runs two real-money scenes, `purchase` and `race`.

## Repository

| Path                                     | What it is                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [`packages/core`](packages/core)         | The shared contract, integer money, the pure policy evaluator, state transitions and response guards |
| [`apps/api`](apps/api)                   | Hono API, Drizzle ORM, Postgres, the x402 payment executor and the on-chain reconciler               |
| [`apps/paid-service`](apps/paid-service) | An x402-paid market data service run by Reins (0.01 USDT0 per call, real market data)                |
| [`apps/agents`](apps/agents)             | The demo agent team and scenario runner                                                              |
| [`apps/web`](apps/web)                   | The landing page and the operator console (Vite, React, Tailwind)                                    |

**Stack:** TypeScript (strict) · Node 24 · Hono · Drizzle · Postgres · zod · Vitest · React · Three.js · OKX Agentic Wallet (`onchainos`) · `@okxweb3/x402` · X Layer mainnet · USDT0

## Run it locally

Requires Node 24, pnpm 10 and Docker.

```sh
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/agents/.env.example apps/agents/.env
pnpm db:up
docker compose exec postgres createdb -U reins reins_test
DATABASE_URL=postgres://reins:reins@localhost:54320/reins pnpm db:migrate
DATABASE_URL=postgres://reins:reins@localhost:54320/reins_test pnpm db:migrate
pnpm dev
```

The API listens on `http://localhost:8787` and the console on `http://localhost:5173/dashboard`.

```sh
pnpm test                                   the full test suite
pnpm --filter @reins/agents dev -- all      every demo scenario, asserted
```

Real payments also need:

- the [`onchainos`](https://github.com/okx/onchainos-skills) CLI, logged in to a funded OKX Agentic Wallet;
- OKX Web3 API keys in `apps/paid-service/.env`;
- a network that can reach okx.com.

Then:

```sh
pnpm --filter @reins/paid-service dev
PAID_SERVICE_URL=http://localhost:4021 pnpm --filter @reins/agents dev -- race
```

## Running it in public

Set these two values in `apps/api/.env`:

- `OPERATOR_KEY`: at least 32 characters.
- `ALLOWED_SERVICE_ORIGINS`: a comma-separated list of paid service origins.

With both set:

- **Changes need the key:** creating jobs, spending, revoking and buying all require the key as a Bearer token. The dashboard and evidence stay readable.
- **Payments are restricted:** Reins will only ever pay the services on the list.
- **Local by default:** both servers bind to `127.0.0.1` unless `HOST` says otherwise.

The console asks for the key once under **Operator access**. The agent runner reads `REINS_OPERATOR_KEY`.

## Known limits

- Payments use X Layer mainnet and USDT0 only.
- One operator key per deployment; there are no per-user roles.

## Team

- **Dreyethh**: product and strategy
- **Enoch** ([@Enoch208](https://github.com/Enoch208)): technical and engineering

<div align="center">

**OKX gives agents the ability to transact. Reins gives organizations the confidence to let them.**

</div>
