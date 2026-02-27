import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";
import { useSEO } from "@/hooks/useSEO";

const NotFound = () => {
  const location = useLocation();
  const { lang } = useLang();
  const t = translations[lang].notFound;
  const seo = translations[lang].seo;

  useSEO({
    title: seo.notFoundTitle,
    description: "The page you're looking for doesn't exist or has been moved.",
    url: `https://hansvanleeuwen.com${location.pathname}`,
  });

  useEffect(() => {
    // Set noindex for 404 pages
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    robots.content = "noindex, nofollow";

    console.error("404 Error: User attempted to access non-existent route:", location.pathname);

    return () => {
      if (robots) robots.content = "index, follow";
    };
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{t.heading}</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t.message}</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {t.returnHome}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
