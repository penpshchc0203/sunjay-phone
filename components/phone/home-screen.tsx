'use client'

import { DESIGN } from '@/config/design'
import { Layers3, SkipBack, SkipForward, Play } from 'lucide-react'
import { useEpisode } from './episode-provider'
import { formatDate, formatTime, useNow } from '@/hooks/use-now'
import { DOCK_APPS, HOME_GRID_APPS } from '@/lib/phone/apps'
import { AppLauncherButton } from './app-icon'
import { usePhone } from './phone-provider'


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
  const { openApp } = usePhone()
  const { episode, showPicker } = useEpisode()

  return (
    <section
      aria-label="홈 화면"
      className="flex h-full flex-col overflow-y-auto px-4 pb-3"
      style={{ color: DESIGN.homeScreen.textColor }}
    >
      <div className="px-2 pt-8 [text-shadow:0_1px_8px_rgb(0_0_0/0.4)]">
        <p
          className="text-6xl font-light tabular-nums tracking-tight"
          style={{ color: DESIGN.homeScreen.clockColor }}
        >
          {formatTime(now)}
        </p>
        <p className="mt-2 text-sm font-medium opacity-90">{formatDate(now)}</p>
      </div>

      <div className="my-auto py-5">
        <SpotifyWidget />
      </div>

      <div>
        <ul aria-label="앱" className="grid grid-cols-4 gap-x-2 gap-y-5">
          {HOME_GRID_APPS.map((id) => (
            <li key={id} className="flex justify-center">
              <AppLauncherButton appId={id} onOpen={openApp} />
            </li>
          ))}
          <li className="flex justify-center">
            <button
              type="button"
              onClick={showPicker}
              aria-label={`에피소드 선택, 현재 ${episode.title}`}
              className="group flex flex-col items-center gap-1.5 rounded-2xl p-1 outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <span className="flex w-14 aspect-square items-center justify-center rounded-[32%] bg-indigo-600 text-white shadow-sm transition-transform group-active:scale-90 sm:w-[3.75rem] md:w-14">
                <Layers3 className="size-[48%]" strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="max-w-[4.5rem] truncate text-xs font-medium [text-shadow:0_1px_2px_rgb(0_0_0/0.5)]">에피소드</span>
            </button>
          </li>
        </ul>

        <div aria-hidden="true" className="my-5 flex justify-center gap-1.5">
          <span className="size-1.5 rounded-full bg-white" />
          <span className="size-1.5 rounded-full bg-white/40" />
        </div>

        <ul aria-label="즐겨찾는 앱" className="grid grid-cols-4 gap-x-2 rounded-[1.75rem] bg-white/10 px-1 py-2.5 backdrop-blur-md">
          {DOCK_APPS.map((id) => (
            <li key={id} className="flex justify-center">
              <AppLauncherButton appId={id} onOpen={openApp} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
