-- Add Supabase Auth identity mapping for optional accounts and guest sessions.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS auth_user_id UUID;

UPDATE public.profiles
SET auth_user_id = id
WHERE auth_user_id IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN auth_user_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_auth_user_id_key
  ON public.profiles(auth_user_id);

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_puter_user_id_key;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS puter_user_id;
