/**
 * Public data fetching functions
 * Used for fetching data that doesn't require authentication
 */

import { createClient } from "./supabase/client"

export interface PublicStore {
  id: string
  name: string
  slug: string
  address: string | null
  phone: string | null
  email: string | null
  created_at: string
}

export interface PublicService {
  id: string
  name: string
  description: string | null
  duration: number
  price: number
  category: string
  is_active: boolean
}

export interface PublicBarber {
  id: string
  name: string
  avatar_url: string | null
  is_active: boolean
}

/**
 * Fetches all active stores
 */
export async function getPublicStores(): Promise<{ success: boolean; stores: PublicStore[]; error?: string }> {
  const supabase = createClient()

  try {
    const { data: stores, error } = await supabase
      .from("stores")
      .select("id, name, slug, address, phone, email, created_at")
      .order("name")

    if (error) throw error

    return { success: true, stores: stores || [] }
  } catch (error) {
    console.error("[getPublicStores] Error:", error)
    return { success: false, stores: [], error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Fetches all active services for a store
 */
export async function getPublicServices(
  storeId?: string,
  limit?: number,
): Promise<{ success: boolean; services: PublicService[]; error?: string }> {
  const supabase = createClient()

  try {
    let query = supabase
      .from("services")
      .select("id, name, description, duration, price, category, is_active")
      .eq("is_active", true)
      .order("category")
      .order("price")

    if (storeId) {
      query = query.eq("store_id", storeId)
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data: services, error } = await query

    if (error) throw error

    return { success: true, services: services || [] }
  } catch (error) {
    console.error("[getPublicServices] Error:", error)
    return { success: false, services: [], error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Fetches all active barbers for a store
 */
export async function getPublicBarbers(
  storeId?: string,
): Promise<{ success: boolean; barbers: PublicBarber[]; error?: string }> {
  const supabase = createClient()

  try {
    let query = supabase
      .from("barbers")
      .select("id, name, avatar_url, is_active")
      .eq("is_active", true)
      .order("name")

    if (storeId) {
      query = query.eq("store_id", storeId)
    }

    const { data: barbers, error } = await query

    if (error) throw error

    return { success: true, barbers: barbers || [] }
  } catch (error) {
    console.error("[getPublicBarbers] Error:", error)
    return { success: false, barbers: [], error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Fetches a single store by slug
 */
export async function getPublicStoreBySlug(
  slug: string,
): Promise<{ success: boolean; store: PublicStore | null; error?: string }> {
  const supabase = createClient()

  try {
    const { data: store, error } = await supabase
      .from("stores")
      .select("id, name, slug, address, phone, email, created_at")
      .eq("slug", slug)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return { success: true, store: null }
      }
      throw error
    }

    return { success: true, store }
  } catch (error) {
    console.error("[getPublicStoreBySlug] Error:", error)
    return { success: false, store: null, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
