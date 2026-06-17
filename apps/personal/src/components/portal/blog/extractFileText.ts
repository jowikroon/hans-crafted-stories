// Voice-analyzer file extraction: txt/md (sync), PDF (pdfjs-dist), DOCX (mammoth).
// Heavy parsers are dynamically imported so they code-split out of the main bundle
// and only load when the user actually drops a PDF/DOCX.

const MAX_CHARS = 20000;

function clip(s: string): string {
  return s.slice(0, MAX_CHARS);
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  // @ts-expect-error GlobalWorkerOptions exists at runtime
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buf = await file.arrayBuffer();
  // @ts-expect-error getDocument is exported at runtime
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const out: string[] = [];
  const maxPages = Math.min(doc.numPages, 40);
  for (let p = 1; p <= maxPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const line = content.items
      .map((it: unknown) => (it && typeof it === "object" && "str" in it ? String((it as { str: string }).str) : ""))
      .join(" ");
    out.push(line);
    if (out.join(" ").length > MAX_CHARS) break;
  }
  return clip(out.join("\n"));
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const buf = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
  return clip(value ?? "");
}

function extractPlain(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(clip(String(reader.result ?? "")));
    reader.onerror = () => reject(new Error("Kon bestand niet lezen"));
    reader.readAsText(file);
  });
}

/** Detect type by extension + MIME and route to the right parser. */
export async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const type = file.type;
  if (name.endsWith(".pdf") || type === "application/pdf") return extractPdf(file);
  if (
    name.endsWith(".docx") ||
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractDocx(file);
  }
  return extractPlain(file);
}

export const ANALYZER_ACCEPT =
  ".txt,.md,.markdown,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
