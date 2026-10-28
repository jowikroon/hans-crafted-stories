# Private Cowork attachments

The Bijlagen page reads cowork_attachments after the existing portal-owner
gate. Both metadata and Storage downloads enforce is_portal_owner() through
RLS. The cowork-attachments bucket is private. No document is copied into
the public webroot or embedded in a frontend manifest.

Run node scripts/sync-cowork-dashboard-attachments.mjs --inventory to inspect
source availability without credentials. Run with --dry-run to compare hashes
without uploads. Run without flags to synchronize and verify uploaded bytes.
The old --commit flag is accepted but does not create commits or push files.

Provide SUPABASE_SERVICE_ROLE_KEY, or a valid SUPABASE_MGMT_TOKEN with permission
to read this project's service key, in the process environment. Never put
these credentials into client environment variables, commits or chat messages.

The two original Cowork source directories are scanned. The old local checkout
is a recovery source for names missing from those directories. Internal SKILL
files, hidden files, symlinks and temporary files are excluded. Unchanged hashes
cause no writes. Removed local files and older stored versions are retained.

Before publishing, run the sync, run it again to verify zero changes, compare
the metadata and storage object counts, and verify anonymous/non-owner reads
are denied. Then test an authenticated owner download in the browser.
