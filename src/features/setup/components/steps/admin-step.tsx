"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Eye, EyeOff } from "lucide-react"

interface AdminStepProps {
  admin: { name: string; email: string; password: string; confirmPassword: string }
  onAdminChange: (field: string, value: string) => void
  onNext: () => void
  onBack: () => void
}

export function AdminStep({
 admin, onAdminChange, onNext, onBack }: AdminStepProps) {
  const t = useTranslations("setup.admin")
  const tc = useTranslations("setup.common")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!admin.name.trim()) newErrors.name = t("errors.nameRequired")
    if (!admin.email.trim()) newErrors.email = t("errors.emailRequired")
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admin.email))
      newErrors.email = t("errors.emailInvalid")
    if (!admin.password) newErrors.password = t("errors.passwordRequired")
    else if (admin.password.length < 6)
      newErrors.password = t("errors.passwordMin")
    if (admin.password !== admin.confirmPassword)
      newErrors.confirmPassword = t("errors.passwordMismatch")

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) onNext()
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center">
        <div className="inline-flex p-3 rounded-xl bg-primary/10 border border-primary/20 mb-3">
          <UserPlus className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("subtitle")}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin-name">{t("nameLabel")}</Label>
          <Input
            id="admin-name"
            value={admin.name}
            onChange={(e) => onAdminChange("name", e.target.value)}
            placeholder={t("namePlaceholder")}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-email">{t("emailLabel")}</Label>
          <Input
            id="admin-email"
            type="email"
            value={admin.email}
            onChange={(e) => onAdminChange("email", e.target.value)}
            placeholder={t("emailPlaceholder")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-password">{t("passwordLabel")}</Label>
          <div className="relative">
            <Input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              value={admin.password}
              onChange={(e) => onAdminChange("password", e.target.value)}
              placeholder={t("passwordPlaceholder")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-confirm">{t("confirmPasswordLabel")}</Label>
          <Input
            id="admin-confirm"
            type={showPassword ? "text" : "password"}
            value={admin.confirmPassword}
            onChange={(e) => onAdminChange("confirmPassword", e.target.value)}
            placeholder={t("confirmPasswordPlaceholder")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          {tc("back")}
        </Button>
        <Button onClick={handleNext} className="flex-1">
          {tc("next")}
        </Button>
      </div>
    </div>
  )
}
