import { useSEO } from "@/hooks/useSEO";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";

const Privacy = () => {
  const { lang } = useLang();
  const t = translations[lang].privacy;
  const seo = translations[lang].seo;

  useSEO({
    title: seo.privacyTitle,
    description: seo.privacyDescription,
    url: "https://hansvanleeuwen.com/privacy",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: seo.privacyTitle,
      url: "https://hansvanleeuwen.com/privacy",
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://hansvanleeuwen.com/" },
          { "@type": "ListItem", position: 2, name: t.title },
        ],
      },
    },
  });

  return (
    <section className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="mb-8 font-serif text-4xl font-semibold text-foreground">
        {t.title}
      </h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
        <p className="text-sm text-muted-foreground/70">{t.lastUpdated}</p>

        {t.sections.map((section, i) => (
          <div key={i}>
            <h2 className="text-xl font-semibold text-foreground">{section.heading}</h2>
            <p dangerouslySetInnerHTML={{ __html: section.body }} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default Privacy;
