import { createClient } from "./supabase/client"

export interface CustomerAppointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show"
  total_price: number
  discount_amount: number
  final_price: number
  notes: string | null
  created_at: string
  barber: {
    id: string
    name: string
    email: string
    avatar_url: string | null
  }
  store: {
    id: string
    name: string
    address: string
    phone: string
  }
  appointment_services: Array<{
    service_id: string
    price: number
    service: {
      id: string
      name: string
      description: string
      duration: number
    }
  }>
}

export interface CustomerStats {
  customerId: string
  customerName: string
  customerEmail: string | null
  customerPhone: string
  loyaltyPoints: number
  totalSpent: number
  appointmentsCount: number
  lastVisit: string | null
  averageFrequency: number // days between visits
  favoriteBarbers: Array<{
    id: string
    name: string
    count: number
  }>
  favoriteServices: Array<{
    id: string
    name: string
    count: number
  }>
}

export interface Recommendation {
  id: string
  name: string
  score: number // 0-100
  reason: string
  usageCount: number
  lastUsed: string | null
  avatar_url?: string | null
  specialties?: string[]
  price?: number
  duration?: number
}

export interface CustomerRecommendations {
  barbers: Recommendation[]
  services: Recommendation[]
}

export interface AppointmentFilter {
  status?: "all" | "upcoming" | "past" | "pending" | "confirmed" | "completed" | "cancelled"
  barberId?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}

/**
 * Gets customer appointments with optional filters
 */
export async function getCustomerAppointments(customerId: string, filter?: AppointmentFilter) {
  const supabase = createClient()

  try {
    let query = supabase
      .from("appointments")
      .select(
        `
        *,
        barber:barbers(id, name, email, avatar_url),
        store:stores(id, name, address, phone),
        appointment_services(
          service_id,
          price,
          service:services(id, name, description, duration)
        )
      `,
      )
      .eq("customer_id", customerId)

    // Apply filters
    if (filter?.status) {
      const today = new Date().toISOString().split("T")[0]
      const now = new Date().toTimeString().split(" ")[0]

      if (filter.status === "upcoming") {
        query = query.or(
          `appointment_date.gt.${today},and(appointment_date.eq.${today},appointment_time.gte.${now})`,
        )
        query = query.in("status", ["pending", "confirmed"])
      } else if (filter.status === "past") {
        query = query.or(
          `appointment_date.lt.${today},and(appointment_date.eq.${today},appointment_time.lt.${now})`,
        )
      } else if (filter.status !== "all") {
        query = query.eq("status", filter.status)
      }
    }

    if (filter?.barberId) {
      query = query.eq("barber_id", filter.barberId)
    }

    if (filter?.dateFrom) {
      query = query.gte("appointment_date", filter.dateFrom)
    }

    if (filter?.dateTo) {
      query = query.lte("appointment_date", filter.dateTo)
    }

    // Order by date descending (most recent first)
    query = query.order("appointment_date", { ascending: false }).order("appointment_time", { ascending: false })

    if (filter?.limit) {
      query = query.limit(filter.limit)
    }

    const { data: appointments, error } = await query

    if (error) throw error

    return { success: true, appointments: appointments as CustomerAppointment[] }
  } catch (error) {
    console.error("[getCustomerAppointments] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", appointments: [] }
  }
}

/**
 * Gets comprehensive statistics about a customer
 */
export async function getCustomerStats(customerId: string): Promise<{ success: boolean; stats?: CustomerStats; error?: string }> {
  const supabase = createClient()

  try {
    // Get customer basic info
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single()

    if (customerError) throw customerError

    // Get all completed appointments for statistics
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(
        `
        *,
        barber:barbers(id, name),
        appointment_services(
          service:services(id, name)
        )
      `,
      )
      .eq("customer_id", customerId)
      .eq("status", "completed")
      .order("appointment_date", { ascending: false })

    if (appointmentsError) throw appointmentsError

    // Calculate statistics
    const totalSpent = appointments.reduce((sum, apt) => sum + Number(apt.final_price), 0)
    const appointmentsCount = appointments.length

    // Find last visit
    const lastVisit = appointments.length > 0 ? appointments[0].appointment_date : null

    // Calculate average frequency (days between visits)
    let averageFrequency = 0
    if (appointments.length >= 2) {
      const dates = appointments.map((apt) => new Date(apt.appointment_date).getTime()).sort((a, b) => b - a)
      const intervals = []
      for (let i = 0; i < dates.length - 1; i++) {
        intervals.push((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24))
      }
      averageFrequency = Math.round(intervals.reduce((sum, val) => sum + val, 0) / intervals.length)
    }

    // Calculate favorite barbers
    const barberCounts = new Map<string, { id: string; name: string; count: number }>()
    appointments.forEach((apt) => {
      const barberId = apt.barber.id
      const existing = barberCounts.get(barberId)
      if (existing) {
        existing.count++
      } else {
        barberCounts.set(barberId, {
          id: apt.barber.id,
          name: apt.barber.name,
          count: 1,
        })
      }
    })
    const favoriteBarbers = Array.from(barberCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    // Calculate favorite services
    const serviceCounts = new Map<string, { id: string; name: string; count: number }>()
    appointments.forEach((apt) => {
      apt.appointment_services.forEach((as: any) => {
        const serviceId = as.service.id
        const existing = serviceCounts.get(serviceId)
        if (existing) {
          existing.count++
        } else {
          serviceCounts.set(serviceId, {
            id: as.service.id,
            name: as.service.name,
            count: 1,
          })
        }
      })
    })
    const favoriteServices = Array.from(serviceCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    const stats: CustomerStats = {
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      loyaltyPoints: customer.loyalty_points,
      totalSpent,
      appointmentsCount,
      lastVisit,
      averageFrequency,
      favoriteBarbers,
      favoriteServices,
    }

    return { success: true, stats }
  } catch (error) {
    console.error("[getCustomerStats] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Generates personalized recommendations based on customer history
 */
export async function getCustomerRecommendations(
  customerId: string,
): Promise<{ success: boolean; recommendations?: CustomerRecommendations; error?: string }> {
  const supabase = createClient()

  try {
    // Get customer's appointment history (last 6 months weighted more)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split("T")[0]

    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(
        `
        *,
        barber:barbers(id, name, avatar_url),
        appointment_services(
          service:services(id, name, price, duration)
        )
      `,
      )
      .eq("customer_id", customerId)
      .eq("status", "completed")
      .order("appointment_date", { ascending: false })

    if (appointmentsError) throw appointmentsError

    if (!appointments || appointments.length === 0) {
      // No history - return popular options
      const { data: popularBarbers } = await supabase
        .from("barbers")
        .select("id, name, avatar_url")
        .eq("is_active", true)
        .limit(3)

      const { data: popularServices } = await supabase
        .from("services")
        .select("id, name, price, duration")
        .eq("is_active", true)
        .limit(3)

      return {
        success: true,
        recommendations: {
          barbers:
            popularBarbers?.map((b) => ({
              id: b.id,
              name: b.name,
              avatar_url: b.avatar_url,
              score: 70,
              reason: "Popular na nossa barbearia",
              usageCount: 0,
              lastUsed: null,
            })) || [],
          services:
            popularServices?.map((s) => ({
              id: s.id,
              name: s.name,
              price: Number(s.price),
              duration: s.duration,
              score: 70,
              reason: "Serviço popular",
              usageCount: 0,
              lastUsed: null,
            })) || [],
        },
      }
    }

    // Calculate recency weight for each appointment
    const calculateRecencyWeight = (date: string): number => {
      const appointmentDate = new Date(date)
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - appointmentDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff <= 30) return 1.0
      if (daysDiff <= 90) return 0.7
      if (daysDiff <= 180) return 0.4
      return 0.2
    }

    // Score barbers
    const barberScores = new Map<
      string,
      {
        id: string
        name: string
        avatar_url: string | null
        frequency: number
        recencyWeight: number
        totalSpent: number
        lastUsed: string
      }
    >()

    appointments.forEach((apt) => {
      const barberId = apt.barber.id
      const recencyWeight = calculateRecencyWeight(apt.appointment_date)
      const existing = barberScores.get(barberId)

      if (existing) {
        existing.frequency += 1
        existing.recencyWeight += recencyWeight
        existing.totalSpent += Number(apt.final_price)
        if (apt.appointment_date > existing.lastUsed) {
          existing.lastUsed = apt.appointment_date
        }
      } else {
        barberScores.set(barberId, {
          id: apt.barber.id,
          name: apt.barber.name,
          avatar_url: apt.barber.avatar_url,
          frequency: 1,
          recencyWeight,
          totalSpent: Number(apt.final_price),
          lastUsed: apt.appointment_date,
        })
      }
    })

    // Calculate final barber scores
    const maxFrequency = Math.max(...Array.from(barberScores.values()).map((b) => b.frequency))
    const maxSpent = Math.max(...Array.from(barberScores.values()).map((b) => b.totalSpent))
    const maxRecency = Math.max(...Array.from(barberScores.values()).map((b) => b.recencyWeight))

    const barberRecommendations = Array.from(barberScores.values())
      .map((barber) => {
        const frequencyScore = (barber.frequency / maxFrequency) * 50
        const recencyScore = (barber.recencyWeight / maxRecency) * 30
        const spentScore = (barber.totalSpent / maxSpent) * 20
        const score = Math.round(frequencyScore + recencyScore + spentScore)

        let reason = ""
        if (barber.frequency >= 3) {
          reason = `Você já agendou ${barber.frequency} vezes`
        } else if (barber.recencyWeight > 0.7) {
          reason = "Atendimento recente"
        } else {
          reason = "Baseado no seu histórico"
        }

        return {
          id: barber.id,
          name: barber.name,
          avatar_url: barber.avatar_url,
          score,
          reason,
          usageCount: barber.frequency,
          lastUsed: barber.lastUsed,
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    // Score services
    const serviceScores = new Map<
      string,
      {
        id: string
        name: string
        price: number
        duration: number
        frequency: number
        recencyWeight: number
        lastUsed: string
      }
    >()

    appointments.forEach((apt) => {
      const recencyWeight = calculateRecencyWeight(apt.appointment_date)
      apt.appointment_services.forEach((as: any) => {
        const serviceId = as.service.id
        const existing = serviceScores.get(serviceId)

        if (existing) {
          existing.frequency += 1
          existing.recencyWeight += recencyWeight
          if (apt.appointment_date > existing.lastUsed) {
            existing.lastUsed = apt.appointment_date
          }
        } else {
          serviceScores.set(serviceId, {
            id: as.service.id,
            name: as.service.name,
            price: Number(as.service.price),
            duration: as.service.duration,
            frequency: 1,
            recencyWeight,
            lastUsed: apt.appointment_date,
          })
        }
      })
    })

    // Calculate final service scores
    const maxServiceFrequency = Math.max(...Array.from(serviceScores.values()).map((s) => s.frequency))
    const maxServiceRecency = Math.max(...Array.from(serviceScores.values()).map((s) => s.recencyWeight))

    const serviceRecommendations = Array.from(serviceScores.values())
      .map((service) => {
        const frequencyScore = (service.frequency / maxServiceFrequency) * 60
        const recencyScore = (service.recencyWeight / maxServiceRecency) * 40
        const score = Math.round(frequencyScore + recencyScore)

        let reason = ""
        if (service.frequency >= 5) {
          reason = `Você já usou ${service.frequency} vezes`
        } else if (service.frequency >= 2) {
          reason = `Usado ${service.frequency} vezes`
        } else {
          reason = "Você gostou deste serviço"
        }

        return {
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration,
          score,
          reason,
          usageCount: service.frequency,
          lastUsed: service.lastUsed,
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    return {
      success: true,
      recommendations: {
        barbers: barberRecommendations,
        services: serviceRecommendations,
      },
    }
  } catch (error) {
    console.error("[getCustomerRecommendations] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Cancels an appointment
 */
export async function cancelAppointment(appointmentId: string, reason?: string) {
  const supabase = createClient()
  console.log("[cancelAppointment] Starting cancellation:", { appointmentId, reason })

  try {
    // Get appointment to validate
    console.log("[cancelAppointment] Fetching appointment from database...")
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("*, appointment_date, appointment_time, status")
      .eq("id", appointmentId)
      .single()

    if (fetchError) {
      console.error("[cancelAppointment] Fetch error:", fetchError)
      throw fetchError
    }

    console.log("[cancelAppointment] Appointment fetched:", {
      id: appointment.id,
      status: appointment.status,
      date: appointment.appointment_date,
      time: appointment.appointment_time,
    })

    // Validate if can cancel
    if (appointment.status === "cancelled") {
      console.log("[cancelAppointment] Validation failed: already cancelled")
      return { success: false, error: "Agendamento já foi cancelado" }
    }

    if (appointment.status === "completed") {
      console.log("[cancelAppointment] Validation failed: already completed")
      return { success: false, error: "Não é possível cancelar um agendamento já concluído" }
    }

    // Check if appointment is in the past
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`)
    const now = new Date()

    if (appointmentDateTime < now) {
      console.log("[cancelAppointment] Validation failed: appointment in the past")
      return { success: false, error: "Não é possível cancelar um agendamento passado" }
    }

    // Update appointment status
    console.log("[cancelAppointment] Updating appointment status to cancelled...")
    const updateData = {
      status: "cancelled",
      notes: reason ? `Cancelado: ${reason}` : appointment.notes,
      updated_at: new Date().toISOString(),
    }
    console.log("[cancelAppointment] Update data:", updateData)

    const { data: updateResult, error: updateError } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId)
      .select()

    if (updateError) {
      console.error("[cancelAppointment] Update error:", updateError)
      throw updateError
    }

    console.log("[cancelAppointment] Update successful! Result:", updateResult)
    return { success: true }
  } catch (error) {
    console.error("[cancelAppointment] Exception caught:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Updates an existing appointment
 */
export async function updateAppointment(
  appointmentId: string,
  updates: {
    appointment_date?: string
    appointment_time?: string
    barber_id?: string
    service_ids?: string[]
    total_price?: number
    discount_amount?: number
    final_price?: number
  },
) {
  const supabase = createClient()

  try {
    // Get current appointment to validate
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("*, appointment_services(service_id)")
      .eq("id", appointmentId)
      .single()

    if (fetchError) throw fetchError

    // Validate if can update
    if (appointment.status === "cancelled") {
      return { success: false, error: "Não é possível editar um agendamento cancelado" }
    }

    if (appointment.status === "completed") {
      return { success: false, error: "Não é possível editar um agendamento já concluído" }
    }

    // Check if appointment is in the past
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`)
    const now = new Date()

    if (appointmentDateTime < now) {
      return { success: false, error: "Não é possível editar um agendamento passado" }
    }

    // Update appointment basic info
    const appointmentUpdates: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.appointment_date) appointmentUpdates.appointment_date = updates.appointment_date
    if (updates.appointment_time) appointmentUpdates.appointment_time = updates.appointment_time
    if (updates.barber_id) appointmentUpdates.barber_id = updates.barber_id
    if (updates.total_price !== undefined) appointmentUpdates.total_price = updates.total_price
    if (updates.discount_amount !== undefined) appointmentUpdates.discount_amount = updates.discount_amount
    if (updates.final_price !== undefined) appointmentUpdates.final_price = updates.final_price

    const { error: updateError } = await supabase
      .from("appointments")
      .update(appointmentUpdates)
      .eq("id", appointmentId)

    if (updateError) throw updateError

    // Update services if provided
    if (updates.service_ids && updates.service_ids.length > 0) {
      // Delete old services
      const { error: deleteError } = await supabase
        .from("appointment_services")
        .delete()
        .eq("appointment_id", appointmentId)

      if (deleteError) throw deleteError

      // Get service details for pricing
      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select("id, price")
        .in("id", updates.service_ids)

      if (servicesError) throw servicesError

      // Insert new services
      const appointmentServices = services.map((service) => ({
        appointment_id: appointmentId,
        service_id: service.id,
        price: service.price,
      }))

      const { error: insertError } = await supabase.from("appointment_services").insert(appointmentServices)

      if (insertError) throw insertError
    }

    return { success: true }
  } catch (error) {
    console.error("[updateAppointment] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Finds a customer by phone number
 */
export async function findCustomerByPhone(phone: string, storeId: string) {
  const supabase = createClient()

  try {
    const { data: customer, error } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", phone)
      .eq("store_id", storeId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - customer not found
        return { success: true, customer: null }
      }
      throw error
    }

    return { success: true, customer }
  } catch (error) {
    console.error("[findCustomerByPhone] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
