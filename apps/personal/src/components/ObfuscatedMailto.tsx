import { useCallback, type ReactNode } from "react";

/**
 * Renders a mailto link without exposing the full email in the initial HTML (reduces scraping/spam).
 * The real mailto: href is set on first hover/focus/touch and on click, so it behaves as a real
 * email link (status bar, copy link, keyboard) while crawlers only see a neutral "mailto:" href.
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

  const reveal = useCallback(
    (e: React.SyntheticEvent<HTMLAnchorElement>) => {
      const address = `${user}@${domain}`;
      e.currentTarget.href = subject
        ? `mailto:${address}?subject=${encodeURIComponent(subject)}`
        : `mailto:${address}`;
    },
    [user, domain, subject]
  );

  return (
    <a
      href="mailto:"
      onMouseEnter={reveal}
      onFocus={reveal}
      onTouchStart={reveal}
      onClick={handleClick}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}
