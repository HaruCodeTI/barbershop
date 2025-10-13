import { createClient } from "./supabase/client"

/**
 * Revenue Report Types
 */
export interface RevenueReport {
  totalRevenue: number
  currentMonth: MonthlyRevenue
  previousMonth: MonthlyRevenue
  avgRevenuePerAppointment: number
  monthlyData: MonthlyRevenue[]
  serviceRevenue: ServiceRevenue[]
}

export interface MonthlyRevenue {
  month: string
  revenue: number
  appointments: number
}

export interface ServiceRevenue {
  name: string
  revenue: number
  count: number
  avgRevenue: number
}

/**
 * Productivity Report Types
 */
export interface ProductivityReport {
  barberStats: BarberProductivity[]
  chartData: { name: string; appointments: number; completed: number }[]
}

export interface BarberProductivity {
  id: string
  name: string
  avatar_url: string | null
  totalAppointments: number
  completedAppointments: number
  totalHours: number
  completionRate: number
  avgRating: number
}

/**
 * Occupancy Report Types
 */
export interface OccupancyReport {
  overallOccupancy: number
  totalSlots: number
  bookedSlots: number
  peakDay: string
  weeklyData: WeeklyOccupancy[]
  barberOccupancy: BarberOccupancy[]
  peakHours: { hour: string; bookings: number }[]
}

export interface WeeklyOccupancy {
  day: string
  booked: number
  available: number
  rate: number
}

export interface BarberOccupancy {
  name: string
  appointments: number
  hours: number
  rate: number
}

/**
 * Gets revenue report data for a store
 */
export async function getRevenueReport(
  storeId: string,
  months: number = 6,
): Promise<{ success: boolean; report?: RevenueReport; error?: string }> {
  const supabase = createClient()

  try {
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    // Get all completed appointments in the date range
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        appointment_services(
          service_id,
          price,
          service:services(id, name)
        )
      `,
      )
      .eq("store_id", storeId)
      .eq("status", "completed")
      .gte("appointment_date", startDate.toISOString().split("T")[0])
      .order("appointment_date", { ascending: true })

    if (error) throw error

    if (!appointments || appointments.length === 0) {
      return {
        success: true,
        report: {
          totalRevenue: 0,
          currentMonth: { month: new Date().toLocaleDateString("pt-BR", { month: "short" }), revenue: 0, appointments: 0 },
          previousMonth: { month: "", revenue: 0, appointments: 0 },
          avgRevenuePerAppointment: 0,
          monthlyData: [],
          serviceRevenue: [],
        },
      }
    }

    // Calculate total revenue
    const totalRevenue = appointments.reduce((sum, apt) => sum + Number(apt.final_price), 0)
    const avgRevenuePerAppointment = totalRevenue / appointments.length

    // Group by month
    const monthlyMap = new Map<string, { revenue: number; appointments: number }>()
    appointments.forEach((apt) => {
      const monthKey = new Date(apt.appointment_date).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
      const existing = monthlyMap.get(monthKey)
      if (existing) {
        existing.revenue += Number(apt.final_price)
        existing.appointments++
      } else {
        monthlyMap.set(monthKey, {
          revenue: Number(apt.final_price),
          appointments: 1,
        })
      }
    })

    const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month: month.split(" ")[0], // Only month name
      revenue: data.revenue,
      appointments: data.appointments,
    }))

    const currentMonth = monthlyData[monthlyData.length - 1] || { month: "", revenue: 0, appointments: 0 }
    const previousMonth = monthlyData[monthlyData.length - 2] || { month: "", revenue: 0, appointments: 0 }

    // Calculate service revenue
    const serviceMap = new Map<string, { revenue: number; count: number }>()
    appointments.forEach((apt) => {
      if (apt.appointment_services) {
        apt.appointment_services.forEach((as: any) => {
          const serviceId = as.service.id
          const serviceName = as.service.name
          const existing = serviceMap.get(serviceId)
          if (existing) {
            existing.revenue += Number(as.price)
            existing.count++
          } else {
            serviceMap.set(serviceId, {
              revenue: Number(as.price),
              count: 1,
            })
          }
          serviceMap.set(serviceId, { ...serviceMap.get(serviceId)!, name: serviceName } as any)
        })
      }
    })

    const serviceRevenue = Array.from(serviceMap.values())
      .map((data: any) => ({
        name: data.name,
        revenue: data.revenue,
        count: data.count,
        avgRevenue: data.revenue / data.count,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    return {
      success: true,
      report: {
        totalRevenue,
        currentMonth,
        previousMonth,
        avgRevenuePerAppointment,
        monthlyData,
        serviceRevenue,
      },
    }
  } catch (error) {
    console.error("[getRevenueReport] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Gets productivity report data for a store
 */
export async function getProductivityReport(
  storeId: string,
): Promise<{ success: boolean; report?: ProductivityReport; error?: string }> {
  const supabase = createClient()

  try {
    // Get all barbers
    const { data: barbers, error: barbersError } = await supabase
      .from("barbers")
      .select("*")
      .eq("store_id", storeId)
      .order("name")

    if (barbersError) throw barbersError

    if (!barbers || barbers.length === 0) {
      return {
        success: true,
        report: {
          barberStats: [],
          chartData: [],
        },
      }
    }

    // Get appointments for each barber (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const barberStats: BarberProductivity[] = []

    for (const barber of barbers) {
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("*, appointment_services(service:services(duration))")
        .eq("barber_id", barber.id)
        .gte("appointment_date", thirtyDaysAgo.toISOString().split("T")[0])

      if (appointmentsError) throw appointmentsError

      const completed = appointments?.filter((apt) => apt.status === "completed") || []

      // Calculate total hours from service durations
      const totalMinutes = appointments?.reduce((sum, apt) => {
        if (apt.appointment_services && apt.appointment_services.length > 0) {
          return sum + apt.appointment_services.reduce((serviceSum: number, as: any) => {
            return serviceSum + (as.service?.duration || 0)
          }, 0)
        }
        return sum
      }, 0) || 0

      const totalHours = totalMinutes / 60
      const completionRate = appointments && appointments.length > 0
        ? (completed.length / appointments.length) * 100
        : 0

      barberStats.push({
        id: barber.id,
        name: barber.name,
        avatar_url: barber.avatar_url,
        totalAppointments: appointments?.length || 0,
        completedAppointments: completed.length,
        totalHours: Number(totalHours.toFixed(1)),
        completionRate: Number(completionRate.toFixed(1)),
        avgRating: barber.rating || 0,
      })
    }

    const chartData = barberStats.map((stat) => ({
      name: stat.name.split(" ")[0],
      appointments: stat.totalAppointments,
      completed: stat.completedAppointments,
    }))

    return {
      success: true,
      report: {
        barberStats,
        chartData,
      },
    }
  } catch (error) {
    console.error("[getProductivityReport] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Gets occupancy report data for a store
 */
export async function getOccupancyReport(
  storeId: string,
): Promise<{ success: boolean; report?: OccupancyReport; error?: string }> {
  const supabase = createClient()

  try {
    // Get current week's appointments
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // Saturday

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("*, barber:barbers(id, name), appointment_services(service:services(duration))")
      .eq("store_id", storeId)
      .gte("appointment_date", startOfWeek.toISOString().split("T")[0])
      .lte("appointment_date", endOfWeek.toISOString().split("T")[0])
      .order("appointment_date")

    if (error) throw error

    // Get barbers to calculate slots
    const { data: barbers } = await supabase.from("barbers").select("id, name").eq("store_id", storeId).eq("is_active", true)

    const activeBarbers = barbers?.length || 1
    const slotsPerDay = activeBarbers * 8 // 8 slots per barber per day
    const totalSlots = slotsPerDay * 7 // 7 days
    const bookedSlots = appointments?.length || 0
    const overallOccupancy = (bookedSlots / totalSlots) * 100

    // Weekly occupancy by day
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const weeklyData: WeeklyOccupancy[] = dayNames.map((day, index) => {
      const dayAppointments = appointments?.filter((apt) => new Date(apt.appointment_date).getDay() === index) || []
      const booked = dayAppointments.length
      const available = slotsPerDay - booked
      const rate = (booked / slotsPerDay) * 100

      return {
        day,
        booked,
        available,
        rate: Number(rate.toFixed(1)),
      }
    })

    // Find peak day
    const peakDayData = weeklyData.reduce((max, current) => (current.rate > max.rate ? current : max), weeklyData[0])
    const peakDay = peakDayData.day

    // Barber occupancy
    const barberOccupancy: BarberOccupancy[] = []
    if (barbers) {
      for (const barber of barbers) {
        const barberAppointments = appointments?.filter((apt) => apt.barber_id === barber.id) || []

        const totalMinutes = barberAppointments.reduce((sum, apt) => {
          if (apt.appointment_services && apt.appointment_services.length > 0) {
            return sum + apt.appointment_services.reduce((serviceSum: any, as: any) => {
              return serviceSum + (as.service?.duration || 0)
            }, 0)
          }
          return sum
        }, 0)

        const totalHours = totalMinutes / 60
        const availableHours = 8 * 6 // 8 hours per day, 6 working days
        const rate = (totalHours / availableHours) * 100

        barberOccupancy.push({
          name: barber.name,
          appointments: barberAppointments.length,
          hours: Number(totalHours.toFixed(1)),
          rate: Number(rate.toFixed(1)),
        })
      }
    }

    // Peak hours (group by appointment_time hour)
    const hourMap = new Map<string, number>()
    appointments?.forEach((apt) => {
      const hour = apt.appointment_time.substring(0, 5) // HH:MM format
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
    })

    const peakHours = Array.from(hourMap.entries())
      .map(([hour, bookings]) => ({ hour, bookings }))
      .sort((a, b) => a.hour.localeCompare(b.hour))

    return {
      success: true,
      report: {
        overallOccupancy: Number(overallOccupancy.toFixed(1)),
        totalSlots,
        bookedSlots,
        peakDay,
        weeklyData,
        barberOccupancy,
        peakHours,
      },
    }
  } catch (error) {
    console.error("[getOccupancyReport] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
