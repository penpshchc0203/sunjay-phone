import type {AppId,PhoneState} from './types'
export const initialPhoneState:PhoneState={mode:'lock',currentApp:null,appRoutes:{},recentApps:[]}
type Action = {type:'HYDRATE';state:PhoneState}|{type:'UNLOCK'|'LOCK'|'GO_HOME'|'BACK'|'CLEAR_RECENTS'|'RESET'}|{type:'OPEN_APP'|'REMOVE_RECENT';appId:AppId}|{type:'PUSH_ROUTE';route:string}
export function sanitizePhoneState(value:unknown):PhoneState {
 if(!value || typeof value!=='object')return initialPhoneState
 const v=value as Partial<PhoneState>
 return {mode:v.mode==='home'||v.mode==='app'||v.mode==='lock'?v.mode:'lock',currentApp:typeof v.currentApp==='string'?v.currentApp:null,appRoutes:v.appRoutes&&typeof v.appRoutes==='object'?v.appRoutes:{},recentApps:Array.isArray(v.recentApps)?v.recentApps:[]}
}
export function phoneReducer(state:PhoneState,action:Action):PhoneState {
 switch(action.type){
 case 'HYDRATE':return action.state
 case 'RESET':return initialPhoneState
 case 'UNLOCK':return {...state,mode:'home',currentApp:null}
 case 'LOCK':return {...state,mode:'lock',currentApp:null}
 case 'GO_HOME':return {...state,mode:'home',currentApp:null}
 case 'OPEN_APP':return {...state,mode:'app',currentApp:action.appId,appRoutes:{...state.appRoutes,[action.appId]:[]},recentApps:[action.appId,...state.recentApps.filter(a=>a!==action.appId)]}
 case 'PUSH_ROUTE':return state.currentApp?{...state,appRoutes:{...state.appRoutes,[state.currentApp]:[...(state.appRoutes[state.currentApp]||[]),action.route]}}:state
 case 'BACK':{if(state.mode!=='app'||!state.currentApp)return state;const routes=state.appRoutes[state.currentApp]||[];return routes.length?{...state,appRoutes:{...state.appRoutes,[state.currentApp]:routes.slice(0,-1)}}:{...state,mode:'home',currentApp:null}}
 case 'REMOVE_RECENT':return {...state,recentApps:state.recentApps.filter(a=>a!==action.appId)}
 case 'CLEAR_RECENTS':return {...state,recentApps:[]}
 }
}
