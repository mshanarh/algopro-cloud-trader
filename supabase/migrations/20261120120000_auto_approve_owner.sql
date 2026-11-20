-- Auto-approve the platform owner's account so signup lands straight in the
-- mentor portal instead of the admin approval queue.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first boolean;
  auto_approved boolean;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first;
  auto_approved := lower(coalesce(NEW.email, '')) = 'biyasentobeko222@gmail.com';

  INSERT INTO public.profiles (id, full_name, display_name, mobile, tiktok_url, instagram_url, approved, license_limit)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'mobile',
    NEW.raw_user_meta_data->>'tiktok_url',
    NEW.raw_user_meta_data->>'instagram_url',
    is_first OR auto_approved,
    CASE WHEN is_first THEN 9999 ELSE 5 END
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_first THEN 'admin'::public.app_role ELSE 'user'::public.app_role END);

  RETURN NEW;
END; $$;

-- Approve the owner account if it already exists and is still pending.
UPDATE public.profiles p
SET approved = true
FROM auth.users u
WHERE u.id = p.id
  AND lower(u.email) = 'biyasentobeko222@gmail.com'
  AND p.approved = false;
