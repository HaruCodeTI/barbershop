/**
 * Cron endpoint to send appointment reminders
 *
 * This endpoint should be called:
 * - Every hour to check for appointments 24h away (email reminders)
 * - Every 15 minutes to check for appointments 1h away (SMS reminders)
 *
 * Setup with Vercel Cron (vercel.json):
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/send-reminders?type=email",
 *       "schedule": "0 * * * *"
 *     },
 *     {
 *       "path": "/api/cron/send-reminders?type=sms",
 *       "schedule": "*/15 * * * *"
 *     }
 *   ]
 * }
 *
 * Or use external cron service (cron-job.org, GitHub Actions, etc.)
 */

import { NextRequest, NextResponse } from "next/server"
import { sendAppointmentReminders } from "@/lib/notifications/reminders"

// Verify the request is from a trusted source
function verifyAuthorization(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  // In production, verify the secret
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return false
  }

  // In development, allow without secret
  if (!cronSecret && process.env.NODE_ENV === "development") {
    return true
  }

  return true
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyAuthorization(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") || "email" // email or sms

    console.log(`[send-reminders] Starting ${type} reminder job...`)

    // Determine reminder window based on type
    const hoursBeforeAppointment = type === "sms" ? 1 : 24

    const result = await sendAppointmentReminders(hoursBeforeAppointment)

    console.log(`[send-reminders] ${type} reminders completed:`, {
      processed: result.processed,
      sent: result.sent,
      failed: result.failed,
    })

    return NextResponse.json({
      success: true,
      type,
      hoursBeforeAppointment,
      ...result,
    })
  } catch (error) {
    console.error("[send-reminders] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Allow POST as well (some cron services prefer POST)
export async function POST(request: NextRequest) {
  return GET(request)
}
