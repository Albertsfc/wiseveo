import { Heart } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

export function SiteFooter() {
  const t = useTranslations("common.siteFooter")

  return (
    <footer className="border-t bg-background">
      <div className="px-4 py-6 lg:px-6">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{t("madeWith")}</span>
            <Heart className="h-4 w-4 fill-gray text-gray" />
            <span>{t("by")}</span>
            <span className="font-medium text-foreground">
              {t("brandName")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("tagline")}
          </p>
        </div>
      </div>
    </footer>
  )
}
