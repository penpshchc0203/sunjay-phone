import ep02 from './ep02.json'
import ep03 from './ep03.json'
import entryCall from './entry-call-ep02.json'
import type { CallDialogue } from '@/components/phone/call-experience'
const sources:Record<string,{dialogues:CallDialogue[]}>={ep02:ep02 as {dialogues:CallDialogue[]},ep03:ep03 as {dialogues:CallDialogue[]}}
export const getCallDialogues=(episodeId:string):CallDialogue[]=>{
 const existing=sources[episodeId]?.dialogues??[]
 if(episodeId!=='ep02')return existing
 const variants=Object.entries(entryCall.variants).map(([band,variant])=>({id:`${entryCall.id}:${band}`,eventId:entryCall.id,contactId:entryCall.contactId,title:'선우에게 걸려온 전화',lines:variant.lines as CallDialogue['lines']}))
 return [...existing,...variants]
}
