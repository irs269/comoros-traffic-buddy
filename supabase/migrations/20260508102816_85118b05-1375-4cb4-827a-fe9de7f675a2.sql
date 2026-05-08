-- Make amount nullable
ALTER TABLE public.fines ALTER COLUMN amount DROP NOT NULL;

-- Default status now 'pending_amount'
ALTER TABLE public.fines ALTER COLUMN status SET DEFAULT 'pending_amount';

-- Audit fields
ALTER TABLE public.fines ADD COLUMN IF NOT EXISTS amount_set_by uuid;
ALTER TABLE public.fines ADD COLUMN IF NOT EXISTS amount_set_at timestamp with time zone;

-- RLS: gendarmerie can read all fines
CREATE POLICY "Gendarmerie can read all fines"
ON public.fines FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'gendarmerie'::app_role));

-- RLS: gendarmerie can update fines (to set amount)
CREATE POLICY "Gendarmerie can update fines"
ON public.fines FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'gendarmerie'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'gendarmerie'::app_role));