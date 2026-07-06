"use client"

/**
 * DetailPanel — componente universal de painel de detalhes responsivo.
 *
 * Comportamento por device-class:
 *  - Mobile  (<768px): Drawer bottom (vaul) — gesto de swipe para fechar
 *  - Tablet  (768–1024px): Sheet lateral direita (radix/dialog)
 *  - Desktop (>1024px): Dialog centralizado (comportamento atual)
 *
 * Props:
 *  - open / onOpenChange: controle padrão de visibilidade
 *  - title: título exibido no cabeçalho
 *  - description (opcional): descrição acessível (sr-only no desktop)
 *  - children: conteúdo scrollável
 *  - footer (opcional): area fixa de rodapé com botões de ação
 *  - className: classes extras para o container de conteúdo
 */

import * as React from "react"
import { X } from "lucide-react"

import { useDeviceClass } from "@/hooks/use-device-class"
import { cn } from "@/lib/utils"

// ── Primitivos ────────────────────────────────────────────────────────────────

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// ── Types ─────────────────────────────────────────────────────────────────────

interface DetailPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  /** Força um modo específico (ignorando useDeviceClass). Útil em testes. */
  forceMode?: "mobile" | "tablet" | "desktop"
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DetailPanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  forceMode,
}: DetailPanelProps) {
  const { isMobile, isTablet } = useDeviceClass()
  const mode = forceMode ?? (isMobile ? "mobile" : isTablet ? "tablet" : "desktop")

  // ── Mobile: Drawer (vaul) bottom sheet ────────────────────────────────────

  if (mode === "mobile") {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
        <DrawerContent className="max-h-[92dvh] flex flex-col pb-safe">
          {/* Handle bar is rendered automatically by DrawerContent */}
          <DrawerHeader className="px-5 pt-2 pb-3 border-b text-left">
            <DrawerTitle className="text-base font-semibold leading-tight">
              {title}
            </DrawerTitle>
            {description && (
              <DrawerDescription className="sr-only">{description}</DrawerDescription>
            )}
          </DrawerHeader>

          {/* Scrollable body */}
          <div
            className={cn(
              "flex-1 overflow-y-auto overscroll-contain scroll-touch px-5 py-4",
              className
            )}
          >
            {children}
          </div>

          {footer && (
            <DrawerFooter className="px-5 py-3 border-t flex-row gap-2 mt-0">
              {footer}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    )
  }

  // ── Tablet: Sheet lateral direita ─────────────────────────────────────────

  if (mode === "tablet") {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-[480px] sm:max-w-[480px] p-0 flex flex-col gap-0"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b space-y-1">
            <SheetTitle className="text-base font-semibold">{title}</SheetTitle>
            {description && (
              <SheetDescription className="sr-only">{description}</SheetDescription>
            )}
          </SheetHeader>

          <div
            className={cn(
              "flex-1 overflow-y-auto overscroll-contain scroll-touch px-6 py-5",
              className
            )}
          >
            {children}
          </div>

          {footer && (
            <SheetFooter className="px-6 py-4 border-t flex-row gap-2 mt-0">
              {footer}
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    )
  }

  // ── Desktop: Dialog centralizado ──────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="sr-only">{description}</DialogDescription>
          )}
        </DialogHeader>

        <div
          className={cn(
            "flex flex-col overflow-y-auto px-6 py-5 max-h-[65vh]",
            className
          )}
        >
          {children}
        </div>

        {footer && (
          <DialogFooter className="px-6 py-4 border-t">{footer}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Convenience close button (usado no footer) ────────────────────────────────

export function DetailPanelCloseButton({
  onClick,
  children = "Cancelar",
}: {
  onClick?: () => void
  children?: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="cursor-pointer"
    >
      {children}
    </Button>
  )
}
