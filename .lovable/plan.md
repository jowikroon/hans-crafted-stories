

# Fix Command Center Button Row Height

## Change

**File: `src/components/Navbar.tsx`, line 263**

Change the fixed height from `h-8` to `h-10` to match the taller, more comfortable spacing shown in the reference image.

```
// Before
<div className="flex items-center justify-end h-8">

// After
<div className="flex items-center justify-end h-10">
```

One line, one class change. Nothing else is modified.

