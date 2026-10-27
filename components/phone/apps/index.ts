import type { ComponentType } from 'react'
import { APPS } from '@/lib/phone/apps'
import type { AppId } from '@/lib/phone/types'
import { ComingSoonApp } from './coming-soon-app'
import { SettingsApp } from './settings-app'
import { KakaoApp } from './kakao-app'
import { InstagramApp } from './instagram-app'
import { PhotosApp } from './photos-app'
import { NotesApp } from './notes-app'
import { PhoneApp } from './phone-app'
import { ContactsApp } from './contacts-app'
import { BrowserApp } from './browser-app'
import type { AppComponentProps } from './types'

/**
 * 실제로 구현된 앱 화면 목록.
 * 새 앱을 만들면 여기에 등록하고, config/design.ts 에서 해당 앱의 implemented 를 true 로 바꾸세요.
 */
const IMPLEMENTED_APPS: Partial<Record<AppId, ComponentType<AppComponentProps>>> = {
  settings: SettingsApp,
  kakao: KakaoApp,
  instagram: InstagramApp,
  photos: PhotosApp,
  notes: NotesApp,
  phone: PhoneApp,
  contacts: ContactsApp,
  browser: BrowserApp,
}

export function getAppComponent(appId: AppId): ComponentType<AppComponentProps> {
  const Component = IMPLEMENTED_APPS[appId]
  return APPS[appId].implemented && Component ? Component : ComingSoonApp
}
