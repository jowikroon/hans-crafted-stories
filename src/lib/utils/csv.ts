/**
 * CSV Download utility — parses markdown tables or JSON arrays from AI responses
 * and triggers a browser download.
 */

/** Parse a markdown table string into rows of string arrays */
function parseMarkdownTable(md: string): string[][] {
  const lines = md.split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 2) return [];

  const rows: string[][] = [];
  for (let i = 0; i < lines.length; i++) {
    const cells = lines[i]
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    // Skip separator rows (e.g. |---|---|)
    if (cells.every((c) => /^[-:]+$/.test(c))) continue;
    rows.push(cells);
  }
  return rows;
}

/** Try to extract a JSON array from a string (possibly wrapped in ```json blocks) */
function tryParseJsonArray(content: string): Record<string, unknown>[] | null {
  // Try extracting from code blocks first
  const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonStr = codeBlockMatch ? codeBlockMatch[1] : content;

  try {
    const parsed = JSON.parse(jsonStr.trim());
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object") {
      return parsed as Record<string, unknown>[];
    }
  } catch {
    // Not valid JSON
  }
  return null;
}

/** Convert rows (array of arrays) to CSV string */
function rowsToCSV(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = cell.replace(/"/g, '""');
          return /[",\n]/.test(cell) ? `"${escaped}"` : escaped;
        })
        .join(","),
    )
    .join("\n");
}

/** Convert JSON array to CSV string */
function jsonToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const rows = [
    headers,
    ...data.map((row) => headers.map((h) => String(row[h] ?? ""))),
  ];
  return rowsToCSV(rows);
}

/**
 * Parse AI response content into CSV and trigger a browser download.
 * Returns true if data was found and downloaded, false otherwise.
 */
export function downloadCSV(content: string, filename = "export.csv"): boolean {
  let csv = "";

  // 1. Try JSON array
  const jsonArr = tryParseJsonArray(content);
  if (jsonArr) {
    csv = jsonToCSV(jsonArr);
  }

  // 2. Try markdown table
  if (!csv) {
    const rows = parseMarkdownTable(content);
    if (rows.length > 0) {
      csv = rowsToCSV(rows);
    }
  }

  // 3. Fallback: wrap entire content as single-cell CSV
  if (!csv) {
    csv = content;
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
