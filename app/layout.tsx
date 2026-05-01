import type { Metadata } from 'next'
import { DM_Sans, Syne } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { LanguageProvider } from '@/components/language-provider'
import { getServerLocale } from '@/lib/i18n-server'
import './globals.css'

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600']
});
const syne = Syne({ 
  subsets: ["latin"],
  variable: '--font-syne',
  weight: ['400', '600', '700', '800']
});

export const metadata: Metadata = {
  title: 'RPA Community | Free RPA Readiness Assessment',
  description: 'Discover your RPA readiness in 3 minutes. Get matched with Ukrainian RPA experts and unlock automation opportunities.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getServerLocale()

  return (
    <html lang={locale} className="dark">
      <body className={`${dmSans.variable} ${syne.variable} font-sans antialiased`}>
        <LanguageProvider initialLocale={locale}>
          {children}
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}
