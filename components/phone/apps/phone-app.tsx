'use client'

import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Phone, PhoneMissed, Search, Trash2, Plus, Star, UserRound, Mic, Delete, X } from 'lucide-react'
import { useEpisode } from '../episode-provider'
import { usePhone } from '../phone-provider'
import type { CallLogEntry } from '@/lib/phone/content-types'
import callSummaries from '@/content/calls/summaries.json'
import { ArrowLeft, ChevronRight, Copy, Sparkles, Info, MessageCircle, Video } from 'lucide-react'
import { usePhoneEvents } from '../event-provider'
import { CallExperience } from '../call-experience'
import { getCallDialogues } from '@/content/calls/dialogues'

type Tab = 'keypad' | 'recent' | 'contacts'
const KEYS = [['1',''],['2','ABC'],['3','DEF'],['4','GHI'],['5','JKL'],['6','MNO'],['7','PQRS'],['8','TUV'],['9','WXYZ'],['*',''],['0','+'],['#','']]
const formatDay = (date: string) => { const day = date.slice(0,10); const d = new Date(`${day}T00:00:00Z`); return Number.isNaN(d.getTime()) ? date : `${d.getUTCMonth()+1}월 ${d.getUTCDate()}일 ${['일','월','화','수','목','금','토'][d.getUTCDay()]}요일` }
const formatTime = (date: string) => date.slice(11,16)
const callIcon = (type: CallLogEntry['type']) => type === 'incoming' ? ArrowDownLeft : type === 'outgoing' ? ArrowUpRight : PhoneMissed

export function PhoneApp() {
  const { back } = usePhone()
  const { content,episode } = useEpisode()
  const {callOutcomes,startOutgoingCall,clearReaderCallHistory}=usePhoneEvents()
  const dialogues=getCallDialogues(episode.id)
  const [replayId,setReplayId]=useState<string|null>(null)
  const [contactDetailId,setContactDetailId]=useState<string|null>(null)
  const [historyContactId,setHistoryContactId]=useState<string|null>(null)
  const contacts = content.contacts ?? []
  const [tab, setTab] = useState<Tab>('recent')
  const [number, setNumber] = useState('0100000624')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [showNotice, setShowNotice] = useState(false)
  const [confirmClearCalls, setConfirmClearCalls] = useState(false)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const contactById = (id?: string) => contacts.find(c => c.id === (id === 'user' ? 'sunwoo' : id))
  const displayName = (id?: string, unknown?: string) => contactById(id)?.name || unknown || '알 수 없음'
  const calls = useMemo(() => [...(content.calls ?? []),...callOutcomes.map(o=>({id:o.id,contactId:o.contactId,type:o.type,calledAt:o.calledAt,durationSec:o.durationSec} as CallLogEntry))].sort((a,b) => b.calledAt.localeCompare(a.calledAt)), [content.calls,callOutcomes])
  const filteredCalls = calls.filter(c => (!historyContactId || (c.contactId === historyContactId || (historyContactId === 'sunwoo' && c.contactId === 'user'))) && `${displayName(c.contactId,c.unknownNumber)} ${c.unknownNumber ?? ''}`.toLowerCase().includes(query.toLowerCase()))
  const grouped = filteredCalls.reduce<{day:string; items: typeof calls}[]>((groups,c) => { const day = c.calledAt.slice(0,10); const last = groups[groups.length-1]; if(last?.day === day) last.items.push(c); else groups.push({day,items:[c]}); return groups }, [])
  const filteredContacts = [...contacts].filter(c => (!favoritesOnly || c.favorite) && `${c.name} ${c.phoneNumber ?? ''}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name,'ko'))
  const favoriteContacts = contacts.filter(c => c.favorite)
  const selectedCall = calls.find(c => c.id === selected)
  const summary = callSummaries.summaries.find(s => s.callId === selectedCall?.id)
  const selectedContact = contactById(selected ?? selectedCall?.contactId)
  const keypadContact = contacts.find(c => c.phoneNumber?.replace(/\D/g,'') === number.replace(/\D/g,'')) ?? (number.replace(/\D/g,'') === '0100000624' ? contacts.find(c => c.id === 'sunwoo' || c.id === 'user') : undefined)
  const detailContact = contactById(contactDetailId ?? undefined)
  const historyContact = contactById(historyContactId ?? undefined)
  const replayCall = (id: string) => { const call=calls.find(c=>c.id===id); const dialogue=dialogues.find(d=>d.callId===id || (id.startsWith('event-call:') && d.eventId===id.slice('event-call:'.length).split(':')[0])); if(dialogue){setSelected(id);setReplayId(dialogue.id)}else setShowNotice(true) }
  const closeDetail = () => { if(summaryOpen) setSummaryOpen(false); else if(selected) setSelected(null); else back() }
  const avatar = (c: typeof contacts[number], size='h-9 w-9') => <div className={`${size} shrink-0 overflow-hidden rounded-full bg-[#d5e7df] flex items-center justify-center text-white`}>{c.avatar ? <img src={c.avatar} alt="" className="h-full w-full object-cover"/> : <UserRound size={20}/>}</div>
  return <section className="relative flex h-full min-h-0 flex-col bg-[#f0f1f6] text-black">
    <header className="flex h-14 shrink-0 items-center gap-3 px-5 pt-1">
      {tab !== 'keypad' && <h1 className="flex-1 text-[20px] font-bold">{historyContact ? `${historyContact.name}` : '전화'}</h1>}
      {historyContactId && <><button type="button" onClick={()=>setHistoryContactId(null)} aria-label="전체 통화 기록으로"><ArrowLeft size={20}/></button><button type="button" onClick={()=>setContactDetailId(historyContactId)} aria-label="연락처 정보"><Info size={22}/></button></>}
      {tab === 'keypad' && <div className="flex-1"/>}
      {tab === 'contacts' && <button aria-label="연락처 추가 안내" onClick={() => setShowNotice(true)}><Plus size={20} strokeWidth={1.7}/></button>}
      {tab === 'recent' && <button aria-label="정렬" onClick={() => setShowNotice(true)} className="text-2xl">☷</button>}
      <button aria-label="검색" onClick={() => setSearchOpen(v=>!v)}><Search size={20} strokeWidth={1.8}/></button>
      <button aria-label="통화기록 초기화" onClick={() => setConfirmClearCalls(true)}><Trash2 size={21}/></button>
    </header>
    {searchOpen && <div className="mx-5 mb-2 flex items-center gap-2 rounded-full bg-white px-4 py-2"><Search size={18}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="이름 또는 번호 검색" className="w-full bg-transparent outline-none"/><button onClick={()=>{setQuery('');setSearchOpen(false)}} aria-label="검색 닫기"><X size={18}/></button></div>}
    {tab === 'keypad' && <div className="flex min-h-0 flex-1 flex-col justify-end pb-24">
      <div className="flex min-h-[92px] flex-col items-center justify-end gap-1 px-8">{keypadContact && <button type="button" className="text-[16px] font-semibold" onClick={()=>setContactDetailId(keypadContact.id)}>{keypadContact.name}</button>}<div className="flex h-14 items-center justify-center gap-2"><span className="min-w-0 truncate text-[25px]">{number}</span>{number && <button onClick={()=>setNumber(v=>v.slice(0,-1))} aria-label="한 글자 지우기"><Delete size={24}/></button>}</div></div>
      <div className="mx-auto grid w-[82%] max-w-[310px] grid-cols-3 gap-y-2">{KEYS.map(([digit,letters])=><button key={digit} onClick={()=>setNumber(v=>v+digit)} className="flex h-[53px] flex-col items-center justify-center rounded-2xl active:bg-white/70"><span className="text-[37px] font-light leading-[39px]">{digit}</span><span className="h-4 text-[11px] tracking-wide text-[#88898d]">{letters}</span></button>)}</div>
      <button aria-label="전화 걸기" onClick={()=>{if(keypadContact?.id==='sunwoo')startOutgoingCall();else setShowNotice(true)}} className="mx-auto mt-5 flex h-[66px] w-[66px] items-center justify-center rounded-full bg-[#9aadd8] text-white"><Phone size={30} fill="currentColor"/></button>
    </div>}
      {tab === 'recent' && <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-2">{grouped.map(g=><div key={g.day}><h2 className="mb-2 mt-4 px-5 text-[13px] font-semibold">{formatDay(g.items[0].calledAt)}</h2><div className="overflow-hidden rounded-[24px] bg-white">{g.items.map(c=>{const Icon=callIcon(c.type);const missed=c.type==='missed'||c.type==='rejected';const expanded=selected===c.id;const detailSummary=callSummaries.summaries.find(s=>s.callId===c.id);const dialogue=dialogues.find(d=>d.callId===c.id || (c.id.startsWith('event-call:') && d.eventId===c.id.slice('event-call:'.length).split(':')[0]));const contact=contactById(c.contactId);return <div key={c.id}><button aria-expanded={expanded} onClick={()=>{setSelected(v=>v===c.id?null:c.id);setSummaryOpen(false)}} className="flex min-h-[61px] w-full items-center gap-3 px-5 text-left active:bg-zinc-100"><Icon size={20} strokeWidth={2.7} className={missed?'text-[#d33814]':'text-[#726d5e]'}/><div className="min-w-0 flex-1"><div className={`truncate text-[16px] ${detailSummary ? 'font-bold' : ''}`}>{displayName(c.contactId,c.unknownNumber)}</div></div><div className={`text-[13px] ${missed?'text-red-600':''}`}>{formatTime(c.calledAt)}{c.durationSec ? <Mic className="ml-auto text-[#77766b]" size={15}/> : null}</div></button>{expanded && <div className="mx-3 mb-3 rounded-[24px] bg-[#fafafa] px-4 pb-5 pt-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-[19px] font-bold">{displayName(c.contactId,c.unknownNumber)}</h3><p className="mt-1 text-[13px] text-zinc-500">{contact?.phoneNumber ?? c.unknownNumber ?? ''}</p></div>{contact && avatar(contact,'h-12 w-12')}</div><div className="mt-4 flex items-center gap-2 text-[13px]"><Icon size={17}/><span>{c.type==='incoming'?'수신전화':c.type==='outgoing'?'발신전화':missed?'부재중 전화':'통화'}{c.durationSec ? `, ${Math.floor(c.durationSec/60)}분 ${c.durationSec%60}초` : ''}</span></div><p className="mt-1 text-[12px] text-zinc-500">{formatTime(c.calledAt)}</p>{detailSummary && <button onClick={()=>{setSelected(c.id);setSummaryOpen(true)}} className="mt-4 flex w-full items-center justify-between gap-2 rounded-full border border-[#d9e4f5] bg-gradient-to-r from-[#e9e8ff] to-[#e5f9f7] px-4 py-3 text-left text-[13px] font-medium shadow-sm"><span className="min-w-0 truncate">{detailSummary.title}</span><ChevronRight size={19} className="shrink-0"/></button>}</div>}</div>})}</div></div>)}{!grouped.length && <p className="py-12 text-center text-zinc-500">통화 기록이 없습니다.</p>}</div>}
    {tab === 'contacts' && <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-3"><button onClick={()=>setFavoritesOnly(v=>!v)} className="mb-3 flex items-center gap-2 px-5 text-[14px] font-semibold"><Star size={19} fill={favoritesOnly?'black':'black'}/>즐겨찾기 {favoritesOnly?'· 전체 보기':''}</button>{!favoritesOnly && <div className="mb-5 grid grid-cols-3 gap-2">{favoriteContacts.slice(0,6).map(c=><button key={c.id} onClick={()=>setContactDetailId(c.id)} className="flex h-28 flex-col items-center justify-center gap-2 rounded-[18px] bg-[#a6a8d8] p-2 text-white">{avatar(c,'h-12 w-12')}<span className="max-w-full truncate text-[13px]">{c.name}</span></button>)}</div>}<h2 className="mb-3 px-7 text-[13px] font-semibold">연락처</h2><div className="overflow-hidden rounded-[22px] bg-white">{filteredContacts.map(c=><button key={c.id} onClick={()=>setContactDetailId(c.id)} className="flex w-full items-center gap-3 px-4 py-2 text-left active:bg-zinc-100">{avatar(c)}<span className="truncate text-[16px]">{c.name}</span></button>)}{!filteredContacts.length && <p className="p-6 text-center text-zinc-500">연락처가 없습니다.</p>}</div></div>}
    <nav className="absolute bottom-4 left-1/2 z-10 flex w-[min(84%,310px)] -translate-x-1/2 rounded-full border border-white bg-white/90 p-1 shadow-lg backdrop-blur" aria-label="전화 메뉴">{([{id:'keypad',label:'키패드',icon:'⠿'},{id:'recent',label:'최근기록',icon:'↗'},{id:'contacts',label:'연락처',icon:'♙'}] as const).map(t=><button key={t.id} onClick={()=>{setTab(t.id);setSelected(null);setQuery('');setSearchOpen(false)}} className={`flex flex-1 flex-col items-center justify-center rounded-full py-1.5 ${tab===t.id?'bg-[#e0e0e0]':''}`}><span className="text-[22px] leading-7">{t.icon}</span><span className="text-[11px]">{t.label}</span></button>)}</nav>
    {detailContact && <div className="absolute inset-0 z-20 flex min-h-0 flex-col overflow-y-auto bg-[#f0f1f6] px-4 pb-20 text-black">
      <header className="flex h-20 shrink-0 items-center"><button type="button" aria-label="연락처 상세 닫기" onClick={()=>setContactDetailId(null)}><ArrowLeft size={25}/></button></header>
      <div className="rounded-[28px] bg-white px-5 py-8">
        <div className="flex items-center justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-[25px] font-bold">{detailContact.name}</h2><p className="mt-2 text-[15px]">폰 {detailContact.phoneNumber ?? '번호 없음'}</p></div>{avatar(detailContact,'h-20 w-20')}</div>
        <div className="mt-9 flex justify-around text-[#91a7d1]">{[{label:'전화',icon:Phone,click:()=>{if(detailContact.id==='sunwoo'){setContactDetailId(null);startOutgoingCall()}else setShowNotice(true)}},{label:'메시지',icon:MessageCircle,click:()=>setShowNotice(true)},{label:'영상 통화',icon:Video,click:()=>setShowNotice(true)}].map(item=><button type="button" key={item.label} aria-label={item.label} onClick={item.click} className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0f1f6]"><item.icon size={25} fill="currentColor" fillOpacity={0.15}/></button>)}</div>
      </div>
      {<div className="mt-5 rounded-[28px] bg-white px-5 py-6"><p className="text-[14px]">생일</p><p className="mt-2 text-[17px]">{(detailContact as typeof detailContact & {birthday?:string;birthDate?:string}).birthday ?? (detailContact as typeof detailContact & {birthDate?:string}).birthDate ?? '등록된 생일 없음'}</p></div>}
      <button type="button" onClick={()=>{setHistoryContactId(detailContact.id);setContactDetailId(null);setTab('recent')}} className="mt-6 self-center rounded-full bg-[#c3c4c8] px-12 py-3 text-[15px] font-bold">통화 기록</button>
    </div>}
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
    {replayId && (()=>{const dialogue=dialogues.find(d=>d.id===replayId);const c=selectedCall;const contact=contactById(c?.contactId);return dialogue?<CallExperience name={displayName(c?.contactId,c?.unknownNumber)} avatar={contact?.avatar} number={contact?.phoneNumber} dialogue={dialogue} onClose={()=>setReplayId(null)}/>:null})()}
    {confirmClearCalls && <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/25 p-7" onClick={()=>setConfirmClearCalls(false)}>
      <div role="dialog" aria-modal="true" aria-label="통화기록 초기화 확인" className="w-full rounded-3xl bg-white p-6 text-center" onClick={e=>e.stopPropagation()}>
        <p className="font-bold">통화기록을 초기화할까요?</p>
        <p className="mt-2 text-[13px] text-zinc-500">직접 받은 전화와 거절한 전화 기록만 삭제됩니다.</p>
        <div className="mt-5 flex gap-2"><button className="flex-1 rounded-full bg-zinc-100 py-3" onClick={()=>setConfirmClearCalls(false)}>취소</button><button className="flex-1 rounded-full bg-[#e9ecf3] py-3 font-bold text-[#637da9]" onClick={()=>{clearReaderCallHistory();setSelected(null);setConfirmClearCalls(false)}}>초기화</button></div>
      </div>
    </div>}
    {showNotice && <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/25 p-7" onClick={()=>setShowNotice(false)}><div className="w-full rounded-3xl bg-white p-6 text-center" onClick={e=>e.stopPropagation()}><p className="mb-5">가상 휴대폰에서는 실제 통화 및 연락처 추가를 지원하지 않습니다.</p><button onClick={()=>setShowNotice(false)} className="rounded-full bg-[#e5e8f3] px-8 py-2">확인</button></div></div>}
  </section>
}
