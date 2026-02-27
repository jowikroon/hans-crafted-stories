import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let body: { url?: string } = {};
    const contentType = req.headers.get("content-type") || "";
    if (req.method === "POST" && contentType.includes("application/json")) {
      const text = await req.text();
      if (text.trim()) {
        try {
          body = JSON.parse(text);
        } catch {
          return new Response(JSON.stringify({ success: false, error: "Invalid JSON body" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }
    const { url } = body;
    if (!url) {
      return new Response(JSON.stringify({ success: false, error: "URL is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: "Firecrawl not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Scraping URL for audit:", formattedUrl);

    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown", "html", "links"],
        onlyMainContent: false,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Firecrawl error:", data);
      return new Response(JSON.stringify({ success: false, error: data.error || "Scrape failed" }), {
        status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract SEO signals from the scraped data
    const html = data.data?.html || data.html || "";
    const metadata = data.data?.metadata || data.metadata || {};
    const links = data.data?.links || data.links || [];
    const markdown = data.data?.markdown || data.markdown || "";

    // Parse headings from HTML
    const headings: { tag: string; text: string }[] = [];
    const headingRegex = /<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi;
    let match;
    while ((match = headingRegex.exec(html)) !== null) {
      headings.push({ tag: match[1].toUpperCase(), text: match[2].replace(/<[^>]*>/g, "").trim() });
    }

    // Count images without alt text
    const imgRegex = /<img\s[^>]*?>/gi;
    const altRegex = /alt\s*=\s*["']([^"']*)["']/i;
    let totalImages = 0;
    let imagesWithoutAlt = 0;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      totalImages++;
      const altMatch = altRegex.exec(imgMatch[0]);
      if (!altMatch || altMatch[1].trim() === "") imagesWithoutAlt++;
    }

    // Check meta description
    const metaDescRegex = /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i;
    const metaDescMatch = metaDescRegex.exec(html);
    const metaDescription = metaDescMatch ? metaDescMatch[1] : metadata.description || "";

    // Check title
    const titleRegex = /<title[^>]*>([\s\S]*?)<\/title>/i;
    const titleMatch = titleRegex.exec(html);
    const pageTitle = titleMatch ? titleMatch[1].trim() : metadata.title || "";

    const audit = {
      url: formattedUrl,
      title: pageTitle,
      titleLength: pageTitle.length,
      metaDescription,
      metaDescriptionLength: metaDescription.length,
      headings,
      h1Count: headings.filter(h => h.tag === "H1").length,
      totalLinks: links.length,
      totalImages,
      imagesWithoutAlt,
      wordCount: markdown.split(/\s+/).filter(Boolean).length,
      issues: [] as string[],
    };

    // Generate issues
    if (!pageTitle) audit.issues.push("Missing page title");
    else if (pageTitle.length > 60) audit.issues.push(`Title too long (${pageTitle.length} chars, recommended < 60)`);
    if (!metaDescription) audit.issues.push("Missing meta description");
    else if (metaDescription.length > 160) audit.issues.push(`Meta description too long (${metaDescription.length} chars, recommended < 160)`);
    if (audit.h1Count === 0) audit.issues.push("No H1 tag found");
    else if (audit.h1Count > 1) audit.issues.push(`Multiple H1 tags found (${audit.h1Count})`);
    if (imagesWithoutAlt > 0) audit.issues.push(`${imagesWithoutAlt} image(s) missing alt text`);

    return new Response(JSON.stringify({ success: true, data: audit }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Site audit error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
