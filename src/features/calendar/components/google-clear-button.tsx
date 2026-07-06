"use client"

import { useState } from "react"
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

function compactClearPhase(phase?: string): string {
  if (!phase) return "Limpando"
  if (phase.includes("Limpando")) return "Limpando"
  return phase
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

async function readClearStream(
  res: Response,
  onMessage: (payload: StreamPayload) => void,
): Promise<ClearResult> {
  if (!res.body) {
    throw new Error("Resposta de limpeza sem stream")
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
        throw new Error(payload.message || "Erro ao limpar eventos")
      }

      if (payload.type === "done" && payload.result) {
        return payload.result
      }

      separatorIndex = buffer.indexOf("\n\n")
    }
  }

  throw new Error("Limpeza encerrada sem resposta final")
}

export function GoogleClearButton() {
  const [isClearing, setIsClearing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState("Preparando")

  async function handleClear() {
    setIsClearing(true)
    setProgress(0)
    setProgressLabel("Preparando")

    try {
      const res = await fetch("/api/calendar/clear-google", {
        method: "POST",
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Falha ao limpar eventos")
      }

      let data: ClearResult
      const contentType = res.headers.get("content-type") ?? ""

      if (contentType.includes("text/event-stream")) {
        data = await readClearStream(res, (payload) => {
          if (payload.type === "status") {
            setProgress(typeof payload.percent === "number" ? payload.percent : 0)
            setProgressLabel("Preparando")
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
        toast.info("Nenhum evento WISEVEO encontrado no Google Calendar")
      } else {
        toast.success(
          `${data.deleted} evento(s) removido(s) do Google Calendar`,
        )
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Erro ao limpar Google Calendar",
      )
    } finally {
      setIsClearing(false)
      setProgress(0)
      setProgressLabel("Preparando")
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
            {isClearing ? "Limpando..." : "Limpar Google Calendar"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar Google Calendar</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá todos os eventos criados pelo WISEVEO do seu Google
              Calendar. Eventos criados manualmente não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClear}
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Limpar tudo
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
