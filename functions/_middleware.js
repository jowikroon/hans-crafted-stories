const SUPABASE_URL = "https://pesfakewujjwkyybwaom.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2Zha2V3dWpqd2t5eWJ3YW9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzcyNzQsImV4cCI6MjA4NzQ1MzI3NH0.6jTLT1MbeTKhxVW5ATtDnkRa02N-X5zlt3zGgFVA3iU";

const STATIC_META = {
  "/": {
    title: "Freelance E-commerce Manager (Amazon & Bol.com) | Hans van Leeuwen",
    description: "10+ years growing Amazon NL & Bol.com revenue. Listings, ads, CRO & forecasting. Based in Amersfoort, NL/EU. Get a 7-point marketplace audit.",
  },
  "/work": {
    title: "Amazon & Bol.com Case Studies | Hans van Leeuwen",
    description: "Real results from Amazon and Bol.com marketplace projects. 70% market share, 20% weekly sales growth, strategic e-commerce management.",
  },
  "/writing": {
    title: "E-commerce Insights & Articles | Hans van Leeuwen",
    description: "Articles on Amazon marketplace management, Bol.com optimization, e-commerce CRO, AI in retail, and digital strategy.",
  },
  "/about": {
    title: "About Hans van Leeuwen | Freelance E-commerce Manager, Amersfoort",
    description: "Freelance e-commerce manager based in Amersfoort, Netherlands. Specializing in Amazon, Bol.com, and marketplace growth for NL/EU brands.",
  },
  "/privacy": {
    title: "Privacy Policy | Hans van Leeuwen",
    description: "Privacy policy for hansvanleeuwen.com.",
  },
};

async function getBlogMeta(slug) {
  try {
    const res = await fetch(
      SUPABASE_URL + "/rest/v1/blog_posts?slug=eq." + encodeURIComponent(slug) + "&select=title,meta_title,meta_description,og_title,og_description,excerpt&limit=1",
      { headers: { apikey: SUPABASE_ANON, Authorization: "Bearer " + SUPABASE_ANON } }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows.length ? rows[0] : null;
  } catch { return null; }
}

export async function onRequest(context) {
  const res = await context.next();
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("text/html")) return res;

  const path = new URL(context.request.url).pathname;
  let meta = null;

  const blogMatch = path.match(/^\/writing\/([a-z0-9-]+)\/?$/);
  if (blogMatch) {
    const post = await getBlogMeta(blogMatch[1]);
    if (post) {
      meta = {
        title: post.meta_title || post.title,
        description: post.meta_description || post.excerpt || "",
        og_title: post.og_title || post.title,
        og_description: post.og_description || post.excerpt || "",
      };
    }
  }

  if (!meta) meta = STATIC_META[path];
  if (!meta) return res;

  const canonical = "https://hansvanleeuwen.com" + path;
  const t = meta.title;
  const d = meta.description;
  const ogT = meta.og_title || t;
  const ogD = meta.og_description || d;

  return new HTMLRewriter()
    .on("title", { element(el) { el.setInnerContent(t); } })
    .on('meta[name="description"]', { element(el) { el.setAttribute("content", d); } })
    .on('link[rel="canonical"]', { element(el) { el.setAttribute("href", canonical); } })
    .on('meta[property="og:title"]', { element(el) { el.setAttribute("content", ogT); } })
    .on('meta[property="og:description"]', { element(el) { el.setAttribute("content", ogD); } })
    .on('meta[property="og:url"]', { element(el) { el.setAttribute("content", canonical); } })
    .on('meta[name="twitter:title"]', { element(el) { el.setAttribute("content", ogT); } })
    .on('meta[name="twitter:description"]', { element(el) { el.setAttribute("content", ogD); } })
    .on('meta[name="twitter:url"]', { element(el) { el.setAttribute("content", canonical); } })
    .transform(res);
}
