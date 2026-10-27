import data from './photos.json'
import type { Photo } from '@/lib/phone/content-types'

/** 이 에피소드의 사진 목록은 photos.json에서 수정하세요. */
export const photos = data as unknown as { photos: Photo[] }
