'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { APPS } from '@/lib/phone/apps'
import type { AppId } from '@/lib/phone/types'
import { cn } from '@/lib/utils'
import { useNotifications } from './notification-provider'

export function AppIconTile({ appId, className }: { appId: AppId; className?: string }) {
  const app = APPS[appId]
  const Icon = app.icon
  const [imageFailed, setImageFailed] = useState(false)
  useEffect(() => setImageFailed(false), [app.iconImage])
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative flex aspect-square items-center justify-center overflow-hidden rounded-[32%] shadow-sm',
        className,
      )}
      style={{ backgroundColor: app.tileColor, color: app.iconColor ?? '#ffffff' }}
    >
      {app.iconImage && !imageFailed ? (
        <Image src={app.iconImage} alt="" fill sizes="64px" className="object-cover" unoptimized onError={() => setImageFailed(true)} />
      ) : (
        <Icon className="size-[48%]" strokeWidth={2} />
      )}
    </span>
  )
}

export function AppLauncherButton({
  appId,
  onOpen,
  showLabel = true,
}: {
  appId: AppId
  onOpen: (appId: AppId) => void
  showLabel?: boolean
}) {
  const app = APPS[appId]
  const { badges } = useNotifications()
  const badge = badges[appId] || 0
  return (
    <button
      type="button"
      onClick={() => onOpen(appId)}
      aria-label={`${app.name} 열기`}
      className="group flex flex-col items-center gap-1.5 rounded-2xl p-1 outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <span className="relative"><AppIconTile
        appId={appId}
        className="w-14 transition-transform group-active:scale-90 sm:w-[3.75rem] md:w-14"
      />{badge > 0 && <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white" aria-label={`읽지 않은 알림 ${badge}개`}>{badge > 99 ? "99+" : badge}</span>}</span>
      {showLabel && (
        <span className="max-w-full truncate text-xs font-medium [text-shadow:0_1px_2px_rgb(0_0_0/0.5)]">
          {app.name}
        </span>
      )}
    </button>
  )
}
