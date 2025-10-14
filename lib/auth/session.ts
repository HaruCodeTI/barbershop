import { createClient } from "@/lib/supabase/client"
import { nanoid } from "nanoid"

export interface Session {
  id: string
  user_id: string
  user_type: "staff" | "customer"
  store_id: string
  token: string
  expires_at: string
  created_at: string
  updated_at: string
}

export interface SessionUser {
  userId: string
  userType: "staff" | "customer"
  storeId: string
}

const TOKEN_STORAGE_KEY = "auth_token"

/**
 * Gera um token seguro para a session
 */
function generateSecureToken(): string {
  // Gera um token único de 32 caracteres
  return nanoid(32)
}

/**
 * Cria uma nova session no banco de dados
 */
export async function createSession(
  userId: string,
  userType: "staff" | "customer",
  storeId: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const supabase = createClient()
    const token = generateSecureToken()

    // Expira em 7 dias
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        user_id: userId,
        user_type: userType,
        store_id: storeId,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, token }
  } catch (error) {
    console.error("[createSession] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar session",
    }
  }
}

/**
 * Valida um token e retorna os dados da session
 */
export async function validateSession(token: string): Promise<SessionUser | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("sessions")
      .select("user_id, user_type, store_id, expires_at")
      .eq("token", token)
      .single()

    if (error || !data) return null

    // Verifica se a session expirou
    const expiresAt = new Date(data.expires_at)
    if (expiresAt < new Date()) {
      // Session expirada - deletar
      await deleteSession(token)
      return null
    }

    return {
      userId: data.user_id,
      userType: data.user_type as "staff" | "customer",
      storeId: data.store_id,
    }
  } catch (error) {
    console.error("[validateSession] Error:", error)
    return null
  }
}

/**
 * Deleta uma session (logout)
 */
export async function deleteSession(token: string): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.from("sessions").delete().eq("token", token)
  } catch (error) {
    console.error("[deleteSession] Error:", error)
  }
}

/**
 * Deleta todas as sessions de um usuário (logout de todos os dispositivos)
 */
export async function deleteAllUserSessions(userId: string, userType: "staff" | "customer"): Promise<void> {
  try {
    const supabase = createClient()
    await supabase
      .from("sessions")
      .delete()
      .eq("user_id", userId)
      .eq("user_type", userType)
  } catch (error) {
    console.error("[deleteAllUserSessions] Error:", error)
  }
}

/**
 * Salva o token no localStorage
 */
export function saveTokenToStorage(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  }
}

/**
 * Obtém o token do localStorage
 */
export function getTokenFromStorage(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  }
  return null
}

/**
 * Remove o token do localStorage
 */
export function removeTokenFromStorage(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

/**
 * Limpa sessions expiradas (pode ser executado periodicamente)
 */
export async function cleanExpiredSessions(): Promise<void> {
  try {
    const supabase = createClient()
    const { error } = await supabase.rpc("clean_expired_sessions")

    if (error) throw error
  } catch (error) {
    console.error("[cleanExpiredSessions] Error:", error)
  }
}
