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

export default function ResetPasswordPage() {
  const { locale } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams])
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const title = locale === "uk" ? "Новий пароль" : "Set new password"
  const subtitle =
    locale === "uk"
      ? "Введіть новий пароль для вашого акаунта."
      : "Enter a new password for your account."

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!token) {
      setError(locale === "uk" ? "Токен скидання відсутній." : "Reset token is missing.")
      return
    }
    if (password.length < 6) {
      setError(locale === "uk" ? "Пароль має бути від 6 символів." : "Password must be at least 6 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError(locale === "uk" ? "Паролі не співпадають." : "Passwords do not match.")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(payload.error || (locale === "uk" ? "Не вдалося змінити пароль." : "Failed to reset password."))
        return
      }
      setIsSuccess(true)
    } catch {
      setError(locale === "uk" ? "Помилка запиту." : "Request failed.")
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
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          {isSuccess ? (
            <>
              <CardContent className="mb-4 flex flex-col items-center gap-3 text-center">
                <div className="rounded-full bg-emerald-500/15 p-3 text-emerald-500">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <p className="text-base font-medium">
                  {locale === "uk" ? "Пароль успішно змінено" : "Password updated successfully"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {locale === "uk"
                    ? "Тепер увійдіть з новим паролем."
                    : "You can now sign in with your new password."}
                </p>
              </CardContent>
              <CardFooter>
                <Button type="button" className="w-full" onClick={() => router.push(`/${locale}/auth/login`)}>
                  {locale === "uk" ? "Перейти до входу" : "Go to sign in"}
                </Button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardContent className="mb-4 space-y-4">
                {error ? <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
                <div className="space-y-2">
                  <Label htmlFor="password">{locale === "uk" ? "Новий пароль" : "New password"}</Label>
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
                  <Label htmlFor="confirmPassword">{locale === "uk" ? "Підтвердіть пароль" : "Confirm password"}</Label>
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
                      {locale === "uk" ? "Збереження..." : "Saving..."}
                    </>
                  ) : locale === "uk" ? (
                    "Зберегти пароль"
                  ) : (
                    "Save password"
                  )}
                </Button>
                <Link href={`/${locale}/auth/login`} className="text-sm text-primary hover:underline">
                  {locale === "uk" ? "Повернутися до входу" : "Back to sign in"}
                </Link>
              </CardFooter>
            </>
          )}
        </form>
      </Card>
    </div>
  )
}
