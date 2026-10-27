import data from './notes.json'
import type { Note } from '@/lib/phone/content-types'

/** 이 에피소드의 메모는 notes.json에서 수정하세요. */
export const notes = data as unknown as { notes: Note[] }
