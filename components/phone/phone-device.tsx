'use client'

import Image from 'next/image'
import { X, Check, Heart } from 'lucide-react'
import { getEpisodePickerInfo } from '@/config/episode-picker'
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
import { EventBanner } from './event-banner'
import { usePhoneEvents } from './event-provider'
import { useEffect, useRef, type CSSProperties } from 'react'

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
  return (
    <div className={`absolute inset-0 z-[60] flex items-end transition-all duration-300 ${choosing ? 'visible bg-black/35 opacity-100' : 'invisible pointer-events-none bg-transparent opacity-0'}`} onClick={hidePicker}>
      <section role="dialog" aria-modal={choosing} aria-label="에피소드 선택" onClick={e=>e.stopPropagation()} className={`w-full max-h-[75%] overflow-y-auto rounded-t-[32px] bg-[#f2f3f7] px-4 pb-5 pt-3 text-[#191b22] shadow-2xl transition-transform duration-300 ${choosing ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#a4a7b2]"/>
        <div className="mb-4 flex items-center justify-between"><span className="w-9"/><h2 className="text-lg font-bold">에피소드 선택</h2><button type="button" onClick={hidePicker} aria-label="닫기" className="flex size-9 items-center justify-center rounded-full hover:bg-black/5"><X size={23}/></button></div>
        <div className="space-y-2">
          {EPISODES.map((ep) => {
            const active=episode.id===ep.id
            const info=getEpisodePickerInfo(ep)
            return <button key={ep.id} type="button" disabled={!info.enabled} onClick={()=>selectEpisode(ep.id)} className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${active?'border-[#2464ff] bg-[#eaf0ff]':'border-[#e0e1e7] bg-white/90'} disabled:cursor-not-allowed disabled:opacity-55`}>
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${info.thumbnailColor} text-white`}><Heart size={23}/></span>
              <span className="min-w-0 flex-1"><span className="block text-base font-bold">{ep.id.toUpperCase().replace('EP','EP.')}</span><span className="block text-xs text-zinc-600">{info.dateLabel}</span><span className="block text-xs text-zinc-500">{info.description}</span></span>
              <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${active?'border-[#2464ff] bg-[#2464ff] text-white':'border-zinc-400'}`}>{active&&<Check size={16} strokeWidth={3}/>}</span>
            </button>
          })}
        </div>
      </section>
    </div>
  )
}

function PhoneDeviceInner() {
  const { state, hydrated, showRecents, togglePower } = usePhone()
  const { episode, choosing } = useEpisode()
  const { dispatchEvent: triggerPhoneEvent } = usePhoneEvents()
  const lastOpened = useRef<string|null>(null)
  useEffect(()=>{
    const current=state.mode==='app'?state.currentApp:null
    if(current && current!==lastOpened.current)triggerPhoneEvent({type:'app.open',appId:current,triggerId:`app-open:${current}:${Date.now()}`})
    lastOpened.current=current
  },[state.mode,state.currentApp,triggerPhoneEvent])
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
                <div className={`absolute inset-0 flex min-h-0 flex-col overflow-hidden transition-[transform,border-radius] duration-300 ease-out ${choosing ? '-translate-y-3 scale-[0.94] rounded-[25px]' : 'translate-y-0 scale-100 rounded-none'}`}>

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
                </div>
                <EpisodePickerScreen />
                <EventBanner />
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
