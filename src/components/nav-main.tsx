"use client"

import { useEffect, useState } from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
}

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  label,
  items,
  collapsible = false,
}: {
  label: string
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
      isActive?: boolean
    }[]
  }[]
  collapsible?: boolean
}) {
  const pathname = usePathname()
  const currentPath = pathname
  const t = useTranslations("sidebar")

  const translate = (key: string) => {
    const formattedKey = normalizeKey(key)
    return t.has(formattedKey as never) ? t(formattedKey as never) : key
  }

  // Check if any subitem is active to determine if parent should be open
  const shouldBeOpen = (item: typeof items[0]) => {
    if (item.isActive) return true
    return item.items?.some(subItem => currentPath === subItem.url) || false
  }

  // Keep group expanded when current route belongs to it.
  const shouldGroupBeOpen = items.some((item) => {
    if (currentPath === item.url || item.isActive) return true
    return item.items?.some((subItem) => currentPath === subItem.url) || false
  })

  const menuContent = (
    <SidebarMenu>
      {items.map((item) => (
        <Collapsible
          key={item.title}
          asChild
          defaultOpen={shouldBeOpen(item)}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            {item.items?.length ? (
              <>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="cursor-pointer">
                    {item.icon && <item.icon />}
                    <span>{translate(item.title)}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent forceMount>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild className="cursor-pointer" isActive={currentPath === subItem.url}>
                          <Link href={subItem.url}>
                            <span>{translate(subItem.title)}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </>
            ) : (
              <SidebarMenuButton asChild tooltip={translate(item.title)} className="cursor-pointer" isActive={currentPath === item.url}>
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{translate(item.title)}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </Collapsible>
      ))}
    </SidebarMenu>
  )

  return (
    <SidebarGroup>
      {collapsible ? (
        <Collapsible
          defaultOpen={shouldGroupBeOpen}
          className="group/group-collapsible"
        >
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel asChild>
              <button type="button" className="w-full cursor-pointer">
                {translate(label)}
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/group-collapsible:rotate-90" />
              </button>
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent className="data-[state=closed]:hidden">
            {menuContent}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          <SidebarGroupLabel>{translate(label)}</SidebarGroupLabel>
          {menuContent}
        </>
      )}
    </SidebarGroup>
  )
}
