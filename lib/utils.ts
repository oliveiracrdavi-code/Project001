import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amountInCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amountInCents / 100)
}

export function formatDateBR(date: Date | string, tz = 'America/Sao_Paulo'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatInTimeZone(d, tz, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function toSaoPauloTime(utcDate: Date): Date {
  return toZonedTime(utcDate, 'America/Sao_Paulo')
}

export function formatAppointmentTime(startTime: string, endTime: string, tz = 'America/Sao_Paulo'): string {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const startFmt = formatInTimeZone(start, tz, 'HH:mm')
  const endFmt = formatInTimeZone(end, tz, 'HH:mm')
  const dateFmt = formatInTimeZone(start, tz, "EEEE, dd 'de' MMMM", { locale: ptBR })
  return `${dateFmt} · ${startFmt}–${endFmt}`
}

export function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
