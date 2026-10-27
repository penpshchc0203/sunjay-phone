'use client'

import { Lock, LockOpen } from 'lucide-react'
import { useRef } from 'react'
import { formatDate, formatTime, useNow } from '@/hooks/use-now'
import { APPS } from '@/lib/phone/apps'
import { CHARACTER } from '@/config/character'
import { DESIGN } from '@/config/design'
import { useNotifications } from './notification-provider'
import type { AppId } from '@/lib/phone/types'
import { AppIconTile } from './app-icon'
import { usePhone } from './phone-provider'

export function LockScreen() {
  const now = useNow()
  const { notifications, openNotification } = useNotifications()
  const { unlock, openApp } = usePhone()
  const [hours, minutes] = formatTime(now).split(':')
  const swipeStart = useRef<{ x: number; y: number } | null>(null)



  return (
    <section
      aria-label="잠금 화면"
      className="flex h-full min-h-0 flex-col overflow-hidden px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
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
    </section>
  )
}
