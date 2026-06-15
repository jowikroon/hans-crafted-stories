var META = {
  "/work": { t: "Amazon & Bol.com Case Studies | Hans van Leeuwen", d: "Real results from Amazon and Bol.com marketplace projects. 70% market share, 20% weekly sales growth.", ot: "Amazon & Bol.com Case Studies | Hans van Leeuwen", od: "Real results from Amazon and Bol.com marketplace projects. 70% market share, 20% weekly sales growth." },
  "/writing": { t: "E-commerce Insights & Articles | Hans van Leeuwen", d: "Articles on Amazon marketplace management, Bol.com optimization, e-commerce CRO, AI in retail.", ot: "E-commerce Insights & Articles | Hans van Leeuwen", od: "Articles on Amazon marketplace management, Bol.com optimization, e-commerce CRO, AI in retail." },
  "/about": { t: "About Hans van Leeuwen | Freelance E-commerce Manager, Amersfoort", d: "Freelance e-commerce manager in Amersfoort, Netherlands. Amazon, Bol.com, marketplace growth for NL/EU brands.", ot: "About Hans van Leeuwen | Freelance E-commerce Manager, Amersfoort", od: "Freelance e-commerce manager in Amersfoort, Netherlands. Amazon, Bol.com, marketplace growth for NL/EU brands." },
  "/privacy": { t: "Privacy Policy | Hans van Leeuwen", d: "Privacy policy for hansvanleeuwen.com.", ot: "Privacy Policy | Hans van Leeuwen", od: "Privacy policy for hansvanleeuwen.com." },
  "/writing/hidden-cost-dark-patterns": { t: "The Hidden Cost of Dark Patterns in E-commerce | Hans van Leeuwen", d: "Dark patterns boost short-term conversions but destroy trust. Learn why manipulative UX hurts your e-commerce brand and what ethical alternatives drive lasting growth.", ot: "Dark Patterns Are Killing Your E-commerce Brand", od: "Why manipulative design hurts conversion rates long-term \u2014 and what to do instead." },
  "/writing/designing-with-llms": { t: "Designing with LLMs: A UX Framework for E-commerce | Hans van Leeuwen", d: "How to integrate large language models into e-commerce products without losing the human touch. A practical UX framework for AI-powered shopping experiences.", ot: "A UX Framework for LLMs in E-commerce", od: "Most AI integrations fail on design, not technology. Here is a framework that works." },
  "/writing/bookshelf-2024": { t: "The Bookshelf: What I Read in 2024 | Hans van Leeuwen", d: "A curated reading list from 2024 \u2014 design, technology, AI, and fiction. Books that shaped how I think about e-commerce, UX, and building digital products.", ot: "My 2024 Reading List: Design, Tech & AI", od: "The books that shaped my thinking on e-commerce, UX, and product design this year." },
  "/writing/cycling-dutch-countryside": { t: "On Cycling Through the Dutch Countryside | Hans van Leeuwen", d: "Reflections on slowing down while cycling through the Gelderse Vallei. How landscape and movement shape creative thinking and problem-solving.", ot: "Cycling the Dutch Countryside: Meditation in Motion", od: "How 45km through the Gelderse Vallei resets my brain and sharpens creative thinking." },
  "/writing/cro-design-problem": { t: "CRO Is a Design Problem, Not an A/B Testing Exercise | Hans van Leeuwen", d: "Stop running meaningless A/B tests. Real conversion rate optimization starts with understanding why users do not convert \u2014 a design-first approach to CRO.", ot: "CRO Is a Design Problem", od: "Why most A/B testing is theater \u2014 and how design thinking drives real conversions." },
  "/writing/ai-search-ux-lessons": { t: "AI Search UX: Lessons from Deploying Semantic Search to 2M Users | Hans van Leeuwen", d: "What we learned building AI-powered semantic search for e-commerce. The technology was easy \u2014 designing an experience users trusted was the real challenge.", ot: "AI Search UX: What 2M Users Taught Us", od: "The technology was easy. Designing trust in AI search results was the hard part." },
  "/writing/ux-unit-economics": { t: "Why Every UX Designer Should Understand Unit Economics | Hans van Leeuwen", d: "Every design decision has a financial impact. Learn how understanding unit economics makes you a better UX designer and earns you a seat at the strategy table.", ot: "UX Designers: Learn Unit Economics", od: "If you cannot articulate the financial impact of your design work, someone else will." },
  "/writing/sourdough-products": { t: "Making Sourdough and Making Products | Hans van Leeuwen", d: "What three years of sourdough baking taught me about iterative product design. You cannot rush good bread or good products \u2014 both require patience and feedback loops.", ot: "What Sourdough Taught Me About Product Design", od: "You cannot rush good bread or good products. Lessons in patience and iteration." }
};

function rewrite(response, m, canonical) {
  return new HTMLRewriter()
    .on("title", { element: function(el) { el.setInnerContent(m.t); } })
    .on('meta[name="description"]', { element: function(el) { el.setAttribute("content", m.d); } })
    .on('link[rel="canonical"]', { element: function(el) { el.setAttribute("href", canonical); } })
    .on('meta[property="og:title"]', { element: function(el) { el.setAttribute("content", m.ot); } })
    .on('meta[property="og:description"]', { element: function(el) { el.setAttribute("content", m.od); } })
    .on('meta[property="og:url"]', { element: function(el) { el.setAttribute("content", canonical); } })
    .on('meta[name="twitter:title"]', { element: function(el) { el.setAttribute("content", m.ot); } })
    .on('meta[name="twitter:description"]', { element: function(el) { el.setAttribute("content", m.od); } })
    .on('meta[name="twitter:url"]', { element: function(el) { el.setAttribute("content", canonical); } })
    .transform(response);
}

var DEFAULT_REDIRECTS = {
  "/writing/untitled-3": "/writing",
  "/writing/untitled-3/": "/writing",
  "/writing/untitled": "/writing",
  "/writing/untitled-2": "/writing"
};

// Optional KV overlay (binding: EDGE_CONFIG, namespace hvl-edge-config). Lets
// redirects + per-route meta be edited without a deploy. Falls back to the inline
// defaults when the binding is absent or a read fails, so behaviour is identical
// until the binding + keys exist. Keys: "redirects" (json map), "meta" (json map).
async function loadConfig(env) {
  var cfg = { redirects: DEFAULT_REDIRECTS, meta: META };
  try {
    if (env && env.EDGE_CONFIG) {
      var r = await env.EDGE_CONFIG.get("redirects", "json");
      var mt = await env.EDGE_CONFIG.get("meta", "json");
      if (r && typeof r === "object") cfg.redirects = Object.assign({}, DEFAULT_REDIRECTS, r);
      if (mt && typeof mt === "object") cfg.meta = Object.assign({}, META, mt);
    }
  } catch (e) { /* fall back to inline defaults */ }
  return cfg;
}

export async function onRequest(context) {
  var cfg = await loadConfig(context.env);
  var reqPath = new URL(context.request.url).pathname;

  // HAN-118 + KV-driven: hard 301 for leaked/retired stubs (middleware runs before SPA fallback).
  var target = cfg.redirects[reqPath];
  if (target) {
    return Response.redirect(/^https?:\/\//.test(target) ? target : "https://hansvanleeuwen.com" + target, 301);
  }

  var response = await context.next();
  var contentType = response.headers.get("content-type") || "";
  if (contentType.indexOf("text/html") === -1) return response;

  var m = cfg.meta[reqPath];
  if (!m) return response;

  return rewrite(response, m, "https://hansvanleeuwen.com" + reqPath);
}
