'use client'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, House, Plus, Pencil, Trash2, Check } from 'lucide-react'
import { useEpisode, episodeStorageKey } from '../episode-provider'
import { usePhone } from '../phone-provider'
import all from '@/content/todos/all.json'
import ep01 from '@/content/todos/ep01.json'
import ep02 from '@/content/todos/ep02.json'
import ep03 from '@/content/todos/ep03.json'
type Todo = { id:string; title:string; category:'업무'|'개인'|'약속'; dueDate:string; completed:boolean; memo:string }
type Patch = Partial<Todo> & {id:string}
const sets = [all,ep01,ep02,ep03]
const blank = ():Todo => ({id:`local-${Date.now()}-${Math.random().toString(36).slice(2)}`,title:'',category:'개인',dueDate:'2026-05-01',completed:false,memo:''})
const KEY = 'virtual-phone:todos:v1'
export function TodoApp({onClose}:{onClose?:()=>void}) {
 const {episode}=useEpisode(); const {back,goHome}=usePhone(); const key=episodeStorageKey(KEY,episode.id)
 const [changes,setChanges]=useState<Record<string,Patch>>({}); const [removed,setRemoved]=useState<string[]>([]);const [loaded,setLoaded]=useState('')
 const [edit,setEdit]=useState<Todo|null>(null); const [detail,setDetail]=useState<Todo|null>(null); const [filter,setFilter]=useState('전체')
 const close=()=>onClose?onClose():back()
 useEffect(()=>{try{const raw=localStorage.getItem(key);const obj=raw?JSON.parse(raw):{};setChanges(obj.changes||{});setRemoved(obj.removed||[])}catch{setChanges({});setRemoved([])}setLoaded(key);setEdit(null);setDetail(null)},[key])
 useEffect(()=>{if(loaded===key)try{localStorage.setItem(key,JSON.stringify({changes,removed}))}catch{}},[changes,removed,loaded,key])
 const items=useMemo(()=>{const map=new Map<string,Todo>();const n=Math.min(3,Math.max(1,Number(episode.id.slice(2))));for(const j of [0,n])for(const patch of (sets[j].todos as Patch[])){const prev=map.get(patch.id);map.set(patch.id,{...prev,...patch} as Todo)}for(const patch of Object.values(changes)){map.set(patch.id,{...map.get(patch.id),...patch} as Todo)}return [...map.values()].filter(t=>!removed.includes(t.id)).sort((a,b)=>Number(a.completed)-Number(b.completed)||a.dueDate.localeCompare(b.dueDate))},[episode.id,changes,removed])
 const save=(item:Todo)=>{setChanges(p=>({...p,[item.id]:item}));setEdit(null);setDetail(null)}
 const remove=(id:string)=>{setRemoved(p=>[...p,id]);setEdit(null);setDetail(null)}
 return <section className="flex h-full min-h-0 flex-col overflow-hidden bg-[#fafafa] text-zinc-900"><header className="flex h-14 shrink-0 items-center gap-2 px-3"><button onClick={edit?()=>setEdit(null):detail?()=>setDetail(null):close} aria-label="뒤로"><ArrowLeft/></button><h1 className="flex-1 text-lg font-bold">{edit?'할 일 편집':detail?'할 일 상세':'할 일'}</h1><button onClick={onClose||goHome} aria-label="홈"><House size={20}/></button></header>
 {edit?<form className="flex flex-col gap-4 overflow-y-auto p-5" onSubmit={e=>{e.preventDefault();if(edit.title.trim())save(edit)}}><label>제목<input required className="mt-1 w-full rounded-xl bg-white p-3" value={edit.title} onChange={e=>setEdit({...edit,title:e.target.value})}/></label><label>카테고리<select className="mt-1 w-full rounded-xl bg-white p-3" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value as Todo['category']})}>{['업무','개인','약속'].map(c=><option key={c}>{c}</option>)}</select></label><label>마감일<input type="date" className="mt-1 w-full rounded-xl bg-white p-3" value={edit.dueDate} onChange={e=>setEdit({...edit,dueDate:e.target.value})}/></label><label>메모<textarea className="mt-1 w-full rounded-xl bg-white p-3" value={edit.memo} onChange={e=>setEdit({...edit,memo:e.target.value})}/></label><label className="flex gap-2"><input type="checkbox" checked={edit.completed} onChange={e=>setEdit({...edit,completed:e.target.checked})}/>완료</label><button className="rounded-xl bg-blue-600 p-3 font-bold text-white">저장</button></form>:detail?<div className="space-y-4 p-5"><h2 className="text-xl font-bold">{detail.title}</h2><p>{detail.category} · {detail.dueDate}</p><p>{detail.completed?'완료':'미완료'}</p><p className="whitespace-pre-wrap">{detail.memo}</p><div className="flex gap-3"><button className="rounded-xl bg-white p-3" onClick={()=>setEdit(detail)}><Pencil/></button><button className="rounded-xl bg-white p-3 text-red-500" onClick={()=>remove(detail.id)}><Trash2/></button></div></div>:<><div className="flex gap-2 px-4 py-3">{['전체','미완료','완료'].map(f=><button key={f} onClick={()=>setFilter(f)} className={`rounded-full px-4 py-2 text-sm ${filter===f?'bg-blue-600 text-white':'bg-white'}`}>{f}</button>)}</div><div className="min-h-0 flex-1 overflow-y-auto px-4">{items.filter(t=>filter==='전체'||(filter==='완료'?t.completed:!t.completed)).map(t=><div key={t.id} className="mb-2 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"><button aria-label="완료 전환" onClick={()=>setChanges(p=>({...p,[t.id]:{...t,completed:!t.completed}}))} className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${t.completed?'bg-blue-600 text-white':'border-zinc-400'}`}>{t.completed&&<Check size={16}/>}</button><button className="min-w-0 flex-1 text-left" onClick={()=>setDetail(t)}><p className={t.completed?'text-zinc-400 line-through':'font-medium'}>{t.title}</p><p className="mt-1 text-xs text-zinc-500">{t.category} · {t.dueDate}</p></button></div>)}</div><button onClick={()=>setEdit(blank())} className="m-4 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 p-3 font-semibold text-white"><Plus size={20}/>할 일 추가</button></>}
 </section>
}
