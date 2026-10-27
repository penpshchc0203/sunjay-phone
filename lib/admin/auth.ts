import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const COOKIE = 'virtual-phone-admin'
function token(password: string) { return createHmac('sha256', password).update('virtual-phone-admin-v1').digest('hex') }
export async function isAdmin() {
  const password = process.env.ADMIN_PASSWORD
  if (!password || password.length < 12) return false
  const stored = (await cookies()).get(COOKIE)?.value || ''
  const expected = token(password)
  if (stored.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(stored), Buffer.from(expected))
}
export function validPassword(value: string) {
  const password = process.env.ADMIN_PASSWORD
  if (!password || password.length < 12) return false
  const a = Buffer.from(value), b = Buffer.from(password)
  return a.length === b.length && timingSafeEqual(a, b)
}
export function adminCookieValue() { return token(process.env.ADMIN_PASSWORD || '') }
export const adminCookieName = COOKIE
