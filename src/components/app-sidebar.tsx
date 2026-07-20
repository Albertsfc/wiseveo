"use client"

import * as React from "react"
import {
  Calculator,
  LayoutPanelLeft,
  LayoutDashboard,
  Mail,
  CheckSquare,
  MessageCircle,
  Calendar,
  Settings,
  HelpCircle,
  CreditCard,
  ArrowLeftRight,
  Users,
  Landmark,
  RotateCcw,
  Wallet,
  LineChart,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { LocaleSwitcher } from "@/components/locale-switcher"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { SidebarRadar } from "@/components/sidebar-radar"
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type SidebarSubItem = {
  title: string
  url: string
  isActive?: boolean
}

type SidebarNavItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: SidebarSubItem[]
}

type SidebarNavGroup = {
  label: string
  collapsible: boolean
  items: SidebarNavItem[]
}

const data: { navGroups: SidebarNavGroup[] } = {
  navGroups: [
    {
      label: "Dashboards",
      collapsible: false,
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Insights",
          url: "/insights",
          icon: LayoutPanelLeft,
        },
        {
          title: "Transacoes",
          url: "/transactions",
          icon: ArrowLeftRight,
        },
        {
          title: "Recorrentes",
          url: "/recurring",
          icon: RotateCcw,
        },
        {
          title: "Orcamento",
          url: "/budget",
          icon: Wallet,
        },
        {
          title: "Analise",
          url: "/analysis",
          icon: Calculator,
        },
        {
          title: "Forecasting",
          url: "/forecasting",
          icon: LineChart,
        },
        {
          title: "Bancos",
          url: "/banks",
          icon: Landmark,
        },
        {
          title: "Calendario",
          url: "/calendar",
          icon: Calendar,
        },
        {
          title: "Configuracoes",
          url: "/configuracoes?tab=general",
          icon: Settings,
        },
      ],
    },
    {
      label: "Pages",
      collapsible: true,
      items: [
        {
          title: "Settings",
          url: "#",
          icon: Settings,
          items: [
            {
              title: "Geral",
              url: "/configuracoes?tab=general",
            },
            {
              // i18n-ignore: chave de navegação — traduzida via t(normalizeKey(title)) em nav-main.tsx (sidebar.usersettings existe), não é texto renderizado literalmente
              title: "User Settings",
              url: "/configuracoes?tab=profile",
            },
            {
              // i18n-ignore: chave de navegação — traduzida via t(normalizeKey(title)) em nav-main.tsx (sidebar.accountsettings existe), não é texto renderizado literalmente
              title: "Account Settings",
              url: "/configuracoes?tab=account",
            },
            {
              title: "Plans & Billing",
              url: "/settings/billing",
            },
            {
              title: "Appearance",
              url: "/configuracoes?tab=appearance",
            },
            {
              title: "Notifications",
              url: "/settings/notifications",
            },
            {
              title: "Connections",
              url: "/settings/connections",
            },
            {
              title: "Componentes",
              url: "/settings/components",
            },
          ],
        },
      ],
    },
    {
      label: "Apps",
      collapsible: true,
      items: [
        {
          title: "Mail",
          url: "/mail",
          icon: Mail,
        },
        {
          title: "Tasks",
          url: "/tasks",
          icon: CheckSquare,
        },
        {
          title: "Chat",
          url: "/chat",
          icon: MessageCircle,
        },
        {
          title: "Users",
          url: "/users",
          icon: Users,
        },
      ],
    },
    {
      label: "Support",
      collapsible: true,
      items: [
        {
          title: "FAQs",
          url: "/faqs",
          icon: HelpCircle,
        },
        {
          title: "Pricing",
          url: "/pricing",
          icon: CreditCard,
        },
      ],
    },
  ],
}

import { useTranslations } from "next-intl"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useCurrentUser()
  const t = useTranslations("sidebar")
  const userData = user ?? { name: "...", email: "", avatar: "" }
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN"
  const navGroups = React.useMemo(() => {
    if (!isAdmin) return data.navGroups

    return data.navGroups.map((group) => {
      if (group.label !== "Pages") return group

      return {
        ...group,
        items: group.items.map((item) => {
          if (item.title !== "Settings" || !item.items) return item

          const hasAdmin = item.items.some((subItem) => subItem.title === "Admin")
          return {
            ...item,
            items: hasAdmin
              ? item.items
              : [
                  ...item.items,
                  {
                    title: "Admin",
                    url: "/configuracoes?tab=admin",
                  },
                ],
          }
        }),
      }
    })
  }, [isAdmin])

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Logo size={24} className="text-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{t("title")}</span>
                  <span className="truncate text-xs">{t("subtitle")}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarRadar />

      <SidebarContent>
        {navGroups.map((group) => (
          <NavMain
            key={group.label}
            label={group.label}
            items={group.items}
            collapsible={group.collapsible}
          />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 pb-2">
          <LocaleSwitcher />
        </div>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
