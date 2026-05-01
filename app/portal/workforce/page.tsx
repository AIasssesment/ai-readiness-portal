import { WorkforceManager } from "@/components/portal/workforce-manager"

export default function WorkforcePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workforce Data</h1>
        <p className="text-muted-foreground">
          Add role titles and employee counts to power data-driven AI job risk analysis.
        </p>
      </div>

      <WorkforceManager />
    </div>
  )
}
