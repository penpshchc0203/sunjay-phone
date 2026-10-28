'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, MessageCircle, BellOff, Pin, Users, ImageIcon, Search, X, UserRound, Star, Music2, Play, Pause, Send, Settings, Trash2 } from 'lucide-react'
import { useEpisodeProgress } from '../use-episode-progress'
import { useEpisode } from '../episode-provider'
import { USER_CONTACT_ID } from '@/content/contacts'
import type { Contact } from '@/lib/phone/content-types'
import { CHARACTER } from '@/config/character'
import { usePhone } from '../phone-provider'
import { useNotifications } from '../notification-provider'
import type { KakaoMessage, KakaoRoom } from '@/lib/phone/content-types'

const contactName = (id: string, contacts: Contact[]) => id === 'me' ? CHARACTER.owner.name : contacts.find(c => c.id === id)?.name ?? (id === USER_CONTACT_ID || id === 'sunwoo' ? CHARACTER.user.displayName : id)
const contactAvatar = (id: string, avatars: Record<string,string>) => avatars[id]
const roomTitle = (room: KakaoRoom, contacts: Contact[]) => room.title || room.memberIds.map(id => contactName(id, contacts)).join(', ') || '알 수 없는 대화'
// Explicit-offset timestamps represent instants. Offset-free legacy timestamps
// represent Seoul wall-clock time and must not be shifted by the viewer's timezone.
const seoulParts = (value: string): { day: string; minute: string; hour: number; min: number } | null => {
  if (!value || typeof value !== 'string') return null
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/i)
  if (!match) return null
  const [, y, mo, d, hh, mm, offset] = match
  const hour = Number(hh), min = Number(mm)
  if (hour > 23 || min > 59 || Number(mo) < 1 || Number(mo) > 12 || Number(d) < 1 || Number(d) > 31) return null
  if (!offset) return { day: `${y}-${mo}-${d}`, minute: `${hh}:${mm}`, hour, min }
  const normalized = offset.toUpperCase() === 'Z' ? 'Z' : offset.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
  const instant = new Date(`${y}-${mo}-${d}T${hh}:${mm}:00${normalized}`)
  if (Number.isNaN(instant.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(instant)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  const localHour = Number(get('hour')), localMin = Number(get('minute'))
  return { day: `${get('year')}-${get('month')}-${get('day')}`, minute: `${get('hour')}:${get('minute')}`, hour: localHour, min: localMin }
}
const timeLabel = (date: string) => {
  const time = seoulParts(date)
  return time ? `${time.hour < 12 ? '오전' : '오후'} ${time.hour % 12 || 12}:${String(time.min).padStart(2, '0')}` : ''
}
const dateLabel = (date: string) => {
  const day = seoulParts(date)?.day ?? date.slice(0, 10)
  const [year, month, dateOfMonth] = day.split('-')
  return year && month && dateOfMonth ? `${year}년 ${Number(month)}월 ${Number(dateOfMonth)}일` : ''
}
const canOpenKakaoRoom = (room: KakaoRoom) => room.id === 'kakao-friends' || room.id === 'kakao-user'
const sameMinuteRun = (left: KakaoMessage, right: KakaoMessage) => {
  const a = seoulParts(left.sentAt), b = seoulParts(right.sentAt)
  return Boolean(a && b && left.from === right.from && a.day === b.day && a.minute === b.minute)
}
function Avatar({ id, group = false, size = 44 }: { id: string; group?: boolean; size?: number }) {
  const { content } = useEpisode()
  const contact = content.contacts.find(c => c.id === id)
  const src = group ? undefined : (contactAvatar(id, content.kakaoAvatars))
  const name = group ? '그룹' : contactName(id, content.contacts) || contact?.name || id
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  return <span className="flex shrink-0 items-center justify-center overflow-hidden rounded-[38%] bg-[#e5e2da] text-[#5a554e]" style={{width:size,height:size}}>
    {src && !failed ? <img src={src} alt={`${name} 프로필`} className="h-full w-full object-cover" onError={() => setFailed(true)}/> : group ? <Users size={size*.45}/> : <UserRound size={size*.5} strokeWidth={1.5} aria-label="기본 프로필"/>}
  </span>
}
const messageImages = (message: KakaoMessage) => (message.images?.length ? message.images : message.image ? [message.image] : []).filter(Boolean).slice(0, 4)
function MessageBody({ message, onImage }: { message: KakaoMessage; onImage: (images: string[], index: number) => void }) {
  const images = messageImages(message)
  return <div className="flex max-w-full flex-col gap-1">
    {message.deleted ? <span className="italic text-zinc-500">삭제된 메시지입니다.</span> : message.text && <span className="whitespace-pre-wrap break-words">{message.text}</span>}
    {message.emoticon && <span className="whitespace-pre-wrap text-sm italic">{message.emoticon}</span>}
    {images.length > 0 && <div className={`grid w-[208px] max-w-full overflow-hidden rounded-lg bg-white/40 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-0.5`}>
      {images.map((src, index) => <button type="button" key={`${src}-${index}`} onClick={() => onImage(images, index)} aria-label={`첨부 사진 ${index + 1}/${images.length} 확대`} className={`relative overflow-hidden bg-zinc-200 ${images.length === 1 ? 'h-48' : 'aspect-square'}`}>
        <img src={src} alt={`대화에 첨부된 사진 ${index + 1}`} className="h-full w-full object-cover" onError={e => { e.currentTarget.style.display = 'none' }}/>
      </button>)}
    </div>}
  </div>
}
function RoomView({ room }: { room: KakaoRoom }) {
  const { content } = useEpisode()
  const KAKAO_ROOMS = content.kakaoRooms
  const KAKAO_PROFILES = content.kakaoProfiles
  const CONTACTS = content.contacts
  const { back } = usePhone()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [preview, setPreview] = useState<{ images: string[]; index: number } | null>(null)
  const previewStart = useRef<number | null>(null)
  const openPreview = (images: string[], index: number) => setPreview({ images, index })
  const stepPreview = (direction: number) => setPreview(current => current ? { ...current, index: Math.max(0, Math.min(current.images.length - 1, current.index + direction)) } : null)
  const [profile, setProfile] = useState<string|null>(null)
  const [draft, setDraft] = useState('')
  const [sent, setSent] = useState<KakaoMessage[]>([])
  const { episode } = useEpisode()
  const storageKey = `virtual-phone:kakao-sent:v1:${episode.id}:${room.id}`
  const [confirmRoomClear, setConfirmRoomClear] = useState(false)
  const clearSentInRoom = () => { try { localStorage.removeItem(storageKey) } catch {} setSent([]); setConfirmRoomClear(false) }
  useEffect(() => { const reload = () => { try { const data = JSON.parse(localStorage.getItem(storageKey) || '[]'); setSent(Array.isArray(data) ? data.filter((m: KakaoMessage) => m && typeof m.id === 'string' && typeof m.text === 'string') : []) } catch { setSent([]) } }; reload(); window.addEventListener('phone:kakao-sent-cleared', reload); return () => window.removeEventListener('phone:kakao-sent-cleared', reload) }, [storageKey])
  const send = () => {
    const text = draft.trim()
    if (!text) return
    const msg: KakaoMessage = {id: `reader-${Date.now()}-${Math.random().toString(36).slice(2)}`, from: 'me', text, sentAt: new Date().toISOString()}
    setSent(old => {const next = [...old,msg]; try {localStorage.setItem(storageKey,JSON.stringify(next))} catch {} return next})
    setDraft('')
  }
  const allMessages = [...room.messages, ...sent]
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }) }, [room.id, sent.length])
  let lastDate = ''
  return <section className="relative flex h-full min-h-0 flex-col bg-[#b2c7d9] text-[#222]" style={(room.backgroundImage || room.wallpaper) ? {backgroundImage:`url(${JSON.stringify(room.backgroundImage || room.wallpaper).slice(1,-1)})`,backgroundPosition:'center',backgroundSize:'cover'} : undefined}>
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-black/5 px-3">
      <button onClick={back} aria-label="채팅 목록으로" className="rounded-full p-2 hover:bg-black/10"><ChevronLeft size={23}/></button>
      <div className="min-w-0 flex-1"><h1 className="truncate text-base font-semibold">{roomTitle(room, content.contacts)}</h1><p className="text-[11px] text-[#526475]">{room.type === 'group' ? `${room.memberIds.length + 1}명` : '대화방'}</p></div>
      {room.muted && <BellOff size={17} className="text-[#526475]"/>}
      <button onClick={()=>setConfirmRoomClear(true)} aria-label="이 채팅방에서 내가 보낸 메시지 초기화" className="rounded-full p-2 hover:bg-black/10"><Trash2 size={18}/></button>
      
    </header>
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4">
      {allMessages.map((msg, index) => {
        const date = seoulParts(msg.sentAt)?.day ?? msg.sentAt.slice(0, 10)
        const showTime = index === allMessages.length - 1 || !sameMinuteRun(msg, allMessages[index + 1])
        const showDate = date !== lastDate
        lastDate = date
        const mine = msg.from === 'me'
        const showSender = !mine && (index === 0 || !sameMinuteRun(allMessages[index - 1], msg))
        return <div key={msg.id}>
          {showDate && <div className="mx-auto mb-4 w-fit rounded-full bg-[#879bac]/65 px-3 py-1 text-center text-[11px] text-white">{dateLabel(msg.sentAt)}</div>}
          <div className={`flex items-start gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
            {!mine && <div className="w-[34px] shrink-0">{showSender && <button aria-label={`${contactName(msg.from, content.contacts)} 프로필 보기`} onClick={() => setProfile(msg.from)}><Avatar id={msg.from} size={34}/></button>}</div>}
            <div className={`flex min-w-0 max-w-[78%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
              {showSender && <span className="mb-1 text-xs text-[#263645]">{contactName(msg.from, content.contacts)}</span>}
              <div className={`flex max-w-full items-end gap-1 ${mine ? 'flex-row-reverse' : ''}`}>
                <div className={`min-w-0 text-[13px] leading-relaxed ${messageImages(msg).length > 0 && !msg.text && !msg.emoticon && !msg.deleted ? 'overflow-hidden rounded-xl' : `rounded-xl px-3 py-2 shadow-sm ${mine ? 'bg-[#fee500]' : 'bg-white'}`}`}><MessageBody message={msg} onImage={openPreview}/></div>
                <div className="shrink-0 pb-0.5 text-[9px] text-[#536574]">{typeof msg.unreadCount === 'number' && msg.unreadCount > 0 && <span className="block text-right font-bold text-[#8a5b00]">{msg.unreadCount}</span>}{showTime && timeLabel(msg.sentAt)}</div>
              </div>
            </div>
          </div>
        </div>
      })}
      <div ref={bottomRef}/>
    </div>
    <form onSubmit={e => {e.preventDefault();send()}} className="flex shrink-0 items-end gap-2 border-t border-black/5 bg-[#f8f8f8] px-3 py-2">
      <textarea aria-label="메시지 입력" rows={1} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send()}}} placeholder="메시지 입력" className="max-h-28 min-h-10 min-w-0 flex-1 resize-none overflow-y-auto rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none"/>
      <button type="submit" disabled={!draft.trim()} aria-label="메시지 전송" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fee500] disabled:opacity-40"><Send size={18}/></button>
    </form>
    {confirmRoomClear && <div role="dialog" aria-modal="true" aria-label="현재 채팅방 메시지 초기화" className="absolute inset-0 z-[60] flex items-center justify-center bg-black/45 p-5"><div className="w-full rounded-2xl bg-white p-5 shadow-xl"><h2 className="font-semibold">내가 보낸 메시지 초기화</h2><p className="mt-2 text-sm text-zinc-600">이 채팅방에서 직접 보낸 메시지만 삭제할까요? 작품 원본 대화는 유지됩니다.</p><div className="mt-5 flex justify-end gap-3"><button onClick={()=>setConfirmRoomClear(false)} className="rounded-lg px-3 py-2 text-sm">취소</button><button onClick={clearSentInRoom} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white">초기화</button></div></div></div>}
    {preview && <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-3 text-white" role="dialog" aria-modal="true" aria-label="사진 확대" onTouchStart={e => { previewStart.current = e.touches[0]?.clientX ?? null }} onTouchEnd={e => { if (previewStart.current === null) return; const delta = (e.changedTouches[0]?.clientX ?? previewStart.current) - previewStart.current; if (Math.abs(delta) > 45) stepPreview(delta < 0 ? 1 : -1); previewStart.current = null }}>
      <button onClick={() => setPreview(null)} className="absolute right-4 top-4 z-10 rounded-full bg-white/20 p-2" aria-label="사진 닫기"><X/></button>
      <img src={preview.images[preview.index]} alt={`확대된 대화 사진 ${preview.index + 1}`} className="max-h-[78%] max-w-full object-contain"/>
      {preview.images.length > 1 && <><button onClick={() => stepPreview(-1)} disabled={preview.index === 0} className="absolute left-2 top-1/2 rounded-full bg-white/20 p-2 disabled:cursor-not-allowed disabled:opacity-30" aria-label="이전 사진"><ChevronLeft/></button><button onClick={() => stepPreview(1)} disabled={preview.index === preview.images.length - 1} className="absolute right-2 top-1/2 rounded-full bg-white/20 p-2 disabled:cursor-not-allowed disabled:opacity-30" aria-label="다음 사진"><ChevronRight/></button><span className="absolute bottom-8 text-sm">{preview.index + 1} / {preview.images.length}</span></>}
    </div>}
    {profile && <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-[#8da4b6] p-5" role="dialog" aria-label="카카오톡 프로필"><button onClick={() => setProfile(null)} className="absolute left-4 top-4 rounded-full bg-black/10 p-2" aria-label="프로필 닫기"><X/></button><Avatar id={profile} size={94}/><strong className="text-xl">{contactName(profile, content.contacts)}</strong><p className="text-center text-sm">{KAKAO_PROFILES.find(x => x.contactId===profile)?.statusMessage || '상태 메시지가 없습니다'}</p>{KAKAO_PROFILES.find(x=>x.contactId===profile)?.music && <p className="rounded-full bg-white/40 px-4 py-2 text-xs">♫ {KAKAO_PROFILES.find(x=>x.contactId===profile)?.music}</p>}</div>}
  </section>
}
function RoomList() {
  const { content } = useEpisode()
  const KAKAO_ROOMS = content.kakaoRooms
  const KAKAO_PROFILES = content.kakaoProfiles
  const CONTACTS = content.contacts
  const { pushRoute } = usePhone()
  const { episode } = useEpisode()
  const [settingsOpen,setSettingsOpen] = useState(false)
  const [confirmClearAll,setConfirmClearAll] = useState(false)
  const clearEpisodeSent = () => {
    const prefix = `virtual-phone:kakao-sent:v1:${episode.id}:`
    try { for (const room of KAKO_ROOMS_FOR_CLEAR) localStorage.removeItem(`${prefix}${room.id}`) } catch {}
    window.dispatchEvent(new Event('phone:kakao-sent-cleared'))
    setConfirmClearAll(false)
  }
  const KAKO_ROOMS_FOR_CLEAR = KAKAO_ROOMS
  const [query,setQuery] = useState('')
  const [readIds,setReadIds] = useState<string[]>([])
  const rooms = [...KAKAO_ROOMS].sort((a,b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || (b.messages.at(-1)?.sentAt ?? '').localeCompare(a.messages.at(-1)?.sentAt ?? ''))
  const filtered = rooms.filter(room => `${roomTitle(room, content.contacts)} ${room.messages.map(m=>m.text||'').join(' ')}`.toLowerCase().includes(query.toLowerCase()))
  return <section className="relative flex h-full min-h-0 flex-col bg-white text-[#202020]">
    <header className="flex h-14 shrink-0 items-center justify-between px-5"><h1 className="text-[22px] font-bold">채팅</h1><div className="ml-auto"><button onClick={()=>setSettingsOpen(v=>!v)} aria-label="카카오톡 설정" className="rounded-full p-2 hover:bg-zinc-100"><Settings size={20}/></button></div></header>
    <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2"><Search size={16} className="text-zinc-500"/><input aria-label="채팅방 검색" value={query} onChange={e=>setQuery(e.target.value)} placeholder="대화방·메시지 검색" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></div>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {rooms.length === 0 && <p className="p-8 text-center text-sm text-zinc-500">아직 대화방이 없습니다.</p>}
      {filtered.length===0 && <p className="p-6 text-center text-sm text-zinc-500">검색 결과가 없어요.</p>}
      {filtered.map(room => {
        const last = room.messages.at(-1)
        return <button key={room.id} onClick={() => {if (!canOpenKakaoRoom(room)) return; setReadIds(ids=>[...ids,room.id]);pushRoute(`room:${room.id}`)}} disabled={!canOpenKakaoRoom(room)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 focus-visible:bg-zinc-100">
          <Avatar id={room.memberIds[0] ?? 'me'} group={room.type === 'group'} size={52}/>
          <div className="min-w-0 flex-1"><div className="flex items-center gap-1"><span className="truncate text-[15px] font-semibold">{roomTitle(room, content.contacts)}</span>{room.type === 'group' && <span className="text-xs text-zinc-400">{room.memberIds.length + 1}</span>}{room.pinned && <Pin size={12} className="text-zinc-400"/>}{room.muted && <BellOff size={12} className="text-zinc-400"/>}</div><p className="mt-1 truncate text-[13px] text-zinc-500">{last?.text ?? (messageImages(last ?? { id: '', from: '', sentAt: '' }).length ? '사진' : last?.emoticon ?? '대화 내용 없음')}</p></div>
          <div className="flex shrink-0 flex-col items-end gap-1"><span className="text-[10px] text-zinc-400">{last ? timeLabel(last.sentAt) : ''}</span>{Boolean(room.unreadCount) && !readIds.includes(room.id) && <span className="flex min-w-5 items-center justify-center rounded-full bg-[#f05c53] px-1.5 py-0.5 text-[10px] text-white">{room.unreadCount}</span>}</div>
        </button>
      })}
    </div>
    {settingsOpen && <div className="absolute inset-0 z-40 flex flex-col bg-white"><header className="flex h-14 items-center gap-3 border-b px-4"><button onClick={()=>setSettingsOpen(false)} aria-label="설정 닫기"><ChevronLeft size={23}/></button><h2 className="font-semibold">카카오톡 설정</h2></header><button onClick={()=>setConfirmClearAll(true)} className="flex items-center gap-2 border-b px-5 py-4 text-left text-sm"><Trash2 size={18}/>내가 보낸 메시지 초기화 <span className="ml-auto text-xs text-zinc-500">현재 에피소드</span></button><p className="px-5 py-3 text-xs text-zinc-500">작품에 등록된 원본 대화는 삭제되지 않습니다.</p></div>}
    {confirmClearAll && <div role="dialog" aria-modal="true" className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-5"><div className="w-full rounded-2xl bg-white p-5 shadow-xl"><h2 className="font-semibold">내가 보낸 메시지 초기화</h2><p className="mt-2 text-sm text-zinc-600">현재 에피소드에서 직접 작성하여 전송한 메시지를 모두 삭제하시겠습니까? 작품에 원래 등록된 대화 내용은 삭제되지 않습니다.</p><div className="mt-5 flex justify-end gap-3"><button onClick={()=>setConfirmClearAll(false)} className="rounded-lg px-3 py-2 text-sm">취소</button><button onClick={clearEpisodeSent} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white">초기화</button></div></div></div>}
    <KakaoTabs active="chats" onFriends={() => pushRoute("friends")} onChats={() => {}} />
  </section>
}

function KakaoTabs({ active, onFriends, onChats }: { active: 'friends' | 'chats'; onFriends: () => void; onChats: () => void }) {
  return <nav aria-label="카카오톡 메뉴" className="flex shrink-0 items-center justify-around border-t border-zinc-100 bg-white py-2">
    <button onClick={onFriends} aria-current={active === 'friends' ? 'page' : undefined} className={`flex min-w-20 flex-col items-center gap-1 py-1 text-[11px] ${active === 'friends' ? 'text-[#242424]' : 'text-zinc-400'}`}><UserRound size={23} strokeWidth={active === 'friends' ? 2.5 : 1.8}/></button>
    <button onClick={onChats} aria-current={active === 'chats' ? 'page' : undefined} className={`flex min-w-20 flex-col items-center gap-1 py-1 text-[11px] ${active === 'chats' ? 'text-[#242424]' : 'text-zinc-400'}`}><MessageCircle size={23} strokeWidth={active === 'chats' ? 2.5 : 1.8}/></button>
  </nav>
}

function FriendList() {
  const { content } = useEpisode()
  const KAKAO_ROOMS = content.kakaoRooms
  const KAKAO_PROFILES = content.kakaoProfiles
  const CONTACTS = content.contacts
  const { pushRoute, back } = usePhone()
  const friends = CONTACTS.filter(c => c.id !== USER_CONTACT_ID)
  const favorites = friends.filter(c => c.favorite)
  const others = friends.filter(c => !c.favorite)
  const profileRow = (id: string, own = false) => <button key={id} onClick={() => pushRoute(`profile:${id}`)} className="flex w-full items-center gap-3 px-5 py-2.5 text-left hover:bg-zinc-50 focus-visible:bg-zinc-100">
    <Avatar id={id} size={own ? 56 : 45}/>
    <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold">{contactName(id, content.contacts)}</span><span className="mt-0.5 block truncate text-[12px] text-zinc-400">{KAKAO_PROFILES.find(p => p.contactId === id)?.statusMessage ?? (id === 'me' ? CHARACTER.owner.statusMessage : '')}</span></span>
  </button>
  return <section className="flex h-full min-h-0 flex-col bg-white text-[#202020]">
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="border-b border-zinc-100 py-2">{profileRow('me', true)}</div>
      <div className="pt-3"><div className="flex items-center gap-1 px-5 pb-1 text-[11px] text-zinc-400"><Star size={12}/>즐겨찾는 친구 {favorites.length}</div>{favorites.map(c => profileRow(c.id))}</div>
      <div className="pt-3"><div className="px-5 pb-1 text-[11px] text-zinc-400">친구 {others.length}</div>{others.map(c => profileRow(c.id))}</div>
    </div>
    <KakaoTabs active="friends" onFriends={() => {}} onChats={() => back()}/>
  </section>
}

function ProfileDetail({ contactId }: { contactId: string }) {
  const { content } = useEpisode()
  const KAKAO_ROOMS = content.kakaoRooms
  const KAKAO_PROFILES = content.kakaoProfiles
  const CONTACTS = content.contacts
  const { back, pushRoute } = usePhone()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [zoom, setZoom] = useState(false)
  const profile = KAKAO_PROFILES.find(p => p.contactId === contactId || (contactId === 'me' && p.contactId === USER_CONTACT_ID))
  const contact = CONTACTS.find(c => c.id === contactId)
  const bg = profile?.backgroundImage
  const avatar = content.kakaoAvatars[contactId]
  const musicTitle = typeof profile?.music === 'string' ? profile.music : undefined
  const musicArtist = profile?.musicArtist
  const musicUrl = profile?.musicUrl
  const directRoom = KAKAO_ROOMS.find(r => r.type === 'direct' && r.memberIds.includes(contactId))
  useEffect(() => { setPlaying(false); setZoom(false) }, [contactId])
  const toggleMusic = async () => {
    if (!audioRef.current || !musicUrl) return
    if (audioRef.current.paused) { try { await audioRef.current.play(); setPlaying(true) } catch { setPlaying(false) } }
    else { audioRef.current.pause(); setPlaying(false) }
  }
  return <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#8da4b6] text-white">
    {bg && <img src={bg} alt="프로필 배경" className="absolute inset-0 h-full w-full object-cover" onError={e => {e.currentTarget.style.display='none'}}/>}
    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-black/65"/>
    <header className="relative z-10 flex h-14 shrink-0 items-center justify-between px-3"><button onClick={back} aria-label="이전 화면" className="rounded-full p-2 hover:bg-white/20"><ChevronLeft size={24}/></button></header>
    <div className="relative z-10 mt-auto flex flex-col items-center px-6 pb-8">
      <button aria-label="프로필 사진 확대" onClick={() => avatar && setZoom(true)} className="rounded-[38%] focus-visible:outline-2 focus-visible:outline-white"><Avatar id={contactId} size={96}/></button>
      <h2 className="mt-4 text-xl font-semibold">{contactName(contactId, content.contacts)}</h2>
      <p className="mt-1 min-h-5 text-center text-sm text-white/90">{profile?.statusMessage ?? (contactId === 'me' ? CHARACTER.owner.statusMessage : '')}</p>
      {musicTitle && <div className="mt-5 flex w-full max-w-64 items-center gap-2 rounded-full border border-white/50 bg-black/20 px-3 py-2 text-xs backdrop-blur-sm"><Music2 size={16}/><div className="min-w-0 flex-1"><p className="truncate font-medium">{musicTitle}</p>{musicArtist && <p className="truncate text-[10px] text-white/75">{musicArtist}</p>}</div>{musicUrl && <button onClick={toggleMusic} aria-label={playing ? '음악 일시정지' : '음악 재생'} className="rounded-full p-1 hover:bg-white/20">{playing ? <Pause size={17}/> : <Play size={17}/>}</button>}{musicUrl && <audio ref={audioRef} src={musicUrl} onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)}/>}</div>}
      {contactId !== 'me' && directRoom && canOpenKakaoRoom(directRoom) && <button onClick={() => pushRoute(`room:${directRoom.id}`)} className="mt-5 flex items-center gap-2 rounded-full border border-white/50 bg-white/15 px-6 py-2 text-sm disabled:opacity-50"><MessageCircle size={17}/>1:1 채팅</button>}
    </div>
    {zoom && avatar && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 p-5" role="dialog" aria-label="프로필 사진 확대"><button onClick={() => setZoom(false)} className="absolute right-4 top-4 rounded-full bg-white/20 p-2" aria-label="사진 닫기"><X/></button><img src={avatar} alt={`${contactName(contactId, content.contacts)} 프로필 확대`} className="max-h-[80%] max-w-full object-contain"/></div>}
  </section>
}

export function KakaoApp() {
  const { content } = useEpisode()
  const KAKAO_ROOMS = content.kakaoRooms
  const KAKAO_PROFILES = content.kakaoProfiles
  const CONTACTS = content.contacts
  const { currentRoute, back } = usePhone()
  useEpisodeProgress('messages', currentRoute?.startsWith('room:') ? currentRoute.slice(5) : null)
  const { markTargetRead } = useNotifications()
  useEffect(()=>{if(currentRoute?.startsWith('room:'))markTargetRead('kakao',currentRoute.slice(5))},[currentRoute,markTargetRead])
  if (currentRoute?.startsWith('profile:')) return <ProfileDetail contactId={currentRoute.slice(8)}/>
  if (currentRoute === 'friends') return <FriendList/>
  if (currentRoute?.startsWith('room:')) {
    const room = KAKAO_ROOMS.find(r => r.id === currentRoute.slice(5))
    if (room && canOpenKakaoRoom(room)) return <RoomView room={room}/>
    return <div className="flex h-full flex-col items-center justify-center gap-3 bg-white text-zinc-700"><p>대화방을 찾을 수 없습니다.</p><button onClick={back} className="rounded bg-zinc-200 px-4 py-2">채팅 목록으로</button></div>
  }
  return <RoomList/>
}
