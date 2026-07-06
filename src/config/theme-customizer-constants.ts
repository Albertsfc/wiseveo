import type { 
  SidebarVariant, 
  SidebarCollapsibleOption, 
  SidebarSideOption, 
  RadiusOption, 
  BrandColor 
} from '@/types/theme-customizer'

// Radius options
export const radiusOptions: RadiusOption[] = [
  { name: "0", value: "0rem" },
  { name: "0.3", value: "0.3rem" },
  { name: "0.5", value: "0.5rem" },
  { name: "0.75", value: "0.75rem" },
  { name: "1.0", value: "1rem" },
]

// Sidebar variant options
export const sidebarVariants: SidebarVariant[] = [
  { name: "Padrão", value: "sidebar", description: "Layout clássico de sidebar" },
  { name: "Flutuante", value: "floating", description: "Sidebar destacada com borda" },
  { name: "Inset", value: "inset", description: "Sidebar integrada com cantos arredondados" },
]

// Sidebar collapsible options
export const sidebarCollapsibleOptions: SidebarCollapsibleOption[] = [
  { name: "Off Canvas", value: "offcanvas", description: "Sai da área principal" },
  { name: "Ícones", value: "icon", description: "Recolhe para ícones" },
  { name: "Fixa", value: "none", description: "Sempre visível" },
]

// Sidebar side options
export const sidebarSideOptions: SidebarSideOption[] = [
  { name: "Esquerda", value: "left" },
  { name: "Direita", value: "right" },
]

// Define brand colors for custom color inputs
export const baseColors: BrandColor[] = [
  { name: "Primária", cssVar: "--primary" },
  { name: "Texto da Primária", cssVar: "--primary-foreground" },
  { name: "Secundária", cssVar: "--secondary" },
  { name: "Texto da Secundária", cssVar: "--secondary-foreground" },
  { name: "Accent", cssVar: "--accent" },
  { name: "Texto do Accent", cssVar: "--accent-foreground" },
  { name: "Muted", cssVar: "--muted" },
  { name: "Texto do Muted", cssVar: "--muted-foreground" },
]
