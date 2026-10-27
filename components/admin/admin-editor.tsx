'use client'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { CONTACTS } from '@/content/contacts'
import { KAKAO_ROOMS, KAKAO_PROFILES } from '@/content/kakao'
import { INSTAGRAM_PROFILE, INSTAGRAM_ACCOUNTS, INSTAGRAM_POSTS, INSTAGRAM_DMS, INSTAGRAM_STORIES } from '@/content/instagram'
import { PHOTOS } from '@/content/photos'
import { NOTES } from '@/content/notes'
import { CALL_LOG } from '@/content/calls'
import { SMS_THREADS } from '@/content/messages'
import { LOCK_NOTIFICATIONS } from '@/content/lock-notifications'
import { BROWSER_SEARCHES, BROWSER_RESULTS } from '@/content/browser'
import { EPISODES } from '@/content/episodes'
import type { Episode, EpisodeContent } from '@/content/episodes'

type Collection = keyof EpisodeContent
const keys: {key:Collection;label:string}[] = [
 {key:'contacts',label:'캐릭터·연락처'}, {key:'kakaoProfiles',label:'카카오 프로필'}, {key:'kakaoRooms',label:'카카오 채팅방·메시지'},
 {key:'instagramProfile',label:'내 인스타 프로필'}, {key:'instagramAccounts',label:'인스타 계정'}, {key:'instagramPosts',label:'인스타 게시물'},
 {key:'instagramDms',label:'인스타 DM'}, {key:'instagramStories',label:'스토리'}, {key:'photos',label:'사진·앨범'},
 {key:'browserSearches',label:'인터넷 검색 기록'}, {key:'browserResults',label:'가상 검색 결과'},
 {key:'notes',label:'메모'}, {key:'calls',label:'통화'}, {key:'smsThreads',label:'문자'}, {key:'notifications',label:'알림'},
]
const defaults: Required<EpisodeContent> = {contacts:CONTACTS,kakaoProfiles:KAKAO_PROFILES,kakaoRooms:KAKAO_ROOMS,instagramProfile:INSTAGRAM_PROFILE,instagramAccounts:INSTAGRAM_ACCOUNTS,instagramPosts:INSTAGRAM_POSTS,instagramDms:INSTAGRAM_DMS,instagramStories:INSTAGRAM_STORIES,photos:PHOTOS,notes:NOTES,calls:CALL_LOG,smsThreads:SMS_THREADS,notifications:LOCK_NOTIFICATIONS,browserSearches:BROWSER_SEARCHES,browserResults:BROWSER_RESULTS}
const initialEpisodes = EPISODES.map(e=>structuredClone(e))
const draftKey='virtual-phone:admin-draft:v1'
const makeId=()=>`new-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`
const isRecord=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v)
const stringify=(v:unknown)=>JSON.stringify(v,null,2)
const download=(name:string,content:string)=>{const a=document.createElement('a');const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export function AdminEditor(){
 const [episodes,setEpisodes]=useState<Episode[]>(initialEpisodes)
 const [epId,setEpId]=useState(EPISODES[0]?.id||'ep01')
 const [section,setSection]=useState<Collection>('kakaoRooms')
 const [selected,setSelected]=useState(0)
 const [raw,setRaw]=useState('')
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 const [showRaw,setShowRaw]=useState(false)
 const [assets,setAssets]=useState<Record<string,string>>({})
 const iframe=useRef<HTMLIFrameElement>(null)
 const fileInput=useRef<HTMLInputElement>(null)
 const episode=episodes.find(e=>e.id===epId)??episodes[0]
 const content=useMemo(()=>({...defaults,...episode?.content}),[episode])
 const value=content[section]
 const items=Array.isArray(value)?value: [value]
 const current=items[selected]??null
 const apply=(next:unknown)=>{
  setEpisodes(old=>old.map(ep=>ep.id===epId?{...ep,content:{...ep.content,[section]:next}}:ep))
  setError('');setNotice('변경 내용이 미리보기에 반영됩니다. 배포하려면 JSON을 내보내세요.')
 }
 const changeItem=(next:unknown)=>{if(Array.isArray(value)){const list=[...value];list[selected]=next;apply(list)}else apply(next)}
 const preview=()=>iframe.current?.contentWindow?.postMessage({type:'virtual-phone-admin-preview',episode,content},window.location.origin)
 useEffect(()=>{try{const saved=localStorage.getItem(draftKey);if(saved){const parsed=JSON.parse(saved);if(Array.isArray(parsed.episodes)&&parsed.episodes.length)setEpisodes(parsed.episodes);if(isRecord(parsed.assets))setAssets(parsed.assets as Record<string,string>)}}catch{}},[])
 useEffect(()=>{try{localStorage.setItem(draftKey,stringify({episodes,assets}))}catch{setNotice('브라우저 저장 용량 초과: JSON을 내보내 백업해 주세요.')}},[episodes,assets])
 useEffect(()=>{preview()},[episode,content])
 useEffect(()=>{setSelected(0);setError('');setRaw('')},[section,epId])
 useEffect(()=>{setRaw(stringify(current))},[current])
 const addItem=()=>{if(!Array.isArray(value))return;const template=isRecord(value[0])?Object.fromEntries(Object.keys(value[0]).map(k=>[k,k==='id'?makeId():Array.isArray(value[0][k])?[]:typeof value[0][k]==='boolean'?false:typeof value[0][k]==='number'?0:''])):{id:makeId()};apply([...value,template]);setSelected(value.length)}
 const removeItem=()=>{if(!Array.isArray(value)||!value.length)return;if(!confirm('선택한 항목을 편집본에서 삭제할까요? 원본 TypeScript 파일은 변경되지 않습니다.'))return;apply(value.filter((_,i)=>i!==selected));setSelected(0)}
 const onUpload=async(e:ChangeEvent<HTMLInputElement>)=>{const files=Array.from(e.target.files||[]);for(const file of files){if(!file.type.startsWith('image/'))continue;if(file.size>2*1024*1024){setError(`${file.name}: 2MB 이하 이미지만 편집기에 올릴 수 있어요.`);continue}const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('이미지 읽기 실패'));reader.readAsDataURL(file)});setAssets(a=>({...a,[file.name]:data}))}e.target.value=''}
 const importJson=async(e:ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;try{const parsed=JSON.parse(await file.text());if(!Array.isArray(parsed.episodes)||!parsed.episodes.every((ep:unknown)=>isRecord(ep)&&typeof ep.id==='string'&&isRecord(ep.content)))throw Error('episodes 배열 형식이 아닙니다.');if(!confirm('현재 편집본을 가져온 JSON으로 교체할까요?'))return;setEpisodes(parsed.episodes);setEpId(parsed.episodes[0].id);setAssets(isRecord(parsed.assets)?parsed.assets:{});setNotice('JSON을 가져왔습니다. 원본 소스 파일은 변경되지 않았습니다.')}catch(err){setError(`가져오기 실패: ${String(err)}`)}e.target.value=''}
 const setEp=(patch:Partial<Episode>)=>setEpisodes(old=>old.map(ep=>ep.id===epId?{...ep,...patch}:ep))
 return <main className="min-h-dvh bg-[#111318] text-zinc-100">
 <header className="flex flex-wrap items-center gap-3 border-b border-white/10 p-4"><h1 className="mr-auto text-xl font-bold">스마트폰 콘텐츠 관리자</h1><a href="/" target="_blank" rel="noreferrer" className="rounded bg-zinc-800 px-3 py-2">독자 화면</a><button className="rounded bg-zinc-800 px-3 py-2" onClick={async()=>{await fetch('/api/admin/logout',{method:'POST'});location.reload()}}>로그아웃</button></header>
 <div className="flex flex-wrap gap-2 border-b border-white/10 p-3 text-sm"><button className="rounded bg-blue-600 px-3 py-2" onClick={()=>download('phone-content-export.json',stringify({format:'virtual-phone-content-v1',episodes,assets}))}>전체 JSON 내보내기</button><label className="cursor-pointer rounded bg-zinc-700 px-3 py-2">JSON 가져오기<input type="file" accept=".json,application/json" hidden onChange={importJson}/></label><button className="rounded bg-zinc-800 px-3 py-2" onClick={()=>{if(confirm('편집본을 지우고 원본 데이터로 되돌릴까요?')){setEpisodes(initialEpisodes);setAssets({});setEpId(initialEpisodes[0].id)}}}>편집본 초기화</button><span className="self-center text-xs text-amber-300">브라우저 초안 저장 · 원본 TS 파일 자동 수정 안 됨</span></div>
 {error&&<p role="alert" className="bg-red-950 px-4 py-2 text-sm text-red-200">{error}</p>}{notice&&<p role="status" className="px-4 py-2 text-xs text-emerald-300">{notice}</p>}
 <div className="grid min-h-[80vh] gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_420px]">
 <div className="min-w-0 space-y-4">
 <section className="rounded-xl border border-white/10 p-4"><div className="mb-3 flex flex-wrap items-center gap-2"><label>에피소드 <select className="rounded bg-zinc-800 p-2" value={epId} onChange={e=>setEpId(e.target.value)}>{episodes.map(ep=><option key={ep.id} value={ep.id}>{ep.title} ({ep.id})</option>)}</select></label><button className="rounded bg-zinc-800 px-3 py-2" onClick={()=>{const id=prompt('새 에피소드 ID (예: ep04)');if(!id||!/^[a-zA-Z0-9_-]+$/.test(id)||episodes.some(e=>e.id===id)){setError('사용할 수 없는 ID입니다.');return}setEpisodes(old=>[...old,{id,title:id.toUpperCase(),dateTime:new Date().toISOString().slice(0,16),characterIds:[],content:Object.fromEntries(keys.filter(k=>k.key!=='instagramProfile').map(k=>[k.key,[]]))} as Episode]);setEpId(id)}}>+ 에피소드</button></div>
 <div className="grid gap-2 sm:grid-cols-2">{(['title','dateTime','lockWallpaper','homeWallpaper'] as const).map(key=><label key={key} className="text-xs text-zinc-400">{key}<input className="mt-1 w-full rounded bg-zinc-800 p-2 text-sm text-white" value={String(episode?.[key]||'')} onChange={e=>setEp({[key]:e.target.value})}/></label>)}</div><label className="mt-3 block text-xs text-zinc-400">등장 캐릭터 ID (쉼표로 구분)<input className="mt-1 w-full rounded bg-zinc-800 p-2 text-white" value={episode?.characterIds.join(', ')||''} onChange={e=>setEp({characterIds:e.target.value.split(',').map(v=>v.trim()).filter(Boolean)})}/></label></section>
 <section className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap gap-2">{keys.map(k=><button key={k.key} onClick={()=>setSection(k.key)} className={`rounded-lg px-3 py-2 text-sm ${section===k.key?'bg-blue-600':'bg-zinc-800 hover:bg-zinc-700'}`}>{k.label}</button>)}</div></section>
 <section className="rounded-xl border border-white/10 p-4"><div className="mb-3 flex flex-wrap items-center gap-2"><h2 className="mr-auto font-semibold">{keys.find(k=>k.key===section)?.label} ({items.length})</h2>{Array.isArray(value)&&<><button className="rounded bg-zinc-700 px-3 py-2 text-sm" onClick={addItem}>+ 항목 추가</button><button className="rounded bg-red-900 px-3 py-2 text-sm" onClick={removeItem}>항목 삭제</button></>}<button className="rounded bg-zinc-700 px-3 py-2 text-sm" onClick={()=>setShowRaw(!showRaw)}>{showRaw?'필드 편집':'JSON 편집'}</button></div>
 {Array.isArray(value)&&<select className="mb-4 w-full rounded bg-zinc-800 p-2" value={Math.min(selected,Math.max(0,items.length-1))} onChange={e=>setSelected(Number(e.target.value))}>{items.map((v,i)=><option key={i} value={i}>{i+1}. {isRecord(v)?String(v.title||v.name||v.displayName||v.username||v.id||'항목'):String(v)}</option>)}</select>}
 {section === 'kakaoRooms' && isRecord(current) && <div className="mb-4 rounded-lg border border-amber-400/20 bg-zinc-900 p-3"><label className="block text-xs text-zinc-300">채팅방 배경 이미지 경로 (public/ 기준 /images/... 또는 이미지 URL)<input className="mt-2 w-full rounded bg-zinc-800 p-2 text-sm" value={String(current.backgroundImage || current.wallpaper || '')} onChange={e=>changeItem({...current,backgroundImage:e.target.value})} placeholder="/images/photos/chat-wallpaper.jpg"/></label><p className="mt-2 text-xs text-zinc-400">이미지 업로드는 아래에서 미리보기용 데이터 URL로 제공돼. 배포 시 원본 이미지 파일을 public/ 폴더에 넣고 이 경로를 지정해 줘.</p></div>}
 {!items.length?<p className="text-zinc-400">데이터가 비어 있어. 항목을 추가해서 편집해 줘.</p>:showRaw?<><textarea spellCheck={false} className="h-80 w-full rounded bg-zinc-950 p-3 font-mono text-xs" value={raw} onChange={e=>setRaw(e.target.value)}/><button className="mt-2 rounded bg-blue-600 px-4 py-2" onClick={()=>{try{changeItem(JSON.parse(raw))}catch(err){setError(`JSON 형식 오류: ${String(err)}`)}}}>JSON 적용</button></>:isRecord(current)?<div className="space-y-3">{Object.entries(current).map(([key,v])=><label key={key} className="block text-xs text-zinc-400">{key}{typeof v==='boolean'?<input type="checkbox" className="ml-3" checked={v} onChange={e=>changeItem({...current,[key]:e.target.checked})}/>:typeof v==='number'?<input type="number" className="mt-1 w-full rounded bg-zinc-800 p-2 text-sm text-white" value={v} onChange={e=>changeItem({...current,[key]:Number(e.target.value)})}/>:typeof v==='string'?<textarea rows={key==='body'||key==='text'||key==='caption'?4:1} className="mt-1 w-full rounded bg-zinc-800 p-2 text-sm text-white" value={v} onChange={e=>changeItem({...current,[key]:e.target.value})}/>:<textarea spellCheck={false} rows={5} className="mt-1 w-full rounded bg-zinc-800 p-2 font-mono text-xs text-white" defaultValue={stringify(v)} key={`${section}-${selected}-${key}`} onBlur={e=>{try{changeItem({...current,[key]:JSON.parse(e.target.value)})}catch{setError(`${key} 필드 JSON 형식을 확인해 줘.`)}}}/>}</label>)}<p className="text-xs text-zinc-400">없는 필드·중첩 메시지·하이라이트·앨범 관계는 JSON 편집에서 추가할 수 있어.</p></div>:<p className="text-sm text-zinc-400">항목을 선택해 줘.</p>}
 </section>
 <section className="rounded-xl border border-white/10 p-4"><h2 className="mb-2 font-semibold">이미지 업로드·검사</h2><p className="mb-3 text-xs text-zinc-400">2MB 이하 이미지의 임시 데이터 URL을 생성해 미리보기와 JSON 내보내기에 포함해. 실제 public/ 폴더에 저장되지는 않아.</p><input ref={fileInput} type="file" multiple accept="image/*" onChange={onUpload}/><div className="mt-3 grid grid-cols-2 gap-2">{Object.entries(assets).map(([name,url])=><div key={name} className="rounded bg-zinc-800 p-2"><img src={url} alt={name} className="h-24 w-full object-contain"/><p className="break-all text-xs">{name}</p><button className="text-xs text-red-300" onClick={()=>setAssets(a=>{const n={...a};delete n[name];return n})}>제거</button></div>)}</div><button className="mt-3 rounded bg-zinc-800 px-3 py-2 text-sm" onClick={()=>{const paths=[...JSON.stringify(episodes).matchAll(/\/(?:images|uploads)\/[^"\\\s]+/g)].map(x=>x[0]);setNotice(`이미지 경로 ${new Set(paths).size}개 발견. 파일 실존 여부는 내보낸 경로와 public/ 폴더를 대조해 확인해야 해.`)}}>이미지 경로 목록 검사</button></section>
 </div>
 <aside className="min-w-0"><div className="sticky top-3 rounded-xl border border-white/10 bg-zinc-900 p-3"><div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">실제 스마트폰 미리보기</h2><button className="rounded bg-zinc-700 px-3 py-1 text-xs" onClick={preview}>새로 반영</button></div><p className="mb-3 text-xs text-zinc-400">선택한 에피소드의 데이터를 화면에 전달해. 채팅방 등을 직접 열어 확인해 줘.</p><iframe ref={iframe} onLoad={preview} title="스마트폰 콘텐츠 미리보기" src="/?adminPreview=1" className="h-[740px] w-full rounded-2xl border border-zinc-700 bg-black"/></div></aside>
 </div>
 </main>
}
