
-- =============================================
-- FIX 1: company_members INSERT - prevent privilege escalation
-- Users should only be able to insert themselves with 'user' role
-- =============================================
DROP POLICY IF EXISTS "Authenticated can insert membership" ON public.company_members;

CREATE POLICY "Users can join as user role only"
  ON public.company_members FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'user'
  );

-- =============================================
-- FIX 2: appointments SELECT - remove public access to sensitive data
-- Only allow staff and appointment owners to see appointments
-- =============================================
DROP POLICY IF EXISTS "Anyone can view appointment slots" ON public.appointments;

-- Create a restricted public view for slot availability only (no PII)
CREATE OR REPLACE VIEW public.appointment_slots
WITH (security_invoker = on) AS
  SELECT company_id, professional_id, date, time, status
  FROM public.appointments
  WHERE status NOT IN ('cancelado');

-- Allow public access to the view (no PII exposed)
CREATE POLICY "Anyone can view appointment slots via view"
  ON public.appointments FOR SELECT
  USING (false);
-- Note: the above denies direct public SELECT; the existing staff/owner policies still work

-- Actually we need to keep staff and owner policies working, so let's use PERMISSIVE instead
-- The existing "Staff can view" and "Users can view own" are RESTRICTIVE (Permissive: No)
-- Let me check - they're all RESTRICTIVE which means ALL must pass. That's wrong for OR logic.
-- Let me fix this properly: drop restrictive and recreate as permissive

DROP POLICY IF EXISTS "Anyone can view appointment slots via view" ON public.appointments;
DROP POLICY IF EXISTS "Staff can view company appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;

CREATE POLICY "Staff can view company appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (is_company_staff(auth.uid(), company_id));

CREATE POLICY "Users can view own appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- FIX 3: whatsapp_logs - restrict to company staff only
-- =============================================
DROP POLICY IF EXISTS "Staff can view whatsapp logs" ON public.whatsapp_logs;

-- Need to join through appointments to get company_id
-- Add company_id column to whatsapp_logs for proper filtering
ALTER TABLE public.whatsapp_logs ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

CREATE POLICY "Staff can view own company whatsapp logs"
  ON public.whatsapp_logs FOR SELECT
  TO authenticated
  USING (is_company_staff(auth.uid(), company_id));

-- Allow edge functions (service role) to insert logs
CREATE POLICY "Service can insert whatsapp logs"
  ON public.whatsapp_logs FOR INSERT
  WITH CHECK (true);
