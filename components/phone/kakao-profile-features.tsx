'use client'
import { useEffect, useState } from 'react'
import { ChevronLeft, Plus, Trash2, Pencil, Check, X, Music2, CalendarDays, GripVertical } from 'lucide-react'
import { useEpisode } from './episode-provider'
import type { Contact } from '@/lib/phone/content-types'
import ep01 from '@/content/kakao/profile-features/ep01.json'
import ep02 from '@/content/kakao/profile-features/ep02.json'
import ep03 from '@/content/kakao/profile-features/ep03.json'

export type WidgetPosition = 'top' | 'middle' | 'bottom'
export type ProfileWidget = { title: string; artist?: string; albumImage?: string; date?: string; position?: WidgetPosition }
export type MultiProfile = { id: string; name: string; avatar?: string; backgroundImage?: string; statusMessage?: string; friendIds: string[]; bgm?: ProfileWidget; dday?: ProfileWidget }
type Config = { defaultProfile?: { bgm?: ProfileWidget; dday?: ProfileWidget }; multiProfiles?: MultiProfile[] }
const configs: Record<string, Config> = { ep01, ep02, ep03 }
const baseKey = 'virtual-phone:kakao-multiprofiles:v1'
const positionKey = 'virtual-phone:kakao-widget-positions:v1'
const validPosition = (v: unknown): v is WidgetPosition => v === 'top' || v === 'middle' || v === 'bottom'
const read = <T,>(key: string, fallback: T): T => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback } catch { return fallback } }
export function useKakaoProfileFeatures() {
  const { episode } = useEpisode()
  const config = configs[episode.id] ?? {}
  const key = `${baseKey}:${episode.id}`
  const positionsKey = `${positionKey}:${episode.id}`
  const [profiles, setProfiles] = useState<MultiProfile[]>(config.multiProfiles ?? [])
  const [positions, setPositions] = useState<Record<string, WidgetPosition>>({})
  useEffect(() => { setProfiles(read(key, config.multiProfiles ?? [])); setPositions(read(positionsKey, {})) }, [key, positionsKey])
  const save = (next: MultiProfile[]) => { setProfiles(next); try { localStorage.setItem(key, JSON.stringify(next)) } catch {} }
  const setPosition = (profileId: string, widget: 'bgm'|'dday', position: WidgetPosition) => { const next = {...positions, [`${profileId}:${widget}`]:position}; setPositions(next); try {localStorage.setItem(positionsKey,JSON.stringify(next))}catch{} }
  const widgetsFor = (profileId: string, profile?: MultiProfile) => {
    const source = profileId === 'me' ? config.defaultProfile : profile
    return (['bgm','dday'] as const).flatMap(type => { const widget = source?.[type]; return widget ? [{type, ...widget, position: positions[`${profileId}:${type}`] ?? (validPosition(widget.position) ? widget.position : 'middle')}] : [] })
  }
  return { profiles, save, widgetsFor, setPosition }
}
export function DdayLabel({ title, date }: {title:string; date:string}) {
  const [today, setToday] = useState('')
  useEffect(() => { const update=()=>setToday(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())); update(); const timer=setInterval(update,60000); return ()=>clearInterval(timer) },[])
  const a = Date.parse(`${date.slice(0,10)}T00:00:00Z`), b=Date.parse(`${today}T00:00:00Z`)
  const days = Number.isFinite(a)&&Number.isFinite(b) ? Math.round((b-a)/86400000) : null
  return <span className="inline-flex max-w-full items-center gap-2 rounded-md bg-white/90 px-2 py-1 text-sm text-black"><span className="truncate">{title}</span><b className="shrink-0 bg-black px-2 py-1 text-white">{days === null ? 'D-day' : days === 0 ? 'D-day' : days > 0 ? `D+${days}` : `D${days}`}</b></span>
}
export function ProfileWidgets({ profileId, profile, editable = false }: {profileId:string; profile?:MultiProfile; editable?:boolean}) {
  const {widgetsFor,setPosition} = useKakaoProfileFeatures()
  const widgets = widgetsFor(profileId,profile)
  return <div className="pointer-events-none absolute inset-0 z-[2]">
    {widgets.map(w => <div key={w.type} className={`pointer-events-auto absolute left-1/2 w-[88%] -translate-x-1/2 ${w.position==='top'?'top-[15%]':w.position==='bottom'?'top-[63%]':'top-[38%]'}`}>
      {w.type==='bgm' ? <div className="flex items-center gap-2 rounded-lg border border-white/50 bg-black/35 p-2 text-white backdrop-blur-sm">{w.albumImage ? <img src={w.albumImage} alt="앨범" className="h-10 w-10 rounded object-cover"/> : <Music2 size={22}/>}<div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{w.title}</p><p className="truncate text-xs">{w.artist}</p></div><span className="text-lg">▶</span></div> : <DdayLabel title={w.title} date={w.date ?? ''}/>}
      {editable && <div className="mt-2 flex justify-center gap-1">{(['top','middle','bottom'] as const).map(pos=><button key={pos} onClick={()=>setPosition(profileId,w.type,pos)} className={`rounded-full px-2 py-1 text-[11px] ${w.position===pos?'bg-yellow-300 text-black':'bg-black/60 text-white'}`}>{pos==='top'?'위':pos==='middle'?'중간':'아래'}</button>)}</div>}
    </div>)}
  </div>
}
export function MultiProfileManager({ onClose, contacts, avatarOf, onPreview }: {onClose:()=>void; contacts:Contact[]; avatarOf:(id:string)=>string|undefined; onPreview:(id:string)=>void}) {
  const {profiles,save}=useKakaoProfileFeatures()
  const [screen,setScreen]=useState<'list'|'edit'|'friends'>('list')
  const [editing,setEditing]=useState<MultiProfile|null>(null)
  const [query,setQuery]=useState('')
  const [newFriend,setNewFriend]=useState('')
  const nameOf=(id:string)=>contacts.find(c=>c.id===id)?.name ?? id
  const avatar=(src?:string)=>src?<img src={src} alt="" className="h-12 w-12 rounded-[36%] object-cover"/>:<div className="flex h-12 w-12 items-center justify-center rounded-[36%] bg-zinc-100"><Plus/></div>
  const edit=(p:MultiProfile)=>{setEditing({...p,friendIds:[...p.friendIds]});setScreen('edit')}
  const commit=()=>{if(!editing)return;const next=profiles.some(p=>p.id===editing.id)?profiles.map(p=>p.id===editing.id?editing:p):[...profiles,editing];save(next);setScreen('list')}
  const goBack=()=>{if(screen==='friends')setScreen('edit');else if(screen==='edit')setScreen('list');else onClose()}
  const eligible=contacts.filter(c=>c.id!=='me'&&c.id!=='user'&&(!newFriend||nameOf(c.id).includes(newFriend)))
  return <section className="relative z-30 flex h-full min-h-0 flex-col bg-white text-[#202020]">
    <header className="flex h-16 shrink-0 items-center gap-4 px-5"><button onClick={goBack} aria-label="뒤로"><ChevronLeft size={27}/></button><h2 className="flex-1 text-lg font-bold">{screen==='list'?'멀티프로필':screen==='friends'?'지정친구 관리':'멀티프로필 편집'}</h2>{screen==='edit'&&<button onClick={commit} className="font-semibold">완료</button>}</header>
    {screen==='list' && <div className="flex-1 overflow-y-auto px-5 pt-5">{profiles.map(p=><div key={p.id} className="flex items-center gap-3 py-3"> <button onClick={()=>onPreview(p.id)}>{avatar(p.avatar)}</button><button className="min-w-0 flex-1 truncate text-left" onClick={()=>onPreview(p.id)}>{p.name}<p className="text-xs text-zinc-500">지정친구 {p.friendIds.length}명</p></button><button onClick={()=>edit(p)} className="rounded-full border px-3 py-2 text-xs">편집</button></div>)}<button onClick={()=>edit({id:`multi-${Date.now()}`,name:'새 멀티프로필',friendIds:[]})} className="flex w-full items-center gap-3 py-4">{avatar()}멀티프로필 만들기</button></div>}
    {screen==='edit' && editing && <div className="flex-1 space-y-4 overflow-y-auto px-5 pt-4"><div className="flex justify-center">{avatar(editing.avatar)}</div>{([['name','프로필 이름'],['avatar','프로필 사진 경로'],['backgroundImage','배경 이미지 경로'],['statusMessage','상태 메시지']] as const).map(([key,label])=><label key={key} className="block text-xs text-zinc-500">{label}<input className="mt-1 w-full rounded-lg border px-3 py-3 text-sm text-black" value={editing[key]??''} onChange={e=>setEditing({...editing,[key]:e.target.value})}/></label>)}<button onClick={()=>setScreen('friends')} className="flex w-full items-center justify-between rounded-lg border px-4 py-4 text-sm">지정친구 관리 <span>{editing.friendIds.length}명 ›</span></button><p className="text-xs text-zinc-500">BGM과 디데이의 곡·날짜는 JSON에서만 변경할 수 있습니다.</p><button onClick={()=>{if(confirm('이 멀티프로필을 삭제할까요?')){save(profiles.filter(p=>p.id!==editing.id));setScreen('list')}}} className="flex items-center gap-2 text-sm text-red-600"><Trash2 size={16}/>멀티프로필 삭제</button></div>}
    {screen==='friends'&&editing&&<div className="min-h-0 flex-1 overflow-y-auto px-5"><input value={newFriend} onChange={e=>setNewFriend(e.target.value)} placeholder="지정친구 검색" className="mb-4 w-full rounded-xl bg-zinc-100 px-4 py-3 text-sm outline-none"/><p className="mb-3 text-xs text-zinc-500">친구 {editing.friendIds.length}명</p>{eligible.map(c=><button key={c.id} onClick={()=>setEditing({...editing,friendIds:editing.friendIds.includes(c.id)?editing.friendIds.filter(id=>id!==c.id):[...editing.friendIds,c.id]})} className="flex w-full items-center gap-3 py-3 text-left">{avatar(avatarOf(c.id))}<span className="flex-1">{c.name}</span><span className={`rounded-full border px-3 py-1 text-xs ${editing.friendIds.includes(c.id)?'bg-yellow-300':''}`}>{editing.friendIds.includes(c.id)?'해제':'지정'}</span></button>)}</div>}
  </section>
}
