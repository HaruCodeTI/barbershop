import { createClient } from "./supabase/client"

export interface Coupon {
  id: string
  code: string
  description: string
  discount_type: "percentage" | "fixed"
  discount_value: number
  min_purchase: number
  max_uses: number
  current_uses: number
  valid_from: string
  valid_until: string
  is_active: boolean
  store_id: string
  created_at: string
  updated_at: string
}

/**
 * Gets all coupons for a store
 */
export async function getCoupons(
  storeId: string,
): Promise<{ success: boolean; coupons?: Coupon[]; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, coupons: data as Coupon[] }
  } catch (error) {
    console.error("[getCoupons] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Creates a new coupon
 */
export async function createCoupon(
  storeId: string,
  coupon: {
    code: string
    description: string
    discount_type: "percentage" | "fixed"
    discount_value: number
    min_purchase: number
    valid_from: string
    valid_until: string
    max_uses: number
  },
): Promise<{ success: boolean; couponId?: string; error?: string }> {
  const supabase = createClient()

  try {
    // Check if code already exists
    const { data: existing } = await supabase
      .from("coupons")
      .select("id")
      .eq("store_id", storeId)
      .eq("code", coupon.code.toUpperCase())
      .single()

    if (existing) {
      return { success: false, error: "Código de cupom já existe" }
    }

    const { data, error } = await supabase
      .from("coupons")
      .insert({
        store_id: storeId,
        code: coupon.code.toUpperCase(),
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_purchase: coupon.min_purchase,
        valid_from: coupon.valid_from,
        valid_until: coupon.valid_until,
        max_uses: coupon.max_uses,
        current_uses: 0,
        is_active: true,
      })
      .select("id")
      .single()

    if (error) throw error

    return { success: true, couponId: data.id }
  } catch (error) {
    console.error("[createCoupon] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Updates a coupon
 */
export async function updateCoupon(
  couponId: string,
  updates: {
    code?: string
    description?: string
    discount_type?: "percentage" | "fixed"
    discount_value?: number
    min_purchase?: number
    valid_from?: string
    valid_until?: string
    max_uses?: number
  },
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    // If updating code, check if new code already exists
    if (updates.code) {
      const { data: existing } = await supabase
        .from("coupons")
        .select("id, store_id")
        .eq("code", updates.code.toUpperCase())
        .neq("id", couponId)
        .single()

      if (existing) {
        return { success: false, error: "Código de cupom já existe" }
      }

      updates.code = updates.code.toUpperCase()
    }

    const { error } = await supabase
      .from("coupons")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", couponId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[updateCoupon] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Toggles coupon active status
 */
export async function toggleCouponStatus(
  couponId: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("coupons")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", couponId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[toggleCouponStatus] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Deletes a coupon
 */
export async function deleteCoupon(couponId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    // Check if coupon has been used
    const { data: coupon } = await supabase.from("coupons").select("current_uses").eq("id", couponId).single()

    if (coupon && coupon.current_uses > 0) {
      return { success: false, error: "Não é possível excluir um cupom que já foi usado" }
    }

    const { error } = await supabase.from("coupons").delete().eq("id", couponId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[deleteCoupon] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Validates a coupon for use
 */
export async function validateCoupon(
  code: string,
  storeId: string,
  purchaseAmount: number,
): Promise<{
  success: boolean
  coupon?: Coupon
  discountAmount?: number
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("store_id", storeId)
      .eq("is_active", true)
      .single()

    if (error || !coupon) {
      return { success: false, error: "Cupom não encontrado ou inválido" }
    }

    const now = new Date()
    const validFrom = new Date(coupon.valid_from)
    const validUntil = new Date(coupon.valid_until)

    if (now < validFrom) {
      return { success: false, error: "Cupom ainda não está válido" }
    }

    if (now > validUntil) {
      return { success: false, error: "Cupom expirado" }
    }

    if (coupon.current_uses >= coupon.max_uses) {
      return { success: false, error: "Limite de uso do cupom atingido" }
    }

    if (purchaseAmount < coupon.min_purchase) {
      return {
        success: false,
        error: `Valor mínimo de compra: R$ ${coupon.min_purchase.toFixed(2)}`,
      }
    }

    // Calculate discount
    let discountAmount = 0
    if (coupon.discount_type === "percentage") {
      discountAmount = (purchaseAmount * coupon.discount_value) / 100
    } else {
      discountAmount = coupon.discount_value
    }

    return {
      success: true,
      coupon: coupon as Coupon,
      discountAmount: Math.min(discountAmount, purchaseAmount),
    }
  } catch (error) {
    console.error("[validateCoupon] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Increments the usage count of a coupon
 */
export async function useCoupon(couponId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase.rpc("increment_coupon_usage", {
      coupon_id: couponId,
    })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[useCoupon] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
