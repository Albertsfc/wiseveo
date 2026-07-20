import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import {
  BOOTSTRAP_ADMIN_EMAIL,
  isAdminRole,
  isBootstrapAdminEmail,
  isActiveUser,
} from "@/lib/user-approval"

export interface AdminUserSummary {
  id: string
  name: string
  email: string
  role: "USER" | "ADMIN" | "SUPERADMIN"
  status: "PENDING" | "ACTIVE"
  createdAt: string
  updatedAt: string
}

export class AdminAccessError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "AdminAccessError"
    this.status = status
  }
}

function serializeAdminUser(user: {
  id: string
  name: string
  email: string
  role: "USER" | "ADMIN" | "SUPERADMIN"
  status: "PENDING" | "ACTIVE"
  createdAt: Date
  updatedAt: Date
}): AdminUserSummary {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

export async function requireAdminUser(userId: string | null) {
  const t = await getTranslations("settings.adminUsers.errors")

  if (!userId) {
    throw new AdminAccessError(401, t("notAuthenticated"))
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  })

  if (!user || !isActiveUser(user.status) || !isAdminRole(user.role)) {
    throw new AdminAccessError(403, t("adminOnly"))
  }

  return user
}

export async function getUserAdminAccess(userId: string | null) {
  if (!userId) return { isAdmin: false }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, status: true },
  })

  return {
    isAdmin: Boolean(user && isActiveUser(user.status) && isAdminRole(user.role)),
  }
}

export async function listUsersForAdmin(): Promise<AdminUserSummary[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return users
    .map(serializeAdminUser)
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "PENDING" ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
}

export async function approveUser(userId: string): Promise<AdminUserSummary> {
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  if (!target) {
    const t = await getTranslations("settings.adminUsers.errors")
    throw new AdminAccessError(404, t("userNotFound"))
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      status: "ACTIVE",
      role: isBootstrapAdminEmail(target.email) ? "SUPERADMIN" : "USER",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return serializeAdminUser(updatedUser)
}

export function getBootstrapAdminEmail() {
  return BOOTSTRAP_ADMIN_EMAIL
}
