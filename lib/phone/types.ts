export type AppId = 'settings'|'messages'|'kakao'|'contacts'|'phone'|'photos'|'notes'|'instagram'|'browser'
export type PhoneMode = 'lock'|'home'|'app'
export interface PhoneState { mode: PhoneMode; currentApp: AppId|null; appRoutes: Partial<Record<AppId,string[]>>; recentApps: AppId[] }
