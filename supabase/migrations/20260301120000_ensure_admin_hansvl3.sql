-- Ensure hansvl3@gmail.com gets admin rights and a portal profile (for Users list).
-- 1) Function to backfill or set up profile + admin role for a user by id.
-- 2) Trigger on auth.users so new signups with that email get profile + role.
-- 3) One-time backfill for existing auth user with that email.

CREATE OR REPLACE FUNCTION public.ensure_admin_profile_and_role(uid uuid, user_email text, display_name text DEFAULT 'Hans')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.portal_profiles (user_id, display_name, email, is_active, tab_access)
  VALUES (uid, COALESCE(display_name, split_part(user_email, '@', 1)), user_email, true, ARRAY['tools','content','pages','status','users'])
  ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, email = EXCLUDED.email, updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Trigger: when a new user is created (e.g. first Google sign-in), give them profile + admin if email matches
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF LOWER(TRIM(NEW.email)) = 'hansvl3@gmail.com' THEN
    PERFORM public.ensure_admin_profile_and_role(NEW.id, NEW.email, 'Hans');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_ensure_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_ensure_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_admin_user();

-- One-time backfill: ensure existing auth user with this email has profile + admin role
DO $$
DECLARE
  uid uuid;
  uemail text;
BEGIN
  SELECT id, email INTO uid, uemail FROM auth.users WHERE LOWER(TRIM(email)) = 'hansvl3@gmail.com' LIMIT 1;
  IF uid IS NOT NULL THEN
    PERFORM public.ensure_admin_profile_and_role(uid, uemail, 'Hans');
  END IF;
END;
$$;
