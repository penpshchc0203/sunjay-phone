import type { EpisodeContent } from './types'
import { assetPath } from '@/lib/phone/asset-path'
import { contacts, contactsEp02, contactsEp03 } from '../common/contacts'
import { kakaoAvatars } from '../common/kakao-avatars'
import kakao_all from '../kakao/all.json'
import kakao_ep01 from '../kakao/ep01.json'
import kakao_ep02 from '../kakao/ep02.json'
import kakao_ep03 from '../kakao/ep03.json'
import browser_all from '../browser/all.json'
import browser_ep01 from '../browser/ep01.json'
import browser_ep02 from '../browser/ep02.json'
import browser_ep03 from '../browser/ep03.json'
import calls_all from '../calls/all.json'
import calls_ep01 from '../calls/ep01.json'
import calls_ep02 from '../calls/ep02.json'
import calls_ep03 from '../calls/ep03.json'
import instagram_all from '../instagram/all.json'
import instagram_ep01 from '../instagram/ep01.json'
import instagram_ep02 from '../instagram/ep02.json'
import instagram_ep03 from '../instagram/ep03.json'
import messages_all from '../messages/all.json'
import messages_ep01 from '../messages/ep01.json'
import messages_ep02 from '../messages/ep02.json'
import messages_ep03 from '../messages/ep03.json'
import notes_all from '../notes/all.json'
import notes_ep01 from '../notes/ep01.json'
import notes_ep02 from '../notes/ep02.json'
import notes_ep03 from '../notes/ep03.json'
import photos_all from '../photos/all.json'
import photos_ep01 from '../photos/ep01.json'
import photos_ep02 from '../photos/ep02.json'
import photos_ep03 from '../photos/ep03.json'
import alarms_all from '../alarms/all.json'
import alarms_ep01 from '../alarms/ep01.json'
import alarms_ep02 from '../alarms/ep02.json'
import alarms_ep03 from '../alarms/ep03.json'
import coupang_all from '../coupang/all.json'
import coupang_ep01 from '../coupang/ep01.json'
import coupang_ep02 from '../coupang/ep02.json'
import coupang_ep03 from '../coupang/ep03.json'
type Row = Record<string, any>
type Dataset = Record<string, any>
const sources: Record<string, Record<string, Dataset>> = {
  coupang: {all: coupang_all, ep01: coupang_ep01, ep02: coupang_ep02, ep03: coupang_ep03},
  alarms: {all: alarms_all, ep01: alarms_ep01, ep02: alarms_ep02, ep03: alarms_ep03},
  kakao: {all: kakao_all, ep01: kakao_ep01, ep02: kakao_ep02, ep03: kakao_ep03},
  browser: {all: browser_all, ep01: browser_ep01, ep02: browser_ep02, ep03: browser_ep03},
  calls: {all: calls_all, ep01: calls_ep01, ep02: calls_ep02, ep03: calls_ep03},
  instagram: {all: instagram_all, ep01: instagram_ep01, ep02: instagram_ep02, ep03: instagram_ep03},
  messages: {all: messages_all, ep01: messages_ep01, ep02: messages_ep02, ep03: messages_ep03},
  notes: {all: notes_all, ep01: notes_ep01, ep02: notes_ep02, ep03: notes_ep03},
  photos: {all: photos_all, ep01: photos_ep01, ep02: photos_ep02, ep03: photos_ep03},
}
function mergeArray(before: Row[], incoming: Row[], key: string): Row[] {
  const result = [...before]
  for (const item of incoming) {
    const index = item.id == null ? -1 : result.findIndex(old => old.id === item.id)
    if (index < 0) { result.push(item); continue }
    if (key === 'kakaoRooms') {
      const old = result[index]
      result[index] = {...old, ...item, messages: mergeArray(old.messages ?? [], item.messages ?? [], 'messages')}
    } else result[index] = {...result[index], ...item}
  }
  return result
}
function mergeData(base: Dataset, next: Dataset): Dataset {
  const result = {...base}
  for (const [key, value] of Object.entries(next)) {
    if (Array.isArray(value)) result[key] = mergeArray(result[key] ?? [], value, key)
    else if (value && typeof value === 'object') result[key] = {...(result[key] ?? {}), ...value}
    else if (value !== undefined) result[key] = value
  }
  return result
}
function normalizeAssetPaths(value: any, field = ''): any {
  if (Array.isArray(value)) return value.map(item => normalizeAssetPaths(item, field))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeAssetPaths(item, key)]))
  }
  if (typeof value === 'string' && (
    /^(?:avatar|image|images|thumbnail|cover|photo|wallpaper|src)$/i.test(field) ||
    /(?:avatar|image|thumbnail|wallpaper|cover|photo)(?:url|src|path)?$/i.test(field)
  ) && /^(?:sunjay-phone\/+)?images\//.test(value.replace(/^\/+/, '').replace(/\/+/g, '/'))) return assetPath(value)
  return value
}

export function loadEpisodeContent(episodeId: string): EpisodeContent {
  const count = Number(episodeId.slice(2))
  let data: Dataset = {}
  for (const app of Object.keys(sources)) {
    const source = sources[app]
    data = mergeData(data, source.all)
    for (let i = 1; i <= count; i++) {
      const id = `ep${String(i).padStart(2, '0')}`
      if (source[id]) data = mergeData(data, source[id])
    }
  }
  const currentContacts = episodeId === 'ep01' ? contacts : episodeId === 'ep02' ? contactsEp02 : contactsEp03
  return normalizeAssetPaths({...data, contacts: currentContacts, kakaoAvatars}) as EpisodeContent
}
