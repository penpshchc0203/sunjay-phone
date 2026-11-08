'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Clock3, Globe, Home, Search, Trash2, X, ExternalLink } from 'lucide-react'
import { useEpisode, episodeStorageKey } from '../episode-provider'
import { usePhone } from '../phone-provider'
import type { BrowserSearchEntry, BrowserSearchResult } from '@/lib/phone/content-types'

type ChordSheet = { songTitle: string; artist: string; tuning?: string; capo?: string; progression: string[]; practiceNotes: string }
type ChordResult = BrowserSearchResult & { chordSheet?: ChordSheet }
function ChordSheetPage({ sheet }: { sheet: ChordSheet }) {
  return <div className="mt-5 rounded-xl border border-zinc-200 bg-[#fffdf8] p-4">
    <div className="text-[11px] font-semibold tracking-widest text-amber-700">GUITAR PRACTICE NOTE</div>
    <h3 className="mt-2 text-lg font-bold">{sheet.songTitle}</h3><p className="mt-1 text-sm text-zinc-500">{sheet.artist}</p>
    {(sheet.tuning || sheet.capo) && <p className="mt-3 text-xs text-zinc-500">{sheet.tuning || 'Standard tuning'}{sheet.capo ? ` · Capo ${sheet.capo}` : ''}</p>}
    <div className="mt-5 rounded-lg border border-amber-100 bg-white px-3 py-4">
      <div className="mb-3 text-xs font-semibold text-amber-800">기타 연습 체크</div>
      <div className="space-y-3">{["인트로 듣기", "기타 파트 구간 나누기", "코드 / 운지 확인", "천천히 반복 연습"].map((step, i) => <div key={step} className="flex items-center gap-3 text-xs text-zinc-700"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-200 text-[10px] text-amber-700">{i + 1}</span>{step}</div>)}</div>
      {sheet.progression.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{sheet.progression.map((chord, i) => <span key={`${i}-${chord}`} className="rounded-md border border-amber-200 bg-white px-3 py-2 font-mono text-sm font-semibold">{chord}</span>)}</div>}
      <p className="mt-4 text-[11px] leading-5 text-zinc-500">원곡 코드·타브 악보는 별도 확인 필요</p>
    </div>
    <h4 className="mt-5 text-sm font-semibold">연습 메모</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-7">{sheet.practiceNotes}</p>
  </div>
}
type Stored = { added: BrowserSearchEntry[]; removed: string[] }
const empty = (): Stored => ({ added: [], removed: [] })
const STORAGE_KEY = 'virtual-phone:browser-search:v1'
const prettyTime = (value: string) => {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23' })
}

export function BrowserApp() {
  const { episode } = useEpisode()
  return <BrowserSession key={episode.id} />
}

function BrowserSession() {
  const { back, goHome } = usePhone()
  const { episode, content } = useEpisode()
  const key = episodeStorageKey(STORAGE_KEY, episode.id)
  const [store, setStore] = useState<Stored>(empty)
  const [ready, setReady] = useState(false)
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string | null>(null)
  const [detail, setDetail] = useState<BrowserSearchResult | null>(null)

  useEffect(() => {
    setReady(false)
    setStore(empty())
    setInput('')
    setFocused(false)
    setSearchTerm(null)
    setDetail(null)
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const data = JSON.parse(saved)
        if (data && typeof data === 'object') setStore({
          // Remove only legacy October 2026 searches persisted before the episode timeline was established.
          // Keep other reader searches and all JSON-provided episode history unchanged.
          added: Array.isArray(data.added)
            ? data.added.filter((item: BrowserSearchEntry) => !item?.searchedAt?.startsWith('2026-10-'))
            : [],
          removed: Array.isArray(data.removed) ? data.removed : [],
        })
      }
    } catch { /* Storage might be unavailable. */ }
    setReady(true)
  }, [key])
  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(key, JSON.stringify(store)) } catch { /* Keep in-memory state. */ }
  }, [key, ready, store])

  const history = useMemo(() => {
    const byQuery = new Map<string, BrowserSearchEntry>()
    for (const item of (content.browserSearches ?? [])) {
      if (!item?.query || store.removed.includes(item.id)) continue
      const query = item.query.trim().toLocaleLowerCase()
      const previous = byQuery.get(query)
      if (!previous || previous.searchedAt < item.searchedAt) byQuery.set(query, item)
    }
    return [...byQuery.values()].sort((a, b) => b.searchedAt.localeCompare(a.searchedAt))
  }, [content.browserSearches, store])
  const suggestions = history.filter(item => item.query.toLocaleLowerCase().includes(input.trim().toLocaleLowerCase()))
  const results = (content.browserResults ?? []).filter(result => result.query.trim().toLocaleLowerCase() === (searchTerm ?? '').trim().toLocaleLowerCase())

  const storySearchTimestamp = () => {
    const storyDates = (content.browserSearches ?? []).map(item => item.searchedAt.slice(0, 10)).filter(Boolean).sort()
    const last = storyDates[storyDates.length - 1]
    if (!last) return new Date().toISOString()
    const next = new Date(`${last}T00:00:00Z`)
    next.setUTCDate(next.getUTCDate() + 1)
    const clock = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date())
    return `${next.toISOString().slice(0, 10)}T${clock}`
  }
  const search = (term: string) => {
    const query = term.trim()
    if (!query) return
    // Search works without storing new history; the list comes from JSON only.
    setInput(query)
    setSearchTerm(query)
    setDetail(null)
    setFocused(false)
  }
  const remove = (item: BrowserSearchEntry) => {
    // Hide all entries of the same query (including built-in history), without touching source data.
    const matching = [...(content.browserSearches ?? []), ...store.added].filter(entry => entry.query.trim().toLocaleLowerCase() === item.query.trim().toLocaleLowerCase())
    setStore(prev => ({ ...prev, removed: [...new Set([...prev.removed, ...matching.map(entry => entry.id)])] }))
  }
  const clear = () => setStore(prev => ({ ...prev, removed: [...new Set([...prev.removed, ...(content.browserSearches ?? []).map(x => x.id), ...prev.added.map(x => x.id)])] }))
  const goBack = () => {
    if (focused) { setFocused(false); return }
    if (detail) { setDetail(null); return }
    if (searchTerm !== null) { setSearchTerm(null); setInput(''); return }
    back()
  }

  return <section className="flex h-full min-h-0 flex-col bg-white text-zinc-900">
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-100 px-3">
      <button type="button" aria-label="뒤로 가기" onClick={goBack} className="rounded-full p-2 hover:bg-zinc-100"><ArrowLeft size={20}/></button>
      <span className="flex items-center gap-1 text-xs text-zinc-500"><Globe size={14}/> 인터넷</span>
      <button type="button" aria-label="홈 화면으로" onClick={goHome} className="rounded-full p-2 hover:bg-zinc-100"><Home size={19}/></button>
    </header>
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain" onClick={() => { if (focused) setFocused(false) }}>
      {!searchTerm && !detail && <div className="pt-16 pb-8 text-center text-[46px] font-medium tracking-[-0.075em]" aria-label="Google"><span className="text-[#4285f4]">G</span><span className="text-[#ea4335]">o</span><span className="text-[#fbbc05]">o</span><span className="text-[#4285f4]">g</span><span className="text-[#34a853]">l</span><span className="text-[#ea4335]">e</span></div>}
      {detail ? <div className="px-5 py-5">
        <button type="button" onClick={() => setDetail(null)} className="mb-5 text-sm text-blue-600">‹ 검색 결과로</button>
        <p className="break-all text-xs text-zinc-500">{detail.siteName || detail.url || '가상 검색 결과'}</p>
        <h2 className="mt-2 text-xl font-semibold">{detail.title}</h2>
        <div className="mt-5 whitespace-pre-wrap break-words text-sm leading-7">{detail.body || detail.description || '상세 내용이 없습니다.'}</div>
        {(detail as ChordResult).chordSheet && <ChordSheetPage sheet={(detail as ChordResult).chordSheet!}/>} 
        {detail.url?.startsWith('https://') && <a href={detail.url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm text-blue-600"><ExternalLink size={15}/> 외부 사이트 열기</a>}
      </div> : <>
        <div className="relative mx-4" onClick={e => e.stopPropagation()}>
          <form onSubmit={e => { e.preventDefault(); search(input) }} className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 shadow-sm">
            <Search size={19} className="shrink-0 text-zinc-500"/>
            <input aria-label="검색어" value={input} onChange={e => setInput(e.target.value)} onFocus={() => setFocused(true)} placeholder="Google 검색" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/>
            {input && <button type="button" aria-label="입력 지우기" onClick={() => setInput('')}><X size={17}/></button>}
            <button type="submit" aria-label="검색" className="rounded-full bg-blue-500 p-2 text-white"><Search size={17}/></button>
          </form>
          {focused && <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-2 text-xs text-zinc-500"><span>최근 검색</span>{history.length > 0 && <button type="button" onClick={clear} className="text-blue-600">전체 삭제</button>}</div>
            {suggestions.map(item => <div key={item.id} className="flex items-center gap-2 border-t border-zinc-50 px-3 py-2">
              <button type="button" onClick={() => { setInput(item.query); setFocused(false) }} className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"><Clock3 size={16} className="shrink-0 text-zinc-400"/><span className={`min-w-0 flex-1 truncate ${/악보|기타 코드|기타 연습/.test(item.query) ? 'font-bold' : ''}`}>{item.query}</span></button>
              <button type="button" onClick={() => remove(item)} aria-label={`${item.query} 기록 삭제`} className="p-1 text-zinc-400"><X size={16}/></button>
            </div>)}
            {!suggestions.length && <p className="px-4 py-4 text-xs text-zinc-400">검색 기록이 없습니다.</p>}
          </div>}
        </div>
        {searchTerm !== null ? <div className="px-5 py-6">
          <p className="mb-5 text-xs text-zinc-500">‘{searchTerm}’ 가상 검색 결과</p>
          {results.map(result => <button key={result.id} type="button" onClick={() => setDetail(result)} className="mb-7 block w-full text-left">
            <p className="truncate text-xs text-zinc-500">{result.siteName || result.url || '가상 검색 결과'}</p>
            <h2 className="mt-1 text-base font-medium text-blue-700">{result.title}</h2>
            <p className="mt-1 line-clamp-3 text-sm leading-6 text-zinc-600">{result.description}</p>
          </button>)}
          {!results.length && <div className="py-12 text-center text-sm text-zinc-500">등록된 가상 검색 결과가 없습니다.<p className="mt-2 text-xs">이 화면은 실제 Google 검색 결과가 아닙니다.</p></div>}
          <a className="mt-5 inline-flex items-center gap-1 text-xs text-blue-600" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`}><ExternalLink size={14}/> 실제 Google에서 검색</a>
        </div> : !focused && <div className="px-5 pt-8">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">최근 검색 기록</h2>{history.length > 0 && <button type="button" onClick={clear} className="flex items-center gap-1 text-xs text-zinc-500"><Trash2 size={14}/> 전체 삭제</button>}</div>
          {history.map(item => <button type="button" key={item.id} onClick={() => search(item.query)} className="flex w-full items-center gap-3 border-b border-zinc-100 py-3 text-left"><Clock3 size={16} className="text-zinc-400"/><span className={`min-w-0 flex-1 truncate text-sm ${/악보|기타 코드|기타 연습/.test(item.query) ? 'font-bold' : ''}`}>{item.query}</span><span className="text-[10px] text-zinc-400">{prettyTime(item.searchedAt)}</span></button>)}
          {!history.length && <p className="py-10 text-center text-sm text-zinc-400">검색 기록이 없습니다.</p>}
        </div>}
      </>}
    </div>
  </section>
}
