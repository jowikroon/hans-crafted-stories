import { Link } from "@/components/LocalizedLink";

// An editorial connection for this one personal essay, not a promotion on every blog post.
export const GIVING_ARTICLE_SLUG = "het-onverwachte-rendement-van-geven-een-les-in-e-commerce-relaties-ccfs3w";

interface ArticleStoryBridgeProps {
  slug: string;
  articleLang: "nl" | "en";
}

export default function ArticleStoryBridge({ slug, articleLang }: ArticleStoryBridgeProps) {
  if (slug !== GIVING_ARTICLE_SLUG) return null;

  const nl = articleLang === "nl";

  return (
    <aside className="story-bridge" aria-labelledby="story-bridge-heading">
      <h2 id="story-bridge-heading" className="story-bridge__eyebrow">
        {nl ? "Een andere vorm" : "Another form"}
      </h2>
      <p className="story-bridge__thought">
        {nl
          ? "Sommige dingen passen in een dashboard. Andere in een lied. In IETS MOOIS geef ik diezelfde belofte een stem."
          : "Some things fit in a dashboard. Others belong in a song. In IETS MOOIS, I give that same promise a voice."}
      </p>
      <Link to="/music/albums/iets-moois/brand" className="story-bridge__link">
        {nl ? "Het verhaal achter IETS MOOIS" : "Explore IETS MOOIS (story in Dutch)"}
        <span aria-hidden="true"> ↗</span>
      </Link>
      <p className="story-bridge__source">
        {nl ? "De anekdote over de twee broers is verteld door " : "The brothers' story was shared by "}
        <a href="https://www.linkedin.com/posts/dmartell_my-brother-gave-me-everything-he-had-activity-7411458142787518464-gasC" target="_blank" rel="noopener noreferrer">
          Dan Martell
        </a>.
      </p>
    </aside>
  );
}
