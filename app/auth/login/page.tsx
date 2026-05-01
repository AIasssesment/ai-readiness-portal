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
import { tr } from "@/lib/i18n"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { locale } = useLanguage()

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
          <CardTitle className="text-2xl">{tr(locale, "Welcome Back", "З поверненням")}</CardTitle>
          <CardDescription>
            {tr(locale, "Sign in to access your AI Readiness Portal", "Увійдіть, щоб отримати доступ до AI Readiness Portal")}
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
              <Label htmlFor="email">{tr(locale, "Email", "Email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{tr(locale, "Password", "Пароль")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={tr(locale, "Enter your password", "Введіть ваш пароль")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tr(locale, "Signing in...", "Вхід...")}
                </>
              ) : (
                tr(locale, "Sign In", "Увійти")
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {tr(locale, "Don't have an account?", "Немає акаунта?")}{" "}
              <Link href="/auth/sign-up" className="text-primary hover:underline">
                {tr(locale, "Sign up", "Зареєструватися")}
              </Link>
            </p>
            <p className="text-sm text-muted-foreground text-center">
              <Link href="/" className="text-primary hover:underline">
                {tr(locale, "Take the free assessment", "Пройти безкоштовне оцінювання")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
