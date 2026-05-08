import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PaymentFailPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <CardTitle>Оплата не пройшла</CardTitle>
          <CardDescription>Спробуйте ще раз або використайте інший спосіб оплати.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/portal">Go to portal</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/portal/unlock-demo">Try payment flow</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
