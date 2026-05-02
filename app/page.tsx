import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { LOCALE_COOKIE_NAME } from '@/lib/i18n'

export default async function RootPage() {
  const locale = (await cookies()).get(LOCALE_COOKIE_NAME)?.value === 'uk' ? 'uk' : 'en'
  redirect(`/${locale}`)
}
