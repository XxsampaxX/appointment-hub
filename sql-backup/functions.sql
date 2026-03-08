-- =============================================
-- FUNCTIONS.SQL - Funções e Triggers
-- Execute DEPOIS de schema.sql
-- =============================================

-- 1. FUNÇÕES DE AUTORIZAÇÃO

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

-- 2. TRIGGER: Auto-criar perfil ao registrar usuário

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

-- IMPORTANTE: Este trigger deve ser criado na schema auth
-- Execute separadamente se necessário:
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. TRIGGER: updated_at automático

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

-- 4. TRIGGER: Auto-criar client quando member com role 'user' é inserido

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
