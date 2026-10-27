'use client'
import { useState } from 'react'
export function AdminLogin(){
 const [password,setPassword]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false)
 return <main className="min-h-dvh bg-zinc-950 text-white flex items-center justify-center p-5"><form className="w-full max-w-sm space-y-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-7" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});if(!r.ok)throw Error('암호를 확인해 주세요.');window.location.reload()}catch(err){setError(String(err))}finally{setBusy(false)}}}><h1 className="text-2xl font-semibold">콘텐츠 관리자</h1><label className="block text-sm">관리자 암호<input type="password" autoComplete="current-password" className="mt-2 w-full rounded-lg bg-zinc-800 p-3" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<p role="alert" className="text-red-300">{error}</p>}<button disabled={busy} className="w-full rounded-lg bg-white p-3 font-semibold text-black">{busy?'확인 중…':'로그인'}</button></form></main>
}
