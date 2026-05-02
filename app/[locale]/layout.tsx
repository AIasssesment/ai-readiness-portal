import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LanguageProvider } from '@/components/language-provider'
import { isPublicLocale } from '@/lib/locale-path'
import { t, type Locale } from '@/lib/i18n'

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  if (!isPublicLocale(raw)) notFound()
  const locale = raw as Locale

  const title = t(locale, 'site.homeTitle')
  const description = t(locale, 'site.homeDescription')

  const base = process.env.NEXT_PUBLIC_SITE_URL
  if (!base) {
    return {
      title,
      description,
      alternates: { canonical: `/${locale}` },
    }
  }

  const origin = base.replace(/\/$/, '')
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: `${origin}/en`,
        uk: `${origin}/uk`,
        'x-default': `${origin}/en`,
      },
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!isPublicLocale(locale)) notFound()

  return <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
}
