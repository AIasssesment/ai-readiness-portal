import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, Mail } from "lucide-react"
import { t } from "@/lib/i18n"
import { getServerLocale } from "@/lib/i18n-server"

export default async function SignUpSuccessPage() {
  const locale = await getServerLocale()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t(locale, "auth.signupSuccess.title")}</CardTitle>
          <CardDescription>
            {t(locale, "auth.signupSuccess.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {t(locale, "auth.signupSuccess.instructions")}
          </p>
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Brain className="h-4 w-4 text-primary" />
              <span className="font-medium">{t(locale, "auth.signupSuccess.portalName")}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login">{t(locale, "auth.signupSuccess.backToSignIn")}</Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            {t(locale, "auth.signupSuccess.missingEmail")}
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
