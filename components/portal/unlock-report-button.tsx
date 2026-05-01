"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/components/language-provider"

type UnlockReportButtonProps = {
  label?: string
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
}

export function UnlockReportButton({
  label,
  className,
  variant = "outline",
}: UnlockReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()
  const resolvedLabel = label ?? t("unlock.fullReport")

  const handlePurchase = async () => {
    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))

    await supabase
      .from("clients")
      .update({ has_extended_access: true })
      .eq("id", "self")

    setIsProcessing(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button variant={variant} className={className} onClick={() => setOpen(true)}>
        {resolvedLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-border bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{t("unlock.purchaseTitle")}</DialogTitle>
            <DialogDescription>
              {t("unlock.purchaseDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3 rounded-xl bg-secondary p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("unlock.extendedReport")}</span>
                <span className="font-semibold">$29.00</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="font-semibold">{t("unlock.total")}</span>
                <span className="text-lg font-bold text-primary">$29.00</span>
              </div>
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
              <p className="text-center text-sm text-muted-foreground">
                <strong className="text-foreground">{t("unlock.demoMode")}</strong> {t("unlock.demoMessage")}
              </p>
            </div>

            <Button
              className="h-12 w-full rounded-xl"
              onClick={handlePurchase}
              disabled={isProcessing}
            >
              {isProcessing ? t("unlock.processing") : t("unlock.completePurchase")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
