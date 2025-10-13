import { createClient } from "./supabase/client"

export interface LoyaltyProgram {
  id: string
  store_id: string
  name: string
  description: string | null
  points_per_real: number
  points_expiry_days: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LoyaltyTransaction {
  id: string
  customer_id: string
  loyalty_program_id: string
  appointment_id: string | null
  points: number
  transaction_type: "earn" | "redeem" | "expire"
  description: string | null
  created_at: string
}

export interface CustomerLoyalty {
  total_points: number
  lifetime_points: number
  tier: string | null
  transactions: LoyaltyTransaction[]
}

/**
 * Gets the loyalty program for a store
 */
export async function getLoyaltyProgram(
  storeId: string,
): Promise<{ success: boolean; program?: LoyaltyProgram; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("loyalty_programs")
      .select("*")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .single()

    if (error) {
      // If no program exists, return success with no program
      if (error.code === "PGRST116") {
        return { success: true, program: undefined }
      }
      throw error
    }

    return { success: true, program: data as LoyaltyProgram }
  } catch (error) {
    console.error("[getLoyaltyProgram] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Creates or updates a loyalty program
 */
export async function upsertLoyaltyProgram(
  storeId: string,
  program: {
    name: string
    description?: string
    points_per_real: number
    points_expiry_days?: number
  },
): Promise<{ success: boolean; programId?: string; error?: string }> {
  const supabase = createClient()

  try {
    // Check if program already exists
    const { data: existing } = await supabase
      .from("loyalty_programs")
      .select("id")
      .eq("store_id", storeId)
      .single()

    if (existing) {
      // Update existing program
      const { error } = await supabase
        .from("loyalty_programs")
        .update({
          name: program.name,
          description: program.description || null,
          points_per_real: program.points_per_real,
          points_expiry_days: program.points_expiry_days || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)

      if (error) throw error

      return { success: true, programId: existing.id }
    } else {
      // Create new program
      const { data, error } = await supabase
        .from("loyalty_programs")
        .insert({
          store_id: storeId,
          name: program.name,
          description: program.description || null,
          points_per_real: program.points_per_real,
          points_expiry_days: program.points_expiry_days || null,
          is_active: true,
        })
        .select("id")
        .single()

      if (error) throw error

      return { success: true, programId: data.id }
    }
  } catch (error) {
    console.error("[upsertLoyaltyProgram] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Toggles loyalty program active status
 */
export async function toggleLoyaltyProgram(
  programId: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("loyalty_programs")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", programId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[toggleLoyaltyProgram] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Gets customer loyalty points and history
 */
export async function getCustomerLoyalty(
  customerId: string,
  storeId: string,
): Promise<{ success: boolean; loyalty?: CustomerLoyalty; error?: string }> {
  const supabase = createClient()

  try {
    // Get loyalty program
    const { data: program } = await supabase
      .from("loyalty_programs")
      .select("id")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .single()

    if (!program) {
      return { success: true, loyalty: { total_points: 0, lifetime_points: 0, tier: null, transactions: [] } }
    }

    // Get transactions
    const { data: transactions, error: txError } = await supabase
      .from("loyalty_transactions")
      .select("*")
      .eq("customer_id", customerId)
      .eq("loyalty_program_id", program.id)
      .order("created_at", { ascending: false })

    if (txError) throw txError

    // Calculate total points
    const totalPoints = transactions?.reduce((sum, tx) => {
      if (tx.transaction_type === "earn") return sum + tx.points
      if (tx.transaction_type === "redeem") return sum - tx.points
      return sum
    }, 0) || 0

    // Calculate lifetime points (only earned)
    const lifetimePoints = transactions?.reduce((sum, tx) => {
      if (tx.transaction_type === "earn") return sum + tx.points
      return sum
    }, 0) || 0

    // Determine tier (simple tier system based on lifetime points)
    let tier: string | null = null
    if (lifetimePoints >= 1000) tier = "Diamante"
    else if (lifetimePoints >= 500) tier = "Ouro"
    else if (lifetimePoints >= 200) tier = "Prata"
    else if (lifetimePoints > 0) tier = "Bronze"

    return {
      success: true,
      loyalty: {
        total_points: Math.max(0, totalPoints),
        lifetime_points: lifetimePoints,
        tier,
        transactions: (transactions || []) as LoyaltyTransaction[],
      },
    }
  } catch (error) {
    console.error("[getCustomerLoyalty] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Adds loyalty points for a customer
 */
export async function addLoyaltyPoints(
  customerId: string,
  storeId: string,
  points: number,
  appointmentId?: string,
  description?: string,
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  const supabase = createClient()

  try {
    // Get loyalty program
    const { data: program } = await supabase
      .from("loyalty_programs")
      .select("id")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .single()

    if (!program) {
      return { success: false, error: "Programa de fidelidade não encontrado" }
    }

    // Create transaction
    const { data, error } = await supabase
      .from("loyalty_transactions")
      .insert({
        customer_id: customerId,
        loyalty_program_id: program.id,
        appointment_id: appointmentId || null,
        points,
        transaction_type: "earn",
        description: description || "Pontos ganhos",
      })
      .select("id")
      .single()

    if (error) throw error

    return { success: true, transactionId: data.id }
  } catch (error) {
    console.error("[addLoyaltyPoints] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Redeems loyalty points for a customer
 */
export async function redeemLoyaltyPoints(
  customerId: string,
  storeId: string,
  points: number,
  description?: string,
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  const supabase = createClient()

  try {
    // Get loyalty program
    const { data: program } = await supabase
      .from("loyalty_programs")
      .select("id")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .single()

    if (!program) {
      return { success: false, error: "Programa de fidelidade não encontrado" }
    }

    // Check if customer has enough points
    const loyaltyResult = await getCustomerLoyalty(customerId, storeId)
    if (!loyaltyResult.success || !loyaltyResult.loyalty) {
      return { success: false, error: "Erro ao verificar pontos do cliente" }
    }

    if (loyaltyResult.loyalty.total_points < points) {
      return { success: false, error: "Pontos insuficientes" }
    }

    // Create transaction
    const { data, error } = await supabase
      .from("loyalty_transactions")
      .insert({
        customer_id: customerId,
        loyalty_program_id: program.id,
        points,
        transaction_type: "redeem",
        description: description || "Pontos resgatados",
      })
      .select("id")
      .single()

    if (error) throw error

    return { success: true, transactionId: data.id }
  } catch (error) {
    console.error("[redeemLoyaltyPoints] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Gets loyalty statistics for the manager
 */
export async function getLoyaltyStats(
  storeId: string,
): Promise<{
  success: boolean
  stats?: {
    totalCustomers: number
    activeCustomers: number
    totalPointsIssued: number
    totalPointsRedeemed: number
    averagePointsPerCustomer: number
  }
  error?: string
}> {
  const supabase = createClient()

  try {
    // Get loyalty program
    const { data: program } = await supabase
      .from("loyalty_programs")
      .select("id")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .single()

    if (!program) {
      return {
        success: true,
        stats: {
          totalCustomers: 0,
          activeCustomers: 0,
          totalPointsIssued: 0,
          totalPointsRedeemed: 0,
          averagePointsPerCustomer: 0,
        },
      }
    }

    // Get all transactions
    const { data: transactions, error } = await supabase
      .from("loyalty_transactions")
      .select("customer_id, points, transaction_type")
      .eq("loyalty_program_id", program.id)

    if (error) throw error

    // Calculate stats
    const uniqueCustomers = new Set(transactions?.map((t) => t.customer_id) || []).size
    const totalPointsIssued = transactions?.reduce((sum, t) => {
      return t.transaction_type === "earn" ? sum + t.points : sum
    }, 0) || 0
    const totalPointsRedeemed = transactions?.reduce((sum, t) => {
      return t.transaction_type === "redeem" ? sum + t.points : sum
    }, 0) || 0

    // Count active customers (customers with transactions in last 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: recentTx } = await supabase
      .from("loyalty_transactions")
      .select("customer_id")
      .eq("loyalty_program_id", program.id)
      .gte("created_at", ninetyDaysAgo.toISOString())

    const activeCustomers = new Set(recentTx?.map((t) => t.customer_id) || []).size

    return {
      success: true,
      stats: {
        totalCustomers: uniqueCustomers,
        activeCustomers,
        totalPointsIssued,
        totalPointsRedeemed,
        averagePointsPerCustomer: uniqueCustomers > 0 ? totalPointsIssued / uniqueCustomers : 0,
      },
    }
  } catch (error) {
    console.error("[getLoyaltyStats] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
