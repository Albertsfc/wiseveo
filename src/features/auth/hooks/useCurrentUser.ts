"use client"

import { useState, useEffect } from "react"

interface UserData {
  id: string
  name: string
  email: string
  avatar: string
  role: "USER" | "ADMIN" | "SUPERADMIN"
  status: "PENDING" | "ACTIVE"
}

export function useCurrentUser() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUser(data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { user, loading }
}
