'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, Home, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff, Star, Search, UserRound, Clock, BookUser } from 'lucide-react'
import { USER_CONTACT_ID } from '@/content/contacts'
import { useEpisode } from '../episode-provider'
import { CHARACTER } from '@/config/character'
import type { CallLogEntry } from '@/lib/phone/content-types'
import { usePhone } from '../phone-provider'

type View = 'recent' | 'favorites' | 'contacts'
const iconFor = (type: CallLogEntry['type']) => type === 'incoming' ? PhoneIncoming : type === 'outgoing' ? PhoneOutgoing : type === 'missed' ? PhoneMissed : PhoneOff
const typeName = (type: CallLogEntry['type']) => ({ incoming: '수신', outgoing: '발신', missed: '부재중', rejected: '거절' })[type]
const formatDate = (value: string) => { const d = new Date(value); return Number.isNaN(d.getTime()) ? value : d.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) }
const duration = (sec?: number) => sec === undefined ? '기록 없음' : sec >= 3600 ? `${Math.floor(sec / 3600)}시간 ${Math.floor(sec % 3600 / 60)}분 ${sec % 60}초` : `${Math.floor(sec / 60)}분 ${sec % 60}초`

export function PhoneApp() {
  const { goHome, back } = usePhone()
  const { content } = useEpisode()
  const CALL_LOG = content.calls
  const CONTACTS = content.contacts
  const [view, setView] = useState<View>('recent')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [contactSelected, setContactSelected] = useState<string | null>(null)
  const contact = (id?: string) => CONTACTS.find(c => c.id === id)
  const name = (id?: string, unknownNumber?: string) => id === USER_CONTACT_ID ? CHARACTER.user.displayName : contact(id)?.name || unknownNumber || '알 수 없음'
  const calls = useMemo(() => [...CALL_LOG].sort((a, b) => b.calledAt.localeCompare(a.calledAt)), [])
  const filteredCalls = calls.filter(c => `${name(c.contactId, c.unknownNumber)} ${c.unknownNumber || contact(c.contactId)?.phoneNumber || ''}`.toLowerCase().includes(search.toLowerCase()))
  const filteredContacts = CONTACTS.filter(c => `${c.name} ${c.phoneNumber || ''}`.toLowerCase().includes(search.toLowerCase()) && (view !== 'favorites' || c.favorite))
  const currentCall = calls.find(c => c.id === selected)
  const currentContact = contact(contactSelected || currentCall?.contactId)
  const goBack = () => { if (selected || contactSelected) { setSelected(null); setContactSelected(null) } else back() }
  return <section className="flex h-full min-h-0 flex-col bg-white text-zinc-900">
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-100 px-3"><button type="button" onClick={goBack} aria-label="뒤로 가기" className="rounded-full p-2 hover:bg-zinc-100"><ArrowLeft size={21}/></button><h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{selected || contactSelected ? '상세 정보' : '전화'}</h1><button type="button" onClick={goHome} aria-label="홈으로" className="rounded-full p-2 hover:bg-zinc-100"><Home size={20}/></button></header>
    {selected || contactSelected ? <div className="min-h-0 flex-1 overflow-y-auto p-5"><div className="flex flex-col items-center gap-2 py-5"><div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-zinc-100">{currentContact?.avatar ? <img src={currentContact.avatar} alt="연락처 프로필" onError={e => { e.currentTarget.style.display = 'none' }} className="size-full object-cover"/> : <UserRound size={38} className="text-zinc-400"/>}</div><h2 className="text-xl font-semibold">{name(contactSelected || currentCall?.contactId, currentCall?.unknownNumber)}</h2><p className="text-sm text-zinc-500">{currentContact?.phoneNumber || currentCall?.unknownNumber || '번호 없음'}</p>{currentContact?.relation && <p className="text-xs text-zinc-500">{currentContact.relation}</p>}</div>{currentCall && <div className="rounded-xl bg-zinc-50 p-4 text-sm"><p className="font-semibold">통화 기록</p><p className="mt-3">종류: {typeName(currentCall.type)}</p><p className="mt-2">일시: {formatDate(currentCall.calledAt)}</p><p className="mt-2">통화 시간: {duration(currentCall.durationSec)}</p></div>}{currentContact && <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm"><p className="font-semibold">연락처 정보</p><p className="mt-2">{currentContact.phoneNumber || '번호 없음'}</p><p className="mt-2">{currentContact.favorite ? '★ 즐겨찾는 연락처' : '일반 연락처'}</p></div>}<p className="mt-6 text-center text-xs text-zinc-400">가상 휴대폰입니다. 실제 통화는 연결되지 않습니다.</p></div> : <>
      <label className="mx-4 my-3 flex shrink-0 items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2"><Search size={16} className="text-zinc-500"/><input aria-label="통화 및 연락처 검색" value={search} onChange={e => setSearch(e.target.value)} placeholder="이름 또는 전화번호 검색" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></label>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{view === 'recent' ? <>{filteredCalls.map(c => { const Icon = iconFor(c.type); return <button type="button" key={c.id} onClick={() => { setSelected(c.id); setContactSelected(null) }} className="flex w-full items-center gap-3 border-b border-zinc-100 px-4 py-3 text-left hover:bg-zinc-50"><Icon size={19} className={c.type === 'missed' || c.type === 'rejected' ? 'text-red-500' : 'text-zinc-500'}/><div className="min-w-0 flex-1"><p className={`truncate text-sm font-semibold ${c.type === 'missed' ? 'text-red-600' : ''}`}>{name(c.contactId, c.unknownNumber)}</p><p className="text-xs text-zinc-500">{typeName(c.type)} · {duration(c.durationSec)}</p></div><span className="shrink-0 text-[11px] text-zinc-400">{formatDate(c.calledAt)}</span></button>})}{!filteredCalls.length && <p className="p-8 text-center text-sm text-zinc-500">통화 기록이 없습니다.</p>}</> : <>{filteredContacts.map(c => <button type="button" key={c.id} onClick={() => { setContactSelected(c.id); setSelected(null) }} className="flex w-full items-center gap-3 border-b border-zinc-100 px-4 py-3 text-left hover:bg-zinc-50"><div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100">{c.avatar ? <img src={c.avatar} alt="" onError={e => { e.currentTarget.style.display = 'none' }} className="size-full object-cover"/> : <UserRound size={22} className="text-zinc-400"/>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{c.id === USER_CONTACT_ID ? CHARACTER.user.displayName : c.name}</p><p className="text-xs text-zinc-500">{c.phoneNumber || c.relation || '번호 없음'}</p></div>{c.favorite && <Star size={16} fill="#eab308" className="text-yellow-500"/>}</button>)}{!filteredContacts.length && <p className="p-8 text-center text-sm text-zinc-500">연락처가 없습니다.</p>}</>}</div>
      <nav aria-label="전화 탭" className="flex shrink-0 justify-around border-t border-zinc-100 bg-white py-2">{([{ id: 'favorites', title: '즐겨찾기', icon: Star }, { id: 'recent', title: '최근 통화', icon: Clock }, { id: 'contacts', title: '연락처', icon: BookUser }] as const).map(tab => <button type="button" key={tab.id} onClick={() => { setView(tab.id); setSearch('') }} className={`flex min-w-20 flex-col items-center gap-1 px-3 py-1 text-xs ${view === tab.id ? 'text-emerald-600' : 'text-zinc-500'}`}><tab.icon size={20}/>{tab.title}</button>)}</nav>
    </>}
  </section>
}
