/**
 * Central notifications service
 * Integrates Email (Resend) and SMS (Twilio) notifications
 */

import {
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendAppointmentCancellation,
  type AppointmentEmailData,
} from "./email"
import {
  sendAppointmentConfirmationSMS,
  sendAppointmentReminderSMS,
  sendAppointmentCancellationSMS,
  type AppointmentSMSData,
} from "./sms"

export interface NotificationData {
  customerName: string
  customerEmail: string
  customerPhone: string
  barberName: string
  storeName: string
  storeAddress: string
  storePhone: string
  appointmentDate: string // DD/MM/YYYY format
  appointmentTime: string // HH:MM format
  services: string[]
  totalPrice: number
  bookingReference: string
}

export interface NotificationResult {
  success: boolean
  emailSent: boolean
  smsSent: boolean
  errors: string[]
}

/**
 * Sends appointment confirmation (Email + SMS)
 */
export async function sendAppointmentConfirmationNotification(
  data: NotificationData,
): Promise<NotificationResult> {
  const errors: string[] = []
  let emailSent = false
  let smsSent = false

  // Send Email
  try {
    const emailData: AppointmentEmailData = {
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      barberName: data.barberName,
      storeName: data.storeName,
      storeAddress: data.storeAddress,
      storePhone: data.storePhone,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      services: data.services,
      totalPrice: data.totalPrice,
      bookingReference: data.bookingReference,
    }

    const emailResult = await sendAppointmentConfirmation(emailData)
    if (emailResult.success) {
      emailSent = true
    } else if (emailResult.error) {
      errors.push(`Email: ${emailResult.error}`)
    }
  } catch (error) {
    errors.push(`Email: ${error instanceof Error ? error.message : "Unknown error"}`)
  }

  // Send SMS
  try {
    const smsData: AppointmentSMSData = {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      barberName: data.barberName,
      storeName: data.storeName,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      bookingReference: data.bookingReference,
    }

    const smsResult = await sendAppointmentConfirmationSMS(smsData)
    if (smsResult.success) {
      smsSent = true
    } else if (smsResult.error) {
      errors.push(`SMS: ${smsResult.error}`)
    }
  } catch (error) {
    errors.push(`SMS: ${error instanceof Error ? error.message : "Unknown error"}`)
  }

  return {
    success: emailSent || smsSent,
    emailSent,
    smsSent,
    errors,
  }
}

/**
 * Sends appointment reminder (Email + SMS)
 */
export async function sendAppointmentReminderNotification(data: NotificationData): Promise<NotificationResult> {
  const errors: string[] = []
  let emailSent = false
  let smsSent = false

  // Send Email
  try {
    const emailData: AppointmentEmailData = {
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      barberName: data.barberName,
      storeName: data.storeName,
      storeAddress: data.storeAddress,
      storePhone: data.storePhone,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      services: data.services,
      totalPrice: data.totalPrice,
      bookingReference: data.bookingReference,
    }

    const emailResult = await sendAppointmentReminder(emailData)
    if (emailResult.success) {
      emailSent = true
    } else if (emailResult.error) {
      errors.push(`Email: ${emailResult.error}`)
    }
  } catch (error) {
    errors.push(`Email: ${error instanceof Error ? error.message : "Unknown error"}`)
  }

  // Send SMS
  try {
    const smsData: AppointmentSMSData = {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      barberName: data.barberName,
      storeName: data.storeName,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      bookingReference: data.bookingReference,
    }

    const smsResult = await sendAppointmentReminderSMS(smsData)
    if (smsResult.success) {
      smsSent = true
    } else if (smsResult.error) {
      errors.push(`SMS: ${smsResult.error}`)
    }
  } catch (error) {
    errors.push(`SMS: ${error instanceof Error ? error.message : "Unknown error"}`)
  }

  return {
    success: emailSent || smsSent,
    emailSent,
    smsSent,
    errors,
  }
}

/**
 * Sends appointment cancellation (Email + SMS)
 */
export async function sendAppointmentCancellationNotification(
  data: NotificationData,
): Promise<NotificationResult> {
  const errors: string[] = []
  let emailSent = false
  let smsSent = false

  // Send Email
  try {
    const emailData: AppointmentEmailData = {
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      barberName: data.barberName,
      storeName: data.storeName,
      storeAddress: data.storeAddress,
      storePhone: data.storePhone,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      services: data.services,
      totalPrice: data.totalPrice,
      bookingReference: data.bookingReference,
    }

    const emailResult = await sendAppointmentCancellation(emailData)
    if (emailResult.success) {
      emailSent = true
    } else if (emailResult.error) {
      errors.push(`Email: ${emailResult.error}`)
    }
  } catch (error) {
    errors.push(`Email: ${error instanceof Error ? error.message : "Unknown error"}`)
  }

  // Send SMS
  try {
    const smsData: AppointmentSMSData = {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      barberName: data.barberName,
      storeName: data.storeName,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      bookingReference: data.bookingReference,
    }

    const smsResult = await sendAppointmentCancellationSMS(smsData)
    if (smsResult.success) {
      smsSent = true
    } else if (smsResult.error) {
      errors.push(`SMS: ${smsResult.error}`)
    }
  } catch (error) {
    errors.push(`SMS: ${error instanceof Error ? error.message : "Unknown error"}`)
  }

  return {
    success: emailSent || smsSent,
    emailSent,
    smsSent,
    errors,
  }
}

/**
 * Helper to format date for notifications
 */
export function formatDateForNotification(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

/**
 * Helper to format time for notifications
 */
export function formatTimeForNotification(time: string): string {
  return time.substring(0, 5) // HH:MM
}

/**
 * Helper to generate booking reference
 */
export function generateBookingReference(appointmentId: string): string {
  return `GB${appointmentId.slice(-8).toUpperCase()}`
}
