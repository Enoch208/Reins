import { Hono } from "hono";
import { apiRoutes } from "@reins/core";
import type { Db } from "../db/client";
import { pathId, readBody } from "../http/input";
import { purchaseSchema } from "../http/schemas";
import type { PaymentDeps } from "../payments/deps";
import { purchase } from "../payments/purchase";
import { walletView } from "../payments/wallet";

export function paymentRoutes(db: Db, payments: PaymentDeps) {
  return new Hono()
    .get(apiRoutes.wallet, async (c) => c.json(await walletView(payments.cli, payments.chain)))
    .post(apiRoutes.purchase(":id"), async (c) => {
      const jobId = pathId(c, "Job");
      const body = await readBody(c, purchaseSchema);
      return c.json(await purchase(db, payments, jobId, body, new Date()));
    });
}
