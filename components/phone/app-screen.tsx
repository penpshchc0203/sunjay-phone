'use client'

import { ChevronLeft, House } from 'lucide-react'
import type { ReactNode } from 'react'
import { usePhone } from './phone-provider'

const headerButton =
  'flex size-10 items-center justify-center rounded-full outline-none transition-colors hover:bg-white/10 active:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60'

/** Shared chrome for every app: header with back + home buttons and a scrollable body. */
export function AppScreen({ title, children }: { title: string; children: ReactNode }) {
  const { back, goHome } = usePhone()

  return (
    <section aria-label={title} className="flex h-full flex-col bg-[var(--phone-app-bg)] text-[var(--phone-text)]">
      <header className="flex h-14 shrink-0 items-center gap-1 px-2">
        <button type="button" onClick={back} aria-label="뒤로 가기" className={headerButton}>
          <ChevronLeft className="size-6" aria-hidden="true" />
        </button>
        <h1 className="flex-1 truncate text-lg font-semibold">{title}</h1>
        <button type="button" onClick={goHome} aria-label="홈 화면으로" className={headerButton}>
          <House className="size-5" aria-hidden="true" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </section>
  )
}
