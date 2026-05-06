"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Loader2 } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { localizedHomePath } from "@/lib/locale-path"

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6C17 2.9 14.7 2 12 2 6.9 2 2.8 6.3 2.8 11.5S6.9 21 12 21c6.9 0 9.2-4.9 9.2-7.4 0-.5 0-.9-.1-1.3H12z"
      />
      <path fill="#34A853" d="M2.8 11.5c0 1.7.4 3.3 1.2 4.6l3.5-2.7c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9L4 6.9c-.8 1.4-1.2 3-1.2 4.6z" />
      <path fill="#FBBC05" d="M12 21c2.7 0 5-1 6.7-2.7l-3.2-2.5c-.9.6-2 .9-3.5.9-2.6 0-4.8-1.8-5.6-4.2l-3.4 2.7C4.7 18.6 8.1 21 12 21z" />
      <path fill="#4285F4" d="M18.7 18.3c1.9-1.8 2.5-4.4 2.5-6.9 0-.5 0-.9-.1-1.3H12v3.9h5.5c-.3 1.5-1.1 2.9-2.3 3.8l3.5 2.5z" />
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { locale, t } = useLanguage()
  const googleLabel = locale === "uk" ? "Увійти через Google" : "Continue with Google"
  const orLabel = locale === "uk" ? "або" : "or"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    router.push("/portal")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t("auth.login.welcomeBack")}</CardTitle>
          <CardDescription>
            {t("auth.login.subtitle")}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.login.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.login.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("auth.login.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              asChild
              variant="outline"
              className="w-full justify-center gap-2 text-foreground hover:text-foreground"
            >
              <Link href="/api/auth/google/start?next=/portal">
                <GoogleIcon />
                {googleLabel}
              </Link>
            </Button>
            <div className="flex w-full items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>{orLabel}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("auth.login.signingIn")}
                </>
              ) : (
                t("auth.login.submit")
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {t("auth.login.noAccount")}{" "}
              <Link href={`/${locale}/auth/sign-up`} className="text-primary hover:underline">
                {t("auth.login.signUpLink")}
              </Link>
            </p>
            <p className="text-sm text-muted-foreground text-center">
              <Link href={localizedHomePath(locale)} className="text-primary hover:underline">
                {t("auth.login.takeAssessment")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
