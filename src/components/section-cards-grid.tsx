import { cn } from "@/lib/utils"

interface SectionCardsGridProps extends React.ComponentProps<"div"> {
  children: React.ReactNode
}

export function SectionCardsGrid({
  className,
  children,
  ...props
}: SectionCardsGridProps) {
  return (
    <div
      className={cn(
        // Card gradients
        "*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs",
        // Responsive grid:
        // mobile (default) : 1 column — stacked for easy scrolling
        // sm (≥ 480px)      : still 1 column (large phones in portrait)
        // md (≥ 768px)      : 2 columns — tablet portrait
        // xl (≥ 1280px)     : 4 columns — desktop (original behavior)
        "grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
