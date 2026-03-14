var SUPABASE_URL = "https://pesfakewujjwkyybwaom.supabase.co";
var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2Zha2V3dWpqd2t5eWJ3YW9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzcyNzQsImV4cCI6MjA4NzQ1MzI3NH0.6jTLT1MbeTKhxVW5ATtDnkRa02N-X5zlt3zGgFVA3iU";

var STATIC_META = {
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

async function getBlogMeta(slug) {
  try {
    var url = SUPABASE_URL + "/rest/v1/blog_posts?slug=eq." + encodeURIComponent(slug) + "&select=title,meta_title,meta_description,og_title,og_description,excerpt&limit=1";
    var res = await fetch(url, {
      headers: {
        "apikey": SUPABASE_ANON,
        "Authorization": "Bearer " + SUPABASE_ANON
      }
    });
    if (!res.ok) return null;
    var rows = await res.json();
    if (rows.length > 0) return rows[0];
    return null;
  } catch (e) {
    return null;
  }
}

function rewrite(response, title, desc, ogTitle, ogDesc, canonical) {
  return new HTMLRewriter()
    .on("title", {
      element: function(element) {
        element.setInnerContent(title);
      },
    })
    .on('meta[name="description"]', {
      element: function(element) {
        element.setAttribute("content", desc);
      },
    })
    .on('link[rel="canonical"]', {
      element: function(element) {
        element.setAttribute("href", canonical);
      },
    })
    .on('meta[property="og:title"]', {
      element: function(element) {
        element.setAttribute("content", ogTitle);
      },
    })
    .on('meta[property="og:description"]', {
      element: function(element) {
        element.setAttribute("content", ogDesc);
      },
    })
    .on('meta[property="og:url"]', {
      element: function(element) {
        element.setAttribute("content", canonical);
      },
    })
    .on('meta[name="twitter:title"]', {
      element: function(element) {
        element.setAttribute("content", ogTitle);
      },
    })
    .on('meta[name="twitter:description"]', {
      element: function(element) {
        element.setAttribute("content", ogDesc);
      },
    })
    .on('meta[name="twitter:url"]', {
      element: function(element) {
        element.setAttribute("content", canonical);
      },
    })
    .transform(response);
}

export async function onRequest(context) {
  var response = await context.next();
  var contentType = response.headers.get("content-type") || "";
  if (contentType.indexOf("text/html") === -1) {
    return response;
  }

  var url = new URL(context.request.url);
  var path = url.pathname;
  var canonical = "https://hansvanleeuwen.com" + path;

  // Check blog post routes: /writing/:slug
  var blogMatch = path.match(/^\/writing\/([a-z0-9-]+)\/?$/);
  if (blogMatch) {
    var post = await getBlogMeta(blogMatch[1]);
    if (post) {
      var title = post.meta_title || post.title;
      var desc = post.meta_description || post.excerpt || "";
      var ogTitle = post.og_title || post.title;
      var ogDesc = post.og_description || post.excerpt || "";
      return rewrite(response, title, desc, ogTitle, ogDesc, canonical);
    }
  }

  // Check static pages
  var meta = STATIC_META[path];
  if (meta) {
    return rewrite(response, meta.t, meta.d, meta.t, meta.d, canonical);
  }

  return response;
}
