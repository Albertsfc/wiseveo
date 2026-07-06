"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ProgressWithLabel } from "@/components/ui/progress-with-label"
import { CalendarSync, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface GoogleSyncButtonProps {
  from: string // "YYYY-MM-DD"
  to: string   // "YYYY-MM-DD"
}

interface SyncResult {
  synced: number
  errors: number
  deleted: number
}

interface StreamPayload {
  type: "status" | "progress" | "done" | "error"
  phase?: string
  current?: number
  total?: number
  percent?: number
  message?: string
  result?: SyncResult
}

function compactSyncPhase(phase?: string): string {
  if (!phase) return "Sincronizando"
  if (phase.includes("Removendo")) return "Removendo antigos"
  if (phase.includes("Sincronizando")) return "Sincronizando"
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

async function readSyncStream(
  res: Response,
  onMessage: (payload: StreamPayload) => void,
): Promise<SyncResult> {
  if (!res.body) {
    throw new Error("Resposta de sincronização sem stream")
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
        throw new Error(payload.message || "Erro ao sincronizar")
      }

      if (payload.type === "done" && payload.result) {
        return payload.result
      }

      separatorIndex = buffer.indexOf("\n\n")
    }
  }

  throw new Error("Sincronização encerrada sem resposta final")
}

export function GoogleSyncButton({ from, to }: GoogleSyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState("Preparando")

  async function handleSync() {
    setIsSyncing(true)
    setProgress(0)
    setProgressLabel("Preparando")

    try {
      const res = await fetch("/api/calendar/sync-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Falha na sincronização")
      }

      let data: SyncResult
      const contentType = res.headers.get("content-type") ?? ""

      if (contentType.includes("text/event-stream")) {
        data = await readSyncStream(res, (payload) => {
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
            setProgressLabel(`${compactSyncPhase(payload.phase)}${suffix}`)
          }
        })
      } else {
        data = await res.json()
      }

      const deletedMsg =
        data.deleted > 0 ? ` (${data.deleted} antigo(s) substituído(s))` : ""

      if (data.errors > 0 && data.synced === 0) {
        toast.error(
          `Falha ao sincronizar: ${data.errors} erro(s). Verifique se a Google Calendar API está habilitada.`,
        )
      } else if (data.errors > 0) {
        toast.warning(
          `${data.synced} evento(s) sincronizado(s), ${data.errors} erro(s)${deletedMsg}`,
        )
      } else {
        toast.success(
          `${data.synced} evento(s) sincronizado(s)${deletedMsg}`,
        )
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Erro ao sincronizar com Google Calendar",
      )
    } finally {
      setIsSyncing(false)
      setProgress(0)
      setProgressLabel("Preparando")
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full cursor-pointer"
        onClick={handleSync}
        disabled={isSyncing}
      >
        {isSyncing ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <CalendarSync className="h-4 w-4 mr-2" />
        )}
        {isSyncing ? "Sincronizando..." : "Sincronizar com Google Calendar"}
      </Button>

      {isSyncing && (
        <ProgressWithLabel value={progress} label={progressLabel} />
      )}
    </div>
  )
}
