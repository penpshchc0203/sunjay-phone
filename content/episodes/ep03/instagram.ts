import data from './instagram.json'
import type { InstagramOwnProfile, InstagramAccount, InstagramPost, InstagramDmThread, InstagramStory } from '@/lib/phone/content-types'

/** 이 에피소드의 인스타그램 내용은 instagram.json에서만 수정하세요. */
export const instagram = data as unknown as { instagramProfile: InstagramOwnProfile; instagramAccounts: InstagramAccount[]; instagramPosts: InstagramPost[]; instagramDms: InstagramDmThread[]; instagramStories: InstagramStory[] }
