import { NextResponse } from "next/server"

type ApiErrorBody = {
  error: {
    code: string
    message: string
  }
}

function error(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } } satisfies ApiErrorBody, { status })
}

export const apiErrors = {
  badRequest: (message = "Bad request") => error(400, "BAD_REQUEST", message),
  unauthorized: (message = "Unauthorized") => error(401, "UNAUTHORIZED", message),
  forbidden: (message = "Forbidden") => error(403, "FORBIDDEN", message),
  notFound: (message = "Not found") => error(404, "NOT_FOUND", message),
  conflict: (message = "Conflict") => error(409, "CONFLICT", message),
  internal: (message = "Internal server error") =>
    error(500, "INTERNAL_SERVER_ERROR", message),
}
