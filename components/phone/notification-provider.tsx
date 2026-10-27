'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getInitialNotifications, type PhoneNotification } from '@/lib/phone/notifications'
import type { AppId } from '@/lib/phone/types'
import { useEpisode, episodeStorageKey } from './episode-provider'
import { usePhone } from './phone-provider'

const STORAGE = 'virtual-phone:notifications:v1'
type Saved = { readIds: string[]; dismissedIds: string[] }
interface NotificationContextValue {
  notifications: PhoneNotification[]
  badges: Partial<Record<AppId,number>>
  open: boolean
  setOpen: (value:boolean)=>void
  dismiss: (id:string)=>void
  dismissAll: ()=>void
  markTargetRead: (appId:AppId,targetId:string)=>void
  openNotification: (item:PhoneNotification)=>void
}
const Context = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({children}:{children:ReactNode}) {
  const phone = usePhone()
  const { episode, content } = useEpisode()
  const storageKey = episodeStorageKey(STORAGE, episode.id)
  const initial = useMemo(() => getInitialNotifications(content), [content])
  const [saved,setSaved] = useState<Saved>({readIds:[],dismissedIds:[]})
  const [ready,setReady] = useState(false)
  const [open,setOpen] = useState(false)
  useEffect(()=>{const show=()=>setOpen(true);window.addEventListener('phone:show-notifications',show);return()=>window.removeEventListener('phone:show-notifications',show)},[])
  useEffect(()=>{
    try { const raw=localStorage.getItem(storageKey); if(raw){const data=JSON.parse(raw);setSaved({readIds:Array.isArray(data.readIds)?data.readIds:[],dismissedIds:Array.isArray(data.dismissedIds)?data.dismissedIds:[]})} } catch { /* unavailable */ }
    setReady(true)
  },[])
  useEffect(()=>{if(ready){try{localStorage.setItem(storageKey,JSON.stringify(saved))}catch{/* unavailable */}}},[saved,ready])
  const notifications=useMemo(()=>initial.filter(n=>!saved.readIds.includes(n.id)&&!saved.dismissedIds.includes(n.id)),[saved])
  const badges=useMemo(()=>notifications.reduce<Partial<Record<AppId,number>>>((acc,n)=>{acc[n.appId]=(acc[n.appId]||0)+n.count;return acc},{}),[notifications])
  const dismiss=useCallback((id:string)=>setSaved(s=>({...s,dismissedIds:s.dismissedIds.includes(id)?s.dismissedIds:[...s.dismissedIds,id]})),[])
  const dismissAll=useCallback(()=>setSaved(s=>({...s,dismissedIds:[...new Set([...s.dismissedIds,...initial.map(n=>n.id)])]})),[])
  const markTargetRead=useCallback((appId:AppId,targetId:string)=>setSaved(s=>({...s,readIds:[...new Set([...s.readIds,...initial.filter(n=>n.appId===appId&&n.targetId===targetId).map(n=>n.id)])]})),[])
  const openNotification=useCallback((n:PhoneNotification)=>{
    setOpen(false)
    phone.openApp(n.appId)
    if(n.appId==='kakao' && n.targetId) phone.pushRoute(`room:${n.targetId}`)
    if(n.appId==='instagram' && n.targetId) window.dispatchEvent(new CustomEvent('phone:open-instagram-dm',{detail:n.targetId}))
    if(n.targetId) markTargetRead(n.appId,n.targetId)
    else setSaved(s=>({...s,readIds:[...new Set([...s.readIds,n.id])]}))
  },[phone,markTargetRead])
  const value=useMemo(()=>({notifications,badges,open,setOpen,dismiss,dismissAll,markTargetRead,openNotification}),[notifications,badges,open,dismiss,dismissAll,markTargetRead,openNotification])
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export function useNotifications(){const ctx=useContext(Context);if(!ctx)throw new Error('NotificationProvider missing');return ctx}
