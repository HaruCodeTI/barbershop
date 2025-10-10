import jsPDF from "jspdf"
import QRCode from "qrcode"
import { createEvent, EventAttributes, DateArray } from "ics"

export interface AppointmentData {
  id: string
  bookingReference: string
  customer: {
    name: string
    email?: string
    phone: string
  }
  barber: {
    name: string
  }
  store: {
    name: string
    address: string
    phone: string
  }
  date: Date
  time: string
  services: Array<{
    name: string
    price: number
    duration: number
  }>
  totalPrice: number
  discountAmount?: number
  duration: number
}

/**
 * Generates and downloads a PDF receipt for the appointment
 */
export async function downloadAppointmentPDF(appointment: AppointmentData) {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 20
  let yPosition = 20

  // Header
  pdf.setFontSize(24)
  pdf.setFont("helvetica", "bold")
  pdf.text("GoBarber", margin, yPosition)

  pdf.setFontSize(12)
  pdf.setFont("helvetica", "normal")
  yPosition += 8
  pdf.text("Comprovante de Agendamento", margin, yPosition)

  // QR Code
  try {
    const qrCodeDataURL = await QRCode.toDataURL(appointment.bookingReference, {
      width: 100,
      margin: 1,
    })
    pdf.addImage(qrCodeDataURL, "PNG", pageWidth - 50, 15, 35, 35)
  } catch (error) {
    console.error("Error generating QR code:", error)
  }

  // Booking Reference
  yPosition += 15
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "bold")
  pdf.text("Código de Referência:", margin, yPosition)
  pdf.setFont("helvetica", "normal")
  pdf.text(appointment.bookingReference, margin + 50, yPosition)

  // Divider
  yPosition += 10
  pdf.setDrawColor(200, 200, 200)
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)

  // Customer Information
  yPosition += 10
  pdf.setFontSize(14)
  pdf.setFont("helvetica", "bold")
  pdf.text("Informações do Cliente", margin, yPosition)

  yPosition += 8
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")
  pdf.text(`Nome: ${appointment.customer.name}`, margin, yPosition)

  yPosition += 6
  if (appointment.customer.email) {
    pdf.text(`E-mail: ${appointment.customer.email}`, margin, yPosition)
    yPosition += 6
  }
  pdf.text(`Telefone: ${appointment.customer.phone}`, margin, yPosition)

  // Appointment Details
  yPosition += 15
  pdf.setFontSize(14)
  pdf.setFont("helvetica", "bold")
  pdf.text("Detalhes do Agendamento", margin, yPosition)

  yPosition += 8
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")

  const formattedDate = appointment.date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  pdf.text(`Data: ${formattedDate}`, margin, yPosition)

  yPosition += 6
  pdf.text(`Horário: ${appointment.time} (${appointment.duration} minutos)`, margin, yPosition)

  yPosition += 6
  pdf.text(`Barbeiro: ${appointment.barber.name}`, margin, yPosition)

  // Services
  yPosition += 15
  pdf.setFontSize(14)
  pdf.setFont("helvetica", "bold")
  pdf.text("Serviços", margin, yPosition)

  yPosition += 8
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")

  appointment.services.forEach((service) => {
    pdf.text(service.name, margin, yPosition)
    pdf.text(`R$ ${service.price.toFixed(2)}`, pageWidth - margin - 30, yPosition, { align: "right" })
    yPosition += 6
  })

  // Total
  yPosition += 5
  pdf.setDrawColor(200, 200, 200)
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)

  yPosition += 8
  if (appointment.discountAmount && appointment.discountAmount > 0) {
    pdf.setFont("helvetica", "normal")
    pdf.text("Desconto:", margin, yPosition)
    pdf.text(`- R$ ${appointment.discountAmount.toFixed(2)}`, pageWidth - margin - 30, yPosition, { align: "right" })
    yPosition += 6
  }

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(12)
  pdf.text("Total:", margin, yPosition)
  pdf.text(`R$ ${appointment.totalPrice.toFixed(2)}`, pageWidth - margin - 30, yPosition, { align: "right" })

  // Store Information
  yPosition += 20
  pdf.setFontSize(14)
  pdf.text("Local", margin, yPosition)

  yPosition += 8
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")
  pdf.text(appointment.store.name, margin, yPosition)

  yPosition += 6
  pdf.text(appointment.store.address, margin, yPosition)

  yPosition += 6
  pdf.text(`Tel: ${appointment.store.phone}`, margin, yPosition)

  // Footer
  yPosition += 20
  pdf.setFontSize(8)
  pdf.setTextColor(128, 128, 128)
  const footerText = "Obrigado por escolher o GoBarber! Por favor, chegue 5 minutos antes do horário agendado."
  pdf.text(footerText, pageWidth / 2, yPosition, { align: "center", maxWidth: pageWidth - 2 * margin })

  // Download
  pdf.save(`comprovante-${appointment.bookingReference}.pdf`)
}

/**
 * Generates and downloads an ICS calendar file for the appointment
 */
export function downloadAppointmentICS(appointment: AppointmentData) {
  // Parse date and time
  const [hours, minutes] = appointment.time.split(":").map(Number)
  const startDate = new Date(appointment.date)
  startDate.setHours(hours, minutes, 0, 0)

  const endDate = new Date(startDate)
  endDate.setMinutes(endDate.getMinutes() + appointment.duration)

  // Convert to DateArray format [year, month, day, hour, minute]
  const start: DateArray = [
    startDate.getFullYear(),
    startDate.getMonth() + 1, // ICS months are 1-indexed
    startDate.getDate(),
    startDate.getHours(),
    startDate.getMinutes(),
  ]

  const end: DateArray = [
    endDate.getFullYear(),
    endDate.getMonth() + 1,
    endDate.getDate(),
    endDate.getHours(),
    endDate.getMinutes(),
  ]

  const event: EventAttributes = {
    start,
    end,
    title: `Agendamento - ${appointment.store.name}`,
    description: `Serviços: ${appointment.services.map((s) => s.name).join(", ")}\nBarbeiro: ${appointment.barber.name}\nCódigo: ${appointment.bookingReference}`,
    location: `${appointment.store.name}, ${appointment.store.address}`,
    status: "CONFIRMED",
    busyStatus: "BUSY",
    organizer: { name: appointment.store.name, email: "contato@gobarber.com" },
    alarms: [
      {
        action: "display",
        description: "Lembrete: Seu agendamento é em 15 minutos",
        trigger: { minutes: 15, before: true },
      },
      {
        action: "display",
        description: "Lembrete: Seu agendamento é amanhã",
        trigger: { hours: 24, before: true },
      },
    ],
  }

  createEvent(event, (error, value) => {
    if (error) {
      console.error("Error creating calendar event:", error)
      return
    }

    // Create blob and download
    const blob = new Blob([value], { type: "text/calendar;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `agendamento-${appointment.bookingReference}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  })
}
