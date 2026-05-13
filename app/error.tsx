"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.16),transparent_45%)]" />
      <div className="relative w-full max-w-xl rounded-2xl border border-border/60 bg-card/95 p-7 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-8 ring-destructive/5">
          <AlertCircle className="h-7 w-7" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-destructive/90">Technical issue</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">We couldn&apos;t load this page</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Something went wrong while loading this screen. It may be a temporary problem on our side or with the
          network. If the problem continues, try again in a few minutes.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" variant="outline" onClick={() => reset()} className="gap-2">
            Try again
          </Button>
          <Button type="button" onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reload page
          </Button>
        </div>
      </div>
    </main>
  )
}
