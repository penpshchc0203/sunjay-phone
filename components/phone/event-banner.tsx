'use client'
import { Phone, PhoneOff, MessageCircle, MessageSquare } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { usePhone } from './phone-provider'
import { useNotifications } from './notification-provider'
import { usePhoneEvents } from './event-provider'
import { useEpisode } from './episode-provider'
import { CallExperience } from './call-experience'
import { getCallDialogues } from '@/content/calls/dialogues'
export function EventBanner(){
 const {banner,dismissBanner,activeCall,acceptCall,rejectCall,finishCall}=usePhoneEvents()
 const {episode,content}=useEpisode()
 const {openApp,pushRoute}=usePhone()
 const {markTargetRead}=useNotifications()
 const touchStart=useRef<{x:number;y:number}|null>(null)
 const swiped=useRef(false)
 const notification=banner?.actions.find(a=>a.type==='notification')
 const isNotification=notification?.type==='notification' && !banner?.actions.some(a=>a.type==='phone.incoming')
 useEffect(()=>{
  if(!banner || !isNotification)return
  const timer=window.setTimeout(dismissBanner,2000)
  return ()=>window.clearTimeout(timer)
 },[banner?.id,isNotification])
 const openBannerNotification=()=>{
  if(swiped.current){swiped.current=false;return}
  if(!notification || notification.type!=='notification')return
  dismissBanner()
  markTargetRead(notification.appId,notification.targetId??'')
  openApp(notification.appId)
  if(notification.appId==='kakao' && notification.targetId)pushRoute(`room:${notification.targetId}`)
  if(notification.appId==='instagram' && notification.targetId){
   sessionStorage.setItem('phone:pending-instagram-dm',notification.targetId)
   window.dispatchEvent(new CustomEvent('phone:open-instagram-dm',{detail:notification.targetId}))
  }
 }
 const dismissBySwipe=(x:number,y:number)=>{
  if(!touchStart.current)return
  const dx=x-touchStart.current.x,dy=y-touchStart.current.y
  touchStart.current=null
  if(Math.abs(dx)>45 || dy < -45){swiped.current=true;dismissBanner()}
 }
 if(activeCall){
  const dialogue=getCallDialogues(episode.id).find(d=>d.id===activeCall.dialogueId)
  const contact=content.contacts?.find(c=>c.id===activeCall.contactId)
  return dialogue?<CallExperience name={activeCall.displayName} avatar={contact?.avatar} number={contact?.phoneNumber} dialogue={dialogue} onClose={finishCall}/>:null
 }
 if(!banner)return null
 const incoming=banner.actions.find(a=>a.type==='phone.incoming')
 if(!incoming&&!notification)return null
 if(incoming?.type==='phone.incoming'){
  const contact=content.contacts?.find(c=>c.id===incoming.contactId)
  if(banner.eventId==='entry-call-ep02')return <div className="absolute inset-0 z-[100] flex flex-col items-center bg-gradient-to-b from-[#171622] via-[#39354b] to-[#777c8c] text-white" role="dialog" aria-modal="true" aria-label="선우에게 걸려온 전화">
    <p className="mt-20 text-sm text-white/65">수신 전화</p>
    <div className="mt-16 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white/20">{contact?.avatar?<img src={contact.avatar} alt="" className="h-full w-full object-cover"/>:<Phone size={38}/>}</div>
    <h2 className="mt-5 text-[29px] font-semibold">{incoming.displayName}</h2>
    <p className="mt-2 text-sm text-white/60">{contact?.phoneNumber||'휴대전화'}</p>
    <div className="mt-auto mb-24 flex w-full justify-around px-8">
      <button type="button" onClick={rejectCall} className="flex flex-col items-center gap-3" aria-label="전화 거절"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d8423c]"><PhoneOff size={28}/></span><span className="text-sm">거절</span></button>
      <button type="button" onClick={acceptCall} className="flex flex-col items-center gap-3" aria-label="전화 받기"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#09a765]"><Phone size={28} fill="currentColor"/></span><span className="text-sm">받기</span></button>
    </div>
  </div>
  return <div className="pointer-events-none absolute inset-x-3 top-12 z-[90]" role="dialog" aria-label="수신 전화">
   <div className="pointer-events-auto rounded-[23px] bg-[#f9f9fa] px-4 py-3 text-[#161616] shadow-2xl ring-1 ring-black/5">
    <p className="text-[12px] font-medium">수신전화</p>
    <p className="mt-1 truncate text-[22px] font-bold leading-tight">{incoming.displayName}</p>
    <p className="mt-1 truncate text-[12px] text-[#888]">{contact?.phoneNumber||'휴대전화'}</p>
    <div className="mt-3 flex items-center gap-3">
     <button type="button" onClick={dismissBanner} className="min-w-0 flex-1 rounded-full bg-[#ededee] px-3 py-2.5 text-[12px] font-semibold text-[#343434]">메시지 보내기⌄</button>
     <button type="button" onClick={acceptCall} aria-label="전화 받기" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#09a765] text-white"><Phone size={24} fill="currentColor"/></button>
     <button type="button" onClick={rejectCall} aria-label="전화 거절" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d8423c] text-white"><PhoneOff size={24} fill="currentColor"/></button>
    </div>
   </div>
  </div>
 }
 return <div className="pointer-events-none absolute inset-x-3 top-12 z-[70]" role="status" aria-live="polite">
  <button type="button" onClick={openBannerNotification}
   onTouchStart={e=>{touchStart.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}}
   onTouchEnd={e=>dismissBySwipe(e.changedTouches[0].clientX,e.changedTouches[0].clientY)}
   onMouseDown={e=>{touchStart.current={x:e.clientX,y:e.clientY}}}
   onMouseUp={e=>dismissBySwipe(e.clientX,e.clientY)}
   className="pointer-events-auto w-full rounded-[26px] bg-[#f4f4f5] p-4 text-left text-[#202127] shadow-2xl">
   {notification?.type==='notification' && <div className="flex items-center gap-3">
    <span className="rounded-full bg-[#5b87b6] p-2 text-white">{notification.appId==='messages'?<MessageSquare size={19}/>:<MessageCircle size={19}/>}</span>
    <div className="min-w-0 flex-1"><div className="text-sm font-semibold">{notification.title}</div><div className="truncate text-sm">{notification.body}</div></div>
   </div>}
  </button>
 </div>
}
