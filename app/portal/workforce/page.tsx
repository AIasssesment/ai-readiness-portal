import { WorkforceManager } from "@/components/portal/workforce-manager"
import { t } from "@/lib/i18n"
import { getServerLocale } from "@/lib/i18n-server"

export default async function WorkforcePage() {
  const locale = await getServerLocale()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t(locale, "workforce.title")}</h1>
        <p className="text-muted-foreground">
          {t(locale, "workforce.subtitle")}
        </p>
      </div>

      <WorkforceManager />
    </div>
  )
}
