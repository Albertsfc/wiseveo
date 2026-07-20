import { getLocale } from "next-intl/server"

import { resolveAppLocale } from "@/i18n/config"
import { FAQList } from "./components/faq-list"
import { FeaturesGrid } from "./components/features-grid"

// Import data
import categoriesData from "./data/categories.json"
import featuresData from "./data/features.json"
import faqsPtBR from "./data/faqs.pt-BR.json"
import faqsEnUS from "./data/faqs.en-US.json"
import faqsEs419 from "./data/faqs.es-419.json"

const faqsByLocale = {
  "pt-BR": faqsPtBR,
  "en-US": faqsEnUS,
  "es-419": faqsEs419,
}

export default async function FAQsPage() {
  const locale = resolveAppLocale(await getLocale())
  const faqsData = faqsByLocale[locale]

  return (
    <div className="px-4 lg:px-6">
      <FAQList faqs={faqsData} categories={categoriesData} />
      <FeaturesGrid features={featuresData} />
    </div>
  )
}
