/**
 * SMS notification service using Twilio
 * https://www.twilio.com/docs/sms
 */

export interface SMSData {
  to: string
  message: string
}

export interface AppointmentSMSData {
  customerName: string
  customerPhone: string
  barberName: string
  storeName: string
  appointmentDate: string
  appointmentTime: string
  bookingReference: string
}

/**
 * Sends an SMS using Twilio API
 */
export async function sendSMS(data: SMSData): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("[sendSMS] Twilio not configured - SMS not sent")
    return {
      success: false,
      error: "SMS service not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.",
    }
  }

  try {
    // Format phone number to E.164 format if needed
    const formattedPhone = data.to.startsWith("+") ? data.to : `+55${data.to.replace(/\D/g, "")}`

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: formattedPhone,
        Body: data.message,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[sendSMS] Twilio API error:", error)
      return { success: false, error: `Failed to send SMS: ${error}` }
    }

    const result = await response.json()
    console.log("[sendSMS] SMS sent successfully:", result.sid)
    return { success: true }
  } catch (error) {
    console.error("[sendSMS] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Sends appointment confirmation SMS
 */
export async function sendAppointmentConfirmationSMS(data: AppointmentSMSData) {
  const message = `✅ GoBarber - Agendamento Confirmado!

Olá ${data.customerName}!

📅 Data: ${data.appointmentDate}
🕐 Horário: ${data.appointmentTime}
💈 Barbeiro: ${data.barberName}
📍 Local: ${data.storeName}
🔖 Ref: ${data.bookingReference}

Chegue com 5-10 min de antecedência.

Até breve!`

  return sendSMS({
    to: data.customerPhone,
    message,
  })
}

/**
 * Sends appointment reminder SMS (1h before)
 */
export async function sendAppointmentReminderSMS(data: AppointmentSMSData) {
  const message = `⏰ GoBarber - Lembrete!

Olá ${data.customerName}!

Seu agendamento é HOJE às ${data.appointmentTime}!

💈 ${data.barberName}
📍 ${data.storeName}
🔖 Ref: ${data.bookingReference}

Não esqueça! Até já! 👋`

  return sendSMS({
    to: data.customerPhone,
    message,
  })
}

/**
 * Sends appointment cancellation SMS
 */
export async function sendAppointmentCancellationSMS(data: AppointmentSMSData) {
  const message = `❌ GoBarber - Cancelamento

Olá ${data.customerName},

Seu agendamento foi cancelado:

📅 ${data.appointmentDate} às ${data.appointmentTime}
🔖 Ref: ${data.bookingReference}

Esperamos vê-lo em breve! Para agendar novamente, acesse nosso site.`

  return sendSMS({
    to: data.customerPhone,
    message,
  })
}
