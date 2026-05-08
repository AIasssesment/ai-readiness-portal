import Link from "next/link"
import { Home, LayoutDashboard, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_45%)]" />
      <div className="relative w-full max-w-xl rounded-2xl border border-border/60 bg-card/95 p-7 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-8 ring-primary/5">
          <SearchX className="h-7 w-7" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/90">404 error</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          The page you are looking for does not exist, moved, or the link is outdated.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="gap-2">
            <Link href="/portal">
              <LayoutDashboard className="h-4 w-4" />
              Go to portal
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/" className="gap-2">
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
