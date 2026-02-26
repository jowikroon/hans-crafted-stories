import Hero from "@/components/Hero";
import { useSEO } from "@/hooks/useSEO";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";

const Index = () => {
  const { lang } = useLang();
  const seo = translations[lang].seo;

  useSEO({
    title: seo.homeTitle,
    description: seo.homeDescription,
    url: "https://hansvanleeuwen.com/",
  });

  return <Hero />;
};

export default Index;
