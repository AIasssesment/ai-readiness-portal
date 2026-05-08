"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Loader2 } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { parseApiErrorMessage } from "@/lib/http/parse-api-error-message"

export default function ForgotPasswordPage() {
  const { locale } = useLanguage()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const title = locale === "uk" ? "Відновлення пароля" : "Forgot password"
  const subtitle =
    locale === "uk"
      ? "Введіть email, і ми надішлемо посилання для скидання."
      : "Enter your email and we will send a reset link."
  const submitLabel = locale === "uk" ? "Надіслати посилання" : "Send reset link"
  const backLabel = locale === "uk" ? "Повернутися до входу" : "Back to sign in"

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      })
      const payload = (await response.json()) as unknown
      if (!response.ok) {
        setError(parseApiErrorMessage(payload) || (locale === "uk" ? "Не вдалося надіслати запит" : "Failed to process request"))
        setIsLoading(false)
        return
      }
      router.push(`/${locale}/auth/login?reset_email=sent`)
      router.refresh()
    } catch {
      setError(locale === "uk" ? "Помилка запиту" : "Request failed")
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
          <CardContent className="space-y-4">
            {error ? <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {locale === "uk" ? "Надсилання..." : "Sending..."}
                </>
              ) : (
                submitLabel
              )}
            </Button>
            <Link href={`/${locale}/auth/login`} className="text-sm text-primary hover:underline">
              {backLabel}
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
