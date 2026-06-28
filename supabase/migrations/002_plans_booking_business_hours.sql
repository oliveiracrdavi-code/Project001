-- =============================================================
-- Agenda Boa — Migração 002: Planos, agendamento público, horários
-- =============================================================

-- ── tenants: coluna plan ────────────────────────────────────
ALTER TABLE tenants
  ADD COLUMN plan text NOT NULL DEFAULT 'comecar'
    CHECK (plan IN ('comecar', 'profissional', 'inteligente', 'enterprise'));

-- ── tenants: coluna logo (usada na página pública) ──────────
ALTER TABLE tenants
  ADD COLUMN logo_url text;

-- ── clients: CPF mascarado (armazenado como ***.xxx.xxx-**) ─
ALTER TABLE clients
  ADD COLUMN cpf text;

-- ── appointments: timestamps de lembretes enviados ──────────
-- (booleans existentes são mantidos para compatibilidade com cron)
ALTER TABLE appointments
  ADD COLUMN reminder_sent_at     timestamptz,
  ADD COLUMN return_reminder_sent_at timestamptz;

-- ── processed_stripe_events (idempotência webhook) ──────────
CREATE TABLE processed_stripe_events (
  event_id     text PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);
-- Sem RLS: acessado apenas via service_role no webhook

-- ── business_hours (horários de funcionamento) ──────────────
CREATE TABLE business_hours (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid    NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time   time    NOT NULL DEFAULT '09:00',
  close_time  time    NOT NULL DEFAULT '18:00',
  is_closed   boolean NOT NULL DEFAULT false,
  UNIQUE (tenant_id, day_of_week)
);

-- ── business_breaks (intervalos/almoço) ─────────────────────
CREATE TABLE business_breaks (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid    NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time  time    NOT NULL,
  end_time    time    NOT NULL
);

-- ── business_closures (feriados/férias) ─────────────────────
CREATE TABLE business_closures (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date      date NOT NULL,
  reason    text,
  UNIQUE (tenant_id, date)
);

-- ── ai_knowledge_base (base para agente WhatsApp) ───────────
CREATE TABLE ai_knowledge_base (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category   text NOT NULL DEFAULT 'geral',
  key        text NOT NULL,
  value      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key)
);

-- ── booking_pages (configuração da página pública) ───────────
CREATE TABLE booking_pages (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid    NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  is_active      boolean NOT NULL DEFAULT false,
  custom_message text,
  require_cpf    boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- Índices
-- =============================================================
CREATE INDEX idx_business_hours_tenant    ON business_hours(tenant_id);
CREATE INDEX idx_business_breaks_tenant   ON business_breaks(tenant_id);
CREATE INDEX idx_business_closures_tenant ON business_closures(tenant_id, date);
CREATE INDEX idx_ai_knowledge_base_tenant ON ai_knowledge_base(tenant_id, category);
CREATE INDEX idx_booking_pages_tenant     ON booking_pages(tenant_id);

-- =============================================================
-- RLS
-- =============================================================
ALTER TABLE business_hours    ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_breaks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_pages     ENABLE ROW LEVEL SECURITY;

-- Políticas: tenant autenticado gerencia seus próprios dados
CREATE POLICY "business_hours_tenant_all" ON business_hours
  USING   (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "business_breaks_tenant_all" ON business_breaks
  USING   (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "business_closures_tenant_all" ON business_closures
  USING   (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "ai_knowledge_base_tenant_all" ON ai_knowledge_base
  USING   (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "booking_pages_tenant_all" ON booking_pages
  USING   (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

-- Leitura pública: página de agendamento lida via service_role no servidor
-- (nenhuma política anon adicional necessária — leitura feita server-side)

-- =============================================================
-- Triggers de updated_at para novas tabelas
-- =============================================================
CREATE TRIGGER ai_knowledge_base_updated_at
  BEFORE UPDATE ON ai_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER booking_pages_updated_at
  BEFORE UPDATE ON booking_pages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
