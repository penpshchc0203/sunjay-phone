'use client'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, PhoneOff, RotateCcw, Phone } from 'lucide-react'

export type DialogueLine = {from:'me'|'other'; text:string}
export type CallDialogue = {id:string; callId?:string; eventId?:string; contactId:string; title?:string; lines:DialogueLine[]}
type Props={name:string;avatar?:string;number?:string;dialogue:CallDialogue;onClose:()=>void}
export function CallExperience({name,avatar,number,dialogue,onClose}:Props){
 const [step,setStep]=useState(0)
 const historyEndRef=useRef<HTMLDivElement>(null)
 useEffect(()=>{historyEndRef.current?.scrollIntoView({block:'end',behavior:'smooth'})},[step])
 const ended=step>=dialogue.lines.length
 const speaker=(from:DialogueLine['from'])=>from==='me'?'종성':name
 return <div className="absolute inset-0 z-[95] flex flex-col overflow-hidden bg-gradient-to-b from-[#171622] via-[#39354b] to-[#777c8c] text-white">
  <div className="flex h-14 shrink-0 items-center px-5"><button aria-label="통화 화면 나가기" onClick={onClose}><ArrowLeft size={25}/></button><span className="ml-auto text-xs text-white/65">통화 중</span></div>
  <div className="flex flex-col items-center pt-4"><div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white/20">{avatar?<img src={avatar} alt="" className="h-full w-full object-cover"/>:<Phone size={28}/>}</div><h2 className="mt-3 text-[25px] font-semibold">{name}</h2><p className="mt-1 text-sm text-white/60">{number||'휴대전화'}</p></div>
  <div className="flex min-h-0 flex-1 flex-col px-5 pb-3 pt-6">
   {ended?<div className="flex flex-1 flex-col items-center justify-center text-center"><PhoneOff size={36} className="mb-4 text-white/75"/><p className="text-xl font-semibold">통화 종료</p><p className="mt-2 text-sm text-white/70">대화를 모두 확인했습니다.</p><button onClick={()=>setStep(0)} className="mt-7 inline-flex items-center gap-2 rounded-full bg-white/20 px-6 py-3"><RotateCcw size={18}/>다시 보기</button></div>:<>
    <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-black/10 px-4 py-4" aria-label="지금까지의 통화 대화"><div className="flex flex-col gap-4">{dialogue.lines.slice(0,step).map((line,i)=><div key={i} className="border-b border-white/10 pb-3"><div className="mb-1 text-xs font-semibold text-white/65">{speaker(line.from)}</div><p className="whitespace-pre-wrap break-keep text-[16px] leading-relaxed">{line.text}</p></div>)}<div ref={historyEndRef}/></div></div>
    <button type="button" onClick={()=>setStep(s=>s+1)} className="mt-3 w-full shrink-0 rounded-[22px] border border-white/40 bg-white/20 px-5 py-5 text-left shadow-lg transition active:bg-white/30" aria-label="다음 대사 진행"><span className="mb-2 block text-[13px] font-semibold text-white/70">{speaker(dialogue.lines[step].from)}</span><span className="block whitespace-pre-wrap break-keep text-[18px] font-medium leading-relaxed">{dialogue.lines[step].text}</span></button>
   </>}
  </div>
  <div className="flex shrink-0 items-center justify-center pb-7 pt-3"><button onClick={ended?onClose:()=>setStep(dialogue.lines.length)} aria-label={ended?'통화 화면 닫기':'통화 종료'} className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e24c54] shadow-lg"><PhoneOff size={27}/></button></div>
 </div>
}
