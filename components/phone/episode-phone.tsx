 'use client'
import { PhoneDevice } from './phone-device'
import { PhoneProvider } from './phone-provider'
import { useEpisode } from './episode-provider'
export function EpisodePhone() { const {episode} = useEpisode(); return <PhoneProvider key={episode.id}><PhoneDevice /></PhoneProvider> }
