"use client"

import { ThemeCustomizerPanel } from "@/components/theme-customizer/panel"

export function AppearanceForm() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Aparência</h1>
        <p className="text-muted-foreground">
          Defina aqui o modo, os presets visuais e o layout estrutural que devem carregar em todas as páginas do projeto.
        </p>
      </div>

      <ThemeCustomizerPanel description="Modo claro/escuro, presets de tema, cores de marca e layout da sidebar agora vivem nesta seção e são aplicados globalmente." />
    </div>
  )
}
