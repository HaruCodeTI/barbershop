import { createClient } from "./supabase/client"

export interface TimeSlot {
  time: string
  status: "available" | "booked" | "blocked"
  appointmentId?: string
  appointment?: {
    id: string
    customerName: string
    serviceNames: string[]
  }
}

export interface BarberAvailability {
  barberId: string
  barberName: string
  barberAvatar: string | null
  date: string
  slots: TimeSlot[]
}

export interface BookingFormData {
  customerId?: string
  customerName: string
  customerEmail?: string
  customerPhone: string
  barberId: string
  date: string
  time: string
  serviceIds: string[]
  notes?: string
  storeId: string
}

export interface BookingDetails {
  id: string
  appointment_date: string
  appointment_time: string
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show"
  total_price: number
  discount_amount: number
  final_price: number
  notes: string | null
  customer: {
    id: string
    name: string
    email: string | null
    phone: string
    loyalty_points: number
  }
  barber: {
    id: string
    name: string
    email: string
    phone: string | null
    avatar_url: string | null
  }
  store: {
    id: string
    name: string
    address: string | null
    phone: string | null
  }
  services: Array<{
    id: string
    name: string
    description: string | null
    duration: number
    price: number
  }>
}

/**
 * Gets barber availability for a specific date
 * Considers both existing appointments and time blocks
 */
export async function getBarberAvailability(
  storeId: string,
  date: string,
): Promise<{ success: boolean; availability?: BarberAvailability[]; error?: string }> {
  const supabase = createClient()

  try {
    // Get all active barbers for the store
    const { data: barbers, error: barbersError } = await supabase
      .from("barbers")
      .select("id, name, avatar_url")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .order("name")

    if (barbersError) throw barbersError

    // Get all appointments for this date
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(
        `
        id,
        barber_id,
        appointment_time,
        customer:customers!appointments_customer_id_fkey(name),
        appointment_services(
          service:services(name, duration)
        )
      `,
      )
      .eq("appointment_date", date)
      .in("status", ["pending", "confirmed"])

    if (appointmentsError) throw appointmentsError

    // Get all time blocks for this date
    const { data: timeBlocks, error: timeBlocksError } = await supabase
      .from("time_blocks")
      .select("barber_id, start_time, end_time")
      .eq("block_date", date)

    if (timeBlocksError) throw timeBlocksError

    // Generate time slots for business hours (9:00 - 19:00)
    const businessStart = 9
    const businessEnd = 19
    const slotInterval = 30 // minutes

    const availability: BarberAvailability[] = barbers.map((barber) => {
      const slots: TimeSlot[] = []

      for (let hour = businessStart; hour < businessEnd; hour++) {
        for (let minute = 0; minute < 60; minute += slotInterval) {
          const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`

          // Check if there's an appointment at this time
          const appointment = appointments?.find((apt: any) => {
            if (apt.barber_id !== barber.id) return false
            if (apt.appointment_time !== time) return false
            return true
          })

          if (appointment) {
            const serviceNames = appointment.appointment_services?.map((as: any) => as.service?.name || "") || []
            slots.push({
              time,
              status: "booked",
              appointmentId: appointment.id,
              appointment: {
                id: appointment.id,
                customerName: appointment.customer?.name || "Unknown",
                serviceNames,
              },
            })
            continue
          }

          // Check if there's a time block at this time
          const timeValue = hour * 60 + minute
          const isBlocked = timeBlocks?.some((block: any) => {
            if (block.barber_id !== barber.id) return false

            const [startHour, startMinute] = block.start_time.split(":").map(Number)
            const [endHour, endMinute] = block.end_time.split(":").map(Number)
            const blockStart = startHour * 60 + startMinute
            const blockEnd = endHour * 60 + endMinute

            return timeValue >= blockStart && timeValue < blockEnd
          })

          slots.push({
            time,
            status: isBlocked ? "blocked" : "available",
          })
        }
      }

      return {
        barberId: barber.id,
        barberName: barber.name,
        barberAvatar: barber.avatar_url,
        date,
        slots,
      }
    })

    return { success: true, availability }
  } catch (error) {
    console.error("[getBarberAvailability] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Creates a new booking
 * Creates customer if doesn't exist, then creates appointment
 */
export async function createBooking(
  bookingData: BookingFormData,
): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  const supabase = createClient()

  try {
    let customerId = bookingData.customerId

    // If no customerId, search or create customer
    if (!customerId) {
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", bookingData.customerPhone)
        .eq("store_id", bookingData.storeId)
        .single()

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            store_id: bookingData.storeId,
            name: bookingData.customerName,
            email: bookingData.customerEmail || null,
            phone: bookingData.customerPhone,
            loyalty_points: 0,
          })
          .select("id")
          .single()

        if (customerError) throw customerError
        customerId = newCustomer.id
      }
    }

    // Get service details to calculate prices
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("id, price, duration")
      .in("id", bookingData.serviceIds)

    if (servicesError) throw servicesError

    const totalPrice = services.reduce((sum, service) => sum + Number(service.price), 0)

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        store_id: bookingData.storeId,
        customer_id: customerId,
        barber_id: bookingData.barberId,
        appointment_date: bookingData.date,
        appointment_time: bookingData.time,
        status: "pending",
        total_price: totalPrice,
        discount_amount: 0,
        final_price: totalPrice,
        notes: bookingData.notes || null,
      })
      .select("id")
      .single()

    if (appointmentError) throw appointmentError

    // Create appointment services
    const appointmentServices = services.map((service) => ({
      appointment_id: appointment.id,
      service_id: service.id,
      price: service.price,
    }))

    const { error: servicesInsertError } = await supabase.from("appointment_services").insert(appointmentServices)

    if (servicesInsertError) throw servicesInsertError

    return { success: true, appointmentId: appointment.id }
  } catch (error) {
    console.error("[createBooking] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Gets detailed information about a specific booking
 */
export async function getBookingDetails(
  appointmentId: string,
): Promise<{ success: boolean; booking?: BookingDetails; error?: string }> {
  const supabase = createClient()

  try {
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(
        `
        id,
        appointment_date,
        appointment_time,
        status,
        total_price,
        discount_amount,
        final_price,
        notes,
        customer:customers!appointments_customer_id_fkey(
          id,
          name,
          email,
          phone,
          loyalty_points
        ),
        barber:barbers!appointments_barber_id_fkey(
          id,
          name,
          email,
          phone,
          avatar_url
        ),
        store:stores!appointments_store_id_fkey(
          id,
          name,
          address,
          phone
        ),
        appointment_services(
          service:services(
            id,
            name,
            description,
            duration,
            price
          )
        )
      `,
      )
      .eq("id", appointmentId)
      .single()

    if (appointmentError) throw appointmentError

    // Transform the data to match the interface
    const booking: BookingDetails = {
      id: appointment.id,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      status: appointment.status,
      total_price: Number(appointment.total_price),
      discount_amount: Number(appointment.discount_amount),
      final_price: Number(appointment.final_price),
      notes: appointment.notes,
      customer: {
        id: (appointment.customer as any).id,
        name: (appointment.customer as any).name,
        email: (appointment.customer as any).email,
        phone: (appointment.customer as any).phone,
        loyalty_points: (appointment.customer as any).loyalty_points,
      },
      barber: {
        id: (appointment.barber as any).id,
        name: (appointment.barber as any).name,
        email: (appointment.barber as any).email,
        phone: (appointment.barber as any).phone,
        avatar_url: (appointment.barber as any).avatar_url,
      },
      store: {
        id: (appointment.store as any).id,
        name: (appointment.store as any).name,
        address: (appointment.store as any).address,
        phone: (appointment.store as any).phone,
      },
      services: appointment.appointment_services.map((as: any) => ({
        id: as.service.id,
        name: as.service.name,
        description: as.service.description,
        duration: as.service.duration,
        price: Number(as.service.price),
      })),
    }

    return { success: true, booking }
  } catch (error) {
    console.error("[getBookingDetails] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Updates the status of a booking
 */
export async function updateBookingStatus(
  appointmentId: string,
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show",
): Promise<{ success: boolean; error?: string }> {
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
    console.error("[updateBookingStatus] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Searches for a customer by phone number
 */
export async function searchCustomer(
  phone: string,
  storeId: string,
): Promise<{
  success: boolean
  customer?: {
    id: string
    name: string
    email: string | null
    phone: string
    loyalty_points: number
  }
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data: customer, error } = await supabase
      .from("customers")
      .select("id, name, email, phone, loyalty_points")
      .eq("phone", phone)
      .eq("store_id", storeId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - customer not found
        return { success: true, customer: undefined }
      }
      throw error
    }

    return { success: true, customer }
  } catch (error) {
    console.error("[searchCustomer] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
