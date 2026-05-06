import { ShieldX } from "lucide-react"

export default function ForbiddenPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.16),transparent_45%)]" />
      <div className="relative w-full max-w-xl rounded-2xl border border-border/60 bg-card/95 p-7 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-8 ring-destructive/5">
          <ShieldX className="h-7 w-7" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-destructive/90">403 forbidden</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Access denied</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          You do not have permission to open this resource.
        </p>
      </div>
    </main>
  )
}
