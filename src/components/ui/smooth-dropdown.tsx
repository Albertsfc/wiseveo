"use client"

import { useState, useRef, useEffect, useCallback, type ElementType } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import useMeasure from "react-use-measure"
import { EllipsisVertical } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

export interface SmoothDropdownItem {
  id: string
  label: string
  icon?: ElementType
  badge?: number
  badgeClassName?: string
  onClick?: () => void
  variant?: "default" | "destructive"
  disabled?: boolean
  iconClassName?: string
}

export interface SmoothDropdownSeparator {
  id: string
  separator: true
}

export type SmoothDropdownEntry = SmoothDropdownItem | SmoothDropdownSeparator

export interface SmoothDropdownTriggerBadge {
  id: string
  value: number
  className?: string
}

export interface SmoothDropdownProps {
  items: SmoothDropdownEntry[]
  align?: "start" | "end"
  triggerClassName?: string
  menuWidth?: number
  triggerBadges?: SmoothDropdownTriggerBadge[]
}

function isSeparator(
  entry: SmoothDropdownEntry
): entry is SmoothDropdownSeparator {
  return "separator" in entry && entry.separator === true
}

export function SmoothDropdown({
  items,
  align = "end",
  triggerClassName,
  menuWidth = 220,
  triggerBadges = [],
}: SmoothDropdownProps) {
  const t = useTranslations("common")
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [contentRef, contentBounds] = useMeasure()
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const openHeight = Math.max(40, Math.ceil(contentBounds.height))
  const visibleTriggerBadges = triggerBadges
    .filter((badge) => Number.isFinite(badge.value) && badge.value > 0)
    .slice(0, 2)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const dropdownWidth = menuWidth
    const viewportPadding = 8
    const menuGap = 4
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const spaceBelow = viewportHeight - rect.bottom - viewportPadding
    const spaceAbove = rect.top - viewportPadding

    let top = rect.bottom + menuGap
    if (spaceBelow < openHeight && spaceAbove > spaceBelow) {
      top = rect.top - openHeight - menuGap
    }
    top = Math.max(
      viewportPadding,
      Math.min(top, viewportHeight - openHeight - viewportPadding)
    )

    let left = align === "end" ? rect.right - dropdownWidth : rect.left
    left = Math.max(
      viewportPadding,
      Math.min(left, viewportWidth - dropdownWidth - viewportPadding)
    )

    setPosition({
      top,
      left,
    })
  }, [align, menuWidth, openHeight])

  useEffect(() => {
    if (!isOpen) return

    const rafId = window.requestAnimationFrame(() => {
      updatePosition()
    })

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return
      }
      setIsOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false)
    }

    const handleScroll = () => setIsOpen(false)
    const handleResize = () => updatePosition()

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    window.addEventListener("scroll", handleScroll, true)
    window.addEventListener("resize", handleResize)

    return () => {
      window.cancelAnimationFrame(rafId)
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("scroll", handleScroll, true)
      window.removeEventListener("resize", handleResize)
    }
  }, [isOpen, updatePosition])

  useEffect(() => {
    if (!isOpen) return

    const rafId = window.requestAnimationFrame(() => {
      updatePosition()
    })

    return () => {
      window.cancelAnimationFrame(rafId)
    }
  }, [isOpen, openHeight, updatePosition])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen((prev) => !prev)
        }}
        className={cn(
          "relative inline-flex items-center justify-center rounded-md text-muted-foreground",
          "size-8 cursor-pointer transition-colors hover:bg-muted",
          "data-[state=open]:bg-muted",
          triggerClassName
        )}
        data-state={isOpen ? "open" : "closed"}
      >
        <EllipsisVertical className="h-4 w-4" />
        {visibleTriggerBadges.map((badge, index) => (
          <span
            key={badge.id}
            className={cn(
              "pointer-events-none absolute right-0 z-10 flex h-4 min-w-4 translate-x-1/3 items-center justify-center rounded-full px-1",
              "text-[10px] font-semibold leading-none shadow-sm ring-1 ring-background",
              index === 0 ? "top-0 -translate-y-1/3" : "bottom-0 translate-y-1/3",
              badge.className ?? "bg-primary text-primary-foreground"
            )}
          >
            {badge.value > 99 ? "99+" : badge.value}
          </span>
        ))}
        <span className="sr-only">{t("openActions")}</span>
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, height: 0, width: menuWidth }}
                animate={{
                  opacity: 1,
                  height: openHeight,
                  width: menuWidth,
                }}
                exit={{ opacity: 0, height: 0 }}
                transition={{
                  type: "spring",
                  damping: 34,
                  stiffness: 380,
                  mass: 0.8,
                }}
                className="fixed z-50 overflow-hidden rounded-[12px] border border-border bg-popover shadow-lg"
                style={{
                  top: position.top,
                  left: position.left,
                }}
              >
                <div ref={contentRef}>
                  <div className="p-1.5">
                    <ul className="flex flex-col gap-0.5 m-0 p-0 list-none">
                      {items.map((entry, index) => {
                        if (isSeparator(entry)) {
                          return (
                            <motion.li
                              key={entry.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{
                                delay: 0.12 + index * 0.015,
                              }}
                            >
                              <hr className="border-border my-1" />
                            </motion.li>
                          )
                        }

                        const item = entry
                        const isDestructive = item.variant === "destructive"
                        const isHovered = hoveredItem === item.id
                        const itemDelay = 0.06 + index * 0.02

                        return (
                          <motion.li
                            key={item.id}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              delay: itemDelay,
                              duration: 0.15,
                              ease: [0.23, 1, 0.32, 1],
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (item.disabled) return
                              item.onClick?.()
                              setIsOpen(false)
                            }}
                            onMouseEnter={() => setHoveredItem(item.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                            className={cn(
                              "relative flex items-center gap-2.5 rounded-lg text-sm cursor-pointer",
                              "transition-colors duration-200 ease-out m-0 pl-2.5 pr-3 py-1.5",
                              item.disabled && "opacity-50 cursor-not-allowed",
                              isDestructive && isHovered
                                ? "text-destructive"
                                : isDestructive
                                  ? "text-muted-foreground hover:text-destructive"
                                  : isHovered
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {isHovered && !item.disabled && (
                              <motion.div
                                layoutId="smoothDropdownIndicator"
                                className={cn(
                                  "absolute inset-0 rounded-lg",
                                  isDestructive
                                    ? "bg-destructive/10"
                                    : "bg-muted"
                                )}
                                transition={{
                                  type: "spring",
                                  damping: 30,
                                  stiffness: 520,
                                  mass: 0.8,
                                }}
                              />
                            )}
                            {isHovered && !item.disabled && (
                              <motion.div
                                layoutId="smoothDropdownLeftBar"
                                className={cn(
                                  "absolute left-0 top-0 bottom-0 my-auto w-[3px] h-4 rounded-full",
                                  isDestructive
                                    ? "bg-destructive"
                                    : "bg-foreground"
                                )}
                                transition={{
                                  type: "spring",
                                  damping: 30,
                                  stiffness: 520,
                                  mass: 0.8,
                                }}
                              />
                            )}
                            {item.icon && (
                              <span className="relative z-10 shrink-0">
                                <item.icon
                                  className={cn(
                                    "w-4 h-4",
                                    item.iconClassName
                                  )}
                                />
                                {typeof item.badge === "number" && item.badge > 0 && (
                                  <span
                                    className={cn(
                                      "absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1",
                                      "text-[10px] font-semibold leading-none",
                                      item.badgeClassName ?? "bg-primary text-primary-foreground"
                                    )}
                                  >
                                    {item.badge > 99 ? "99+" : item.badge}
                                  </span>
                                )}
                              </span>
                            )}
                            <span className="font-medium relative z-10 truncate">
                              {item.label}
                            </span>
                          </motion.li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
