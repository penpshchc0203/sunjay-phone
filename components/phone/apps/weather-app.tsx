'use client'
import { useMemo, useState } from 'react'
import { ArrowLeft, Cloud, CloudSun, Sun, CloudRain, MapPin, Droplets, House, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEpisode } from '../episode-provider'
import all from '@/content/weather/all.json'
import ep01 from '@/content/weather/ep01.json'
import ep02 from '@/content/weather/ep02.json'
import ep03 from '@/content/weather/ep03.json'
type Hour = {time:string;temperature:number;precipitation:number}
type Forecast = {id:string;cityId:string;date:string;condition:string;low:number;high:number;precipitation:number;hourly:Hour[];sample:boolean}
const sets=[all,ep01,ep02,ep03]
function WeatherIcon({condition,size=28}:{condition:string;size?:number}){return condition.includes('비')?<CloudRain size={size}/>:condition.includes('구름')?<CloudSun size={size}/>:condition.includes('흐림')?<Cloud size={size}/>:<Sun size={size}/>}
export function WeatherApp({onClose}:{onClose:()=>void}){
 const {episode}=useEpisode()
 const [city,setCity]=useState('gangneung')
 const [date,setDate]=useState('2026-05-01')
 const cities=all.cities
 const forecasts=useMemo(()=>{const map=new Map<string,Forecast>();const n=Math.min(3,Math.max(1,Number(episode.id.slice(2))));for(let i=0;i<=n;i++)for(const item of sets[i].forecasts as Forecast[])map.set(item.id,item);return [...map.values()]},[episode.id])
 const dates=[...new Set(forecasts.filter(f=>f.cityId===city).map(f=>f.date))].sort()
 const current=forecasts.find(f=>f.cityId===city&&f.date===date)
 const selectedDate=dates.includes(date)?date:dates[0]
 const shown=current??forecasts.find(f=>f.cityId===city&&f.date===selectedDate)
 const move=(dir:number)=>{const idx=dates.indexOf(shown?.date??'');if(dates[idx+dir])setDate(dates[idx+dir])}
 return <section className="flex h-full flex-col bg-gradient-to-b from-[#4e91c8] via-[#79b6da] to-[#d6e8f2] text-white"><header className="flex h-14 shrink-0 items-center justify-between px-4"><button onClick={onClose} aria-label="뒤로"><ArrowLeft/></button><h1 className="font-semibold">날씨</h1><button onClick={onClose} aria-label="홈"><House size={20}/></button></header><div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8"><label className="mb-4 flex items-center justify-center gap-2"><MapPin size={18}/><select aria-label="지역 선택" value={city} onChange={e=>{setCity(e.target.value);setDate(e.target.value==='gangneung'?'2026-05-01':'2026-05-01')}} className="rounded-xl bg-white/20 px-3 py-2 font-semibold text-white outline-none">{cities.map(c=><option key={c.id} value={c.id} className="text-zinc-900">{c.name}</option>)}</select></label>{shown?<><div className="flex items-center justify-center gap-4"><button onClick={()=>move(-1)} disabled={dates.indexOf(shown.date)<=0} aria-label="이전 날짜" className="disabled:opacity-30"><ChevronLeft/></button><span className="text-sm">{shown.date}</span><button onClick={()=>move(1)} disabled={dates.indexOf(shown.date)>=dates.length-1} aria-label="다음 날짜" className="disabled:opacity-30"><ChevronRight/></button></div><div className="flex flex-col items-center py-9"><WeatherIcon condition={shown.condition} size={76}/><p className="mt-4 text-2xl">{shown.condition}</p><p className="mt-3 text-6xl font-light">{shown.high}°</p><p className="mt-3 text-sm">최고 {shown.high}° · 최저 {shown.low}°</p><p className="mt-2 flex items-center gap-1 text-sm"><Droplets size={15}/> 강수 확률 {shown.precipitation}%</p></div><div className="rounded-3xl bg-white/20 p-4 backdrop-blur-sm"><h2 className="mb-4 font-semibold">시간대별 기온</h2><div className="flex gap-3 overflow-x-auto pb-2">{shown.hourly.map(h=><div key={h.time} className="flex min-w-[62px] flex-col items-center gap-3 text-xs"><span>{h.time}</span><WeatherIcon condition={shown.condition} size={22}/><b className="text-base">{h.temperature}°</b><span className="flex items-center gap-0.5"><Droplets size={12}/>{h.precipitation}%</span></div>)}</div></div><p className="mt-5 rounded-xl bg-white/20 p-3 text-center text-xs">시뮬레이션용 예시 날씨입니다. 실제 관측값이나 기상 예보가 아닙니다.</p></>:<p className="py-16 text-center">이 지역의 등록된 예보가 없습니다.</p>}</div></section>
}
