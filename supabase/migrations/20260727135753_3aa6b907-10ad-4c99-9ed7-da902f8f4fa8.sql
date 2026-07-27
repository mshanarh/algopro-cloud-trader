CREATE TABLE public.app_access (
  email text PRIMARY KEY,
  paid boolean NOT NULL DEFAULT false,
  device_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.app_access TO service_role;
ALTER TABLE public.app_access ENABLE ROW LEVEL SECURITY;