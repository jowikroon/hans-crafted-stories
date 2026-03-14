const META = {
  "/work": {
    t: "Amazon & Bol.com Case Studies | Hans van Leeuwen",
    d: "Real results from Amazon and Bol.com marketplace projects. 70% market share, 20% weekly sales growth.",
  },
  "/writing": {
    t: "E-commerce Insights & Articles | Hans van Leeuwen",
    d: "Articles on Amazon marketplace management, Bol.com optimization, e-commerce CRO, AI in retail.",
  },
  "/about": {
    t: "About Hans van Leeuwen | Freelance E-commerce Manager, Amersfoort",
    d: "Freelance e-commerce manager in Amersfoort, Netherlands. Amazon, Bol.com, marketplace growth for NL/EU brands.",
  },
  "/privacy": {
    t: "Privacy Policy | Hans van Leeuwen",
    d: "Privacy policy for hansvanleeuwen.com.",
  },
};

export async function onRequest(context) {
  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  const path = new URL(context.request.url).pathname;
  const meta = META[path];
  if (!meta) {
    return response;
  }

  const canonical = "https://hansvanleeuwen.com" + path;

  return new HTMLRewriter()
    .on("title", {
      element(element) {
        element.setInnerContent(meta.t);
      },
    })
    .on('meta[name="description"]', {
      element(element) {
        element.setAttribute("content", meta.d);
      },
    })
    .on('link[rel="canonical"]', {
      element(element) {
        element.setAttribute("href", canonical);
      },
    })
    .on('meta[property="og:title"]', {
      element(element) {
        element.setAttribute("content", meta.t);
      },
    })
    .on('meta[property="og:description"]', {
      element(element) {
        element.setAttribute("content", meta.d);
      },
    })
    .on('meta[property="og:url"]', {
      element(element) {
        element.setAttribute("content", canonical);
      },
    })
    .on('meta[name="twitter:title"]', {
      element(element) {
        element.setAttribute("content", meta.t);
      },
    })
    .on('meta[name="twitter:description"]', {
      element(element) {
        element.setAttribute("content", meta.d);
      },
    })
    .on('meta[name="twitter:url"]', {
      element(element) {
        element.setAttribute("content", canonical);
      },
    })
    .transform(response);
}
