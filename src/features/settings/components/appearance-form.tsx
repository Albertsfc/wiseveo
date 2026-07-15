"use client"

import { ThemeCustomizerPanel } from "@/components/theme-customizer/panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LocaleSwitcher } from "@/components/locale-switcher"

export function AppearanceForm() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Aparência & Idioma</h1>
        <p className="text-muted-foreground">
          Defina aqui o modo, os presets visuais, o layout estrutural e o idioma que devem carregar em todas as páginas do projeto.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Idioma do Sistema</CardTitle>
          <CardDescription>
            Escolha o idioma preferido para a interface. A mudança será aplicada imediatamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocaleSwitcher />
        </CardContent>
      </Card>

      <ThemeCustomizerPanel description="Modo claro/escuro, presets de tema, cores de marca e layout da sidebar agora vivem nesta seção e são aplicados globalmente." />
    </div>
  )
}
