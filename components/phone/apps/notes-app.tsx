'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Search, Plus, Pin, LockKeyhole, Trash2, Save, Folder, Menu, MoreVertical, BookOpen, CheckSquare, Type, Sparkles, PenLine, ChevronDown } from 'lucide-react'
import type { Note } from '@/lib/phone/content-types'
import { useEpisode, episodeStorageKey } from '../episode-provider'
import { usePhone } from '../phone-provider'

const KEY = 'virtual-phone:notes:v1'
const NOTE_PASSWORD = '0417'
type NoteWithLock = Note & { isLocked?: boolean; content?: string }
const noteLocked = (note: NoteWithLock) => Boolean(note.isLocked ?? note.locked)
const noteBody = (note: NoteWithLock) => note.body ?? note.content ?? ''
const displayDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}
type NoteStore = { changes: Record<string, Note>; removed: string[] }
const emptyStore = (): NoteStore => ({ changes: {}, removed: [] })
const dateLabel = (value: string) => { const d = new Date(value); return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' }) }

export function NotesApp() {
  const { goHome, back } = usePhone()
  const { episode, content } = useEpisode()
  const key = episodeStorageKey(KEY, episode.id)
  const NOTES = (content.notes ?? []) as NoteWithLock[]
  const [store, setStore] = useState<NoteStore>(emptyStore)
  const [ready, setReady] = useState(false)
  const [folder, setFolder] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<NoteWithLock | null>(null)
  const [unlocked, setUnlocked] = useState<string[]>([])
  const [unlockInput, setUnlockInput] = useState('')
  const [unlockError, setUnlockError] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    setReady(false)
    setStore(emptyStore())
    setFolder(null)
    setSearch("")
    setMenuOpen(false)
    setSearchOpen(false)
    setSelected(null)
    setEditing(false)
    setDraft(null)
    setUnlocked([])
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const data = JSON.parse(saved)
        if (data && typeof data === 'object') setStore({ changes: data.changes ?? {}, removed: Array.isArray(data.removed) ? data.removed : [] })
      }
    } catch { /* Browser storage can be unavailable. */ }
    setReady(true)
  }, [key])
  useEffect(() => { if (ready) try { localStorage.setItem(key, JSON.stringify(store)) } catch { /* Keep edits in memory. */ } }, [store, ready])

  const notes = useMemo(() => {
    const merged = new Map(NOTES.map(note => [note.id, note]))
    Object.values(store.changes).forEach(note => merged.set(note.id, note))
    return [...merged.values()].filter(note => !store.removed.includes(note.id)).sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt))
  }, [store, NOTES])
  const folders = useMemo(() => [...new Set(notes.map(note => note.folder || '기타'))].sort((a, b) => a.localeCompare(b, 'ko')), [notes])
  const filtered = notes.filter(note => (folder === null || (note.folder || '기타') === folder) && `${note.title} ${noteLocked(note) ? '' : noteBody(note)}`.toLowerCase().includes(search.toLowerCase()))
  const current = notes.find(note => note.id === selected)
  const isLocked = Boolean(current && noteLocked(current) && !unlocked.includes(current.id))
  const goBack = () => {
    if (editing) { setEditing(false); setDraft(null) }
    else if (selected) { setSelected(null); setUnlocked([]); setUnlockInput(''); setUnlockError(false) }
    else if (folder !== null) setFolder(null)
    else back()
  }
  const open = (id: string) => { setSelected(id); setUnlocked([]); setEditing(false); setUnlockInput(''); setUnlockError(false) }
  const startNew = () => {
    const now = new Date().toISOString()
    const newNote: Note = { id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: '', body: '', createdAt: now, updatedAt: now, folder: folder || undefined }
    setDraft(newNote); setSelected(newNote.id); setEditing(true)
  }
  const startEdit = () => { if (current) { setDraft({ ...current, body: noteBody(current) }); setEditing(true) } }
  const save = () => {
    if (!draft) return
    const updated = { ...draft, title: draft.title.trim() || '제목 없음', updatedAt: new Date().toISOString(), isLocked: Boolean(draft.locked) }
    setStore(prev => ({ ...prev, changes: { ...prev.changes, [updated.id]: updated } }))
    setSelected(updated.id); setDraft(null); setEditing(false)
  }
  const remove = () => {
    if (!current || !window.confirm('이 메모를 삭제할까요?')) return
    setStore(prev => ({ ...prev, removed: [...new Set([...prev.removed, current.id])] }))
    setSelected(null); setEditing(false)
  }
  const togglePinned = () => { if (current) setStore(prev => ({ ...prev, changes: { ...prev.changes, [current.id]: { ...current, pinned: !current.pinned, updatedAt: new Date().toISOString() } } })) }
  const unlock = () => {
    if (!current) return
    if (unlockInput === NOTE_PASSWORD) { setUnlocked([current.id]); setUnlockInput(''); setUnlockError(false) }
    else setUnlockError(true)
  }
  const grouped = filtered.reduce<Record<string, NoteWithLock[]>>((acc, note) => {
    const raw = note.updatedAt || note.createdAt
    const year = raw?.slice(0, 4) || '기타'
    const key = year === '2026' ? `${Number(raw.slice(5, 7))}월` : `${year}년`
    ;(acc[key] ??= []).push(note)
    return acc
  }, {})
  return <section className="relative flex h-full min-h-0 flex-col bg-[#fafafa] text-[#171717]">
    <header className="flex h-[68px] shrink-0 items-center gap-3 bg-[#fafafa] px-4">
      {selected || editing ? <button type="button" onClick={goBack} aria-label="뒤로" className="p-1"><ArrowLeft size={27} strokeWidth={1.8}/></button> : <button type="button" onClick={() => setMenuOpen(v => !v)} aria-label="메뉴" className="p-1"><Menu size={27} strokeWidth={1.8}/></button>}
      {editing && draft ? <input aria-label="메모 제목" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="제목" className="min-w-0 flex-1 bg-transparent text-[23px] font-medium outline-none"/> : <h1 className={`min-w-0 flex-1 truncate ${selected ? 'text-[23px] text-zinc-400' : 'text-[25px] font-bold'}`}>{selected ? '제목' : folder || '모든 노트'}</h1>}
      {selected ? <><button type="button" aria-label="메모 고정" onClick={togglePinned} className="p-1"><BookOpen size={24}/></button><button type="button" aria-label="편집" onClick={editing ? save : startEdit} className="p-1">{editing ? <Save size={25}/> : <PenLine size={24}/>}</button><button type="button" aria-label="메뉴" onClick={()=>setMenuOpen(v=>!v)} className="p-1"><MoreVertical size={24}/></button></> : <><button type="button" aria-label="검색" onClick={()=>setSearchOpen(v=>!v)} className="p-1"><Search size={27}/></button><button type="button" aria-label="메뉴" onClick={()=>setMenuOpen(v=>!v)} className="p-1"><MoreVertical size={24}/></button></>}
    </header>
    {menuOpen && <div className="absolute right-3 top-[60px] z-30 min-w-44 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
      {!selected && <><button type="button" onClick={()=>{setFolder(null);setMenuOpen(false)}} className="block w-full rounded-lg px-3 py-2 text-left text-sm">모든 노트</button>{folders.map(name=><button type="button" key={name} onClick={()=>{setFolder(name);setMenuOpen(false)}} className="block w-full rounded-lg px-3 py-2 text-left text-sm">{name}</button>)}</>}
      {selected && !editing && <><button type="button" onClick={()=>{setMenuOpen(false);startEdit()}} className="block w-full px-3 py-2 text-left text-sm">편집 / 분류 변경</button><button type="button" onClick={()=>{setMenuOpen(false);remove()}} className="block w-full px-3 py-2 text-left text-sm text-red-600">삭제</button></>}
      {editing && <button type="button" onClick={()=>{setMenuOpen(false);save()}} className="block w-full px-3 py-2 text-left text-sm">저장</button>}
    </div>}
    {editing && draft ? <div className="flex min-h-0 flex-1 flex-col bg-[#fafafa]">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-6">
        <textarea aria-label="메모 본문" value={draft.body} onChange={e=>setDraft({...draft,body:e.target.value})} placeholder="내용을 입력하세요" className="min-h-[65%] w-full resize-none bg-transparent text-[19px] leading-[1.65] outline-none"/>
        <label className="mt-3 block text-sm text-zinc-500">분류 / 폴더<input aria-label="메모 폴더" value={draft.folder || ''} onChange={e=>setDraft({...draft,folder:e.target.value||undefined})} placeholder="폴더 이름" className="mt-2 w-full rounded-xl border border-zinc-200 bg-white p-3 text-base text-zinc-900 outline-none"/></label>
        <div className="mt-4 flex gap-5 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(draft.pinned)} onChange={e=>setDraft({...draft,pinned:e.target.checked})}/>고정</label><label className="flex items-center gap-2"><input type="checkbox" checked={noteLocked(draft)} onChange={e=>setDraft({...draft,locked:e.target.checked,isLocked:e.target.checked})}/>잠금</label></div>
      </div><div className="flex shrink-0 items-center justify-between border-t border-zinc-200 bg-white px-5 py-3"><span className="text-sm text-zinc-500">메모 편집</span><button type="button" onClick={save} className="rounded-full bg-[#e8e8e8] px-6 py-2 font-medium">완료</button></div>
    </div> : current ? isLocked ? <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-[#fafafa] px-8">
      <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-[#ededed]"><LockKeyhole size={38} className="text-zinc-500"/></div><h2 className="text-xl font-semibold">잠긴 노트</h2><p className="mt-2 text-sm text-zinc-500">비밀번호 4자리를 입력하세요</p>
      <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4} autoComplete="off" aria-label="메모 암호" value={unlockInput} onChange={e=>{const value=e.target.value.replace(/\D/g,'').slice(0,4);setUnlockInput(value);setUnlockError(value.length===4&&value!==NOTE_PASSWORD);if(value===NOTE_PASSWORD&&current){setUnlocked([current.id]);setUnlockInput('');setUnlockError(false)}}} onKeyDown={e=>{if(e.key==='Enter')unlock()}} className="mt-7 w-full max-w-[240px] border-b-2 border-zinc-400 bg-transparent py-3 text-center text-2xl tracking-[0.8em] outline-none focus:border-blue-500" placeholder="••••"/>
      {unlockError&&<p className="mt-3 text-sm text-red-600">비밀번호가 일치하지 않습니다.</p>}
    </div> : <div className="flex min-h-0 flex-1 flex-col bg-[#fafafa]">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-10">
        <div className="whitespace-pre-wrap break-words text-[19px] leading-[1.7]">{noteBody(current)}</div>
      </div>
      <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 bg-white px-4 py-3 text-zinc-600"><button type="button" aria-label="편집" onClick={startEdit}><PenLine size={24}/></button><button type="button" aria-label="체크리스트 편집" onClick={startEdit}><CheckSquare size={24}/></button><button type="button" aria-label="글자 편집" onClick={startEdit}><Type size={25}/></button><button type="button" aria-label="서식 편집" onClick={startEdit} className="flex items-center gap-1 text-xl">Aa<ChevronDown size={13}/></button><button type="button" aria-label="메모 편집" onClick={startEdit}><Sparkles size={24}/></button></div>
    </div> : <>
      {searchOpen&&<label className="mx-4 my-2 flex items-center gap-2 rounded-xl bg-[#eee] px-3 py-2"><Search size={18}/><input aria-label="메모 검색" value={search} onChange={e=>setSearch(e.target.value)} placeholder="메모 검색" className="min-w-0 flex-1 bg-transparent outline-none"/></label>}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-20 pt-5">
        {Object.entries(grouped).map(([group,items])=><div key={group} className="mb-9"><h2 className="mb-4 px-2 text-[17px] font-semibold">{group}</h2><div className="grid grid-cols-2 gap-x-3 gap-y-6">{items.map(note=><button type="button" key={note.id} onClick={()=>open(note.id)} className="min-w-0 text-center"><div className="flex aspect-[1.02] flex-col overflow-hidden rounded-[19px] border border-zinc-200 bg-gradient-to-br from-[#f5f5f6] to-white p-4 text-left shadow-sm">{noteLocked(note)?<div className="flex h-full items-center justify-center"><LockKeyhole size={34} className="text-zinc-400" fill="#aaa" stroke="white"/></div>:<p className="line-clamp-[7] whitespace-pre-wrap break-words text-[13px] leading-[1.55]">{noteBody(note)||note.title}</p>}</div><p className="mt-3 truncate px-1 text-[15px] font-semibold">{note.title}</p><p className="mt-1 text-xs text-zinc-400">{dateLabel(note.updatedAt||note.createdAt)}</p></button>)}</div></div>)}
        {!filtered.length&&<p className="py-12 text-center text-sm text-zinc-500">표시할 메모가 없습니다.</p>}
      </div><button type="button" onClick={startNew} aria-label="새 메모" className="absolute bottom-5 right-5 flex size-[62px] items-center justify-center rounded-full bg-[#dedede] text-[#ef4145] shadow-lg"><PenLine size={27}/></button>
    </>}
  </section>
}
