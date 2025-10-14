import { createClient } from "@/lib/supabase/client"
import { validateSession, getTokenFromStorage } from "./session"
import type { StaffUser } from "./staff-auth"
import type { Customer } from "./customer-auth"

export interface AuthContext {
  authenticated: boolean
  user: StaffUser | Customer | null
  userType: "staff" | "customer" | null
  storeId: string | null
}

/**
 * Middleware para validar autenticação
 *
 * Uso:
 * ```ts
 * const auth = await requireAuth()
 * if (!auth.authenticated) {
 *   router.push('/login')
 * }
 * ```
 */
export async function requireAuth(token?: string | null): Promise<AuthContext> {
  try {
    // 1. Obter token (do parâmetro ou do localStorage)
    const authToken = token ?? getTokenFromStorage()

    if (!authToken) {
      return {
        authenticated: false,
        user: null,
        userType: null,
        storeId: null,
      }
    }

    // 2. Validar session
    const session = await validateSession(authToken)

    if (!session) {
      return {
        authenticated: false,
        user: null,
        userType: null,
        storeId: null,
      }
    }

    // 3. Buscar dados completos do usuário
    const supabase = createClient()
    const table = session.userType === "staff" ? "barbers" : "customers"

    const { data: user, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", session.userId)
      .single()

    if (error || !user) {
      return {
        authenticated: false,
        user: null,
        userType: null,
        storeId: null,
      }
    }

    // 4. Se for staff, verificar se está ativo
    if (session.userType === "staff" && !user.is_active) {
      return {
        authenticated: false,
        user: null,
        userType: null,
        storeId: null,
      }
    }

    // 5. Remover password_hash se for staff
    if (session.userType === "staff") {
      const { password_hash, ...staffData } = user
      return {
        authenticated: true,
        user: staffData as StaffUser,
        userType: "staff",
        storeId: session.storeId,
      }
    }

    return {
      authenticated: true,
      user: user as Customer,
      userType: "customer",
      storeId: session.storeId,
    }
  } catch (error) {
    console.error("[requireAuth] Error:", error)
    return {
      authenticated: false,
      user: null,
      userType: null,
      storeId: null,
    }
  }
}

/**
 * Middleware para validar se usuário é staff (barber, attendant ou manager)
 */
export async function requireStaffAuth(token?: string | null): Promise<{
  authenticated: boolean
  staff: StaffUser | null
  storeId: string | null
}> {
  const auth = await requireAuth(token)

  if (!auth.authenticated || auth.userType !== "staff") {
    return {
      authenticated: false,
      staff: null,
      storeId: null,
    }
  }

  return {
    authenticated: true,
    staff: auth.user as StaffUser,
    storeId: auth.storeId,
  }
}

/**
 * Middleware para validar se usuário é manager
 */
export async function requireManagerAuth(token?: string | null): Promise<{
  authenticated: boolean
  manager: StaffUser | null
  storeId: string | null
}> {
  const auth = await requireStaffAuth(token)

  if (!auth.authenticated || !auth.staff) {
    return {
      authenticated: false,
      manager: null,
      storeId: null,
    }
  }

  if (auth.staff.role !== "manager") {
    return {
      authenticated: false,
      manager: null,
      storeId: null,
    }
  }

  return {
    authenticated: true,
    manager: auth.staff,
    storeId: auth.storeId,
  }
}

/**
 * Middleware para validar se usuário é customer
 */
export async function requireCustomerAuth(token?: string | null): Promise<{
  authenticated: boolean
  customer: Customer | null
  storeId: string | null
}> {
  const auth = await requireAuth(token)

  if (!auth.authenticated || auth.userType !== "customer") {
    return {
      authenticated: false,
      customer: null,
      storeId: null,
    }
  }

  return {
    authenticated: true,
    customer: auth.user as Customer,
    storeId: auth.storeId,
  }
}
