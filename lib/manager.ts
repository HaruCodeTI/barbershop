import { createClient } from "./supabase/client"

export interface DashboardStats {
  totalRevenue: number
  totalAppointments: number
  completedAppointments: number
  completionRate: number
  activeBarbers: number
  revenueGrowth: number
  appointmentsGrowth: number
}

export interface Barber {
  id: string
  name: string
  email: string
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  rating: number
  total_reviews: number
  specialties: string[]
}

export interface Service {
  id: string
  name: string
  description: string | null
  duration: number
  price: number
  category: string
  is_active: boolean
}

/**
 * Gets dashboard statistics for the manager
 */
export async function getDashboardStats(
  storeId: string,
  startDate?: string,
  endDate?: string,
): Promise<{ success: boolean; stats?: DashboardStats; error?: string }> {
  const supabase = createClient()

  try {
    // Default to current month if no dates provided
    if (!startDate) {
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    }
    if (!endDate) {
      endDate = new Date().toISOString().split("T")[0]
    }

    // Get appointments for the period
    const { data: appointments, error: apptError } = await supabase
      .from("appointments")
      .select("id, final_price, status")
      .eq("store_id", storeId)
      .gte("appointment_date", startDate)
      .lte("appointment_date", endDate)

    if (apptError) throw apptError

    // Calculate current period stats
    const totalAppointments = appointments?.length || 0
    const completedAppointments = appointments?.filter((a) => a.status === "completed").length || 0
    const totalRevenue = appointments?.reduce((sum, a) => sum + (a.status === "completed" ? Number(a.final_price) : 0), 0) || 0
    const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0

    // Get active barbers count
    const { data: barbers, error: barbersError } = await supabase
      .from("barbers")
      .select("id")
      .eq("store_id", storeId)
      .eq("is_active", true)

    if (barbersError) throw barbersError

    const activeBarbers = barbers?.length || 0

    // Calculate previous period for growth comparison
    const periodLength = new Date(endDate).getTime() - new Date(startDate).getTime()
    const previousStart = new Date(new Date(startDate).getTime() - periodLength).toISOString().split("T")[0]
    const previousEnd = new Date(new Date(endDate).getTime() - periodLength).toISOString().split("T")[0]

    const { data: previousAppointments } = await supabase
      .from("appointments")
      .select("id, final_price, status")
      .eq("store_id", storeId)
      .gte("appointment_date", previousStart)
      .lte("appointment_date", previousEnd)

    const previousRevenue = previousAppointments?.reduce((sum, a) => sum + (a.status === "completed" ? Number(a.final_price) : 0), 0) || 0
    const previousTotal = previousAppointments?.length || 0

    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const appointmentsGrowth = previousTotal > 0 ? ((totalAppointments - previousTotal) / previousTotal) * 100 : 0

    return {
      success: true,
      stats: {
        totalRevenue,
        totalAppointments,
        completedAppointments,
        completionRate,
        activeBarbers,
        revenueGrowth,
        appointmentsGrowth,
      },
    }
  } catch (error) {
    console.error("[getDashboardStats] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Gets all barbers for a store
 */
export async function getBarbers(
  storeId: string,
): Promise<{ success: boolean; barbers?: Barber[]; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("barbers")
      .select("*")
      .eq("store_id", storeId)
      .order("name")

    if (error) throw error

    return { success: true, barbers: data as Barber[] }
  } catch (error) {
    console.error("[getBarbers] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Gets all services for a store
 */
export async function getServices(
  storeId: string,
): Promise<{ success: boolean; services?: Service[]; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("store_id", storeId)
      .order("name")

    if (error) throw error

    return { success: true, services: data as Service[] }
  } catch (error) {
    console.error("[getServices] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Creates a new service
 */
export async function createService(
  storeId: string,
  service: {
    name: string
    description?: string
    duration: number
    price: number
    category: string
  },
): Promise<{ success: boolean; serviceId?: string; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("services")
      .insert({
        store_id: storeId,
        name: service.name,
        description: service.description || null,
        duration: service.duration,
        price: service.price,
        category: service.category,
        is_active: true,
      })
      .select("id")
      .single()

    if (error) throw error

    return { success: true, serviceId: data.id }
  } catch (error) {
    console.error("[createService] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Updates a service
 */
export async function updateService(
  serviceId: string,
  updates: {
    name?: string
    description?: string
    duration?: number
    price?: number
    category?: string
  },
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("services")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", serviceId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[updateService] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Toggles service active status
 */
export async function toggleServiceStatus(
  serviceId: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("services")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", serviceId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[toggleServiceStatus] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Deletes a service
 */
export async function deleteService(serviceId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    // Check if service is used in any appointments
    const { data: appointments, error: checkError } = await supabase
      .from("appointment_services")
      .select("id")
      .eq("service_id", serviceId)
      .limit(1)

    if (checkError) throw checkError

    if (appointments && appointments.length > 0) {
      return { success: false, error: "Não é possível excluir um serviço que já foi usado em agendamentos" }
    }

    const { error } = await supabase.from("services").delete().eq("id", serviceId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[deleteService] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Creates a new barber
 */
export async function createBarber(
  storeId: string,
  barber: {
    name: string
    email: string
    phone?: string
    avatar_url?: string
    specialties?: string[]
  },
): Promise<{ success: boolean; barberId?: string; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("barbers")
      .insert({
        store_id: storeId,
        name: barber.name,
        email: barber.email,
        phone: barber.phone || null,
        role: "barber",
        avatar_url: barber.avatar_url || null,
        specialties: barber.specialties || [],
        is_active: true,
        rating: 5.0,
        total_reviews: 0,
      })
      .select("id")
      .single()

    if (error) throw error

    return { success: true, barberId: data.id }
  } catch (error) {
    console.error("[createBarber] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Updates a barber
 */
export async function updateBarber(
  barberId: string,
  updates: {
    name?: string
    email?: string
    phone?: string
    avatar_url?: string
    specialties?: string[]
  },
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("barbers")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", barberId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[updateBarber] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Deletes a barber
 */
export async function deleteBarber(barberId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    // Check if barber has any appointments
    const { data: appointments, error: checkError } = await supabase
      .from("appointments")
      .select("id")
      .eq("barber_id", barberId)
      .limit(1)

    if (checkError) throw checkError

    if (appointments && appointments.length > 0) {
      return { success: false, error: "Não é possível excluir um barbeiro que possui agendamentos" }
    }

    const { error } = await supabase.from("barbers").delete().eq("id", barberId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[deleteBarber] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Toggles barber active status
 */
export async function toggleBarberStatus(
  barberId: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("barbers")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", barberId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[toggleBarberStatus] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
