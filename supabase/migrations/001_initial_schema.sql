-- =============================================================
-- Agenda Boa — Schema inicial com multi-tenancy + RLS + LGPD
-- =============================================================

-- Tipos ENUM
CREATE TYPE appointment_status AS ENUM (
  'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'
);
CREATE TYPE tenant_member_role AS ENUM ('owner', 'admin', 'professional');
CREATE TYPE subscription_status AS ENUM (
  'trialing', 'active', 'canceled', 'incomplete',
  'incomplete_expired', 'past_due', 'unpaid', 'paused'
);

-- Extensão para double-booking prevention
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =============================================================
-- TENANTS (salões)
-- =============================================================
CREATE TABLE tenants (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     text NOT NULL,
  slug                     text NOT NULL UNIQUE,
  timezone                 text NOT NULL DEFAULT 'America/Sao_Paulo',
  phone                    text,
  address                  text,
  stripe_customer_id       text UNIQUE,
  stripe_subscription_id   text UNIQUE,
  stripe_price_id          text,
  subscription_status      subscription_status,
  subscription_period_end  timestamptz,
  whatsapp_consent_enabled boolean NOT NULL DEFAULT false,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- TENANT MEMBERS (usuários vinculados a salões)
-- =============================================================
CREATE TABLE tenant_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       tenant_member_role NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

-- =============================================================
-- Função helper SECURITY DEFINER — evita recursão em RLS
-- Avalia UMA VEZ por query (STABLE) em vez de por linha
-- =============================================================
CREATE OR REPLACE FUNCTION my_tenant_ids()
  RETURNS TABLE(tenant_id uuid)
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT tm.tenant_id
  FROM tenant_members tm
  WHERE tm.user_id = (SELECT auth.uid())
$$;

-- =============================================================
-- CLIENTS
-- =============================================================
CREATE TABLE clients (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                   text NOT NULL,
  phone                  text NOT NULL,
  email                  text,
  notes                  text,
  whatsapp_consent       boolean NOT NULL DEFAULT false,
  whatsapp_consent_date  timestamptz,
  lgpd_consent           boolean NOT NULL DEFAULT false,
  lgpd_consent_date      timestamptz,
  -- Soft delete para LGPD (manter referências de appointments)
  deleted_at             timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- SERVICES
-- =============================================================
CREATE TABLE services (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description      text,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  price_cents      integer NOT NULL CHECK (price_cents >= 0),
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- PROFESSIONALS
-- =============================================================
CREATE TABLE professionals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         text NOT NULL,
  phone        text,
  specialties  text[] NOT NULL DEFAULT '{}',
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- APPOINTMENTS
-- =============================================================
CREATE TABLE appointments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id             uuid NOT NULL REFERENCES clients(id),
  professional_id       uuid NOT NULL REFERENCES professionals(id),
  service_id            uuid NOT NULL REFERENCES services(id),
  start_time            timestamptz NOT NULL,
  end_time              timestamptz NOT NULL,
  status                appointment_status NOT NULL DEFAULT 'scheduled',
  notes                 text,
  reminder_sent         boolean NOT NULL DEFAULT false,
  return_reminder_sent  boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  -- Previne double-booking no banco — só afeta agendamentos não-cancelados
  CONSTRAINT no_double_booking EXCLUDE USING GIST (
    professional_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  ) WHERE (status <> 'cancelled' AND status <> 'no_show'),

  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- =============================================================
-- LGPD CONSENTS (registro imutável de consentimentos)
-- =============================================================
CREATE TABLE lgpd_consents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid NOT NULL REFERENCES clients(id),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  consent_type    text NOT NULL,  -- 'data_processing' | 'whatsapp_marketing'
  granted         boolean NOT NULL,
  policy_version  text NOT NULL,
  ip_address      inet,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- ÍNDICES (colunas usadas em policies e queries frequentes)
-- =============================================================
CREATE INDEX idx_tenant_members_user_id ON tenant_members(user_id);
CREATE INDEX idx_tenant_members_tenant_id ON tenant_members(tenant_id);

CREATE INDEX idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX idx_clients_phone ON clients(tenant_id, phone);
CREATE INDEX idx_clients_deleted ON clients(tenant_id, deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_services_tenant_id ON services(tenant_id);
CREATE INDEX idx_professionals_tenant_id ON professionals(tenant_id);

CREATE INDEX idx_appointments_tenant_id ON appointments(tenant_id);
CREATE INDEX idx_appointments_professional_time ON appointments(professional_id, start_time);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_status ON appointments(tenant_id, status);
CREATE INDEX idx_appointments_start_time ON appointments(tenant_id, start_time);
-- Índice para cron de lembretes
CREATE INDEX idx_appointments_reminders ON appointments(start_time, reminder_sent, status)
  WHERE reminder_sent = false AND status IN ('scheduled', 'confirmed');
CREATE INDEX idx_appointments_return ON appointments(start_time, return_reminder_sent, status)
  WHERE return_reminder_sent = false AND status = 'completed';

CREATE INDEX idx_lgpd_consents_client_id ON lgpd_consents(client_id);
CREATE INDEX idx_lgpd_consents_tenant_id ON lgpd_consents(tenant_id);

-- =============================================================
-- UPDATED_AT trigger
-- =============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER professionals_updated_at BEFORE UPDATE ON professionals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lgpd_consents ENABLE ROW LEVEL SECURITY;

-- tenants: usuário só vê tenants dos quais é membro
CREATE POLICY "tenants_select" ON tenants FOR SELECT
  USING (id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "tenants_update" ON tenants FOR UPDATE
  USING (id IN (SELECT tenant_id FROM my_tenant_ids()))
  WITH CHECK (id IN (SELECT tenant_id FROM my_tenant_ids()));

-- tenant_members: usuário vê membros do mesmo tenant
CREATE POLICY "tenant_members_select" ON tenant_members FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "tenant_members_insert" ON tenant_members FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "tenant_members_delete" ON tenant_members FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

-- clients
CREATE POLICY "clients_select" ON clients FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "clients_insert" ON clients FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "clients_update" ON clients FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "clients_delete" ON clients FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

-- services
CREATE POLICY "services_select" ON services FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "services_insert" ON services FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "services_update" ON services FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "services_delete" ON services FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

-- professionals
CREATE POLICY "professionals_select" ON professionals FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "professionals_insert" ON professionals FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "professionals_update" ON professionals FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "professionals_delete" ON professionals FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

-- appointments
CREATE POLICY "appointments_select" ON appointments FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "appointments_insert" ON appointments FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "appointments_update" ON appointments FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "appointments_delete" ON appointments FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

-- lgpd_consents (append-only para usuários, service_role para admin)
CREATE POLICY "lgpd_consents_select" ON lgpd_consents FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));

CREATE POLICY "lgpd_consents_insert" ON lgpd_consents FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM my_tenant_ids()));
