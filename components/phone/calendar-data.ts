'use client'
import { useEffect, useMemo, useState } from 'react'
import { useEpisode, episodeStorageKey } from './episode-provider'
import all from '@/content/calendar/all.json'
import ep01 from '@/content/calendar/ep01.json'
import ep02 from '@/content/calendar/ep02.json'
import ep03 from '@/content/calendar/ep03.json'
export type CalendarEvent = { id: string; title: string; date: string; start: string; end: string; location: string; memo: string; category: 'work'|'personal'|'travel'|'reservation' }
type Changes = { changed: Record<string, CalendarEvent>; removed: string[] }
const sources: Record<string, CalendarEvent[]> = {ep01: ep01 as CalendarEvent[],ep02:ep02 as CalendarEvent[],ep03:ep03 as CalendarEvent[]}
const storage = 'virtual-phone:calendar:v1'
export const categoryColors: Record<CalendarEvent['category'], string> = {work:'#64748b',personal:'#db7093',travel:'#3b82f6',reservation:'#16a34a'}
export function useCalendarData() {
 const {episode} = useEpisode()
 const key = episodeStorageKey(storage,episode.id)
 const [saved,setSaved] = useState<Changes>({changed:{},removed:[]})
 const [loaded,setLoaded] = useState('')
 useEffect(()=>{try { const raw=localStorage.getItem(key); const parsed=raw?JSON.parse(raw):{}; setSaved({changed:parsed.changed||{},removed:parsed.removed||[]}) }catch{setSaved({changed:{},removed:[]})} setLoaded(key)},[key])
 const events=useMemo(()=>{const map=new Map<string,CalendarEvent>(); (all as CalendarEvent[]).forEach(e=>map.set(e.id,e)); for(let i=1;i<=Number(episode.id.slice(2));i++) (sources[`ep${String(i).padStart(2,'0')}`]||[]).forEach(e=>map.set(e.id,e)); Object.values(saved.changed).forEach(e=>map.set(e.id,e)); saved.removed.forEach(id=>map.delete(id)); return [...map.values()].sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start))},[episode.id,saved])
 const persist=(next:Changes)=>{setSaved(next);try{localStorage.setItem(key,JSON.stringify(next))}catch{}}
 return {events,ready:loaded===key,save:(event:CalendarEvent)=>persist({changed:{...saved.changed,[event.id]:event},removed:saved.removed.filter(id=>id!==event.id)}),remove:(id:string)=>persist({changed:Object.fromEntries(Object.entries(saved.changed).filter(([k])=>k!==id)),removed:[...new Set([...saved.removed,id])]}),key}
}
export function monthCells(year:number,month:number){const first=new Date(year,month,1).getDay();const count=new Date(year,month+1,0).getDate();return [...Array(first).fill(null),...Array.from({length:count},(_,i)=>i+1)] as (number|null)[]}
export const dateKey=(year:number,month:number,day:number)=>`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
