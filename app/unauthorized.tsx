import { ShieldAlert } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function UnauthorizedPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_45%)]" />
      <div className="relative w-full max-w-xl rounded-2xl border border-border/60 bg-card/95 p-7 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 ring-8 ring-amber-500/5">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-500/90">401 unauthorized</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Sign in required</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Your session is missing or expired. Sign in again to continue.
        </p>
        <div className="mt-7 flex justify-center">
          <Button asChild>
            <Link href="/auth/login">Go to login</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
