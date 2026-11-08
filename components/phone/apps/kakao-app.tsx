'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, MessageCircle, BellOff, Pin, Users, ImageIcon, Search, X, UserRound, Star, Music2, Play, Pause, Send, Settings, Trash2, ShoppingBag, Ellipsis, CirclePlay, UserRoundPlus, Gift, ChevronDown, ChevronUp } from 'lucide-react'
import { useEpisodeProgress } from '../use-episode-progress'
import { useEpisode } from '../episode-provider'
import { USER_CONTACT_ID } from '@/content/contacts'
import type { Contact } from '@/lib/phone/content-types'
import { CHARACTER } from '@/config/character'
import { usePhone } from '../phone-provider'
import { useNotifications } from '../notification-provider'
import { usePhoneEvents, eventNotifications } from '../event-provider'
import { MultiProfileManager, useKakaoProfileFeatures } from '../kakao-profile-features'
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
  return time ? `${String(time.hour).padStart(2, '0')}:${String(time.min).padStart(2, '0')}` : ''
}
const roomListDateLabel = (date: string) => {
  const day = seoulParts(date)?.day
  if (!day) return ''
  const today = new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(new Date())
  const get = (type: string) => today.find(part => part.type === type)?.value ?? ''
  const todayKey = `${get('year')}-${get('month')}-${get('day')}`
  if (day === todayKey) return timeLabel(date)
  const [year, month, dateOfMonth] = day.split('-')
  return year === get('year') ? `${Number(month)}월 ${Number(dateOfMonth)}일` : `${year}.${month}.${dateOfMonth}`
}
const dateLabel = (date: string) => {
  const day = seoulParts(date)?.day ?? date.slice(0, 10)
  const [year, month, dateOfMonth] = day.split('-')
  return year && month && dateOfMonth ? `${year}년 ${Number(month)}월 ${Number(dateOfMonth)}일` : ''
}
/** 에피소드의 마지막 공개일 다음 날 + 실제 한국 시각으로 사용자 메시지를 기록합니다. */
const readerMessageTime = (episodeEnd: string) => {
  const lastDay = episodeEnd.slice(0, 10)
  const next = new Date(`${lastDay}T00:00:00Z`)
  if (Number.isNaN(next.getTime())) return new Date().toISOString()
  next.setUTCDate(next.getUTCDate() + 1)
  const day = next.toISOString().slice(0, 10)
  const now = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date())
  const part = (key:string) => now.find(p=>p.type===key)?.value ?? '00'
  return `${day}T${part('hour')}:${part('minute')}:${part('second')}`
}
const SELF_ROOM_ID = 'kakao-self'
const canOpenKakaoRoom = (room: KakaoRoom) => room.id === SELF_ROOM_ID || room.id === 'kakao-friends' || room.id === 'kakao-user'
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
  return <span className="flex shrink-0 items-center justify-center overflow-hidden rounded-[38%] bg-[#a7d9fa] text-white" style={{width:size,height:size}}>
    {src && !failed ? <img src={src} alt={`${name} 프로필`} className="h-full w-full object-cover" onError={() => setFailed(true)}/> : group ? <Users size={size*.45}/> : <svg viewBox="0 0 48 48" width={size*.75} height={size*.75} aria-label="기본 프로필" role="img"><circle cx="24" cy="17" r="9" fill="#e5f3ff"/><path d="M6 43c0-11 7-17 18-17s18 6 18 17" fill="#e5f3ff"/></svg>}
  </span>
}
/** Optional gift-card extension; ordinary KakaoMessage fields remain unchanged. */
type KakaoGift = { bannerImage?: string; bannerColor?: string; productName: string; productImage?: string; message: string; senderLabel?: string }
type GiftMessage = KakaoMessage & { type?: 'gift'; gift?: KakaoGift }
function GiftCard({ gift }: { gift: KakaoGift }) {
  return <div className="w-[252px] max-w-full overflow-hidden rounded-[17px] bg-white text-[#242424] shadow-sm" onClick={e => e.stopPropagation()}>
    {gift.bannerImage ? <img src={gift.bannerImage} alt="선물하기 카드 이미지" className="h-[146px] w-full object-cover"/> : <div className="relative flex h-[146px] flex-col justify-center overflow-hidden px-5 text-white" style={{backgroundColor: /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(gift.bannerColor ?? '') ? gift.bannerColor : '#f49cba'}}><span className="relative z-10 text-[11px] opacity-90">카카오톡 선물하기</span><span className="relative z-10 mt-3 text-lg font-semibold">조금 쉬었다가도<br/>괜찮아</span><span className="absolute right-5 top-5 text-4xl opacity-75" aria-hidden="true">♥</span><span className="absolute bottom-3 right-14 text-2xl opacity-70" aria-hidden="true">♥</span><span className="absolute bottom-4 right-5 text-3xl opacity-90" aria-hidden="true">♡</span></div>}
    <div className="flex items-center gap-3 border-b border-zinc-100 p-3">
      {gift.productImage ? <img src={gift.productImage} alt={gift.productName} className="h-14 w-14 shrink-0 rounded object-cover"/> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-[#f5edda] text-2xl">🎁</div>}
      <div className="min-w-0"><p className="text-[10px] text-zinc-500">{gift.senderLabel || '선물 도착'}</p><p className="mt-1 line-clamp-2 text-[12px] font-semibold">{gift.productName}</p></div>
    </div>
    <div className="px-3 py-3"><p className="mb-1 text-[11px] font-semibold">💌 함께 온 메시지</p><p className="whitespace-pre-wrap break-words text-[12px] leading-5">{gift.message}</p>
      <button type="button" className="mt-3 w-full rounded-lg bg-[#f5f5f5] py-2.5 text-center text-[12px]" aria-disabled="true">주문내역 보기</button>
      <button type="button" className="mt-1.5 w-full rounded-lg bg-[#f5f5f5] py-2.5 text-center text-[12px]" aria-disabled="true">💌 메시지카드 열기</button>
    </div><div className="border-t border-zinc-100 px-3 py-2 text-[10px] text-zinc-500">🎁 카카오톡 선물하기</div>
  </div>
}
const messageImages = (message: KakaoMessage) => (message.images?.length ? message.images : message.image ? [message.image] : []).filter(Boolean).slice(0, 4)
function MessageBody({ message, onImage }: { message: KakaoMessage; onImage: (images: string[], index: number) => void }) {
  const gift = (message as GiftMessage).gift
  if ((message as GiftMessage).type === 'gift' && gift && !message.deleted) return <GiftCard gift={gift}/>
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
  const { back, pushRoute } = usePhone()
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [navigationNotice, setNavigationNotice] = useState('')
  const initializedRoom = useRef('')
  const [preview, setPreview] = useState<{ images: string[]; index: number } | null>(null)
  const previewStart = useRef<number | null>(null)
  const openPreview = (images: string[], index: number) => setPreview({ images, index })
  const stepPreview = (direction: number) => setPreview(current => current ? { ...current, index: Math.max(0, Math.min(current.images.length - 1, current.index + direction)) } : null)
  const { dispatchEvent: triggerPhoneEvent, executions: eventExecutions, deliveredIds, replyDeliveryIds, resetKakaoEvents } = usePhoneEvents()
  const [draft, setDraft] = useState('')
  const [replyTarget, setReplyTarget] = useState<KakaoMessage | null>(null)
  const [sent, setSent] = useState<KakaoMessage[]>([])
  const { episode } = useEpisode()
  const isSelfRoom = room.id === SELF_ROOM_ID
  const storageKey = `virtual-phone:kakao-sent:v1:${episode.id}:${room.id}`
  const [confirmRoomClear, setConfirmRoomClear] = useState(false)
  const clearSentInRoom = () => { try { localStorage.removeItem(storageKey) } catch {} resetKakaoEvents(room.id); setSent([]); setConfirmRoomClear(false) }
  useEffect(() => { const reload = () => { try { const data = JSON.parse(localStorage.getItem(storageKey) || '[]'); setSent(Array.isArray(data) ? data.filter((m: KakaoMessage) => m && typeof m.id === 'string' && typeof m.text === 'string') : []) } catch { setSent([]) } }; reload(); window.addEventListener('phone:kakao-sent-cleared', reload); return () => window.removeEventListener('phone:kakao-sent-cleared', reload) }, [storageKey])
  const send = () => {
    const text = draft.trim()
    if (!text) return
    const msg: KakaoMessage = {id: `reader-${Date.now()}-${Math.random().toString(36).slice(2)}`, from: 'me', text, sentAt: readerMessageTime(isSelfRoom ? '2026-05-17T23:59' : episode.dateTime), ...(replyTarget ? { replyTo: {id: replyTarget.id, from: replyTarget.from, text: replyTarget.text || (messageImages(replyTarget).length ? '사진' : replyTarget.emoticon || '메시지')} } : {})} as KakaoMessage & {replyTo?: {id: string; from: string; text: string}}
    setSent(old => {const next = [...old,msg]; try {localStorage.setItem(storageKey,JSON.stringify(next))} catch {} return next})
    if (!isSelfRoom) triggerPhoneEvent({type:'kakao.send',roomId:room.id,keyword:text,triggerId:msg.id,occurredAt:msg.sentAt})
    window.dispatchEvent(new Event('phone:kakao-sent-updated'))
    setDraft('')
    setReplyTarget(null)
    requestAnimationFrame(() => { if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight })
  }
  const triggeredReplies: KakaoMessage[] = eventExecutions.flatMap(execution => execution.actions.flatMap((action, index) =>
    action.type === 'kakao.reply' && action.roomId === room.id && (replyDeliveryIds.includes(`${execution.id}:${index}`) || (deliveredIds.includes(execution.id) && !execution.actions.some((a,i)=>a.type==='kakao.reply' && replyDeliveryIds.includes(`${execution.id}:${i}`))))
      ? [{ id: `event-reply:${execution.id}:${index}`, from: action.from, text: action.text || '', ...('image' in action && typeof action.image === 'string' ? {image:action.image} : {}), sentAt: execution.executedAt } as KakaoMessage]
      : []))
  // Story messages retain their original chronology. Reader messages and their
  // triggered replies form a separate, append-only sequence in send order.
  const sentPositions = new Map(sent.map((message, index) => [message.id, index]))
  const replyPositions = new Map<string, number>()
  for (const execution of eventExecutions) {
    const position = sentPositions.get(execution.triggerId)
    if (position === undefined) continue
    execution.actions.forEach((action, index) => {
      if (action.type === 'kakao.reply' && action.roomId === room.id) {
        replyPositions.set(`event-reply:${execution.id}:${index}`, position + 0.5 + index * 0.001)
      }
    })
  }
  const readerIds = new Set(sent.map(message => message.id))
  const readerReplyIds = new Set(replyPositions.keys())
  const readerMessages = [...sent, ...triggeredReplies.filter(message => readerReplyIds.has(message.id))]
    .sort((a, b) => {
      const position = (message: KakaoMessage) => sentPositions.get(message.id) ?? replyPositions.get(message.id) ?? 0
      return position(a) - position(b)
    })
  const storyMessages = [...room.messages, ...triggeredReplies.filter(message => !readerReplyIds.has(message.id))]
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
  const allMessages = [...storyMessages, ...readerMessages]
  const replyInfo = (msg: KakaoMessage) => {
    const reply = msg as KakaoMessage & { replyTo?: { id: string; from: string; text: string }; replyToId?: string }
    if (reply.replyTo) return reply.replyTo
    if (!reply.replyToId) return undefined
    const original = allMessages.find(item => item.id === reply.replyToId)
    if (!original) return undefined
    return {
      id: original.id,
      from: original.from,
      text: original.text || (messageImages(original).length ? '사진' : original.emoticon || '메시지'),
    }
  }
  const messageDates = [...new Set(storyMessages.map(m => seoulParts(m.sentAt)?.day ?? m.sentAt.slice(0, 10)).filter(Boolean))].sort()
  const media = allMessages.flatMap((message, messageIndex) => messageImages(message).map((src, imageIndex) => ({ src, messageIndex, imageIndex, date: seoulParts(message.sentAt)?.day ?? message.sentAt.slice(0, 10) })))
  const goToMessage = (index: number) => {
    const container = scrollRef.current
    const target = messageRefs.current[index]
    if (!container || !target) return
    container.scrollTop += target.getBoundingClientRect().top - container.getBoundingClientRect().top - 12
  }
  const goToDate = (date: string) => {
    const index = storyMessages.findIndex(m => (seoulParts(m.sentAt)?.day ?? m.sentAt.slice(0, 10)) === date)
    if (index < 0) { setNavigationNotice('해당 날짜에는 메시지가 없습니다.'); return }
    setNavigationNotice('')
    setDatePickerOpen(false)
    goToMessage(index)
  }
  useLayoutEffect(() => {
    const identity = `${episode.id}:${room.id}`
    if (initializedRoom.current === identity) return
    const container = scrollRef.current
    if (!container) return
    initializedRoom.current = identity
    const targetIndex = -1
    let frame = 0
    let attempts = 0
    let cancelled = false
    const position = () => {
      if (cancelled) return
      const target = targetIndex >= 0 ? messageRefs.current[targetIndex] : null
      if (target) {
        // Offset relative to the scroll container, regardless of nested layout.
        const delta = target.getBoundingClientRect().top - container.getBoundingClientRect().top
        container.scrollTop += delta - 12
      } else if (targetIndex < 0) {
        container.scrollTop = container.scrollHeight
      }
      // Wait for the scrollable area to have a real height before settling.
      attempts++
      if (attempts < 12 && (container.clientHeight === 0 || (target && Math.abs(target.getBoundingClientRect().top - container.getBoundingClientRect().top - 12) > 3))) {
        frame = requestAnimationFrame(position)
      }
    }
    frame = requestAnimationFrame(position)
    return () => { cancelled = true; cancelAnimationFrame(frame); initializedRoom.current = '' }
  }, [episode.id, room.id])
  const previousSentCount = useRef(sent.length)
  const previousReplyCount = useRef(triggeredReplies.length)
  useLayoutEffect(() => {
    const newSent = sent.length > previousSentCount.current
    const newReply = triggeredReplies.length > previousReplyCount.current
    previousSentCount.current = sent.length
    previousReplyCount.current = triggeredReplies.length
    if (!newSent && !newReply) return
    const container = scrollRef.current
    if (!container) return
    container.scrollTop = container.scrollHeight
    const frame = requestAnimationFrame(() => { container.scrollTop = container.scrollHeight })
    return () => cancelAnimationFrame(frame)
  }, [sent.length, triggeredReplies.length])
  let lastDate = ''
  return <section className="relative flex h-full min-h-0 flex-col bg-[#b2c7d9] text-[#222]" style={(room.backgroundImage || room.wallpaper) ? {backgroundImage:`url(${JSON.stringify(room.backgroundImage || room.wallpaper).slice(1,-1)})`,backgroundPosition:'center',backgroundSize:'cover'} : undefined}>
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-black/5 px-3">
      <button onClick={back} aria-label="채팅 목록으로" className="rounded-full p-2 hover:bg-black/10"><ChevronLeft size={23}/></button>
      <div className="min-w-0 flex-1"><h1 className="truncate text-base font-semibold">{roomTitle(room, content.contacts)}</h1><p className="text-[11px] text-[#526475]">{room.type === 'group' ? `${room.memberIds.length + 1}명` : '대화방'}</p></div>
      {room.muted && <BellOff size={17} className="text-[#526475]"/>}
      {episode.id==='ep03' && room.id!==SELF_ROOM_ID && <button type="button" onClick={()=>goToDate('2026-05-11')} className="shrink-0 rounded-full bg-white/45 px-2 py-1 text-[11px] font-semibold" aria-label="5월 11일 대화로 이동">5/11</button>}
      <button type="button" onClick={() => {setSelectedDate(messageDates.at(-1) ?? '2026-05-01'); setDatePickerOpen(true); setNavigationNotice('')}} aria-label="날짜로 이동" className="rounded-full p-2 hover:bg-black/10"><span className="text-xs font-semibold">날짜</span></button>
      <button type="button" onClick={() => setMediaOpen(true)} aria-label="사진 모아보기" className="rounded-full p-2 hover:bg-black/10"><ImageIcon size={18}/></button>
      <button onClick={()=>setConfirmRoomClear(true)} aria-label="이 채팅방에서 내가 보낸 메시지 초기화" className="rounded-full p-2 hover:bg-black/10"><Trash2 size={18}/></button>
      
    </header>
    <div ref={scrollRef} className="relative min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4" style={{overflowAnchor:"none"}}>
      {allMessages.map((msg, index) => {
        const date = seoulParts(msg.sentAt)?.day ?? msg.sentAt.slice(0, 10)
        const showTime = index === allMessages.length - 1 || !sameMinuteRun(msg, allMessages[index + 1])
        const isReaderMessage = readerIds.has(msg.id) || readerReplyIds.has(msg.id)
        const showDate = !isReaderMessage && date !== lastDate
        if (!isReaderMessage) lastDate = date
        const mine = msg.from === 'me'
        const showSender = !mine && (index === 0 || !sameMinuteRun(allMessages[index - 1], msg))
        return <div key={`${room.id}-${msg.id}-${index}`} ref={node => { messageRefs.current[index] = node }}>
          {!isSelfRoom && readerIds.has(msg.id) && <div className="mb-4 flex items-center gap-2" aria-label="여기까지 읽었습니다"><div className="h-px flex-1 bg-[#879bac]/60"/><span className="shrink-0 text-[11px] text-[#536574]">여기까지 읽었습니다</span><div className="h-px flex-1 bg-[#879bac]/60"/></div>}
          {showDate && <div className="mx-auto mb-4 w-fit rounded-full bg-[#879bac]/65 px-3 py-1 text-center text-[11px] text-white">{dateLabel(msg.sentAt)}</div>}
          <div className={`flex items-start gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
            {!mine && <div className="w-[34px] shrink-0">{showSender && <button aria-label={`${contactName(msg.from, content.contacts)} 프로필 보기`} onClick={() => pushRoute(`profile:${msg.from}`)}><Avatar id={msg.from} size={34}/></button>}</div>}
            <div className={`flex min-w-0 max-w-[78%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
              {showSender && <span className="mb-1 text-xs text-[#263645]">{contactName(msg.from, content.contacts)}</span>}
              <div className={`flex max-w-full items-end gap-1 ${mine ? 'flex-row-reverse' : ''}`}>
                <div role="button" tabIndex={0} aria-label="이 메시지에 답장" onClick={() => setReplyTarget(msg)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setReplyTarget(msg) } }} className={`min-w-0 cursor-pointer text-[13px] leading-relaxed ${((msg as GiftMessage).type === 'gift' || (messageImages(msg).length > 0 && !msg.text && !msg.emoticon && !msg.deleted)) ? 'overflow-hidden rounded-xl' : `rounded-xl px-3 py-2 shadow-sm ${mine ? 'bg-[#fee500]' : 'bg-white'}`}`}>{replyInfo(msg) && <div className="mb-2 border-l-2 border-[#7b8e9f] pl-2 text-[11px]"><div className="font-semibold">{contactName(replyInfo(msg)!.from, content.contacts)}에게 답장</div><div className="max-w-48 truncate opacity-70">{replyInfo(msg)!.text}</div></div>}<MessageBody message={msg} onImage={openPreview}/></div>
                <div className="shrink-0 pb-0.5 text-[9px] text-[#536574]">{typeof msg.unreadCount === 'number' && msg.unreadCount > 0 && <span className="block text-right font-bold text-[#8a5b00]">{msg.unreadCount}</span>}{showTime && timeLabel(msg.sentAt)}</div>
              </div>
            </div>
          </div>
        </div>
      })}
      <div ref={bottomRef}/>
    </div>
    {replyTarget && <div className="flex shrink-0 items-center gap-3 border-t border-black/10 bg-[#f8f8f8] px-4 py-2"><div className="min-w-0 flex-1 border-l-[3px] border-[#fee500] pl-3"><p className="text-xs font-semibold">{contactName(replyTarget.from, content.contacts)}에게 답장</p><p className="truncate text-xs text-zinc-500">{replyTarget.text || (messageImages(replyTarget).length ? '사진' : replyTarget.emoticon || '메시지')}</p></div><button type="button" onClick={() => setReplyTarget(null)} aria-label="답장 취소" className="rounded-full p-1 text-zinc-500"><X size={18}/></button></div>}
    <form onSubmit={e => {e.preventDefault();send()}} className="flex shrink-0 items-end gap-2 border-t border-black/5 bg-[#f8f8f8] px-3 py-2">
      <textarea aria-label="메시지 입력" rows={1} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send()}}} placeholder="메시지 입력" className="max-h-28 min-h-10 min-w-0 flex-1 resize-none overflow-y-auto rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none"/>
      <button type="submit" disabled={!draft.trim()} aria-label="메시지 전송" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fee500] disabled:opacity-40"><Send size={18}/></button>
    </form>
    {datePickerOpen && <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 p-5" role="dialog" aria-modal="true" aria-label="메시지 날짜 이동"><div className="w-full rounded-2xl bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><strong>날짜로 이동</strong><button onClick={() => setDatePickerOpen(false)} aria-label="닫기"><X size={20}/></button></div><input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full rounded-lg border border-zinc-300 p-3"/><p className="mt-2 text-xs text-zinc-500">대화 날짜: {messageDates.length ? `${messageDates[0]} ~ ${messageDates.at(-1)}` : '없음'}</p>{navigationNotice && <p className="mt-2 text-sm text-red-600">{navigationNotice}</p>}<button onClick={() => goToDate(selectedDate)} className="mt-4 w-full rounded-xl bg-[#fee500] p-3 text-sm font-semibold">이동</button></div></div>}
    {mediaOpen && <div className="absolute inset-0 z-40 flex flex-col bg-[#f7f7f7]" role="dialog" aria-label="채팅방 사진 모아보기"><header className="flex h-14 shrink-0 items-center gap-3 bg-white px-4"><button onClick={() => setMediaOpen(false)} aria-label="사진 목록 닫기"><ChevronLeft size={22}/></button><strong>사진 모아보기 ({media.length})</strong></header><div className="min-h-0 flex-1 overflow-y-auto p-3">{media.length === 0 ? <p className="py-12 text-center text-sm text-zinc-500">주고받은 사진이 없습니다.</p> : <div className="grid grid-cols-3 gap-2">{media.map((item, i) => <div key={`${item.messageIndex}-${item.imageIndex}`} className="min-w-0"><button type="button" onClick={() => openPreview(media.map(x => x.src), i)} className="aspect-square w-full overflow-hidden rounded-lg bg-zinc-200"><img src={item.src} alt={`${item.date} 사진`} className="h-full w-full object-cover"/></button><p className="mt-1 text-center text-[10px] text-zinc-500">{item.date.slice(5)}</p><button type="button" onClick={() => {setMediaOpen(false); requestAnimationFrame(() => goToMessage(item.messageIndex))}} className="w-full py-1 text-[10px] text-blue-600">대화로 이동</button></div>)}</div>}</div></div>}
    {confirmRoomClear && <div role="dialog" aria-modal="true" aria-label="현재 채팅방 메시지 초기화" className="absolute inset-0 z-[60] flex items-center justify-center bg-black/45 p-5"><div className="w-full rounded-2xl bg-white p-5 shadow-xl"><h2 className="font-semibold">내가 보낸 메시지 초기화</h2><p className="mt-2 text-sm text-zinc-600">이 채팅방에서 직접 보낸 메시지와 기록을 초기화할까요? 원본 대화는 유지됩니다.</p><div className="mt-5 flex justify-end gap-3"><button onClick={()=>setConfirmRoomClear(false)} className="rounded-lg px-3 py-2 text-sm">취소</button><button onClick={clearSentInRoom} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white">초기화</button></div></div></div>}
    {preview && <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-3 text-white" role="dialog" aria-modal="true" aria-label="사진 확대" onTouchStart={e => { previewStart.current = e.touches[0]?.clientX ?? null }} onTouchEnd={e => { if (previewStart.current === null) return; const delta = (e.changedTouches[0]?.clientX ?? previewStart.current) - previewStart.current; if (Math.abs(delta) > 45) stepPreview(delta < 0 ? 1 : -1); previewStart.current = null }}>
      <button onClick={() => setPreview(null)} className="absolute right-4 top-4 z-10 rounded-full bg-white/20 p-2" aria-label="사진 닫기"><X/></button>
      <img src={preview.images[preview.index]} alt={`확대된 대화 사진 ${preview.index + 1}`} className="max-h-[78%] max-w-full object-contain"/>
      {preview.images.length > 1 && <><button onClick={() => stepPreview(-1)} disabled={preview.index === 0} className="absolute left-2 top-1/2 rounded-full bg-white/20 p-2 disabled:cursor-not-allowed disabled:opacity-30" aria-label="이전 사진"><ChevronLeft/></button><button onClick={() => stepPreview(1)} disabled={preview.index === preview.images.length - 1} className="absolute right-2 top-1/2 rounded-full bg-white/20 p-2 disabled:cursor-not-allowed disabled:opacity-30" aria-label="다음 사진"><ChevronRight/></button><span className="absolute bottom-8 text-sm">{preview.index + 1} / {preview.images.length}</span></>}
    </div>}
  </section>
}
// 카카오톡의 읽지 않은 메시지는 방별 unreadCount를 합산하고, 읽음 상태는 에피소드별로 저장합니다.
function useKakaoUnread() {
  const { content, episode } = useEpisode()
  const {executions,deliveredIds,notificationReadIds,notificationDismissedIds,markEventNotificationRead}=usePhoneEvents()
  const unreadEvents=eventNotifications(executions,deliveredIds).filter(n=>n.appId==='kakao'&&!notificationReadIds.includes(n.id)&&!notificationDismissedIds.includes(n.id))
  const key = `virtual-phone:kakao-read:v1:${episode.id}`
  const [readIds, setReadIds] = useState<string[]>([])
  useEffect(() => {
    const sync = () => {
      try {
        const saved: unknown = JSON.parse(localStorage.getItem(key) || '[]')
        setReadIds(Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [])
      } catch { setReadIds([]) }
    }
    sync()
    window.addEventListener('phone:kakao-read', sync)
    return () => window.removeEventListener('phone:kakao-read', sync)
  }, [key])
  const unreadForRoom = (room: KakaoRoom) => (readIds.includes(room.id) ? 0 : Math.max(0, room.unreadCount ?? 0)) + unreadEvents.filter(n=>n.targetId===room.id).length
  const unreadCount = content.kakaoRooms.reduce((sum, room) => sum + unreadForRoom(room), 0)
  const markRead = (roomId: string) => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(key) || '[]')
      const ids = Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : []
      if (!ids.includes(roomId)) localStorage.setItem(key, JSON.stringify([...ids, roomId]))
    } catch { /* 저장이 막힌 브라우저에서도 현재 화면의 읽음 상태는 유지 */ }
    unreadEvents.filter(n=>n.targetId===roomId).forEach(n=>markEventNotificationRead(n.id))
    setReadIds(ids => ids.includes(roomId) ? ids : [...ids, roomId])
    window.dispatchEvent(new Event('phone:kakao-read'))
  }
  return { unreadCount, unreadForRoom, markRead }
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
  const { resetKakaoEvents } = usePhoneEvents()
  const clearEpisodeSent = () => {
    resetKakaoEvents()
    const prefix = `virtual-phone:kakao-sent:v1:${episode.id}:`
    try { for (const room of KAKO_ROOMS_FOR_CLEAR) localStorage.removeItem(`${prefix}${room.id}`) } catch {}
    window.dispatchEvent(new Event('phone:kakao-sent-cleared'))
    setConfirmClearAll(false)
  }
  const KAKO_ROOMS_FOR_CLEAR = KAKAO_ROOMS
  const [query,setQuery] = useState('')
  const { unreadForRoom, markRead } = useKakaoUnread()
  const {executions:listExecutions,deliveredIds:listDelivered,replyDeliveryIds:listReplyDelivered}=usePhoneEvents()
  const [readerSent,setReaderSent]=useState<Record<string,KakaoMessage[]>>({})
  useEffect(()=>{
    const sync=()=>{
      const next:Record<string,KakaoMessage[]>={}
      for(const room of KAKAO_ROOMS){
        try{const data:unknown=JSON.parse(localStorage.getItem(`virtual-phone:kakao-sent:v1:${episode.id}:${room.id}`)??'[]');next[room.id]=Array.isArray(data)?data.filter((m):m is KakaoMessage=>Boolean(m&&typeof m==='object'&&typeof m.id==='string'&&typeof m.sentAt==='string')):[]}catch{next[room.id]=[]}
      }
      setReaderSent(next)
    }
    sync();window.addEventListener('phone:kakao-sent-updated',sync);window.addEventListener('phone:kakao-sent-cleared',sync)
    return()=>{window.removeEventListener('phone:kakao-sent-updated',sync);window.removeEventListener('phone:kakao-sent-cleared',sync)}
  },[episode.id,KAKAO_ROOMS])
  const lastForRoom=(room:KakaoRoom):KakaoMessage|undefined=>{
    const replies=listExecutions.flatMap(execution=>execution.actions.flatMap((action,index)=>action.type==='kakao.reply'&&action.roomId===room.id&&(listReplyDelivered.includes(`${execution.id}:${index}`)||listDelivered.includes(execution.id))?[{id:`event-reply:${execution.id}:${index}`,from:action.from,text:action.text||'',...('image' in action&&typeof action.image==='string'?{image:action.image}:{}),sentAt:execution.executedAt} as KakaoMessage]:[]))
    return room.id === SELF_ROOM_ID ? ((readerSent[room.id]??[]).at(-1) ?? room.messages.at(-1)) : [...room.messages,...(readerSent[room.id]??[]),...replies].sort((a,b)=>a.sentAt.localeCompare(b.sentAt)).at(-1)
  }
  const rooms = [...KAKAO_ROOMS].sort((a,b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || (lastForRoom(b)?.sentAt ?? '').localeCompare(lastForRoom(a)?.sentAt ?? ''))
  const filtered = rooms.filter(room => `${roomTitle(room, content.contacts)} ${room.messages.map(m=>m.text||'').join(' ')}`.toLowerCase().includes(query.toLowerCase()))
  return <section className="relative flex h-full min-h-0 flex-col bg-white text-[#202020]">
    <header className="flex h-14 shrink-0 items-center justify-between px-5"><h1 className="text-[22px] font-bold">채팅</h1><div className="ml-auto"><button onClick={()=>setSettingsOpen(v=>!v)} aria-label="카카오톡 설정" className="rounded-full p-2 hover:bg-zinc-100"><Settings size={20}/></button></div></header>
    <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2"><Search size={16} className="text-zinc-500"/><input aria-label="채팅방 검색" value={query} onChange={e=>setQuery(e.target.value)} placeholder="대화방·메시지 검색" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></div>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {rooms.length === 0 && <p className="p-8 text-center text-sm text-zinc-500">아직 대화방이 없습니다.</p>}
      {filtered.length===0 && <p className="p-6 text-center text-sm text-zinc-500">검색 결과가 없어요.</p>}
      {filtered.map(room => {
        const last = lastForRoom(room)
        return <button key={room.id} onClick={() => {if (!canOpenKakaoRoom(room)) return; markRead(room.id);pushRoute(`room:${room.id}`)}} disabled={!canOpenKakaoRoom(room)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 focus-visible:bg-zinc-100">
          <Avatar id={room.memberIds[0] ?? 'me'} group={room.type === 'group'} size={52}/>
          <div className="min-w-0 flex-1"><div className="flex items-center gap-1"><span className="truncate text-[15px] font-semibold">{roomTitle(room, content.contacts)}</span>{room.type === 'group' && <span className="text-xs text-zinc-400">{room.memberIds.length + 1}</span>}{room.pinned && <Pin size={12} className="text-zinc-400"/>}{room.muted && <BellOff size={12} className="text-zinc-400"/>}</div><p className="mt-1 truncate text-[13px] text-zinc-500">{(last as GiftMessage | undefined)?.type === 'gift' ? '선물메시지' : (last && messageImages(last).length > 0 ? '사진' : (last?.text || last?.emoticon || '대화 내용 없음'))}</p></div>
          <div className="flex shrink-0 flex-col items-end gap-1"><span className="text-[10px] text-zinc-400">{last ? roomListDateLabel(last.sentAt) : ''}</span>{unreadForRoom(room) > 0 && <span className="flex min-w-5 items-center justify-center rounded-full bg-[#f05c53] px-1.5 py-0.5 text-[10px] text-white">{unreadForRoom(room)}</span>}</div>
        </button>
      })}
    </div>
    {settingsOpen && <div className="absolute inset-0 z-40 flex flex-col bg-white"><header className="flex h-14 items-center gap-3 border-b px-4"><button onClick={()=>setSettingsOpen(false)} aria-label="설정 닫기"><ChevronLeft size={23}/></button><h2 className="font-semibold">카카오톡 설정</h2></header><button onClick={()=>setConfirmClearAll(true)} className="flex items-center gap-2 border-b px-5 py-4 text-left text-sm"><Trash2 size={18}/>내가 보낸 메시지 초기화 <span className="ml-auto text-xs text-zinc-500">현재 에피소드</span></button><p className="px-5 py-3 text-xs text-zinc-500">작품에 등록된 원본 대화는 삭제되지 않습니다.</p></div>}
    {confirmClearAll && <div role="dialog" aria-modal="true" className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-5"><div className="w-full rounded-2xl bg-white p-5 shadow-xl"><h2 className="font-semibold">내가 보낸 메시지 초기화</h2><p className="mt-2 text-sm text-zinc-600">현재 에피소드에서 직접 보낸 메시지와 카카오톡 기록을 초기화할까요? 원본 대화는 유지됩니다.</p><div className="mt-5 flex justify-end gap-3"><button onClick={()=>setConfirmClearAll(false)} className="rounded-lg px-3 py-2 text-sm">취소</button><button onClick={clearEpisodeSent} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white">초기화</button></div></div></div>}
    <KakaoTabs active="chats" onFriends={() => pushRoute("friends")} onChats={() => {}} />
  </section>
}

function KakaoTabs({ active, onFriends, onChats }: { active: 'friends' | 'chats'; onFriends: () => void; onChats: () => void }) {
  const { unreadCount } = useKakaoUnread()
  const iconClass = (selected: boolean) => selected ? 'text-[#30363c]' : 'text-[#afb2b6]'
  return <nav aria-label="카카오톡 메뉴" className="flex h-[62px] shrink-0 items-center justify-around border-t border-zinc-100 bg-white px-1">
    <button onClick={onFriends} aria-label="친구" aria-current={active === 'friends' ? 'page' : undefined} className={`flex h-full flex-1 items-center justify-center ${iconClass(active === 'friends')}`}><UserRound size={27} fill={active === 'friends' ? 'currentColor' : 'none'} strokeWidth={1.8}/></button>
    <button onClick={onChats} aria-label="채팅" aria-current={active === 'chats' ? 'page' : undefined} className={`relative flex h-full flex-1 items-center justify-center ${iconClass(active === 'chats')}`}><MessageCircle size={28} fill={active === 'chats' ? 'currentColor' : 'none'} strokeWidth={1.8}/>{unreadCount > 0 && <span className="absolute left-[55%] top-1 min-w-[19px] rounded-full bg-[#ff4d3b] px-[5px] py-[1px] text-center text-[10px] leading-4 text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}</button>
    <button disabled aria-label="오픈채팅 (비활성화)" className="relative flex h-full flex-1 cursor-default items-center justify-center text-[#afb2b6]"><CirclePlay size={29} strokeWidth={2.2}/></button>
    <button disabled aria-label="쇼핑 (비활성화)" className="flex h-full flex-1 cursor-default items-center justify-center text-[#afb2b6]"><ShoppingBag size={27} strokeWidth={2.4}/></button>
    <button disabled aria-label="더보기 (비활성화)" className="relative flex h-full flex-1 cursor-default items-center justify-center text-[#afb2b6]"><Ellipsis size={31} strokeWidth={3}/><span className="absolute right-[30%] top-2 h-2 w-2 rounded-full bg-[#ff4d3b]"/></button>
  </nav>
}

function FriendList() {
  const { content } = useEpisode()
  const KAKAO_PROFILES = content.kakaoProfiles
  const { pushRoute, back } = usePhone()
  const friends = content.contacts.filter(c => c.id !== USER_CONTACT_ID && c.id !== 'me')
  const favorites = friends.filter(c => c.favorite)
  const others = friends.filter(c => !c.favorite).sort((a,b) => a.name.localeCompare(b.name,'ko'))
  const [showFavorites,setShowFavorites] = useState(true)
  const [showFriends,setShowFriends] = useState(true)
  const [friendSearch,setFriendSearch] = useState(false)
  const [query,setQuery] = useState('')
  const [settingsOpen,setSettingsOpen] = useState(false)
  const matches = (id:string) => contactName(id,content.contacts).toLowerCase().includes(query.toLowerCase())
  const profileRow = (id: string, own = false) => <button key={id} onClick={() => pushRoute(`profile:${id}`)} className="flex w-full items-center gap-3 px-5 py-2.5 text-left hover:bg-zinc-50 focus-visible:bg-zinc-100">
    <Avatar id={id} size={own ? 53 : 49}/>
    <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-medium">{contactName(id, content.contacts)}</span><span className="mt-0.5 block truncate text-[12px] text-zinc-400">{KAKAO_PROFILES.find(p => p.contactId === id)?.statusMessage ?? (id === 'me' ? CHARACTER.owner.statusMessage : '')}</span></span>
  </button>
  return <section className="relative flex h-full min-h-0 flex-col bg-white text-[#202020]">
    <header className="flex h-[62px] shrink-0 items-center gap-3 px-5">
      <button onClick={() => pushRoute('profile:me')} aria-label="내 프로필"><Avatar id="me" size={38}/></button>
      <button onClick={() => pushRoute('profile:me')} className="min-w-0 flex-1 truncate text-left text-[20px] font-bold">{CHARACTER.owner.name}</button>
      <button onClick={() => setFriendSearch(v=>!v)} aria-label="친구 검색" className="p-1"><Search size={25}/></button>
      <button disabled aria-label="친구 추가 (비활성화)" className="cursor-default p-1"><UserRoundPlus size={25}/></button>
      <button disabled aria-label="선물하기 (비활성화)" className="cursor-default p-1"><Gift size={24}/></button>
      <button onClick={() => setSettingsOpen(v=>!v)} aria-label="카카오톡 설정" className="p-1"><Settings size={25}/></button>
    </header>
    {friendSearch && <div className="mx-5 mb-2 flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2"><Search size={16}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="친구 검색" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/><button onClick={()=>{setFriendSearch(false);setQuery('')}} aria-label="검색 닫기"><X size={17}/></button></div>}
    <div className="flex shrink-0 gap-2 px-5 pb-4 pt-1"><span className="rounded-full bg-[#1b1b1b] px-5 py-2 text-sm font-semibold text-white">친구</span><span className="rounded-full bg-[#f4f4f4] px-5 py-2 text-sm text-[#777]">소식</span></div>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="mx-5 mb-5 flex h-[90px] items-center justify-between rounded-[17px] bg-[#f4f4f4] px-5"><div><p className="text-[10px] font-bold tracking-widest text-[#555]">KAKAO FRIENDS</p><p className="mt-2 text-[15px] font-bold">친구에게 마음 전하기</p><p className="text-[11px] text-zinc-500">소중한 순간을 선물해요</p></div><Gift size={43} className="text-[#c7b3a3]" strokeWidth={1.3}/></div>
      <div className="border-t border-zinc-100 pt-2">
        <button onClick={()=>setShowFavorites(v=>!v)} className="flex w-full items-center justify-between px-5 py-3 text-left text-[13px] font-medium">즐겨찾는 친구 {favorites.length}{showFavorites?<ChevronUp size={18} className="text-zinc-400"/>:<ChevronDown size={18} className="text-zinc-400"/>}</button>
        {showFavorites && favorites.filter(c=>matches(c.id)).map(c=>profileRow(c.id))}
      </div>
      <div className="border-t border-zinc-100 pt-2">
        <div className="flex w-full items-center justify-between px-5 py-3"><button onClick={()=>setShowFriends(v=>!v)} className="flex flex-1 items-center justify-between text-left text-[13px] font-medium">친구 {others.length}{showFriends?<ChevronUp size={18} className="text-zinc-400"/>:<ChevronDown size={18} className="text-zinc-400"/>}</button></div>
        {showFriends && others.filter(c=>matches(c.id)).map(c=>profileRow(c.id))}
      </div>
    </div>
    {settingsOpen && <div className="absolute right-4 top-14 z-40 w-48 rounded-2xl bg-white py-2 shadow-xl ring-1 ring-black/5"><button onClick={()=>{setSettingsOpen(false);pushRoute('multi-profiles')}} className="w-full px-5 py-4 text-left text-sm">멀티프로필</button></div>}
    <KakaoTabs active="friends" onFriends={() => {}} onChats={() => back()}/>
  </section>
}

function ProfileDetail({ contactId }: { contactId: string }) {
  const { content } = useEpisode()
  const { back, pushRoute } = usePhone()
  const {profiles}=useKakaoProfileFeatures()
  const [zoom,setZoom]=useState(false)
  const multi=contactId.startsWith('multi:')?profiles.find(p=>p.id===contactId.slice(6)):undefined
  const isMulti=Boolean(multi)
  const profile=content.kakaoProfiles.find(p=>p.contactId===contactId||(contactId==='me'&&p.contactId===USER_CONTACT_ID))
  const contact=content.contacts.find(c=>c.id===contactId)
  const bg=isMulti?multi?.backgroundImage:profile?.backgroundImage
  const avatar=isMulti?(multi?.avatar||content.kakaoAvatars.me):content.kakaoAvatars[contactId]
  const name=isMulti?multi!.name:contactName(contactId,content.contacts)
  const status=isMulti?multi?.statusMessage:(profile?.statusMessage??(contactId==='me'?CHARACTER.owner.statusMessage:''))
  const directRoom=content.kakaoRooms.find(r=>r.type==='direct'&&r.memberIds.includes(contactId))
  return <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#7f8b97] text-white">
    {bg&&<img src={bg} alt="프로필 배경" className="absolute inset-0 h-full w-full object-cover"/>}
    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"/>
    <header className="relative z-10 flex h-16 shrink-0 items-center justify-between px-4"><button onClick={back} aria-label="이전 화면" className="rounded-full bg-black/25 p-2"><ChevronLeft size={24}/></button></header>
    <div className="relative z-10 mt-auto flex flex-col items-center px-6 pb-8">
      <button onClick={()=>avatar&&setZoom(true)} className="overflow-hidden rounded-[38%]">{isMulti ? (multi?.avatar ? <img src={multi.avatar} alt="멀티프로필 사진" className="h-24 w-24 object-cover" onError={e => { e.currentTarget.style.display='none' }}/> : <span className="flex h-24 w-24 items-center justify-center bg-[#a7d9fa]"><UserRound size={52}/></span>) : <Avatar id={contactId} size={96}/>}</button>
      <h2 className="mt-4 text-xl font-semibold">{name}</h2><p className="mt-1 min-h-5 text-center text-sm text-white/90">{status}</p>
      {isMulti&&<button onClick={()=>pushRoute('multi-profiles')} className="mt-5 w-full rounded-xl border border-white/50 bg-white/15 py-3 text-sm">친구 관리 · 멀티프로필 편집</button>}
      {!isMulti&&contactId==='me'&&content.kakaoRooms.some(r=>r.id===SELF_ROOM_ID)&&<button type="button" onClick={()=>pushRoute(`room:${SELF_ROOM_ID}`)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/50 bg-white/15 py-3 text-sm font-medium"><MessageCircle size={18}/>나와의 채팅</button>}
      {!isMulti&&contactId!=='me'&&directRoom&&canOpenKakaoRoom(directRoom)&&<button onClick={()=>pushRoute(`room:${directRoom.id}`)} className="mt-5 rounded-full border border-white/50 bg-white/15 px-6 py-2 text-sm">1:1 채팅</button>}
    </div>
    {zoom&&avatar&&<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 p-5"><button onClick={()=>setZoom(false)} className="absolute right-4 top-4"><X/></button><img src={avatar} alt="프로필 사진 확대" className="max-h-[80%] max-w-full object-contain"/></div>}
  </section>
}

function MultiProfilesScreen() {
  const {content}=useEpisode()
  const {back,pushRoute}=usePhone()
  return <MultiProfileManager onClose={back} contacts={content.contacts} avatarOf={id=>content.kakaoAvatars[id]} onPreview={id=>pushRoute(`profile:multi:${id}`)}/>
}

export function KakaoApp() {
  const { content } = useEpisode()
  const KAKAO_ROOMS = content.kakaoRooms
  const KAKAO_PROFILES = content.kakaoProfiles
  const CONTACTS = content.contacts
  const { currentRoute, back } = usePhone()
  useEpisodeProgress('messages', currentRoute?.startsWith('room:') ? currentRoute.slice(5) : null)
  const { markTargetRead } = useNotifications()
  const {executions:roomExecutions,deliveredIds:roomDelivered,notificationReadIds:roomRead,notificationDismissedIds:roomDismissed,markEventNotificationRead:markRoomEventRead}=usePhoneEvents()
  useEffect(()=>{if(currentRoute?.startsWith('room:')){const id=currentRoute.slice(5);markTargetRead('kakao',id);eventNotifications(roomExecutions,roomDelivered).filter(n=>n.appId==='kakao'&&n.targetId===id&&!roomRead.includes(n.id)&&!roomDismissed.includes(n.id)).forEach(n=>markRoomEventRead(n.id))}},[currentRoute,roomExecutions,roomDelivered])
  if (currentRoute === 'multi-profiles') return <MultiProfilesScreen/>
  if (currentRoute?.startsWith('profile:')) return <ProfileDetail contactId={currentRoute.slice(8)}/>
  if (currentRoute === 'friends') return <FriendList/>
  if (currentRoute?.startsWith('room:')) {
    const room = KAKAO_ROOMS.find(r => r.id === currentRoute.slice(5))
    if (room && canOpenKakaoRoom(room)) return <RoomView room={room}/>
    return <div className="flex h-full flex-col items-center justify-center gap-3 bg-white text-zinc-700"><p>대화방을 찾을 수 없습니다.</p><button onClick={back} className="rounded bg-zinc-200 px-4 py-2">채팅 목록으로</button></div>
  }
  return <RoomList/>
}
