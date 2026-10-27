'use client'

import Image from 'next/image'
import { useRef, type CSSProperties } from 'react'
import { ArrowLeft, Check, Layers3 } from 'lucide-react'
import { EPISODES } from '@/content/episodes'
import { DESIGN } from '@/config/design'
import { cn } from '@/lib/utils'
import { getAppComponent } from './apps'
import { HomeScreen } from './home-screen'
import { LockScreen } from './lock-screen'
import { NavigationBar } from './navigation-bar'
import { usePhone } from './phone-provider'
import { RecentsOverlay } from './recents-overlay'
import { StatusBar } from './status-bar'
import { NotificationProvider } from './notification-provider'
import { useEpisode } from './episode-provider'
import { NotificationCenter } from './notification-center'

const THEME_VARS = {
  '--phone-app-bg': DESIGN.theme.appBackground,
  '--phone-surface': DESIGN.theme.surface,
  '--phone-text': DESIGN.theme.textColor,
  '--phone-accent': DESIGN.theme.accent,
} as CSSProperties

function ScreenContent() {
  const { state } = usePhone()
  if (state.mode === 'lock') return <LockScreen />
  if (state.mode === 'app' && state.currentApp) {
    const App = getAppComponent(state.currentApp)
    return <App key={state.currentApp} appId={state.currentApp} />
  }
  return <HomeScreen />
}

function Wallpaper({
  src,
  dimOpacity,
  visible,
}: {
  src: string
  dimOpacity: number
  visible: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute inset-0 transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="(min-width: 768px) 420px, 100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black" style={{ opacity: dimOpacity }} />
    </div>
  )
}

function EpisodePickerScreen() {
  const { episode, choosing, hidePicker, selectEpisode } = useEpisode()
  if (!choosing) return null
  return (
    <section role="dialog" aria-modal="true" aria-label="에피소드 선택" className="absolute inset-0 z-[60] flex flex-col overflow-hidden bg-[#15161c] text-white">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 pb-3 pt-12">
        <button type="button" onClick={hidePicker} aria-label="에피소드 선택 취소하고 홈으로 돌아가기" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"><ArrowLeft size={22} /></button>
        <div className="min-w-0"><h2 className="text-lg font-semibold">에피소드 선택</h2><p className="text-xs text-white/55">원하는 에피소드를 선택하세요</p></div>
      </header>
      <div className="virtual-phone-scrollbars min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-5">
        {EPISODES.map(ep => (
          <button key={ep.id} type="button" onClick={() => selectEpisode(ep.id)} className="flex w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-4 text-left transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600/80"><Layers3 size={22} /></span>
            <span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold">{ep.title}</span><span className="mt-1 block text-xs text-white/55">{ep.dateTime.replace('T',' ')} · {ep.characterIds.length ? ep.characterIds.join(', ') : '스마트폰 기록'}</span></span>
            {episode.id === ep.id && <Check size={20} className="shrink-0 text-indigo-300" aria-label="현재 에피소드" />}
          </button>
        ))}
      </div>
      <div className="shrink-0 border-t border-white/10 bg-[#15161c] px-4 pb-7 pt-3"><button type="button" onClick={hidePicker} className="w-full rounded-xl bg-white/10 py-3 text-sm font-semibold hover:bg-white/15">취소</button></div>
    </section>
  )
}

function PhoneDeviceInner() {
  const { state, hydrated, showRecents, togglePower } = usePhone()
  const { episode } = useEpisode()
  const lockScreen = { ...DESIGN.lockScreen, wallpaper: episode.lockWallpaper || DESIGN.lockScreen.wallpaper }
  const homeScreen = { ...DESIGN.homeScreen, wallpaper: episode.homeWallpaper || DESIGN.homeScreen.wallpaper }
  const sameWallpaper = lockScreen.wallpaper === homeScreen.wallpaper
  const gestureY = useRef<number | null>(null)

  return (
    <div className="flex h-dvh w-full flex-col items-center md:h-[min(900px,calc(100dvh-3rem))] md:w-auto">
      <div className="relative min-h-0 w-full flex-1 md:aspect-[9/19.5] md:w-auto">
      {/* Side keys (S25 Ultra: volume + power on the right edge) */}
      <span
        aria-hidden="true"
        className="absolute -right-[3px] top-[18%] hidden h-[11%] w-[3px] rounded-r-sm bg-zinc-600 md:block"
      />
      <button
        type="button"
        onClick={togglePower}
        aria-label={state.mode === 'lock' ? '전원 버튼: 잠금 해제' : '전원 버튼: 화면 잠그기'}
        className="absolute -right-[5px] top-[33%] z-10 hidden h-[7%] w-[5px] rounded-r-sm bg-zinc-500 outline-none hover:bg-zinc-400 focus-visible:ring-2 focus-visible:ring-sky-400 md:block"
      />

      <div className="h-full w-full md:rounded-[2.6rem] md:bg-gradient-to-b md:from-zinc-500 md:via-zinc-700 md:to-zinc-600 md:p-[3px] md:shadow-2xl">
        <div className="h-full w-full bg-black md:rounded-[2.45rem] md:p-[9px]">
          <div
            onTouchStartCapture={(e)=>{const y=e.touches[0]?.clientY; const top=e.currentTarget.getBoundingClientRect().top;gestureY.current = y !== undefined && y - top < 90 ? y : null}}
            onTouchEndCapture={(e)=>{const end=e.changedTouches[0]?.clientY;if(gestureY.current!==null&&end!==undefined&&end-gestureY.current>75){window.dispatchEvent(new Event('phone:show-notifications'))}gestureY.current=null}}
            className="virtual-phone-scrollbars relative flex h-full w-full flex-col overflow-hidden bg-black md:rounded-[1.9rem]"
            style={THEME_VARS}
          >
            {hydrated ? (
              <>
                {sameWallpaper ? (
                  <Wallpaper
                    src={lockScreen.wallpaper}
                    dimOpacity={state.mode === 'lock' ? lockScreen.dimOpacity : homeScreen.dimOpacity}
                    visible={state.mode !== 'app'}
                  />
                ) : (
                  <>
                    <Wallpaper
                      src={homeScreen.wallpaper}
                      dimOpacity={homeScreen.dimOpacity}
                      visible={state.mode === 'home'}
                    />
                    <Wallpaper
                      src={lockScreen.wallpaper}
                      dimOpacity={lockScreen.dimOpacity}
                      visible={state.mode === 'lock'}
                    />
                  </>
                )}

                {/* Punch-hole camera */}
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-2.5 z-40 hidden size-3 -translate-x-1/2 rounded-full bg-black ring-1 ring-zinc-800 md:block"
                />


                <StatusBar />
                <NotificationCenter />
                <main className="relative z-10 min-h-0 flex-1">
                  <ScreenContent />
                </main>
                {state.mode !== 'lock' && showRecents && <RecentsOverlay />}
                {state.mode !== 'lock' && <NavigationBar />}
                <EpisodePickerScreen />
              </>
            ) : (
              <div className="flex h-full items-center justify-center" role="status">
                <span className="sr-only">휴대폰을 켜는 중</span>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export function PhoneDevice() { return <NotificationProvider><PhoneDeviceInner /></NotificationProvider> }
