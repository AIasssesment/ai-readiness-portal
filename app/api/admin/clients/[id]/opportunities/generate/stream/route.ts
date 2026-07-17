import { requireAdmin } from "@/lib/auth/admin"
import { apiErrors } from "@/lib/http/api-errors"
import {
  OpportunityServiceError,
  generateOpportunitiesForClient,
  type GenerationEvent,
} from "@/lib/opportunities/service"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/**
 * Streams generation progress as NDJSON so the admin can watch each stage
 * (research → profile → generating → scoring → saving) in real time.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if (!admin) return apiErrors.forbidden()

  const { id } = await params
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: GenerationEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
      }

      try {
        const { count } = await generateOpportunitiesForClient(id, { onProgress: send })
        send({ type: "done", count })
      } catch (error) {
        const status = error instanceof OpportunityServiceError ? error.status : 500
        const message =
          error instanceof OpportunityServiceError
            ? error.message
            : "Failed to generate opportunities"
        if (!(error instanceof OpportunityServiceError)) {
          console.error("admin opportunities stream error", error)
        }
        send({ type: "error", status, message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
