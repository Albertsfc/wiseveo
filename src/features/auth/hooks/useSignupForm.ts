"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SignupFormData } from "../types"
import { submitSignup } from "../services/signup"

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

interface TouchedFields {
  name: boolean
  email: boolean
  password: boolean
  confirmPassword: boolean
}

export function useSignupForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<TouchedFields>({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  function validate(data: SignupFormData, confirm: string): FormErrors {
    const errs: FormErrors = {}
    if (data.name.length < 2) errs.name = "Nome deve ter pelo menos 2 caracteres"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errs.email = "Email inválido"
    if (data.password.length < 8)
      errs.password = "Senha deve ter pelo menos 8 caracteres"
    if (data.password !== confirm)
      errs.confirmPassword = "As senhas não coincidem"
    return errs
  }

  function handleChange(field: keyof SignupFormData, value: string) {
    const updated = { ...formData, [field]: value }
    setFormData(updated)
    if (touched[field]) {
      setErrors(validate(updated, field === "password" ? confirmPassword : confirmPassword))
    }
  }

  function handleConfirmPasswordChange(value: string) {
    setConfirmPassword(value)
    if (touched.confirmPassword) {
      setErrors(validate(formData, value))
    }
  }

  function handleBlur(field: keyof TouchedFields) {
    const newTouched = { ...touched, [field]: true }
    setTouched(newTouched)
    setErrors(validate(formData, confirmPassword))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError("")
    setSuccessMessage("")

    const allTouched: TouchedFields = {
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    }
    setTouched(allTouched)

    const validationErrors = validate(formData, confirmPassword)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)
    try {
      const result = await submitSignup(formData)
      if (result.success) {
        setSuccessMessage(result.message || "Conta criada! Redirecionando...")
        setTimeout(() => router.push(result.redirectTo ?? "/dashboard"), 1500)
      } else {
        setServerError(result.message)
      }
    } catch {
      setServerError("Erro ao criar conta. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    formData,
    confirmPassword,
    errors,
    touched,
    isSubmitting,
    serverError,
    successMessage,
    handleChange,
    handleConfirmPasswordChange,
    handleBlur,
    handleSubmit,
  }
}
