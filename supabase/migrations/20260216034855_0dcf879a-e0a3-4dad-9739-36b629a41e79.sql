
-- 1. Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'profissional', 'recepcionista', 'user');
CREATE TYPE public.appointment_status AS ENUM ('agendado', 'confirmado', 'concluido', 'cancelado', 'nao_compareceu');
CREATE TYPE public.subscription_status AS ENUM ('free', 'pro', 'premium');

-- 2. Tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL DEFAULT '',
  cpf TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Tabela de empresas
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  working_hours_start TIME DEFAULT '09:00',
  working_hours_end TIME DEFAULT '18:00',
  slot_duration INTEGER DEFAULT 30,
  slot_interval INTEGER DEFAULT 0,
  subscription_status public.subscription_status DEFAULT 'free',
  max_appointments_month INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 4. Tabela de membros da empresa (roles)
CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- 5. Profissionais
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
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- 6. Serviços
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 7. Clientes
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
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 8. Agendamentos
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  client_id UUID REFERENCES public.clients(id),
  service_id UUID NOT NULL REFERENCES public.services(id),
  professional_id UUID NOT NULL REFERENCES public.professionals(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'agendado',
  notes TEXT DEFAULT '',
  client_name TEXT,
  client_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, professional_id, date, time)
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 9. Função helper para verificar role do membro (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.get_member_role(_user_id UUID, _company_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.company_members
  WHERE user_id = _user_id AND company_id = _company_id
  LIMIT 1
$$;

-- 10. Função para verificar se é staff (admin ou recepcionista)
CREATE OR REPLACE FUNCTION public.is_company_staff(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id
    AND role IN ('admin', 'recepcionista')
  )
$$;

-- 11. Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id
    AND role = 'admin'
  )
$$;

-- 12. Função para verificar se é membro de qualquer tipo
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id
  )
$$;

-- 13. Trigger para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 14. Trigger para updated_at
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

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON public.professionals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- PROFILES: usuários veem e editam só o próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- COMPANIES: qualquer pessoa pode ver (para resolver slug público)
CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Admins can update company" ON public.companies FOR UPDATE USING (public.is_company_admin(auth.uid(), id));
CREATE POLICY "Admins can insert company" ON public.companies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- COMPANY_MEMBERS: membros veem seus próprios registros, admins gerenciam
CREATE POLICY "Members can view own membership" ON public.company_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view company members" ON public.company_members FOR SELECT USING (public.is_company_staff(auth.uid(), company_id));
CREATE POLICY "Authenticated can insert membership" ON public.company_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can update members" ON public.company_members FOR UPDATE USING (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "Admins can delete members" ON public.company_members FOR DELETE USING (public.is_company_admin(auth.uid(), company_id));

-- PROFESSIONALS: público pode ver (para agendamento), staff gerencia
CREATE POLICY "Anyone can view professionals" ON public.professionals FOR SELECT USING (true);
CREATE POLICY "Staff can insert professionals" ON public.professionals FOR INSERT WITH CHECK (public.is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can update professionals" ON public.professionals FOR UPDATE USING (public.is_company_staff(auth.uid(), company_id));
CREATE POLICY "Admin can delete professionals" ON public.professionals FOR DELETE USING (public.is_company_admin(auth.uid(), company_id));

-- SERVICES: público pode ver, staff gerencia
CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Staff can insert services" ON public.services FOR INSERT WITH CHECK (public.is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can update services" ON public.services FOR UPDATE USING (public.is_company_staff(auth.uid(), company_id));
CREATE POLICY "Admin can delete services" ON public.services FOR DELETE USING (public.is_company_admin(auth.uid(), company_id));

-- CLIENTS: apenas staff da empresa pode ver e gerenciar
CREATE POLICY "Staff can view clients" ON public.clients FOR SELECT USING (public.is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can insert clients" ON public.clients FOR INSERT WITH CHECK (public.is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can update clients" ON public.clients FOR UPDATE USING (public.is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can delete clients" ON public.clients FOR DELETE USING (public.is_company_admin(auth.uid(), company_id));

-- APPOINTMENTS: staff vê todos da empresa, usuários veem os próprios
CREATE POLICY "Staff can view company appointments" ON public.appointments FOR SELECT USING (public.is_company_staff(auth.uid(), company_id));
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view appointment slots" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update appointments" ON public.appointments FOR UPDATE USING (public.is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can delete appointments" ON public.appointments FOR DELETE USING (public.is_company_staff(auth.uid(), company_id));
