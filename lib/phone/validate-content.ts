import { KAKAO_ROOMS } from '@/content/kakao'
import { INSTAGRAM_DMS, INSTAGRAM_POSTS } from '@/content/instagram'
export function validatePhoneContent():string[]{const issues:string[]=[];for(const room of KAKAO_ROOMS){if(!room.id)issues.push('카톡 채팅방 ID 누락')}for(const thread of INSTAGRAM_DMS){if(!thread.id)issues.push('인스타 DM ID 누락')}for(const post of INSTAGRAM_POSTS){if(!post.images.length)issues.push(`게시물 ${post.id}: 이미지 없음`)}return issues}
