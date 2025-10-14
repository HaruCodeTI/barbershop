import { NextRequest, NextResponse } from "next/server"
import { staffSignIn } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    console.log("[API] Staff login attempt for:", email)

    // Call staffSignIn (bcrypt works fine on server-side)
    const result = await staffSignIn(email, password)

    console.log("[API] Login result:", { success: result.success, hasStaff: !!result.staff, requiresPasswordSetup: result.requiresPasswordSetup })

    // Check if staff needs to set up password
    if (result.requiresPasswordSetup) {
      return NextResponse.json({
        success: false,
        requiresPasswordSetup: true,
        staffId: result.staffId,
        error: result.error,
      })
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Erro ao fazer login" },
        { status: 401 }
      )
    }

    // Return success with staff data and token
    return NextResponse.json({
      success: true,
      token: result.token,
      staff: result.staff,
    })
  } catch (error) {
    console.error("[API] Staff login error:", error)
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
