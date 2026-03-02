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
      <a href="/work">Amazon &amp; Bol.com Case Studies</a> |
      <a href="/writing">E-commerce Insights &amp; Articles</a> |
      <a href="/about">About Hans van Leeuwen</a>
    </nav>
  </header>
  <main>
    <section aria-label="Introduction">
      <p>Freelance E-commerce Manager &middot; Amazon &amp; Bol.com Specialist</p>
      <h1>Freelance E-commerce Manager &amp; Marketplace Specialist (Amazon &amp; Bol.com)</h1>
      <h2>Available for freelance &amp; contract roles &mdash; Amazon &amp; Bol.com specialist (NL/EU)</h2>
      <p>I&rsquo;m Hans van Leeuwen &mdash; a freelance e-commerce manager based in Amersfoort, specializing in Amazon, Bol.com, and marketplace growth. I help brands across the Netherlands and EU turn digital channels into revenue engines.</p>
      <p>Based in Amersfoort, Netherlands &middot; Available for NL &amp; EU projects</p>
      <a href="/work">Amazon &amp; Bol.com case studies</a>
      <a href="mailto:hansvl3@gmail.com?subject=Marketplace Audit Request">Request a marketplace audit</a>
    </section>
    <section aria-label="Proven results">
      <ul>
        <li>70% market share on Amazon NL (earplug category, Nielsen Data)</li>
        <li>20% weekly sales increase via targeted marketplace campaigns</li>
        <li>Out-of-stock rates below 2% through forecasting &amp; logistics</li>
      </ul>
    </section>
    <section aria-label="What I do">
      <h2>E-commerce expertise that drives results</h2>
      <ul>
        <li><strong>Amazon Marketplace Management</strong> &mdash; Listing optimization, A+ content, Amazon Ads (Sponsored Products, Brands, Display), pricing strategy, and operations.</li>
        <li><strong>Bol.com Optimization</strong> &mdash; Content optimization, Bol Ads, catalog management, and performance analytics on the Netherlands&rsquo; largest marketplace.</li>
        <li><strong>Marketplace CRO &amp; Growth</strong> &mdash; Data-driven conversion rate optimization, A/B testing, and revenue scaling for e-commerce businesses.</li>
        <li><strong>SEO &amp; Content Strategy</strong> &mdash; Search-first content strategies that drive organic traffic and improve marketplace rankings.</li>
      </ul>
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
    <p>&copy; 2026 Hans van Leeuwen | Freelance E-commerce Manager | Amersfoort, Netherlands</p>
    <nav aria-label="Footer navigation">
      <a href="/">Home</a> |
      <a href="/work">Amazon &amp; Bol.com Case Studies</a> |
      <a href="/writing">E-commerce Articles</a> |
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

const PLACEHOLDER = '<div id="root">';
if (html.includes(`${PLACEHOLDER}</div>`)) {
  // Already empty root — safe to inject
  html = html.replace(`${PLACEHOLDER}</div>`, `${PLACEHOLDER}\n  ${STATIC_CONTENT}\n</div>`);
  fs.writeFileSync(DIST_HTML, html, "utf8");
  console.log("[inject-static-content] Static content injected into dist/index.html successfully.");
} else if (html.includes(PLACEHOLDER)) {
  // Root has content already (e.g. previous run). Replace up to first </div> after root.
  const rootStart = html.indexOf(PLACEHOLDER);
  const afterRoot = html.indexOf("</div>", rootStart + PLACEHOLDER.length);
  if (afterRoot === -1) {
    console.error("[inject-static-content] Malformed HTML structure. Skipping.");
    process.exit(1);
  }
  html = html.slice(0, rootStart + PLACEHOLDER.length) + "\n  " + STATIC_CONTENT + "\n" + html.slice(afterRoot);
  fs.writeFileSync(DIST_HTML, html, "utf8");
  console.log("[inject-static-content] Static content replaced in dist/index.html successfully.");
} else {
  console.error('[inject-static-content] <div id="root"> not found. Skipping.');
  process.exit(1);
}
