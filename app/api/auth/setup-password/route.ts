import { NextRequest, NextResponse } from "next/server"
import { setStaffPassword } from "@/lib/auth"
import { createClient } from "@/lib/supabase/client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { staffId, email, password } = body

    if (!staffId || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Todos os campos são obrigatórios" },
        { status: 400 }
      )
    }

    // Verificar se o staffId e email correspondem (segurança)
    const supabase = createClient()
    const { data: staff, error: staffError } = await supabase
      .from("barbers")
      .select("id, email, password_hash")
      .eq("id", staffId)
      .eq("email", email)
      .single()

    if (staffError || !staff) {
      return NextResponse.json(
        { success: false, error: "Staff não encontrado ou dados inválidos" },
        { status: 404 }
      )
    }

    // Verificar se já tem senha cadastrada
    if (staff.password_hash) {
      return NextResponse.json(
        { success: false, error: "Este usuário já possui senha cadastrada" },
        { status: 400 }
      )
    }

    // Validar senha (mínimo 6 caracteres)
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "A senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      )
    }

    // Definir senha
    const result = await setStaffPassword(staffId, password)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Erro ao definir senha" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Senha definida com sucesso! Você já pode fazer login.",
    })
  } catch (error) {
    console.error("[API] Setup password error:", error)
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
