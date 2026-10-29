'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Home, Search, Plus, Pin, LockKeyhole, Trash2, Save, Folder, FileText } from 'lucide-react'
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

  useEffect(() => {
    setReady(false)
    setStore(emptyStore())
    setFolder(null)
    setSearch("")
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
  return <section className="flex h-full min-h-0 flex-col bg-[#fffdf5] text-zinc-900">
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-amber-100 px-3">
      <button type="button" onClick={goBack} aria-label="뒤로 가기" className="rounded-full p-2 hover:bg-amber-100"><ArrowLeft size={21}/></button>
      <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{editing ? '메모 편집' : selected ? '메모' : folder || '메모'}</h1>
      <button type="button" onClick={goHome} aria-label="홈으로" className="rounded-full p-2 hover:bg-amber-100"><Home size={20}/></button>
    </header>
    {editing && draft ? <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
      <input aria-label="메모 제목" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="제목" className="w-full rounded-lg border border-amber-200 bg-white p-3 text-lg font-semibold outline-amber-500" />
      <input aria-label="메모 폴더" value={draft.folder || ''} onChange={e => setDraft({ ...draft, folder: e.target.value || undefined })} placeholder="폴더 (선택)" className="w-full rounded-lg border border-amber-200 bg-white p-3 text-sm outline-amber-500" />
      <textarea aria-label="메모 본문" value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} placeholder="메모를 입력하세요" className="min-h-48 w-full flex-1 resize-none rounded-lg border border-amber-200 bg-white p-3 text-sm leading-7 outline-amber-500" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(draft.pinned)} onChange={e => setDraft({ ...draft, pinned: e.target.checked })}/> 상단에 고정</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={noteLocked(draft)} onChange={e => setDraft({ ...draft, locked: e.target.checked, isLocked: e.target.checked })}/> 잠긴 메모</label>
      {noteLocked(draft) && <p className="text-xs text-zinc-500">잠금 비밀번호는 4자리 숫자입니다.</p>}
      <p className="text-xs text-zinc-500">잠금은 이야기 연출용이며 실제 보안 기능이 아닙니다.</p>
      <button type="button" onClick={save} className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 p-3 font-semibold"><Save size={18}/> 저장</button>
    </div> : current ? isLocked ? <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6"><LockKeyhole size={40}/><p className="font-semibold">잠긴 메모</p><input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4} autoComplete="off" aria-label="메모 암호" value={unlockInput} onChange={e => { setUnlockInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setUnlockError(false) }} onKeyDown={e => { if (e.key === 'Enter') unlock() }} className="w-full rounded-lg border bg-white p-3 text-center text-xl tracking-[0.5em]" placeholder="••••"/>{unlockError && <p className="text-sm text-red-600">암호가 일치하지 않습니다.</p>}<button type="button" onClick={unlock} disabled={unlockInput.length !== 4} className="rounded-lg bg-amber-400 disabled:opacity-40 px-8 py-3">열기</button></div> : <div className="min-h-0 flex-1 overflow-y-auto p-5">
      <h2 className="break-words text-xl font-bold">{current.title}</h2><p className="mt-1 text-xs text-zinc-500">{displayDate(current.updatedAt || current.createdAt)} · {current.folder || '기타'}</p>
      <div className="mt-6 whitespace-pre-wrap break-words text-sm leading-7">{noteBody(current)}</div>
      <div className="mt-8 flex flex-wrap gap-2"><button type="button" onClick={startEdit} className="rounded-lg bg-amber-300 px-4 py-2 text-sm">편집</button><button type="button" onClick={togglePinned} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"><Pin size={15}/>{current.pinned ? '고정 해제' : '고정'}</button><button type="button" onClick={remove} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-red-600"><Trash2 size={15}/> 삭제</button></div>
    </div> : <>
      <label className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-amber-100 px-3 py-2"><Search size={17}/><input aria-label="메모 검색" value={search} onChange={e => setSearch(e.target.value)} placeholder="메모 검색" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></label>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        {folder === null && <div className="mb-4"><p className="mb-2 text-xs font-semibold text-zinc-500">폴더</p><div className="flex flex-wrap gap-2">{folders.map(name => <button type="button" key={name} onClick={() => setFolder(name)} className="flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-2 text-sm"><Folder size={15}/>{name} ({notes.filter(n => (n.folder || '기타') === name).length})</button>)}</div></div>}
        <p className="mb-2 text-xs font-semibold text-zinc-500">{folder || '모든 메모'} · {filtered.length}개</p>
        {filtered.map(note => <button type="button" key={note.id} onClick={() => open(note.id)} className="mb-2 flex w-full items-start gap-3 rounded-xl border border-amber-100 bg-white p-3 text-left shadow-sm"><FileText className="mt-1 shrink-0 text-amber-500" size={20}/><div className="min-w-0 flex-1"><div className="flex items-center gap-1 font-semibold">{note.pinned && <Pin size={13}/>}<span className="truncate">{note.title}</span>{noteLocked(note) && <LockKeyhole size={13}/>} </div><p className="mt-1 truncate text-xs text-zinc-500">{noteLocked(note) ? '잠긴 메모' : noteBody(note) || '내용 없음'}</p><p className="mt-1 text-[11px] text-zinc-400">{displayDate(note.updatedAt || note.createdAt)}</p></div></button>)}
        {!filtered.length && <p className="py-12 text-center text-sm text-zinc-500">표시할 메모가 없습니다.</p>}
      </div>
      <div className="flex shrink-0 justify-end border-t border-amber-100 p-3"><button type="button" onClick={startNew} className="flex items-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold"><Plus size={18}/> 새 메모</button></div>
    </>}
  </section>
}
