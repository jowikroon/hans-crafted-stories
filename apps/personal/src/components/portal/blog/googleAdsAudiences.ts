// Google Ads audience taxonomy — curated subset relevant to hansvanleeuwen.com
// (design contract #17). Categories follow the Google Ads audience model:
// Affinity · In-market · Demographics · Life events · Custom segments.

export interface AdsAudience {
  category: "Affinity" | "In-market" | "Demographics" | "Life events" | "Custom";
  label: string;
}

export const ADS_AUDIENCES: AdsAudience[] = [
  // ── Affinity ───────────────────────────────────────────────
  { category: "Affinity", label: "Business Professionals" },
  { category: "Affinity", label: "Business Professionals › Sales & Marketing Pros" },
  { category: "Affinity", label: "Business Professionals › Executives & Decision Makers" },
  { category: "Affinity", label: "Technology › Technophiles" },
  { category: "Affinity", label: "Technology › AI & Machine Learning Enthusiasts" },
  { category: "Affinity", label: "Shoppers › Value Shoppers" },
  { category: "Affinity", label: "Shoppers › Luxury Shoppers" },
  { category: "Affinity", label: "Shoppers › Bargain Hunters" },
  { category: "Affinity", label: "Banking & Finance › Avid Investors" },
  { category: "Affinity", label: "Media & Entertainment › Business News Readers" },
  { category: "Affinity", label: "Lifestyles & Hobbies › Frequent Online Shoppers" },
  { category: "Affinity", label: "News & Politics › Avid Business News Readers" },

  // ── In-market ──────────────────────────────────────────────
  { category: "In-market", label: "Business Services › E-commerce Services" },
  { category: "In-market", label: "Business Services › Marketing Services" },
  { category: "In-market", label: "Business Services › SEO & SEM Services" },
  { category: "In-market", label: "Business Services › Business Consulting" },
  { category: "In-market", label: "Business Services › Web Design & Development" },
  { category: "In-market", label: "Software › Business & Productivity Software" },
  { category: "In-market", label: "Software › E-commerce Platforms" },
  { category: "In-market", label: "Software › Marketing Automation" },
  { category: "In-market", label: "Software › Analytics & Data Tools" },
  { category: "In-market", label: "Employment › Career Consulting Services" },
  { category: "In-market", label: "Financial Services › Business Loans" },
  { category: "In-market", label: "Education › Business & Marketing Courses" },
  { category: "In-market", label: "Auto Parts & Accessories (CCP cross-over)" },

  // ── Demographics ───────────────────────────────────────────
  { category: "Demographics", label: "Small Business Owners (1-10 employees)" },
  { category: "Demographics", label: "MKB / SMB Owners (10-50 employees)" },
  { category: "Demographics", label: "Company Size: 50-250 (mid-market)" },
  { category: "Demographics", label: "Job: E-commerce Manager" },
  { category: "Demographics", label: "Job: Marketing Manager / CMO" },
  { category: "Demographics", label: "Job: Founder / DGA" },
  { category: "Demographics", label: "Job: Category / Marketplace Manager" },
  { category: "Demographics", label: "Education: HBO/WO" },
  { category: "Demographics", label: "Geo: Netherlands" },
  { category: "Demographics", label: "Geo: Benelux" },
  { category: "Demographics", label: "Geo: DACH (Amazon.de sellers)" },

  // ── Life events ────────────────────────────────────────────
  { category: "Life events", label: "Business Creation (recently started a business)" },
  { category: "Life events", label: "Job Change (new role in e-commerce)" },
  { category: "Life events", label: "Business Expansion (entering new marketplaces)" },
  { category: "Life events", label: "Funding Round / Investment received" },

  // ── Custom segments ────────────────────────────────────────
  { category: "Custom", label: "Searched: 'bol.com partner worden'" },
  { category: "Custom", label: "Searched: 'amazon nl verkopen'" },
  { category: "Custom", label: "Searched: 'amazon fba nederland'" },
  { category: "Custom", label: "Searched: 'marketplace strategie'" },
  { category: "Custom", label: "Searched: 'e-commerce manager inhuren'" },
  { category: "Custom", label: "Searched: 'freelance e-commerce specialist'" },
  { category: "Custom", label: "Searched: 'bol ads optimaliseren'" },
  { category: "Custom", label: "Searched: 'amazon listing optimalisatie'" },
  { category: "Custom", label: "Searched: 'buy box winnen'" },
  { category: "Custom", label: "Visited: bol.com seller portal" },
  { category: "Custom", label: "Visited: Amazon Seller Central" },
  { category: "Custom", label: "Visited: e-commerce blogs (Emerce, Twinkle)" },
  { category: "Custom", label: "App users: Amazon Seller App" },
  { category: "Custom", label: "AI-curious: ChatGPT/Claude for business use" },
];

export const AUDIENCE_CATEGORIES = ["Affinity", "In-market", "Demographics", "Life events", "Custom"] as const;
