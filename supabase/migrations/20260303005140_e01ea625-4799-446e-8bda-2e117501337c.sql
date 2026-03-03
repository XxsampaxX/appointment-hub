
-- =============================================
-- WhatsApp Cloud API Integration Tables
-- =============================================

-- 1. company_whatsapp (1:1 com companies)
CREATE TABLE public.company_whatsapp (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  meta_business_id text,
  waba_id text,
  phone_number_id text UNIQUE,
  display_phone text,
  access_token_encrypted text,
  token_expires_at timestamptz,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connected', 'token_expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_whatsapp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view own whatsapp config"
  ON public.company_whatsapp FOR SELECT
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Admin can insert whatsapp config"
  ON public.company_whatsapp FOR INSERT
  WITH CHECK (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Admin can update whatsapp config"
  ON public.company_whatsapp FOR UPDATE
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Admin can delete whatsapp config"
  ON public.company_whatsapp FOR DELETE
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Master admin full access company_whatsapp"
  ON public.company_whatsapp FOR ALL
  USING (is_master_admin(auth.uid()));

-- Service role bypass for edge functions (insert/update via service key)
CREATE POLICY "Service can manage whatsapp config"
  ON public.company_whatsapp FOR ALL
  USING (true)
  WITH CHECK (true);

-- Make this restrictive only to service_role by using a function
-- Actually, let's drop the overly permissive policy and use a proper approach
DROP POLICY "Service can manage whatsapp config" ON public.company_whatsapp;

-- Trigger for updated_at
CREATE TRIGGER update_company_whatsapp_updated_at
  BEFORE UPDATE ON public.company_whatsapp
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. conversations
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  phone_number text NOT NULL,
  status text NOT NULL DEFAULT 'aguardando_paciente' CHECK (status IN ('em_atendimento', 'aguardando_paciente', 'finalizado')),
  unread_count integer NOT NULL DEFAULT 0,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_company ON public.conversations(company_id);
CREATE INDEX idx_conversations_phone ON public.conversations(company_id, phone_number);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view conversations"
  ON public.conversations FOR SELECT
  USING (is_company_staff(auth.uid(), company_id));

CREATE POLICY "Staff can insert conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (is_company_staff(auth.uid(), company_id));

CREATE POLICY "Staff can update conversations"
  ON public.conversations FOR UPDATE
  USING (is_company_staff(auth.uid(), company_id));

CREATE POLICY "Master admin full access conversations"
  ON public.conversations FOR ALL
  USING (is_master_admin(auth.uid()));

-- 3. messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content text NOT NULL DEFAULT '',
  message_type text NOT NULL DEFAULT 'text',
  meta_message_id text,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX idx_messages_company ON public.messages(company_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view messages"
  ON public.messages FOR SELECT
  USING (is_company_staff(auth.uid(), company_id));

CREATE POLICY "Staff can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (is_company_staff(auth.uid(), company_id));

CREATE POLICY "Master admin full access messages"
  ON public.messages FOR ALL
  USING (is_master_admin(auth.uid()));

-- 4. whatsapp_auto_replies (1:1 com companies)
CREATE TABLE public.whatsapp_auto_replies (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  welcome_message text DEFAULT 'Olá! Bem-vindo(a). Como posso ajudar?',
  after_hours_message text DEFAULT 'Estamos fora do horário de atendimento. Retornaremos em breve!',
  is_welcome_enabled boolean NOT NULL DEFAULT false,
  is_after_hours_enabled boolean NOT NULL DEFAULT false,
  business_hours_start time DEFAULT '09:00',
  business_hours_end time DEFAULT '18:00',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_auto_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view auto replies"
  ON public.whatsapp_auto_replies FOR SELECT
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Admin can insert auto replies"
  ON public.whatsapp_auto_replies FOR INSERT
  WITH CHECK (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Admin can update auto replies"
  ON public.whatsapp_auto_replies FOR UPDATE
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Master admin full access auto replies"
  ON public.whatsapp_auto_replies FOR ALL
  USING (is_master_admin(auth.uid()));

CREATE TRIGGER update_whatsapp_auto_replies_updated_at
  BEFORE UPDATE ON public.whatsapp_auto_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Enable Realtime for messages and conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
