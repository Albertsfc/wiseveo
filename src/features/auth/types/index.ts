export interface SignupFormData {
  name: string
  email: string
  password: string
}

export interface SignupResponse {
  success: boolean
  message: string
  redirectTo?: string
}

export interface LoginFormData {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message: string
  redirectTo?: string
}
