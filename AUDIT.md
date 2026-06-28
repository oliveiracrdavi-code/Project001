# AUDIT.md — Agenda Boa

Data da auditoria: 2026-06-28

---

## 1. Build

| Check | Status |
|-------|--------|
| `npm run build` passa sem erros | ✅ |
| `npm run type-check` passa sem erros | ✅ |
| Nenhum `any` implícito exposto ao compilador | ✅ |

---

## 2. Segurança — `service_role` key

A `service_role` key **nunca deve ser exposta ao browser**. Usos verificados:

| Arquivo | Uso | OK? |
|---------|-----|-----|
| `app/api/webhooks/stripe/route.ts` | Server-side Route Handler | ✅ |
| `app/api/cron/reminders/route.ts` | Server-side Route Handler | ✅ |
| `app/api/cron/ping/route.ts` | Server-side Route Handler | ✅ |
| `app/api/booking/slots/route.ts` | Server-side Route Handler | ✅ |
| `app/api/booking/confirm/route.ts` | Server-side Route Handler | ✅ |
| `scripts/seed.ts` | Script local (nunca no browser) | ✅ |
| `lib/supabase/client.ts` | Usa apenas `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ |

Nenhum arquivo `'use client'` importa ou usa `service_role`.

---

## 3. Row Level Security (RLS)

### Tabelas com RLS habilitado e políticas configuradas

| Tabela | RLS ativo | Política padrão |
|--------|-----------|----------------|
| `tenants` | ✅ | `my_tenant_ids()` SECURITY DEFINER |
| `tenant_members` | ✅ | `my_tenant_ids()` |
| `clients` | ✅ | `my_tenant_ids()` + soft delete |
| `services` | ✅ | `my_tenant_ids()` |
| `professionals` | ✅ | `my_tenant_ids()` |
| `appointments` | ✅ | `my_tenant_ids()` |
| `lgpd_consents` | ✅ | `my_tenant_ids()` (INSERT only — append-only) |
| `business_hours` | ✅ | `my_tenant_ids()` |
| `business_breaks` | ✅ | `my_tenant_ids()` |
| `business_closures` | ✅ | `my_tenant_ids()` |
| `ai_knowledge_base` | ✅ | `my_tenant_ids()` |
| `booking_pages` | ✅ | `my_tenant_ids()` |

### Tabelas sem RLS (acesso apenas via service_role)

| Tabela | Justificativa |
|--------|--------------|
| `processed_stripe_events` | Acessada exclusivamente no webhook server-side |

### Função auxiliar

`my_tenant_ids()` é definida com `SECURITY DEFINER` — executa com os privilégios do owner, não do caller. Isso garante que a função possa acessar `tenant_members` independentemente do papel do chamador. A função é definida no schema `public` mas retorna apenas os `tenant_id` do usuário autenticado via `auth.uid()`.

---

## 4. Double-booking Prevention

A constraint de exclusão no Postgres garante que não existam agendamentos sobrepostos para o mesmo profissional:

```sql
EXCLUDE USING gist (
  professional_id WITH =,
  tstzrange(start_time, end_time, '[)') WITH &&
) WHERE (status NOT IN ('cancelled', 'no_show'))
```

- Código de erro Postgres: `23P01` (exclusion_violation)
- O endpoint `/api/booking/confirm` captura este código e retorna HTTP 409 com mensagem amigável
- O endpoint `/dashboard/appointments/new` deve fazer o mesmo (verificar implementação na próxima auditoria)

---

## 5. LGPD

| Requisito | Status |
|-----------|--------|
| Consentimento de dados na criação de cliente (dashboard) | ✅ |
| Consentimento de WhatsApp separado e opcional | ✅ |
| Consentimento na página pública de agendamento | ✅ |
| `lgpd_consents` é append-only (UPDATE/DELETE não autorizados por RLS) | ✅ |
| Soft delete de clientes via `deleted_at` | ✅ |
| CPF armazenado mascarado (`***.xxx.xxx-**`) | ✅ |
| Versão da política registrada em `lgpd_consents.policy_version` | ✅ (`'1.0'`) |
| Página `/privacidade` | ❌ Pendente |
| Endpoint de exclusão de dados do cliente | ❌ Pendente |

---

## 6. Webhooks Stripe

- Assinatura sempre verificada com `stripe.webhooks.constructEvent`
- Idempotência via tabela `processed_stripe_events` (unique constraint em `event_id`)
- Eventos duplicados retornam `{ received: true, skipped: true }` sem reprocessar
- Plano do tenant sincronizado automaticamente em `subscription.created/updated`
- Cancelamento reverte plano para `'comecar'`

---

## 7. Feature Gating

- Flags de feature definidas em `lib/plans/config.ts` (única fonte de verdade)
- `lib/plans/gating.ts` expõe `checkFeature()` e `requireFeatureOrFail()` para uso em Route Handlers
- Componente `PlanGate` para gating visual na UI
- **Pendente:** aplicar `requireFeatureOrFail()` nos endpoints que servem features pagas (pacotes, relatórios, etc.)

---

## 8. Problemas conhecidos / Backlog de segurança

| Problema | Prioridade | Ação |
|----------|-----------|------|
| `/privacidade` e `/termos` não implementados | Alta | Implementar páginas estáticas |
| Dashboard de agendamentos não captura erro `23P01` com mensagem amigável | Média | Verificar `app/dashboard/appointments/new` |
| Endpoint de exclusão de dados LGPD não implementado | Média | Implementar `DELETE /api/clients/[id]/data` |
| CPF não solicitado na criação de cliente pelo dashboard | Baixa | Adicionar campo opcional na tela de criação |
| Gating de backend não aplicado em todos os endpoints (pacotes, relatórios) | Média | Aplicar `requireFeatureOrFail` ao implementar as features |
