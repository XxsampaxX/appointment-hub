# Prompt de Migração — Agendya

Use este prompt para recriar o projeto **Agendya** em outro projeto Lovable (ou qualquer ambiente React + Supabase).

---

## 📋 Visão Geral

**Agendya** é um SaaS multi-tenant de agendamento online para clínicas, salões, barbearias, nail designers e serviços em geral. Cada empresa (tenant) tem sua URL própria (`/:slug`), painel administrativo, agenda, profissionais, serviços e clientes — tudo isolado por `company_id` com Row Level Security (RLS).

---

## 🏗️ Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, RLS)
- **Bibliotecas:** React Router DOM v6, TanStack React Query, FullCalendar, Recharts, date-fns, Zod, React Hook Form, Lucide Icons, Sonner (toasts)
- **Email:** Resend API (remetente: `Agendya <confirmacao@agendya.app>`)
- **WhatsApp:** Meta Business API + Evolution API

---

## 🎨 Design System

### Filosofia
Estética **minimalista e profissional** inspirada em Stripe/Notion. Foco em conversão e usabilidade.

### Diretrizes Visuais
- Font: Inter (400, 500, 600, 700)
- Border-radius: 12-16px (`--radius: 0.75rem`)
- Espaços generosos (whitespace)
- Efeitos de profundidade: `backdrop-blur`, sombras leves
- Hierarquia clara: botões primários (sólidos azuis), secundários (outline/ghost)
- Classe utilitária: `.glass-card` → `bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm`

### Paleta de Cores (HSL)
```
--primary: 221 83% 53% (azul principal)
--primary-dark: 224 76% 30%
--background: 210 20% 98%
--foreground: 220 40% 8%
--card: 0 0% 100%
--muted: 210 20% 96%
--muted-foreground: 215 16% 47%
--border: 214 20% 90%
--destructive: 0 72% 51%
--warning: 38 92% 50%
--success: 142 71% 45%
--sidebar-background: 222 47% 11% (sidebar escura)
--sidebar-accent: 222 40% 16%
```

### Dark Mode
Suportado com variáveis `.dark` invertidas.

---

## 🗂️ Estrutura de Rotas

### Rotas Públicas
| Rota | Descrição |
|------|-----------|
| `/` | Landing page SaaS (Hero, Features, How It Works, Testimonials, CTA) |
| `/login` | Login global (redireciona para seleção de empresa) |
| `/empresas` | Seleção de empresa do usuário |
| `/cadastrar-empresa` | Onboarding multi-step: auth → tipo de negócio → dados da empresa |
| `/planos` | Página de planos |
| `/reset-password` | Redefinição de senha (via token_hash + verifyOtp) |
| `/oauth/meta/callback` | Callback OAuth do Meta/WhatsApp |

### Rotas Master Admin (protegidas)
| Rota | Descrição |
|------|-----------|
| `/admin-master` | Dashboard com KPIs, lista de empresas, moderação |
| `/admin-master/nova-empresa` | Criar empresa + dono via Edge Function |

### Rotas de Empresa (`/:slug/...`)
| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/:slug` | Público | Login da empresa |
| `/:slug/login` | Público | Login da empresa |
| `/:slug/cadastro` | Público | Cadastro de funcionários |
| `/:slug/agendar` | Público | Agendamento público (sem login) |
| `/:slug/admin` | Admin | Dashboard da empresa |
| `/:slug/agenda` | Admin, Profissional, Recepcionista | Agenda (FullCalendar) |
| `/:slug/clientes` | Admin, Recepcionista | CRUD de clientes |
| `/:slug/servicos` | Admin | CRUD de serviços |
| `/:slug/procedimentos` | Admin | Procedimentos |
| `/:slug/profissionais` | Admin | CRUD de profissionais |
| `/:slug/financeiro` | Admin | Financeiro |
| `/:slug/usuarios` | Admin | Membros da empresa |
| `/:slug/configuracoes` | Admin | Configurações da empresa |
| `/:slug/horarios` | Admin | Configurações de horários |
| `/:slug/estabelecimentos` | Admin | Estabelecimentos |
| `/:slug/whatsapp` | Admin | Config WhatsApp |
| `/:slug/atendimento` | Admin, Recepcionista | Chat WhatsApp |
| `/:slug/meu-perfil` | Autenticado | Perfil do usuário |
| `/:slug/meus-agendamentos` | Autenticado | Agendamentos do usuário |

---

## 👥 Sistema de Roles (RBAC)

| Role | Acesso |
|------|--------|
| `master_admin` | Tudo (global). Bypass RLS. Via tabela `global_roles` |
| `admin` | Acesso total na empresa (Financeiro, Usuários, Config, etc.) |
| `profissional` | Apenas Agenda |
| `recepcionista` | Agenda + Clientes + Atendimento |
| `user` | Apenas seus próprios agendamentos |

### Funções SQL de Autorização
- `is_master_admin(user_id)` → boolean
- `is_company_admin(user_id, company_id)` → boolean
- `is_company_staff(user_id, company_id)` → boolean (admin OU recepcionista)
- `is_company_member(user_id, company_id)` → boolean
- `get_member_role(user_id, company_id)` → app_role
- `check_appointment_limit(company_id)` → boolean

---

## 🗄️ Schema do Banco de Dados

### Enums
```sql
CREATE TYPE app_role AS ENUM ('admin', 'profissional', 'recepcionista', 'user');
CREATE TYPE appointment_status AS ENUM ('agendado', 'confirmado', 'concluido', 'cancelado', 'nao_compareceu');
CREATE TYPE payment_method AS ENUM ('pix', 'dinheiro', 'credito', 'debito');
CREATE TYPE subscription_status AS ENUM ('free', 'pro', 'premium');
```

### Tabelas Principais
1. **profiles** — id (= auth.users.id), name, email, phone, cpf
2. **global_roles** — user_id, role (text: 'master_admin')
3. **companies** — name, slug (unique), logo, phone, address, document, status, business_type, working_hours_start/end, slot_duration, slot_interval, working_days[], created_by
4. **company_members** — company_id, user_id, role (app_role). UNIQUE(company_id, user_id)
5. **subscriptions** — company_id (unique), plan, status, max_appointments_month, expires_at
6. **services** — company_id, name, description, duration (min), price
7. **professionals** — company_id, name, role, avatar, available
8. **clients** — company_id, name, email, phone, notes
9. **appointments** — company_id, user_id, client_id, service_id, professional_id, date, time, status, notes, client_name, client_phone, payment_method, reminder_sent, email_reminder_sent
10. **blocked_slots** — company_id, date, time, reason, active, created_by
11. **company_whatsapp** — company_id (PK), access_token_encrypted, status, meta_business_id, waba_id, phone_number_id, display_phone
12. **whatsapp_auto_replies** — company_id (PK), welcome_message, after_hours_message, is_welcome_enabled, is_after_hours_enabled, business_hours_start/end
13. **conversations** — company_id, phone_number, client_id, status, unread_count, last_message_at
14. **messages** — company_id, conversation_id, content, direction, message_type, meta_message_id, status
15. **whatsapp_logs** — company_id, appointment_id, phone, message_type, status, error_message

### View
```sql
CREATE VIEW appointment_slots AS
  SELECT professional_id, date, time, status, company_id
  FROM appointments WHERE status != 'cancelado';
```

### Triggers
1. **on_auth_user_created** → `handle_new_user()` — cria profile automaticamente
2. **update_*_updated_at** → `update_updated_at_column()` — atualiza updated_at em todas as tabelas
3. **on_member_insert_create_client** → `auto_create_client_on_member_insert()` — cria cliente quando role='user'

---

## ⚡ Edge Functions

### 1. `create-company`
- **Acesso:** master_admin apenas
- **Função:** Cria empresa + usuário (ou reutiliza existente) + company_member + subscription
- **Opcional:** Envia email de credenciais via Resend

### 2. `register-company`
- **Acesso:** Usuário autenticado
- **Função:** Registra empresa com status "pending", cria membership admin, subscription free
- **Notificação:** Email para master admins sobre nova empresa pendente

### 3. `send-email`
- **Acesso:** Público (verify_jwt=false)
- **Função:** Envia confirmação de agendamento para cliente + notificação para dono da empresa
- **Remetente:** `Agendya <confirmacao@agendya.app>`

### 4. `reset-password`
- **Acesso:** Público
- **Função:** Gera link de recovery via Supabase Admin, reconstrói URL e envia por Resend

### 5. `send-whatsapp` / `whatsapp-send-message`
- **Função:** Envio de mensagens WhatsApp via Evolution API

### 6. `whatsapp-webhook`
- **Função:** Webhook para receber mensagens do Meta WhatsApp Business API

### 7. `whatsapp-reminders`
- **Função:** Envio automático de lembretes de agendamento

### 8. `email-reminders`
- **Função:** Envio automático de lembretes por email

### 9. `whatsapp-oauth-callback`
- **Função:** Callback OAuth do Meta para conectar WhatsApp

---

## 🔒 Segurança

### Princípios
- **Isolamento total por tenant:** Todas as queries filtram por `company_id`
- **NUNCA aceitar `company_id` do frontend** em operações sensíveis — validar via contexto do usuário autenticado
- **RLS em todas as tabelas** com funções SECURITY DEFINER
- **Políticas restritivas** (RESTRICTIVE, não PERMISSIVE)
- **company_members** restringe INSERT a `role='user'` e `auth.uid() = user_id`
- **Mensagens de erro genéricas** no login para evitar enumeração de usuários

### Autenticação
- Email + Senha via Supabase Auth
- Senha: mínimo 8 caracteres, 1 maiúscula, 1 número
- Confirmação de email desabilitada (auto-confirm)
- Redefinição de senha via Edge Function + Resend

---

## 🔧 Secrets Necessários
- `RESEND_API_KEY` — para envio de emails
- `EVOLUTION_API_URL` / `EVOLUTION_API_KEY` / `EVOLUTION_INSTANCE_NAME` — WhatsApp via Evolution
- `META_APP_ID` / `META_APP_SECRET` — OAuth Meta/WhatsApp
- `WHATSAPP_VERIFY_TOKEN` / `WHATSAPP_ENCRYPTION_KEY` — segurança WhatsApp

---

## 📱 Funcionalidades-Chave

### Landing Page (`/`)
- Header fixo com backdrop-blur
- Hero 50/50 com mockup do sistema
- Seção de features, como funciona (3 passos), prova social, depoimentos
- CTAs para cadastro de empresa e WhatsApp
- Omite contador de clientes até 50 empresas

### Agendamento Público (`/:slug/agendar`)
- Multi-step: Profissional → Serviço → Data/Hora → Pagamento → Confirmar
- Consulta `appointment_slots` (view) para privacidade
- Respeita horários de trabalho, dias úteis e slots bloqueados
- Verifica limite de agendamentos do plano
- Envia confirmação por WhatsApp e email

### Agendamento do Usuário (`/:slug/meus-agendamentos`)
- Multi-step: Profissional → Serviço → Data/Hora → Confirmar
- Visualiza seus agendamentos existentes
- Mesmas validações de disponibilidade

### Agenda (`/:slug/agenda`)
- FullCalendar (TimegridWeek)
- Visualização semanal de agendamentos
- Ações de confirmação, conclusão, cancelamento, não-comparecimento

### Dashboard Admin (`/:slug/admin`)
- KPIs: agendamentos do dia/mês, receita, clientes
- Gráficos com Recharts

### Master Admin (`/admin-master`)
- KPIs globais
- Lista de empresas com contadores
- Moderação: aprovar/rejeitar empresas pending
- Alterar planos (free/basic/pro)
- Suspender/ativar empresas

### Tipos de Negócio
- clinic (Clínica/Estética)
- nail_designer (Nail Designer)
- beauty (Salão/Barbearia)
- therapy (Terapias)
- service (Serviços)
- other (Outro)

---

## 📂 Estrutura de Componentes

```
src/
├── components/
│   ├── landing/ (HeroSection, FeaturesSection, HowItWorksSection, etc.)
│   ├── ui/ (shadcn/ui components)
│   ├── AgendyaLogo.tsx
│   ├── AppSidebar.tsx (sidebar com navegação por role)
│   ├── Layout.tsx / SidebarLayout.tsx
│   ├── CompanySlugWrapper.tsx (resolve slug → company)
│   └── NavLink.tsx
├── contexts/
│   ├── AuthContext.tsx (login, register, logout, currentUser)
│   └── CompanyContext.tsx (company, companyRole por slug)
├── hooks/
│   ├── useMasterAdmin.ts
│   ├── useSubscription.ts
│   ├── useBlockedSlots.ts
│   └── use-mobile.tsx
├── services/
│   ├── supabaseData.ts (hooks CRUD: useServices, useProfessionals, etc.)
│   ├── emailService.ts
│   └── whatsappService.ts
├── pages/ (todas as páginas listadas nas rotas)
├── types/index.ts (interfaces TypeScript)
└── utils/businessTypeLabels.ts
```

---

## 🗄️ SQL Completo

Os arquivos SQL completos para recriar todo o banco estão em `sql-backup/`:
- `migration-completa.sql` — arquivo único com tudo
- `schema.sql` — estrutura das tabelas
- `functions.sql` — funções de autorização e triggers
- `policies.sql` — políticas RLS
- `seed.sql` — dados iniciais

Execute `migration-completa.sql` no SQL Editor do Supabase para replicar o banco inteiro.

---

## ⚙️ Configuração Supabase

1. **Auth Settings:** Desabilitar "Confirm email", habilitar "Email signup"
2. **Configurar Secrets** (Edge Functions)
3. **Deploy Edge Functions** via CLI
4. **Criar master admin:**
```sql
INSERT INTO public.global_roles (user_id, role)
VALUES ('SEU_USER_ID', 'master_admin');
```
