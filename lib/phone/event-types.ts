import type { AppId } from './types'
export type EventTrigger =
 | {type:'kakao.send';roomId?:string;keyword:string}
 | {type:'instagram.story.upload';keyword?:string}
 | {type:'app.open';appId:AppId}
 | {type:'action';name:string}
export type EventAction =
 | {type:'notification';appId:AppId;title:string;body:string;targetId?:string}
 | {type:'kakao.reply';roomId:string;from:string;text?:string;image?:string}
 | {type:'instagram.dm';threadId:string;accountId:string;from:string;text:string;image?:string}
 | {type:'instagram.story.like';storyId:string;accountId:string}
 | {type:'phone.incoming';contactId:string;displayName:string}
export type PhoneEventDefinition = {id:string;enabled:boolean;repeat:'once'|'always';trigger:EventTrigger;actions:EventAction[]}
export type EventInput = {type:'kakao.send'|'instagram.story.upload'|'app.open'|'action';triggerId:string;roomId?:string;keyword?:string;appId?:AppId;name?:string}
export type EventExecution = {id:string;eventId:string;triggerId:string;executedAt:string;actions:EventAction[]}
