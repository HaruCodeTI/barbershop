import { createClient } from "@/lib/supabase/client"
import { createSession, saveTokenToStorage } from "./session"
import bcrypt from "bcryptjs"

export interface StaffUser {
  id: string
  store_id: string
  name: string
  email: string
  phone: string | null
  role: "barber" | "attendant" | "manager"
  avatar_url: string | null
  is_active: boolean
  rating: number
  total_reviews: number
  specialties: string[]
}

export interface SignInResult {
  success: boolean
  token?: string
  staff?: StaffUser
  error?: string
}

export interface SignUpResult {
  success: boolean
  staff?: StaffUser
  error?: string
}

/**
 * Faz login de staff member com email e senha
 */
export async function staffSignIn(email: string, password: string): Promise<SignInResult> {
  try {
    const supabase = createClient()

    // 1. Buscar staff por email
    const { data: staff, error: staffError } = await supabase
      .from("barbers")
      .select("*")
      .eq("email", email)
      .single()

    if (staffError || !staff) {
      return {
        success: false,
        error: "Email ou senha incorretos",
      }
    }

    // 2. Verificar se está ativo
    if (!staff.is_active) {
      return {
        success: false,
        error: "Sua conta está inativa. Entre em contato com o gerente.",
      }
    }

    // 3. Verificar se tem senha cadastrada
    if (!staff.password_hash) {
      return {
        success: false,
        error: "Senha não cadastrada. Entre em contato com o gerente para criar sua senha.",
      }
    }

    // 4. Validar senha com bcrypt
    const passwordMatch = await bcrypt.compare(password, staff.password_hash)

    if (!passwordMatch) {
      return {
        success: false,
        error: "Email ou senha incorretos",
      }
    }

    // 5. Criar session
    const sessionResult = await createSession(staff.id, "staff", staff.store_id)

    if (!sessionResult.success || !sessionResult.token) {
      return {
        success: false,
        error: sessionResult.error || "Erro ao criar sessão",
      }
    }

    // 6. Salvar token no storage
    saveTokenToStorage(sessionResult.token)

    // 7. Remover password_hash antes de retornar
    const { password_hash, ...staffData } = staff

    return {
      success: true,
      token: sessionResult.token,
      staff: staffData as StaffUser,
    }
  } catch (error) {
    console.error("[staffSignIn] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao fazer login",
    }
  }
}

/**
 * Cria um novo staff member (usado pelo manager)
 */
export async function staffSignUp(data: {
  email: string
  password: string
  name: string
  role: "barber" | "attendant" | "manager"
  store_id: string
  phone?: string
}): Promise<SignUpResult> {
  try {
    const supabase = createClient()

    // 1. Verificar se email já existe
    const { data: existing } = await supabase
      .from("barbers")
      .select("id")
      .eq("email", data.email)
      .single()

    if (existing) {
      return {
        success: false,
        error: "Este email já está cadastrado",
      }
    }

    // 2. Hash da senha com bcrypt (custo 10)
    const password_hash = await bcrypt.hash(data.password, 10)

    // 3. Criar staff (UUID gerado automaticamente pelo banco)
    const { data: staff, error } = await supabase
      .from("barbers")
      .insert({
        email: data.email,
        password_hash,
        name: data.name,
        role: data.role,
        store_id: data.store_id,
        phone: data.phone || null,
        is_active: true,
        specialties: [],
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Remover password_hash antes de retornar
    const { password_hash: _, ...staffData } = staff

    return {
      success: true,
      staff: staffData as StaffUser,
    }
  } catch (error) {
    console.error("[staffSignUp] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar conta",
    }
  }
}

/**
 * Atualiza a senha de um staff member
 */
export async function updateStaffPassword(
  staffId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // 1. Buscar staff e verificar senha atual
    const { data: staff, error: staffError } = await supabase
      .from("barbers")
      .select("password_hash")
      .eq("id", staffId)
      .single()

    if (staffError || !staff) {
      return {
        success: false,
        error: "Staff não encontrado",
      }
    }

    // 2. Verificar senha atual
    const passwordMatch = await bcrypt.compare(currentPassword, staff.password_hash)

    if (!passwordMatch) {
      return {
        success: false,
        error: "Senha atual incorreta",
      }
    }

    // 3. Hash da nova senha
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // 4. Atualizar no banco
    const { error: updateError } = await supabase
      .from("barbers")
      .update({ password_hash: newPasswordHash })
      .eq("id", staffId)

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      }
    }

    return { success: true }
  } catch (error) {
    console.error("[updateStaffPassword] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao atualizar senha",
    }
  }
}

/**
 * Define a senha inicial de um staff (usado quando staff é criado sem senha)
 */
export async function setStaffPassword(
  staffId: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // Hash da senha
    const password_hash = await bcrypt.hash(password, 10)

    // Atualizar no banco
    const { error } = await supabase
      .from("barbers")
      .update({ password_hash })
      .eq("id", staffId)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return { success: true }
  } catch (error) {
    console.error("[setStaffPassword] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao definir senha",
    }
  }
}
