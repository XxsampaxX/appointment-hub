-- =============================================
-- SCHEMA.SQL - Estrutura completa do banco
-- Execute PRIMEIRO no SQL Editor do Supabase
-- =============================================

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'profissional', 'recepcionista', 'user');
CREATE TYPE public.appointment_status AS ENUM ('agendado', 'confirmado', 'concluido', 'cancelado', 'nao_compareceu');
CREATE TYPE public.payment_method AS ENUM ('pix', 'dinheiro', 'credito', 'debito');
CREATE TYPE public.subscription_status AS ENUM ('free', 'pro', 'premium');

-- 2. TABELAS

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL DEFAULT '',
  cpf TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- global_roles
CREATE TABLE public.global_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- companies
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  document TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
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

-- company_members
CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

-- subscriptions
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

-- services
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

-- professionals
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

-- clients
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

-- appointments
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

-- blocked_slots
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

-- company_whatsapp
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

-- whatsapp_auto_replies
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

-- conversations
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

-- messages
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

-- whatsapp_logs
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

-- 3. VIEW
CREATE OR REPLACE VIEW public.appointment_slots AS
SELECT
  professional_id,
  date,
  time,
  status,
  company_id
FROM public.appointments
WHERE status NOT IN ('cancelado');

-- 4. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_services_company ON public.services(company_id);
CREATE INDEX IF NOT EXISTS idx_professionals_company ON public.professionals(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_company ON public.appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date, professional_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);

-- 5. ENABLE RLS em todas as tabelas
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
