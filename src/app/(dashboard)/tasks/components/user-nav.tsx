"use client"

import { useTranslations } from "next-intl"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserNav() {
  const t = useTranslations("tasks.userNav")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full cursor-pointer">
          <Avatar className="h-9 w-9 cursor-pointer">
            <AvatarImage src="https://notion-avatars.netlify.app/api/avatar/?preset=female-2" alt="@shadcn" />
            {/* i18n-ignore: iniciais de avatar de usuário fictício (mock), não é texto de UI */}
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            {/* i18n-ignore: nome e e-mail de usuário fictício (mock), não é texto de UI */}
            <p className="text-sm font-medium leading-none">shadcn</p>
            <p className="text-xs leading-none text-muted-foreground">
              {/* i18n-ignore: nome e e-mail de usuário fictício (mock), não é texto de UI */}
              m@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer">
            {t("profile")}
            {/* i18n-ignore: símbolo de tecla física do teclado, idêntico em todos os idiomas */}
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            {t("billing")}
            {/* i18n-ignore: símbolo de tecla física do teclado, idêntico em todos os idiomas */}
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            {t("settings")}
            {/* i18n-ignore: símbolo de tecla física do teclado, idêntico em todos os idiomas */}
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">{t("newTeam")}</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          {t("logout")}
          {/* i18n-ignore: símbolo de tecla física do teclado, idêntico em todos os idiomas */}
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
