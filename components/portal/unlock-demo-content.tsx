"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UnlockReportButton } from "@/components/portal/unlock-report-button"

type UnlockDemoContentProps = {
  clientId?: string
  assessmentId?: string
}

export function UnlockDemoContent({ clientId, assessmentId }: UnlockDemoContentProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div>
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight">Unlock report — test scenarios</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Each card uses different props on <code className="rounded bg-muted px-1 py-0.5 text-xs">UnlockReportButton</code>.
          Production users do not see this page unless you set{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_SHOW_UNLOCK_DEMO=true</code>.
          <br />
          For readiness-based scenarios pass query params:{" "}
          <code className="ml-1 rounded bg-muted px-1 py-0.5 text-xs">?clientId=&lt;id&gt;&amp;assessmentId=&lt;id&gt;</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Default (happy path)</CardTitle>
          <CardDescription>
            Normal purchase → Monobank checkout when API succeeds (readiness checked if{" "}
            <code className="text-xs">assessmentId</code> is set).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UnlockReportButton
            label="Default unlock"
            variant="default"
            className="gap-2"
            clientId={clientId}
            assessmentId={assessmentId}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Simulated payment failure</CardTitle>
          <CardDescription>
            Fails before invoice creation — shows payment error UI. Use &quot;Try again&quot; after fixing props or try
            another card.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UnlockReportButton
            label="Simulate payment failure"
            variant="destructive"
            className="gap-2"
            simulatePaymentFailure
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Insufficient data — variant A (charge + manual follow-up)</CardTitle>
          <CardDescription>
            Backend readiness + <code className="text-xs">mode=&quot;charge_and_manual&quot;</code>. If the report is not
            ready, the user can still pay; manual follow-up may apply.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UnlockReportButton
            label="Insufficient → manual follow-up"
            variant="outline"
            className="gap-2"
            clientId={clientId}
            assessmentId={assessmentId}
            mode="charge_and_manual"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Insufficient data — variant B (block purchase)</CardTitle>
          <CardDescription>
            Backend readiness + <code className="text-xs">mode=&quot;block&quot;</code>. If data is insufficient, checkout
            is blocked and missing reasons are shown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UnlockReportButton
            label="Insufficient → block"
            variant="secondary"
            className="gap-2"
            clientId={clientId}
            assessmentId={assessmentId}
            mode="block"
          />
        </CardContent>
      </Card>
    </div>
  )
}
