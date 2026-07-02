/* ────────────────────────────────────────────────────────────
   masking.ts — per-artikel data-masking voor blogcontent.

   Auteurs (Hans of de gate-filler) markeren gevoelige data in
   markdown met mask-tokens:

     {{m:metric|€67K/mnd|~€70K per maand|een fors maandbedrag}}
     {{m:company#bureau1|Atvise|het bureau}}
     {{m:client|A.B.S.|een Nederlandse auto-onderdelen retailer}}

   Syntax:  {{m:<type>[#id]|specific[|general[|masked]]}}
   Types:   metric | company | agency | client | person | other
   Modes:   specific | general | masked  (fallback-keten per variant)

   De per-artikel config leeft in blog_posts.masking (jsonb):
     { enabled, defaults: {type: mode}, overrides: {maskId: mode} }

   Publiek rendert BlogPostPage de gekozen variant server/client-
   consistent; de admin-overlay (MaskPanel) swapt live via de
   data-attributen op de gegenereerde spans.
   ──────────────────────────────────────────────────────────── */

export type MaskType = "metric" | "company" | "agency" | "client" | "person" | "other";
export type MaskMode = "specific" | "general" | "masked";

export interface MaskingConfig {
  enabled?: boolean;
  defaults?: Partial<Record<MaskType, MaskMode>>;
  overrides?: Record<string, MaskMode>;
}

export const MASK_TYPES: MaskType[] = ["metric", "company", "agency", "client", "person", "other"];

export const MASK_TYPE_LABELS: Record<MaskType, string> = {
  metric: "Cijfers",
  company: "Bedrijven",
  agency: "Bureaus",
  client: "Klanten",
  person: "Personen",
  other: "Overig",
};

export const MASK_MODE_LABELS: Record<MaskMode, string> = {
  specific: "Specifiek",
  general: "Algemeen",
  masked: "Gemaskeerd",
};

/** Token regex — inhoud is al HTML-escaped op het moment van verwerken. */
export const MASK_TOKEN_RE = /\{\{m:([a-z]+)(?:#([\w-]+))?\|([^{}]+)\}\}/g;

const isMaskType = (s: string): s is MaskType => (MASK_TYPES as string[]).includes(s);

export interface MaskVariants {
  specific: string;
  general?: string;
  masked?: string;
}

/** Kies de tekstvariant voor een mode, met nette fallback-keten. */
export function variantFor(v: MaskVariants, mode: MaskMode): string {
  if (mode === "masked") return v.masked ?? v.general ?? v.specific;
  if (mode === "general") return v.general ?? v.masked ?? v.specific;
  return v.specific;
}

/** Bepaal de effectieve mode voor één token. */
export function resolveMode(cfg: MaskingConfig | null | undefined, type: MaskType, id: string): MaskMode {
  if (!cfg || cfg.enabled === false) return "specific";
  return cfg.overrides?.[id] ?? cfg.defaults?.[type] ?? "specific";
}

const attr = (s: string) => s.replace(/"/g, "&quot;");

/**
 * Vervang mask-tokens in een (al ge-escapete) tekstregel door spans.
 * `counters` maakt stabiele auto-ids per type (metric-1, metric-2, …)
 * over het hele artikel heen — geef hetzelfde object door per render.
 */
export function applyMaskTokens(
  escaped: string,
  cfg: MaskingConfig | null | undefined,
  counters: Record<string, number>
): string {
  return escaped.replace(MASK_TOKEN_RE, (_all, rawType: string, rawId: string | undefined, body: string) => {
    const type: MaskType = isMaskType(rawType) ? rawType : "other";
    counters[type] = (counters[type] ?? 0) + 1;
    const id = rawId || `${type}-${counters[type]}`;
    const parts = body.split("|").map((p) => p.trim());
    const v: MaskVariants = { specific: parts[0] ?? "", general: parts[1] || undefined, masked: parts[2] || undefined };
    const mode = resolveMode(cfg, type, id);
    const text = variantFor(v, mode);
    return (
      `<span class="mask-token" data-mask-type="${type}" data-mask-id="${attr(id)}"` +
      ` data-s="${attr(v.specific)}"` +
      (v.general ? ` data-g="${attr(v.general)}"` : "") +
      (v.masked ? ` data-m="${attr(v.masked)}"` : "") +
      ` data-mode="${mode}">${text}</span>`
    );
  });
}

/** Live DOM-swap vanuit de overlay: pas config toe op alle mask-spans. */
export function applyMaskConfigToDom(root: ParentNode, cfg: MaskingConfig | null | undefined): void {
  root.querySelectorAll<HTMLElement>("[data-mask-id]").forEach((el) => {
    const type = (el.dataset.maskType ?? "other") as MaskType;
    const id = el.dataset.maskId ?? "";
    const v: MaskVariants = {
      specific: el.dataset.s ?? el.textContent ?? "",
      general: el.dataset.g,
      masked: el.dataset.m,
    };
    const mode = resolveMode(cfg, type, id);
    const text = variantFor(v, mode);
    if (el.textContent !== text) el.textContent = text;
    el.dataset.mode = mode;
  });
}

export interface DomMaskToken {
  id: string;
  type: MaskType;
  variants: MaskVariants;
  mode: MaskMode;
}

/** Inventariseer alle mask-tokens op de pagina (voor het overlay-panel). */
export function scanMaskTokens(root: ParentNode): DomMaskToken[] {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-mask-id]")).map((el) => ({
    id: el.dataset.maskId ?? "",
    type: (el.dataset.maskType ?? "other") as MaskType,
    variants: { specific: el.dataset.s ?? "", general: el.dataset.g, masked: el.dataset.m },
    mode: (el.dataset.mode ?? "specific") as MaskMode,
  }));
}
