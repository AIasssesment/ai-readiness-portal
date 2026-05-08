"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import { AlertTriangle, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="dark">
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_45%)]" />
          <div className="relative w-full max-w-xl rounded-2xl border border-border/60 bg-card/95 p-7 text-center shadow-2xl backdrop-blur">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-8 ring-destructive/5">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-destructive/90">Global failure</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Application error</h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              The app encountered a critical error. The service may be temporarily unavailable.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button onClick={reset} className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                Try again
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reload page
              </Button>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
