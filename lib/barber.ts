import { createClient } from "./supabase/client"

export interface DailySummaryAppointment {
  id: string
  customer_name: string
  customer_phone: string
  appointment_time: string
  duration: number
  price: number
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show"
  services: Array<{
    id: string
    name: string
  }>
}

export interface DailySummary {
  date: string
  appointments: DailySummaryAppointment[]
  stats: {
    total: number
    completed: number
    totalHours: number
    revenue: number
  }
}

export interface WeekAppointment {
  id: string
  date: string
  time: string
  customer_name: string
  services: string[]
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show"
}

export interface WeekOverview {
  weekStart: string
  weekEnd: string
  days: Array<{
    date: string
    dayOfWeek: string
    appointments: WeekAppointment[]
    totalAppointments: number
    revenue: number
  }>
}

export interface TimeBlock {
  id: string
  barber_id: string
  block_date: string
  start_time: string
  end_time: string
  reason: string | null
  created_at: string
}

/**
 * Gets daily summary for a barber on a specific date
 */
export async function getDailySummary(
  barberId: string,
  date: string,
): Promise<{ success: boolean; summary?: DailySummary; error?: string }> {
  const supabase = createClient()

  try {
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        appointment_time,
        final_price,
        status,
        customer:customers!appointments_customer_id_fkey(name, phone),
        appointment_services(
          service:services(id, name, duration)
        )
      `,
      )
      .eq("barber_id", barberId)
      .eq("appointment_date", date)
      .order("appointment_time")

    if (error) throw error

    const summaryAppointments: DailySummaryAppointment[] =
      appointments?.map((apt: any) => {
        const duration = apt.appointment_services.reduce(
          (sum: number, as: any) => sum + (as.service?.duration || 0),
          0,
        )
        return {
          id: apt.id,
          customer_name: apt.customer?.name || "Unknown",
          customer_phone: apt.customer?.phone || "",
          appointment_time: apt.appointment_time,
          duration,
          price: Number(apt.final_price),
          status: apt.status,
          services: apt.appointment_services.map((as: any) => ({
            id: as.service?.id || "",
            name: as.service?.name || "",
          })),
        }
      }) || []

    const completedAppointments = summaryAppointments.filter((a) => a.status === "completed")

    const stats = {
      total: summaryAppointments.length,
      completed: completedAppointments.length,
      totalHours: summaryAppointments.reduce((sum, a) => sum + a.duration, 0) / 60,
      revenue: completedAppointments.reduce((sum, a) => sum + a.price, 0),
    }

    return {
      success: true,
      summary: {
        date,
        appointments: summaryAppointments,
        stats,
      },
    }
  } catch (error) {
    console.error("[getDailySummary] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Gets week overview for a barber
 * Returns appointments organized by day of week
 */
export async function getWeekOverview(
  barberId: string,
  weekStart: string,
): Promise<{ success: boolean; overview?: WeekOverview; error?: string }> {
  const supabase = createClient()

  try {
    // Calculate week end (6 days after start)
    const startDate = new Date(weekStart)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    const weekEnd = endDate.toISOString().split("T")[0]

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        appointment_date,
        appointment_time,
        final_price,
        status,
        customer:customers!appointments_customer_id_fkey(name),
        appointment_services(
          service:services(name)
        )
      `,
      )
      .eq("barber_id", barberId)
      .gte("appointment_date", weekStart)
      .lte("appointment_date", weekEnd)
      .order("appointment_date")
      .order("appointment_time")

    if (error) throw error

    // Group appointments by date
    const appointmentsByDate = new Map<string, any[]>()

    appointments?.forEach((apt: any) => {
      const date = apt.appointment_date
      if (!appointmentsByDate.has(date)) {
        appointmentsByDate.set(date, [])
      }
      appointmentsByDate.get(date)?.push(apt)
    })

    // Create days array for the entire week
    const days = []
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      const dateStr = currentDate.toISOString().split("T")[0]

      const dayAppointments = appointmentsByDate.get(dateStr) || []

      const weekAppointments: WeekAppointment[] = dayAppointments.map((apt: any) => ({
        id: apt.id,
        date: apt.appointment_date,
        time: apt.appointment_time.split(":").slice(0, 2).join(":"),
        customer_name: apt.customer?.name || "Unknown",
        services: apt.appointment_services?.map((as: any) => as.service?.name || "") || [],
        status: apt.status,
      }))

      const completedRevenue = dayAppointments
        .filter((apt: any) => apt.status === "completed")
        .reduce((sum: number, apt: any) => sum + Number(apt.final_price), 0)

      days.push({
        date: dateStr,
        dayOfWeek: currentDate.toLocaleDateString("pt-BR", { weekday: "long" }),
        appointments: weekAppointments,
        totalAppointments: dayAppointments.length,
        revenue: completedRevenue,
      })
    }

    return {
      success: true,
      overview: {
        weekStart,
        weekEnd,
        days,
      },
    }
  } catch (error) {
    console.error("[getWeekOverview] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Creates a time block to mark barber unavailable
 */
export async function createTimeBlock(
  barberId: string,
  blockDate: string,
  startTime: string,
  endTime: string,
  reason?: string,
): Promise<{ success: boolean; timeBlockId?: string; error?: string }> {
  const supabase = createClient()

  try {
    // Validate that start is before end
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)

    if (start >= end) {
      return { success: false, error: "Horário de início deve ser antes do horário de fim" }
    }

    // Check for overlapping blocks
    const { data: existingBlocks, error: checkError } = await supabase
      .from("time_blocks")
      .select("id, start_time, end_time")
      .eq("barber_id", barberId)
      .eq("block_date", blockDate)

    if (checkError) throw checkError

    // Check for overlaps
    const hasOverlap = existingBlocks?.some((block: any) => {
      const existingStart = new Date(`2000-01-01T${block.start_time}`)
      const existingEnd = new Date(`2000-01-01T${block.end_time}`)

      return (start < existingEnd && end > existingStart)
    })

    if (hasOverlap) {
      return { success: false, error: "Já existe um bloqueio neste horário" }
    }

    // Create the time block
    const { data, error } = await supabase
      .from("time_blocks")
      .insert({
        barber_id: barberId,
        block_date: blockDate,
        start_time: startTime,
        end_time: endTime,
        reason: reason || null,
      })
      .select("id")
      .single()

    if (error) throw error

    return { success: true, timeBlockId: data.id }
  } catch (error) {
    console.error("[createTimeBlock] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Gets all time blocks for a barber on a specific date
 */
export async function getTimeBlocks(
  barberId: string,
  startDate: string,
  endDate?: string,
): Promise<{ success: boolean; timeBlocks?: TimeBlock[]; error?: string }> {
  const supabase = createClient()

  try {
    let query = supabase
      .from("time_blocks")
      .select("*")
      .eq("barber_id", barberId)
      .gte("block_date", startDate)
      .order("block_date")
      .order("start_time")

    if (endDate) {
      query = query.lte("block_date", endDate)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, timeBlocks: data as TimeBlock[] }
  } catch (error) {
    console.error("[getTimeBlocks] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Deletes a time block
 */
export async function deleteTimeBlock(timeBlockId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("time_blocks").delete().eq("id", timeBlockId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[deleteTimeBlock] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Marks an appointment as completed
 * This is a convenience function for barbers
 */
export async function completeAppointment(appointmentId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    // Get appointment to validate
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("status")
      .eq("id", appointmentId)
      .single()

    if (fetchError) throw fetchError

    if (appointment.status === "completed") {
      return { success: false, error: "Agendamento já está concluído" }
    }

    if (appointment.status === "cancelled") {
      return { success: false, error: "Não é possível concluir um agendamento cancelado" }
    }

    // Update to completed
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)

    if (updateError) throw updateError

    return { success: true }
  } catch (error) {
    console.error("[completeAppointment] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
