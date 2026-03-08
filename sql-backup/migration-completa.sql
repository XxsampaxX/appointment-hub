-- =============================================
-- AGENDYA - MIGRAÇÃO COMPLETA
-- Execute este arquivo ÚNICO no SQL Editor do Supabase
-- Última atualização: 2026-03-08
-- =============================================

-- =============================================
-- PARTE 1: ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'profissional', 'recepcionista', 'user');
CREATE TYPE public.appointment_status AS ENUM ('agendado', 'confirmado', 'concluido', 'cancelado', 'nao_compareceu');
CREATE TYPE public.payment_method AS ENUM ('pix', 'dinheiro', 'credito', 'debito');
CREATE TYPE public.subscription_status AS ENUM ('free', 'pro', 'premium');

-- =============================================
-- PARTE 2: TABELAS
-- =============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL DEFAULT '',
  cpf TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.global_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  document TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  business_type TEXT,
  working_hours_start TIME DEFAULT '09:00',
  working_hours_end TIME DEFAULT '18:00',
  slot_duration INTEGER DEFAULT 30,
  slot_interval INTEGER DEFAULT 0,
  subscription_status subscription_status DEFAULT 'free',
  max_appointments_month INTEGER,
  working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  max_appointments_month INTEGER DEFAULT 50,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  duration INTEGER NOT NULL DEFAULT 30,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  avatar TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID,
  client_id UUID REFERENCES public.clients(id),
  service_id UUID NOT NULL REFERENCES public.services(id),
  professional_id UUID NOT NULL REFERENCES public.professionals(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  status appointment_status NOT NULL DEFAULT 'agendado',
  notes TEXT DEFAULT '',
  client_name TEXT,
  client_phone TEXT,
  payment_method payment_method,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  email_reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  reason TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.company_whatsapp (
  company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'disconnected',
  meta_business_id TEXT,
  waba_id TEXT,
  phone_number_id TEXT,
  display_phone TEXT,
  access_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.whatsapp_auto_replies (
  company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  is_welcome_enabled BOOLEAN NOT NULL DEFAULT false,
  welcome_message TEXT DEFAULT 'Olá! Bem-vindo(a). Como posso ajudar?',
  is_after_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  after_hours_message TEXT DEFAULT 'Estamos fora do horário de atendimento. Retornaremos em breve!',
  business_hours_start TIME DEFAULT '09:00',
  business_hours_end TIME DEFAULT '18:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  status TEXT NOT NULL DEFAULT 'aguardando_paciente',
  unread_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  message_type TEXT NOT NULL DEFAULT 'text',
  meta_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  appointment_id UUID REFERENCES public.appointments(id),
  phone TEXT NOT NULL,
  message_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- PARTE 3: VIEW
-- =============================================
CREATE OR REPLACE VIEW public.appointment_slots AS
SELECT
  professional_id,
  date,
  time,
  status,
  company_id
FROM public.appointments
WHERE status NOT IN ('cancelado');

-- =============================================
-- PARTE 4: ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_services_company ON public.services(company_id);
CREATE INDEX IF NOT EXISTS idx_professionals_company ON public.professionals(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_company ON public.appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date, professional_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);

-- =============================================
-- PARTE 5: ENABLE RLS
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_auto_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PARTE 6: FUNÇÕES DE AUTORIZAÇÃO
-- =============================================

CREATE OR REPLACE FUNCTION public.is_master_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.global_roles
    WHERE user_id = _user_id AND role = 'master_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_company_member(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_company_staff(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id
    AND role IN ('admin', 'recepcionista')
  )
$$;

CREATE OR REPLACE FUNCTION public.get_member_role(_user_id UUID, _company_id UUID)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.company_members
  WHERE user_id = _user_id AND company_id = _company_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.check_appointment_limit(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _max_limit INTEGER;
  _current_count INTEGER;
  _plan TEXT;
BEGIN
  SELECT s.max_appointments_month, s.plan INTO _max_limit, _plan
  FROM public.subscriptions s
  WHERE s.company_id = _company_id AND s.status = 'active';

  IF _plan IS NULL OR _plan = 'pro' THEN RETURN TRUE; END IF;
  IF _max_limit IS NULL THEN RETURN TRUE; END IF;

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
-- PARTE 7: TRIGGERS
-- =============================================

-- Auto-criar perfil ao registrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, cpf)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'cpf', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at automático
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON public.professionals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blocked_slots_updated_at BEFORE UPDATE ON public.blocked_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_whatsapp_updated_at BEFORE UPDATE ON public.company_whatsapp FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_whatsapp_auto_replies_updated_at BEFORE UPDATE ON public.whatsapp_auto_replies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-criar client quando member com role 'user' é inserido
CREATE OR REPLACE FUNCTION public.auto_create_client_on_member_insert()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile RECORD;
BEGIN
  IF NEW.role = 'user' THEN
    SELECT name, email, phone INTO _profile
    FROM public.profiles WHERE id = NEW.user_id;

    IF FOUND THEN
      INSERT INTO public.clients (company_id, name, email, phone, notes)
      VALUES (NEW.company_id, _profile.name, COALESCE(_profile.email, ''), COALESCE(_profile.phone, ''), '')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_company_member_insert
  AFTER INSERT ON public.company_members
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_client_on_member_insert();

-- =============================================
-- PARTE 8: POLÍTICAS RLS
-- =============================================

-- PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- GLOBAL_ROLES
CREATE POLICY "Master admins can view global roles" ON public.global_roles FOR SELECT USING (auth.uid() = user_id);

-- COMPANIES
CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Admins can insert company" ON public.companies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Company admin or master can update company" ON public.companies FOR UPDATE USING (is_company_admin(auth.uid(), id) OR is_master_admin(auth.uid()));
CREATE POLICY "Master admin can delete companies" ON public.companies FOR DELETE USING (is_master_admin(auth.uid()));

-- COMPANY_MEMBERS
CREATE POLICY "Members can view own membership" ON public.company_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff or master can view company members" ON public.company_members FOR SELECT USING (is_company_staff(auth.uid(), company_id) OR is_master_admin(auth.uid()));
CREATE POLICY "Users can join as user role only" ON public.company_members FOR INSERT WITH CHECK (auth.uid() = user_id AND role = 'user'::app_role);
CREATE POLICY "Admins can update members" ON public.company_members FOR UPDATE USING (is_company_admin(auth.uid(), company_id));
CREATE POLICY "Admins can delete members" ON public.company_members FOR DELETE USING (is_company_admin(auth.uid(), company_id));

-- SUBSCRIPTIONS
CREATE POLICY "Company admin can view own subscription" ON public.subscriptions FOR SELECT USING (is_company_admin(auth.uid(), company_id));
CREATE POLICY "Master admin full access subscriptions" ON public.subscriptions FOR ALL USING (is_master_admin(auth.uid()));

-- SERVICES
CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Staff can insert services" ON public.services FOR INSERT WITH CHECK (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can update services" ON public.services FOR UPDATE USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Admin can delete services" ON public.services FOR DELETE USING (is_company_admin(auth.uid(), company_id));

-- PROFESSIONALS
CREATE POLICY "Anyone can view professionals" ON public.professionals FOR SELECT USING (true);
CREATE POLICY "Staff can insert professionals" ON public.professionals FOR INSERT WITH CHECK (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can update professionals" ON public.professionals FOR UPDATE USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Admin can delete professionals" ON public.professionals FOR DELETE USING (is_company_admin(auth.uid(), company_id));

-- CLIENTS
CREATE POLICY "Staff can view clients" ON public.clients FOR SELECT USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can insert clients" ON public.clients FOR INSERT WITH CHECK (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can update clients" ON public.clients FOR UPDATE USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can delete clients" ON public.clients FOR DELETE USING (is_company_admin(auth.uid(), company_id));

-- APPOINTMENTS
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff or master can view appointments" ON public.appointments FOR SELECT USING (is_company_staff(auth.uid(), company_id) OR is_master_admin(auth.uid()));
CREATE POLICY "Authenticated can insert appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update appointments" ON public.appointments FOR UPDATE USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can delete appointments" ON public.appointments FOR DELETE USING (is_company_staff(auth.uid(), company_id));

-- BLOCKED_SLOTS
CREATE POLICY "Anyone can view active blocked slots" ON public.blocked_slots FOR SELECT USING (true);
CREATE POLICY "Staff can insert blocked slots" ON public.blocked_slots FOR INSERT WITH CHECK (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can update blocked slots" ON public.blocked_slots FOR UPDATE USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Admin can delete blocked slots" ON public.blocked_slots FOR DELETE USING (is_company_admin(auth.uid(), company_id));

-- COMPANY_WHATSAPP
CREATE POLICY "Admin can view own whatsapp config" ON public.company_whatsapp FOR SELECT USING (is_company_admin(auth.uid(), company_id));
CREATE POLICY "Admin can insert whatsapp config" ON public.company_whatsapp FOR INSERT WITH CHECK (is_company_admin(auth.uid(), company_id));
CREATE POLICY "Admin can update whatsapp config" ON public.company_whatsapp FOR UPDATE USING (is_company_admin(auth.uid(), company_id));
CREATE POLICY "Admin can delete whatsapp config" ON public.company_whatsapp FOR DELETE USING (is_company_admin(auth.uid(), company_id));
CREATE POLICY "Master admin full access company_whatsapp" ON public.company_whatsapp FOR ALL USING (is_master_admin(auth.uid()));

-- WHATSAPP_AUTO_REPLIES
CREATE POLICY "Admin can view auto replies" ON public.whatsapp_auto_replies FOR SELECT USING (is_company_admin(auth.uid(), company_id));
CREATE POLICY "Admin can insert auto replies" ON public.whatsapp_auto_replies FOR INSERT WITH CHECK (is_company_admin(auth.uid(), company_id));
CREATE POLICY "Admin can update auto replies" ON public.whatsapp_auto_replies FOR UPDATE USING (is_company_admin(auth.uid(), company_id));
CREATE POLICY "Master admin full access auto replies" ON public.whatsapp_auto_replies FOR ALL USING (is_master_admin(auth.uid()));

-- CONVERSATIONS
CREATE POLICY "Staff can view conversations" ON public.conversations FOR SELECT USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can insert conversations" ON public.conversations FOR INSERT WITH CHECK (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can update conversations" ON public.conversations FOR UPDATE USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Master admin full access conversations" ON public.conversations FOR ALL USING (is_master_admin(auth.uid()));

-- MESSAGES
CREATE POLICY "Staff can view messages" ON public.messages FOR SELECT USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can insert messages" ON public.messages FOR INSERT WITH CHECK (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Master admin full access messages" ON public.messages FOR ALL USING (is_master_admin(auth.uid()));

-- WHATSAPP_LOGS
CREATE POLICY "Staff can view own company whatsapp logs" ON public.whatsapp_logs FOR SELECT USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Service can insert whatsapp logs" ON public.whatsapp_logs FOR INSERT WITH CHECK (true);

-- =============================================
-- FIM DA MIGRAÇÃO
-- =============================================
-- Após executar:
-- 1. Configure Authentication → Settings: desabilite "Confirm email"
-- 2. Configure os Secrets nas Edge Functions
-- 3. Deploy Edge Functions via CLI: supabase functions deploy
-- 4. Crie seu primeiro usuário master_admin:
--    INSERT INTO public.global_roles (user_id, role)
--    VALUES ('SEU_USER_ID', 'master_admin');
-- =============================================
