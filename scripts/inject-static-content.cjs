/**
 * Post-build script: inject static semantic HTML into <div id="root"> in dist/index.html.
 *
 * Why: The app uses createRoot().render() (full replacement), so React will replace this
 * content on load. Crawlers that don't execute JS will see real H1/H2/content/links in the
 * primary HTML instead of an empty root div, improving crawlability and first-paint content.
 *
 * Usage: node scripts/inject-static-content.cjs  (run after `vite build`)
 */

const fs = require("fs");
const path = require("path");

const DIST_HTML = path.resolve(__dirname, "../dist/index.html");

const STATIC_CONTENT = `<header>
    <nav aria-label="Primary navigation">
      <a href="/">Home</a> |
      <a href="/work">Amazon NL Marketplace Case Studies</a> |
      <a href="/writing">Amazon &amp; Bol.com Optimization Articles</a> |
      <a href="/about">About Hans van Leeuwen</a>
    </nav>
  </header>
  <main>
    <section aria-label="Introduction">
      <p>Freelance E-commerce Manager &middot; Amazon &amp; Bol.com Specialist</p>
      <h1>Freelance E-commerce Manager &amp; Marketplace Specialist (Amazon &amp; Bol.com)</h1>
      <h2>Grow Amazon NL &amp; Bol.com revenue with a hands-on interim marketplace lead</h2>
      <p>I&rsquo;m Hans van Leeuwen &mdash; a freelance e-commerce manager and marketplace consultant based in Amersfoort, Netherlands. I specialize in <a href="/amazon-nl-specialist">Amazon marketplace management</a>, <a href="/bol-com-consultant">Bol.com optimization</a>, and scalable marketplace growth. As an experienced <a href="/interim-ecommerce-manager">interim e-commerce manager in the Netherlands</a>, I help brands across the Netherlands and EU turn digital channels into revenue engines.</p>
      <p>Based in Amersfoort, Netherlands &middot; Working with brands across Amsterdam, Utrecht, Rotterdam &amp; the wider EU</p>
      <a href="/work">Amazon NL marketplace case studies</a>
      <a href="/about#contact">Get a 7-point Amazon NL &amp; Bol.com marketplace audit (48h reply)</a>
      <a href="/about#contact">Book a 30-min Amazon NL &amp; Bol.com growth call</a>
    </section>
    <section aria-label="Proven results">
      <ul>
        <li><strong>70% market share on Amazon NL</strong> (earplug category, Nielsen Data) &mdash; Full listing overhaul, A+ content, and Sponsored Products strategy within 18 months.</li>
        <li><strong>20% weekly sales increase</strong> via targeted Bol Ads campaigns and seasonal bundles.</li>
        <li><strong>Out-of-stock rates below 2%</strong> through demand forecasting and optimized logistics.</li>
      </ul>
    </section>
    <section aria-label="Who I help">
      <h2>Brands I work with</h2>
      <ul>
        <li>D2C brands scaling into Amazon &amp; Bol.com</li>
        <li>Category leaders defending market share on marketplaces</li>
        <li>Brands entering the Dutch &amp; EU marketplace landscape</li>
        <li>Companies seeking an interim e-commerce manager or marketplace strategist</li>
      </ul>
    </section>
    <section aria-label="Problems I solve">
      <h2>Common challenges I tackle</h2>
      <ul>
        <li>High ACOS eating into ad profitability</li>
        <li>Low conversion rates on product detail pages</li>
        <li>Stockouts and Buy Box loss due to poor forecasting</li>
        <li>Listing suppression and catalog compliance issues</li>
        <li>Weak organic ranking and poor indexing on Amazon or Bol.com</li>
        <li>No clear marketplace strategy or KPI framework</li>
      </ul>
    </section>
    <section aria-label="What I do">
      <h2>Amazon &amp; Bol.com Marketplace Management (NL/EU)</h2>
      <ul>
        <li><strong>Amazon Marketplace Management</strong> &mdash; Listing optimization, A+ content, Amazon Ads (Sponsored Products, Brands, Display), pricing strategy, and operations. Your Amazon NL specialist for scalable growth.</li>
        <li><strong>Bol.com Optimization</strong> &mdash; Content optimization, Bol Ads management, catalog management, and performance analytics. Hands-on Bol.com consultant for the Netherlands&rsquo; largest marketplace.</li>
        <li><strong>Marketplace CRO &amp; Growth</strong> &mdash; Data-driven conversion rate optimization, A/B testing, and revenue scaling. Reduce friction, improve Buy Box win rate, and grow profitably.</li>
        <li><strong>SEO &amp; Content Strategy</strong> &mdash; Search-first content strategies that drive organic traffic and improve marketplace rankings. UX design focused on reducing friction and increasing conversions.</li>
      </ul>
    </section>
    <section aria-label="Engagement Model">
      <h2>Engagement Model</h2>
      <ol>
        <li><strong>Discovery</strong> &mdash; Audit your current marketplace presence, identify quick wins and long-term growth levers.</li>
        <li><strong>Strategy</strong> &mdash; Build a tailored action plan with KPIs, timelines, and clear ownership.</li>
        <li><strong>Execution</strong> &mdash; Hands-on implementation from listing optimization to ad campaigns with weekly check-ins.</li>
        <li><strong>Scale</strong> &mdash; Iterate based on data, expand to new channels, and compound results over time.</li>
      </ol>
    </section>
    <section aria-label="FAQ">
      <h2>Frequently Asked Questions</h2>
      <dl>
        <dt>What marketplaces does Hans van Leeuwen specialize in?</dt>
        <dd>Hans specializes in Amazon and Bol.com marketplace management, including product listing optimization, advertising (Amazon Ads, Bol Ads), A+ content creation, catalog management, and growth strategy.</dd>
        <dt>What e-commerce services does Hans offer?</dt>
        <dd>Hans provides marketplace management, conversion rate optimization (CRO), UX design for e-commerce, SEO &amp; content strategy, data-driven analytics, and digital commerce consulting for brands across the Netherlands and EU.</dd>
        <dt>Is Hans van Leeuwen available for freelance or contract work?</dt>
        <dd>Hans is based in Amersfoort, Netherlands and available for e-commerce management roles, consulting, and freelance marketplace projects. Contact via LinkedIn or email for availability.</dd>
      </dl>
    </section>
  </main>
  <footer>
    <p>&copy; {{CURRENT_YEAR}} Hans van Leeuwen | Freelance E-commerce Manager | Amersfoort, Netherlands</p>
    <nav aria-label="Footer navigation">
      <a href="/">Home</a> |
      <a href="/work">Amazon NL Marketplace Case Studies</a> |
      <a href="/writing">Amazon &amp; Bol.com Optimization Articles</a> |
      <a href="/about">About Hans van Leeuwen</a>
    </nav>
  </footer>`;

if (!fs.existsSync(DIST_HTML)) {
  console.error(`[inject-static-content] dist/index.html not found. Run 'vite build' first.`);
  process.exit(1);
}

let html = fs.readFileSync(DIST_HTML, "utf8");

if (!html.includes('<div id="root">')) {
  console.error('[inject-static-content] Could not find <div id="root"> in dist/index.html. Skipping.');
  process.exit(1);
}

const CURRENT_YEAR = String(new Date().getFullYear());

const PLACEHOLDER = '<div id="root">';
if (html.includes(`${PLACEHOLDER}</div>`)) {
  // Already empty root — safe to inject
  html = html.replace(`${PLACEHOLDER}</div>`, `${PLACEHOLDER}\n  ${STATIC_CONTENT}\n</div>`);
} else if (html.includes(PLACEHOLDER)) {
  // Root has content already (e.g. previous run). Replace up to first </div> after root.
  const rootStart = html.indexOf(PLACEHOLDER);
  const afterRoot = html.indexOf("</div>", rootStart + PLACEHOLDER.length);
  if (afterRoot === -1) {
    console.error("[inject-static-content] Malformed HTML structure. Skipping.");
    process.exit(1);
  }
  html = html.slice(0, rootStart + PLACEHOLDER.length) + "\n  " + STATIC_CONTENT + "\n" + html.slice(afterRoot);
} else {
  console.error('[inject-static-content] <div id="root"> not found. Skipping.');
  process.exit(1);
}

// Replace build-time placeholders (e.g. copyright year in noscript and injected footer)
html = html.replace(/\{\{CURRENT_YEAR\}\}/g, CURRENT_YEAR);

fs.writeFileSync(DIST_HTML, html, "utf8");
console.log("[inject-static-content] Static content injected and placeholders applied in dist/index.html successfully.");
