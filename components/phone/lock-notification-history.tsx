'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { useEpisode } from './episode-provider'
import { usePhone } from './phone-provider'
import { usePhoneEvents, eventNotifications } from './event-provider'
import { AppIconTile } from './app-icon'
import { getStoryNotifications } from '@/content/notifications'
import type { HistoryNotification } from '@/content/notifications/types'

const STORAGE = 'virtual-phone:lock-history:v1:'
type Saved = { readIds: string[]; dismissedIds: string[] }
const timeLabel = (value: string) => {
  const date = value.slice(0,16).replace('T',' ')
  return date.length >= 16 ? `${date.slice(5,10).replace('-','/')} ${date.slice(11)}` : value
}

export function LockNotificationHistory({ onClose }: {onClose:()=>void}) {
  const {episode,content} = useEpisode()
  const phone = usePhone()
  const {executions,deliveredIds} = usePhoneEvents()
  const [saved,setSaved] = useState<Saved>({readIds:[],dismissedIds:[]})
  const [ready,setReady] = useState(false)
  const gesture = useRef<{x:number;y:number}|null>(null)
  const storageKey = `${STORAGE}${episode.id}`
  useEffect(()=>{
    setReady(false)
    try {
      const data=JSON.parse(localStorage.getItem(storageKey)||'{}')
      setSaved({readIds:Array.isArray(data.readIds)?data.readIds:[],dismissedIds:Array.isArray(data.dismissedIds)?data.dismissedIds:[]})
    } catch {setSaved({readIds:[],dismissedIds:[]})}
    setReady(true)
  },[storageKey])
  useEffect(()=>{
    if(!ready)return
    try {localStorage.setItem(storageKey,JSON.stringify(saved))}catch{}
  },[saved,storageKey,ready])

  const items=useMemo(()=>{
    const result: HistoryNotification[]=[...getStoryNotifications(episode.id)]
    const add=(item:HistoryNotification)=>{if(!result.some(n=>n.id===item.id))result.push(item)}
    // Only the selected episode's date range is generated. Earlier episode
    // records remain available in their original apps, not duplicated here.
    const start=episode.id==='ep03'?'2026-05-11':episode.id==='ep02'?'2026-05-01':'2026-04-01'
    const end=episode.id==='ep03'?'2026-05-18':episode.id==='ep02'?'2026-05-11':'2026-05-01'
    const within=(date:string)=>date>=start&&date<end
    for(const room of content.kakaoRooms){
      if(room.id==='kakao-self')continue
      for(const m of room.messages??[]){
        if(m.from==='me'||!m.sentAt||!within(m.sentAt))continue
        add({id:`auto-kakao-${m.id}`,occurredAt:m.sentAt,appId:'kakao',title:room.id==='kakao-user'?'선우':room.title||'카카오톡',body:m.text||'사진',type:'kakao',targetId:room.id})
      }
    }
    for(const call of content.calls){
      if(call.type!=='missed'||!within(call.calledAt)||!('checked' in call)||call.checked!==false)continue
      const contact=content.contacts.find(c=>c.id===(call.contactId==='user'?'sunwoo':call.contactId))
      add({id:`auto-call-${call.id}`,occurredAt:call.calledAt,appId:'phone',title:contact?.name||call.unknownNumber||'부재중 전화',body:'부재중 전화',type:'missed-call'})
    }
    for(const thread of content.smsThreads){
      for(const m of thread.messages??[]){
        if(m.from==='me'||!within(m.sentAt))continue
        const contact=content.contacts.find(c=>c.id===(thread.contactId==='user'?'sunwoo':thread.contactId))
        add({id:`auto-sms-${m.id}`,occurredAt:m.sentAt,appId:'messages',title:contact?.name||thread.unknownNumber||'문자 메시지',body:m.text||'새 메시지',type:'sms',targetId:thread.id})
      }
    }
    for(const n of eventNotifications(executions,deliveredIds)){
      const execution=executions.find(e=>n.id.startsWith(`event:${e.id}:`))
      const occurredAt=execution?.executedAt
      if(!occurredAt)continue
      add({id:`auto-${n.id}`,occurredAt,appId:n.appId,title:n.title,body:n.body,type:'event',targetId:n.targetId})
    }
    return result.filter(n=>!saved.dismissedIds.includes(n.id)).sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt))
  },[episode.id,content,executions,deliveredIds,saved.dismissedIds])

  const openItem=(n:HistoryNotification)=>{
    setSaved(s=>({...s,readIds:[...new Set([...s.readIds,n.id])]}))
    if(n.appId==='kakao'&&n.targetId){
      onClose();phone.unlock();phone.openApp('kakao');phone.pushRoute(`room:${n.targetId}`);return
    }
    if(n.appId==='instagram'&&n.targetId){
      onClose();phone.unlock();phone.openApp('instagram')
      sessionStorage.setItem('phone:pending-instagram-dm',n.targetId)
      window.dispatchEvent(new CustomEvent('phone:open-instagram-dm',{detail:n.targetId}))
      return
    }
    onClose();phone.unlock();phone.openApp(n.appId)
  }
  const start=(x:number,y:number)=>{gesture.current={x,y}}
  const end=(x:number,y:number)=>{
    if(gesture.current&&y-gesture.current.y>65&&Math.abs(x-gesture.current.x)<100)onClose()
    gesture.current=null
  }
  return <section
    role="dialog" aria-label="잠금화면 알림 기록"
    className="absolute inset-0 z-30 flex flex-col bg-[#e7e7e7]/75 text-[#232323] backdrop-blur-2xl"
    onTouchStart={e=>{const t=e.touches[0];if(t)start(t.clientX,t.clientY)}}
    onTouchEnd={e=>{const t=e.changedTouches[0];if(t)end(t.clientX,t.clientY)}}
    onMouseDown={e=>start(e.clientX,e.clientY)}
    onMouseUp={e=>end(e.clientX,e.clientY)}
  >
    <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-5">
      <span className="text-sm font-semibold">알림 기록</span>
      <button type="button" onClick={onClose} aria-label="잠금화면으로 돌아가기" className="rounded-full bg-white/50 p-2"><X size={19}/></button>
    </div>
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 pb-5 touch-pan-y">
      {items.map(n=><button key={n.id} type="button" onClick={()=>openItem(n)}
        className={`flex w-full items-start gap-3 rounded-[24px] bg-white/75 px-4 py-3 text-left shadow-sm transition-colors active:bg-white ${saved.readIds.includes(n.id)||n.read?'opacity-80':''}`}>
        <span className="mt-1 shrink-0"><AppIconTile appId={n.appId} className="w-8"/></span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2"><strong className="truncate text-[14px]">{n.title}</strong><span className="shrink-0 text-[11px] text-zinc-500">{timeLabel(n.occurredAt)}</span></span>
          <span className="mt-1 line-clamp-3 whitespace-pre-line text-[13px] leading-5 text-zinc-700">{n.body}</span>
        </span>
      </button>)}
      {items.length===0&&<p className="pt-20 text-center text-sm text-zinc-600">알림 기록이 없습니다.</p>}
    </div>
    <div className="flex shrink-0 items-center justify-between px-6 pb-8 pt-2">
      <button type="button" onClick={()=>setSaved(s=>({...s,dismissedIds:[...new Set([...s.dismissedIds,...items.map(n=>n.id)])]}))} className="rounded-full bg-white/35 px-4 py-2 text-sm">모두 지우기</button>
      <button type="button" onClick={onClose} aria-label="알림 기록 닫기" className="flex items-center gap-1 rounded-full bg-white/35 px-4 py-2 text-sm"><ChevronDown size={18}/> 닫기</button>
    </div>
  </section>
}
