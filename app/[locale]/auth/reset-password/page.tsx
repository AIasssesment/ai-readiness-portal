"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, CheckCircle2, Loader2 } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { parseApiErrorMessage } from "@/lib/http/parse-api-error-message"

export default function ResetPasswordPage() {
  const { locale, t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams])
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!token) {
      setError(t("auth.resetPassword.tokenMissing"))
      return
    }
    if (password.length < 6) {
      setError(t("auth.resetPassword.passwordMin"))
      return
    }
    if (password !== confirmPassword) {
      setError(t("auth.resetPassword.passwordMismatch"))
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const payload = (await response.json()) as unknown
      if (!response.ok) {
        setError(parseApiErrorMessage(payload) || t("auth.resetPassword.errorApi"))
        return
      }
      setIsSuccess(true)
    } catch {
      setError(t("auth.resetPassword.errorRequest"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t("auth.resetPassword.title")}</CardTitle>
          <CardDescription>{t("auth.resetPassword.subtitle")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          {isSuccess ? (
            <>
              <CardContent className="mb-4 flex flex-col items-center gap-3 text-center">
                <div className="rounded-full bg-emerald-500/15 p-3 text-emerald-500">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <p className="text-base font-medium">
                  {t("auth.resetPassword.successTitle")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("auth.resetPassword.successSubtitle")}
                </p>
              </CardContent>
              <CardFooter>
                <Button type="button" className="w-full" onClick={() => router.push(`/${locale}/auth/login`)}>
                  {t("auth.resetPassword.goToSignIn")}
                </Button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardContent className="mb-4 space-y-4">
                {error ? <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.resetPassword.newPassword")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    minLength={6}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("auth.resetPassword.confirmPassword")}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    minLength={6}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("auth.resetPassword.saving")}
                    </>
                  ) : (
                    t("auth.resetPassword.save")
                  )}
                </Button>
                <Link href={`/${locale}/auth/login`} className="text-sm text-primary hover:underline">
                  {t("auth.resetPassword.backToSignIn")}
                </Link>
              </CardFooter>
            </>
          )}
        </form>
      </Card>
    </div>
  )
}
