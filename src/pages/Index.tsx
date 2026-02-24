import Hero from "@/components/Hero";
import { useSEO } from "@/hooks/useSEO";

const Index = () => {
  useSEO({
    title: "E-commerce Manager & Marketplace Specialist (Amazon & Bol.com) | Hans van Leeuwen",
    description: "Hans van Leeuwen – E-commerce manager with 10+ years of experience. Driving marketplace growth on Amazon & Bol.com through strategy, UX optimization, and revenue scaling. Based in Amersfoort, NL.",
    url: "https://hansvanleeuwen.com/",
  });
  return <Hero />;
};

export default Index;
