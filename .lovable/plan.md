

## Add Quick Access Dropdown Menu to Navbar Header

### What We're Doing
Adding a dropdown menu to the main navbar (next to the Portal/Login button) that provides quick access to specialist service pages and internal tools that aren't in the primary navigation links. This ensures all key pages are always reachable from the header without relying solely on the Cmd+K search.

### Dropdown Contents

**Services**
- Amazon NL Specialist
- Bol.com Consultant
- Interim E-commerce Manager

**Tools** (shown only when logged in)
- Portal
- Empire
- Hans AI
- Wiki

### Design
- Trigger: A small chevron-down or grid icon button placed in the right cluster, between the language switcher and the Portal pill button
- Uses the existing Radix `DropdownMenu` component (`src/components/ui/dropdown-menu.tsx`) for accessibility and animation
- Grouped with subtle section labels ("Services", "Tools") and separators
- Matches the editorial style: 13px uppercase tracking, muted-foreground colors, clean hover states
- On mobile: these same links get added to the hamburger menu under a "Quick Access" separator section

### Technical Details

**File to modify:**
- `src/components/Navbar.tsx`

**Changes:**
1. Import `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator` from the existing UI component
2. Import a suitable icon (e.g., `ChevronDown` or `Grid3X3` from lucide-react)
3. Define a `quickAccessPages` array with service pages (always visible) and tool pages (conditional on `user` being logged in)
4. Add the dropdown in the right cluster area, styled as a small icon button consistent with the theme toggle
5. Each menu item navigates via `navigate(path)` on click
6. In the mobile menu section, add the same quick access links below the main nav links with a "Quick Access" label separator

**No new files or dependencies needed.** Uses existing `DropdownMenu` UI component and lucide icons.

