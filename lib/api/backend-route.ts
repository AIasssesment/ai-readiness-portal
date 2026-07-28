import "server-only"

import { NextResponse } from "next/server"
import { ApiClientError } from "@/lib/api/client"

/** Map Nest/apiFetch failures to the unified `{ error: { code, message } }` JSON body. */
export function backendErrorResponse(error: unknown, fallbackMessage = "Request failed") {
  if (error instanceof ApiClientError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.status },
    )
  }

  console.error(fallbackMessage, error)
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: fallbackMessage } },
    { status: 500 },
  )
}
