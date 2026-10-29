import type { CharacterConfig } from '@/lib/phone/config-types'

/** 휴대폰 주인(캐릭터)과 사용자 본인 정보 */
export const CHARACTER: CharacterConfig = {
  owner: {
    name: '박종성',
    profileImage: '/sunjay-phone/images/profile/jayprofile.jpg',
    statusMessage: '흠',
  },

  user: {
    displayName: '선우',
    avatar: '/sunjay-phone/images/profile/sunwookakao.jpg',
    phoneNumber: '010-XXX-0624',
  },

  device: {
    deviceName: '',
    model: 'Galaxy S25 Ultra',
    phoneNumber: '010-2002-0420',
  },
}
