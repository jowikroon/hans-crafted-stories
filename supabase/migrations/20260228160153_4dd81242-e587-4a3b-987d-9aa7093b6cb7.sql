
-- Allow anyone to view files (bucket is already public)
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'bucket');

-- Admins can upload files
CREATE POLICY "Admins can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'bucket' 
    AND public.has_role(auth.uid(), 'admin')
  );

-- Admins can update their files (needed for upsert)
CREATE POLICY "Admins can update files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'bucket' 
    AND public.has_role(auth.uid(), 'admin')
  );

-- Admins can delete files
CREATE POLICY "Admins can delete files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'bucket' 
    AND public.has_role(auth.uid(), 'admin')
  );
