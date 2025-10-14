import { createClient } from "./supabase/client"
import type { StaffUser, UserRole, ApiResponse } from "@/types/manager"

/**
 * Gets all staff users for a store
 */
export async function getStoreUsers(storeId: string): Promise<ApiResponse<StaffUser[]>> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("barbers")
      .select("*")
      .eq("store_id", storeId)
      .order("name")

    if (error) throw error

    return { success: true, data: data as StaffUser[] }
  } catch (error) {
    console.error("[getStoreUsers] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Updates user role
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<ApiResponse<void>> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("barbers")
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[updateUserRole] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Toggles user active status
 */
export async function toggleUserStatus(userId: string, isActive: boolean): Promise<ApiResponse<void>> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("barbers")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[toggleUserStatus] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Invites a new staff member
 * Note: This creates a barber record with a generated UUID.
 * User can register later using this email to link with auth.users
 */
export async function inviteStaffUser(
  storeId: string,
  userData: {
    name: string
    email: string
    phone?: string
    role: UserRole
  }
): Promise<ApiResponse<string>> {
  const supabase = createClient()

  try {
    // Check if email already exists
    const { data: existing } = await supabase
      .from("barbers")
      .select("id")
      .eq("store_id", storeId)
      .eq("email", userData.email)
      .single()

    if (existing) {
      return { success: false, error: "Este email já está cadastrado" }
    }

    // Create barber record (UUID generated automatically by database)
    const { data, error } = await supabase
      .from("barbers")
      .insert({
        store_id: storeId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || null,
        role: userData.role,
        is_active: true,
        specialties: [],
      })
      .select("id")
      .single()

    if (error) throw error

    return { success: true, data: data.id }
  } catch (error) {
    console.error("[inviteStaffUser] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
