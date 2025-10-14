import { createClient } from "./supabase/client"
import type {
  CustomerWithStats,
  CustomerStats,
  CustomerFilters,
  ApiResponse,
  AppointmentWithDetails,
} from "@/types/manager"

/**
 * Gets customers for a store with optional filters and stats
 */
export async function getCustomers(
  storeId: string,
  filters?: CustomerFilters
): Promise<ApiResponse<CustomerWithStats[]>> {
  const supabase = createClient()

  try {
    // Get all customers with their appointment count and revenue
    const { data: customersData, error: customersError } = await supabase
      .from("customers")
      .select(
        `
        id,
        name,
        email,
        phone,
        loyalty_points,
        created_at,
        auth_user_id,
        appointments!inner(
          id,
          status,
          final_price,
          appointment_date,
          store_id
        )
      `
      )
      .eq("appointments.store_id", storeId)

    if (customersError) throw customersError

    // Process customers with stats
    const customersMap = new Map<string, CustomerWithStats>()

    ;(customersData || []).forEach((customer: any) => {
      if (!customersMap.has(customer.id)) {
        const completedAppointments = customer.appointments.filter((apt: any) => apt.status === "completed")
        const totalSpent = completedAppointments.reduce((sum: number, apt: any) => sum + Number(apt.final_price), 0)
        const avgTicket = completedAppointments.length > 0 ? totalSpent / completedAppointments.length : 0

        // Determine recurrence type
        let recurrence_type: "new" | "returning" | "vip" = "new"
        if (completedAppointments.length >= 10) {
          recurrence_type = "vip"
        } else if (completedAppointments.length >= 2) {
          recurrence_type = "returning"
        }

        // Get last appointment date
        const sortedAppointments = customer.appointments.sort(
          (a: any, b: any) =>
            new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
        )
        const lastAppointmentDate =
          sortedAppointments.length > 0 ? sortedAppointments[0].appointment_date : null

        customersMap.set(customer.id, {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          loyalty_points: customer.loyalty_points,
          created_at: customer.created_at,
          auth_user_id: customer.auth_user_id,
          total_appointments: customer.appointments.length,
          completed_appointments: completedAppointments.length,
          total_spent: totalSpent,
          avg_ticket: avgTicket,
          last_appointment_date: lastAppointmentDate,
          recurrence_type,
        })
      }
    })

    let customers = Array.from(customersMap.values())

    // Apply filters
    if (filters?.search) {
      const search = filters.search.toLowerCase()
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.phone.includes(search) ||
          c.email?.toLowerCase().includes(search)
      )
    }

    if (filters?.recurrenceType && filters.recurrenceType.length > 0) {
      customers = customers.filter((c) => filters.recurrenceType!.includes(c.recurrence_type))
    }

    if (filters?.minLoyaltyPoints) {
      customers = customers.filter((c) => c.loyalty_points >= filters.minLoyaltyPoints!)
    }

    // Apply sorting
    if (filters?.sortBy) {
      customers.sort((a, b) => {
        const key = filters.sortBy!
        const aValue = a[key]
        const bValue = b[key]
        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1
        return aValue > bValue ? -1 : 1
      })
    }

    return { success: true, data: customers }
  } catch (error) {
    console.error("[getCustomers] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Gets customer statistics for a store
 */
export async function getCustomerStats(storeId: string): Promise<ApiResponse<CustomerStats>> {
  const supabase = createClient()

  try {
    const { data: customers, error } = await getCustomers(storeId)

    if (error || !customers) {
      throw new Error(error || "Failed to fetch customers")
    }

    const total = customers.length
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const newThisMonth = customers.filter(
      (c) => new Date(c.created_at) >= thirtyDaysAgo
    ).length

    const returning = customers.filter((c) => c.recurrence_type === "returning").length
    const vip = customers.filter((c) => c.recurrence_type === "vip").length

    const avgLifetimeValue =
      customers.reduce((sum, c) => sum + c.total_spent, 0) / (total || 1)

    const avgLoyaltyPoints =
      customers.reduce((sum, c) => sum + c.loyalty_points, 0) / (total || 1)

    return {
      success: true,
      data: {
        total,
        newThisMonth,
        returning,
        vip,
        avgLifetimeValue,
        avgLoyaltyPoints,
      },
    }
  } catch (error) {
    console.error("[getCustomerStats] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Gets detailed customer profile with appointment history
 */
export async function getCustomerDetail(
  customerId: string,
  storeId: string
): Promise<ApiResponse<CustomerWithStats & { appointments: AppointmentWithDetails[] }>> {
  const supabase = createClient()

  try {
    // Get customer stats
    const { data: customersData, error: customersError } = await getCustomers(storeId)

    if (customersError || !customersData) {
      throw new Error(customersError || "Failed to fetch customer")
    }

    const customer = customersData.find((c) => c.id === customerId)

    if (!customer) {
      return { success: false, error: "Cliente não encontrado" }
    }

    // Get customer appointments
    const { data: appointments, error: appointmentsError } = await supabase
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
      .eq("customer_id", customerId)
      .eq("store_id", storeId)
      .order("appointment_date", { ascending: false })

    if (appointmentsError) throw appointmentsError

    const appointmentDetails: AppointmentWithDetails[] = (appointments || []).map((apt: any) => ({
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

    return {
      success: true,
      data: {
        ...customer,
        appointments: appointmentDetails,
      },
    }
  } catch (error) {
    console.error("[getCustomerDetail] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Updates customer information
 */
export async function updateCustomer(
  customerId: string,
  updates: {
    name?: string
    email?: string
    phone?: string
  }
): Promise<ApiResponse<void>> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("customers")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customerId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[updateCustomer] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
