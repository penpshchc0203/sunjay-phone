'use client'

import { Wifi } from 'lucide-react'
import { DESIGN } from '@/config/design'
import { formatTime, useNow } from '@/hooks/use-now'
import { usePhone } from './phone-provider'
import { useNotifications } from './notification-provider'
import { useRef } from 'react'

const SIGNAL_HEIGHTS = [40, 60, 80, 100]

function SignalBars({ strength }: { strength: number }) {
  return (
    <span aria-hidden="true" className="flex h-3 items-end gap-[2px]">
      {SIGNAL_HEIGHTS.map((h, i) => (
        <span
          key={h}
          className="w-[3px] rounded-[1px] bg-current"
          style={{ height: `${h}%`, opacity: i < strength ? 1 : 0.35 }}
        />
      ))}
    </span>
  )
}

function Battery({ level }: { level: number }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-[11px] tabular-nums">{level}%</span>
      <span aria-hidden="true" className="flex items-center">
        <span className="relative h-[11px] w-[21px] rounded-[3px] border border-current/80 p-[1.5px]">
          <span className="block h-full rounded-[1px] bg-current" style={{ width: `${level}%` }} />
        </span>
        <span className="ml-[1px] h-[4px] w-[1.5px] rounded-r-sm bg-current/80" />
      </span>
    </span>
  )
}

export function StatusBar() {
  const now = useNow()
  const { setOpen } = useNotifications()
  const startY = useRef<number | null>(null)
  const { state } = usePhone()
  const { carrier, batteryLevel, signalStrength, wifi, textColor } = DESIGN.statusBar
  const isLocked = state.mode === 'lock'

  return (
    <div
      onTouchStart={(e)=>{startY.current=e.touches[0]?.clientY ?? null}}
      onTouchEnd={(e)=>{if(startY.current!==null && (e.changedTouches[0]?.clientY ?? 0)-startY.current>35)setOpen(true);startY.current=null}}
      className="relative z-20 flex h-9 shrink-0 items-center justify-between px-6 text-[13px] font-medium"
      style={{ color: textColor }}
      role="status"
      aria-label={`현재 시각 ${formatTime(now)}, 배터리 ${batteryLevel}퍼센트`}
    >
      <button type="button" onClick={()=>setOpen(true)} aria-label="알림 센터 열기" className="tabular-nums text-left">{isLocked ? carrier : formatTime(now)}</button>
      <span className="flex items-center gap-1.5">
        {wifi && <Wifi className="size-3.5" strokeWidth={2.5} aria-hidden="true" />}
        <SignalBars strength={signalStrength} />
        <Battery level={batteryLevel} />
      </span>
    </div>
  )
}
