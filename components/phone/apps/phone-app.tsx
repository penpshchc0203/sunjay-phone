'use client'

import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Phone, PhoneMissed, Search, MoreVertical, Plus, Star, UserRound, Mic, Delete, X } from 'lucide-react'
import { useEpisode } from '../episode-provider'
import { usePhone } from '../phone-provider'
import type { CallLogEntry } from '@/lib/phone/content-types'
import callSummaries from '@/content/calls/summaries.json'
import { ArrowLeft, ChevronRight, Copy, Sparkles } from 'lucide-react'

type Tab = 'keypad' | 'recent' | 'contacts'
const KEYS = [['1',''],['2','ABC'],['3','DEF'],['4','GHI'],['5','JKL'],['6','MNO'],['7','PQRS'],['8','TUV'],['9','WXYZ'],['*',''],['0','+'],['#','']]
const formatDay = (date: string) => { const d = new Date(date); return Number.isNaN(d.getTime()) ? date : `${d.getMonth()+1}월 ${d.getDate()}일 ${['일','월','화','수','목','금','토'][d.getDay()]}요일` }
const formatTime = (date: string) => date.slice(11,16)
const callIcon = (type: CallLogEntry['type']) => type === 'incoming' ? ArrowDownLeft : type === 'outgoing' ? ArrowUpRight : PhoneMissed

export function PhoneApp() {
  const { back } = usePhone()
  const { content } = useEpisode()
  const contacts = content.contacts ?? []
  const [tab, setTab] = useState<Tab>('recent')
  const [number, setNumber] = useState('')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [showNotice, setShowNotice] = useState(false)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const contactById = (id?: string) => contacts.find(c => c.id === (id === 'user' ? 'sunwoo' : id))
  const displayName = (id?: string, unknown?: string) => contactById(id)?.name || unknown || '알 수 없음'
  const calls = useMemo(() => [...(content.calls ?? [])].sort((a,b) => b.calledAt.localeCompare(a.calledAt)), [content.calls])
  const filteredCalls = calls.filter(c => `${displayName(c.contactId,c.unknownNumber)} ${c.unknownNumber ?? ''}`.toLowerCase().includes(query.toLowerCase()))
  const grouped = filteredCalls.reduce<{day:string; items: typeof calls}[]>((groups,c) => { const day = c.calledAt.slice(0,10); const last = groups[groups.length-1]; if(last?.day === day) last.items.push(c); else groups.push({day,items:[c]}); return groups }, [])
  const filteredContacts = [...contacts].filter(c => (!favoritesOnly || c.favorite) && `${c.name} ${c.phoneNumber ?? ''}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name,'ko'))
  const favoriteContacts = contacts.filter(c => c.favorite)
  const selectedCall = calls.find(c => c.id === selected)
  const summary = callSummaries.summaries.find(s => s.callId === selectedCall?.id)
  const selectedContact = contactById(selected ?? selectedCall?.contactId)
  const closeDetail = () => { if(summaryOpen) setSummaryOpen(false); else if(selected) setSelected(null); else back() }
  const avatar = (c: typeof contacts[number], size='h-9 w-9') => <div className={`${size} shrink-0 overflow-hidden rounded-full bg-[#d5e7df] flex items-center justify-center text-white`}>{c.avatar ? <img src={c.avatar} alt="" className="h-full w-full object-cover"/> : <UserRound size={20}/>}</div>
  return <section className="relative flex h-full min-h-0 flex-col bg-[#f0f1f6] text-black">
    <header className="flex h-14 shrink-0 items-center gap-3 px-5 pt-1">
      {tab !== 'keypad' && <h1 className="flex-1 text-[20px] font-bold">{tab === 'recent' ? '전화' : '전화'}</h1>}
      {tab === 'keypad' && <div className="flex-1"/>}
      {tab === 'contacts' && <button aria-label="연락처 추가 안내" onClick={() => setShowNotice(true)}><Plus size={20} strokeWidth={1.7}/></button>}
      {tab === 'recent' && <button aria-label="정렬" onClick={() => setShowNotice(true)} className="text-2xl">☷</button>}
      <button aria-label="검색" onClick={() => setSearchOpen(v=>!v)}><Search size={20} strokeWidth={1.8}/></button>
      <button aria-label="더보기" onClick={() => setShowNotice(true)}><MoreVertical size={21}/></button>
    </header>
    {searchOpen && <div className="mx-5 mb-2 flex items-center gap-2 rounded-full bg-white px-4 py-2"><Search size={18}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="이름 또는 번호 검색" className="w-full bg-transparent outline-none"/><button onClick={()=>{setQuery('');setSearchOpen(false)}} aria-label="검색 닫기"><X size={18}/></button></div>}
    {tab === 'keypad' && <div className="flex min-h-0 flex-1 flex-col justify-end pb-24">
      <div className="flex h-14 items-center justify-center gap-2 px-8"><span className="min-w-0 truncate text-[25px]">{number}</span>{number && <button onClick={()=>setNumber(v=>v.slice(0,-1))} aria-label="한 글자 지우기"><Delete size={24}/></button>}</div>
      <div className="mx-auto grid w-[82%] max-w-[310px] grid-cols-3 gap-y-2">{KEYS.map(([digit,letters])=><button key={digit} onClick={()=>setNumber(v=>v+digit)} className="flex h-[53px] flex-col items-center justify-center rounded-2xl active:bg-white/70"><span className="text-[37px] font-light leading-[39px]">{digit}</span><span className="h-4 text-[11px] tracking-wide text-[#88898d]">{letters}</span></button>)}</div>
      <button aria-label="통화 시뮬레이션 안내" onClick={()=>setShowNotice(true)} className="mx-auto mt-5 flex h-[66px] w-[66px] items-center justify-center rounded-full bg-[#9aadd8] text-white"><Phone size={30} fill="currentColor"/></button>
    </div>}
      {tab === 'recent' && <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-2">{grouped.map(g=><div key={g.day}><h2 className="mb-2 mt-4 px-5 text-[13px] font-semibold">{formatDay(g.items[0].calledAt)}</h2><div className="overflow-hidden rounded-[24px] bg-white">{g.items.map(c=>{const Icon=callIcon(c.type);const missed=c.type==='missed'||c.type==='rejected';const expanded=selected===c.id;const detailSummary=callSummaries.summaries.find(s=>s.callId===c.id);const contact=contactById(c.contactId);return <div key={c.id}><button aria-expanded={expanded} onClick={()=>{setSelected(v=>v===c.id?null:c.id);setSummaryOpen(false)}} className="flex min-h-[61px] w-full items-center gap-3 px-5 text-left active:bg-zinc-100"><Icon size={20} strokeWidth={2.7} className={missed?'text-[#d33814]':'text-[#726d5e]'}/><div className="min-w-0 flex-1"><div className={`truncate text-[16px] ${detailSummary ? 'font-bold' : ''}`}>{displayName(c.contactId,c.unknownNumber)}</div>{c.unknownNumber && !contact && <div className="truncate text-sm">{c.unknownNumber}</div>}</div><div className={`text-[13px] ${missed?'text-red-600':''}`}>{formatTime(c.calledAt)}{c.durationSec ? <Mic className="ml-auto text-[#77766b]" size={15}/> : null}</div></button>{expanded && <div className="mx-3 mb-3 rounded-[24px] bg-[#fafafa] px-4 pb-5 pt-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-[19px] font-bold">{displayName(c.contactId,c.unknownNumber)}</h3><p className="mt-1 text-[13px] text-zinc-500">{contact?.phoneNumber ?? c.unknownNumber ?? ''}</p></div>{contact && avatar(contact,'h-12 w-12')}</div><div className="mt-4 flex items-center gap-2 text-[13px]"><Icon size={17}/><span>{c.type==='incoming'?'수신전화':c.type==='outgoing'?'발신전화':missed?'부재중 전화':'통화'}{c.durationSec ? `, ${Math.floor(c.durationSec/60)}분 ${c.durationSec%60}초` : ''}</span></div><p className="mt-1 text-[12px] text-zinc-500">{formatTime(c.calledAt)}</p>{detailSummary && <button onClick={()=>{setSelected(c.id);setSummaryOpen(true)}} className="mt-4 flex w-full items-center justify-between gap-2 rounded-full border border-[#d9e4f5] bg-gradient-to-r from-[#e9e8ff] to-[#e5f9f7] px-4 py-3 text-left text-[13px] font-medium shadow-sm"><span className="min-w-0 truncate">{detailSummary.title}</span><ChevronRight size={19} className="shrink-0"/></button>}<div className="mt-4 flex justify-around border-t border-zinc-100 pt-4 text-[#9aadd8]"><button onClick={()=>setShowNotice(true)} aria-label="통화"><Phone size={22}/></button><button onClick={()=>setShowNotice(true)} aria-label="메시지"><span className="text-xl">☏</span></button><button onClick={()=>setShowNotice(true)} aria-label="영상 통화"><span className="text-xl">▣</span></button><button onClick={()=>setShowNotice(true)} aria-label="더보기"><span className="text-xl">☷</span></button></div></div>}</div>})}</div></div>)}{!grouped.length && <p className="py-12 text-center text-zinc-500">통화 기록이 없습니다.</p>}</div>}
    {tab === 'contacts' && <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-3"><button onClick={()=>setFavoritesOnly(v=>!v)} className="mb-3 flex items-center gap-2 px-5 text-[14px] font-semibold"><Star size={19} fill={favoritesOnly?'black':'black'}/>즐겨찾기 {favoritesOnly?'· 전체 보기':''}</button>{!favoritesOnly && <div className="mb-5 grid grid-cols-3 gap-2">{favoriteContacts.slice(0,6).map(c=><button key={c.id} onClick={()=>setSelected(c.id)} className="flex h-28 flex-col items-center justify-center gap-2 rounded-[18px] bg-[#a6a8d8] p-2 text-white">{avatar(c,'h-12 w-12')}<span className="max-w-full truncate text-[13px]">{c.name}</span></button>)}</div>}<h2 className="mb-3 px-7 text-[13px] font-semibold">연락처</h2><div className="overflow-hidden rounded-[22px] bg-white">{filteredContacts.map(c=><button key={c.id} onClick={()=>setSelected(c.id)} className="flex w-full items-center gap-3 px-4 py-2 text-left active:bg-zinc-100">{avatar(c)}<span className="truncate text-[16px]">{c.name}</span></button>)}{!filteredContacts.length && <p className="p-6 text-center text-zinc-500">연락처가 없습니다.</p>}</div></div>}
    <nav className="absolute bottom-4 left-1/2 z-10 flex w-[min(84%,310px)] -translate-x-1/2 rounded-full border border-white bg-white/90 p-1 shadow-lg backdrop-blur" aria-label="전화 메뉴">{([{id:'keypad',label:'키패드',icon:'⠿'},{id:'recent',label:'최근기록',icon:'↗'},{id:'contacts',label:'연락처',icon:'♙'}] as const).map(t=><button key={t.id} onClick={()=>{setTab(t.id);setSelected(null);setQuery('');setSearchOpen(false)}} className={`flex flex-1 flex-col items-center justify-center rounded-full py-1.5 ${tab===t.id?'bg-[#e0e0e0]':''}`}><span className="text-[22px] leading-7">{t.icon}</span><span className="text-[11px]">{t.label}</span></button>)}</nav>
    {selected && summaryOpen && summary && <div className="absolute inset-0 z-20 flex min-h-0 flex-col bg-[#f0f1f6]">
      <>
        <header className="flex h-20 shrink-0 items-center gap-3 bg-white px-4">
          <button onClick={closeDetail} aria-label="통화 상세로 돌아가기"><ArrowLeft size={23}/></button>
          {selectedContact && avatar(selectedContact,'h-11 w-11')}
          <div className="min-w-0 flex-1"><h2 className="truncate text-[20px] font-bold">{displayName(selectedCall?.contactId,selectedCall?.unknownNumber)}</h2><p className="text-sm">통화 녹음 · 요약</p></div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-br from-[#d8eefe] via-[#eef1ff] to-white px-6 pb-16 pt-7">
          <div className="mb-7 flex items-center gap-2 text-[20px] font-bold"><Sparkles className="text-[#418dd2]" size={23}/> 요약</div>
          <h3 className="mb-7 text-[19px] font-bold">{summary.title}</h3>
          <p className="mb-8 text-[15px] leading-relaxed">{summary.overview}</p>
          {summary.sections.map((section,i)=><div key={i} className="mb-7"><h4 className="mb-2 text-[16px] font-bold">{section.heading}</h4><ul className="list-disc space-y-1 pl-5 text-[15px] leading-relaxed">{section.bullets.map((item,j)=><li key={j}>{item}</li>)}</ul></div>)}
          <div className="mt-8 flex flex-wrap gap-2">{summary.keywords.map(k=><span key={k} className="rounded-full bg-[#e2e6f2] px-4 py-2 text-[13px]">{k}</span>)}</div>
          <p className="mt-8 text-xs text-slate-500">가상 통화 요약 예시 · 실제 녹음이나 AI 분석 결과가 아닙니다.</p>
          <button onClick={()=>{const text=[summary.title,summary.overview,...summary.sections.flatMap(s=>[s.heading,...s.bullets])].join('\n');void navigator.clipboard?.writeText(text)}} className="mt-8 flex w-full items-center justify-end gap-2 py-3 text-sm"><Copy size={17}/> 복사</button>
        </div>
      </>
    </div>}
    {showNotice && <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/25 p-7" onClick={()=>setShowNotice(false)}><div className="w-full rounded-3xl bg-white p-6 text-center" onClick={e=>e.stopPropagation()}><p className="mb-5">가상 휴대폰에서는 실제 통화 및 연락처 추가를 지원하지 않습니다.</p><button onClick={()=>setShowNotice(false)} className="rounded-full bg-[#e5e8f3] px-8 py-2">확인</button></div></div>}
  </section>
}
