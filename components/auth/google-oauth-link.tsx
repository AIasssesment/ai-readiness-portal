"use client"

import { useState, type ReactNode } from "react"

type GoogleOAuthLinkProps = {
  href: string
  children: ReactNode
  className?: string
}

export function GoogleOAuthLink({ href, children, className }: GoogleOAuthLinkProps) {
  const [busy, setBusy] = useState(false)

  return (
    <a
      href={href}
      rel="nofollow noopener"
      aria-disabled={busy}
      className={busy ? `${className ?? ""} pointer-events-none opacity-70`.trim() : className}
      onClick={() => {
        if (busy) return
        setBusy(true)
      }}
    >
      {children}
    </a>
  )
}
