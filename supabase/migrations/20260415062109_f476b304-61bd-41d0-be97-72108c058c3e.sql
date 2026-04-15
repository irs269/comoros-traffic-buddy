-- Create a sequence for receipt numbers
CREATE SEQUENCE IF NOT EXISTS public.receipt_number_seq START 1000;

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fine_id UUID NOT NULL REFERENCES public.fines(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL DEFAULT 'REC-' || lpad(nextval('public.receipt_number_seq')::text, 6, '0'),
  amount_paid INTEGER NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  paid_by_name TEXT NOT NULL,
  collected_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything on payments
CREATE POLICY "Super admins full access on payments"
  ON public.payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Admins can read all payments
CREATE POLICY "Admins can read payments"
  ON public.payments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Cashiers can insert payments
CREATE POLICY "Cashiers can insert payments"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = collected_by
    AND (public.has_role(auth.uid(), 'cashier') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  );

-- Cashiers can read own payments
CREATE POLICY "Cashiers can read own payments"
  ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = collected_by);

-- Function to mark fine as paid when payment is created
CREATE OR REPLACE FUNCTION public.mark_fine_as_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.fines
  SET status = 'paid', paid_at = now(), updated_at = now()
  WHERE id = NEW.fine_id;
  RETURN NEW;
END;
$$;

-- Trigger: auto-mark fine as paid
CREATE TRIGGER trigger_mark_fine_paid
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_fine_as_paid();

-- Super admins get full access on all existing tables
CREATE POLICY "Super admins full access on fines"
  ON public.fines FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins full access on vehicles"
  ON public.vehicles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins full access on scan_logs"
  ON public.scan_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins full access on profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins full access on user_roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));