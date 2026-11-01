'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlarmClock, ArrowLeft, Check, Plus, Trash2, X, Globe2, Timer, Hourglass, MoreVertical } from 'lucide-react'
import { useEpisode, episodeStorageKey } from '../episode-provider'
import { usePhone } from '../phone-provider'
import type { Alarm } from '@/content/episodes/types'
import ep02Alarms from '@/content/alarms/ep02.json'
import ep03Alarms from '@/content/alarms/ep03.json'

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
    // 알람은 누적 기록이 아니라 에피소드별 현재 상태입니다.
    // EP02 이후에는 각 에피소드 JSON을 우선하고, 공통 기상 알람만 이어받습니다.
    const wakeUp = (content.alarms ?? []).filter(alarm => alarm.label === '일어나라' && alarm.time === '07:30').slice(-1)
    const episodeAlarms: Alarm[] = episode.id === 'ep02' ? ep02Alarms.alarms : episode.id === 'ep03' ? ep03Alarms.alarms : []
    const initial: Alarm[] = episode.id === 'ep01' ? (content.alarms ?? []) : [
      ...wakeUp.filter(alarm => !episodeAlarms.some(current => current.label === alarm.label && current.time === alarm.time)),
      ...episodeAlarms,
    ]
    const merged = new Map<string, Alarm>(initial.map(alarm => [alarm.id, alarm]))
    Object.values(saved.changes).forEach(alarm => merged.set(alarm.id, alarm))
    return [...merged.values()].filter(alarm => !saved.removed.includes(alarm.id))
      .sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id))
  }, [content.alarms, saved, episode.id])

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
    <section aria-label="알람" className="flex h-full min-h-0 flex-col bg-[#eef0f5] text-black">
      <header className="flex h-14 shrink-0 items-center gap-2 px-3">
        <button type="button" aria-label="뒤로 가기" onClick={editing ? closeEditor : back} className="flex size-10 items-center justify-center rounded-full hover:bg-white/10"><ArrowLeft size={23}/></button>
        <h1 className="flex-1 text-lg font-semibold">{editing ? (isNew ? '알람 추가' : '알람 편집') : '알람'}</h1>
        <button type="button" aria-label="홈으로" onClick={goHome} className="rounded-full px-3 py-2 text-xs text-zinc-500">홈</button>
      </header>

      {editing ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-7">
          <div className="mt-7 rounded-3xl bg-white p-5">
            <label htmlFor="alarm-time" className="mb-3 block text-sm text-zinc-500">시간 (24시간제)</label>
            <div className="flex items-center justify-center gap-4 py-8 text-5xl tabular-nums"><input aria-label="시" type="number" min="0" max="23" value={Number(editing.time.split(':')[0])} onChange={e=>setEditing({...editing,time:`${String(Math.max(0,Math.min(23,Number(e.target.value)))).padStart(2,'0')}:${editing.time.split(':')[1]}`})} className="w-24 bg-transparent text-center outline-none"/><span>:</span><input aria-label="분" type="number" min="0" max="59" value={Number(editing.time.split(':')[1])} onChange={e=>setEditing({...editing,time:`${editing.time.split(':')[0]}:${String(Math.max(0,Math.min(59,Number(e.target.value)))).padStart(2,'0')}`})} className="w-24 bg-transparent text-center outline-none"/></div>
            <label htmlFor="alarm-label" className="mb-2 mt-7 block text-sm text-zinc-500">알람 이름</label>
            <input id="alarm-label" type="text" maxLength={80} value={editing.label} onChange={e => setEditing({ ...editing, label: e.target.value })} placeholder="알람 이름 (선택)" className="w-full rounded-xl border border-zinc-200 bg-[#f4f5f8] px-4 py-3 text-sm text-black outline-none focus:border-indigo-400" />
            <p className="mb-3 mt-7 text-sm text-zinc-500">반복</p>
            <div className="flex justify-between gap-1">
              {DAYS.map(day => {
                const selected = editing.repeatDays.includes(day.id)
                return <button key={day.id} type="button" aria-pressed={selected} onClick={() => setEditing({ ...editing, repeatDays: selected ? editing.repeatDays.filter(id => id !== day.id) : [...editing.repeatDays, day.id] })} className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${selected ? 'bg-[#9aabd2] text-black' : 'bg-zinc-200 text-zinc-600'}`}>{day.label}</button>
              })}
            </div>
            <p className="mt-3 text-xs text-zinc-400">{repeatText(editing.repeatDays)}</p>
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
            <div className="py-9 text-center"><p className="text-2xl font-bold">{alarms.find(a=>a.enabled)?"다음 알람":"설정된 알람이 없습니다"}</p><p className="mt-1 text-sm">{alarms.find(a=>a.enabled)?.time || "알람을 추가해 주세요"}</p></div><div className="mb-3 flex justify-end gap-4"><button onClick={openNew} aria-label="알람 추가"><Plus/></button><MoreVertical size={21}/></div>
            {alarms.length === 0 && <div className="py-24 text-center text-sm text-zinc-400">등록된 알람이 없습니다.</div>}
            <div className="space-y-0 overflow-hidden rounded-[28px] bg-white px-4">
              {alarms.map(alarm => (
                <div key={alarm.id} className="flex items-center gap-3 border-b border-zinc-100 bg-white px-2 py-5">
                  <button type="button" onClick={() => openExisting(alarm)} className="min-w-0 flex-1 text-left">
                    <div className={`text-[42px] font-light leading-none tabular-nums tracking-tight ${alarm.enabled ? 'text-black' : 'text-zinc-400'}`}>{alarm.time}</div>
                    <div className="mt-3 truncate text-sm text-zinc-600">{alarm.label || '알람'}</div>
                    <div className="mt-1 text-xs text-zinc-400">{repeatText(alarm.repeatDays)}</div>
                  </button>
                  <button type="button" role="switch" aria-checked={alarm.enabled} aria-label={`${alarm.label || alarm.time} 알람 ${alarm.enabled ? '끄기' : '켜기'}`} onClick={() => updateAlarm({ ...alarm, enabled: !alarm.enabled })} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${alarm.enabled ? 'bg-[#a5b4fc]' : 'bg-zinc-300'}`}><span className={`absolute top-1 size-5 rounded-full transition-all ${alarm.enabled ? 'left-6 bg-[#202139]' : 'left-1 bg-white/80'}`}/></button>
                </div>
              ))}
            </div>
          </div>
          <nav className="mx-auto mb-4 flex w-[90%] shrink-0 justify-around rounded-full bg-white p-2 shadow-md"><button className="rounded-full bg-zinc-200 p-3" aria-label="알람"><AlarmClock/></button><button className="p-3" aria-label="세계 시각"><Globe2/></button><button className="p-3" aria-label="스톱워치"><Timer/></button><button className="p-3" aria-label="타이머"><Hourglass/></button></nav>
        </>
      )}
    </section>
  )
}
