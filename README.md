# Reins

**One job. One budget. Across every AI agent.**

AI agents can already discover services and pay for them on their own. But once several agents work on the same customer job, controlling their combined spending becomes a distributed systems problem. Three agents can each check a 1.00 budget, each see enough, and each spend 0.40. Every decision was reasonable. Together they spent 1.20.

Reins is a runtime spending-control layer for AI-agent teams. Create a job with a budget and a purchasing policy, then let agents work. Reins reserves budget before any payment, so parallel agents can never collectively overspend. Limits hold across delegation and worker replacement, retries are idempotent, an operator can revoke instantly, and every purchase links to its settlement on X Layer.

**OKX gives agents the ability to transact. Reins gives organizations the confidence to let them.**

## The one rule

```text
settled + reserved + unresolved <= approved job budget
```

Reins holds this before authorization, not after settlement. A reservation is a single conditional `UPDATE` on the job row, so concurrent requests serialise on that row, and a zero-row result is a denial. A Postgres `CHECK` constraint backs it up.

## Proven on X Layer mainnet

Real payments, made by the OKX Agentic Wallet through Reins, each confirmed on-chain:

| What happened                                                                                                                                                                                                         | Transaction                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| An agent buys market data for 0.01 USDT0. Reins reads the price, reserves it, has the wallet sign over x402, and settles only once the transfer is on-chain. A retry returns the same authorization and pays nothing. | [`0x8d837b72…6487dc`](https://www.oklink.com/xlayer/tx/0x8d837b72fd52693cdbc1979e840b486d12a1b838d8a04d102cc13a15c86487dc)                                                                                                                             |
| Three agents buy at the same instant against a job budget that covers two: two settle, one is denied with `JOB_BUDGET_EXCEEDED` before anything is signed.                                                            | [`0xe9a403c2…55686d`](https://www.oklink.com/xlayer/tx/0xe9a403c2daf727b6f23fd670954a0c15f6804f5e1dddfae94f1b55915f55686d), [`0xf1a54d8a…4ecdfd`](https://www.oklink.com/xlayer/tx/0xf1a54d8a428756aabb51a94a53e470473fb43668ae12bc9a286d448f024ecdfd) |

## How a purchase works

1. An agent asks Reins to buy from a URL, with a price cap and an operation ID.
2. Reins probes the URL without paying and reads the x402 `PAYMENT-REQUIRED` challenge (network, asset, amount, recipient).
3. Reins runs the policy checks in a fixed order and reserves exactly the quoted price against the shared job budget. Denials are recorded with their reason.
4. The OKX Agentic Wallet signs the payment. Keys stay in OKX's secure enclave; Reins never holds a private key.
5. Reins stores the payer, nonce and expiry before sending, replays the request with the signature, and marks the purchase settled only when a matching USDT0 transfer is confirmed on X Layer.
6. Anything uncertain (a timeout, a dropped response) stays `UNRESOLVED` and keeps counting against the budget. A reconciler resolves it from the chain: a used nonce means settled, an expired unused one means released.

## What is built

- **Reservation engine** with every policy check: job active, before expiry, service allowed, per-purchase limit, agent membership, revoked agents, idempotent operation IDs and remaining budget.
- **Delegation and replacement** share the job budget; neither ever mints new authority. **Revocation** stops new spending at once while existing reservations stay counted.
- **Payments** through the OKX Agentic Wallet over x402 on X Layer, with on-chain confirmation and reconciliation.
- **A paid service** operated by Reins (`apps/paid-service`) that sells real market data for 0.01 USDT0 through the OKX x402 facilitator. It is labelled as operated by Reins.
- **Operator console:** a live overview, jobs with budget meters and agent trees, a cross-job activity feed where denials are unmistakable, an evidence viewer for every decision, and the payer wallet.
- **Demo agent team** (`apps/agents`) that drives each scenario against the live API and asserts the outcome.
- **147 tests**, including truly parallel spends against a real Postgres and randomised interleavings that assert the rule after every round.

## Repository

| Path                | What it is                                                                |
| ------------------- | ------------------------------------------------------------------------- |
| `packages/core`     | The shared contract, integer money, the policy evaluator, response guards |
| `apps/api`          | Hono API, Drizzle ORM, Postgres, the payment executor and reconciler      |
| `apps/paid-service` | The x402-paid market data service                                         |
| `apps/agents`       | The demo agent team and scenario runner                                   |
| `apps/web`          | The landing page and the operator console (Vite, React, Tailwind)         |

## Run locally

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

Real payments additionally need the [`onchainos`](https://github.com/okx/onchainos-skills) CLI logged in to a funded OKX Agentic Wallet, OKX Web3 API keys in `apps/paid-service/.env`, and a network that can reach okx.com. Then:

```sh
pnpm --filter @reins/paid-service dev
PAID_SERVICE_URL=http://localhost:4021 pnpm --filter @reins/agents dev -- purchase
```

## Known limits

- The API has no operator authentication yet, and the purchase route accepts any x402 URL. Run it on a trusted machine only; do not expose it to the internet until authentication and a service allow-list are in place.
- Payments use X Layer mainnet and USDT0 only.
