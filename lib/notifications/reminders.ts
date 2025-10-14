/**
 * Automated appointment reminder system
 * Sends reminders to customers before their appointments
 */

import { createClient } from "../supabase/server"
import {
  sendAppointmentReminderNotification,
  formatDateForNotification,
  formatTimeForNotification,
  generateBookingReference,
} from "./index"

export interface ReminderResult {
  processed: number
  sent: number
  failed: number
  errors: Array<{
    appointmentId: string
    error: string
  }>
}

/**
 * Finds and sends reminders for appointments within a specific time window
 * @param hoursBeforeAppointment - How many hours before the appointment to send reminder (e.g., 24 for email, 1 for SMS)
 */
export async function sendAppointmentReminders(hoursBeforeAppointment: number): Promise<ReminderResult> {
  const supabase = createClient()

  const result: ReminderResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    errors: [],
  }

  try {
    // Calculate time window
    const now = new Date()
    const targetTime = new Date(now.getTime() + hoursBeforeAppointment * 60 * 60 * 1000)

    // Add buffer (±30 minutes for 24h, ±5 minutes for 1h)
    const bufferMinutes = hoursBeforeAppointment >= 24 ? 30 : 5
    const windowStart = new Date(targetTime.getTime() - bufferMinutes * 60 * 1000)
    const windowEnd = new Date(targetTime.getTime() + bufferMinutes * 60 * 1000)

    console.log(`[sendAppointmentReminders] Looking for appointments between:`, {
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      hoursBeforeAppointment,
    })

    // Find appointments in the time window that need reminders
    const { data: appointments, error: fetchError } = await supabase
      .from("appointments")
      .select(
        `
        *,
        customer:customers(name, email, phone),
        barber:barbers(name),
        store:stores(name, address, phone),
        appointment_services(
          service:services(name)
        )
      `,
      )
      .in("status", ["pending", "confirmed"])
      .gte("appointment_date", windowStart.toISOString().split("T")[0])
      .lte("appointment_date", windowEnd.toISOString().split("T")[0])

    if (fetchError) {
      console.error("[sendAppointmentReminders] Fetch error:", fetchError)
      throw fetchError
    }

    if (!appointments || appointments.length === 0) {
      console.log("[sendAppointmentReminders] No appointments found in time window")
      return result
    }

    console.log(`[sendAppointmentReminders] Found ${appointments.length} appointments to check`)

    // Filter appointments to those in the exact time window
    const appointmentsToRemind = appointments.filter((apt) => {
      const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`)
      return appointmentDateTime >= windowStart && appointmentDateTime <= windowEnd
    })

    console.log(
      `[sendAppointmentReminders] ${appointmentsToRemind.length} appointments within exact time window`,
    )

    result.processed = appointmentsToRemind.length

    // Send reminders
    for (const appointment of appointmentsToRemind) {
      try {
        // Validate appointment has all required data
        if (!appointment.customer || !appointment.barber || !appointment.store) {
          console.warn(`[sendAppointmentReminders] Skipping appointment ${appointment.id} - missing data`)
          result.failed++
          result.errors.push({
            appointmentId: appointment.id,
            error: "Missing customer, barber, or store data",
          })
          continue
        }

        // Check if reminder was already sent (to prevent duplicates)
        // We check the metadata field for reminder tracking
        if (appointment.metadata && typeof appointment.metadata === "object") {
          const metadata = appointment.metadata as any
          const reminderKey = hoursBeforeAppointment >= 24 ? "email_reminder_sent" : "sms_reminder_sent"

          if (metadata[reminderKey]) {
            console.log(
              `[sendAppointmentReminders] Skipping appointment ${appointment.id} - ${reminderKey} already sent`,
            )
            continue
          }
        }

        console.log(`[sendAppointmentReminders] Sending reminder for appointment ${appointment.id}`)

        const notificationResult = await sendAppointmentReminderNotification({
          customerName: appointment.customer.name,
          customerEmail: appointment.customer.email || "",
          customerPhone: appointment.customer.phone,
          barberName: appointment.barber.name,
          storeName: appointment.store.name,
          storeAddress: appointment.store.address || "",
          storePhone: appointment.store.phone || "",
          appointmentDate: formatDateForNotification(new Date(appointment.appointment_date)),
          appointmentTime: formatTimeForNotification(appointment.appointment_time),
          services: appointment.appointment_services.map((as: any) => as.service.name),
          totalPrice: Number(appointment.final_price),
          bookingReference: generateBookingReference(appointment.id),
        })

        if (notificationResult.success) {
          result.sent++

          // Mark reminder as sent in metadata
          const reminderKey = hoursBeforeAppointment >= 24 ? "email_reminder_sent" : "sms_reminder_sent"
          const updatedMetadata = {
            ...(appointment.metadata || {}),
            [reminderKey]: true,
            [`${reminderKey}_at`]: new Date().toISOString(),
          }

          await supabase.from("appointments").update({ metadata: updatedMetadata }).eq("id", appointment.id)

          console.log(`[sendAppointmentReminders] Reminder sent successfully for appointment ${appointment.id}`)
        } else {
          result.failed++
          result.errors.push({
            appointmentId: appointment.id,
            error: notificationResult.errors.join(", "),
          })
          console.error(
            `[sendAppointmentReminders] Failed to send reminder for appointment ${appointment.id}:`,
            notificationResult.errors,
          )
        }
      } catch (error) {
        result.failed++
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        result.errors.push({
          appointmentId: appointment.id,
          error: errorMessage,
        })
        console.error(`[sendAppointmentReminders] Error processing appointment ${appointment.id}:`, error)
      }
    }

    console.log("[sendAppointmentReminders] Completed:", result)
    return result
  } catch (error) {
    console.error("[sendAppointmentReminders] Fatal error:", error)
    throw error
  }
}
