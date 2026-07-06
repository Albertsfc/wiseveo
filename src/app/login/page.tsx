import { Suspense } from "react"
import { AuthPage } from "@/features/auth/components/AuthPage"
import { isGoogleConfigured } from "@/lib/google-auth"

export default function LoginPage() {
  const showGoogle = isGoogleConfigured()
  return (
    <Suspense>
      <AuthPage showGoogle={showGoogle} />
    </Suspense>
  )
}
