'use client'
import { Bell, X, Trash2 } from 'lucide-react'
import { APPS } from '@/lib/phone/apps'
import { AppIconTile } from './app-icon'
import { useNotifications } from './notification-provider'
export function NotificationCenter(){
 const {notifications,open,setOpen,dismiss,dismissAll,openNotification}=useNotifications()
 if(!open)return null
 return <section className="absolute inset-0 z-[60] flex flex-col bg-[#161a23]/95 text-white backdrop-blur-2xl" aria-label="알림 센터" role="dialog">
   <header className="flex shrink-0 items-center justify-between px-5 pb-3 pt-12"><h2 className="flex items-center gap-2 text-xl font-semibold"><Bell size={20}/> 알림</h2><button aria-label="알림 센터 닫기" onClick={()=>setOpen(false)} className="rounded-full bg-white/10 p-2"><X size={20}/></button></header>
   <div className="flex items-center justify-end px-5 pb-3"><button onClick={dismissAll} disabled={!notifications.length} className="flex items-center gap-1 text-xs text-white/75 disabled:opacity-40"><Trash2 size={14}/> 전체 삭제</button></div>
   <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 pb-6 touch-pan-y">
    {!notifications.length&&<p className="pt-12 text-center text-sm text-white/60">새 알림이 없습니다.</p>}
    {notifications.map(n=><div key={n.id} className="flex items-start gap-2 rounded-2xl bg-white/15 p-3">
      <button onClick={()=>openNotification(n)} className="flex min-w-0 flex-1 items-start gap-3 text-left" aria-label={`${APPS[n.appId].name} 알림 열기`}><AppIconTile appId={n.appId} className="w-9 shrink-0"/><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-sm">{n.title}</strong><small className="shrink-0 text-[10px] text-white/65">{n.timeLabel}</small></span><span className="mt-1 block text-xs text-white/80">{n.body}</span></span></button>
      <button onClick={()=>dismiss(n.id)} aria-label={`${n.title} 알림 삭제`} className="rounded-full p-1 text-white/70"><X size={16}/></button>
    </div>)}
   </div>
 </section>
}
