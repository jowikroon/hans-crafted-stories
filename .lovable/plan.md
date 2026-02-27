

# Add Sub-Menu Navigation to Portal

## What changes
Replace the current rounded pill-style tab bar (lines 299-320) with a clean, minimal sub-menu matching the reference image style:
- Simple text tabs separated by vertical dividers (`|`)
- No background container, no rounded pill shape, no icons
- Active tab gets a subtle bottom border or bolder text
- Horizontally scrollable on mobile

## Tab labels
Keep the existing 5 tabs but rename them to match the reference image style:
- "tools" -> **Overview** (since it's the default/main view)
- "content" -> **Content Library**
- "pages" -> **Pages**
- "users" -> **Users**
- "status" -> **Status**

Wait -- the image shows: Overview, SEO Tools, SEO Tools, Workflows, Content Library. But the user said "Let the categories on the page we have as it is." So I'll keep the existing tab IDs and labels (Tools, Content, Pages, Users, Status) but apply the visual style from the image.

## Visual style (from image)
- No rounded container or background color
- Tabs displayed as plain text in a row
- Separated by thin vertical lines (1px border-right or a `|` divider)
- Active tab: slightly bolder or with a subtle underline
- Clean, minimal typography matching the site's serif/display font feel

## File changed

**`src/pages/Portal.tsx`** (lines 299-320 only)
- Replace the `div` with `rounded-2xl border bg-secondary/50` classes with a simpler container
- Replace button styling: remove pill backgrounds, add vertical dividers between items
- Remove icons from tabs (image shows text-only)
- Keep the same `activeTab` / `setActiveTab` logic untouched

## Mobile dock
The `PortalFloatingDock` component remains unchanged -- it still handles mobile navigation separately.

## Technical details

The new sub-menu markup will look approximately like:

```text
<nav className="mb-8 flex items-center overflow-x-auto border-b border-border">
  {tabs.map((tab, i) => (
    <>
      <button
        className={active ? "border-b-2 border-foreground font-medium text-foreground"
                         : "text-muted-foreground hover:text-foreground"}
        ...
      >
        {tab.label}
      </button>
      {i < tabs.length - 1 && <div className="h-4 w-px bg-border" />}
    </>
  ))}
</nav>
```

No new files, no new dependencies. Only the tab bar styling in `Portal.tsx` is modified.

