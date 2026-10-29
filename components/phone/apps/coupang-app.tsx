'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, Search, SlidersHorizontal, Package, ChevronDown, ChevronUp, MoreHorizontal, Home, Grid2X2, UserRound, ShoppingCart, X } from 'lucide-react'
import { useEpisode } from '../episode-provider'
import { usePhone } from '../phone-provider'
import type { CoupangOrder } from '@/content/episodes/types'

const money = (value: number) => `${Math.max(0, value || 0).toLocaleString('ko-KR')}원`
const dateLabel = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (match) return `${match[1]}. ${Number(match[2])}. ${Number(match[3])}`
  return value
}
const statusLabel: Record<string, string> = {
  delivered: '배송완료', shipping: '배송중', preparing: '상품준비중', ordered: '주문완료', cancelled: '주문취소', refunded: '환불완료',
}
const label = (status: string) => statusLabel[status] || status
const orderAmount = (order: CoupangOrder) => order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

function ItemImage({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false)
  return <div className="flex size-[88px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#f4f5f6] text-[#a3a9af]">
    {src && !failed ? <img src={src.startsWith('/images/') ? `/sunjay-phone${src}` : src} alt={name} className="size-full object-cover" onError={() => setFailed(true)}/> : <Package size={31} strokeWidth={1.5}/>}
  </div>
}

export function CoupangApp() {
  const { content } = useEpisode()
  const { back, goHome } = usePhone()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState<'all' | 'delivered' | 'shipping' | 'cancelled'>('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const orders = useMemo(() => [...(content.orders ?? [])].sort((a, b) => b.orderedAt.localeCompare(a.orderedAt) || b.id.localeCompare(a.id)), [content.orders])
  const selected = orders.find(order => order.id === selectedId)
  const shown = orders.filter(order => (filter === 'all' || order.status === filter) && order.items.some(item => `${item.name} ${item.option ?? ''}`.toLowerCase().includes(search.toLowerCase())))
  const goBack = () => { if (selectedId) setSelectedId(null); else if (filterOpen) setFilterOpen(false); else back() }

  return <section aria-label="쿠팡 주문내역" className="flex h-full min-h-0 flex-col bg-white text-[#202124]">
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#f4f4f4] px-4">
      <button type="button" onClick={goBack} aria-label="뒤로 가기" className="p-1"><ArrowLeft size={25} strokeWidth={1.7}/></button>
      <h1 className="min-w-0 flex-1 truncate text-[21px] font-bold">{selected ? '주문상세' : '주문내역'}</h1>
      <button type="button" onClick={goHome} aria-label="홈 화면으로" className="p-1"><Home size={21} strokeWidth={1.8}/></button>
    </header>

    {selected ? <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
      <div className="border-b-8 border-[#f5f6f7] px-5 py-5">
        <h2 className="text-lg font-bold">{dateLabel(selected.orderedAt)} 주문</h2>
        <p className="mt-2 text-xs text-[#777]">주문번호 {selected.orderNumber}</p>
        <p className={`mt-4 text-lg font-bold ${selected.status === 'delivered' ? 'text-[#12812a]' : 'text-[#333]'}`}>{label(selected.status)}</p>
      </div>
      <div className="border-b-8 border-[#f5f6f7] px-5 py-4">
        <h3 className="mb-4 text-base font-bold">주문 상품</h3>
        <div className="space-y-5">{selected.items.map(item => <div key={item.id} className="flex gap-3"><ItemImage src={item.image} name={item.name}/><div className="min-w-0 flex-1"><p className="text-sm leading-5">{item.name}</p>{item.option && <p className="mt-1 text-xs text-[#777]">{item.option}</p>}<p className="mt-2 text-sm text-[#666]">{money(item.price)} · {item.quantity}개</p></div></div>)}</div>
      </div>
      <div className="border-b-8 border-[#f5f6f7] px-5 py-5 text-sm">
        <h3 className="mb-4 text-base font-bold">결제 정보</h3>
        <div className="flex justify-between py-2"><span>상품 금액</span><span>{money(orderAmount(selected))}</span></div>
        <div className="flex justify-between py-2"><span>배송비</span><span>{money(selected.shippingFee)}</span></div>
        <div className="mt-3 flex justify-between border-t pt-4 font-bold"><span>총 결제 금액</span><span>{money(selected.totalPrice)}</span></div>
      </div>
      {selected.shippingAddress && <div className="px-5 py-5"><h3 className="mb-3 text-base font-bold">배송지</h3><p className="whitespace-pre-wrap text-sm text-[#555]">{selected.shippingAddress}</p></div>}
    </div> : <>
      <div className="shrink-0 px-4 pb-4 pt-4">
        <div className="flex items-center gap-3">
          <label className="flex h-[46px] min-w-0 flex-1 items-center gap-2 rounded-md border border-[#c9c9c9] px-3"><Search size={21} strokeWidth={1.7}/><input aria-label="주문한 상품 검색" value={search} onChange={e => setSearch(e.target.value)} placeholder="주문한 상품을 검색할 수 있어요!" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#888]"/>{search && <button type="button" aria-label="검색어 지우기" onClick={() => setSearch('')}><X size={16}/></button>}</label>
          <button type="button" onClick={() => setFilterOpen(!filterOpen)} aria-label="배송 상태 필터" aria-expanded={filterOpen} className="p-1 text-[#71808a]"><SlidersHorizontal size={24}/></button>
        </div>
        {filterOpen && <div className="mt-3 flex flex-wrap gap-2">{([['all','전체'],['delivered','배송완료'],['shipping','배송중'],['cancelled','주문취소']] as const).map(([id,name]) => <button type="button" key={id} onClick={() => { setFilter(id); setFilterOpen(false) }} className={`rounded-full border px-3 py-1.5 text-xs ${filter === id ? 'border-[#3675df] bg-[#eef5ff] text-[#3675df]' : 'border-[#ddd] text-[#666]'}`}>{name}</button>)}</div>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {shown.length === 0 && <div className="py-20 text-center text-sm text-[#888]">주문 내역이 없습니다.</div>}
        {shown.map(order => {
          const isExpanded = expanded[order.id] ?? true
          return <section key={order.id} className="border-b-[9px] border-[#f5f6f7]">
            <div className="flex items-center justify-between border-b border-[#eee] px-5 py-4"><h2 className="text-lg font-bold">{dateLabel(order.orderedAt)}</h2><button type="button" aria-label="주문 상세 보기" onClick={() => setSelectedId(order.id)} className="text-[#999]"><MoreHorizontal size={24}/></button></div>
            <div className="px-5 pb-4 pt-5">
              <button type="button" onClick={() => setSelectedId(order.id)} className="mb-4 block w-full text-left"><span className="text-[17px] font-bold">{label(order.status)}</span>{order.deliveredAt && <span className="ml-2 text-sm font-medium text-[#12812a]">{dateLabel(order.deliveredAt)} 도착</span>}{order.rocketFresh && <span className="ml-2 text-sm font-bold italic text-[#13a42d]">🚀 로켓프레시</span>}</button>
              {isExpanded && <div className="space-y-5">{order.items.map(item => <div key={item.id}>
                <button type="button" onClick={() => setSelectedId(order.id)} className="flex w-full items-center gap-3 text-left"><ItemImage src={item.image} name={item.name}/><div className="min-w-0 flex-1"><p className="text-[15px] leading-6">{item.name}</p>{item.option && <p className="text-xs text-[#777]">{item.option}</p>}<p className="mt-1 text-sm text-[#666]">{money(item.price)} · {item.quantity}개</p></div></button>
                <button type="button" onClick={() => setSelectedId(order.id)} className="mt-3 w-full rounded border border-[#b9c0c4] py-2.5 text-sm font-semibold text-[#535c63]">배송 · 주문 관리</button>
              </div>)}</div>}
              {order.items.length > 1 && <button type="button" onClick={() => setExpanded(prev => ({ ...prev, [order.id]: !isExpanded }))} className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-[#c7cccf] py-2.5 text-sm font-medium text-[#555]">{isExpanded ? '접기' : '펼치기'} {isExpanded ? <ChevronUp size={19}/> : <ChevronDown size={19}/>}</button>}
            </div>
          </section>
        })}
      </div>
      <nav aria-label="쿠팡 하단 메뉴" className="flex h-[62px] shrink-0 items-center justify-around border-t border-[#e5e5e5] bg-white text-[#111]">
        <div className="flex flex-col items-center gap-0.5"><Home size={23}/><span className="text-[10px]">홈</span></div>
        <div className="flex flex-col items-center gap-0.5"><Grid2X2 size={23}/><span className="text-[10px]">카테고리</span></div>
        <div className="flex flex-col items-center gap-0.5"><Search size={23}/><span className="text-[10px]">검색</span></div>
        <div className="flex flex-col items-center gap-0.5 text-[#3675df]"><UserRound size={23} fill="currentColor"/><span className="text-[10px]">마이쿠팡</span></div>
        <div className="flex flex-col items-center gap-0.5"><ShoppingCart size={23}/><span className="text-[10px]">장바구니</span></div>
      </nav>
    </>}
  </section>
}
