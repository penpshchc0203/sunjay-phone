'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, AtSign, ChevronLeft, ChevronRight, Grid3X3, Heart, Home, Image as ImageIcon, MessageCircle, MoreHorizontal, Send, Search, X } from 'lucide-react'
import { useEpisodeProgress } from '../use-episode-progress'
import { useEpisode, episodeStorageKey } from '../episode-provider'

import type { InstagramDmMessage, InstagramPost, InstagramStory } from '@/lib/phone/content-types'
import type { AppComponentProps } from './types'
import { useNotifications } from '../notification-provider'


type RelationshipMode = 'followers' | 'following'
type Tab = 'home' | 'search' | 'profile' | 'inbox'
const readableTime = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23' })
}
function Avatar({ src, name, size = 42 }: { src?: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  return <div className="shrink-0 overflow-hidden rounded-full bg-gradient-to-tr from-fuchsia-600 via-pink-500 to-amber-400 p-[2px]" style={{ width: size, height: size }}>
    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-[#101014] bg-zinc-800 text-sm font-bold text-white">
      {src && !failed ? <img src={src} alt={name} className="h-full w-full object-cover" onError={() => setFailed(true)} /> : <span>{name.slice(0, 1).toUpperCase() || '?'}</span>}
    </div>
  </div>
}
function Photo({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  return failed ? <div className={`flex items-center justify-center bg-zinc-800 text-zinc-500 ${className}`} role="img" aria-label={alt}><ImageIcon size={28} /></div> : <img src={src} alt={alt} className={`object-cover ${className}`} onError={() => setFailed(true)} />
}
export function InstagramApp(_props: AppComponentProps) {
  const { content, episode } = useEpisode()
  const INSTAGRAM_ACCOUNTS = content.instagramAccounts
  const INSTAGRAM_DMS = content.instagramDms
  const INSTAGRAM_POSTS = content.instagramPosts
  const INSTAGRAM_PROFILE = content.instagramProfile
  const INSTAGRAM_STORIES = content.instagramStories
  const CONTACTS = content.contacts
  const getAccount = (id: string) => INSTAGRAM_ACCOUNTS.find(account => account.id === id)
  const getAvatar = (id: string) => {
    const account = getAccount(id)
    return account?.avatar
  }

  const [tab, setTab] = useState<Tab>('home')
  const [viewAccountId, setViewAccountId] = useState<string>('me')
  const [relationshipMode, setRelationshipMode] = useState<RelationshipMode | null>(null)
  const [relationshipSearch, setRelationshipSearch] = useState('')
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [highlightIndex, setHighlightIndex] = useState(0)

  const [threadId, setThreadId] = useState<string | null>(null)
  const { markTargetRead } = useNotifications()
  useEffect(()=>{if(threadId)markTargetRead('instagram',threadId)},[threadId,markTargetRead])
  
  const [postId, setPostId] = useState<string | null>(null)
  const [postImageIndex, setPostImageIndex] = useState(0)
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [sentMessages, setSentMessages] = useState<Record<string, InstagramDmMessage[]>>({})
  const [likedPosts, setLikedPosts] = useState<string[]>([])
  const ownerId = INSTAGRAM_PROFILE.id || 'me'
  const isOwner = (id: string) => id === 'me' || id === ownerId
  const [followOverrides, setFollowOverrides] = useState<Record<string, boolean>>({})
  const [accountSearch, setAccountSearch] = useState('')
  const [returnView, setReturnView] = useState<{tab:Tab; accountId:string; threadId:string|null} | null>(null)
  const followKey = episodeStorageKey('virtual-phone:instagram-following:v1', episode.id)
  useEffect(() => {
    try { const stored = JSON.parse(localStorage.getItem(followKey) || '{}'); setFollowOverrides(stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}) }
    catch { setFollowOverrides({}) }
  }, [followKey])
  const isFollowing = (id: string) => followOverrides[id] ?? Boolean(INSTAGRAM_PROFILE.followingIds?.includes(id) || getAccount(id)?.followerIds?.some(isOwner))
  const changeFollowing = (id: string) => {
    const next = {...followOverrides, [id]: !isFollowing(id)}
    setFollowOverrides(next)
    try { localStorage.setItem(followKey, JSON.stringify(next)) } catch {}
  }
  const postOwner = (post: InstagramPost) => post.accountId || ownerId
  const ownerName = (id: string) => isOwner(id) ? INSTAGRAM_PROFILE.username : getAccount(id)?.username || id
  const ownerAvatar = (id: string) => isOwner(id) ? INSTAGRAM_PROFILE.avatar : getAvatar(id)
  const visiblePosts = [...INSTAGRAM_POSTS].filter(post => isOwner(postOwner(post)) || (isFollowing(postOwner(post)) && (!getAccount(postOwner(post))?.private || isFollowing(postOwner(post))))).sort((a,b)=>b.postedAt.localeCompare(a.postedAt))
  const readKey = episodeStorageKey('virtual-phone:instagram-read-stories:v1', episode.id)
  const [readStories, setReadStories] = useState<string[]>([])
  const [storyId, setStoryId] = useState<string|null>(null)
  const [storyScope, setStoryScope] = useState<"home" | "profile">("home")
  const [storyProgress, setStoryProgress] = useState(0)
  const [storyPaused, setStoryPaused] = useState(false)
  const touchStart = useRef<number | null>(null)
  useEffect(() => {
    try { const value = JSON.parse(localStorage.getItem(readKey) || '[]'); setReadStories(Array.isArray(value) ? value : []) }
    catch { setReadStories([]) }
  }, [readKey])
  const allStories = INSTAGRAM_STORIES
  const visibleStories = allStories.filter(st => isOwner(st.accountId) || isFollowing(st.accountId) || Boolean(getAccount(st.accountId))).sort((a,b)=>a.postedAt.localeCompare(b.postedAt))
  const storyAccounts = [...new Set(visibleStories.map(st => st.accountId))].sort((a,b)=>{ const rank=(id:string)=>isOwner(id)?0:isFollowing(id)?1:2; return rank(a)-rank(b) })
  const activeStory = allStories.find(st=>st.id===storyId)
  const storySequence = activeStory ? visibleStories.filter(st=>st.accountId===activeStory.accountId) : []
  const closeStory = () => { setStoryId(null); setStoryProgress(0); setStoryPaused(false); setStoryScope("home") }
  const moveStory = (direction:number) => {
    if (!activeStory) { closeStory(); return }
    const index = storySequence.findIndex(st => st.id === activeStory.id)
    const adjacent = index >= 0 ? storySequence[index + direction] : undefined
    if (adjacent) { setStoryProgress(0); setStoryPaused(false); setStoryId(adjacent.id); return }
    if (storyScope === "profile") { closeStory(); return }
    const accountIndex = storyAccounts.findIndex(id => id === activeStory.accountId)
    const nextAccount = storyAccounts[accountIndex + (direction > 0 ? 1 : -1)]
    if (!nextAccount) { closeStory(); return }
    const nextStories = visibleStories.filter(st => st.accountId === nextAccount)
    const next = direction > 0 ? nextStories[0] : nextStories[nextStories.length - 1]
    if (!next) { closeStory(); return }
    setStoryProgress(0); setStoryPaused(false); setStoryId(next.id)
  }
  const openStory = (id:string, scope: "home" | "profile" = "home") => { setStoryScope(scope); setStoryProgress(0); setStoryPaused(false); setStoryId(id) }
  const accountStories = (id:string) => visibleStories.filter(st=>isOwner(id)?isOwner(st.accountId):st.accountId===id)
  const openAccountStory = (id:string) => { const stories=accountStories(id); const first=stories.find(st=>!readStories.includes(st.id))||stories[0]; if(first)openStory(first.id, "profile") }
  const accountStoryRing = (id:string) => { const stories=accountStories(id); return stories.length===0?'':stories.every(st=>readStories.includes(st.id))?'bg-zinc-500':'bg-gradient-to-tr from-fuchsia-600 via-pink-500 to-amber-400' }
  useEffect(() => {
    if (!storyId) return
    setStoryProgress(0)
    setReadStories(prev => {
      if (prev.includes(storyId)) return prev
      const next = [...prev, storyId]
      try { localStorage.setItem(readKey, JSON.stringify(next)) } catch {}
      return next
    })
  }, [storyId, readKey])
  useEffect(() => {
    if (!storyId || storyPaused || highlightId) return
    const timer = window.setInterval(() => setStoryProgress(prev => Math.min(100, prev+2)), 100)
    return () => window.clearInterval(timer)
  }, [storyId, storyPaused, highlightId])
  useEffect(() => { if (storyId && storyProgress >= 100) moveStory(1) }, [storyId, storyProgress])
  useEpisodeProgress('messages', threadId)
  useEpisodeProgress('stories', highlightId ? `${highlightId}:${highlightIndex}` : storyId)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [homeCommentsPostId, setHomeCommentsPostId] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  type LocalComment = {id:string;accountId:string;text:string;commentedAt:string;likes?:number}
  const commentKey = episodeStorageKey('virtual-phone:instagram-feed-comments:v1', episode.id)
  const commentLikesKey = episodeStorageKey('virtual-phone:instagram-comment-likes:v1', episode.id)
  const [localComments, setLocalComments] = useState<Record<string,LocalComment[]>>({})
  const [likedComments, setLikedComments] = useState<string[]>([])

  useEffect(() => {
    try { const value = JSON.parse(localStorage.getItem(commentKey) || '{}'); setLocalComments(value && typeof value === 'object' && !Array.isArray(value) ? value : {}) } catch { setLocalComments({}) }
    try { const value = JSON.parse(localStorage.getItem(commentLikesKey) || '[]'); setLikedComments(Array.isArray(value) ? value : []) } catch { setLikedComments([]) }
  }, [commentKey, commentLikesKey])
  const addComment = (postId: string) => {
    if (!commentDraft.trim()) return
    const next = {...localComments, [postId]: [...(localComments[postId] || []), {id: `reader-comment-${crypto.randomUUID()}`, accountId: 'me', text: commentDraft.trim(), commentedAt: new Date().toISOString(), likes: 0}]}
    setLocalComments(next)
    try { localStorage.setItem(commentKey, JSON.stringify(next)) } catch {}
    setCommentDraft('')
  }
  const toggleCommentLike = (id: string) => {
    const next = likedComments.includes(id) ? likedComments.filter(item => item !== id) : [...likedComments, id]
    setLikedComments(next)
    try { localStorage.setItem(commentLikesKey, JSON.stringify(next)) } catch {}
  }
  const [readThreads,setReadThreads] = useState<string[]>([])
  const [imagePreview,setImagePreview] = useState<string|null>(null)
  const dmBottomRef = useRef<HTMLDivElement>(null)
  useEffect(()=>{dmBottomRef.current?.scrollIntoView({block:'end'})},[threadId, sentMessages])
  const viewedAccount = isOwner(viewAccountId) ? INSTAGRAM_PROFILE : getAccount(viewAccountId)
  const viewedUsername = viewedAccount?.username || viewAccountId
  const viewedAvatar = isOwner(viewAccountId) ? INSTAGRAM_PROFILE.avatar : getAvatar(viewAccountId)
  const isPrivate = Boolean(viewedAccount?.private)
  // No authenticated social graph is available; only the phone owner's account is considered followed.
  const canViewPosts = isOwner(viewAccountId) || !isPrivate || isFollowing(viewAccountId)
  const highlights = viewedAccount?.highlights || []
  const activeHighlight = highlights.find(h => h.id === highlightId)
  const highlightStories = (activeHighlight?.storyIds || []).map(id => INSTAGRAM_STORIES.find(st => st.id === id)).filter((st): st is (typeof INSTAGRAM_STORIES)[number] => Boolean(st))
  const relationshipIds = relationshipMode === 'followers' ? (viewedAccount?.followerIds || []) : isOwner(viewAccountId) ? [...new Set([...(viewedAccount?.followingIds || []), ...Object.keys(followOverrides).filter(isFollowing)])].filter(isFollowing) : (viewedAccount?.followingIds || [])
  const relationshipAccounts = relationshipIds.map(id => id === 'me' ? { id: 'me', username: INSTAGRAM_PROFILE.username, displayName: INSTAGRAM_PROFILE.displayName, avatar: INSTAGRAM_PROFILE.avatar } : getAccount(id)).filter((a): a is NonNullable<typeof a> => Boolean(a)).filter(a => `${a.username} ${a.displayName}`.toLowerCase().includes(relationshipSearch.toLowerCase()))
  const openAccount = (id: string) => { setReturnView({tab, accountId:viewAccountId, threadId}); setViewAccountId(isOwner(id) ? 'me' : id); setRelationshipMode(null); setRelationshipSearch(''); setThreadId(null); setPostId(null); setHighlightId(null); setTab('profile') }
  const openRelationship = (mode: RelationshipMode) => { setRelationshipMode(mode); setRelationshipSearch('') }
  const openHighlight = (id: string) => { setHighlightId(id); setHighlightIndex(0) }
  const moveHighlight = (step: number) => { const next = highlightIndex + step; if(next < 0 || next >= highlightStories.length) { setHighlightId(null); return }; setHighlightIndex(next) }
  const selectedThread = INSTAGRAM_DMS.find((thread) => thread.id === threadId)
  const selectedPost = INSTAGRAM_POSTS.find((post) => post.id === postId)
  const account = selectedThread ? getAccount(selectedThread.accountId) : undefined
  const messages = selectedThread ? [...selectedThread.messages, ...(sentMessages[selectedThread.id] || [])] : []
  const filteredThreads = useMemo(() => INSTAGRAM_DMS.filter((thread) => {
    const item = getAccount(thread.accountId)
    return `${item?.username || ''} ${item?.displayName || ''}`.toLowerCase().includes(search.toLowerCase())
  }), [search])
  const sendMessage = () => {
    if (!selectedThread || !draft.trim()) return
    const message: InstagramDmMessage = { id: `local-${Date.now()}`, from: 'me', text: draft.trim(), sentAt: new Date().toISOString() }
    setSentMessages((prev) => ({ ...prev, [selectedThread.id]: [...(prev[selectedThread.id] || []), message] }))
    setDraft('')
  }
  const openPost = (post: InstagramPost) => { setPostId(post.id); setPostImageIndex(0);setCommentsOpen(false);setCommentDraft('') }
  const back = () => { if (highlightId) setHighlightId(null); else if (storyId) closeStory(); else if (relationshipMode) setRelationshipMode(null); else if (postId) setPostId(null); else if (threadId) setThreadId(null); else if (returnView) {setViewAccountId(returnView.accountId);setTab(returnView.tab);setThreadId(returnView.threadId);setReturnView(null)} else if (viewAccountId !== 'me') {setViewAccountId('me');setTab('home')} else setTab('home') }
  const goHome = () => {closeStory();setHighlightId(null);setTab('home');setViewAccountId('me');setThreadId(null);setPostId(null);setRelationshipMode(null);setReturnView(null)}
  const goProfile = () => {setHomeCommentsPostId(null);setTab('profile');setViewAccountId('me');setThreadId(null);setPostId(null);setRelationshipMode(null);setReturnView(null)}
  
  return <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#101014] text-white" aria-label="인스타그램">
    {highlightId ? <div className="relative flex min-h-0 flex-1 flex-col bg-black" aria-label="하이라이트 스토리">
      <div className="flex gap-1 px-3 pt-3">{highlightStories.map((st,i)=><div key={st.id} className={`h-1 flex-1 rounded ${i<=highlightIndex?'bg-white':'bg-white/30'}`}/>)}</div>
      <div className="flex items-center justify-between px-4 py-3"><strong className="text-sm">{activeHighlight?.title}</strong><button aria-label="하이라이트 닫기" onClick={()=>setHighlightId(null)}><X size={23}/></button></div>
      {highlightStories[highlightIndex] ? <div className="relative flex min-h-0 flex-1 items-center justify-center"><Photo src={highlightStories[highlightIndex].image} alt="하이라이트 사진" className="max-h-full w-full object-contain"/><button aria-label="이전 스토리" onClick={()=>moveHighlight(-1)} className="absolute inset-y-0 left-0 w-1/2"/><button aria-label="다음 스토리" onClick={()=>moveHighlight(1)} className="absolute inset-y-0 right-0 w-1/2"/></div> : <p className="p-8 text-center text-sm text-zinc-400">등록된 스토리가 없어요.</p>}
      <div className="flex items-center justify-between px-4 py-3 text-sm"><button onClick={()=>moveHighlight(-1)} disabled={highlightIndex===0} className="disabled:opacity-30">이전</button><span>{highlightStories[highlightIndex]?.caption}</span><button onClick={()=>moveHighlight(1)}>다음</button></div>
    </div> : relationshipMode ? <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-4"><button aria-label="프로필로 돌아가기" onClick={back}><ArrowLeft size={22}/></button><strong>{viewedUsername} · {relationshipMode==='followers'?'팔로워':'팔로잉'}</strong></header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3"><div className="mb-4 flex items-center gap-2 rounded-xl bg-zinc-800 px-3 py-2"><Search size={17}/><input aria-label="계정 검색" value={relationshipSearch} onChange={e=>setRelationshipSearch(e.target.value)} placeholder="검색" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></div>
      {relationshipAccounts.map(a=><button key={a.id} onClick={()=>openAccount(a.id)} className="flex w-full items-center gap-3 py-3 text-left"><Avatar src={a.id==='me'?INSTAGRAM_PROFILE.avatar:getAvatar(a.id)} name={a.username} size={46}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{a.username}</p><p className="truncate text-xs text-zinc-400">{a.displayName}</p></div><ChevronRight size={17}/></button>)}
      {relationshipAccounts.length===0 && <p className="py-8 text-center text-sm text-zinc-400">표시할 계정이 없어요. content/instagram.ts에서 관계 ID를 등록해 주세요.</p>}</div>
    </> : storyId ? <div className="relative flex min-h-0 flex-1 flex-col bg-black" onTouchStart={e=>{touchStart.current=e.touches[0].clientX}} onTouchEnd={e=>{if(touchStart.current!==null){const dx=e.changedTouches[0].clientX-touchStart.current;if(Math.abs(dx)>60)moveStory(dx<0?1:-1);touchStart.current=null}}} onPointerDown={()=>setStoryPaused(true)} onPointerUp={()=>setStoryPaused(false)} onPointerCancel={()=>setStoryPaused(false)}>
      <div className="flex gap-1 px-3 pt-3">{storySequence.map((st,i)=><div key={st.id} className="h-1 flex-1 overflow-hidden rounded bg-white/30"><div className="h-full bg-white" style={{width:`${i < storySequence.findIndex(item => item.id === storyId) ? 100 : st.id === storyId ? storyProgress : 0}%`}}/></div>)}</div>
      <div className="flex items-center gap-2 px-4 py-3"><Avatar src={ownerAvatar(activeStory?.accountId||'me')} name={ownerName(activeStory?.accountId||'me')} size={30}/><strong className="min-w-0 flex-1 truncate text-sm">{ownerName(activeStory?.accountId||'me')}</strong><span className="text-[10px] text-zinc-400">{activeStory?.postedAt?readableTime(activeStory.postedAt):''}</span><button aria-label="스토리 닫기" onClick={closeStory}><X size={23}/></button></div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center" style={{backgroundColor:activeStory?.backgroundColor||'#000'}}>
        {activeStory?.mediaType==='video' || /\.(mp4|webm|mov)(\?|$)/i.test(activeStory?.image||'') ? <video key={storyId} src={activeStory?.image} autoPlay muted playsInline className="max-h-full w-full" style={{objectFit:activeStory?.fit||'contain'}}/> : <Photo src={activeStory?.image||''} alt="스토리 사진" className={`max-h-full w-full ${activeStory?.fit==='cover'?'h-full object-cover':'object-contain'}`}/>}
        {activeStory?.caption && <p className={`pointer-events-none absolute left-4 right-4 whitespace-pre-wrap text-center text-sm font-semibold text-white drop-shadow-lg ${activeStory.textPosition==='top'?'top-5':activeStory.textPosition==='center'?'top-1/2 -translate-y-1/2':'bottom-5'}`}>{activeStory.caption}</p>}
        <button aria-label="이전 스토리" onClick={()=>moveStory(-1)} className="absolute inset-y-0 left-0 w-1/3"/><button aria-label="다음 스토리" onClick={()=>moveStory(1)} className="absolute inset-y-0 right-0 w-1/3"/>
      </div>
    </div> : selectedPost ? <>
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <button aria-label="게시물 닫기" onClick={back}><ArrowLeft size={23} /></button><strong className="text-sm">게시물</strong>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="flex items-center gap-2 px-4 py-3"><button onClick={()=>openAccount(postOwner(selectedPost))} className="flex items-center gap-2"><Avatar src={ownerAvatar(postOwner(selectedPost))} name={ownerName(postOwner(selectedPost))} size={32} /><span className="text-sm font-semibold">{ownerName(postOwner(selectedPost))}</span></button><span className="ml-auto text-zinc-400"><MoreHorizontal size={20} /></span></div>
        <div className="relative aspect-square w-full bg-zinc-900"><Photo src={selectedPost.images[postImageIndex]} alt={selectedPost.caption} className="h-full w-full" />
          {selectedPost.images.length > 1 && <><button aria-label="이전 사진" onClick={() => setPostImageIndex((i) => (i + selectedPost.images.length - 1) % selectedPost.images.length)} className="absolute left-2 top-1/2 rounded-full bg-black/50 p-1"><ChevronLeft size={19}/></button><button aria-label="다음 사진" onClick={() => setPostImageIndex((i) => (i + 1) % selectedPost.images.length)} className="absolute right-2 top-1/2 rounded-full bg-black/50 p-1"><ChevronRight size={19}/></button></>}
        </div>
        <div className="flex items-center gap-4 px-4 pt-3"><button aria-label="좋아요" onClick={() => setLikedPosts((prev) => prev.includes(selectedPost.id) ? prev.filter((id) => id !== selectedPost.id) : [...prev, selectedPost.id])}><Heart size={24} fill={likedPosts.includes(selectedPost.id) ? '#fb7185' : 'none'} color={likedPosts.includes(selectedPost.id) ? '#fb7185' : 'currentColor'} /></button><button onClick={()=>setCommentsOpen(v=>!v)} aria-label={commentsOpen?"댓글 입력 닫기":"댓글 입력 열기"} aria-expanded={commentsOpen}><MessageCircle size={24}/></button><Send size={23}/></div>
        <div className="px-4 pt-2 text-sm font-semibold">좋아요 {selectedPost.likes + Number(likedPosts.includes(selectedPost.id))}개</div>
        <p className="whitespace-pre-wrap px-4 pt-1 text-sm"><button onClick={()=>openAccount(postOwner(selectedPost))} className="font-semibold">{ownerName(postOwner(selectedPost))}</button> {selectedPost.caption}</p>
        <p className="px-4 pt-1 text-xs text-zinc-500">{readableTime(selectedPost.postedAt)} {selectedPost.location ? `· ${selectedPost.location}` : ''}</p>
        {<><div className="mt-4 border-t border-white/10 px-4 pt-3 text-sm font-semibold">댓글 {selectedPost.comments.length + (localComments[selectedPost.id]?.length||0)}개</div>
        {[...selectedPost.comments,...(localComments[selectedPost.id]||[])].map(comment => <div key={comment.id} className="flex items-start gap-2 px-4 py-3 text-sm">
          <Avatar src={ownerAvatar(comment.accountId)} name={ownerName(comment.accountId)} size={29}/>
          <div className="min-w-0 flex-1"><p><button onClick={()=>openAccount(comment.accountId)} className="font-bold">{ownerName(comment.accountId)}</button> {comment.text}</p>
          <p className="mt-1 text-[10px] text-zinc-500">{readableTime(comment.commentedAt)}</p></div>
          <button type="button" onClick={()=>toggleCommentLike(comment.id)} aria-label="댓글 좋아요" className="flex shrink-0 flex-col items-center gap-1 text-[10px] text-zinc-400"><Heart size={15} fill={likedComments.includes(comment.id)?'#fb7185':'none'} color={likedComments.includes(comment.id)?'#fb7185':'currentColor'}/>{(comment.likes||0)+Number(likedComments.includes(comment.id))}</button>
        </div>)}
        {(selectedPost.taggedAccountIds?.length || 0)>0 && <div className="flex flex-wrap gap-2 px-4 py-2">{selectedPost.taggedAccountIds?.map(id=><button key={id} onClick={()=>openAccount(id)} className="rounded-full bg-zinc-800 px-3 py-1 text-xs">@{id==='me'?INSTAGRAM_PROFILE.username:getAccount(id)?.username||id}</button>)}</div>}
        {commentsOpen && <form onSubmit={e=>{e.preventDefault();addComment(selectedPost.id)}} className="sticky bottom-0 flex gap-2 bg-[#101014] px-4 py-3"><input aria-label="댓글 입력" value={commentDraft} onChange={e=>setCommentDraft(e.target.value)} placeholder="댓글 달기..." className="min-w-0 flex-1 rounded-xl bg-zinc-800 px-3 py-2 text-sm"/><button type="submit" disabled={!commentDraft.trim()} className="text-sky-400 disabled:opacity-40">게시</button></form>}</>}
      </div>
    </> : selectedThread ? <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-3">
        <button aria-label="DM 목록으로" onClick={back}><ArrowLeft size={23}/></button><button onClick={()=>openAccount(selectedThread.accountId)} aria-label="상대방 프로필 열기"><Avatar src={getAvatar(selectedThread.accountId)} name={account?.username || '?'} size={35}/></button><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{account?.username || selectedThread.accountId}</p><p className="truncate text-xs text-zinc-400">{account?.displayName || 'Instagram'}</p></div><MoreHorizontal size={21}/>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-4">
        <button onClick={()=>openAccount(selectedThread.accountId)} className="flex flex-col items-center gap-2 pb-5"><Avatar src={getAvatar(selectedThread.accountId)} name={account?.username || '?'} size={66}/><strong>{account?.username}</strong><span className="text-xs text-zinc-400">{account?.displayName}</span></button>
        {messages.map((message) => <div key={message.id} className={`flex flex-col ${message.from === 'me' ? 'items-end' : 'items-start'}`}>
          <div className={`max-w-[82%] rounded-[20px] px-3.5 py-2.5 text-sm leading-relaxed ${message.from === 'me' ? 'bg-[#6642d5] text-white' : 'bg-[#28282e] text-white'}`}>
            {message.image && <button onClick={()=>setImagePreview(message.image!)} aria-label="DM 사진 확대"><Photo src={message.image} alt="DM 이미지" className="mb-1 max-h-56 w-full rounded-xl"/></button>}{message.text && <span className="whitespace-pre-wrap break-words">{message.text}</span>}
          </div><span className="mt-1 px-1 text-[10px] text-zinc-500">{readableTime(message.sentAt)}</span>
        </div>)}
        <div ref={dmBottomRef}/>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex shrink-0 items-center gap-2 border-t border-white/10 px-3 py-2"><input aria-label="메시지 입력" placeholder="메시지 보내기..." value={draft} onChange={(e) => setDraft(e.target.value)} className="min-w-0 flex-1 rounded-full bg-[#27272d] px-4 py-2.5 text-sm outline-none placeholder:text-zinc-500"/><button type="submit" disabled={!draft.trim()} aria-label="메시지 보내기" className="rounded-full bg-[#6642d5] p-2.5 disabled:opacity-40"><Send size={17}/></button></form>
    </> : tab === 'inbox' ? <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-4"><button aria-label="프로필로 돌아가기" onClick={back}><ArrowLeft size={23}/></button><strong className="min-w-0 flex-1 truncate">{INSTAGRAM_PROFILE.username}</strong><span className="text-sm text-zinc-400">메시지</span></header>
      <div className="min-h-0 flex-1 overflow-y-auto"><div className="px-4 py-3"><div className="flex items-center gap-2 rounded-xl bg-[#24242b] px-3 py-2"><Search size={18} className="text-zinc-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="검색" aria-label="DM 검색" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/>{search && <button onClick={() => setSearch('')} aria-label="검색어 지우기"><X size={15}/></button>}</div></div><div className="px-4 pb-2 text-sm font-bold">메시지</div>
      {filteredThreads.map((thread) => { const other = getAccount(thread.accountId); const all = [...thread.messages, ...(sentMessages[thread.id] || [])]; const last = all[all.length - 1]; return <button key={thread.id} onClick={() => { setThreadId(thread.id); setReadThreads(ids=>[...ids,thread.id]);setDraft('') }} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"><Avatar src={getAvatar(thread.accountId)} name={other?.username || '?'} size={53}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{other?.username || thread.accountId}</p><p className="truncate text-xs text-zinc-400">{last?.image ? '사진' : last?.text || '메시지가 없습니다'} · {last ? readableTime(last.sentAt) : ''}</p></div>{Boolean(thread.unreadCount) && !readThreads.includes(thread.id) && <span className="rounded-full bg-sky-500 px-2 py-0.5 text-xs">{thread.unreadCount}</span>}<ChevronRight size={17} className="text-zinc-500"/></button> })}
      {filteredThreads.length === 0 && <p className="p-8 text-center text-sm text-zinc-500">검색 결과가 없어요.</p>}
      </div>
    </> : tab === 'home' ? <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4"><strong className="text-xl font-semibold tracking-tight">Instagram</strong><button aria-label="DM (준비 중)" type="button" disabled className="cursor-not-allowed"><Send size={24}/></button></header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {storyAccounts.length > 0 && <div className="flex gap-3 overflow-x-auto border-b border-white/10 px-4 py-3">{storyAccounts.map(id=>{const stories=accountStories(id);const story=stories.find(st=>!readStories.includes(st.id))||stories[0];const seen=stories.every(st=>readStories.includes(st.id));return <button key={id} onClick={()=>story&&openStory(story.id)} className="flex shrink-0 flex-col items-center gap-1"><div className={`rounded-full p-[2px] ${seen?'bg-zinc-500':'bg-gradient-to-tr from-fuchsia-600 via-pink-500 to-amber-400'}`}><div className="rounded-full border-2 border-[#101014]"><Avatar src={ownerAvatar(id)} name={ownerName(id)} size={54}/></div></div><span className="max-w-16 truncate text-[10px]">{isOwner(id)?'내 스토리':ownerName(id)}</span></button>})}</div>}
        {visiblePosts.map(post=><article key={post.id} className="border-b border-white/10 pb-4"><button onClick={()=>openAccount(postOwner(post))} className="flex w-full items-center gap-2 px-4 py-3 text-left"><Avatar src={ownerAvatar(postOwner(post))} name={ownerName(postOwner(post))} size={34}/><strong className="text-sm">{ownerName(postOwner(post))}</strong><span className="ml-auto text-xs text-zinc-500">{readableTime(post.postedAt)}</span></button><button className="block w-full bg-zinc-900" onClick={()=>openPost(post)} aria-label="게시물 열기"><Photo src={post.images[0]||''} alt={post.caption} className="aspect-square w-full"/></button><div className="flex items-center gap-4 px-4 pt-3"><button aria-label="좋아요" onClick={()=>setLikedPosts(prev=>prev.includes(post.id)?prev.filter(id=>id!==post.id):[...prev,post.id])}><Heart size={23} fill={likedPosts.includes(post.id)?'#fb7185':'none'}/></button><button onClick={()=>{setHomeCommentsPostId(prev=>prev===post.id?null:post.id);setCommentDraft('')}} aria-label={homeCommentsPostId===post.id?'댓글 입력 닫기':'댓글 입력 열기'} aria-expanded={homeCommentsPostId===post.id}><MessageCircle size={23}/></button><button type="button" disabled aria-label="공유 (준비 중)" className="cursor-not-allowed"><Send size={23}/></button></div><p className="px-4 pt-2 text-sm"><button onClick={()=>openAccount(postOwner(post))} className="font-semibold">{ownerName(postOwner(post))}</button> {post.caption}</p>{<div className="mt-3 border-t border-white/10 px-4 py-3"><div className="mb-2 text-sm font-semibold">댓글 {post.comments.length+(localComments[post.id]?.length||0)}개</div>{[...post.comments,...(localComments[post.id]||[])].map(comment=><div key={comment.id} className="flex items-start gap-2 py-2 text-sm"><Avatar src={ownerAvatar(comment.accountId)} name={ownerName(comment.accountId)} size={28}/><div className="min-w-0 flex-1"><p><strong>{ownerName(comment.accountId)}</strong> {comment.text}</p><span className="text-[10px] text-zinc-500">{readableTime(comment.commentedAt)}</span></div><button type="button" onClick={()=>toggleCommentLike(comment.id)} aria-label="댓글 좋아요" className="flex items-center gap-1 text-xs text-zinc-400"><Heart size={15} fill={likedComments.includes(comment.id)?'#fb7185':'none'} color={likedComments.includes(comment.id)?'#fb7185':'currentColor'}/>{(comment.likes||0)+Number(likedComments.includes(comment.id))}</button></div>)}{homeCommentsPostId===post.id && <form onSubmit={e=>{e.preventDefault();addComment(post.id)}} className="mt-3 flex gap-2"><input aria-label="댓글 입력" value={commentDraft} onChange={e=>setCommentDraft(e.target.value)} placeholder="댓글 달기..." className="min-w-0 flex-1 rounded-xl bg-zinc-800 px-3 py-2 text-sm"/><button type="submit" disabled={!commentDraft.trim()} className="text-sky-400 disabled:opacity-40">게시</button></form>}</div>}</article>)}
        {visiblePosts.length===0 && <p className="p-10 text-center text-sm text-zinc-400">표시할 게시물이 없어요.</p>}
      </div>
    </> : tab === 'search' ? <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 px-4"><Search size={20}/><input aria-label="계정 검색" value={accountSearch} onChange={e=>setAccountSearch(e.target.value)} placeholder="계정 검색" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4">{INSTAGRAM_ACCOUNTS.filter(a=>`${a.username} ${a.displayName}`.toLowerCase().includes(accountSearch.toLowerCase())).map(a=><button key={a.id} onClick={()=>openAccount(a.id)} className="flex w-full items-center gap-3 border-b border-white/5 py-3 text-left"><Avatar src={getAvatar(a.id)} name={a.username}/><span><strong className="block text-sm">{a.username}</strong><span className="text-xs text-zinc-400">{a.displayName}</span></span></button>)}</div>
    </> : <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4"><strong className="truncate text-base">{viewedUsername}</strong><button aria-label="DM (준비 중)" type="button" disabled className="relative cursor-not-allowed p-1"><Send size={24}/></button></header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="flex items-center gap-3 px-4 py-5"><button type="button" aria-label={`${viewedUsername} 스토리 보기`} disabled={accountStories(viewAccountId).length===0} onClick={()=>openAccountStory(viewAccountId)} className={`shrink-0 rounded-full ${accountStoryRing(viewAccountId)?`p-[3px] ${accountStoryRing(viewAccountId)}`:""}`}><span className="block rounded-full bg-[#101014] p-[2px]"><Avatar src={viewedAvatar} name={viewedUsername} size={76}/></span></button><div className="flex flex-1 justify-around gap-1 text-center text-xs"><div><strong className="block text-base">{INSTAGRAM_POSTS.filter(p=>isOwner(viewAccountId)?isOwner(postOwner(p)):postOwner(p)===viewAccountId).length}</strong>게시물</div><button onClick={()=>openRelationship('followers')} aria-label="팔로워 목록 열기"><strong className="block text-base">{viewedAccount?.followerIds?.length ?? (isOwner(viewAccountId)?INSTAGRAM_PROFILE.followers:0)}</strong>팔로워</button><button onClick={()=>openRelationship('following')} aria-label="팔로잉 목록 열기"><strong className="block text-base">{isOwner(viewAccountId) && Object.keys(followOverrides).length ? relationshipIds.length : viewedAccount?.followingIds?.length ?? (isOwner(viewAccountId)?INSTAGRAM_PROFILE.following:0)}</strong>팔로잉</button></div></div>
      <div className="px-4 pb-3 text-sm"><strong>{viewedAccount?.displayName}</strong><p className="mt-1 whitespace-pre-wrap text-sm">{viewedAccount?.bio}</p>{isOwner(viewAccountId) && INSTAGRAM_PROFILE.link && <p className="mt-1 text-sky-400">{INSTAGRAM_PROFILE.link}</p>}</div>
      {!isOwner(viewAccountId) && <div className="flex gap-2 px-4 pb-4"><button onClick={()=>changeFollowing(viewAccountId)} className="flex-1 rounded-lg bg-[#34343c] py-2 text-xs font-semibold">{isFollowing(viewAccountId)?'✓ 팔로잉':'팔로우'}</button><button type="button" disabled className="flex-1 rounded-lg bg-[#34343c] py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40">메시지 보내기</button></div>}
      {canViewPosts && highlights.length>0 && <div className="flex gap-3 overflow-x-auto px-4 pb-4">{highlights.map(h=><button key={h.id} onClick={()=>openHighlight(h.id)} className="flex shrink-0 flex-col items-center gap-1"><Avatar src={h.cover || INSTAGRAM_STORIES.find(st=>st.id===h.storyIds[0])?.image} name={h.title} size={60}/><span className="max-w-16 truncate text-[11px]">{h.title}</span></button>)}</div>}
      {canViewPosts ? <><div className="flex justify-center border-t border-white/10 py-3"><Grid3X3 size={21}/></div>{<div className="grid grid-cols-3 gap-[2px]">{INSTAGRAM_POSTS.filter(post=>isOwner(viewAccountId)?isOwner(postOwner(post)):postOwner(post)===viewAccountId).map((post) => <button key={post.id} onClick={() => openPost(post)} className="aspect-square overflow-hidden bg-zinc-800" aria-label={`게시물 열기: ${post.caption}`}><Photo src={post.images[0]} alt={post.caption} className="h-full w-full"/></button>)}</div>}</> : <div className="border-t border-white/10 p-8 text-center text-sm text-zinc-400"><p className="mb-2 text-xl">🔒</p>비공개 계정입니다.</div>}
      </div>
    </>}
    {imagePreview && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 p-3" role="dialog" aria-label="DM 사진 확대"><button onClick={()=>setImagePreview(null)} className="absolute right-4 top-4 rounded-full bg-white/20 p-2" aria-label="닫기"><X/></button><Photo src={imagePreview} alt="확대된 DM 사진" className="max-h-[85%] w-full object-contain"/></div>}
    {!selectedThread && !selectedPost && !storyId && !highlightId && !relationshipMode && <nav aria-label="인스타그램 메뉴" className="flex h-12 shrink-0 items-center justify-around border-t border-white/10"><button aria-label="홈 피드" onClick={goHome} className={tab==='home'?'text-white':'text-zinc-500'}><Home size={23}/></button><button aria-label="검색" onClick={()=>setTab('search')} className={tab==='search'?'text-white':'text-zinc-500'}><Search size={23}/></button><button aria-label="DM (준비 중)" type="button" disabled className="cursor-not-allowed text-zinc-500"><Send size={23}/></button><button aria-label="내 프로필" onClick={goProfile}><Avatar src={INSTAGRAM_PROFILE.avatar} name={INSTAGRAM_PROFILE.username} size={27}/></button></nav>}
  </div>
}
