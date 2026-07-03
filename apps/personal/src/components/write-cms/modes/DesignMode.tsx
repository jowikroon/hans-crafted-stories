import { useState } from "react";
import { useEditOverlay } from "@/components/edit-overlay/EditOverlayProvider";
import { useSkin } from "@/hooks/useSkin";
import { FONTS, fontById } from "@/lib/fonts";
import { LOGOS, logoById } from "@/lib/logos";
import { STYLE_TEMPLATES } from "../design/styleTemplates";
import MenuManager from "../design/MenuManager";

/**
 * Design mode — site-beheer vanuit het Command Center.
 *
 *  1. Stijl-templates: één klik past een samenhangende look toe
 *     (/writing-skin + site-font), afgeleid van Hans's design-prototypes.
 *  2. Fijnafstelling: losse pickers voor writing-skin, site-font en
 *     header-logo. Font & logo zijn site-wide en cross-device
 *     (page_overrides); de writing-skin gebruikt het bestaande
 *     useSkin-mechanisme (localStorage, direct zichtbaar).
 *  3. Header-menu: drag & drop beheer van de hoofdnavigatie.
 *
 * Alles hergebruikt de bestaande site-settings laag — geen schema-changes.
 */
export default function DesignMode() {
  const { activeFontId, setActiveFont, activeLogoId, setActiveLogo } = useEditOverlay();
  const { skin, setSkin, skins } = useSkin();
  const [applied, setApplied] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const applyTemplate = async (id: string) => {
    const tpl = STYLE_TEMPLATES.find((t) => t.id === id);
    if (!tpl || busy) return;
    setBusy(true);
    try {
      setSkin(tpl.skin);
      await setActiveFont(tpl.font);
      setApplied(tpl.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="design-mode">
      <header className="design-head">
        <h2>Design</h2>
        <p>
          Kies een stijl-template of stel de site fijner af. Font, logo en menu zijn
          site-wide (alle bezoekers); de writing-stijl volgt de bestaande skin-picker.
        </p>
      </header>

      {/* 1 ─ Stijl-templates */}
      <section className="design-card">
        <header className="design-card-h">
          <h3>Stijl-templates</h3>
          <p>Eén klik past writing-skin én site-font samenhangend toe.</p>
        </header>
        <div className="tpl-grid">
          {STYLE_TEMPLATES.map((t) => {
            const active = applied ? applied === t.id : skin === t.skin && activeFontId === t.font;
            return (
              <button
                key={t.id}
                type="button"
                className={`tpl-card${active ? " is-active" : ""}`}
                onClick={() => applyTemplate(t.id)}
                disabled={busy}
                aria-pressed={active}
              >
                <span className="tpl-swatch" aria-hidden="true">
                  {t.swatch.map((c) => (
                    <i key={c} style={{ background: c }} />
                  ))}
                </span>
                <strong>{t.label}</strong>
                <em>{t.pairing}</em>
                <span className="tpl-hint">{t.hint}</span>
                {active && <span className="tpl-badge">actief</span>}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2 ─ Fijnafstelling */}
      <div className="design-cols">
        <section className="design-card">
          <header className="design-card-h">
            <h3>Writing-stijl</h3>
            <p>Skin voor /writing (per device; publieke picker blijft in sync).</p>
          </header>
          <div className="pick-grid">
            {skins.map((sk) => (
              <button
                key={sk.id}
                type="button"
                className={`pick${skin === sk.id ? " is-active" : ""}`}
                aria-pressed={skin === sk.id}
                onClick={() => setSkin(sk.id)}
              >
                <strong>{sk.label}</strong>
                <span>{sk.hint}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="design-card">
          <header className="design-card-h">
            <h3>Site-font</h3>
            <p>Koppen- en bodyfont voor de hele site (cross-device).</p>
          </header>
          <div className="pick-grid">
            {FONTS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`pick${activeFontId === f.id ? " is-active" : ""}`}
                aria-pressed={activeFontId === f.id}
                onClick={() => void setActiveFont(f.id)}
              >
                <strong>{f.label}</strong>
                <span>{f.pairing}</span>
              </button>
            ))}
          </div>
          <p className="design-note">Actief: {fontById(activeFontId).pairing}</p>
        </section>

        <section className="design-card">
          <header className="design-card-h">
            <h3>Header-logo</h3>
            <p>Merkteken linksboven in de site-header (cross-device).</p>
          </header>
          <div className="pick-grid">
            {LOGOS.map((l) => (
              <button
                key={l.id}
                type="button"
                className={`pick pick-logo${activeLogoId === l.id ? " is-active" : ""}`}
                aria-pressed={activeLogoId === l.id}
                onClick={() => void setActiveLogo(l.id)}
              >
                <img src={l.src} alt="" />
                <strong>{l.label}</strong>
              </button>
            ))}
          </div>
          <p className="design-note">Actief: {logoById(activeLogoId).label}</p>
        </section>
      </div>

      {/* 3 ─ Menu-beheer */}
      <MenuManager />
    </div>
  );
}
