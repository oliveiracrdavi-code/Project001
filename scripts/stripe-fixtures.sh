#!/usr/bin/env bash
# Cria os 4 produtos e preços da Agenda Boa no Stripe (BRL, mensal)
# Pré-requisito: stripe CLI instalado e autenticado (stripe login)
# Uso: bash scripts/stripe-fixtures.sh

set -euo pipefail

echo "Criando produtos e preços no Stripe..."
echo ""

# ─── Começar ───────────────────────────────────────────────
COMECAR_ID=$(stripe products create \
  --name="Agenda Boa — Começar" \
  --description="Para profissionais autônomos" \
  -d "metadata[plan_key]=comecar" \
  --format=json | jq -r '.id')

COMECAR_PRICE=$(stripe prices create \
  --product="$COMECAR_ID" \
  --currency=brl \
  --unit-amount=8900 \
  -d "recurring[interval]=month" \
  --format=json | jq -r '.id')

echo "STRIPE_PRICE_COMECAR=$COMECAR_PRICE"

# ─── Profissional ───────────────────────────────────────────
PROFISSIONAL_ID=$(stripe products create \
  --name="Agenda Boa — Profissional" \
  --description="Para salões com até 5 profissionais" \
  -d "metadata[plan_key]=profissional" \
  --format=json | jq -r '.id')

PROFISSIONAL_PRICE=$(stripe prices create \
  --product="$PROFISSIONAL_ID" \
  --currency=brl \
  --unit-amount=17900 \
  -d "recurring[interval]=month" \
  --format=json | jq -r '.id')

echo "STRIPE_PRICE_PROFISSIONAL=$PROFISSIONAL_PRICE"

# ─── Inteligente ────────────────────────────────────────────
INTELIGENTE_ID=$(stripe products create \
  --name="Agenda Boa — Inteligente" \
  --description="Com agente de IA no WhatsApp" \
  -d "metadata[plan_key]=inteligente" \
  --format=json | jq -r '.id')

INTELIGENTE_PRICE=$(stripe prices create \
  --product="$INTELIGENTE_ID" \
  --currency=brl \
  --unit-amount=29900 \
  -d "recurring[interval]=month" \
  --format=json | jq -r '.id')

echo "STRIPE_PRICE_INTELIGENTE=$INTELIGENTE_PRICE"

# ─── Enterprise ─────────────────────────────────────────────
ENTERPRISE_ID=$(stripe products create \
  --name="Agenda Boa — Enterprise" \
  --description="Para redes com múltiplas unidades" \
  -d "metadata[plan_key]=enterprise" \
  --format=json | jq -r '.id')

ENTERPRISE_PRICE=$(stripe prices create \
  --product="$ENTERPRISE_ID" \
  --currency=brl \
  --unit-amount=59900 \
  -d "recurring[interval]=month" \
  --format=json | jq -r '.id')

echo "STRIPE_PRICE_ENTERPRISE=$ENTERPRISE_PRICE"

echo ""
echo "✓ Concluído! Copie os valores acima para o seu .env.local e as variáveis de ambiente do Vercel."
