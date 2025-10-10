import { createClient } from "./supabase/client"

export interface CreateAppointmentData {
  customerId: string
  barberId: string
  serviceIds: string[]
  date: string // ISO format
  time: string // HH:MM format
  couponCode?: string
  storeId: string
  notes?: string
}

export interface CreateCustomerData {
  name: string
  email: string
  phone: string
  storeId: string
}

/**
 * Creates a new appointment in the database
 */
export async function createAppointment(data: CreateAppointmentData) {
  const supabase = createClient()

  try {
    // 1. Get services to calculate prices
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("id, price, duration")
      .in("id", data.serviceIds)

    if (servicesError) throw servicesError
    if (!services || services.length === 0) {
      throw new Error("No services found")
    }

    // 2. Calculate total price and duration
    const totalPrice = services.reduce((sum, service) => sum + Number(service.price), 0)
    const totalDuration = services.reduce((sum, service) => sum + service.duration, 0)

    // 3. Validate and apply coupon if provided
    let discountAmount = 0
    let couponId = null

    if (data.couponCode) {
      const { data: coupon, error: couponError } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", data.couponCode.toUpperCase())
        .eq("is_active", true)
        .single()

      if (!couponError && coupon) {
        // Validate coupon
        const now = new Date()
        const validFrom = new Date(coupon.valid_from)
        const validUntil = new Date(coupon.valid_until)

        if (now >= validFrom && now <= validUntil && totalPrice >= coupon.min_purchase) {
          if (!coupon.max_uses || coupon.current_uses < coupon.max_uses) {
            // Calculate discount
            if (coupon.discount_type === "percentage") {
              discountAmount = (totalPrice * Number(coupon.discount_value)) / 100
            } else {
              discountAmount = Number(coupon.discount_value)
            }
            couponId = coupon.id
          }
        }
      }
    }

    const finalPrice = totalPrice - discountAmount

    // 4. Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        store_id: data.storeId,
        customer_id: data.customerId,
        barber_id: data.barberId,
        appointment_date: data.date.split("T")[0], // Extract date part
        appointment_time: data.time,
        total_price: totalPrice,
        discount_amount: discountAmount,
        final_price: finalPrice,
        status: "pending",
        notes: data.notes || null,
      })
      .select()
      .single()

    if (appointmentError) throw appointmentError

    // 5. Create appointment_services records
    const appointmentServices = services.map((service) => ({
      appointment_id: appointment.id,
      service_id: service.id,
      price: service.price,
    }))

    const { error: servicesLinkError } = await supabase.from("appointment_services").insert(appointmentServices)

    if (servicesLinkError) throw servicesLinkError

    // 6. Update coupon usage if coupon was used
    // NOTE: Coupon usage tracking is handled by managers/admin
    // TODO: Add coupon_id field to appointments table and create a trigger to auto-increment
    // For now, managers can manually verify and update coupon usage from dashboard

    return { success: true, appointmentId: appointment.id, appointment }
  } catch (error) {
    console.error("[createAppointment] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Creates a new customer in the database
 */
export async function createCustomer(data: CreateCustomerData) {
  const supabase = createClient()

  try {
    // Check if customer already exists with this phone
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", data.phone)
      .eq("store_id", data.storeId)
      .single()

    if (existingCustomer) {
      return { success: true, customerId: existingCustomer.id, customer: existingCustomer }
    }

    // Create new customer
    const { data: customer, error } = await supabase
      .from("customers")
      .insert({
        store_id: data.storeId,
        name: data.name,
        email: data.email || null,
        phone: data.phone,
        loyalty_points: 0,
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, customerId: customer.id, customer }
  } catch (error) {
    console.error("[createCustomer] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Creates a customer and their appointment in one transaction
 */
export async function createCustomerAndAppointment(
  customerData: CreateCustomerData,
  appointmentData: Omit<CreateAppointmentData, "customerId">,
) {
  // First create the customer
  const customerResult = await createCustomer(customerData)

  if (!customerResult.success) {
    return { success: false, error: customerResult.error }
  }

  // Then create the appointment with the customer ID
  const appointmentResult = await createAppointment({
    ...appointmentData,
    customerId: customerResult.customerId,
  })

  if (!appointmentResult.success) {
    return { success: false, error: appointmentResult.error }
  }

  return {
    success: true,
    appointmentId: appointmentResult.appointmentId,
    customerId: customerResult.customerId,
  }
}

/**
 * Gets appointment details by ID
 */
export async function getAppointmentById(appointmentId: string) {
  const supabase = createClient()

  try {
    const { data: appointment, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        customer:customers(*),
        barber:barbers(id, name, email),
        store:stores(id, name, address, phone),
        appointment_services(
          service_id,
          price,
          service:services(id, name, description, duration)
        )
      `,
      )
      .eq("id", appointmentId)
      .single()

    if (error) throw error

    return { success: true, appointment }
  } catch (error) {
    console.error("[getAppointmentById] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Gets customer by phone number
 */
export async function getCustomerByPhone(phone: string, storeId: string) {
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
        // No rows returned
        return { success: true, customer: null }
      }
      throw error
    }

    return { success: true, customer }
  } catch (error) {
    console.error("[getCustomerByPhone] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
