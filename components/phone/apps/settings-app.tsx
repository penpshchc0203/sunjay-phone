'use client'

import { ChevronRight, Info, Lock, RotateCcw } from 'lucide-react'
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
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left outline-none transition-colors hover:bg-white/5 active:bg-white/10 focus-visible:bg-white/10"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={destructive ? 'block text-[15px] text-red-400' : 'block text-[15px]'}>
          {label}
        </span>
        {description && <span className="block text-xs text-white/55">{description}</span>}
      </span>
      {trailing}
    </button>
  )
}

function SettingsMain() {
  const { pushRoute, lock, reset } = usePhone()
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
      <div className="overflow-hidden rounded-3xl bg-[var(--phone-surface)]">
        <Row
          icon={<Info className="size-4 text-[var(--phone-accent)]" aria-hidden="true" />}
          label="휴대전화 정보"
          description={CHARACTER.device.deviceName}
          onClick={() => pushRoute('about')}
          trailing={<ChevronRight className="size-4 text-white/40" aria-hidden="true" />}
        />
        <div className="mx-4 h-px bg-white/5" />
        <Row
          icon={<Lock className="size-4 text-[var(--phone-accent)]" aria-hidden="true" />}
          label="지금 화면 잠그기"
          onClick={lock}
        />
      </div>

      <div className="overflow-hidden rounded-3xl bg-[var(--phone-surface)]">
        <Row
          icon={<RotateCcw className="size-4 text-red-400" aria-hidden="true" />}
          label="진행 상황 초기화"
          description="저장된 화면 상태와 최근 앱 기록을 지웁니다."
          onClick={() => setConfirmReset((v) => !v)}
          destructive
        />
        {confirmReset && (
          <div className="flex gap-2 px-4 pb-4">
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="h-10 flex-1 rounded-full bg-white/10 text-sm font-medium outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60"
            >
              취소
            </button>
            <button
              type="button"
              onClick={reset}
              className="h-10 flex-1 rounded-full bg-red-500 text-sm font-semibold text-white outline-none hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-white/60"
            >
              초기화
            </button>
          </div>
        )}
      </div>
    </div>
  )
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
          <dt className="text-xs text-white/55">{label}</dt>
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
    <AppScreen title={isAbout ? '휴대전화 정보' : '설정'}>
      {isAbout ? <SettingsAbout /> : <SettingsMain />}
    </AppScreen>
  )
}
