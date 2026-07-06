import { Card, CardHeader, CardTitle } from "@/components/ui/card"

export default function InsightsPage() {
  return (
    <div className="flex-1 space-y-6 px-4 lg:px-6 pt-0">

      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 50 }).map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <CardTitle />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
