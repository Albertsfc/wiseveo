import { getSessionUserId } from "@/lib/session"
import { clearGoogleCalendarEvents } from "@/features/calendar/services/sync-google-calendar"

function encodeSse(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`)
}

export async function POST() {
  const userId = await getSessionUserId()

  if (!userId) {
    return Response.json(
      { error: "Não autenticado" },
      { status: 401 },
    )
  }

  try {
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (payload: unknown) => controller.enqueue(encodeSse(payload))

        try {
          send({
            type: "status",
            phase: "Preparando limpeza",
            current: 0,
            total: 0,
            percent: 0,
          })

          const result = await clearGoogleCalendarEvents(
            userId,
            (current, total, phase) => {
              const percent =
                total > 0 ? Math.round((current / total) * 100) : 0
              send({ type: "progress", phase, current, total, percent })
            },
          )

          send({ type: "done", result })
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Erro ao limpar eventos"
          send({ type: "error", message })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch (err) {
    console.error("[clear-google API] error:", err)
    const message =
      err instanceof Error ? err.message : "Erro ao limpar eventos"
    return Response.json({ error: message }, { status: 500 })
  }
}
