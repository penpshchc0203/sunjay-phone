import { EpisodeProvider } from '@/components/phone/episode-provider'
import { EpisodePhone } from '@/components/phone/episode-phone'

export default function Page() {
  return (
    <div className="min-h-dvh bg-black md:flex md:items-center md:justify-center md:bg-zinc-200 md:py-6">
      <h1 className="sr-only">박종성의 휴대폰</h1>
      <EpisodeProvider><EpisodePhone /></EpisodeProvider>
    </div>
  )
}
