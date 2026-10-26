import { useCallback, useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent } from "react";

/** Hover opens temporarily; a pointer click pins it. Keyboard activation toggles. */
export function useHoverDisclosure({ hover = true, onClose }: { hover?: boolean; onClose?: () => void } = {}) {
  const [isOpen, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pinned = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const frame = useRef<number>();
  const closeCallback = useRef(onClose);
  closeCallback.current = onClose;
  const cancel = useCallback(() => { clearTimeout(timer.current); if (frame.current !== undefined) cancelAnimationFrame(frame.current); }, []);
  const close = useCallback(() => { cancel(); pinned.current = false; setOpen(false); closeCallback.current?.(); }, [cancel]);
  const open = useCallback(() => { cancel(); setOpen(true); }, [cancel]);
  const closeSoon = () => {
    cancel();
    timer.current = setTimeout(() => {
      if (!pinned.current && !containerRef.current?.contains(document.activeElement)) close();
    }, 250);
  };
  useEffect(() => cancel, [cancel]);
  useEffect(() => {
    if (!isOpen) return;
    const outside = (e: PointerEvent) => { if (!containerRef.current?.contains(e.target as Node)) close(); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [isOpen, close]);
  const keyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && isOpen) { e.stopPropagation(); close(); triggerRef.current?.focus(); }
    if (e.target === triggerRef.current && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault(); open();
      frame.current = requestAnimationFrame(() => {
        frame.current = undefined;
        const links = containerRef.current?.querySelectorAll<HTMLAnchorElement>("a[href]");
        (e.key === "ArrowUp" ? links?.[links.length - 1] : links?.[0])?.focus();
      });
    }
  };
  const click = (e: MouseEvent<HTMLButtonElement>) => {
    cancel();
    if (e.detail === 0) { if (isOpen) close(); else { pinned.current = true; open(); } }
    else if (pinned.current) close();
    else { pinned.current = true; open(); }
  };
  return {
    isOpen, open, close, containerRef, triggerRef,
    containerProps: {
      onMouseEnter: hover ? open : undefined,
      onMouseLeave: hover ? closeSoon : undefined,
      onBlurCapture: (e: FocusEvent<HTMLDivElement>) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) close(); },
      onKeyDown: keyDown,
    },
    triggerProps: { onClick: click, "aria-expanded": isOpen },
  };
}
