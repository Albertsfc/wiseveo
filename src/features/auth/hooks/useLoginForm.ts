"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LoginFormData } from "../types"
import { submitLogin } from "../services/login"

interface FormErrors {
  email?: string
  password?: string
}

interface TouchedFields {
  email: boolean
  password: boolean
}

export function useLoginForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<TouchedFields>({
    email: false,
    password: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  function validate(data: LoginFormData): FormErrors {
    const errs: FormErrors = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errs.email = "Email inválido"
    if (data.password.length < 1)
      errs.password = "Senha é obrigatória"
    return errs
  }

  function handleChange(field: keyof LoginFormData, value: string) {
    const updated = { ...formData, [field]: value }
    setFormData(updated)
    if (touched[field]) {
      setErrors(validate(updated))
    }
  }

  function handleBlur(field: keyof TouchedFields) {
    setTouched({ ...touched, [field]: true })
    setErrors(validate(formData))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError("")
    setSuccessMessage("")

    const allTouched: TouchedFields = { email: true, password: true }
    setTouched(allTouched)

    const validationErrors = validate(formData)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)
    try {
      const result = await submitLogin(formData)
      if (result.success) {
        setSuccessMessage(result.message || "Login realizado com sucesso!")
        setTimeout(() => router.push(result.redirectTo ?? "/dashboard"), 1500)
      } else {
        setServerError(result.message)
      }
    } catch {
      setServerError("Erro ao fazer login. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    formData,
    errors,
    touched,
    isSubmitting,
    serverError,
    successMessage,
    handleChange,
    handleBlur,
    handleSubmit,
  }
}
