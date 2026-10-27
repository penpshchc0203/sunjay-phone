import { NextResponse } from 'next/server'
import { adminCookieName, adminCookieValue, validPassword } from '@/lib/admin/auth'
export async function POST(req: Request) {
  let password = ''
  try { const body = await req.json(); password = String(body.password || '') } catch {}
  if (!validPassword(password)) return NextResponse.json({error:'관리자 암호가 올바르지 않거나 ADMIN_PASSWORD가 설정되지 않았습니다.'},{status:401})
  const response = NextResponse.json({ok:true})
  response.cookies.set(adminCookieName, adminCookieValue(), {httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:60*60*8})
  return response
}
