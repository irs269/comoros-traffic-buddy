
-- Drop the overly permissive policies
DROP POLICY "Authenticated can insert vehicles" ON public.vehicles;
DROP POLICY "Authenticated can insert fines" ON public.fines;

-- Replace with role-checked policies
CREATE POLICY "Officers can insert vehicles" ON public.vehicles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Officers can insert fines" ON public.fines FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));
