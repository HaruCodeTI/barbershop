import { createClient } from "./supabase/client"
import type { StoreSettings, StoreHours, ApiResponse } from "@/types/manager"

/**
 * Gets store settings
 */
export async function getStoreSettings(storeId: string): Promise<ApiResponse<StoreSettings>> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("stores").select("*").eq("id", storeId).single()

    if (error) throw error

    return { success: true, data: data as StoreSettings }
  } catch (error) {
    console.error("[getStoreSettings] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Updates store information
 */
export async function updateStoreInfo(
  storeId: string,
  updates: {
    name?: string
    address?: string
    phone?: string
    email?: string
  }
): Promise<ApiResponse<void>> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("stores")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[updateStoreInfo] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Gets store operating hours
 */
export async function getStoreHours(storeId: string): Promise<ApiResponse<StoreHours[]>> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("store_hours")
      .select("*")
      .eq("store_id", storeId)
      .order("day_of_week")

    if (error) throw error

    // If no hours exist, return default hours (closed)
    if (!data || data.length === 0) {
      const defaultHours: StoreHours[] = Array.from({ length: 7 }, (_, i) => ({
        store_id: storeId,
        day_of_week: i,
        is_open: false,
        open_time: "09:00",
        close_time: "18:00",
      }))
      return { success: true, data: defaultHours }
    }

    return { success: true, data: data as StoreHours[] }
  } catch (error) {
    console.error("[getStoreHours] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Updates store operating hours
 */
export async function updateStoreHours(
  storeId: string,
  hours: StoreHours[]
): Promise<ApiResponse<void>> {
  const supabase = createClient()

  try {
    // Validate hours: open_time must be before close_time for open days
    for (const h of hours) {
      if (h.is_open) {
        const openTime = h.open_time
        const closeTime = h.close_time

        if (openTime >= closeTime) {
          return {
            success: false,
            error: "Horário de fechamento deve ser após horário de abertura"
          }
        }
      }
    }

    // Delete existing hours for this store
    const { error: deleteError } = await supabase.from("store_hours").delete().eq("store_id", storeId)

    if (deleteError) throw deleteError

    // Insert new hours
    const hoursToInsert = hours.map((h) => ({
      store_id: storeId,
      day_of_week: h.day_of_week,
      is_open: h.is_open,
      open_time: h.open_time,
      close_time: h.close_time,
      break_start: h.break_start || null,
      break_end: h.break_end || null,
    }))

    const { error: insertError } = await supabase.from("store_hours").insert(hoursToInsert)

    if (insertError) throw insertError

    return { success: true }
  } catch (error) {
    console.error("[updateStoreHours] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
