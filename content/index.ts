import { validatePhoneContent } from '@/lib/phone/validate-content'

export { BROWSER_HISTORY, BROWSER_SEARCHES, BROWSER_RESULTS } from './browser'
export { CALL_LOG } from './calls'
export { CONTACTS, USER_CONTACT_ID } from './contacts'
export { INSTAGRAM_ACCOUNTS, INSTAGRAM_DMS, INSTAGRAM_POSTS, INSTAGRAM_PROFILE } from './instagram'
export { KAKAO_PROFILES, KAKAO_ROOMS } from './kakao'
export { LOCK_NOTIFICATIONS } from './lock-notifications'
export { SMS_THREADS } from './messages'
export { NOTES } from './notes'
export { PHOTOS } from './photos'

if (process.env.NODE_ENV !== 'production') {
  for (const issue of validatePhoneContent()) {
    console.warn(`[phone-content] ${issue}`)
  }
}
