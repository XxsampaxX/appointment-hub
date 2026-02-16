# Migração Multi-Tenant

Execute este SQL no **SQL Editor** do Supabase para transformar o sistema em multi-tenant.

⚠️ **ATENÇÃO**: Execute ANTES de atualizar o frontend. Faça backup se tiver dados importantes.

---

```sql
-- =============================================
-- 1. ATUALIZAR ENUM DE ROLES
-- =============================================
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'profissional';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'recepcionista';

-- =============================================
-- 2. TABELA DE EMPRESAS
-- =============================================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  working_hours_start TIME NOT NULL DEFAULT '09:00',
  working_hours_end TIME NOT NULL DEFAULT '18:00',
  slot_duration INTEGER NOT NULL DEFAULT 30,
  slot_interval INTEGER NOT NULL DEFAULT 0,
  subscription_status TEXT NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro', 'premium')),
  max_appointments_month INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. TABELA DE MEMBROS DA EMPRESA
-- =============================================
CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, user_id)
);

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. ADICIONAR company_id NAS TABELAS EXISTENTES
-- =============================================
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- =============================================
-- 5. FUNÇÃO PARA CHECAR MEMBRO DA EMPRESA
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.company_members
  WHERE user_id = _user_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.has_company_role(_user_id UUID, _company_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_company_member(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
  )
$$;

-- =============================================
-- 6. REMOVER POLICIES ANTIGOS
-- =============================================
-- Services
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
DROP POLICY IF EXISTS "Admins can insert services" ON public.services;
DROP POLICY IF EXISTS "Admins can update services" ON public.services;
DROP POLICY IF EXISTS "Admins can delete services" ON public.services;

-- Professionals
DROP POLICY IF EXISTS "Anyone can view professionals" ON public.professionals;
DROP POLICY IF EXISTS "Admins can insert professionals" ON public.professionals;
DROP POLICY IF EXISTS "Admins can update professionals" ON public.professionals;
DROP POLICY IF EXISTS "Admins can delete professionals" ON public.professionals;

-- Clients
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can manage clients" ON public.clients;

-- Appointments
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.appointments;

-- =============================================
-- 7. NOVAS RLS POLICIES - COMPANIES
-- =============================================
CREATE POLICY "Anyone can view companies by slug"
  ON public.companies FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can update own company"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (public.has_company_role(auth.uid(), id, 'admin'));

-- =============================================
-- 8. RLS POLICIES - COMPANY_MEMBERS
-- =============================================
CREATE POLICY "Members can view own company members"
  ON public.company_members FOR SELECT
  TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Admins can manage company members"
  ON public.company_members FOR ALL
  TO authenticated
  USING (public.has_company_role(auth.uid(), company_id, 'admin'));

-- =============================================
-- 9. NOVAS RLS POLICIES - SERVICES (scoped by company)
-- =============================================
CREATE POLICY "Anyone can view company services"
  ON public.services FOR SELECT
  USING (TRUE);

CREATE POLICY "Company admins can insert services"
  ON public.services FOR INSERT
  TO authenticated
  WITH CHECK (public.has_company_role(auth.uid(), company_id, 'admin'));

CREATE POLICY "Company admins can update services"
  ON public.services FOR UPDATE
  TO authenticated
  USING (public.has_company_role(auth.uid(), company_id, 'admin'));

CREATE POLICY "Company admins can delete services"
  ON public.services FOR DELETE
  TO authenticated
  USING (public.has_company_role(auth.uid(), company_id, 'admin'));

-- =============================================
-- 10. NOVAS RLS POLICIES - PROFESSIONALS
-- =============================================
CREATE POLICY "Anyone can view company professionals"
  ON public.professionals FOR SELECT
  USING (TRUE);

CREATE POLICY "Company admins can insert professionals"
  ON public.professionals FOR INSERT
  TO authenticated
  WITH CHECK (public.has_company_role(auth.uid(), company_id, 'admin'));

CREATE POLICY "Company admins can update professionals"
  ON public.professionals FOR UPDATE
  TO authenticated
  USING (public.has_company_role(auth.uid(), company_id, 'admin'));

CREATE POLICY "Company admins can delete professionals"
  ON public.professionals FOR DELETE
  TO authenticated
  USING (public.has_company_role(auth.uid(), company_id, 'admin'));

-- =============================================
-- 11. NOVAS RLS POLICIES - CLIENTS
-- =============================================
CREATE POLICY "Company members can view clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Company admin/recepcionista can manage clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (
    public.has_company_role(auth.uid(), company_id, 'admin')
    OR public.has_company_role(auth.uid(), company_id, 'recepcionista')
  );

-- =============================================
-- 12. NOVAS RLS POLICIES - APPOINTMENTS
-- =============================================
CREATE POLICY "Users can view own appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Company members can view company appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Authenticated can create appointments"
  ON public.appointments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can cancel own appointments"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Company admin/recepcionista can manage appointments"
  ON public.appointments FOR ALL
  TO authenticated
  USING (
    public.has_company_role(auth.uid(), company_id, 'admin')
    OR public.has_company_role(auth.uid(), company_id, 'recepcionista')
  );

-- =============================================
-- 13. ATUALIZAR STATUS DO APPOINTMENT
-- =============================================
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('agendado', 'confirmado', 'concluido', 'cancelado', 'nao_compareceu'));

-- =============================================
-- 14. ÍNDICES PARA PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_services_company ON public.services(company_id);
CREATE INDEX IF NOT EXISTS idx_professionals_company ON public.professionals(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_company ON public.appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date, professional_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
```

---

## Após executar o SQL

### 1. Criar sua empresa

```sql
INSERT INTO public.companies (name, slug, phone)
VALUES ('Minha Empresa', 'minha-empresa', '11999999999');
```

### 2. Associar seu usuário como admin da empresa

```sql
INSERT INTO public.company_members (company_id, user_id, role)
VALUES (
  (SELECT id FROM public.companies WHERE slug = 'minha-empresa'),
  (SELECT id FROM public.profiles WHERE email = 'SEU_EMAIL_AQUI'),
  'admin'
);
```

### 3. Atualizar dados existentes (se houver)

```sql
-- Associar serviços existentes à sua empresa
UPDATE public.services SET company_id = (SELECT id FROM public.companies WHERE slug = 'minha-empresa') WHERE company_id IS NULL;
UPDATE public.professionals SET company_id = (SELECT id FROM public.companies WHERE slug = 'minha-empresa') WHERE company_id IS NULL;
UPDATE public.clients SET company_id = (SELECT id FROM public.companies WHERE slug = 'minha-empresa') WHERE company_id IS NULL;
UPDATE public.appointments SET company_id = (SELECT id FROM public.companies WHERE slug = 'minha-empresa') WHERE company_id IS NULL;
```
