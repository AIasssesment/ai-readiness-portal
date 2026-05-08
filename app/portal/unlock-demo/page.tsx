import { notFound } from "next/navigation"
import { UnlockDemoContent } from "@/components/portal/unlock-demo-content"

function demoAllowed() {
  if (process.env.NODE_ENV === "development") return true
  return process.env.NEXT_PUBLIC_SHOW_UNLOCK_DEMO === "true"
}

export default async function UnlockDemoPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; assessmentId?: string }>
}) {
  const resolvedSearchParams = await searchParams
  if (!demoAllowed()) {
    notFound()
  }

  return (
    <UnlockDemoContent
      clientId={resolvedSearchParams.clientId}
      assessmentId={resolvedSearchParams.assessmentId}
    />
  )
}
