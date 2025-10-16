/**
 * Utilitários para manipulação de datas com timezone brasileiro (America/Sao_Paulo)
 * 
 * Este módulo garante que todas as operações de data/hora sejam consistentes
 * com o fuso horário de São Paulo (UTC-3 ou UTC-2 durante horário de verão)
 */

/**
 * Retorna a data e hora atual no timezone de São Paulo
 */
export function getCurrentDateTimeBR(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
}

/**
 * Formata uma data no formato YYYY-MM-DD considerando o timezone BR
 */
export function formatDateBR(date: Date): string {
  const dateInBR = new Date(date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
  
  const year = dateInBR.getFullYear()
  const month = String(dateInBR.getMonth() + 1).padStart(2, "0")
  const day = String(dateInBR.getDate()).padStart(2, "0")
  
  return `${year}-${month}-${day}`
}

/**
 * Formata um horário no formato HH:MM:SS considerando o timezone BR
 */
export function formatTimeBR(date: Date): string {
  const dateInBR = new Date(date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
  
  const hours = String(dateInBR.getHours()).padStart(2, "0")
  const minutes = String(dateInBR.getMinutes()).padStart(2, "0")
  const seconds = String(dateInBR.getSeconds()).padStart(2, "0")
  
  return `${hours}:${minutes}:${seconds}`
}

/**
 * Formata um horário no formato HH:MM considerando o timezone BR
 */
export function formatTimeShortBR(date: Date): string {
  const dateInBR = new Date(date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
  
  const hours = String(dateInBR.getHours()).padStart(2, "0")
  const minutes = String(dateInBR.getMinutes()).padStart(2, "0")
  
  return `${hours}:${minutes}`
}

/**
 * Combina uma data (YYYY-MM-DD) e hora (HH:MM ou HH:MM:SS) em um objeto Date
 * considerando o timezone de São Paulo
 */
export function parseDateTimeBR(dateStr: string, timeStr: string): Date {
  // Remove a parte do timezone se existir na data
  const cleanDate = dateStr.split("T")[0]
  
  // Garante que o horário tem segundos
  const timeParts = timeStr.split(":")
  const hours = timeParts[0]
  const minutes = timeParts[1]
  const seconds = timeParts[2] || "00"
  
  // Cria string no formato ISO mas interpreta como timezone BR
  const dateTimeStr = `${cleanDate}T${hours}:${minutes}:${seconds}`
  
  // Cria a data considerando o timezone BR
  // Precisamos fazer isso de forma que o Date seja criado no timezone correto
  const date = new Date(dateTimeStr)
  
  // Ajusta para o timezone BR
  const offsetBR = -3 * 60 // UTC-3 (São Paulo padrão)
  const offsetLocal = date.getTimezoneOffset()
  const diff = offsetBR - offsetLocal
  
  date.setMinutes(date.getMinutes() + diff)
  
  return date
}

/**
 * Verifica se uma data/hora está no passado (considerando timezone BR)
 */
export function isDateTimePast(dateStr: string, timeStr: string): boolean {
  const appointmentDateTime = parseDateTimeBR(dateStr, timeStr)
  const now = getCurrentDateTimeBR()
  
  return appointmentDateTime < now
}

/**
 * Verifica se uma data está no passado (apenas data, sem hora)
 */
export function isDatePast(dateStr: string): boolean {
  const today = formatDateBR(getCurrentDateTimeBR())
  return dateStr < today
}

/**
 * Retorna a data mínima permitida para agendamentos (hoje)
 */
export function getMinAppointmentDate(): string {
  return formatDateBR(getCurrentDateTimeBR())
}

/**
 * Formata uma data para exibição em português (ex: "15 de Janeiro de 2025")
 */
export function formatDateLongBR(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const dateInBR = new Date(dateObj.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
  
  return dateInBR.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  })
}

/**
 * Formata uma data para exibição curta em português (ex: "15/01/2025")
 */
export function formatDateShortBR(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const dateInBR = new Date(dateObj.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
  
  return dateInBR.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  })
}

