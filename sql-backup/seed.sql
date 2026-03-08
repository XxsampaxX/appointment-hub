-- =============================================
-- SEED.SQL - Dados iniciais (exemplo)
-- Execute DEPOIS de policies.sql
-- =============================================

-- NOTA: Os dados reais (empresas, usuários, agendamentos) estão no
-- banco atual do Lovable Cloud. Para exportá-los, acesse o backend
-- e exporte via SQL ou CSV.

-- Exemplo: Criar empresa inicial
-- INSERT INTO public.companies (name, slug, phone, document, status)
-- VALUES ('Minha Empresa', 'minha-empresa', '11999999999', '', 'active');

-- Exemplo: Associar usuário como admin (após criar conta via Auth)
-- INSERT INTO public.company_members (company_id, user_id, role)
-- VALUES (
--   (SELECT id FROM public.companies WHERE slug = 'minha-empresa'),
--   'SEU_USER_ID_AQUI',
--   'admin'
-- );

-- Exemplo: Criar assinatura free
-- INSERT INTO public.subscriptions (company_id, plan, status, max_appointments_month)
-- VALUES (
--   (SELECT id FROM public.companies WHERE slug = 'minha-empresa'),
--   'free', 'active', 50
-- );

-- Exemplo: Promover usuário a master_admin
-- INSERT INTO public.global_roles (user_id, role)
-- VALUES ('SEU_USER_ID_AQUI', 'master_admin');
