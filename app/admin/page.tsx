import { isAdmin } from '@/lib/admin/auth'
import { AdminEditor } from '@/components/admin/admin-editor'
import { AdminLogin } from '@/components/admin/admin-login'
export const dynamic = 'force-dynamic'
export default async function AdminPage() {
  const enabled = Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 12)
  if (!enabled) return <main className="min-h-dvh bg-zinc-950 p-12 text-white"><h1 className="text-2xl font-bold">관리자 기능 비활성화</h1><p className="mt-3">서버 환경 변수 ADMIN_PASSWORD를 12자 이상으로 설정한 후 서버를 다시 시작하세요.</p></main>
  return await isAdmin() ? <AdminEditor/> : <AdminLogin/>
}
