import avatarAvif from "@/assets/generated/hans-profile-avatar.avif?no-inline";
import avatarWebp from "@/assets/generated/hans-profile-avatar.webp?no-inline";
import avatarJpg from "@/assets/generated/hans-profile-avatar.jpg?no-inline";

/**
 * De kleine ronde avatar (56px in ServicePage, nog kleiner in de blog-byline).
 *
 * Hiervoor werd hans-profile.jpg gebruikt: 840x1080 en 50,2 KB voor een
 * duimnagel van 56 pixels. Deze variant is 112x112 en 1,1 KB in AVIF, een
 * besparing van 98% op elke geprerenderde dienstenpagina en elk artikel.
 *
 * `?no-inline`: alle drie de varianten zijn onder de 4 KB inline-limiet van Vite
 * en werden dus als base64 in het App-chunk gebakken. Dat zette circa 3 KB gz op
 * het kritieke pad van elke pagina, ook de homepage, waar deze avatar niet
 * voorkomt. Nu zijn het losse bestanden die alleen laden waar ze gerenderd worden.
 */
type Props = {
  alt: string;
  className?: string;
  /** Gerenderde grootte in CSS-pixels; 112px bron dekt dit tot en met 2x DPR. */
  size?: number;
  onError?: React.ReactEventHandler<HTMLImageElement>;
};

const HansAvatar = ({ alt, className, size = 56, onError }: Props) => (
  <picture className="contents">
    <source type="image/avif" srcSet={avatarAvif} />
    <source type="image/webp" srcSet={avatarWebp} />
    <img
      src={avatarJpg}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={className}
      onError={onError}
    />
  </picture>
);

export default HansAvatar;
