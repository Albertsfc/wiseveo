import { getLocale } from "next-intl/server"

import { resolveAppLocale } from "@/i18n/config"
import { PricingPlans } from "@/components/pricing-plans"
import { FeaturesGrid } from "./components/features-grid"
import { FAQSection } from "./components/faq-section"

// Import data
import featuresPtBR from "./data/features.pt-BR.json"
import featuresEnUS from "./data/features.en-US.json"
import featuresEs419 from "./data/features.es-419.json"
import faqsPtBR from "./data/faqs.pt-BR.json"
import faqsEnUS from "./data/faqs.en-US.json"
import faqsEs419 from "./data/faqs.es-419.json"
import plansPtBR from "./data/plans.pt-BR.json"
import plansEnUS from "./data/plans.en-US.json"
import plansEs419 from "./data/plans.es-419.json"

const featuresByLocale = {
  "pt-BR": featuresPtBR,
  "en-US": featuresEnUS,
  "es-419": featuresEs419,
}

const faqsByLocale = {
  "pt-BR": faqsPtBR,
  "en-US": faqsEnUS,
  "es-419": faqsEs419,
}

const plansByLocale = {
  "pt-BR": plansPtBR,
  "en-US": plansEnUS,
  "es-419": plansEs419,
}

export default async function PricingPage() {
  const locale = resolveAppLocale(await getLocale())
  const featuresData = featuresByLocale[locale]
  const faqsData = faqsByLocale[locale]
  const plansData = plansByLocale[locale]

  return (
    <div className="px-4 lg:px-6">
      {/* Pricing Cards */}
      <section className='pb-12' id='pricing'>
        <PricingPlans mode="pricing" plans={plansData} />
      </section>

      {/* Features Section */}
      <FeaturesGrid features={featuresData} />

      {/* FAQ Section */}
      <FAQSection faqs={faqsData} />
    </div>
  )
}
