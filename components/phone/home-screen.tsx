'use client'

import { DESIGN, EXTRA_APPS } from '@/config/design'
import { useEffect, useRef, useState } from 'react'
import { TodoApp } from './apps/todo-app'
import { Search, ChevronDown, Heart } from 'lucide-react'
import { WeatherApp } from './apps/weather-app'
import { ReservationsApp } from './apps/reservations-app'
import { CalendarView } from './calendar-view'
import { SkipBack, SkipForward, Play } from 'lucide-react'
import { useEpisode } from './episode-provider'
import { formatDate, formatTime, useNow } from '@/hooks/use-now'
import { APPS, DOCK_APPS, HOME_GRID_APPS } from '@/lib/phone/apps'
import type { AppId } from '@/lib/phone/types'
import { AppLauncherButton } from './app-icon'
import Image from 'next/image'
import { usePhone } from './phone-provider'



type ExtraAppId = keyof typeof EXTRA_APPS
function ExtraAppButton({ id, onClick, plainLabel = false }: { id: ExtraAppId; onClick: () => void; plainLabel?: boolean }) {
  const app = EXTRA_APPS[id]
  const Icon = app.icon
  return <button type="button" onClick={onClick} aria-label={`${app.name} 열기`} className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl p-1 text-xs">
    <span className={`relative flex aspect-square w-[var(--launcher-icon-size,3.5rem)] shrink-0 items-center justify-center overflow-hidden rounded-[32%]`} style={{backgroundColor:app.iconImage?'transparent':app.tileColor,color:app.iconColor}}>
      {app.iconImage ? <Image src={app.iconImage} alt="" fill sizes="56px" className="object-contain" unoptimized/> : <Icon className="size-[48%]" strokeWidth={2}/>}</span>
    <span className={`max-w-[4.5rem] truncate ${plainLabel?'font-normal':'font-medium'}`}>{app.name}</span>
  </button>
}

function SpotifyWidget() {
  // 외부 스트리밍을 임의로 재생하지 않고, 재생 버튼은 Spotify 앨범 페이지로 연결합니다.
  const spotifyAlbum = 'https://open.spotify.com/album/3yHOaiXecTJVUdn7mApZ48'
  return (
    <section aria-label="스포티파이 음악 위젯: John Mayer - Neon" className="mx-auto w-full max-w-[320px] overflow-hidden rounded-[27px] bg-[#727255] text-[#f3f3eb] shadow-sm">
      <div className="flex items-start gap-3 px-3.5 pb-3 pt-4">
        <img src="/sunjay-phone/images/spotify/room-for-squares.jpg" alt="John Mayer - Room for Squares 앨범 재킷" className="aspect-square w-[29%] shrink-0 rounded-[9px] object-cover" />
        <div className="flex min-w-0 flex-1 flex-col self-stretch">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0 pt-0.5"><p className="truncate text-[16px] font-semibold leading-tight">Neon</p><p className="mt-1 truncate text-[13px] font-medium leading-tight text-white/85">John Mayer</p></div>
            <a href={spotifyAlbum} target="_blank" rel="noopener noreferrer" aria-label="Spotify에서 John Mayer 앨범 보기" className="ml-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f3f3eb] text-[#727255]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 8.5c5.8-1.7 11.4-1 16.1 1.8M5 12.5c5-1.4 10-1 14 1.3M6 16.3c4.1-1.1 8.1-.8 11.7 1.1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </a>
          </div>
          <div className="mt-auto flex items-center justify-between gap-1 pt-3">
            <SkipBack size={24} fill="currentColor" strokeWidth={1.4} className="opacity-50" aria-hidden="true" />
            <a href={spotifyAlbum} target="_blank" rel="noopener noreferrer" aria-label="Spotify에서 Neon 듣기" className="flex size-10 items-center justify-center rounded-full bg-[#f3f3eb] text-[#727255] active:scale-95"><Play size={21} fill="currentColor" strokeWidth={1.5} className="ml-0.5"/></a>
            <SkipForward size={24} fill="currentColor" strokeWidth={1.4} aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 bg-[#686849] px-3.5 py-2.5">
        {[1,2,3,4].map(n => <img key={n} src={`/sunjay-phone/images/spotify/collection-${n}.jpg`} alt={n === 2 ? '좋아요 표시된 플레이리스트' : `플레이리스트 ${n}`} className="aspect-square w-full rounded-[8px] object-cover" />)}
      </div>
    </section>
  )
}

export function HomeScreen() {
  const now = useNow()
  const [page,setPage] = useState(0)
  const [drawerOpen,setDrawerOpen] = useState(false)
  const [drawerQuery,setDrawerQuery] = useState('')
  const [calendarOpen,setCalendarOpen] = useState(false)
  const [todoOpen,setTodoOpen] = useState(false)
  const [weatherOpen,setWeatherOpen] = useState(false)
  const [reservationsOpen,setReservationsOpen] = useState(false)
  useEffect(() => {
    const closeOverlays = () => {
      setCalendarOpen(false)
      setTodoOpen(false)
      setWeatherOpen(false)
      setReservationsOpen(false)
      setDrawerOpen(false)
    }
    window.addEventListener('phone:close-home-overlay', closeOverlays)
    return () => window.removeEventListener('phone:close-home-overlay', closeOverlays)
  }, [])
  const drag = useRef<{x:number;y:number}|null>(null)
  const start=(x:number,y:number)=>{drag.current={x,y}}
  const end=(x:number,y:number)=>{const prev=drag.current;drag.current=null;if(!prev)return;const dx=x-prev.x,dy=y-prev.y;if(drawerOpen){if(dy>65&&Math.abs(dy)>Math.abs(dx)*1.3)setDrawerOpen(false);return}if(dy < -65&&Math.abs(dy)>Math.abs(dx)*1.3){setDrawerOpen(true);return}if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4)setPage(p=>Math.max(0,Math.min(1,p+(dx<0?1:-1))))}
  const drawerApps: {id: AppId | ExtraAppId; name: string}[] = [...(Object.keys(APPS) as AppId[]).map(id=>({id,name:APPS[id].name})),
    ...(['calendar','todo','weather','reservations'] as ExtraAppId[]).map(id=>({id,name:EXTRA_APPS[id].name}))]
    .sort((a,b)=>a.name.localeCompare(b.name,'ko'))
  const launchExtraApp=(id:ExtraAppId)=>{setDrawerOpen(false);if(id==='calendar')setCalendarOpen(true);else if(id==='todo')setTodoOpen(true);else if(id==='weather')setWeatherOpen(true);else if(id==='reservations')setReservationsOpen(true);else if(id==='episode')showPicker()}
  const launchDrawerApp=(id:AppId)=>{setDrawerOpen(false);openApp(id)}
  const { openApp } = usePhone()
  const { episode, showPicker } = useEpisode()

  return (
    <section
      aria-label="홈 화면"
      className="home-compact relative flex h-full min-h-0 flex-col overflow-hidden px-4 pb-2"
      onTouchStart={e=>start(e.touches[0].clientX,e.touches[0].clientY)}
      onTouchEnd={e=>end(e.changedTouches[0].clientX,e.changedTouches[0].clientY)}
      onMouseDown={e=>{if(e.button===0)start(e.clientX,e.clientY)}}
      onMouseUp={e=>end(e.clientX,e.clientY)}
      style={{ color: DESIGN.homeScreen.textColor }}
    >
      <style>{`.home-compact { --launcher-icon-size: 56px; }
      @media (max-height: 800px) {
        .home-compact { --launcher-icon-size: 46px; }
        .home-compact .home-spotify {transform: scale(.87); transform-origin: center; margin-block: -13px}
        .home-compact ul[aria-label="앱"] > li button, .home-compact ul[aria-label="즐겨찾는 앱"] > li button {gap: 2px}
        .home-compact ul[aria-label="앱"] {row-gap: 3px}
      }
      @media (max-height: 680px) {.home-compact { --launcher-icon-size: 40px; } .home-compact .home-spotify {transform: scale(.74); margin-block: -26px}}
      `}</style>
      {page===0&&<><div className="flex items-start justify-between gap-2 px-2 pt-5 [text-shadow:0_1px_8px_rgb(0_0_0/0.4)]"><div>
        <p
          className="text-5xl font-light tabular-nums tracking-tight"
          style={{ color: DESIGN.homeScreen.clockColor }}
        >
          {formatTime(now)}
        </p>
        <p className="mt-2 text-sm font-medium opacity-90">{formatDate(now)}</p>
      </div><button type="button" onClick={showPicker} aria-label={`에피소드 선택, 현재 ${episode.title}`} className="mt-4 flex shrink-0 items-center gap-1.5 rounded-full border border-white/65 bg-white/20 px-3 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-md transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-white"><Heart size={16}/><span>{episode.id.toUpperCase().replace('EP','EP.')}</span><ChevronDown size={15}/></button></div>

      <div className="home-spotify my-auto min-h-0 py-2">
        <SpotifyWidget />
      </div>

      <div>
        <ul aria-label="앱" className="grid grid-cols-4 gap-x-2 gap-y-2">
          {HOME_GRID_APPS.map((id) => (
            <li key={id} className="flex justify-center">
              <AppLauncherButton appId={id} onOpen={openApp} />
            </li>
          ))}
          <li className="flex justify-center"><ExtraAppButton id="todo" onClick={()=>launchExtraApp("todo")}/></li>
        </ul>

      </div></>}
      {page===1&&<div className="flex min-h-0 flex-1 flex-col justify-center py-5"><CalendarView compact onOpen={()=>setCalendarOpen(true)}/></div>}
      <div className="mt-auto shrink-0">
        <div aria-label="홈 화면 페이지" className="my-2 flex justify-center gap-3">{[0,1].map(n=><button key={n} aria-label={`${n+1}페이지로 이동`} aria-current={page===n?'page':undefined} onClick={()=>setPage(n)} className={`size-2 rounded-full ${page===n?'bg-white':'bg-white/40'}`}/>)}</div>
        <ul aria-label="즐겨찾는 앱" className="grid grid-cols-4 gap-x-2 rounded-[1.75rem] bg-white/10 px-1 py-1.5 backdrop-blur-md">
          {DOCK_APPS.map((id) => (
            <li key={id} className="flex justify-center">
              <AppLauncherButton appId={id} onOpen={openApp} />
            </li>
          ))}
        </ul>
      </div>
      {drawerOpen&&<div data-app-drawer className="absolute inset-0 z-20 flex min-h-0 flex-col bg-[#f3f4f6]/80 px-1 pt-4 text-[#202124] backdrop-blur-xl" onTouchStart={e=>e.stopPropagation()} onTouchEnd={e=>e.stopPropagation()} onMouseDown={e=>e.stopPropagation()} onMouseUp={e=>e.stopPropagation()}>
        <button type="button" onClick={()=>setDrawerOpen(false)} className="mb-3 flex items-center justify-center gap-1 text-xs text-gray-600" aria-label="앱 목록 닫기"><ChevronDown size={17}/> 홈 화면으로</button>
        <label className="mx-3 mb-5 flex items-center gap-3 rounded-full bg-white/85 px-4 py-3 shadow-sm"><Search size={20} className="text-gray-600"/><input value={drawerQuery} onChange={e=>setDrawerQuery(e.target.value)} placeholder="검색" aria-label="앱 검색" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></label>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-6">
          <div className="grid grid-cols-4 gap-x-1 gap-y-5">
            {drawerApps.filter(a=>a.name.toLocaleLowerCase().includes(drawerQuery.toLocaleLowerCase())).map(({id,name})=><div key={id} className="flex min-w-0 justify-center">
              {id in EXTRA_APPS ? <ExtraAppButton id={id as ExtraAppId} onClick={()=>launchExtraApp(id as ExtraAppId)} plainLabel/> : <AppLauncherButton appId={id as AppId} onOpen={launchDrawerApp} plainLabel/>}
            </div>)}
          </div>
        </div>
      </div>}
      {weatherOpen&&<div data-weather-overlay className="absolute inset-0 z-30 min-h-0 overflow-hidden bg-[#fafafa]"><WeatherApp onClose={()=>setWeatherOpen(false)}/></div>}
      {reservationsOpen&&<div data-reservations-overlay className="absolute inset-0 z-30 min-h-0 overflow-hidden bg-[#fafafa]"><ReservationsApp onClose={()=>setReservationsOpen(false)}/></div>}
      {todoOpen&&<div data-home-overlay className="absolute inset-0 z-30 min-h-0 overflow-hidden bg-[#fafafa]"><TodoApp onClose={()=>setTodoOpen(false)}/></div>}
      {calendarOpen&&<div data-home-overlay className="absolute inset-0 z-30 min-h-0 overflow-hidden bg-[#fafafa]"><CalendarView onClose={()=>setCalendarOpen(false)}/></div>}
    </section>
  )
}
