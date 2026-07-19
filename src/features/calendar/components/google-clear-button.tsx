"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { ProgressWithLabel } from "@/components/ui/progress-with-label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { CALENDAR_CLEAR_PHASE } from "../types"

interface ClearResult {
  deleted: number
}

interface StreamPayload {
  type: "status" | "progress" | "done" | "error"
  phase?: string
  current?: number
  total?: number
  percent?: number
  message?: string
  result?: ClearResult
}

async function parseErrorPayload(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({}))
  return data.error || fallback
}

function parseSsePayload(block: string): StreamPayload | null {
  const lines = block
    .split("\n")
    .filter((line) => line.startsWith("data:"))

  if (lines.length === 0) return null

  const raw = lines
    .map((line) => line.slice(5).trim())
    .join("\n")

  if (!raw) return null

  const parsed: unknown = JSON.parse(raw)
  if (!parsed || typeof parsed !== "object" || !("type" in parsed)) {
    return null
  }

  return parsed as StreamPayload
}

export function GoogleClearButton() {
  const t = useTranslations("calendar.googleClear")
  const tCommon = useTranslations("common")
  const [isClearing, setIsClearing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState(t("preparing"))

  function compactClearPhase(phase?: string): string {
    if (!phase) return t("phaseClearing")
    if (phase.includes(CALENDAR_CLEAR_PHASE.clearingEvents)) return t("phaseClearing")
    return phase
  }

  async function readClearStream(
    res: Response,
    onMessage: (payload: StreamPayload) => void,
  ): Promise<ClearResult> {
    if (!res.body) {
      throw new Error(t("errors.noStream"))
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      let separatorIndex = buffer.indexOf("\n\n")
      while (separatorIndex !== -1) {
        const chunk = buffer.slice(0, separatorIndex).trim()
        buffer = buffer.slice(separatorIndex + 2)

        const payload = parseSsePayload(chunk)
        if (!payload) {
          separatorIndex = buffer.indexOf("\n\n")
          continue
        }

        onMessage(payload)

        if (payload.type === "error") {
          throw new Error(payload.message || t("errors.clearFailed"))
        }

        if (payload.type === "done" && payload.result) {
          return payload.result
        }

        separatorIndex = buffer.indexOf("\n\n")
      }
    }

    throw new Error(t("errors.noFinalResponse"))
  }

  async function handleClear() {
    setIsClearing(true)
    setProgress(0)
    setProgressLabel(t("preparing"))

    try {
      const res = await fetch("/api/calendar/clear-google", {
        method: "POST",
      })

      if (!res.ok) {
        throw new Error(await parseErrorPayload(res, t("errors.clearFailed")))
      }

      let data: ClearResult
      const contentType = res.headers.get("content-type") ?? ""

      if (contentType.includes("text/event-stream")) {
        data = await readClearStream(res, (payload) => {
          if (payload.type === "status") {
            setProgress(typeof payload.percent === "number" ? payload.percent : 0)
            setProgressLabel(t("preparing"))
            return
          }

          if (payload.type === "progress") {
            const current = payload.current ?? 0
            const total = payload.total ?? 0
            const suffix = total > 0 ? ` ${current}/${total}` : ""
            setProgress(typeof payload.percent === "number" ? payload.percent : 0)
            setProgressLabel(`${compactClearPhase(payload.phase)}${suffix}`)
          }
        })
      } else {
        data = await res.json()
      }

      if (data.deleted === 0) {
        toast.info(t("toasts.noEvents"))
      } else {
        toast.success(t("toasts.removed", { count: data.deleted }))
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.generic"))
    } finally {
      setIsClearing(false)
      setProgress(0)
      setProgressLabel(t("preparing"))
    }
  }

  return (
    <div className="space-y-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full cursor-pointer text-destructive hover:text-destructive"
            disabled={isClearing}
          >
            {isClearing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {isClearing ? t("clearing") : t("button")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("button")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClear}
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("confirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isClearing && (
        <ProgressWithLabel value={progress} label={progressLabel} />
      )}
    </div>
  )
}
