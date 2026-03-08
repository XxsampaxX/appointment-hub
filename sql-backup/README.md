# Backup SQL - Agendya

## Última atualização: 2026-03-08

## Opção 1: Arquivo único (recomendado)

Execute **`migration-completa.sql`** no SQL Editor do Supabase — contém tudo em um único arquivo na ordem correta.

## Opção 2: Arquivos separados

Execute na seguinte ordem:

1. **`schema.sql`** → Enums, tabelas, view, índices e RLS habilitado
2. **`functions.sql`** → Funções de autorização e triggers
3. **`policies.sql`** → Políticas RLS
4. **`seed.sql`** → Dados iniciais (descomente e ajuste)

## Após executar o SQL

1. **Supabase Dashboard → Authentication → Settings:**
   - Desabilitar "Confirm email"
   - Habilitar "Enable email signup"

2. **Configurar Secrets (Settings → Edge Functions → Secrets):**
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `EVOLUTION_API_URL` / `EVOLUTION_API_KEY` / `EVOLUTION_INSTANCE_NAME`
   - `META_APP_ID` / `META_APP_SECRET`
   - `WHATSAPP_VERIFY_TOKEN` / `WHATSAPP_ENCRYPTION_KEY`

3. **Deploy Edge Functions via CLI:**
   ```bash
   supabase functions deploy --project-ref SEU_PROJECT_REF
   ```

4. **Criar master admin:**
   ```sql
   -- Após criar conta via Auth, pegue o user_id e execute:
   INSERT INTO public.global_roles (user_id, role)
   VALUES ('SEU_USER_ID', 'master_admin');
   ```

## Observações

- O trigger `on_auth_user_created` referencia `auth.users` — funciona nativamente no Supabase
- As Edge Functions estão em `supabase/functions/`
- Variáveis de ambiente do frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
