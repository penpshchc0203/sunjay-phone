'use client'

import { ChevronUp, Lock, LockOpen } from 'lucide-react'
import { useRef, useState } from 'react'
import { LockNotificationHistory } from './lock-notification-history'
import { formatDate, formatTime, useNow } from '@/hooks/use-now'
import { APPS } from '@/lib/phone/apps'
import { CHARACTER } from '@/config/character'
import { DESIGN } from '@/config/design'
import { useNotifications } from './notification-provider'
import type { AppId } from '@/lib/phone/types'
import { AppIconTile } from './app-icon'
import { usePhone } from './phone-provider'
import { usePhoneEvents,eventNotifications } from './event-provider'

export function LockScreen() {
  const now = useNow()
  const [historyOpen,setHistoryOpen] = useState(false)
  const historyGesture = useRef<{x:number;y:number}|null>(null)
  const { notifications, openNotification } = useNotifications()
  const { unlock, openApp,pushRoute } = usePhone()
  const {executions,deliveredIds,notificationReadIds,notificationDismissedIds,markEventNotificationRead}=usePhoneEvents()
  const eventItems=eventNotifications(executions,deliveredIds).filter(n=>!notificationReadIds.includes(n.id)&&!notificationDismissedIds.includes(n.id))
  const [hours, minutes] = formatTime(now).split(':')
  const swipeStart = useRef<{ x: number; y: number } | null>(null)



  return (
    <section
      aria-label="잠금 화면"
      className="relative flex h-full min-h-0 flex-col overflow-hidden px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      style={{ color: DESIGN.lockScreen.textColor }}
    >
      <div className="flex shrink-0 flex-col items-center pt-5 sm:pt-8">
        <Lock className="mb-4 size-4 opacity-80" aria-hidden="true" />
        <p className="text-sm font-medium opacity-90">{formatDate(now)}</p>
        <time
          dateTime={now?.toISOString()}
          style={{ color: DESIGN.lockScreen.clockColor }}
          className="mt-1 flex flex-col items-center font-light leading-[0.9] tabular-nums tracking-tight [text-shadow:0_2px_12px_rgb(0_0_0/0.35)]"
        >
          <span className="text-[min(6.5rem,12dvh)]">{hours}</span>
          <span className="text-[min(6.5rem,12dvh)]">{minutes}</span>
        </time>
      </div>

      <ul aria-label="알림" className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {eventItems.map(n=><li key={n.id}><button type="button" onClick={()=>{markEventNotificationRead(n.id);unlock();openApp(n.appId);if(n.appId==='kakao'&&n.targetId)pushRoute(`room:${n.targetId}`)}} className="flex w-full items-start gap-3 rounded-3xl bg-white/15 p-3 text-left backdrop-blur-xl"><AppIconTile appId={n.appId} className="mt-0.5 w-8 shrink-0"/><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{n.title}</span><span className="mt-0.5 block text-[13px] text-white/85">{n.body}</span></span></button></li>)}
        {notifications.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => openNotification(n)}
              className="flex w-full items-start gap-3 rounded-3xl bg-white/15 p-3 text-left backdrop-blur-xl outline-none transition-colors hover:bg-white/20 active:bg-white/25 focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <AppIconTile appId={n.appId} className="mt-0.5 w-8 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{n.title}</span>
                  <span className="shrink-0 text-[11px] text-white/70">{n.timeLabel}</span>
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-white/85">
                  {n.body}
                </span>
                <span className="sr-only">{`${APPS[n.appId].name} 앱에서 보기`}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex shrink-0 justify-center py-2">
        <button type="button" aria-label="알림 기록 열기" onClick={()=>setHistoryOpen(true)}
          onTouchStart={e=>{const t=e.touches[0];if(t)historyGesture.current={x:t.clientX,y:t.clientY}}}
          onTouchEnd={e=>{const t=e.changedTouches[0],v=historyGesture.current;historyGesture.current=null;if(t&&v&&v.y-t.clientY>35&&Math.abs(v.x-t.clientX)<90){e.stopPropagation();setHistoryOpen(true)}}}
          onMouseDown={e=>{historyGesture.current={x:e.clientX,y:e.clientY}}}
          onMouseUp={e=>{const v=historyGesture.current;historyGesture.current=null;if(v&&v.y-e.clientY>35&&Math.abs(v.x-e.clientX)<90)setHistoryOpen(true)}}
          className="flex h-12 w-20 touch-none items-center justify-center rounded-3xl bg-white/20 text-white shadow-sm backdrop-blur-md"
        ><ChevronUp size={35} strokeWidth={3}/></button>
      </div>
      <div className="mt-auto flex shrink-0 flex-col items-center gap-2 border-t border-white/10 pt-3 pb-1"
        onTouchStart={(event) => {
          const touch = event.touches[0]
          if (touch) swipeStart.current = { x: touch.clientX, y: touch.clientY }
        }}
        onTouchEnd={(event) => {
          const touch = event.changedTouches[0]
          const start = swipeStart.current
          swipeStart.current = null
          if (touch && start && start.y - touch.clientY > 65 && Math.abs(start.x - touch.clientX) < 90) unlock()
        }}>
        <p className="text-xs opacity-70">{CHARACTER.device.deviceName}</p>
        <button
          type="button"
          onClick={unlock}
          className="flex h-12 items-center gap-2 rounded-full bg-white/90 px-7 text-sm font-semibold text-zinc-900 outline-none transition-colors hover:bg-white active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <LockOpen className="size-4" aria-hidden="true" />
          잠금 해제
        </button>
      </div>
      {historyOpen && <LockNotificationHistory onClose={()=>setHistoryOpen(false)}/>}
    </section>
  )
}
