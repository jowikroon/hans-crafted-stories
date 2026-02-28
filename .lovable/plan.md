

## Fix Image Upload: Missing Storage Policies + UX Improvements

### Problem
The `ImageCropUploader` fails when selecting an image because the storage bucket `bucket` has **RLS enabled but zero policies**. This means all uploads are silently denied by the database, causing a generic error toast.

### Root Cause
- `storage.objects` table has `row_level_security = true`
- No INSERT/SELECT/UPDATE/DELETE policies exist on the table
- Every `supabase.storage.from("bucket").upload(...)` call fails with a permissions error

### Fix

**1. Add Storage RLS Policies (database migration)**

Create policies on `storage.objects` to allow:
- **Admins can upload** (INSERT) to the `bucket` — restricted to authenticated admin users via the existing `has_role()` function
- **Admins can update** (UPDATE) files they uploaded — for upsert support
- **Admins can delete** (DELETE) their files — for replacing images
- **Anyone can read** (SELECT) public files — since the bucket is already public, this enables direct URL access

**2. Minor UX hardening in `ImageCropUploader.tsx`**

- Add a `DialogDescription` to the crop dialog to fix the console warning about missing `aria-describedby`
- Add a file size check (max 10MB) before reading the file, matching the hint text already shown to users
- Improve error messaging to show more user-friendly text on permission errors

### Technical Details

**SQL migration:**
```sql
-- Allow anyone to view files (bucket is already public)
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'bucket');

-- Admins can upload files
CREATE POLICY "Admins can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'bucket' 
    AND has_role(auth.uid(), 'admin')
  );

-- Admins can update their files (needed for upsert)
CREATE POLICY "Admins can update files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'bucket' 
    AND has_role(auth.uid(), 'admin')
  );

-- Admins can delete files
CREATE POLICY "Admins can delete files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'bucket' 
    AND has_role(auth.uid(), 'admin')
  );
```

**Code changes in `ImageCropUploader.tsx`:**
- Import `DialogDescription` and add it under `DialogTitle`
- Add file size validation (10MB max) in `handleFileSelect`

### What stays the same
- The crop tool UX (drag, zoom, aspect ratio) is well-built and needs no changes
- The bucket name `bucket` and upload paths remain unchanged
- Both blog post and case study forms continue using `ImageCropUploader` as-is

### Result
After this fix, admins will be able to select, crop, and upload images through the CMS without errors. The full flow (select file, crop dialog, upload, see preview) will work end-to-end.

