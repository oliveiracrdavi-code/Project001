# CLAUDE.md — Agenda Boa

## Stack
- **Framework:** Next.js 15 App Router + TypeScript
- **Auth + DB:** Supabase (Postgres, Row Level Security)
- **Payments:** Stripe (subscriptions em BRL, Customer Portal)
- **Messaging:** Evolution API (WhatsApp via interface `MessageProvider`)
- **UI:** shadcn/ui + Tailwind CSS
- **Deploy:** Vercel (app) + Supabase Free (DB) + GitHub Actions (cron)

## Princípios (adaptados de Karpathy)

1. **Think Before Coding** — Antes de implementar, entenda o requisito inteiro. Se houver ambiguidade sobre isolamento de tenant ou segurança, pergunte primeiro.

2. **Simplicity First** — Prefira a solução mais simples que funciona. Não adicione abstrações sem necessidade. Três linhas similares são melhores que uma abstração prematura.

3. **Surgical Changes** — Faça mudanças focadas. Não refatore código adjacente ao consertar um bug. Não "melhore" o que não está no escopo.

4. **Goal-Driven Execution** — Cada mudança deve ter propósito claro. Se não sabe por que está fazendo algo, pare e questione.

## Regras de segurança críticas

- **NUNCA** use a `service_role` key no cliente (browser). Apenas em Route Handlers de server-side (webhooks, cron).
- **SEMPRE** passe `tenant_id` em todos os INSERTs — a RLS verifica mas a app deve filtrar também (defense-in-depth).
- **Consentimento WhatsApp é obrigatório** antes de enviar qualquer mensagem. Verificar `client.whatsapp_consent === true` no cron.
- **Double-booking** está protegido por `EXCLUSION CONSTRAINT` no Postgres — ao receber erro `23P01`, informe ao usuário de forma amigável (não exponha o erro técnico).
- **Webhooks Stripe** devem sempre verificar a assinatura com `stripe.webhooks.constructEvent`. Nunca processar sem verificação.

## Modelagem de dados

- Todos os timestamps são `timestamptz` (UTC). Converter para `America/Sao_Paulo` apenas na UI.
- O `timezone` do tenant está em `tenants.timezone` — use para exibição e para cron de lembretes.
- `lgpd_consents` é append-only — nunca UPDATE ou DELETE.
- Clientes excluídos usam `deleted_at` (soft delete) — nunca DELETE físico, pois appointments referenciam clientes.

## Padrão de messaging

```typescript
// Sempre use a interface, nunca a Evolution API diretamente
import { getMessageProvider } from '@/lib/messaging'
const messaging = getMessageProvider()
await messaging.sendText({ to: client.phone, text: '...' })
```

Trocar de Evolution para Cloud API oficial: substitua apenas `lib/messaging/evolution.ts` sem mudar chamadores.

## GitHub Actions

- `CRON_SECRET` deve ser um valor aleatório forte (≥32 chars) armazenado como GitHub Secret.
- `APP_URL` é a URL de produção (ex: `https://agenda-boa.vercel.app`).
- Cron pode atrasar 10–30 min — aceitável para lembretes diários, não para lembretes em tempo real.
- Repositório deve ser **público** para cron ilimitado no GitHub Free. Se privado, use Vercel Cron ou equivalente.

## LGPD — checklist do MVP

- [x] Consentimento LGPD na criação de cliente (registrado em `lgpd_consents`)
- [x] Consentimento WhatsApp separado e opcional
- [x] Soft delete de clientes (`deleted_at`)
- [ ] Endpoint de exclusão de dados do cliente (implementar quando solicitado)
- [ ] Página de política de privacidade (`/privacidade`)
- [ ] Versão da política registrada em `lgpd_consents.policy_version`

## Variáveis de ambiente necessárias

Ver `.env.example` para lista completa. Todas as chaves secretas ficam **apenas no servidor** (sem prefixo `NEXT_PUBLIC_`).

## Comandos úteis

```bash
npm run dev          # Dev server
npm run type-check   # TypeScript sem emitir
npm run build        # Build de produção
```
