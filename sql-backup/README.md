# Backup SQL - Agendya

## Ordem de execução no SQL Editor do Supabase

1. **`schema.sql`** → Cria enums, tabelas, view, índices e habilita RLS
2. **`functions.sql`** → Cria funções de autorização e triggers
3. **`policies.sql`** → Aplica todas as políticas RLS
4. **`seed.sql`** → Dados iniciais (descomente e ajuste conforme necessário)

## Observações

- O trigger `on_auth_user_created` referencia `auth.users` — funciona nativamente no Supabase
- As Edge Functions devem ser copiadas da pasta `supabase/functions/` e deployadas via CLI (`supabase functions deploy`)
- Os secrets (RESEND_API_KEY, META_APP_ID, etc.) devem ser configurados no novo projeto via Dashboard → Settings → Edge Functions → Secrets
