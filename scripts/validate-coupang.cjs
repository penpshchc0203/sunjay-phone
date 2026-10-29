const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const episodes = ['all', 'ep01', 'ep02', 'ep03']
const errors = []
const ids = new Set()
for (const ep of episodes) {
  const file = path.join(root, 'content', 'coupang', ep + '.json')
  let data
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')) }
  catch (e) { errors.push(`${ep}: JSON 파일을 읽을 수 없습니다: ${e.message}`); continue }
  if (!data || !Array.isArray(data.orders)) { errors.push(`${ep}: orders 배열이 필요합니다`); continue }
  for (const order of data.orders) {
    if (!order || typeof order.id !== 'string' || !order.id) { errors.push(`${ep}: 주문 id 누락`); continue }
    if (ids.has(order.id)) errors.push(`${ep}: 중복 주문 ID ${order.id}`)
    ids.add(order.id)
    if (!order.orderNumber || !/^\d{4}-\d\d-\d\d/.test(order.orderedAt || '')) errors.push(`${ep}/${order.id}: 주문번호 또는 날짜가 잘못되었습니다`)
    if (!Array.isArray(order.items) || !order.items.length) { errors.push(`${ep}/${order.id}: 상품이 없습니다`); continue }
    const itemIds = new Set()
    for (const item of order.items) {
      if (!item.id || itemIds.has(item.id)) errors.push(`${ep}/${order.id}: 상품 ID 누락 또는 중복 ${item.id}`)
      itemIds.add(item.id)
      if (!item.name || !Number.isFinite(item.price) || item.price < 0 || !Number.isInteger(item.quantity) || item.quantity < 1) errors.push(`${ep}/${order.id}/${item.id}: 상품명/가격/수량 확인`)
    }
    if (!Number.isFinite(order.shippingFee) || !Number.isFinite(order.totalPrice)) errors.push(`${ep}/${order.id}: 결제 금액 확인`)
  }
}
if (errors.length) { errors.forEach(x => console.error('ERROR:', x)); process.exitCode = 1 }
else console.log('쿠팡 JSON 검사 완료: 오류 없음')
