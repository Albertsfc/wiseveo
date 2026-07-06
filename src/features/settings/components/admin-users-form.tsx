"use client"

import * as React from "react"
import { toast } from "sonner"
import { CheckCircle2, ShieldCheck, UserCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AdminUserSummary } from "../services/admin-users-service"

interface AdminUsersFormProps {
  initialUsers: AdminUserSummary[]
}

function statusBadge(status: AdminUserSummary["status"]) {
  if (status === "ACTIVE") {
    return (
      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        Ativo
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
      Pendente
    </Badge>
  )
}

function roleBadge(role: AdminUserSummary["role"]) {
  if (role === "ADMIN" || role === "SUPERADMIN") {
    return (
      <Badge variant="outline" className="gap-1">
        <ShieldCheck className="size-3" />
        {role}
      </Badge>
    )
  }

  return <Badge variant="outline">USER</Badge>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

export function AdminUsersForm({ initialUsers }: AdminUsersFormProps) {
  const [users, setUsers] = React.useState(initialUsers)
  const [approvingId, setApprovingId] = React.useState<string | null>(null)
  const pendingCount = users.filter((user) => user.status === "PENDING").length

  async function approve(userId: string) {
    setApprovingId(userId)

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message ?? "Não foi possível aprovar o usuário.")
      }

      setUsers((current) =>
        current.map((user) =>
          user.id === userId ? payload.data : user,
        ),
      )
      toast.success("Usuário aprovado com sucesso.")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível aprovar o usuário.",
      )
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-muted-foreground">
          Cadastros pendentes: {pendingCount}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usuários</CardTitle>
          <CardDescription>
            Liberação de novos acessos ao WISEVEO.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Nenhum usuário encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="min-w-[220px]">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </TableCell>
                      <TableCell>{statusBadge(user.status)}</TableCell>
                      <TableCell>{roleBadge(user.role)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.status === "PENDING" ? (
                          <Button
                            type="button"
                            size="sm"
                            className="cursor-pointer"
                            disabled={approvingId === user.id}
                            onClick={() => approve(user.id)}
                          >
                            <UserCheck className="size-4" />
                            {approvingId === user.id ? "Aprovando..." : "Aprovar"}
                          </Button>
                        ) : (
                          <Button type="button" size="sm" variant="outline" disabled>
                            <CheckCircle2 className="size-4" />
                            Liberado
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
