

# Hide Command Center for unauthenticated users

## Problem
The Command Center currently appears in the public navbar for everyone -- both as a navigation pill ("Command Center" next to "Over mij") and as the orange button in the second row. It should only be visible after logging in.

## Changes

### File: `src/components/Navbar.tsx`

Three areas need to be wrapped with an authentication check (`user` from `useAuth`):

1. **Navigation pills (line 22)**: Remove the `/hansai` link from the `getLinks` array. Instead, conditionally add it only when `user` exists, inside the component where `links` is used.

2. **Desktop ROW 2 button (lines 261-280)**: Wrap the entire Command Center row in a `{user && (...)}` conditional so it only renders for authenticated users.

3. **Mobile menu button (lines 305-308)**: Wrap the Command Center button in the mobile menu with the same `{user && (...)}` conditional.

### Approach
- The `getLinks` function is defined outside the component and has no access to `user`. Solution: remove the hansai entry from `getLinks` and add it conditionally inside the component where `links` is mapped (e.g. `const links = user ? [...allLinks] : allLinks.filter(l => l.to !== "/hansai")`).
- No changes to routing -- `/hansai` remains accessible by URL for authenticated users. This only hides the navigation entry.

