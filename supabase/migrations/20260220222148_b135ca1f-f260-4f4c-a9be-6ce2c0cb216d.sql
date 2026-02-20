
-- =============================================
-- 1. GLOBAL ROLES TABLE (Master Admin)
-- =============================================
CREATE TABLE public.global_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('master_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.global_roles ENABLE ROW LEVEL SECURITY;

-- Only master admins can view global roles
CREATE POLICY "Master admins can view global roles"
  ON public.global_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No one can insert/update/delete via client (managed via SQL only)

-- =============================================
-- 2. IS_MASTER_ADMIN FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.is_master_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.global_roles
    WHERE user_id = _user_id AND role = 'master_admin'
  )
$$;

-- =============================================
-- 3. ADD document AND status TO companies
-- =============================================
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS document TEXT DEFAULT '';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended'));

-- =============================================
-- 4. SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  max_appointments_month INTEGER DEFAULT 50,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Master admin can do everything on subscriptions
CREATE POLICY "Master admin full access subscriptions"
  ON public.subscriptions FOR ALL
  TO authenticated
  USING (public.is_master_admin(auth.uid()));

-- Company admins can view own subscription
CREATE POLICY "Company admin can view own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id));

-- =============================================
-- 5. UPDATE RLS: Master admin bypass on companies
-- =============================================
-- Drop existing policies that need updating
DROP POLICY IF EXISTS "Admins can update company" ON public.companies;
DROP POLICY IF EXISTS "Anyone can view companies" ON public.companies;

CREATE POLICY "Anyone can view companies"
  ON public.companies FOR SELECT
  USING (true);

CREATE POLICY "Company admin or master can update company"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (
    public.is_company_admin(auth.uid(), id) 
    OR public.is_master_admin(auth.uid())
  );

-- Master admin can delete companies
CREATE POLICY "Master admin can delete companies"
  ON public.companies FOR DELETE
  TO authenticated
  USING (public.is_master_admin(auth.uid()));

-- =============================================
-- 6. UPDATE RLS: Master admin bypass on appointments
-- =============================================
DROP POLICY IF EXISTS "Staff can view company appointments" ON public.appointments;

CREATE POLICY "Staff or master can view appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (
    public.is_company_staff(auth.uid(), company_id)
    OR public.is_master_admin(auth.uid())
  );

-- =============================================
-- 7. UPDATE RLS: Master admin on company_members
-- =============================================
DROP POLICY IF EXISTS "Staff can view company members" ON public.company_members;

CREATE POLICY "Staff or master can view company members"
  ON public.company_members FOR SELECT
  TO authenticated
  USING (
    public.is_company_staff(auth.uid(), company_id)
    OR public.is_master_admin(auth.uid())
  );

-- =============================================
-- 8. FUNCTION: CHECK PLAN LIMIT
-- =============================================
CREATE OR REPLACE FUNCTION public.check_appointment_limit(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _max_limit INTEGER;
  _current_count INTEGER;
  _plan TEXT;
BEGIN
  -- Get subscription limit
  SELECT s.max_appointments_month, s.plan INTO _max_limit, _plan
  FROM public.subscriptions s
  WHERE s.company_id = _company_id AND s.status = 'active';

  -- If no subscription or pro plan, allow
  IF _plan IS NULL OR _plan = 'pro' THEN
    RETURN TRUE;
  END IF;

  -- If no limit set, allow
  IF _max_limit IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Count this month's appointments
  SELECT COUNT(*) INTO _current_count
  FROM public.appointments
  WHERE company_id = _company_id
    AND date >= date_trunc('month', CURRENT_DATE)::date
    AND date < (date_trunc('month', CURRENT_DATE) + interval '1 month')::date
    AND status NOT IN ('cancelado');

  RETURN _current_count < _max_limit;
END;
$$;

-- =============================================
-- 9. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_global_roles_user ON public.global_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON public.subscriptions(company_id);

-- =============================================
-- 10. INSERT MASTER ADMIN
-- =============================================
INSERT INTO public.global_roles (user_id, role)
VALUES ('166250f2-7de5-4847-aa5a-a6220fb9eec6', 'master_admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- =============================================
-- 11. CREATE DEFAULT SUBSCRIPTIONS FOR EXISTING COMPANIES
-- =============================================
INSERT INTO public.subscriptions (company_id, plan, status, max_appointments_month)
SELECT id, 
  COALESCE(subscription_status, 'free'),
  'active',
  COALESCE(max_appointments_month, 50)
FROM public.companies
ON CONFLICT (company_id) DO NOTHING;
