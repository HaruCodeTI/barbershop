import { createClient } from "./supabase/client"
import type {
  AppointmentWithDetails,
  AppointmentFilters,
  AppointmentStats,
  ApiResponse,
} from "@/types/manager"

/**
 * Gets appointments for a store with optional filters
 */
export async function getAppointments(
  storeId: string,
  filters?: AppointmentFilters
): Promise<ApiResponse<AppointmentWithDetails[]>> {
  const supabase = createClient()

  try {
    let query = supabase
      .from("appointments")
      .select(
        `
        *,
        customer:customers(id, name, phone, email),
        barber:barbers(id, name, avatar_url),
        appointment_services(
          service:services(id, name, price, duration)
        )
      `
      )
      .eq("store_id", storeId)

    // Apply filters
    if (filters?.startDate) {
      query = query.gte("appointment_date", filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte("appointment_date", filters.endDate)
    }
    if (filters?.status && filters.status.length > 0) {
      query = query.in("status", filters.status)
    }
    if (filters?.barberId) {
      query = query.eq("barber_id", filters.barberId)
    }

    query = query.order("appointment_date", { ascending: false }).order("appointment_time", { ascending: false })

    const { data, error } = await query

    if (error) throw error

    // Transform data to match interface
    const appointments: AppointmentWithDetails[] = (data || []).map((apt: any) => ({
      id: apt.id,
      appointment_date: apt.appointment_date,
      appointment_time: apt.appointment_time,
      status: apt.status,
      final_price: apt.final_price,
      discount_amount: apt.discount_amount,
      total_price: apt.total_price,
      notes: apt.notes,
      customer: apt.customer,
      barber: apt.barber,
      services: apt.appointment_services.map((as: any) => as.service),
      created_at: apt.created_at,
    }))

    // Apply search filter (client-side for simplicity)
    let filtered = appointments
    if (filters?.search) {
      const search = filters.search.toLowerCase()
      filtered = appointments.filter(
        (apt) =>
          apt.customer.name.toLowerCase().includes(search) ||
          apt.customer.phone.includes(search) ||
          apt.barber.name.toLowerCase().includes(search)
      )
    }

    return { success: true, data: filtered }
  } catch (error) {
    console.error("[getAppointments] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Gets appointment statistics for a store
 */
export async function getAppointmentStats(
  storeId: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<AppointmentStats>> {
  const supabase = createClient()

  try {
    let query = supabase
      .from("appointments")
      .select("id, status, final_price")
      .eq("store_id", storeId)

    if (startDate) {
      query = query.gte("appointment_date", startDate)
    }
    if (endDate) {
      query = query.lte("appointment_date", endDate)
    }

    const { data, error } = await query

    if (error) throw error

    const appointments = data || []
    const total = appointments.length
    const pending = appointments.filter((a) => a.status === "pending").length
    const confirmed = appointments.filter((a) => a.status === "confirmed").length
    const completed = appointments.filter((a) => a.status === "completed").length
    const cancelled = appointments.filter((a) => a.status === "cancelled").length
    const noShow = appointments.filter((a) => a.status === "no_show").length

    const totalRevenue = appointments
      .filter((a) => a.status === "completed")
      .reduce((sum, a) => sum + Number(a.final_price), 0)

    const avgTicket = completed > 0 ? totalRevenue / completed : 0

    return {
      success: true,
      data: {
        total,
        pending,
        confirmed,
        completed,
        cancelled,
        noShow,
        totalRevenue,
        avgTicket,
      },
    }
  } catch (error) {
    console.error("[getAppointmentStats] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Updates appointment status
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show"
): Promise<ApiResponse<void>> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("appointments")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[updateAppointmentStatus] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Cancels an appointment
 */
export async function cancelAppointment(
  appointmentId: string,
  reason?: string
): Promise<ApiResponse<void>> {
  const supabase = createClient()

  try {
    // Get appointment to check if can cancel
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("status")
      .eq("id", appointmentId)
      .single()

    if (fetchError) throw fetchError

    if (appointment.status === "completed") {
      return { success: false, error: "Não é possível cancelar um agendamento já concluído" }
    }

    if (appointment.status === "cancelled") {
      return { success: false, error: "Agendamento já está cancelado" }
    }

    // Update status to cancelled
    const { error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        notes: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[cancelAppointment] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
