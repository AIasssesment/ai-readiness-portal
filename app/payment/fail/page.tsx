import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { t } from "@/lib/i18n"
import { getServerLocale } from "@/lib/i18n-server"

export default async function PaymentFailPage() {
  const locale = await getServerLocale()
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <CardTitle>{t(locale, "payment.fail.title")}</CardTitle>
          <CardDescription>{t(locale, "payment.fail.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/portal">{t(locale, "payment.fail.goToPortal")}</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/portal/unlock-demo">{t(locale, "payment.fail.tryDemo")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
