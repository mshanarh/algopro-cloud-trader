ALTER TABLE public.licenses
  ADD COLUMN IF NOT EXISTS activations_remaining integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS activations_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activated_at timestamptz;