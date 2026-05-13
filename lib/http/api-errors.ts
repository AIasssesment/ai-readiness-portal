function json(message: string, status: number) {
  return Response.json({ error: { message } }, { status })
}

/** Route handler helpers; body matches `parseApiErrorMessage` expectations. */
export const apiErrors = {
  badRequest: (message: string) => json(message, 400),
  unauthorized: (message = "Unauthorized") => json(message, 401),
  forbidden: (message = "Forbidden") => json(message, 403),
  notFound: (message = "Not found") => json(message, 404),
  conflict: (message: string) => json(message, 409),
  tooManyRequests: (message = "Too many requests") => json(message, 429),
  internal: (message = "Internal server error") => json(message, 500),
}
