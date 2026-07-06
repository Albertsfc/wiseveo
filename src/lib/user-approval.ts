export const BOOTSTRAP_ADMIN_EMAIL = "albertsoliveira@gmail.com"
export const PENDING_APPROVAL_PATH = "/cadastro-pendente"

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function isBootstrapAdminEmail(email: string) {
  return normalizeEmail(email) === BOOTSTRAP_ADMIN_EMAIL
}

export function getInitialUserAccess(email: string) {
  if (isBootstrapAdminEmail(email)) {
    return {
      role: "SUPERADMIN" as const,
      status: "ACTIVE" as const,
    }
  }

  return {
    role: "USER" as const,
    status: "PENDING" as const,
  }
}

export function isAdminRole(role: string | null | undefined) {
  return role === "ADMIN" || role === "SUPERADMIN"
}

export function isActiveUser(status: string | null | undefined) {
  return status === "ACTIVE"
}
