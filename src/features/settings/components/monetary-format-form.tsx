"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
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
import {
  createMonetaryFormatter,
  defaultMonetarySettings,
  resolveMonetarySettings,
  type MonetarySettings,
} from "@/lib/monetary"
import { useMonetaryPreferences } from "@/contexts/monetary-preferences-context"

const monetaryFormatSchema = z.object({
  currency: z.enum(["BRL", "USD", "EUR"]),
  displayMode: z.enum(["symbol", "code", "number"]),
  negativeFormat: z.enum(["parentheses", "minus"]),
})

type MonetaryFormatValues = z.infer<typeof monetaryFormatSchema>

const previewValues = {
  positive: 1234.56,
  negative: -1234.56,
}

interface MonetaryFormatFormProps {
  initialValues?: MonetarySettings
}

export function MonetaryFormatForm({
  initialValues = defaultMonetarySettings,
}: MonetaryFormatFormProps) {
  const { preferences, loaded, savePreferences } = useMonetaryPreferences()
  const resolvedInitialValues = React.useMemo(
    () => resolveMonetarySettings(initialValues),
    [initialValues],
  )

  if (!loaded) {
    return (
      <LoadedMonetaryFormatForm
        key={`initial-${resolvedInitialValues.currency}-${resolvedInitialValues.displayMode}-${resolvedInitialValues.negativeFormat}`}
        initialValues={resolvedInitialValues}
        savePreferences={savePreferences}
      />
    )
  }

  return (
    <LoadedMonetaryFormatForm
      key={`${preferences.currency}-${preferences.displayMode}-${preferences.negativeFormat}`}
      initialValues={preferences}
      savePreferences={savePreferences}
    />
  )
}

interface LoadedMonetaryFormatFormProps {
  initialValues: MonetaryFormatValues
  savePreferences: (
    partial: Partial<MonetaryFormatValues>,
  ) => Promise<{ success: boolean; data: MonetaryFormatValues }>
}

function LoadedMonetaryFormatForm({
  initialValues,
  savePreferences,
}: LoadedMonetaryFormatFormProps) {
  const form = useForm<MonetaryFormatValues>({
    resolver: zodResolver(monetaryFormatSchema),
    defaultValues: initialValues,
  })

  const watched = useWatch({
    control: form.control,
  })
  const previewFormatter = React.useMemo(
    () => createMonetaryFormatter(watched ?? defaultMonetarySettings),
    [watched],
  )

  async function onSubmit(data: MonetaryFormatValues) {
    const result = await savePreferences(data)

    form.reset(result.data)

    if (result.success) {
      toast.success("Formatação monetária atualizada com sucesso!")
      return
    }

    toast.error("Não foi possível salvar a formatação monetária.")
  }

  function handleCancel() {
    form.reset(initialValues)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Formatação Monetária</h1>
        <p className="text-muted-foreground">
          Defina como valores financeiros devem ser exibidos em todo o sistema.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preferências Globais</CardTitle>
              <CardDescription>
                Estas opções afetam cards, tabelas, gráficos e resumos financeiros.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moeda</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={form.formState.isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder="Selecione a moeda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BRL">Real brasileiro (BRL)</SelectItem>
                        <SelectItem value="USD">Dólar americano (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Define símbolo, código e separadores numéricos padrão.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="displayMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formato de Exibição</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={form.formState.isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder="Selecione o formato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="symbol">Símbolo monetário</SelectItem>
                        <SelectItem value="code">Código da moeda</SelectItem>
                        <SelectItem value="number">Somente número</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Exemplo: R$, BRL ou apenas o valor numérico.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="negativeFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valores Negativos</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={form.formState.isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder="Selecione o formato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="parentheses">Entre parênteses</SelectItem>
                        <SelectItem value="minus">Com sinal de menos</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Escolha como saídas, prejuízos e demais valores negativos serão mostrados.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pré-visualização em Tempo Real</CardTitle>
              <CardDescription>
                Veja como o mesmo valor ficará em versões positiva e negativa.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-sm text-muted-foreground">Valor positivo</div>
                <div className="mt-2 font-mono text-2xl font-semibold text-chart-2">
                  {previewFormatter.formatMonetaryValue(previewValues.positive)}
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-sm text-muted-foreground">Valor negativo</div>
                <div className="mt-2 font-mono text-2xl font-semibold text-destructive">
                  {previewFormatter.formatMonetaryValue(previewValues.negative)}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Salvando..." : "Salvar Formatação"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={handleCancel}
              disabled={form.formState.isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
