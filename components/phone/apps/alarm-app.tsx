'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlarmClock, ArrowLeft, Check, Plus, Trash2, X } from 'lucide-react'
import { useEpisode, episodeStorageKey } from '../episode-provider'
import { usePhone } from '../phone-provider'
import type { Alarm } from '@/content/episodes/types'

const STORE_KEY = 'virtual-phone:alarms:v1'
const DAYS = [
  { id: 'mon', label: '월' }, { id: 'tue', label: '화' }, { id: 'wed', label: '수' },
  { id: 'thu', label: '목' }, { id: 'fri', label: '금' }, { id: 'sat', label: '토' }, { id: 'sun', label: '일' },
] as const
const blankAlarm = (): Alarm => ({
  id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  time: '07:00', label: '', repeatDays: [], enabled: true,
})
const timeValid = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
const orderDays = (days: string[]) => DAYS.filter(day => days.includes(day.id)).map(day => day.id)
const repeatText = (days: string[]) => {
  if (!days.length) return '한 번만'
  if (days.length === 7) return '매일'
  if (days.length === 5 && ['mon','tue','wed','thu','fri'].every(day => days.includes(day))) return '평일'
  if (days.length === 2 && ['sat','sun'].every(day => days.includes(day))) return '주말'
  return DAYS.filter(day => days.includes(day.id)).map(day => day.label).join(' · ')
}

type SavedAlarms = { changes: Record<string, Alarm>; removed: string[] }
const emptySaved = (): SavedAlarms => ({ changes: {}, removed: [] })

export function AlarmApp() {
  const { back, goHome } = usePhone()
  const { episode, content } = useEpisode()
  const storageKey = episodeStorageKey(STORE_KEY, episode.id)
  const [saved, setSaved] = useState<SavedAlarms>(emptySaved)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [editing, setEditing] = useState<Alarm | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let next = emptySaved()
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          next = {
            changes: parsed.changes && typeof parsed.changes === 'object' && !Array.isArray(parsed.changes) ? parsed.changes : {},
            removed: Array.isArray(parsed.removed) ? parsed.removed : [],
          }
        }
      }
    } catch { /* Storage is optional. */ }
    setSaved(next)
    setLoadedKey(storageKey)
    setEditing(null)
    setError('')
  }, [storageKey])

  useEffect(() => {
    if (loadedKey !== storageKey) return
    try { window.localStorage.setItem(storageKey, JSON.stringify(saved)) } catch { /* Keep edits in memory. */ }
  }, [saved, loadedKey, storageKey])

  const alarms = useMemo(() => {
    const merged = new Map<string, Alarm>((content.alarms ?? []).map(alarm => [alarm.id, alarm]))
    Object.values(saved.changes).forEach(alarm => merged.set(alarm.id, alarm))
    return [...merged.values()].filter(alarm => !saved.removed.includes(alarm.id))
      .sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id))
  }, [content.alarms, saved])

  const updateAlarm = (alarm: Alarm) => setSaved(prev => ({
    changes: { ...prev.changes, [alarm.id]: alarm },
    removed: prev.removed.filter(id => id !== alarm.id),
  }))
  const deleteAlarm = (id: string) => {
    setSaved(prev => {
      const changes = { ...prev.changes }
      delete changes[id]
      return { changes, removed: [...new Set([...prev.removed, id])] }
    })
    setEditing(null)
  }
  const closeEditor = () => { setEditing(null); setError('') }
  const saveEditor = () => {
    if (!editing) return
    if (!timeValid(editing.time)) { setError('시간을 HH:mm 형식으로 입력해 주세요.'); return }
    updateAlarm({ ...editing, repeatDays: orderDays(editing.repeatDays), label: editing.label.trim() })
    closeEditor()
  }
  const openNew = () => { setEditing(blankAlarm()); setIsNew(true); setError('') }
  const openExisting = (alarm: Alarm) => { setEditing({ ...alarm, repeatDays: [...alarm.repeatDays] }); setIsNew(false); setError('') }

  return (
    <section aria-label="알람" className="flex h-full min-h-0 flex-col bg-[#0f1014] text-white">
      <header className="flex h-14 shrink-0 items-center gap-2 px-3">
        <button type="button" aria-label="뒤로 가기" onClick={editing ? closeEditor : back} className="flex size-10 items-center justify-center rounded-full hover:bg-white/10"><ArrowLeft size={23}/></button>
        <h1 className="flex-1 text-lg font-semibold">{editing ? (isNew ? '알람 추가' : '알람 편집') : '알람'}</h1>
        <button type="button" aria-label="홈으로" onClick={goHome} className="rounded-full px-3 py-2 text-xs text-white/60">홈</button>
      </header>

      {editing ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-7">
          <div className="mt-7 rounded-3xl bg-[#1c1d23] p-5">
            <label htmlFor="alarm-time" className="mb-3 block text-sm text-white/60">시간 (24시간제)</label>
            <input id="alarm-time" type="time" step="60" value={editing.time} onChange={e => { setEditing({ ...editing, time: e.target.value }); setError('') }} className="w-full rounded-2xl border border-white/10 bg-[#282a31] p-4 text-center text-4xl font-light tabular-nums text-white [color-scheme:dark]" />
            <label htmlFor="alarm-label" className="mb-2 mt-7 block text-sm text-white/60">알람 이름</label>
            <input id="alarm-label" type="text" maxLength={80} value={editing.label} onChange={e => setEditing({ ...editing, label: e.target.value })} placeholder="알람 이름 (선택)" className="w-full rounded-xl border border-white/10 bg-[#282a31] px-4 py-3 text-sm text-white outline-none focus:border-indigo-400" />
            <p className="mb-3 mt-7 text-sm text-white/60">반복</p>
            <div className="flex justify-between gap-1">
              {DAYS.map(day => {
                const selected = editing.repeatDays.includes(day.id)
                return <button key={day.id} type="button" aria-pressed={selected} onClick={() => setEditing({ ...editing, repeatDays: selected ? editing.repeatDays.filter(id => id !== day.id) : [...editing.repeatDays, day.id] })} className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${selected ? 'bg-[#a5b4fc] text-[#17182a]' : 'bg-[#33343b] text-white/75'}`}>{day.label}</button>
              })}
            </div>
            <p className="mt-3 text-xs text-white/45">{repeatText(editing.repeatDays)}</p>
            <label className="mt-7 flex items-center justify-between text-sm"><span>알람 켜기</span><input type="checkbox" checked={editing.enabled} onChange={e => setEditing({ ...editing, enabled: e.target.checked })} className="size-5 accent-indigo-400" /></label>
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
          <div className="mt-6 flex gap-3">
            {!isNew && <button type="button" onClick={() => deleteAlarm(editing.id)} className="flex size-12 items-center justify-center rounded-2xl bg-[#2a2228] text-red-300" aria-label="알람 삭제"><Trash2 size={20}/></button>}
            <button type="button" onClick={closeEditor} className="flex-1 rounded-2xl bg-white/10 py-3.5 text-sm font-semibold"><X size={16} className="mr-1 inline"/>취소</button>
            <button type="button" onClick={saveEditor} className="flex-1 rounded-2xl bg-[#a5b4fc] py-3.5 text-sm font-semibold text-[#17182a]"><Check size={16} className="mr-1 inline"/>저장</button>
          </div>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            <div className="mb-5 mt-5 flex items-center gap-2 text-sm text-white/50"><AlarmClock size={18}/> 알람 {alarms.length}개</div>
            {alarms.length === 0 && <div className="py-24 text-center text-sm text-white/45">등록된 알람이 없습니다.</div>}
            <div className="space-y-3">
              {alarms.map(alarm => (
                <div key={alarm.id} className="flex items-center gap-3 rounded-[22px] bg-[#1c1d23] px-4 py-5">
                  <button type="button" onClick={() => openExisting(alarm)} className="min-w-0 flex-1 text-left">
                    <div className={`text-[38px] font-light leading-none tabular-nums tracking-tight ${alarm.enabled ? 'text-white' : 'text-white/40'}`}>{alarm.time}</div>
                    <div className="mt-3 truncate text-sm text-white/75">{alarm.label || '알람'}</div>
                    <div className="mt-1 text-xs text-white/45">{repeatText(alarm.repeatDays)}</div>
                  </button>
                  <button type="button" role="switch" aria-checked={alarm.enabled} aria-label={`${alarm.label || alarm.time} 알람 ${alarm.enabled ? '끄기' : '켜기'}`} onClick={() => updateAlarm({ ...alarm, enabled: !alarm.enabled })} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${alarm.enabled ? 'bg-[#a5b4fc]' : 'bg-[#4a4b53]'}`}><span className={`absolute top-1 size-5 rounded-full transition-all ${alarm.enabled ? 'left-6 bg-[#202139]' : 'left-1 bg-white/80'}`}/></button>
                </div>
              ))}
            </div>
          </div>
          <div className="shrink-0 flex justify-center border-t border-white/5 bg-[#0f1014] px-5 py-3">
            <button type="button" onClick={openNew} aria-label="알람 추가" className="flex size-14 items-center justify-center rounded-full bg-[#a5b4fc] text-[#17182a] shadow-lg active:scale-95"><Plus size={28}/></button>
          </div>
        </>
      )}
    </section>
  )
}
