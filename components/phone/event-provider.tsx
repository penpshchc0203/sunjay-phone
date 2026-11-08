 'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getPhoneEvents } from '@/content/events'
import type { EventAction, EventExecution, EventInput, PhoneEventDefinition } from '@/lib/phone/event-types'
import { useEpisode } from './episode-provider'
import { getCallDialogues } from '@/content/calls/dialogues'
import entryCall from '@/content/calls/dialogues/entry-call-ep02.json'
import type { CallLogEntry } from '@/lib/phone/content-types'

const PREFIX = 'virtual-phone:events:v1:'
const ENTRY_ID='entry-call-ep02'
const OUTGOING_ID='outgoing-call-sunwoo'
const SLEEP_REPLY_ID='sunwoo-sleep-reply'
const SLEEP_REPLY_TEXT='(선우는 취침 중 ㅎㅎ)'
const isQuietKakaoTime=(time:string)=>{const minute=minuteOfDay(time);return minute>=0&&minute<8*60}
// Use the same simulated episode date as reader-authored Kakao messages.
const simulatedMessageTime=(episodeEnd:string, instant:Date=new Date())=>{
 const next=new Date(`${episodeEnd.slice(0,10)}T00:00:00Z`);
 if(Number.isNaN(next.getTime()))return new Date().toISOString();
 next.setUTCDate(next.getUTCDate()+1);
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(instant);
 const get=(part:string)=>parts.find(p=>p.type===part)?.value??'00';
 return `${next.toISOString().slice(0,10)}T${get('hour')}:${get('minute')}:${get('second')}`;
}

const entrySettings=entryCall as typeof entryCall
const entryBand=()=>{
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date())
  const hour=Number(parts.find(p=>p.type==='hour')?.value??0), minute=Number(parts.find(p=>p.type==='minute')?.value??0)
  const now=hour*60+minute
  const parse=(s:string)=>{const [h,m]=s.split(':').map(Number);return h*60+m}
  return Object.entries(entrySettings.timeRanges).find(([,r])=>{const start=parse(r.start),end=parse(r.end);return start<=end?now>=start&&now<=end:now>=start||now<=end})?.[0]??'afternoon'
}
// JSON extensions are kept local because the shared event-types module is not in this upload.
type ReplyStep = {type:'kakao.reply';roomId:string;from:string;text?:string;image?:string;delayMs?:number}
type TimeRule = {start:string;end:string}
type TimedDefinition = PhoneEventDefinition & {trigger:PhoneEventDefinition['trigger'] & {keywords?:string[]};timeRanges?:Record<string,TimeRule>;timeResponses?:Record<string,ReplyStep[]>}
const minuteOfDay=(value:string):number=>{
  // Reader messages use offset-free simulated KST timestamps; offset-bearing values are instants.
  const match=value.match(/T(\d{2}):(\d{2})(?::\d{2})?(Z|[+-]\d{2}:?\d{2})?$/i)
  if(!match)return -1
  if(!match[3])return Number(match[1])*60+Number(match[2])
  const date=new Date(value)
  if(Number.isNaN(date.getTime()))return -1
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date)
  const get=(name:string)=>Number(parts.find(p=>p.type===name)?.value??0)
  return get('hour')*60+get('minute')
}
const timeRangeMatches=(minute:number,range:TimeRule)=>{
  const parse=(v:string)=>{const m=/^(\d{2}):(\d{2})$/.exec(v);if(!m)return -1;const h=Number(m[1]),n=Number(m[2]);return h<24&&n<60?h*60+n:-1}
  const start=parse(range.start),end=parse(range.end)
  return minute>=0&&start>=0&&end>=0&&(start<=end?minute>=start&&minute<=end:minute>=start||minute<=end)
}
const resolveActions=(definition:PhoneEventDefinition,occurredAt:string):EventAction[]=>{
  const timed=definition as TimedDefinition
  if(!timed.timeResponses||!timed.timeRanges)return definition.actions
  const minute=minuteOfDay(occurredAt)
  const band=Object.keys(timed.timeRanges).find(name=>timeRangeMatches(minute,timed.timeRanges![name]))
  return band&&timed.timeResponses[band]?timed.timeResponses[band] as EventAction[]:definition.actions
}
type Stored = { entryCallChecked?:boolean; replyDeliveryIds?:string[]; executions: EventExecution[]; callOutcomes?: CallOutcome[]; deliveredIds?: string[]; readNotificationIds?: string[]; dismissedNotificationIds?: string[] }
type CallOutcome = { executionId:string; id:string; contactId:string; type:'incoming'|'outgoing'|'rejected'; calledAt:string; durationSec?:number }
type EventContextValue = { executions: EventExecution[]; deliveredIds: string[]; replyDeliveryIds:string[]; notificationReadIds: string[]; notificationDismissedIds: string[]; markEventNotificationRead:(id:string)=>void; dismissEventNotification:(id:string)=>void; dismissAllEventNotifications:()=>void; dispatchEvent: (input: EventInput & {occurredAt?: string}) => void; resetKakaoEvents: (roomId?: string) => void; dismissBanner: () => void; banner: EventExecution | null; callOutcomes: CallOutcome[]; activeCall: {executionId:string;dialogueId:string;contactId:string;displayName:string}|null; acceptCall:()=>void; rejectCall:()=>void; finishCall:()=>void; replayEntryCall:()=>void; startOutgoingCall:()=>void; clearReaderCallHistory:()=>void }
const Context = createContext<EventContextValue | null>(null)
const normalize = (value:string) => value.toLocaleLowerCase('ko-KR').replace(/[\s\p{P}\p{S}]/gu,'')
const matches = (definition: PhoneEventDefinition, input: EventInput) => {
  const trigger = definition.trigger
  if (!definition.enabled || trigger.type !== input.type) return false
  switch (trigger.type) {
    case 'kakao.send': { const terms=[trigger.keyword,...((trigger as typeof trigger & {keywords?:string[]}).keywords??[])].filter(Boolean);return (!trigger.roomId || trigger.roomId === input.roomId) && terms.some(term=>normalize(input.keyword??'').includes(normalize(term))) }
    case 'instagram.story.upload': return !trigger.keyword || normalize(input.keyword ?? '').includes(normalize(trigger.keyword))
    case 'app.open': return trigger.appId === input.appId
    case 'action': return trigger.name === input.name
  }
}
export function EventProvider({children}:{children:ReactNode}) {
  const {episode} = useEpisode()
  const key = `${PREFIX}${episode.id}`
  const definitions = useMemo(()=>getPhoneEvents(episode.id),[episode.id])
  const [executions,setExecutions] = useState<EventExecution[]>([])
  const [deliveredIds,setDeliveredIds] = useState<string[]>([])
  const [replyDeliveryIds,setReplyDeliveryIds] = useState<string[]>([])
  const replyDeliveryRef=useRef<string[]>([])
  const [notificationReadIds,setNotificationReadIds] = useState<string[]>([])
  const [notificationDismissedIds,setNotificationDismissedIds] = useState<string[]>([])
  const deliveredRef=useRef<string[]>([])
  const readRef=useRef<string[]>([])
  const dismissedRef=useRef<string[]>([])
  const pendingReplies=useRef<Map<string,ReturnType<typeof setTimeout>>>(new Map())
  const [banner,setBanner] = useState<EventExecution|null>(null)
  const [activeCall,setActiveCall] = useState<{executionId:string;dialogueId:string;contactId:string;displayName:string}|null>(null)
  const [callOutcomes,setCallOutcomes] = useState<CallOutcome[]>([])
  const outcomesRef = useRef<CallOutcome[]>([])
  const entryCallCheckedRef=useRef(false)
  const activeRef = useRef(false)
  const records = useRef<EventExecution[]>([])
  const seen = useRef<Set<string>>(new Set())
  const ready = useRef(false)
  const pendingCalls = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const persist=()=>{try{localStorage.setItem(key,JSON.stringify({executions:records.current,entryCallChecked:entryCallCheckedRef.current,callOutcomes:outcomesRef.current,deliveredIds:deliveredRef.current,replyDeliveryIds:replyDeliveryRef.current,readNotificationIds:readRef.current,dismissedNotificationIds:dismissedRef.current}))}catch{}}
  const markEventNotificationRead=(id:string)=>{if(!readRef.current.includes(id)){readRef.current=[...readRef.current,id];setNotificationReadIds(readRef.current);persist()}}
  const dismissEventNotification=(id:string)=>{if(!dismissedRef.current.includes(id)){dismissedRef.current=[...dismissedRef.current,id];setNotificationDismissedIds(dismissedRef.current);persist()}}
  const dismissAllEventNotifications=()=>{dismissedRef.current=[...new Set([...dismissedRef.current,...eventNotifications(records.current,deliveredRef.current).map(n=>n.id)])];setNotificationDismissedIds(dismissedRef.current);persist()}
  const scheduleDelivery=(execution:EventExecution,baseDelay:number)=>{
    const steps=execution.actions.map((action,index)=>({action,index})).filter(item=>item.action.type==='kakao.reply')
    if(!steps.length){
      const timer=setTimeout(()=>{pendingReplies.current.delete(execution.id);if(!records.current.some(r=>r.id===execution.id))return;deliveredRef.current=[...new Set([...deliveredRef.current,execution.id])];setDeliveredIds(deliveredRef.current);persist();if(execution.actions.some(a=>a.type==='notification'))setBanner(current=>current??execution)},baseDelay)
      pendingReplies.current.set(execution.id,timer)
      return
    }
    let elapsed=baseDelay
    steps.forEach(({action,index},stepIndex)=>{
      const delay=(action as ReplyStep).delayMs
      if(stepIndex>0)elapsed+=typeof delay==='number'&&delay>=0?delay:650
      const token=`${execution.id}:${index}`
      if(replyDeliveryRef.current.includes(token))return
      const timer=setTimeout(()=>{
        pendingReplies.current.delete(token)
        if(!records.current.some(r=>r.id===execution.id))return
        replyDeliveryRef.current=[...new Set([...replyDeliveryRef.current,token])]
        setReplyDeliveryIds(replyDeliveryRef.current)
        const complete=steps.every(item=>replyDeliveryRef.current.includes(`${execution.id}:${item.index}`))
        if(complete){deliveredRef.current=[...new Set([...deliveredRef.current,execution.id])];setDeliveredIds(deliveredRef.current);if(execution.eventId===`${ENTRY_ID}:rejected`)setBanner(current=>current??execution)}
        persist()
      },elapsed)
      pendingReplies.current.set(token,timer)
    })
  }
  useEffect(() => () => {
    pendingCalls.current.forEach(clearTimeout)
    pendingCalls.current.clear()
    pendingReplies.current.forEach(clearTimeout)
    pendingReplies.current.clear()
  }, [key])
  useEffect(()=>{
    ready.current=false
    let restored:EventExecution[]=[]
    try {const value=JSON.parse(localStorage.getItem(key)??'null') as Stored|null; entryCallCheckedRef.current=Boolean(value?.entryCallChecked);if(Array.isArray(value?.executions)) restored=value.executions.filter(e=>e&&typeof e.id==='string'&&typeof e.eventId==='string')}catch{}
    // Repair previously stored rejection replies that used the real UTC date.
    restored=restored.map(e=>{
      if(e.eventId!==`${ENTRY_ID}:rejected`||!/Z$|[+-]\d{2}:?\d{2}$/.test(e.executedAt))return e
      const instant=new Date(e.executedAt)
      return Number.isNaN(instant.getTime())?e:{...e,executedAt:simulatedMessageTime(episode.dateTime,instant)}
    })
    let delivered:string[]=[],read:string[]=[],dismissed:string[]=[],replyDelivered:string[]=[]
    try {const v=JSON.parse(localStorage.getItem(key)??'null') as Stored|null; delivered=Array.isArray(v?.deliveredIds)?v.deliveredIds:[];read=Array.isArray(v?.readNotificationIds)?v.readNotificationIds:[];dismissed=Array.isArray(v?.dismissedNotificationIds)?v.dismissedNotificationIds:[];replyDelivered=Array.isArray(v?.replyDeliveryIds)?v.replyDeliveryIds:[]}catch{}
    deliveredRef.current=delivered;replyDeliveryRef.current=replyDelivered;setReplyDeliveryIds(replyDelivered);readRef.current=read;dismissedRef.current=dismissed
    setDeliveredIds(delivered);setNotificationReadIds(read);setNotificationDismissedIds(dismissed)
    let outcomes:CallOutcome[]=[]
    try {const value=JSON.parse(localStorage.getItem(key)??'null') as Stored|null; if(Array.isArray(value?.callOutcomes)) outcomes=value.callOutcomes}catch{}
    // Migrate only reader-generated call records from older UTC/real-date versions.
    // Original story call records in content.calls are never touched.
    outcomes=outcomes.map(outcome=>{
      if(!outcome.id.startsWith('event-call:'))return outcome
      const raw=outcome.calledAt
      if(!/Z$|[+-]\d{2}:?\d{2}$/.test(raw))return outcome
      const instant=new Date(raw)
      return Number.isNaN(instant.getTime())?outcome:{...outcome,calledAt:simulatedMessageTime(episode.dateTime,instant)}
    })
    outcomesRef.current=outcomes
    setCallOutcomes(outcomes)
    try {const saved=JSON.parse(localStorage.getItem(key)??'null');if(saved && typeof saved==='object')localStorage.setItem(key,JSON.stringify({...saved,executions:restored,callOutcomes:outcomes}))}catch{}
    activeRef.current=false
    setActiveCall(null)
    // Check only on the first visit, even when it is too early to call.
    // Previously queued entry calls must not ring again after a refresh.
    entryCallCheckedRef.current=entryCallCheckedRef.current||episode.id==='ep02'
    // The initial-entry incoming call is intentionally disabled; preserve its JSON.
    try{localStorage.setItem(key,JSON.stringify({executions:restored,entryCallChecked:entryCallCheckedRef.current,callOutcomes:outcomes,deliveredIds:delivered,replyDeliveryIds:replyDelivered,readNotificationIds:read,dismissedNotificationIds:dismissed}))}catch{}
    records.current=restored
    seen.current=new Set(restored.map(e=>e.id))
    setExecutions(restored)
    setBanner(null)
    // A page reload must never resurrect a previously queued incoming call.
    // First-entry incoming calls are hidden, including previously queued ones.
    // No banner is restored for the disabled entry feature.
    restored.filter(e=>e.actions.some(a=>a.type==='kakao.reply'||a.type==='instagram.dm'||a.type==='instagram.story.like')&&!delivered.includes(e.id)).forEach(e=>scheduleDelivery(e,1200))
    ready.current=true
  },[key])
  const dispatchEvent=useCallback((input:EventInput & {occurredAt?: string})=>{
    if(!ready.current || !input.triggerId || activeRef.current || pendingCalls.current.size>0 || banner?.actions.some(a=>a.type==='phone.incoming')) return
    const additions:EventExecution[]=[]
    const occurredAt=input.occurredAt??simulatedMessageTime(episode.dateTime)
    const sleeping=input.type==='kakao.send' && input.roomId==='kakao-user' && isQuietKakaoTime(occurredAt)
    if(sleeping){
      // One informational reply per sent message; never schedule ordinary replies or calls.
      const id=`${SLEEP_REPLY_ID}:${input.triggerId}`
      if(!seen.current.has(id)){
        seen.current.add(id)
        additions.push({id,eventId:SLEEP_REPLY_ID,triggerId:input.triggerId,executedAt:occurredAt,actions:[{type:'kakao.reply',roomId:'kakao-user',from:'user',text:SLEEP_REPLY_TEXT}]})
      }
    }else for(const definition of definitions){
      if(!matches(definition,input)) continue
      // A request to see Sunwoo takes precedence over the generic miss-you reply.
      if(definition.id==='auto-miss' && definitions.some(d=>d.id==='auto-selfie' && matches(d,input))) continue
      if(definition.repeat==='once' && records.current.some(e=>e.eventId===definition.id)) continue
      const id=`${definition.id}:${input.triggerId}`
      if(seen.current.has(id)) continue
      seen.current.add(id)
      additions.push({id,eventId:definition.id,triggerId:input.triggerId,executedAt:occurredAt,actions:resolveActions(definition,occurredAt)})
    }
    if(!additions.length)return
    records.current=[...records.current,...additions]
    persist()
    setExecutions(records.current)
    additions.filter(e=>e.actions.some(a=>a.type==='kakao.reply'||a.type==='instagram.dm'||a.type==='instagram.story.like')).forEach(e=>scheduleDelivery(e,1400+Math.floor(Math.random()*900)))
    const visible=additions.find(e=>e.actions.some(a=>a.type==='phone.incoming') || (input.type!=='kakao.send' && !e.actions.some(a=>a.type==='instagram.dm'||a.type==='instagram.story.like') && e.actions.some(a=>a.type==='notification')))
    if(visible){
      if(visible.actions.some(a=>a.type==='phone.incoming')){
        const timer=setTimeout(()=>{
          pendingCalls.current.delete(visible.id)
          if(records.current.some(e=>e.id===visible.id) && !activeRef.current) setBanner(current=>current??visible)
        },2500)
        pendingCalls.current.set(visible.id,timer)
      }else{
        setBanner(current=>current??visible)
      }
    }
  },[definitions,key,banner])
  const resetKakaoEvents=useCallback((roomId?:string)=>{
    const kakaoIds = new Set(definitions.filter(d=>d.trigger.type==='kakao.send' && (!roomId || !d.trigger.roomId || d.trigger.roomId===roomId)).map(d=>d.id))
    // Rejected entry calls deliver Kakao messages but do not originate from kakao.send.
    // Include those replies when clearing the Sunwoo room or all reader messages.
    const clearsSunwoo=!roomId||roomId==='kakao-user'
    const shouldRemove=(e:EventExecution)=>kakaoIds.has(e.eventId)||(clearsSunwoo&&(e.eventId===`${ENTRY_ID}:rejected`||e.eventId===SLEEP_REPLY_ID))
    const removed = records.current.filter(shouldRemove)
    removed.forEach(e=>{
      const timer=pendingCalls.current.get(e.id)
      if(timer!==undefined){clearTimeout(timer);pendingCalls.current.delete(e.id)}
      for(const [token,timer] of pendingReplies.current){if(token===e.id||token.startsWith(`${e.id}:`)){clearTimeout(timer);pendingReplies.current.delete(token)}}
    })
    const removedIds=new Set(removed.map(e=>e.id))
    outcomesRef.current=outcomesRef.current.filter(o=>!removedIds.has(o.executionId))
    setCallOutcomes(outcomesRef.current)
    if(activeCall && removedIds.has(activeCall.executionId)){activeRef.current=false;setActiveCall(null)}
    replyDeliveryRef.current=replyDeliveryRef.current.filter(id=>!removed.some(e=>id.startsWith(`${e.id}:`)));setReplyDeliveryIds(replyDeliveryRef.current)
    deliveredRef.current=deliveredRef.current.filter(id=>!removedIds.has(id));setDeliveredIds(deliveredRef.current)
    readRef.current=readRef.current.filter(id=>!removed.some(e=>id.startsWith(`event:${e.id}:`)));setNotificationReadIds(readRef.current)
    dismissedRef.current=dismissedRef.current.filter(id=>!removed.some(e=>id.startsWith(`event:${e.id}:`)));setNotificationDismissedIds(dismissedRef.current)
    const retained = records.current.filter(e=>!shouldRemove(e))
    records.current=retained
    seen.current=new Set(retained.map(e=>e.id))
    persist()
    setExecutions(retained)
    setBanner(current=>current && shouldRemove(current) ? null : current)
  },[definitions,key,activeCall])
  const saveOutcome=useCallback((execution:EventExecution,type:'incoming'|'rejected')=>{
    if(outcomesRef.current.some(o=>o.executionId===execution.id))return
    const action=execution.actions.find(a=>a.type==='phone.incoming')
    if(!action || action.type!=='phone.incoming')return
    const outcome:CallOutcome={executionId:execution.id,id:`event-call:${execution.id}`,contactId:action.contactId,type,calledAt:simulatedMessageTime(episode.dateTime, /Z$|[+-]\d{2}:?\d{2}$/.test(execution.executedAt)?new Date(execution.executedAt):new Date())}
    outcomesRef.current=[...outcomesRef.current,outcome]
    setCallOutcomes(outcomesRef.current)
    persist()
  },[key,episode.dateTime])
  const acceptCall=useCallback(()=>{
    if(!banner || activeRef.current)return
    const action=banner.actions.find(a=>a.type==='phone.incoming')
    if(!action || action.type!=='phone.incoming')return
    const dialogues=getCallDialogues(episode.id)
    const band=(()=>{const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());return Object.entries({morning:{start:'08:00',end:'11:59'},lunch:{start:'12:00',end:'13:59'},afternoon:{start:'14:00',end:'17:59'},evening:{start:'18:00',end:'18:59'},night:{start:'19:00',end:'23:59'}}).find(([,range])=>timeRangeMatches(Number(parts.find(p=>p.type==='hour')?.value??0)*60+Number(parts.find(p=>p.type==='minute')?.value??0),range))?.[0]})()
    const dialogue=banner.eventId==='test-phone'
      ? (dialogues.find(d=>d.id===`demo-incoming-sunwoo:${band}`)??dialogues.find(d=>d.eventId==='test-phone'))
      : dialogues.find(d=>d.eventId===banner.eventId && (banner.eventId!==ENTRY_ID || d.id===`${ENTRY_ID}:${banner.triggerId.split(':')[1]}`))
    saveOutcome(banner,'incoming')
    setBanner(null)
    if(dialogue){activeRef.current=true;setActiveCall({executionId:banner.id,dialogueId:dialogue.id,contactId:action.contactId,displayName:action.displayName})}
  },[banner,episode.id,saveOutcome])
  const rejectCall=useCallback(()=>{
    if(banner){
      saveOutcome(banner,'rejected')
      if(banner.eventId===ENTRY_ID && !records.current.some(e=>e.triggerId===banner.id && e.eventId===`${ENTRY_ID}:rejected`)){
        const band=banner.triggerId.split(':')[1] as keyof typeof entrySettings.variants
        const text=entrySettings.variants[band]?.rejectText??entrySettings.variants.afternoon.rejectText
        const reply:EventExecution={id:`${banner.id}:rejected`,eventId:`${ENTRY_ID}:rejected`,triggerId:banner.id,executedAt:simulatedMessageTime(episode.dateTime),actions:[{type:'kakao.reply',roomId:'kakao-user',from:'user',text},{type:'notification',appId:'kakao',title:'선우♡',body:text,targetId:'kakao-user'}]}
        records.current=[...records.current,reply];seen.current.add(reply.id);setExecutions(records.current);persist();scheduleDelivery(reply,1200)
      }
    }
    setBanner(null)
  },[banner,saveOutcome,key,episode.dateTime])
  const replayEntryCall=useCallback(()=>{
    if(episode.id!=='ep02'||activeRef.current||banner||pendingCalls.current.size)return
    const band=entryBand()
    const id=`${ENTRY_ID}:replay:${Date.now()}:${Math.random().toString(36).slice(2)}`
    const call:EventExecution={id,eventId:ENTRY_ID,triggerId:`entry:${band}`,executedAt:simulatedMessageTime(episode.dateTime),actions:[{type:'phone.incoming',contactId:entrySettings.contactId,displayName:entrySettings.displayName}]}
    records.current=[...records.current,call];seen.current.add(id);setExecutions(records.current);persist();setBanner(call)
  },[episode.id,banner,key])
  const startOutgoingCall=useCallback(()=>{
    if(!['ep02','ep03'].includes(episode.id)||activeRef.current||banner)return
    const dialogues=getCallDialogues(episode.id)
    const dialogue=dialogues.find(d=>d.id===OUTGOING_ID)
    if(!dialogue)return
    const timed=dialogue as typeof dialogue & {timeRanges?:Record<string,{start:string;end:string}>}
    const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date())
    const minute=Number(parts.find(p=>p.type==='hour')?.value??0)*60+Number(parts.find(p=>p.type==='minute')?.value??0)
    const band=Object.keys(timed.timeRanges??{}).find(name=>timeRangeMatches(minute,timed.timeRanges![name]))
    const timedDialogue=band?dialogues.find(d=>d.id===`${OUTGOING_ID}:${band}`):undefined
    const dialogueId=timedDialogue?.id??dialogue.id
    const id=`${OUTGOING_ID}:${Date.now()}:${Math.random().toString(36).slice(2)}`
    const outcome:CallOutcome={executionId:id,id:`event-call:${id}`,contactId:'sunwoo',type:'outgoing',calledAt:simulatedMessageTime(episode.dateTime)}
    outcomesRef.current=[...outcomesRef.current,outcome]
    setCallOutcomes(outcomesRef.current)
    persist()
    activeRef.current=true
    setActiveCall({executionId:id,dialogueId,contactId:'sunwoo',displayName:'선우♡'})
  },[episode.id,episode.dateTime,banner,key])
  // Only clear simulated reader-initiated call outcomes. Preserve original call JSON,
  // Kakao replies/notifications and event executions so replay remains available.
  const clearReaderCallHistory=useCallback(()=>{
    outcomesRef.current=[]
    setCallOutcomes([])
    persist()
  },[key])
  const finishCall=useCallback(()=>{activeRef.current=false;setActiveCall(null)},[])
  const value=useMemo(()=>({executions,deliveredIds,replyDeliveryIds,notificationReadIds,notificationDismissedIds,markEventNotificationRead,dismissEventNotification,dismissAllEventNotifications,dispatchEvent,resetKakaoEvents,banner,callOutcomes,activeCall,acceptCall,rejectCall,finishCall,replayEntryCall,startOutgoingCall,clearReaderCallHistory,dismissBanner:()=>setBanner(null)}),[executions,deliveredIds,replyDeliveryIds,notificationReadIds,notificationDismissedIds,dispatchEvent,resetKakaoEvents,banner,callOutcomes,activeCall,acceptCall,rejectCall,finishCall,replayEntryCall,startOutgoingCall,clearReaderCallHistory])
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export function usePhoneEvents(){const ctx=useContext(Context);if(!ctx)throw new Error('EventProvider missing');return ctx}
export const eventNotifications = (executions:EventExecution[], deliveredIds:string[]=[]) => executions.flatMap(e=>e.actions.some(a=>a.type==='kakao.reply'||a.type==='instagram.dm'||a.type==='instagram.story.like')&&!deliveredIds.includes(e.id) ? [] : e.actions.filter((a):a is Extract<EventAction,{type:'notification'}>=>a.type==='notification').map((a,i)=>({id:`event:${e.id}:${i}`,appId:a.appId,title:a.title,body:a.body,targetId:a.targetId,executedAt:e.executedAt})))
