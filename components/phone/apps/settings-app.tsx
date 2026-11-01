'use client'

import { ChevronRight, Info, Lock, RotateCcw, Wifi, Bluetooth, Bell, Volume2, Sun, Battery, Image, Sparkles, HeartPulse, Search } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { CHARACTER } from '@/config/character'
import { DESIGN } from '@/config/design'
import { AppScreen } from '../app-screen'
import { usePhone } from '../phone-provider'

function Row({
  icon,
  label,
  description,
  onClick,
  trailing,
  destructive,
}: {
  icon: ReactNode
  label: string
  description?: string
  onClick: () => void
  trailing?: ReactNode
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left outline-none transition-colors hover:bg-black/5 active:bg-black/10 focus-visible:bg-black/10"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#eef0f5]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={destructive ? 'block text-[15px] text-red-400' : 'block text-[15px]'}>
          {label}
        </span>
        {description && <span className="block text-xs text-zinc-500">{description}</span>}
      </span>
      {trailing}
    </button>
  )
}

function SettingsMain() {
  const { pushRoute, lock, reset } = usePhone()
  const [confirmReset, setConfirmReset] = useState(false)

  // Other settings are intentionally hidden until implemented.
  return <div className="flex min-h-full flex-col gap-4 bg-[#eef0f5] px-3 pb-24 pt-3 text-black">
    {/* Other settings groups are hidden for now. */}
    <div className="rounded-[27px] bg-white">{/* <Row icon={<Info size={18}/>} label="휴대전화 정보" onClick={()=>pushRoute('about')} trailing={<ChevronRight size={17}/>}/> */}<Row icon={<Lock size={18}/>} label="지금 화면 잠그기" onClick={lock}/><Row icon={<RotateCcw size={18}/>} label="진행 상황 초기화" onClick={()=>setConfirmReset(v=>!v)} destructive/>{confirmReset&&<div className="flex gap-3 p-4"><button onClick={()=>setConfirmReset(false)}>취소</button><button onClick={reset} className="text-red-600">초기화</button></div>}</div>
    {/* Search is hidden until settings search is implemented. */}
  </div>

}

function SettingsAbout() {
  const items = [
    ['기기 이름', CHARACTER.device.deviceName],
    ['소유자', CHARACTER.owner.name],
    ['모델명', CHARACTER.device.model],
    ['전화번호', CHARACTER.device.phoneNumber],
    ['통신사', DESIGN.statusBar.carrier],
  ]
  return (
    <dl className="mx-4 mb-6 mt-2 overflow-hidden rounded-3xl bg-[var(--phone-surface)]">
      {items.map(([label, value], i) => (
        <div
          key={label}
          className={i > 0 ? 'border-t border-white/5 px-4 py-3.5' : 'px-4 py-3.5'}
        >
          <dt className="text-xs text-zinc-500">{label}</dt>
          <dd className="mt-0.5 text-[15px]">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function SettingsApp() {
  const { currentRoute } = usePhone()
  const isAbout = currentRoute === 'about'

  return (
    <AppScreen title={isAbout ? '휴대전화 정보' : '설정'} surfaceClassName="bg-[#eef0f5] text-black">
      {isAbout ? <SettingsAbout /> : <SettingsMain />}
    </AppScreen>
  )
}
