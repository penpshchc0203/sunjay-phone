import type { CharacterConfig } from '@/lib/phone/config-types'

/** 휴대폰 주인(캐릭터)과 사용자 본인 정보 */
export const CHARACTER: CharacterConfig = {
  owner: {
    name: '박종성',
    profileImage: '/sunjay-phone/images/profile/jayprofile.jpg',
    statusMessage: '흠',
  },

  user: {
    displayName: '떠누',
    avatar: '/sunjay-phone/images/profile/sunwookakao.jpg',
    phoneNumber: '010-2003-0624',
  },

  device: {
    deviceName: '종성의 Galaxy S25 Ultra',
    model: 'Galaxy S25 Ultra',
    phoneNumber: '010-2478-0913',
  },
}
