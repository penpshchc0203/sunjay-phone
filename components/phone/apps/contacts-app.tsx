'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, Home, Search, UserRound } from 'lucide-react'
import { useEpisode } from '../episode-provider'
import { usePhone } from '../phone-provider'
import { USER_CONTACT_ID } from '@/content/contacts'
import { CHARACTER } from '@/config/character'

function ContactAvatar({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false)
  return <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100">
    {src && !failed ? <img src={src} alt={`${name} 프로필`} className="size-full object-cover" onError={() => setFailed(true)} /> : <UserRound size={22} className="text-zinc-400" aria-hidden="true" />}
  </div>
}

export function ContactsApp() {
  const { back, goHome } = usePhone()
  const { content } = useEpisode()
  const [search, setSearch] = useState('')
  const contacts = useMemo(() => [...(content.contacts ?? [])]
    .sort((a, b) => (a.id === USER_CONTACT_ID ? CHARACTER.user.displayName : a.name)
      .localeCompare(b.id === USER_CONTACT_ID ? CHARACTER.user.displayName : b.name, 'ko-KR', { sensitivity: 'base' })), [content.contacts])
  const filtered = contacts.filter(c => {
    const name = c.id === USER_CONTACT_ID ? CHARACTER.user.displayName : c.name
    return `${name} ${c.phoneNumber ?? ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  })
  return <section className="flex h-full min-h-0 flex-col bg-white text-zinc-900">
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-100 px-3">
      <button type="button" onClick={back} aria-label="뒤로 가기" className="rounded-full p-2 hover:bg-zinc-100"><ArrowLeft size={21}/></button>
      <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">연락처</h1>
      <button type="button" onClick={goHome} aria-label="홈으로" className="rounded-full p-2 hover:bg-zinc-100"><Home size={20}/></button>
    </header>
    <label className="mx-4 my-3 flex shrink-0 items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2">
      <Search size={16} className="text-zinc-500"/>
      <input aria-label="연락처 검색" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="이름 또는 전화번호 검색" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/>
    </label>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" role="list" aria-label="연락처 목록">
      {filtered.map(c => {
        const name = c.id === USER_CONTACT_ID ? CHARACTER.user.displayName : c.name
        return <div role="listitem" key={c.id} className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
          <ContactAvatar src={c.avatar} name={name}/>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="text-xs text-zinc-500">{c.phoneNumber || '번호 없음'}</p>
          </div>
        </div>
      })}
      {!filtered.length && <p className="p-8 text-center text-sm text-zinc-500">{search ? '검색 결과가 없습니다.' : '연락처가 없습니다.'}</p>}
    </div>
  </section>
}
