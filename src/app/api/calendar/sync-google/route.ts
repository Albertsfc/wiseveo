import { type NextRequest } from "next/server"
import { getTranslations } from "next-intl/server"
import { getSessionUserId } from "@/lib/session"
import { syncGoogleCalendar } from "@/features/calendar/services/sync-google-calendar"
import { CALENDAR_SYNC_PHASE } from "@/features/calendar/types"

function encodeSse(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`)
}

export async function POST(request: NextRequest) {
  const t = await getTranslations("api")
  const userId = await getSessionUserId()

  if (!userId) {
    return Response.json(
      { error: t("errors.notAuthenticated") },
      { status: 401 },
    )
  }

  try {
    const body = await request.json()
    const { from, to } = body

    if (!from || !to) {
      return Response.json(
        { error: t("errors.missingDateRange") },
        { status: 400 },
      )
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (payload: unknown) => controller.enqueue(encodeSse(payload))

        try {
          send({
            type: "status",
            phase: CALENDAR_SYNC_PHASE.preparing,
            current: 0,
            total: 0,
            percent: 0,
          })

          const result = await syncGoogleCalendar(
            userId,
            from,
            to,
            (current, total, phase) => {
              const percent =
                total > 0 ? Math.round((current / total) * 100) : 0
              send({ type: "progress", phase, current, total, percent })
            },
          )

          send({ type: "done", result })
        } catch (err) {
          const message =
            err instanceof Error ? err.message : t("calendar.syncFailed")
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
    console.error("[sync-google API] error:", err)
    const message =
      err instanceof Error ? err.message : t("calendar.syncFailed")
    return Response.json({ error: message }, { status: 500 })
  }
}
