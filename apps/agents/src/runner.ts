import type { ReinsClient } from "./client";
import { SceneContext, type Scene } from "./scene";
import { renderTable, type Writer } from "./transcript";

export interface SceneResult {
  readonly scene: Scene;
  readonly failures: readonly string[];
}

function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

export async function runScene(
  scene: Scene,
  client: ReinsClient,
  writer: Writer,
): Promise<SceneResult> {
  writer.line(`== ${scene.name}: ${scene.title}`);
  writer.line(`   ${scene.summary}`);
  writer.line();
  const context = new SceneContext(client, writer);
  try {
    await scene.run(context);
  } catch (error) {
    context.check("scene ran to completion", false, describeError(error));
  }
  const verdict = context.failures.length === 0 ? "PASS" : "FAIL";
  writer.line();
  writer.line(`   ${verdict} ${scene.name} (${String(context.failures.length)} failed checks)`);
  writer.line();
  return { scene, failures: context.failures };
}

export function writeSummary(results: readonly SceneResult[], writer: Writer): void {
  const rows = results.map(({ scene, failures }) => [
    scene.name,
    failures.length === 0 ? "PASS" : "FAIL",
    failures[0] ?? "",
  ]);
  writer.line("== summary");
  writer.line();
  for (const text of renderTable(["scene", "result", "first failure"], rows)) {
    writer.line(`    ${text}`);
  }
  writer.line();
}
