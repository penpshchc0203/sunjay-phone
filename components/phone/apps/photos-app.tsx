'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, Home, ImageOff, Info, LockKeyhole, RotateCcw, Search, Trash2, X, EyeOff, FolderOpen, Images, Check } from 'lucide-react'
import type { Photo } from '@/lib/phone/content-types'
import { useEpisodeProgress } from '../use-episode-progress'
import { useEpisode, episodeStorageKey } from '../episode-provider'
import { usePhone } from '../phone-provider'

const STORE_KEY = 'virtual-phone:photos:v1'
type Saved = { favorites: Record<string,boolean>; hidden: Record<string,boolean>; deleted: string[]; purged: string[] }
const emptySaved = (): Saved => ({favorites:{},hidden:{},deleted:[],purged:[]})
type Section = 'library' | 'albums' | 'favorites' | 'hidden' | 'deleted' | 'album'
const dateName = (value: string) => { const d = new Date(value); return Number.isNaN(d.getTime()) ? value.slice(0,10) : d.toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'}) }
const albumsOf = (p: Photo) => Array.from(new Set([...(p.albumIds || []),...(p.album ? [p.album] : [])]))

function PhotoTile({photo,onClick}: {photo:Photo;onClick:()=>void}) {
  const [failed,setFailed]=useState(false)
  return <button type="button" onClick={onClick} aria-label={`${photo.alt || '사진'} 열기`} className="relative aspect-square overflow-hidden bg-zinc-100 text-zinc-400 focus-visible:outline-2 focus-visible:outline-blue-500">
    {!failed && photo.src ? <img src={photo.src} alt={photo.alt || '사진'} loading="lazy" onError={()=>setFailed(true)} className="h-full w-full object-cover"/> : <span className="flex h-full items-center justify-center"><ImageOff size={23}/></span>}
  </button>
}

export function PhotosApp() {
  const { goHome, back } = usePhone()
  const { episode, content } = useEpisode()
  const store_key = episodeStorageKey(STORE_KEY, episode.id)
  const PHOTOS = content.photos
  const [section,setSection] = useState<Section>('library')
  const [album,setAlbum] = useState('')
  const [search,setSearch] = useState('')
  const [selected,setSelected] = useState<string|null>(null)
  useEpisodeProgress('photos', selected)
  const [showInfo,setShowInfo] = useState(false)
  const [saved,setSaved] = useState<Saved>(emptySaved)
  const [ready,setReady] = useState(false)
  const [hiddenUnlocked,setHiddenUnlocked] = useState(false)
  const [password,setPassword] = useState('')
  const [passwordInput,setPasswordInput] = useState('')
  const [passwordError,setPasswordError] = useState(false)
  const touchX = useRef<number|null>(null)
  useEffect(()=>{setReady(false);setSaved(emptySaved());setPassword('');try { const data=localStorage.getItem(store_key); if(data) {const parsed=JSON.parse(data);setSaved({...emptySaved(),...parsed})} const pass=localStorage.getItem(`${store_key}:password`);if(pass)setPassword(pass)}catch{} setReady(true)},[store_key])
  useEffect(()=>{if(ready)try{localStorage.setItem(store_key,JSON.stringify(saved))}catch{}},[saved,ready])
  const update = (fn:(v:Saved)=>Saved) => setSaved(fn)
  const photos = useMemo(()=>[...PHOTOS].sort((a,b)=>b.takenAt.localeCompare(a.takenAt)),[])
  const isDeleted = (id:string)=>saved.deleted.includes(id)
  const isPurged = (id:string)=>saved.purged.includes(id)
  const isHidden = (p:Photo)=>saved.hidden[p.id] ?? Boolean(p.hidden)
  const isFavorite = (p:Photo)=>saved.favorites[p.id] ?? Boolean(p.favorite)
  const active = photos.filter(p=>!isDeleted(p.id)&&!isPurged(p.id))
  const visible = active.filter(p=>!isHidden(p))
  const albumNames = Array.from(new Set(visible.flatMap(albumsOf))).sort((a,b)=>a.localeCompare(b,'ko'))
  const candidate = section==='deleted' ? photos.filter(p=>isDeleted(p.id)&&!isPurged(p.id)) : section==='hidden' ? active.filter(isHidden) : section==='favorites' ? visible.filter(isFavorite) : section==='album' ? visible.filter(p=>albumsOf(p).includes(album)) : visible
  const shown = candidate.filter(p=>`${p.alt} ${p.description||''} ${p.location||''}`.toLowerCase().includes(search.toLowerCase()))
  const current = photos.find(p=>p.id===selected)
  const selectedIndex = shown.findIndex(p=>p.id===selected)
  const move = (delta:number)=>{if(selectedIndex<0||!shown.length)return;setSelected(shown[(selectedIndex+delta+shown.length)%shown.length].id);setShowInfo(false)}
  const goBack = () => {if(selected){setSelected(null);setShowInfo(false)}else if(section==='album'){setSection('albums');setSearch('')}else if(section!=='library'){setSection('library');setSearch('')}else back()}
  const setSectionTo = (s:Section) => {setSection(s);setSelected(null);setSearch('');setShowInfo(false)}
  const toggleFavorite = (p:Photo)=>update(v=>({...v,favorites:{...v.favorites,[p.id]:!(v.favorites[p.id]??Boolean(p.favorite))}}))
  const toggleHidden = (p:Photo)=>{update(v=>({...v,hidden:{...v.hidden,[p.id]:!(v.hidden[p.id]??Boolean(p.hidden))}}));setSelected(null)}
  const deletePhoto = (id:string)=>{update(v=>({...v,deleted:[...new Set([...v.deleted,id])]}));setSelected(null)}
  const restore = (id:string)=>{update(v=>({...v,deleted:v.deleted.filter(x=>x!==id)}));setSelected(null)}
  const purge = (id:string)=>{if(!window.confirm('이 사진을 최근 삭제된 항목에서 완전히 제거할까요? 원본 이미지 파일은 삭제되지 않습니다.'))return;update(v=>({...v,deleted:v.deleted.filter(x=>x!==id),purged:[...new Set([...v.purged,id])]}));setSelected(null)}
  const unlock = ()=>{if(!password||passwordInput===password){setHiddenUnlocked(true);setPasswordError(false);setPasswordInput('')}else setPasswordError(true)}
  const setNewPassword = ()=>{const next=window.prompt('숨김 앨범 비밀번호를 입력하세요. 빈칸으로 저장하면 비밀번호를 해제합니다.',password);if(next===null)return;setPassword(next);try{if(next)localStorage.setItem(`${store_key}:password`,next);else localStorage.removeItem(`${store_key}:password`)}catch{}}
  const groupByDate = shown.reduce<Record<string,Photo[]>>((acc,p)=>{const key=dateName(p.takenAt);(acc[key]??=[]).push(p);return acc},{})
  return <section className="relative flex h-full min-h-0 flex-col bg-white text-zinc-900">
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-100 px-3">
      <button onClick={goBack} aria-label="뒤로 가기" className="rounded-full p-2 hover:bg-zinc-100"><ArrowLeft size={21}/></button>
      <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{section==='library'?'사진':section==='albums'?'앨범':section==='favorites'?'즐겨찾기':section==='hidden'?'가려진 사진':section==='deleted'?'최근 삭제된 항목':album}</h1>
      <button onClick={goHome} aria-label="홈 화면으로" className="rounded-full p-2 hover:bg-zinc-100"><Home size={20}/></button>
    </header>
    {section!=='albums' && <label className="mx-4 my-3 flex shrink-0 items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 text-zinc-500"><Search size={16}/><input className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none" placeholder="사진 검색" aria-label="사진 검색" value={search} onChange={e=>setSearch(e.target.value)}/></label>}
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-5">
      {section==='albums' ? <div className="grid grid-cols-2 gap-4 p-4">
        {albumNames.map(name=>{const group=visible.filter(p=>albumsOf(p).includes(name));return <button key={name} onClick={()=>{setAlbum(name);setSectionTo('album')}} className="min-w-0 text-left"><div className="aspect-square overflow-hidden rounded-xl bg-zinc-100"><PhotoCover photo={group[0]}/></div><p className="mt-2 truncate text-sm font-semibold">{name}</p><p className="text-xs text-zinc-500">{group.length}장</p></button>})}
        <button onClick={()=>setSectionTo('favorites')} className="rounded-xl border border-zinc-200 p-4 text-left"><Heart className="mb-2 text-pink-500"/>즐겨찾기</button>
        <button onClick={()=>setSectionTo('hidden')} className="rounded-xl border border-zinc-200 p-4 text-left"><EyeOff className="mb-2"/>가려진 사진</button>
        <button onClick={()=>setSectionTo('deleted')} className="rounded-xl border border-zinc-200 p-4 text-left"><Trash2 className="mb-2"/>최근 삭제된 항목</button>
      </div> : section==='hidden'&&!hiddenUnlocked&&password ? <div className="mx-auto flex max-w-xs flex-col items-center gap-3 px-6 py-12"><LockKeyhole size={35}/><p className="text-sm">숨김 앨범 비밀번호</p><input type="password" value={passwordInput} onChange={e=>setPasswordInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')unlock()}} className="w-full rounded-lg border p-3" placeholder="비밀번호" aria-label="숨김 앨범 비밀번호"/>{passwordError&&<p className="text-xs text-red-600">비밀번호가 일치하지 않습니다.</p>}<button onClick={unlock} className="rounded-lg bg-zinc-900 px-6 py-2 text-white">열기</button><p className="text-center text-xs text-zinc-500">이 잠금은 이야기 연출용이며 실제 보안 기능이 아닙니다.</p></div> : <>
        {section==='hidden'&&<div className="px-4 py-2"><button onClick={setNewPassword} className="text-xs text-blue-600">숨김 앨범 비밀번호 설정·변경 (연출용)</button></div>}
        {Object.entries(groupByDate).map(([date,group])=><div key={date}><h2 className="px-4 pb-2 pt-3 text-sm font-semibold">{date}</h2><div className="grid grid-cols-3 gap-0.5">{group.map(p=><PhotoTile key={p.id} photo={p} onClick={()=>setSelected(p.id)}/>)}</div></div>)}
        {!shown.length&&<div className="px-5 py-16 text-center text-sm text-zinc-400">{search?'검색 결과가 없습니다.':'사진이 없습니다.'}</div>}
      </>}
    </div>
    <nav aria-label="사진첩 메뉴" className="flex shrink-0 border-t border-zinc-100 bg-white pb-1">
      <Tab icon={<Images size={19}/>} label="사진" active={section==='library'} onClick={()=>setSectionTo('library')}/>
      <Tab icon={<FolderOpen size={19}/>} label="앨범" active={section!=='library'} onClick={()=>setSectionTo('albums')}/>
    </nav>
    {current&&<div role="dialog" aria-modal="true" aria-label="사진 상세" className="absolute inset-0 z-50 flex flex-col bg-black text-white" onTouchStart={e=>{touchX.current=e.touches[0]?.clientX??null}} onTouchEnd={e=>{if(touchX.current===null)return;const dx=(e.changedTouches[0]?.clientX??touchX.current)-touchX.current;if(Math.abs(dx)>45)move(dx<0?1:-1);touchX.current=null}}>
      <header className="flex h-14 shrink-0 items-center gap-2 px-3"><button aria-label="사진 닫기" onClick={()=>{setSelected(null);setShowInfo(false)}} className="rounded-full p-2"><X/></button><div className="min-w-0 flex-1"><p className="text-sm">{dateName(current.takenAt)}</p><p className="text-xs text-white/60">{current.takenAt.split('T')[1]||''}</p></div><button aria-label="사진 정보" onClick={()=>setShowInfo(v=>!v)} className="p-2"><Info/></button></header>
      <div className="relative flex min-h-0 flex-1 items-center justify-center"><PhotoViewer photo={current}/>{shown.length>1&&<><button onClick={()=>move(-1)} aria-label="이전 사진" className="absolute left-1 top-1/2 rounded-full bg-black/50 p-2"><ChevronLeft/></button><button onClick={()=>move(1)} aria-label="다음 사진" className="absolute right-1 top-1/2 rounded-full bg-black/50 p-2"><ChevronRight/></button></>}</div>
      {showInfo&&<div className="max-h-40 overflow-y-auto bg-zinc-900 px-4 py-3 text-xs leading-6"><p>{current.alt||'사진'}</p>{current.description&&<p>{current.description}</p>}<p>촬영: {current.takenAt.replace('T',' ')}</p>{current.location&&<p>위치: {current.location}</p>}{albumsOf(current).length>0&&<p>앨범: {albumsOf(current).join(', ')}</p>}</div>}
      <footer className="flex shrink-0 justify-around border-t border-white/15 bg-zinc-950 px-2 py-3">
        {section==='deleted' ? <><Action icon={<RotateCcw/>} label="복원" onClick={()=>restore(current.id)}/><Action icon={<Trash2/>} label="완전 삭제" onClick={()=>purge(current.id)}/></> : <><Action icon={<Heart fill={isFavorite(current)?'#f43f5e':'none'} color={isFavorite(current)?'#f43f5e':'white'}/>} label="즐겨찾기" onClick={()=>toggleFavorite(current)}/><Action icon={isHidden(current)?<Check/>:<EyeOff/>} label={isHidden(current)?'숨김 해제':'숨기기'} onClick={()=>toggleHidden(current)}/><Action icon={<Trash2/>} label="삭제" onClick={()=>deletePhoto(current.id)}/></>}
      </footer>
    </div>}
  </section>
}
function PhotoCover({photo}:{photo?:Photo}){const [error,setError]=useState(false);return photo?.src&&!error?<img src={photo.src} alt={photo.alt||''} onError={()=>setError(true)} className="h-full w-full object-cover"/>:<div className="flex h-full items-center justify-center text-zinc-400"><ImageOff/></div>}
function PhotoViewer({photo}:{photo:Photo}){const [error,setError]=useState(false);useEffect(()=>setError(false),[photo.id]);return photo.src&&!error?<img src={photo.src} alt={photo.alt||'사진'} onError={()=>setError(true)} className="max-h-full max-w-full object-contain"/>:<div className="flex flex-col items-center gap-2 text-zinc-400"><ImageOff size={40}/><span className="text-xs">이미지를 불러올 수 없습니다.</span></div>}
function Tab({icon,label,active,onClick}:{icon:ReactNode;label:string;active:boolean;onClick:()=>void}){return <button onClick={onClick} className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs ${active?'text-blue-600':'text-zinc-500'}`}>{icon}{label}</button>}
function Action({icon,label,onClick}:{icon:ReactNode;label:string;onClick:()=>void}){return <button onClick={onClick} className="flex min-w-16 flex-col items-center gap-1 text-[11px]">{icon}{label}</button>}
