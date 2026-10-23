import type {
  ValidationRule,
  ValidationError,
  ListingFieldType,
  ListingContent,
  QualityScore,
  ProductInput,
} from "./types";

function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

function getFieldContent(content: ListingContent, fieldType: ListingFieldType): string {
  switch (fieldType) {
    case "title": return content.title ?? "";
    case "bullets": return (content.bullets ?? []).join("\n");
    case "description": return content.description ?? "";
    case "backend_keywords": return content.backend_keywords ?? "";
    case "a_plus_brand_story": return content.a_plus_brand_story ?? "";
    case "a_plus_features": return content.a_plus_features ?? "";
    case "a_plus_comparison": return content.a_plus_comparison ?? "";
    case "image_brief": return content.image_brief ?? "";
  }
}

function validateMaxChars(
  text: string,
  rule: ValidationRule
): ValidationError | null {
  const max = (rule.rule_config as { max: number }).max;
  if (!max || text.length <= max) return null;
  return {
    rule_id: rule.id,
    rule_type: "max_chars",
    severity: rule.severity,
    message: `${rule.description ?? "Text too long"} (${text.length}/${max} chars)`,
    field_type: rule.field_type,
    details: { current: text.length, max },
  };
}

function validateMaxBytes(
  text: string,
  rule: ValidationRule
): ValidationError | null {
  const max = (rule.rule_config as { max: number }).max;
  if (!max) return null;
  const bytes = getByteLength(text);
  if (bytes <= max) return null;
  return {
    rule_id: rule.id,
    rule_type: "max_bytes",
    severity: rule.severity,
    message: `${rule.description ?? "Text exceeds byte limit"} (${bytes}/${max} bytes)`,
    field_type: rule.field_type,
    details: { current: bytes, max },
  };
}

function validateForbiddenPhrases(
  text: string,
  rule: ValidationRule
): ValidationError | null {
  const phrases = (rule.rule_config as { phrases: string[] }).phrases;
  if (!phrases?.length) return null;
  const lower = text.toLowerCase();
  const found = phrases.filter((p) => lower.includes(p.toLowerCase()));
  if (found.length === 0) return null;
  return {
    rule_id: rule.id,
    rule_type: "forbidden_phrases",
    severity: rule.severity,
    message: `${rule.description ?? "Forbidden phrases found"}: "${found.join('", "')}"`,
    field_type: rule.field_type,
    details: { found },
  };
}

function validateKeywordDedup(
  content: ListingContent,
  rule: ValidationRule
): ValidationError | null {
  if (rule.field_type !== "backend_keywords") return null;
  const backendWords = (content.backend_keywords ?? "")
    .toLowerCase()
    .split(/[\s,;]+/)
    .filter(Boolean);
  const titleWords = new Set(
    (content.title ?? "").toLowerCase().split(/\s+/).filter(Boolean)
  );
  const bulletWords = new Set(
    (content.bullets ?? [])
      .join(" ")
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
  );

  const duplicates = backendWords.filter(
    (w) => titleWords.has(w) || bulletWords.has(w)
  );
  const unique = [...new Set(duplicates)];
  if (unique.length === 0) return null;
  return {
    rule_id: rule.id,
    rule_type: "keyword_dedup",
    severity: rule.severity,
    message: `Backend keywords duplicate words from title/bullets: "${unique.slice(0, 5).join('", "')}"${unique.length > 5 ? ` (+${unique.length - 5} more)` : ""}`,
    field_type: rule.field_type,
    details: { duplicates: unique },
  };
}

function validateFormatPattern(
  text: string,
  rule: ValidationRule
): ValidationError | null {
  const pattern = (rule.rule_config as { pattern: string }).pattern;
  if (!pattern) return null;
  try {
    const re = new RegExp(pattern);
    if (re.test(text)) return null;
    return {
      rule_id: rule.id,
      rule_type: "format_pattern",
      severity: rule.severity,
      message: rule.description ?? "Content does not match required format",
      field_type: rule.field_type,
    };
  } catch {
    return null;
  }
}

export function validateField(
  content: ListingContent,
  fieldType: ListingFieldType,
  rules: ValidationRule[]
): ValidationError[] {
  const text = getFieldContent(content, fieldType);
  const fieldRules = rules.filter((r) => r.field_type === fieldType && r.active);
  const errors: ValidationError[] = [];

  for (const rule of fieldRules) {
    let error: ValidationError | null = null;
    switch (rule.rule_type) {
      case "max_chars":
        if (fieldType === "bullets") {
          const max = (rule.rule_config as { max: number }).max;
          (content.bullets ?? []).forEach((bullet, i) => {
            if (bullet.length > max) {
              errors.push({
                rule_id: rule.id,
                rule_type: "max_chars",
                severity: rule.severity,
                message: `Bullet ${i + 1} too long (${bullet.length}/${max} chars)`,
                field_type: rule.field_type,
                details: { bullet_index: i, current: bullet.length, max },
              });
            }
          });
        } else {
          error = validateMaxChars(text, rule);
        }
        break;
      case "max_bytes":
        error = validateMaxBytes(text, rule);
        break;
      case "forbidden_phrases":
        error = validateForbiddenPhrases(text, rule);
        break;
      case "keyword_dedup":
        error = validateKeywordDedup(content, rule);
        break;
      case "format_pattern":
        error = validateFormatPattern(text, rule);
        break;
    }
    if (error) errors.push(error);
  }

  return errors;
}

export function validateListing(
  content: ListingContent,
  rules: ValidationRule[]
): ValidationError[] {
  const allFields: ListingFieldType[] = [
    "title",
    "bullets",
    "description",
    "backend_keywords",
    "a_plus_brand_story",
    "a_plus_features",
    "a_plus_comparison",
    "image_brief",
  ];
  return allFields.flatMap((f) => validateField(content, f, rules));
}

export function getRulesForContext(
  allRules: ValidationRule[],
  marketplace: string,
  country: string
): ValidationRule[] {
  return allRules.filter(
    (r) =>
      r.active &&
      r.marketplace === marketplace &&
      (r.target_country === null || r.target_country === country)
  );
}

export function calculateQualityScore(
  content: ListingContent,
  input: ProductInput,
  errors: ValidationError[]
): QualityScore {
  const completeness = calculateCompleteness(content);
  const readability = calculateReadability(content);
  const keywordCoverage = calculateKeywordCoverage(content, input);
  const compliance = calculateCompliance(errors);
  const consistency = calculateConsistency(content, input);

  const total = Math.round(
    completeness * 0.25 +
    readability * 0.25 +
    keywordCoverage * 0.20 +
    compliance * 0.20 +
    consistency * 0.10
  );

  return { total, completeness, readability, keyword_coverage: keywordCoverage, compliance, consistency };
}

function calculateCompleteness(content: ListingContent): number {
  let filled = 0;
  const total = 5;
  if (content.title && content.title.length > 10) filled++;
  if (content.bullets && content.bullets.length >= 3) filled++;
  if (content.description && content.description.length > 50) filled++;
  if (content.backend_keywords && content.backend_keywords.length > 10) filled++;
  if (content.a_plus_brand_story || content.a_plus_features) filled++;
  return Math.round((filled / total) * 100);
}

function calculateReadability(content: ListingContent): number {
  const text = [
    content.title ?? "",
    ...(content.bullets ?? []),
    content.description ?? "",
  ].join(" ");

  if (text.length < 20) return 0;

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0 || sentences.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

  let score = 100;
  if (avgWordsPerSentence > 25) score -= 20;
  if (avgWordsPerSentence > 35) score -= 20;
  if (avgWordLength > 7) score -= 15;
  if (avgWordLength > 9) score -= 15;

  return Math.max(0, Math.min(100, score));
}

function calculateKeywordCoverage(content: ListingContent, input: ProductInput): number {
  const productWords = [
    input.product_name,
    input.brand ?? "",
    input.category_hint ?? "",
    ...Object.values(input.specs),
  ]
    .join(" ")
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (productWords.length === 0) return 100;

  const contentText = [
    content.title ?? "",
    ...(content.bullets ?? []),
    content.description ?? "",
    content.backend_keywords ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const uniqueWords = [...new Set(productWords)];
  const found = uniqueWords.filter((w) => contentText.includes(w));
  return Math.round((found.length / uniqueWords.length) * 100);
}

function calculateCompliance(errors: ValidationError[]): number {
  const errorCount = errors.filter((e) => e.severity === "error").length;
  const warningCount = errors.filter((e) => e.severity === "warning").length;
  let score = 100;
  score -= errorCount * 25;
  score -= warningCount * 10;
  return Math.max(0, Math.min(100, score));
}

function calculateConsistency(content: ListingContent, input: ProductInput): number {
  let checks = 0;
  let passed = 0;

  if (input.brand) {
    checks++;
    if ((content.title ?? "").toLowerCase().includes(input.brand.toLowerCase())) passed++;
  }

  if (input.product_name) {
    checks++;
    const nameWords = input.product_name.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const titleLower = (content.title ?? "").toLowerCase();
    const matchCount = nameWords.filter((w) => titleLower.includes(w)).length;
    if (nameWords.length > 0 && matchCount / nameWords.length >= 0.5) passed++;
  }

  if (input.ean_gtin) {
    checks++;
    passed++;
  }

  if (checks === 0) return 100;
  return Math.round((passed / checks) * 100);
}
