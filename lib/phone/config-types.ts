import type { LucideIcon } from 'lucide-react'
import type { AppId } from './types'
export interface DesignConfig {
 lockScreen: {wallpaper:string;dimOpacity:number;clockColor:string;textColor:string}; homeScreen: {wallpaper:string;dimOpacity:number;clockColor:string;textColor:string};
 statusBar: {textColor:string;carrier:string;batteryLevel:number;signalStrength:number;wifi:boolean};
 theme: {appBackground:string;surface:string;textColor:string;accent:string};
 apps: Record<AppId,{name:string;icon:LucideIcon;tileColor:string;iconColor?:string;iconImage?:string;implemented:boolean}>;
 homeGrid: AppId[]; dock: AppId[]
}
export interface CharacterConfig { owner:{name:string;profileImage?:string;statusMessage?:string};user:{displayName:string;phoneNumber?:string;avatar?:string};device:{deviceName:string;model:string;phoneNumber:string} }
