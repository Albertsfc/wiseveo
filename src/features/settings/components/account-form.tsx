"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import * as React from "react"
import { TelegramConnect } from "@/features/telegram/components/TelegramConnect"

const accountFormSchema = z.object({
  firstName: z.string().min(1, "O nome é obrigatório"),
  lastName: z.string().min(1, "O sobrenome é obrigatório"),
  email: z.string().email("Endereço de e-mail inválido"),
  username: z.string().min(3, "O nome de usuário deve ter pelo menos 3 caracteres"),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
})

type AccountFormValues = z.infer<typeof accountFormSchema>

export function AccountForm() {
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  React.useEffect(() => {
    async function loadAccount() {
      try {
        const res = await fetch("/api/user/profile") // Reutiliza a rota de perfil para carregar nome e email
        const data = await res.json()
        if (data.success && data.data) {
          const user = data.data
          const nameParts = (user.name || "").split(" ")
          const firstName = nameParts[0] || ""
          const lastName = nameParts.slice(1).join(" ")
          
          form.reset({
            firstName,
            lastName,
            email: user.email || "",
            username: user.email.split("@")[0], // Fallback username
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          })
        }
      } catch (error) {
        console.error("Erro ao carregar dados da conta:", error)
      }
    }
    loadAccount()
  }, [form])

  async function onSubmit(data: AccountFormValues) {
    if (data.newPassword && data.newPassword !== data.confirmPassword) {
      toast.error("As senhas não coincidem.")
      return
    }

    try {
      const res = await fetch("/api/user/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const responseData = await res.json()

      if (res.ok) {
        toast.success("Dados da conta atualizados!")
        form.setValue("currentPassword", "")
        form.setValue("newPassword", "")
        form.setValue("confirmPassword", "")
      } else {
        toast.error(responseData.message || "Erro ao atualizar conta.")
      }
    } catch (error) {
      toast.error("Erro de conexão ao salvar dados da conta.")
    }
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Conta</h1>
          <p className="text-muted-foreground">
            Gerencie as credenciais e o acesso à sua conta.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border-0 shadow-none border-b rounded-none mb-6">
              <CardHeader className="px-0">
                <CardTitle>Dados de Acesso</CardTitle>
                <CardDescription>
                  Atualize suas credenciais básicas de acesso e exibição.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-0">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite seu nome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sobrenome</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite seu sobrenome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço de E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Digite seu e-mail" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de Usuário</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite seu nome de usuário (username)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-none border-b rounded-none mb-6">
              <CardHeader className="px-0">
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>
                  Mantenha sua conta segura atualizando sua senha regularmente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-0">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha Atual</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Digite sua senha atual" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Digite a nova senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nova Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Repita a nova senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <TelegramConnect />

            <Card className="border-0 shadow-none mb-6 bg-destructive/5 rounded-xl border-destructive/20 border p-2">
              <CardHeader className="px-4">
                <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                <CardDescription>
                  Ações destrutivas e irreversíveis.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-4 pb-4">
                <Separator className="bg-destructive/10" />
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-destructive">Excluir Conta</h4>
                    <p className="text-sm text-muted-foreground">
                      Excluir permanentemente a sua conta e todos os dados financeiros associados a ela.
                    </p>
                  </div>
                  <Button variant="destructive" type="button" className="cursor-pointer font-semibold shadow-sm">
                    Excluir Conta
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex space-x-2 pt-4">
              <Button type="submit" className="cursor-pointer">Salvar Alterações</Button>
              <Button variant="outline" type="reset" className="cursor-pointer">Cancelar</Button>
            </div>
          </form>
        </Form>
      </div>
  )
}
