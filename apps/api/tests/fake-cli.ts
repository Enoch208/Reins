import { randomBytes } from "node:crypto";
import { z } from "zod";
import { CliNotInstalled, type CliResult, type CliRunner } from "../src/payments/cli";
import { encodeJson } from "../src/payments/x402";

export const payerAddress = "0x04c98d337584f979c426f732834e921707baf1ca";

const paymentRequiredSchema = z.object({
  resource: z.unknown(),
  accepts: z.array(
    z.object({ payTo: z.string(), amount: z.string(), maxTimeoutSeconds: z.number() }).loose(),
  ),
});

type SignMode = { readonly kind: "sign" } | { readonly kind: "fail"; readonly error: string };

function reply(body: unknown, exitCode = 0): CliResult {
  return { exitCode, stdout: `${JSON.stringify(body)}\n`, stderr: "" };
}

export class FakeCli implements CliRunner {
  installed = true;
  loggedIn = true;
  signMode: SignMode = { kind: "sign" };
  signCalls = 0;
  beforeSign: () => Promise<void> = () => Promise.resolve();
  nowSeconds: () => number = () => Math.floor(Date.now() / 1000);

  reset(): void {
    this.installed = true;
    this.loggedIn = true;
    this.signMode = { kind: "sign" };
    this.signCalls = 0;
    this.beforeSign = () => Promise.resolve();
  }

  run(args: readonly string[]): Promise<CliResult> {
    if (!this.installed) {
      return Promise.reject(new CliNotInstalled("onchainos"));
    }
    const command = args.slice(0, 2).join(" ");
    if (command === "wallet status") {
      return Promise.resolve(reply({ ok: true, data: { loggedIn: this.loggedIn } }));
    }
    if (command === "wallet addresses") {
      return Promise.resolve(
        reply({
          ok: true,
          data: { xlayer: [{ address: payerAddress, chainIndex: "196", chainName: "okb" }] },
        }),
      );
    }
    if (command === "payment pay") {
      return this.sign(args);
    }
    return Promise.resolve(reply({ ok: false, error: `unexpected ${args.join(" ")}` }, 1));
  }

  private async sign(args: readonly string[]): Promise<CliResult> {
    this.signCalls += 1;
    await this.beforeSign();
    if (this.signMode.kind === "fail") {
      return reply({ ok: false, error: this.signMode.error }, 1);
    }
    const payload = args[args.indexOf("--payload") + 1] ?? "";
    const index = Number(args[args.indexOf("--selected-index") + 1] ?? "0");
    const decoded = paymentRequiredSchema.parse(
      JSON.parse(Buffer.from(payload, "base64").toString("utf8")),
    );
    const accepted = decoded.accepts[index];
    if (accepted === undefined) {
      return reply({ ok: false, error: "selected index out of range" }, 1);
    }
    const nonce = `0x${randomBytes(32).toString("hex")}`;
    const header = encodeJson({
      x402Version: 2,
      resource: decoded.resource,
      accepted,
      payload: {
        signature: "0xfeedface",
        authorization: {
          from: payerAddress,
          to: accepted.payTo,
          value: accepted.amount,
          validAfter: "0",
          validBefore: String(this.nowSeconds() + accepted.maxTimeoutSeconds),
          nonce,
        },
      },
    });
    return reply({
      ok: true,
      data: {
        authorization_header: header,
        header_name: "PAYMENT-SIGNATURE",
        scheme: "exact",
        wallet: payerAddress,
      },
    });
  }
}
