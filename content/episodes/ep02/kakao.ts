import data from './kakao.json'
import type { KakaoRoom, KakaoFriendProfile } from '@/lib/phone/content-types'

/** 이 에피소드의 카카오톡 내용은 kakao.json에서만 수정하세요. */
export const kakao = data as unknown as { kakaoRooms: KakaoRoom[]; kakaoProfiles: KakaoFriendProfile[] }
