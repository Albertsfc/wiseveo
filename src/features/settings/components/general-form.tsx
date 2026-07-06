"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type {
  QuickPaymentOptions,
  QuickPaymentSettings,
} from "../services/user-settings-service"

const generalSettingsSchema = z.object({
  defaultAccountId: z.string().min(1, "Selecione o banco padrão."),
  defaultStatusCode: z.string().min(1, "Selecione o status padrão."),
})

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>

interface GeneralFormProps {
  initialQuickPaymentSettings: QuickPaymentSettings
  quickPaymentOptions: QuickPaymentOptions
}

function buildFormValues(
  initialQuickPaymentSettings: QuickPaymentSettings,
  quickPaymentOptions: QuickPaymentOptions,
): GeneralSettingsValues {
  const hasSavedAccount = quickPaymentOptions.accounts.some(
    (account) => account.id === initialQuickPaymentSettings.defaultAccountId,
  )
  const hasSavedStatus = quickPaymentOptions.statuses.some(
    (status) => status.code === initialQuickPaymentSettings.defaultStatusCode,
  )

  return {
    defaultAccountId:
      initialQuickPaymentSettings.defaultAccountId !== null && hasSavedAccount
        ? String(initialQuickPaymentSettings.defaultAccountId)
        : "",
    defaultStatusCode:
      initialQuickPaymentSettings.defaultStatusCode !== null && hasSavedStatus
        ? String(initialQuickPaymentSettings.defaultStatusCode)
        : "",
  }
}

function hasUnavailableQuickPaymentConfig(
  initialQuickPaymentSettings: QuickPaymentSettings,
  quickPaymentOptions: QuickPaymentOptions,
) {
  const missingAccount =
    initialQuickPaymentSettings.defaultAccountId !== null &&
    !quickPaymentOptions.accounts.some(
      (account) => account.id === initialQuickPaymentSettings.defaultAccountId,
    )
  const missingStatus =
    initialQuickPaymentSettings.defaultStatusCode !== null &&
    !quickPaymentOptions.statuses.some(
      (status) => status.code === initialQuickPaymentSettings.defaultStatusCode,
    )

  return missingAccount || missingStatus
}

export function GeneralForm({
  initialQuickPaymentSettings,
  quickPaymentOptions,
}: GeneralFormProps) {
  const initialValues = React.useMemo(
    () =>
      buildFormValues(initialQuickPaymentSettings, quickPaymentOptions),
    [initialQuickPaymentSettings, quickPaymentOptions],
  )
  const [persistedValues, setPersistedValues] =
    React.useState<GeneralSettingsValues>(initialValues)
  const [hasUnavailableConfig, setHasUnavailableConfig] = React.useState(
    hasUnavailableQuickPaymentConfig(
      initialQuickPaymentSettings,
      quickPaymentOptions,
    ),
  )

  const form = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: initialValues,
  })

  React.useEffect(() => {
    setPersistedValues(initialValues)
    setHasUnavailableConfig(
      hasUnavailableQuickPaymentConfig(
        initialQuickPaymentSettings,
        quickPaymentOptions,
      ),
    )
    form.reset(initialValues)
  }, [
    form,
    initialQuickPaymentSettings,
    initialValues,
    quickPaymentOptions,
  ])

  const hasAvailableAccounts = quickPaymentOptions.accounts.length > 0
  const hasAvailableStatuses = quickPaymentOptions.statuses.length > 0
  const canSave = hasAvailableAccounts && hasAvailableStatuses

  async function onSubmit(values: GeneralSettingsValues) {
    try {
      const response = await fetch("/api/user/general-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultAccountId: Number(values.defaultAccountId),
          defaultStatusCode: Number(values.defaultStatusCode),
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.message ??
            "Não foi possível salvar as configurações gerais.",
        )
      }

      const nextValues = buildFormValues(payload.data, quickPaymentOptions)
      setPersistedValues(nextValues)
      setHasUnavailableConfig(false)
      form.reset(nextValues)
      toast.success("Configurações gerais atualizadas com sucesso!")
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar as configurações gerais."

      toast.error(message)
    }
  }

  function handleCancel() {
    form.reset(persistedValues)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Geral</h1>
        <p className="text-muted-foreground">
          Defina preferências globais usadas pelos fluxos compartilhados do
          sistema.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pagamento Rápido Padrão</CardTitle>
              <CardDescription>
                Usado no menu da coluna de ações e no menu de ações em lote da
                página de Transações.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!canSave && (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Cadastre pelo menos um banco ativo e um status no banco de
                  dados para habilitar este recurso global.
                </div>
              )}

              {hasUnavailableConfig && (
                <div className="rounded-lg border border-dashed border-destructive/30 bg-destructive/5 p-4 text-sm text-muted-foreground">
                  A configuração salva não corresponde mais a um banco ou
                  status disponível. Selecione novos valores e salve novamente.
                </div>
              )}

              <FormField
                control={form.control}
                name="defaultAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banco padrão</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!hasAvailableAccounts || form.formState.isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder="Selecione o banco padrão" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {quickPaymentOptions.accounts.map((account) => (
                          <SelectItem
                            key={account.id}
                            value={String(account.id)}
                          >
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Esta conta será aplicada automaticamente quando o
                      Pagamento Rápido for confirmado.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="defaultStatusCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status padrão</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!hasAvailableStatuses || form.formState.isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder="Selecione o status padrão" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {quickPaymentOptions.statuses.map((status) => (
                          <SelectItem
                            key={status.code}
                            value={String(status.code)}
                          >
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      O lançamento será atualizado para este status ao usar o
                      Pagamento Rápido.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={form.formState.isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canSave || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
