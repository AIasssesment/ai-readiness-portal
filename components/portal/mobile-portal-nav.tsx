'use client'

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { PortalNav } from "@/components/portal/portal-nav"
import { useLanguage } from "@/components/language-provider"

type AuthUser = {
  id: string
  email: string
}

type Client = {
  id: string
  company_name: string
  contact_name: string | null
  contact_email: string
}

type RecentChat = {
  id: string
  title: string
  rawTitle: string
  isStarred: boolean
  href: string
}

type RecentAssessment = {
  id: string
  score: number
  label: string
  href: string
}

export function MobilePortalNav({
  user,
  client,
  profileDisplayName,
  recentChats,
  recentAssessments,
  isAdmin = false,
}: {
  user: AuthUser
  client: Client | null
  profileDisplayName?: string | null
  recentChats: RecentChat[]
  recentAssessments: RecentAssessment[]
  isAdmin?: boolean
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t("portal.menu")}>
          <Menu className="h-4 w-4" />
          <span className="sr-only">{t("portal.menu")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[88vw] max-w-[320px] p-0 sm:max-w-[320px]">
        <SheetHeader className="sr-only">
          <SheetTitle>{t("portal.menu")}</SheetTitle>
        </SheetHeader>
        <div
          className="h-full overflow-hidden"
          onClickCapture={(event) => {
            const target = event.target as HTMLElement
            if (target.closest("a")) {
              setOpen(false)
            }
          }}
        >
          <PortalNav
            user={user}
            client={client}
            profileDisplayName={profileDisplayName}
            recentChats={recentChats}
            recentAssessments={recentAssessments}
            isAdmin={isAdmin}
            onNavigate={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
