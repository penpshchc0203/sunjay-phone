'use client'

import { APPS } from '@/lib/phone/apps'
import { AppIconTile } from '../app-icon'
import { AppScreen } from '../app-screen'
import { usePhone } from '../phone-provider'
import type { AppComponentProps } from './types'

export function ComingSoonApp({ appId }: AppComponentProps) {
  const { goHome } = usePhone()
  const app = APPS[appId]

  return (
    <AppScreen title={app.name}>
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <AppIconTile appId={appId} className="w-20" />
        <div>
          <p className="text-lg font-semibold">아직 구현되지 않은 앱입니다</p>
          <p className="mt-1 text-sm leading-relaxed text-white/60">
            {`${app.name} 앱의 화면은 아직 만들어지지 않았어요.`}
          </p>
        </div>
        <button
          type="button"
          onClick={goHome}
          className="mt-2 h-11 rounded-full bg-white/10 px-6 text-sm font-medium outline-none transition-colors hover:bg-white/15 active:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60"
        >
          홈으로 돌아가기
        </button>
      </div>
    </AppScreen>
  )
}
