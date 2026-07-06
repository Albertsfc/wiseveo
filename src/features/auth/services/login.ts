import { LoginFormData, LoginResponse } from "../types"

export async function submitLogin(data: LoginFormData): Promise<LoginResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  return res.json()
}
