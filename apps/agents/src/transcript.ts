export interface Writer {
  line(text?: string): void;
}

export const stdoutWriter: Writer = {
  line(text = "") {
    process.stdout.write(`${text}\n`);
  },
};

export type Row = readonly string[];

export function renderTable(header: Row, rows: readonly Row[]): string[] {
  const widths = header.map((cell, index) =>
    Math.max(cell.length, ...rows.map((row) => (row[index] ?? "").length)),
  );
  const render = (row: Row) =>
    row
      .map((cell, index) => cell.padEnd(widths[index] ?? cell.length))
      .join("  ")
      .trimEnd();
  const rule = widths.map((width) => "-".repeat(width)).join("  ");
  return [render(header), rule, ...rows.map(render)];
}

export const spendHeader: Row = ["agent", "service", "amount", "decision", "remaining capacity"];

export class SpendTable {
  private readonly rows: Row[] = [];

  add(row: Row): void {
    this.rows.push(row);
  }

  flush(writer: Writer): void {
    if (this.rows.length === 0) {
      return;
    }
    writer.line();
    for (const text of renderTable(spendHeader, this.rows)) {
      writer.line(`    ${text}`);
    }
    writer.line();
    this.rows.length = 0;
  }
}
