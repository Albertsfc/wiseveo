import {
  CheckCircle2,
  Circle,
  Clock,
  PlayCircle,
} from "lucide-react"

// `labelKey` maps to tasks.options.{statuses,priorities,categories}.<labelKey>
// in src/i18n/messages — display text is resolved via t() at render sites,
// `value` stays the stable wire value used for filtering/matching.
export const categories = [
  {
    value: "bug",
    labelKey: "bug",
  },
  {
    value: "feature",
    labelKey: "feature",
  },
  {
    value: "documentation",
    labelKey: "documentation",
  },
  {
    value: "improvement",
    labelKey: "improvement",
  },
  {
    value: "refactor",
    labelKey: "refactor",
  },
]

export const statuses = [
  {
    value: "pending",
    labelKey: "pending",
    icon: Clock,
  },
  {
    value: "todo",
    labelKey: "todo",
    icon: Circle,
  },
  {
    value: "in progress",
    labelKey: "inProgress",
    icon: PlayCircle,
  },
  {
    value: "completed",
    labelKey: "completed",
    icon: CheckCircle2,
  },
]

export const priorities = [
  {
    labelKey: "minor",
    value: "minor"
  },
  {
    labelKey: "normal",
    value: "normal"
  },
  {
    labelKey: "important",
    value: "important"
  },
  {
    labelKey: "critical",
    value: "critical"
  },
]
