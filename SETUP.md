# SETUP.md — Agenda Boa

Guia de configuração do ambiente de desenvolvimento local.

---

## Pré-requisitos

- Node.js 20+
- npm 10+
- Conta no [Supabase](https://supabase.com) (plano gratuito é suficiente)
- Conta no [Stripe](https://stripe.com) (modo teste)
- Conta no [Resend](https://resend.com) (opcional para e-mails de lembrete)
- [Stripe CLI](https://stripe.com/docs/stripe-cli) (para criar produtos e testar webhooks)

---

## 1. Clonar e instalar

```bash
git clone <url-do-repo>
cd agenda-boa
npm install
```

---

## 2. Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Vá em **Settings → API** e copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
3. Execute as migrações no SQL Editor do Supabase:
   - Copie e execute `supabase/migrations/001_initial_schema.sql`
   - Copie e execute `supabase/migrations/002_plans_booking_business_hours.sql`
4. Em **Authentication → Settings**, configure:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/auth/callback`
   - Para testes: desative a confirmação de e-mail em **Authentication → Providers → Email**

---

## 3. Stripe

### 3.1. Criar produtos e preços

```bash
# Faça login na Stripe CLI
stripe login

# Execute o script de fixtures (cria os 4 planos em BRL)
bash scripts/stripe-fixtures.sh
```

O script imprimirá as variáveis de ambiente. Copie-as para o `.env.local`.

### 3.2. Configurar webhook local

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Anote o `whsec_...` exibido e adicione como `STRIPE_WEBHOOK_SECRET` no `.env.local`.

---

## 4. Resend (e-mail)

1. Crie uma conta em [resend.com](https://resend.com)
2. Crie uma API Key e adicione como `RESEND_API_KEY`
3. Para desenvolvimento, o Resend aceita qualquer remetente `@resend.dev` sem verificação de domínio
4. Para produção, verifique seu domínio em **Resend → Domains**

---

## 5. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha todos os valores no `.env.local`. Veja `.env.example` para a lista completa.

---

## 6. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## 7. Primeiro acesso

1. Acesse `/register` e crie uma conta
2. Você será redirecionado para `/onboarding` — preencha o nome do salão
3. Após o onboarding, você terá acesso ao dashboard em `/dashboard`

---

## 8. Dados de demonstração (opcional)

```bash
npm run seed
```

Cria um tenant demo com serviços, profissionais, clientes e agendamentos de exemplo. O slug da página pública será impresso no terminal.

---

## 9. Testes

```bash
# Testes de integração (requer Supabase + app rodando)
INTEGRATION_TESTS=1 npx playwright test

# Apenas type-check
npm run type-check
```

> **Nota:** Os testes de integração requerem que o servidor esteja rodando (`npm run dev`) e as variáveis de ambiente configuradas em `.env.local`.

---

## Estrutura do projeto

```
app/
  api/              # Route Handlers (server-side)
    billing/        # Stripe checkout e portal
    booking/        # Agendamento público (slots + confirmação)
    cron/           # Lembretes e ping anti-pause
    settings/       # Horários e base de conhecimento
    webhooks/       # Stripe webhooks
  agendar/[slug]/   # Página pública de agendamento
  auth/             # Callback de autenticação
  dashboard/        # Área logada
    billing/        # Planos e cobrança
    clients/        # Gestão de clientes
    settings/       # Configurações do salão
  login/            # Login
  onboarding/       # Primeiro acesso
  register/         # Cadastro

lib/
  messaging/        # Interface MessageProvider (Evolution API + email)
  plans/            # Configuração de planos e gating
  stripe/           # Cliente Stripe (lazy singleton)
  supabase/         # Clientes Supabase (server, client, middleware)

supabase/migrations/  # SQL de migrações
scripts/            # Utilitários de setup e seed
tests/              # Testes Playwright (CP2)
```

---

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase (pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role (apenas server-side!) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Chave publicável do Stripe |
| `STRIPE_SECRET_KEY` | Chave secreta do Stripe |
| `STRIPE_WEBHOOK_SECRET` | Segredo do webhook Stripe |
| `STRIPE_PRICE_COMECAR` | Price ID do plano Começar |
| `STRIPE_PRICE_PROFISSIONAL` | Price ID do plano Profissional |
| `STRIPE_PRICE_INTELIGENTE` | Price ID do plano Inteligente |
| `STRIPE_PRICE_ENTERPRISE` | Price ID do plano Enterprise |
| `RESEND_API_KEY` | API Key do Resend |
| `RESEND_FROM_EMAIL` | E-mail remetente (ex: `Agenda Boa <noreply@seudominio.com>`) |
| `REMINDER_CHANNEL` | `email` ou `whatsapp` |
| `EVOLUTION_API_URL` | URL da Evolution API (apenas se `REMINDER_CHANNEL=whatsapp`) |
| `EVOLUTION_API_KEY` | API Key da Evolution API |
| `EVOLUTION_INSTANCE_NAME` | Nome da instância WhatsApp |
| `CRON_SECRET` | Segredo para autenticar chamadas de cron (≥32 chars) |
| `NEXT_PUBLIC_APP_URL` | URL pública do app (ex: `https://seu-app.vercel.app`) |
