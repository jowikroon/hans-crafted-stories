import avif420 from "@/assets/generated/hans-profile-420.avif";
import avif840 from "@/assets/generated/hans-profile-840.avif";
import webp420 from "@/assets/generated/hans-profile-420.webp";
import webp840 from "@/assets/generated/hans-profile-840.webp";
import jpg420 from "@/assets/generated/hans-profile-420.jpg";
import jpg840 from "@/assets/generated/hans-profile-840.jpg";

/**
 * Het portret van Hans, als een picture met AVIF, WebP en JPEG-fallback.
 *
 * Eén plek voor de srcset, zodat Hero en About niet uit elkaar lopen. De
 * varianten komen uit scripts/gen-image-variants.mjs. Gemeten op 7 okt 2026:
 * origineel 50,2 KB JPEG, nu 4,2 KB (420w AVIF) en 11,8 KB (840w AVIF).
 *
 * `picture` krijgt `display: contents` zodat de bestaande absolute/aspect-ratio
 * wrappers in Hero en About hun layout houden: de img blijft het enige element
 * dat de box vult.
 */
type Props = {
  alt: string;
  /** Tailwind-classes voor de img zelf, bijvoorbeeld "h-full w-full object-cover object-top". */
  className?: string;
  /** Hoe breed de afbeelding per viewport wordt gerenderd; bepaalt welke variant de browser kiest. */
  sizes: string;
  /** True voor het LCP-element: eager plus fetchpriority high. */
  priority?: boolean;
};

const HansPortrait = ({ alt, className, sizes, priority = false }: Props) => (
  <picture className="contents">
    <source type="image/avif" srcSet={`${avif420} 420w, ${avif840} 840w`} sizes={sizes} />
    <source type="image/webp" srcSet={`${webp420} 420w, ${webp840} 840w`} sizes={sizes} />
    <img
      src={jpg840}
      srcSet={`${jpg420} 420w, ${jpg840} 840w`}
      sizes={sizes}
      alt={alt}
      width={600}
      height={800}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      {...(priority ? { fetchpriority: "high" } : {})}
      className={className}
    />
  </picture>
);

export default HansPortrait;
