import { useEffect, useMemo, useState } from "react";
import { useNavMenu } from "@/contexts/NavMenuContext";
import { ADDABLE_PAGES, type NavMenuItem } from "@/lib/navMenu";

/**
 * MenuManager — drag & drop beheer van het hoofdmenu in de site-header.
 *
 * Reorder met native HTML5 drag & drop (geen extra deps) + ↑/↓ knoppen
 * als toetsenbord-fallback. Items kunnen verborgen (oogje) of — voor
 * custom items — verwijderd worden. Labels zijn per taal (NL/EN)
 * bewerkbaar. Opslaan schrijft één page_overrides rij; de publieke
 * Navbar leest dezelfde rij via NavMenuContext.
 */
export default function MenuManager() {
  const { navItems, setNavItems } = useNavMenu();
  const [items, setItems] = useState<NavMenuItem[]>(navItems);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [addTo, setAddTo] = useState(ADDABLE_PAGES[0].to);
  const [addLabel, setAddLabel] = useState("");
  const [state, setState] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");

  // Adopt remote changes as long as there are no local edits.
  useEffect(() => {
    if (state === "idle" || state === "saved") setItems(navItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navItems]);

  const dirty = state === "dirty";
  const mark = (next: NavMenuItem[]) => {
    setItems(next);
    setState("dirty");
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    mark(next);
  };

  const onDrop = (idx: number) => {
    if (dragIdx === null) return;
    move(dragIdx, idx);
    setDragIdx(null);
    setOverIdx(null);
  };

  const addPage = () => {
    const page = ADDABLE_PAGES.find((p) => p.to === addTo);
    if (!page) return;
    if (items.some((i) => i.to === page.to)) return; // al in het menu
    const label = addLabel.trim() || page.label;
    mark([
      ...items,
      { id: `custom-${Date.now()}`, to: page.to, labelNl: label, labelEn: label, visible: true },
    ]);
    setAddLabel("");
  };

  const save = async () => {
    setState("saving");
    try {
      await setNavItems(items);
      setState("saved");
    } catch {
      setState("error");
    }
  };

  const addableLeft = useMemo(
    () => ADDABLE_PAGES.filter((p) => !items.some((i) => i.to === p.to)),
    [items]
  );

  return (
    <section className="design-card">
      <header className="design-card-h">
        <h3>Header-menu</h3>
        <p>Sleep om te herordenen · oogje om te verbergen · labels per taal bewerkbaar.</p>
      </header>

      <ul className="menu-list" role="list">
        {items.map((it, idx) => (
          <li
            key={it.id}
            className={`menu-row${overIdx === idx ? " is-over" : ""}${it.visible ? "" : " is-hidden"}`}
            draggable
            onDragStart={() => setDragIdx(idx)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIdx(idx);
            }}
            onDragLeave={() => setOverIdx((v) => (v === idx ? null : v))}
            onDrop={() => onDrop(idx)}
            onDragEnd={() => {
              setDragIdx(null);
              setOverIdx(null);
            }}
          >
            <span className="menu-grip" aria-hidden="true">⋮⋮</span>
            <div className="menu-labels">
              <input
                value={it.labelNl}
                aria-label={`Label NL, ${it.to}`}
                onChange={(e) => mark(items.map((x, i) => (i === idx ? { ...x, labelNl: e.target.value } : x)))}
              />
              <input
                value={it.labelEn}
                aria-label={`Label EN, ${it.to}`}
                onChange={(e) => mark(items.map((x, i) => (i === idx ? { ...x, labelEn: e.target.value } : x)))}
              />
            </div>
            <code className="menu-path">{it.to}</code>
            <div className="menu-actions">
              <button type="button" title="Omhoog" aria-label="Omhoog" onClick={() => move(idx, idx - 1)}>↑</button>
              <button type="button" title="Omlaag" aria-label="Omlaag" onClick={() => move(idx, idx + 1)}>↓</button>
              <button
                type="button"
                title={it.visible ? "Verberg in menu" : "Toon in menu"}
                aria-pressed={!it.visible}
                onClick={() => mark(items.map((x, i) => (i === idx ? { ...x, visible: !x.visible } : x)))}
              >
                {it.visible ? "👁" : "🚫"}
              </button>
              {!it.builtin && (
                <button
                  type="button"
                  className="menu-del"
                  title="Verwijder uit menu"
                  onClick={() => mark(items.filter((_, i) => i !== idx))}
                >
                  ✕
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="menu-add">
        <select value={addTo} onChange={(e) => setAddTo(e.target.value)} aria-label="Pagina om toe te voegen">
          {(addableLeft.length ? addableLeft : ADDABLE_PAGES).map((p) => (
            <option key={p.to} value={p.to}>{p.label}, {p.to}</option>
          ))}
        </select>
        <input
          value={addLabel}
          placeholder="Menulabel (optioneel)"
          onChange={(e) => setAddLabel(e.target.value)}
        />
        <button type="button" onClick={addPage} disabled={!addableLeft.length}>+ Voeg toe</button>
      </div>

      <footer className="design-savebar">
        <span className="design-savestate">
          {state === "saving" && "Opslaan…"}
          {state === "saved" && "Opgeslagen, live voor alle bezoekers"}
          {state === "error" && "Opslaan mislukt, ben je ingelogd als admin?"}
          {dirty && "Niet-opgeslagen wijzigingen"}
        </span>
        <button type="button" className="design-save" onClick={save} disabled={!dirty}>
          Menu opslaan
        </button>
      </footer>
    </section>
  );
}
