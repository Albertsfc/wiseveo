import { Card, CardContent } from "@/components/ui/card"
import {Users, CreditCard, UserCheck, Clock5, TrendingUp, TrendingDown, ArrowUpRight} from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { formatPercentValue } from "@/lib/monetary"
import { cn } from '@/lib/utils'


const performanceMetrics = [
  {
    titleKey: 'totalUsers',
    current: '2.4M',
    previous: '1.8M',
    growth: 33.3,
    icon: Users,
  },
  {
    titleKey: 'paidUsers',
    current: '12.5K',
    previous: '9.2K',
    growth: 35.9,
    icon: CreditCard,
  },
  {
    titleKey: 'activeUsers',
    current: '8.9k',
    previous: '6.7k',
    growth: 32.8,
    icon: UserCheck,
  },
  {
    titleKey: 'pendingUsers',
    current: '17%',
    previous: '24%',
    growth: -8.0,
    icon: Clock5,
  },
] as const

export function StatCards() {
  const t = useTranslations("users.statCards")

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {performanceMetrics.map((metric, index) => (
        <Card key={index} className='border'>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <metric.icon className='text-muted-foreground size-6' />
              <Badge
                variant='outline'
                className={cn(
                  metric.growth >= 0
                    ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400'
                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400',
                )}
              >
                {metric.growth >= 0 ? (
                  <>
                    <TrendingUp className='me-1 size-3' />
                    {formatPercentValue(metric.growth, 1, true)}
                  </>
                ) : (
                  <>
                    <TrendingDown className='me-1 size-3' />
                    {formatPercentValue(metric.growth, 1)}
                  </>
                )}
              </Badge>
            </div>

            <div className='space-y-2'>
              <p className='text-muted-foreground text-sm font-medium'>{t(metric.titleKey)}</p>
              <div className='text-2xl font-bold'>{metric.current}</div>
              <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                <span>{t("fromPrevious", { previous: metric.previous })}</span>
                <ArrowUpRight className='size-3' />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
