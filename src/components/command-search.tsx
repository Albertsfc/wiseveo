"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Command as CommandPrimitive } from "cmdk"
import {
  Search,
  Calculator,
  LayoutPanelLeft,
  LayoutDashboard,
  Calendar,
  Settings,
  ArrowLeftRight,
  RotateCcw,
  Wallet,
  Landmark,
  User,
  Palette,
  LineChart,
  type LucideIcon,
} from "lucide-react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-xl bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50",
      className
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Input
    ref={ref}
    className={cn(
      "flex h-12 w-full border-none bg-transparent px-4 py-3 text-[17px] outline-none placeholder:text-zinc-500 dark:placeholder:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 mb-4",
      className
    )}
    {...props}
  />
))
CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[400px] overflow-y-auto overflow-x-hidden pb-2", className)}
    {...props}
  />
))
CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="flex h-12 items-center justify-center text-sm text-zinc-500 dark:text-zinc-400"
    {...props}
  />
))
CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden px-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-zinc-500 dark:[&_[cmdk-group-heading]]:text-zinc-400 [&:not(:first-child)]:mt-2",
      className
    )}
    {...props}
  />
))
CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex h-12 cursor-pointer select-none items-center gap-2 rounded-lg px-4 text-sm text-zinc-700 dark:text-zinc-300 outline-none transition-colors data-[disabled=true]:pointer-events-none data-[selected=true]:bg-zinc-100 dark:data-[selected=true]:bg-zinc-800 data-[selected=true]:text-zinc-900 dark:data-[selected=true]:text-zinc-100 data-[disabled=true]:opacity-50 [&+[cmdk-item]]:mt-1",
      className
    )}
    {...props}
  />
))
CommandItem.displayName = CommandPrimitive.Item.displayName

import { useTranslations } from "next-intl"

interface SearchItem {
  id: string
  url: string
  groupId: string
  icon?: LucideIcon
}

interface CommandSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const router = useRouter()
  const commandRef = React.useRef<HTMLDivElement>(null)
  const tSidebar = useTranslations("sidebar")
  const tCommon = useTranslations("common")

  const searchItems: SearchItem[] = [
    // Dashboards
    { id: "dashboard", url: "/dashboard", groupId: "dashboards", icon: LayoutDashboard },
    { id: "insights", url: "/insights", groupId: "dashboards", icon: LayoutPanelLeft },
    { id: "transacoes", url: "/transactions", groupId: "dashboards", icon: ArrowLeftRight },
    { id: "recorrentes", url: "/recurring", groupId: "dashboards", icon: RotateCcw },
    { id: "orcamento", url: "/budget", groupId: "dashboards", icon: Wallet },
    { id: "analise", url: "/analysis", groupId: "dashboards", icon: Calculator },
    { id: "forecasting", url: "/forecasting", groupId: "dashboards", icon: LineChart },
    { id: "bancos", url: "/banks", groupId: "dashboards", icon: Landmark },
    { id: "calendario", url: "/calendar", groupId: "dashboards", icon: Calendar },
    { id: "configuracoes", url: "/configuracoes?tab=general", groupId: "dashboards", icon: Settings },

    // Settings (abas reais em /configuracoes)
    { id: "geral", url: "/configuracoes?tab=general", groupId: "settings", icon: Settings },
    { id: "usersettings", url: "/configuracoes?tab=profile", groupId: "settings", icon: User },
    { id: "accountsettings", url: "/configuracoes?tab=account", groupId: "settings", icon: Settings },
    { id: "appearance", url: "/configuracoes?tab=appearance", groupId: "settings", icon: Palette },
  ]

  const groupedItems = searchItems.reduce((acc, item) => {
    if (!acc[item.groupId]) {
      acc[item.groupId] = []
    }
    acc[item.groupId].push(item)
    return acc
  }, {} as Record<string, SearchItem[]>)

  const handleSelect = (url: string) => {
    router.push(url)
    onOpenChange(false)
    // Bounce effect like Vercel
    if (commandRef.current) {
      commandRef.current.style.transform = 'scale(0.96)'
      setTimeout(() => {
        if (commandRef.current) {
          commandRef.current.style.transform = ''
        }
      }, 100)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl border border-zinc-200 dark:border-zinc-800 max-w-[640px]">
        <DialogTitle className="sr-only">{tCommon("commandSearchTitle")}</DialogTitle>
        <Command
          ref={commandRef}
          className="transition-transform duration-100 ease-out"
        >
          <CommandInput placeholder={tCommon("searchPlaceholder")} autoFocus />
          <CommandList>
            <CommandEmpty>{tCommon("noResults")}</CommandEmpty>
            {Object.entries(groupedItems).map(([groupId, items]) => (
              <CommandGroup key={groupId} heading={tSidebar(groupId as never)}>
                {items.map((item) => {
                  const Icon = item.icon
                  return (
                    <CommandItem
                      key={item.url}
                      value={tSidebar(item.id as never)}
                      onSelect={() => handleSelect(item.url)}
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      {tSidebar(item.id as never)}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  const tCommon = useTranslations("common")
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3 py-1 relative w-full justify-start text-muted-foreground sm:pr-12 md:w-36 lg:w-56"
    >
      <Search className="mr-2 h-3.5 w-3.5" />
      <span className="hidden lg:inline-flex">{tCommon("search")}</span>
      <span className="inline-flex lg:hidden">{tCommon("search")}</span>
      <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-4 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        {/* i18n-ignore: physical keyboard key symbol (Cmd+K), identical across locales */}
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  )
}
