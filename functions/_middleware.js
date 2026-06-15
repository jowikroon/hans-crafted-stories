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

export async function onRequest(context) {
  // HAN-92: canonical host — 301 any www.* request to the non-www apex so the
  // legacy builder URL (www.hansvanleeuwen.com/225250714/020307-soto) de-indexes.
  var _u = new URL(context.request.url);
  if (_u.hostname === "www.hansvanleeuwen.com") {
    return Response.redirect("https://hansvanleeuwen.com" + _u.pathname + _u.search, 301);
  }

  // HAN-118: leaked CMS stub — _redirects rule wordt door Pages niet toegepast op deze route; hard 301 hier (middleware draait vóór asset/SPA-fallback).
  var reqPath = new URL(context.request.url).pathname;
  if (reqPath === "/writing/untitled-3" || reqPath === "/writing/untitled-3/" || reqPath === "/writing/untitled" || reqPath === "/writing/untitled-2") {
    return Response.redirect("https://hansvanleeuwen.com/writing", 301);
  }

  // HAN-118: true 404 for unknown routes. Cloudflare Pages serves the SPA index.html
  // fallback (HTTP 200) for any unmatched path, producing soft-404s (e.g. /untitled-3).
  // We resolve the response, and if an HTML path is not a known route and not a real
  // prerendered file, we relabel the status to 404 so search engines drop it.
  var KNOWN_EXACT = {
    "/": 1, "/work": 1, "/writing": 1, "/about": 1, "/privacy": 1,
    "/amazon-nl-specialist": 1, "/bol-com-consultant": 1, "/interim-ecommerce-manager": 1,
    "/ai-ecommerce-automation": 1,
    "/work/connect-car-parts": 1, "/wiki": 1, "/portal": 1, "/write": 1, "/samantha": 1,
    "/blog-cms": 1, "/auth/callback": 1
  };
  function isKnownRoute(p) {
    var clean = p.replace(/\/$/, "") || "/";
    if (KNOWN_EXACT[clean]) return true;
    // Real prerendered blog articles live at /writing/<slug>/index.html — Pages serves them
    // as files (not the SPA fallback). The dynamic prefixes below are legitimately app-routed.
    if (clean.indexOf("/writing/") === 0) return true;   // article slug (real file or app route)
    if (clean.indexOf("/write/") === 0) return true;     // CMS editor (auth-gated app route)
    if (clean.indexOf("/work/") === 0) return true;      // case-study detail app route
    if (clean.indexOf("/blog-cms/") === 0) return true;  // CMS sub-route
    return false;
  }
  var response = await context.next();
  var contentType = response.headers.get("content-type") || "";
  if (contentType.indexOf("text/html") === -1) return response;

  var path = new URL(context.request.url).pathname;

  // HAN-118: relabel soft-404 SPA fallback as a real 404 for unknown routes.
  if (!isKnownRoute(path)) {
    return new Response(response.body, {
      status: 404,
      statusText: "Not Found",
      headers: response.headers
    });
  }

  var m = META[path];
  if (!m) return response;

  return rewrite(response, m, "https://hansvanleeuwen.com" + path);
}
