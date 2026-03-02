

# Apply Command Center hover style to expertise cards + orange sub-menu text

## 1. Expertise cards (kerncompetenties) — Hero.tsx

The Command Center button in the Portal header has a distinctive hover style:
- Hover: `hover:border-orange-500/40` + `hover:shadow-[0_0_12px_hsl(25_95%_53%/0.15)]`
- Selected/active: `border-orange-500 bg-orange-500/10 text-orange-500 shadow-[0_0_16px_hsl(25_95%_53%/0.35)]`

Apply these effects to the 4 expertise cards in `src/components/Hero.tsx` (line 232):

**Current:**
```
hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5
```

**New:**
```
hover:border-orange-500/40 hover:shadow-[0_0_12px_hsl(25_95%_53%/0.15)]
```

This gives the same high-contrast orange glow on hover as the Command Center button.

## 2. Portal sub-menu selected text — Portal.tsx

In the sub-menu navigation (line 312-314), the active item currently uses `text-foreground` (white). Change this to orange.

**Current:**
```
isActive ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
```

**New:**
```
isActive ? "font-medium text-orange-500" : "text-muted-foreground hover:text-foreground"
```

## Files changed

- `src/components/Hero.tsx` — line 232: update hover classes on expertise cards
- `src/pages/Portal.tsx` — line 313: change active sub-menu text color to orange

Both changes are CSS-only, no logic changes.
