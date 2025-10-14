import { createClient } from "@/lib/supabase/client"
import { createSession, saveTokenToStorage } from "./session"

export interface Customer {
  id: string
  store_id: string
  name: string
  email: string | null
  phone: string
  loyalty_points: number
  created_at: string
  updated_at: string
}

export interface CustomerSignInResult {
  success: boolean
  token?: string
  customer?: Customer
  isNewCustomer?: boolean
  error?: string
}

export interface UpdateProfileResult {
  success: boolean
  error?: string
}

/**
 * Login de customer com telefone (ou cadastro se não existir)
 *
 * Fluxo:
 * 1. Busca customer por telefone + store_id
 * 2. Se não existe, cria novo customer com dados mínimos
 * 3. Cria session e retorna token
 *
 * @param phone - Telefone do customer (com DDD)
 * @param storeId - ID da loja
 * @param additionalData - Dados opcionais (nome, email) para novos customers
 */
export async function customerSignInOrRegister(
  phone: string,
  storeId: string,
  additionalData?: { name?: string; email?: string }
): Promise<CustomerSignInResult> {
  try {
    const supabase = createClient()

    // Normalizar telefone (remover caracteres especiais)
    const normalizedPhone = phone.replace(/\D/g, "")

    // 1. Buscar customer por telefone + store
    let { data: customer, error: findError } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", normalizedPhone)
      .eq("store_id", storeId)
      .maybeSingle()

    // Se erro diferente de "não encontrado", retornar erro
    if (findError && findError.code !== "PGRST116") {
      throw findError
    }

    let isNewCustomer = false

    // 2. Se não existe, criar novo customer
    if (!customer) {
      const { data: newCustomer, error: createError } = await supabase
        .from("customers")
        .insert({
          phone: normalizedPhone,
          store_id: storeId,
          name: additionalData?.name || "Cliente",
          email: additionalData?.email || null,
          loyalty_points: 0,
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      customer = newCustomer
      isNewCustomer = true
    }

    // 3. Criar session
    const sessionResult = await createSession(customer.id, "customer", storeId)

    if (!sessionResult.success || !sessionResult.token) {
      return {
        success: false,
        error: sessionResult.error || "Erro ao criar sessão",
      }
    }

    // 4. Salvar token no storage
    saveTokenToStorage(sessionResult.token)

    return {
      success: true,
      token: sessionResult.token,
      customer: customer as Customer,
      isNewCustomer,
    }
  } catch (error) {
    console.error("[customerSignInOrRegister] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao fazer login/cadastro",
    }
  }
}

/**
 * Atualiza o perfil do customer (nome e/ou email)
 */
export async function updateCustomerProfile(
  customerId: string,
  data: { name?: string; email?: string }
): Promise<UpdateProfileResult> {
  try {
    const supabase = createClient()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (data.name) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email

    const { error } = await supabase
      .from("customers")
      .update(updateData)
      .eq("id", customerId)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("[updateCustomerProfile] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao atualizar perfil",
    }
  }
}

/**
 * Busca customer por ID
 */
export async function getCustomerById(
  customerId: string
): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  try {
    const supabase = createClient()

    const { data: customer, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single()

    if (error) {
      throw error
    }

    return {
      success: true,
      customer: customer as Customer,
    }
  } catch (error) {
    console.error("[getCustomerById] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao buscar customer",
    }
  }
}

/**
 * Busca customer por telefone + store_id
 */
export async function getCustomerByPhone(
  phone: string,
  storeId: string
): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  try {
    const supabase = createClient()

    // Normalizar telefone
    const normalizedPhone = phone.replace(/\D/g, "")

    const { data: customer, error } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", normalizedPhone)
      .eq("store_id", storeId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    if (!customer) {
      return {
        success: true,
        customer: undefined,
      }
    }

    return {
      success: true,
      customer: customer as Customer,
    }
  } catch (error) {
    console.error("[getCustomerByPhone] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao buscar customer",
    }
  }
}
