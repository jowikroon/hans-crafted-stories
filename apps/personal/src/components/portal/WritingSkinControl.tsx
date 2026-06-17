import { Palette, Check } from "lucide-react";
import { useSkin } from "@/hooks/useSkin";

/**
 * WritingSkinControl — redactional control for the sitewide /writing skin.
 *
 * Renders in the Portal Pages tab when the Writing page is selected. Uses the
 * shared useSkin hook (localStorage source of truth) so the choice made here
 * is the same value the public /writing picker and the anti-FOUC init read.
 *
 * Cross-device redactional control (one setting for all visitors) can later be
 * layered on by persisting `skin` to a Supabase `site_settings` row — this
 * component is the single place to wire that in, with zero schema changes today.
 */
const WritingSkinControl = () => {
  const { skin, setSkin, skins } = useSkin();

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-5">
      <div className="mb-1 flex items-center gap-2">
        <Palette size={15} className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Writing frontpage style</h3>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Pick the look for <span className="font-mono">/writing</span>. Applies on this device immediately;
        the public page picker stays in sync.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {skins.map((sk) => {
          const active = sk.id === skin;
          return (
            <button
              key={sk.id}
              type="button"
              onClick={() => setSkin(sk.id)}
              aria-pressed={active}
              className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                active
                  ? "border-primary/40 bg-primary/5 shadow-sm"
                  : "border-border bg-background hover:border-border/80"
              }`}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{sk.label}</span>
                {active && <Check size={14} className="shrink-0 text-primary" />}
              </span>
              <span className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{sk.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WritingSkinControl;
