INSERT INTO public.app_access (email, paid, device_id, updated_at)
VALUES ('biyasentobeko222@gmail.com', true, NULL, now())
ON CONFLICT (email) DO UPDATE SET paid = true, updated_at = now();