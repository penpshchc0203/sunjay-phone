import type {AppId} from './types'
export interface Contact {id:string;name:string;phoneNumber?:string;avatar?:string;relation?:string;favorite?:boolean}
export interface KakaoFriendProfile {contactId:string;statusMessage?:string;music?:string;backgroundImage?:string}
export interface KakaoMessage {id:string;from:string;text?:string;image?:string;images?:string[];emoticon?:string;sentAt:string;unreadCount?:number;deleted?:boolean}
export interface KakaoRoom {backgroundImage?:string;wallpaper?:string;id:string;type:'direct'|'group';title?:string;memberIds:string[];pinned?:boolean;muted?:boolean;unreadCount?:number;messages:KakaoMessage[]}
export interface InstagramOwnProfile {id?:string;username:string;displayName:string;avatar?:string;bio?:string;followers:number;following:number;link?:string;private?:boolean;followerIds?:string[];followingIds?:string[];highlights?:InstagramHighlight[]}
export interface InstagramAccount {id:string;username:string;displayName:string;avatar?:string;contactId?:string;bio?:string;private?:boolean;followerIds?:string[];followingIds?:string[];highlights?:InstagramHighlight[]}
export interface InstagramComment {id:string;accountId:string;text:string;commentedAt:string;parentId?:string}
export interface InstagramPost {id:string;accountId?:string;images:string[];caption:string;location?:string;postedAt:string;likes:number;comments:InstagramComment[];taggedAccountIds?:string[]}
export interface InstagramDmMessage {id:string;from:'me'|'them';text?:string;image?:string;sentAt:string;read?:boolean}
export interface InstagramDmThread {id:string;accountId:string;unreadCount?:number;messages:InstagramDmMessage[]}
export interface InstagramHighlight {id:string;title:string;cover?:string;storyIds:string[]}
export interface InstagramStory {id:string;accountId:string;image:string;caption?:string;postedAt:string;highlight?:string}
export interface SmsThread {id:string;contactId?:string;unknownNumber?:string;unreadCount?:number;messages:{id:string;from:'me'|'them';text:string;sentAt:string}[]}
export interface Photo {id:string;src:string;alt:string;takenAt:string;album?:string;albumIds?:string[];favorite?:boolean;hidden?:boolean;location?:string;description?:string}
export interface Note {id:string;title:string;body:string;createdAt:string;updatedAt?:string;pinned?:boolean;folder?:string;locked?:boolean;lockCode?:string}
export interface CallLogEntry {id:string;contactId?:string;unknownNumber?:string;type:'missed'|'incoming'|'outgoing'|'rejected';calledAt:string;durationSec?:number}
export interface BrowserHistoryEntry {id:string;title:string;url:string;visitedAt:string}
export interface BrowserSearchEntry {id:string;query:string;searchedAt:string}
export interface LockNotification {id:string;appId:AppId;title:string;body:string;timeLabel:string;targetId?:string}

/** 검색 결과는 실제 Google 결과가 아니라 작품 안에서 작성한 가상 콘텐츠입니다. */
export interface BrowserSearchResult { id: string; query: string; title: string; description: string; url?: string; siteName?: string; body?: string }
