export type PlanKey = 'comecar' | 'profissional' | 'inteligente' | 'enterprise'

export interface PlanFeatureFlags {
  // Core features
  hasPublicBookingPage: boolean
  hasEmailReminders: boolean
  hasUnlimitedEmailReminders: boolean
  // Profissional+
  hasMultipleProfessionals: boolean
  hasPackages: boolean
  hasCashFlow: boolean
  hasBasicReports: boolean
  // Inteligente+ (flags only — real implementation is Bloco B)
  hasWhatsAppAgent: boolean
  hasAIOnboarding: boolean
  hasDashboardInsights: boolean
  // Enterprise (flags only)
  hasMultiUnit: boolean
  hasAdvancedReports: boolean
  hasPrioritySupport: boolean
  hasCustomAITraining: boolean
}

export interface PlanConfig {
  key: PlanKey
  displayName: string
  description: string
  priceCentsMonthly: number
  limits: {
    maxProfessionals: number
    maxAppointmentsPerMonth: number
  }
  features: string[]
  flags: PlanFeatureFlags
  recommended?: boolean
  anchor?: boolean
}

const BASE_FLAGS: PlanFeatureFlags = {
  hasPublicBookingPage: false,
  hasEmailReminders: false,
  hasUnlimitedEmailReminders: false,
  hasMultipleProfessionals: false,
  hasPackages: false,
  hasCashFlow: false,
  hasBasicReports: false,
  hasWhatsAppAgent: false,
  hasAIOnboarding: false,
  hasDashboardInsights: false,
  hasMultiUnit: false,
  hasAdvancedReports: false,
  hasPrioritySupport: false,
  hasCustomAITraining: false,
}

export const PLANS: Record<PlanKey, PlanConfig> = {
  comecar: {
    key: 'comecar',
    displayName: 'Começar',
    description: 'Para quem está saindo do caderno e do WhatsApp bagunçado',
    priceCentsMonthly: 8900,
    limits: {
      maxProfessionals: 1,
      maxAppointmentsPerMonth: 100,
    },
    features: [
      'Página pública de agendamento',
      '1 profissional',
      'Até 100 agendamentos por mês',
      'Ficha completa de cada cliente',
      'Agenda do dia organizada',
      'Lembrete de agendamento por e-mail',
      'Configuração 100% manual',
    ],
    flags: {
      ...BASE_FLAGS,
      hasPublicBookingPage: true,
      hasEmailReminders: true,
    },
  },

  profissional: {
    key: 'profissional',
    displayName: 'Profissional',
    description: 'Para salões que já cresceram e precisam de mais controle',
    priceCentsMonthly: 17900,
    limits: {
      maxProfessionals: 5,
      maxAppointmentsPerMonth: 500,
    },
    features: [
      'Tudo do plano Começar, mais:',
      'Até 5 profissionais',
      'Até 500 agendamentos por mês',
      'Controle de pacotes e sessões',
      'Fluxo de caixa simples',
      'Relatórios básicos (ocupação, receita)',
      'Lembretes de retorno ilimitados',
    ],
    flags: {
      ...BASE_FLAGS,
      hasPublicBookingPage: true,
      hasEmailReminders: true,
      hasUnlimitedEmailReminders: true,
      hasMultipleProfessionals: true,
      hasPackages: true,
      hasCashFlow: true,
      hasBasicReports: true,
    },
  },

  inteligente: {
    key: 'inteligente',
    displayName: 'Inteligente',
    description: 'O plano que trabalha por você — agendamento automático pelo WhatsApp com IA',
    priceCentsMonthly: 29900,
    recommended: true,
    limits: {
      maxProfessionals: 10,
      maxAppointmentsPerMonth: 2000,
    },
    features: [
      'Tudo do plano Profissional, mais:',
      'Até 10 profissionais',
      'Agente de IA no WhatsApp (agendamento automático)',
      'IA que configura o salão por você',
      'Sugestões inteligentes no dashboard',
      'Lembretes e confirmações automáticos pelo WhatsApp',
    ],
    flags: {
      ...BASE_FLAGS,
      hasPublicBookingPage: true,
      hasEmailReminders: true,
      hasUnlimitedEmailReminders: true,
      hasMultipleProfessionals: true,
      hasPackages: true,
      hasCashFlow: true,
      hasBasicReports: true,
      hasWhatsAppAgent: true,
      hasAIOnboarding: true,
      hasDashboardInsights: true,
    },
  },

  enterprise: {
    key: 'enterprise',
    displayName: 'Enterprise',
    description: 'Para redes de salões e clínicas com múltiplas unidades',
    priceCentsMonthly: 59900,
    anchor: true,
    limits: {
      maxProfessionals: 999,
      maxAppointmentsPerMonth: 999999,
    },
    features: [
      'Tudo do plano Inteligente, mais:',
      'Profissionais e agendamentos ilimitados',
      'Múltiplas unidades e WhatsApp por unidade',
      'IA com treinamento customizado para o seu negócio',
      'Relatórios avançados e exportação',
      'Suporte prioritário com resposta em até 4h',
    ],
    flags: {
      ...BASE_FLAGS,
      hasPublicBookingPage: true,
      hasEmailReminders: true,
      hasUnlimitedEmailReminders: true,
      hasMultipleProfessionals: true,
      hasPackages: true,
      hasCashFlow: true,
      hasBasicReports: true,
      hasWhatsAppAgent: true,
      hasAIOnboarding: true,
      hasDashboardInsights: true,
      hasMultiUnit: true,
      hasAdvancedReports: true,
      hasPrioritySupport: true,
      hasCustomAITraining: true,
    },
  },
}

export const PLAN_ORDER: PlanKey[] = ['comecar', 'profissional', 'inteligente', 'enterprise']

export function getPlanConfig(key: PlanKey | null | undefined): PlanConfig {
  return PLANS[key ?? 'comecar'] ?? PLANS.comecar
}

export function planHasFeature(
  plan: PlanKey | null | undefined,
  flag: keyof PlanFeatureFlags
): boolean {
  return getPlanConfig(plan).flags[flag]
}

export function planWithinLimits(
  plan: PlanKey | null | undefined,
  limitKey: keyof PlanConfig['limits'],
  currentValue: number
): boolean {
  return currentValue < getPlanConfig(plan).limits[limitKey]
}
