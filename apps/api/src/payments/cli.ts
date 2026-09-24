import { execFile } from "node:child_process";
import { z } from "zod";

export interface CliResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface CliRunner {
  run(args: readonly string[]): Promise<CliResult>;
}

export class CliNotInstalled extends Error {
  constructor(binary: string) {
    super(`The onchainos CLI was not found at ${binary}`);
    this.name = "CliNotInstalled";
  }
}

const maxOutputBytes = 1024 * 1024;

export function execFileRunner(binary: string, timeoutMs: number): CliRunner {
  return {
    run: (args) =>
      new Promise((resolve, reject) => {
        execFile(
          binary,
          [...args],
          { timeout: timeoutMs, maxBuffer: maxOutputBytes, encoding: "utf8" },
          (error, stdout, stderr) => {
            if (error === null) {
              resolve({ exitCode: 0, stdout, stderr });
            } else if (error.code === "ENOENT") {
              reject(new CliNotInstalled(binary));
            } else if (typeof error.code === "number") {
              resolve({ exitCode: error.code, stdout, stderr });
            } else {
              reject(new Error(`onchainos did not finish: ${error.message}`, { cause: error }));
            }
          },
        );
      }),
  };
}

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

export type CliOutcome =
  { readonly ok: true; readonly data: unknown } | { readonly ok: false; readonly error: string };

export async function runJson(cli: CliRunner, args: readonly string[]): Promise<CliOutcome> {
  const result = await cli.run(args);
  const lastLine = result.stdout.trim().split("\n").at(-1) ?? "";
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(lastLine);
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error;
    }
  }
  const envelope = envelopeSchema.safeParse(parsed);
  if (!envelope.success) {
    const detail = result.stderr.trim() || result.stdout.trim() || "no output";
    return { ok: false, error: `onchainos exited ${String(result.exitCode)}: ${detail}` };
  }
  if (!envelope.data.ok || result.exitCode !== 0) {
    return {
      ok: false,
      error: envelope.data.error ?? `onchainos exited ${String(result.exitCode)}`,
    };
  }
  return { ok: true, data: envelope.data.data };
}
