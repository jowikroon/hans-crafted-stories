import { useCallback, type ReactNode } from "react";

/**
 * Renders a mailto link without exposing the full email in the initial HTML (reduces scraping/spam).
 * Builds href on first click from user + domain so crawlers don't see the plain address.
 */
interface ObfuscatedMailtoProps {
  /** Local part (before @). */
  user: string;
  /** Domain (after @). */
  domain: string;
  subject?: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}

export function ObfuscatedMailto({
  user,
  domain,
  subject,
  className,
  children,
  "aria-label": ariaLabel,
}: ObfuscatedMailtoProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const address = `${user}@${domain}`;
      const url = subject
        ? `mailto:${address}?subject=${encodeURIComponent(subject)}`
        : `mailto:${address}`;
      window.location.href = url;
    },
    [user, domain, subject]
  );

  return (
    <a
      href="#contact"
      onClick={handleClick}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}
