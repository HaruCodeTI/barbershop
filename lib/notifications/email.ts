/**
 * Email notification service using Resend
 * https://resend.com/docs
 */

export interface EmailData {
  to: string
  subject: string
  html: string
  from?: string
}

export interface AppointmentEmailData {
  customerName: string
  customerEmail: string
  barberName: string
  storeName: string
  storeAddress: string
  storePhone: string
  appointmentDate: string
  appointmentTime: string
  services: string[]
  totalPrice: number
  bookingReference: string
}

/**
 * Sends an email using Resend API
 */
export async function sendEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
  // Check if API key is configured
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn("[sendEmail] RESEND_API_KEY not configured - email not sent")
    return {
      success: false,
      error: "Email service not configured. Please set RESEND_API_KEY environment variable.",
    }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: data.from || "GoBarber <noreply@gobarber.com>",
        to: data.to,
        subject: data.subject,
        html: data.html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[sendEmail] Resend API error:", error)
      return { success: false, error: `Failed to send email: ${error}` }
    }

    const result = await response.json()
    console.log("[sendEmail] Email sent successfully:", result.id)
    return { success: true }
  } catch (error) {
    console.error("[sendEmail] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Sends appointment confirmation email
 */
export async function sendAppointmentConfirmation(data: AppointmentEmailData) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Agendamento</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .appointment-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6c757d; font-weight: 600; }
    .detail-value { color: #212529; }
    .services-list { margin: 10px 0; padding-left: 20px; }
    .total { font-size: 18px; font-weight: bold; color: #667eea; margin-top: 15px; padding-top: 15px; border-top: 2px solid #667eea; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
    .reference { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center; }
    .reference strong { color: #856404; font-size: 18px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Agendamento Confirmado!</h1>
      <p style="margin: 10px 0 0;">Seu horário foi reservado com sucesso</p>
    </div>

    <div class="content">
      <p>Olá <strong>${data.customerName}</strong>,</p>
      <p>Seu agendamento foi confirmado! Veja os detalhes abaixo:</p>

      <div class="reference">
        <p style="margin: 0;">Referência do Agendamento</p>
        <strong>${data.bookingReference}</strong>
      </div>

      <div class="appointment-box">
        <div class="detail-row">
          <span class="detail-label">📅 Data:</span>
          <span class="detail-value">${data.appointmentDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🕐 Horário:</span>
          <span class="detail-value">${data.appointmentTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">💈 Barbeiro:</span>
          <span class="detail-value">${data.barberName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">📍 Local:</span>
          <span class="detail-value">${data.storeName}</span>
        </div>
      </div>

      <h3>Serviços:</h3>
      <ul class="services-list">
        ${data.services.map((service) => `<li>${service}</li>`).join("")}
      </ul>

      <div class="total">
        Total: R$ ${data.totalPrice.toFixed(2)}
      </div>

      <h3>Endereço:</h3>
      <p>${data.storeAddress}</p>
      <p>📞 ${data.storePhone}</p>

      <p style="margin-top: 30px;">
        <strong>Importante:</strong> Por favor, chegue com 5-10 minutos de antecedência.
        Se precisar cancelar ou remarcar, entre em contato conosco.
      </p>
    </div>

    <div class="footer">
      <p><strong>${data.storeName}</strong></p>
      <p>Este é um email automático, por favor não responda.</p>
      <p>© ${new Date().getFullYear()} GoBarber. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `

  return sendEmail({
    to: data.customerEmail,
    subject: `✅ Agendamento Confirmado - ${data.storeName}`,
    html,
  })
}

/**
 * Sends appointment reminder email (24h before)
 */
export async function sendAppointmentReminder(data: AppointmentEmailData) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lembrete de Agendamento</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .reminder-box { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
    .reminder-box h2 { margin: 0 0 10px; color: #856404; }
    .appointment-box { background: #f8f9fa; border-left: 4px solid #f5576c; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6c757d; font-weight: 600; }
    .detail-value { color: #212529; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Lembrete de Agendamento</h1>
      <p style="margin: 10px 0 0;">Seu horário é amanhã!</p>
    </div>

    <div class="content">
      <p>Olá <strong>${data.customerName}</strong>,</p>

      <div class="reminder-box">
        <h2>🗓️ Não esqueça!</h2>
        <p style="margin: 0; font-size: 18px;">Seu agendamento é amanhã às <strong>${data.appointmentTime}</strong></p>
      </div>

      <div class="appointment-box">
        <div class="detail-row">
          <span class="detail-label">📅 Data:</span>
          <span class="detail-value">${data.appointmentDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🕐 Horário:</span>
          <span class="detail-value">${data.appointmentTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">💈 Barbeiro:</span>
          <span class="detail-value">${data.barberName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">📍 Local:</span>
          <span class="detail-value">${data.storeName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🔖 Referência:</span>
          <span class="detail-value">${data.bookingReference}</span>
        </div>
      </div>

      <h3>Endereço:</h3>
      <p><strong>${data.storeAddress}</strong></p>
      <p>📞 ${data.storePhone}</p>

      <p style="margin-top: 30px; background: #e7f3ff; padding: 15px; border-radius: 4px;">
        💡 <strong>Dica:</strong> Chegue com 5-10 minutos de antecedência para garantir que
        seu atendimento comece no horário!
      </p>
    </div>

    <div class="footer">
      <p><strong>${data.storeName}</strong></p>
      <p>Este é um email automático, por favor não responda.</p>
      <p>© ${new Date().getFullYear()} GoBarber. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `

  return sendEmail({
    to: data.customerEmail,
    subject: `⏰ Lembrete: Seu agendamento é amanhã - ${data.storeName}`,
    html,
  })
}

/**
 * Sends appointment cancellation email
 */
export async function sendAppointmentCancellation(data: AppointmentEmailData) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agendamento Cancelado</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #868f96 0%, #596164 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .cancellation-box { background: #f8d7da; border: 2px solid #dc3545; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
    .appointment-box { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
    .detail-row:last-child { border-bottom: none; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Agendamento Cancelado</h1>
      <p style="margin: 10px 0 0;">Confirmação de cancelamento</p>
    </div>

    <div class="content">
      <p>Olá <strong>${data.customerName}</strong>,</p>

      <div class="cancellation-box">
        <h2 style="margin: 0 0 10px; color: #721c24;">Agendamento Cancelado</h2>
        <p style="margin: 0;">Referência: <strong>${data.bookingReference}</strong></p>
      </div>

      <p>Seu agendamento foi cancelado conforme solicitado:</p>

      <div class="appointment-box">
        <div class="detail-row">
          <span>📅 Data:</span>
          <span>${data.appointmentDate}</span>
        </div>
        <div class="detail-row">
          <span>🕐 Horário:</span>
          <span>${data.appointmentTime}</span>
        </div>
        <div class="detail-row">
          <span>💈 Barbeiro:</span>
          <span>${data.barberName}</span>
        </div>
        <div class="detail-row">
          <span>📍 Local:</span>
          <span>${data.storeName}</span>
        </div>
      </div>

      <p style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://gobarber.com"}/customer/service" class="button">
          Agendar Novo Horário
        </a>
      </p>

      <p style="margin-top: 30px; color: #6c757d;">
        Esperamos vê-lo em breve! Se precisar de ajuda, entre em contato conosco.
      </p>
    </div>

    <div class="footer">
      <p><strong>${data.storeName}</strong></p>
      <p>${data.storePhone}</p>
      <p>© ${new Date().getFullYear()} GoBarber. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `

  return sendEmail({
    to: data.customerEmail,
    subject: `❌ Agendamento Cancelado - ${data.storeName}`,
    html,
  })
}
