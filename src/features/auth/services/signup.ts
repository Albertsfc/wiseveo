import { SignupFormData, SignupResponse } from "../types"

export async function submitSignup(data: SignupFormData): Promise<SignupResponse> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  return res.json()
}
