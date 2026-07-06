import { NextResponse } from "next/server"
import { getSessionUserId } from "@/lib/session"
import { updateUserAccount } from "@/features/settings/services/user-settings-service"

export async function PUT(request: Request) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Não autenticado" },
      { status: 401 }
    )
  }

  try {
    const data = await request.json()
    
    // Validação básica de confirmação de senha no servidor
    if (data.newPassword && data.newPassword !== data.confirmPassword) {
      return NextResponse.json(
        { success: false, message: "As senhas não coincidem." },
        { status: 400 }
      )
    }

    await updateUserAccount(userId, data)

    return NextResponse.json({
      success: true,
      message: "Conta atualizada com sucesso!",
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}
