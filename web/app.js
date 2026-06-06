const STORAGE_KEY = 'reverse_auction_web_state_v1'
const USER = { id: 'buyer_001', name: '体验买家' }
const PRIORITY_WINDOW = 5 * 60 * 1000
const SAMPLE_IMAGE = '../assets/product-sample.svg'

function seedState() {
  const now = Date.now()
  const sampleRichContent = `<div style="margin-bottom:16px"><h3 style="font-size:16px;color:#1a1a2e;margin:0 0 8px">产品亮点</h3><ul style="padding-left:18px;margin:0;color:#4a4a6a;line-height:1.8"><li>精选三大产区咖啡豆，口感层次丰富</li><li>手冲器具套装，新手也能轻松上手</li><li>精美礼盒包装，送礼自用两相宜</li></ul></div><div style="margin-bottom:16px"><h3 style="font-size:16px;color:#1a1a2e;margin:0 0 8px">规格参数</h3><table style="width:100%;border-collapse:collapse;font-size:13px;color:#4a4a6a"><tr><td style="padding:6px 8px;border-bottom:1px solid #eaeaf2;width:40%">净含量</td><td style="padding:6px 8px;border-bottom:1px solid #eaeaf2">500g x 3</td></tr><tr><td style="padding:6px 8px;border-bottom:1px solid #eaeaf2;width:40%">保质期</td><td style="padding:6px 8px;border-bottom:1px solid #eaeaf2">12个月</td></tr><tr><td style="padding:6px 8px;border-bottom:1px solid #eaeaf2;width:40%">储存方式</td><td style="padding:6px 8px;border-bottom:1px solid #eaeaf2">阴凉干燥处</td></tr></table></div><p style="color:#8e8ea0;font-size:12px;margin:0">* 图片仅供参考，以实物为准</p>`
  return {
    auctions: [
      {
        id: 'auc_1001',
        title: '精品手冲咖啡礼盒',
        image: SAMPLE_IMAGE,
        description: '含三支不同产区咖啡豆，适合办公室与家庭冲煮。',
        richContent: sampleRichContent,
        stock: 1,
        startPrice: 299,
        reservePrice: 188,
        currentPrice: 259,
        minDrop: 3,
        maxDrop: 15,
        cooldownSeconds: 12,
        maxParticipants: 30,
        endAt: now + 2 * 60 * 60 * 1000,
        status: 'active',
        bidCount: 3,
        participants: ['buyer_102', 'buyer_088'],
        lastBidderId: 'buyer_088',
        lastBidderName: '用户088',
        lastBidAt: now - 4 * 60 * 1000,
        cooldowns: {},
        priorityBuyerId: '',
        priorityBuyerName: '',
        priorityExpireAt: 0,
        records: [
          { id: 'rec_1', userId: 'buyer_102', userName: '用户102', drop: 12, priceAfter: 287, createdAt: now - 18 * 60 * 1000 },
          { id: 'rec_2', userId: 'buyer_088', userName: '用户088', drop: 13, priceAfter: 274, createdAt: now - 9 * 60 * 1000 },
          { id: 'rec_3', userId: 'buyer_088', userName: '用户088', drop: 15, priceAfter: 259, createdAt: now - 4 * 60 * 1000 }
        ],
        createdAt: now - 30 * 60 * 1000
      },
      {
        id: 'auc_1002',
        title: '桌面无线充电台灯',
        image: SAMPLE_IMAGE,
        description: '三档色温，带手机无线充电区域，适合书桌与床头。',
        richContent: '',
        stock: 2,
        startPrice: 199,
        reservePrice: 129,
        currentPrice: 199,
        minDrop: 2,
        maxDrop: 8,
        cooldownSeconds: 8,
        maxParticipants: 20,
        endAt: now + 5 * 60 * 60 * 1000,
        status: 'active',
        bidCount: 0,
        participants: [],
        lastBidderId: '',
        lastBidderName: '',
        lastBidAt: 0,
        cooldowns: {},
        priorityBuyerId: '',
        priorityBuyerName: '',
        priorityExpireAt: 0,
        records: [],
        createdAt: now - 10 * 60 * 1000
      }
    ],
    orders: []
  }
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const state = seedState()
    saveState(state)
    return state
  }
  return JSON.parse(raw)
}

function saveState(nextState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
}

let state = loadState()
let activeAuctionId = ''
let pulseAuctionId = ''

function money(amount) {
  return Number(amount || 0).toFixed(2)
}

function toCents(amount) {
  return Math.round(Number(amount || 0) * 100)
}

function fromCents(cents) {
  return Math.round(cents) / 100
}

function randomDrop(minDrop, maxDrop, currentPrice, reservePrice) {
  const min = Math.max(1, toCents(minDrop))
  const max = Math.max(min, toCents(maxDrop))
  const usable = Math.max(0, toCents(currentPrice) - toCents(reservePrice))
  if (usable <= 0) return 0
  const boundedMax = Math.min(max, usable)
  return fromCents(Math.floor(Math.random() * (boundedMax - min + 1)) + min)
}

function countdownText(targetAt) {
  const diff = Math.max(0, Number(targetAt || 0) - Date.now())
  const totalSeconds = Math.floor(diff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}时${minutes}分`
  if (minutes > 0) return `${minutes}分${seconds}秒`
  return `${seconds}秒`
}

function statusText(status) {
  return {
    active: '进行中',
    floor: '触底待成交',
    sold: '已成交',
    ended: '已结束'
  }[status] || '未知'
}

function normalizeState() {
  let changed = false
  const now = Date.now()
  state.auctions.forEach((auction) => {
    if (auction.status === 'active' && Number(auction.endAt) <= now) {
      auction.status = 'ended'
      changed = true
    }
    if (auction.status === 'floor' && Number(auction.priorityExpireAt || 0) <= now) {
      auction.priorityBuyerId = ''
      auction.priorityBuyerName = ''
      changed = true
    }
  })
  if (changed) saveState(state)
}

function enriched(auction) {
  return {
    ...auction,
    statusLabel: statusText(auction.status),
    priceText: money(auction.currentPrice),
    startPriceText: money(auction.startPrice),
    reservePriceText: money(auction.reservePrice),
    participantCount: (auction.participants || []).length,
    countdown: auction.status === 'floor' ? countdownText(auction.priorityExpireAt) : countdownText(auction.endAt)
  }
}

function tagClass(status) {
  if (status === 'sold') return 'green'
  if (status === 'ended') return 'gray'
  return ''
}

function showView(viewId) {
  document.querySelectorAll('.view').forEach((el) => el.classList.remove('active'))
  const target = document.getElementById(viewId)
  if (target) target.classList.add('active')
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewId)
  })
}

function toast(message, duration) {
  duration = duration || 2200
  const el = document.getElementById('toast')
  el.textContent = message
  el.classList.add('show')
  clearTimeout(el._timer)
  el._timer = setTimeout(() => el.classList.remove('show'), duration)
}

function render() {
  normalizeState()
  renderMarket()
  renderSeller()
  if (document.getElementById('detail').classList.contains('active')) renderDetail()
  if (document.getElementById('manage').classList.contains('active')) renderManage()
}

function renderMarket() {
  const list = document.getElementById('auctionList')
  list.innerHTML = state.auctions.map(enriched).map((item) => `
    <div class="auction-card" data-detail="${item.id}">
      <img src="${item.image}" alt="${item.title}" loading="lazy">
      <div class="auction-body">
        <div class="row">
          <div class="title">${item.title}</div>
          <div class="tag ${tagClass(item.status)}">${item.statusLabel}</div>
        </div>
        <div class="price">¥${item.priceText}</div>
        <div class="meta">
          <span>${item.participantCount} 人参与</span>
          <span>${item.bidCount} 次举牌</span>
          <span>${item.countdown}</span>
        </div>
      </div>
    </div>
  `).join('') || '<div class="empty card">暂无拍卖数据</div>'
}

function renderDetail() {
  const auction = state.auctions.find((item) => item.id === activeAuctionId)
  if (!auction) {
    document.getElementById('detailPanel').innerHTML = '<div class="empty card">拍卖不存在</div>'
    return
  }
  const item = enriched(auction)
  const now = Date.now()
  const user = USER
  const cooldownLeft = Math.max(0, Math.ceil(((Number(item.cooldowns[user.id] || 0) + Number(item.cooldownSeconds || 10) * 1000) - now) / 1000))
  const bidDisabled = item.status !== 'active' || cooldownLeft > 0
  const hasPriority = item.status === 'floor' && item.priorityBuyerId && item.priorityBuyerId !== user.id
  const buyDisabled = item.status === 'sold' || item.status === 'ended' || hasPriority
  const pulseClass = pulseAuctionId === item.id ? 'pulse' : ''
  const records = (item.records || []).slice().reverse()
  const bidText = item.status === 'floor' ? '已触底' : item.status === 'sold' ? '已成交' : item.status === 'ended' ? '已结束' : cooldownLeft > 0 ? `${cooldownLeft}秒后可举牌` : '举牌降价'
  const buyText = buyDisabled && item.status === 'floor' && !hasPriority ? '优先购买中' : '立即拍下'

  const richSection = item.richContent ? `
    <div class="card panel">
      <h2>商品详情</h2>
      <div class="rich-content">${item.richContent}</div>
    </div>
  ` : ''

  document.getElementById('detailPanel').innerHTML = `
    <img class="detail-cover" src="${item.image}" alt="${item.title}">
    <div class="card panel">
      <div class="row">
        <h1 style="flex:1;min-width:0;margin:0">${item.title}</h1>
        <div class="tag ${tagClass(item.status)}">${item.statusLabel}</div>
      </div>
      <p style="margin-top:10px">${item.description}</p>
      <div class="price-panel ${pulseClass}">
        <div class="stat-label" style="color:#9a3412">当前成交价</div>
        <div class="price">¥${item.priceText}</div>
        <div style="color:#9a3412;font-size:13px;margin-top:6px">起拍 ¥${item.startPriceText} · 保底 ¥${item.reservePriceText}</div>
      </div>
      <div class="stats-grid" style="margin-top:16px">
        <div class="stat-card"><div class="stat-value">${item.participantCount}</div><div class="stat-label">参与人数</div></div>
        <div class="stat-card"><div class="stat-value">${item.bidCount}</div><div class="stat-label">举牌次数</div></div>
        <div class="stat-card"><div class="stat-value">${item.countdown}</div><div class="stat-label">${item.status === 'floor' ? '优先剩余' : '剩余时间'}</div></div>
      </div>
    </div>
    ${item.status === 'floor' && hasPriority ? `<div class="notice panel">已触及保底价，${item.priorityBuyerName} 拥有优先购买权。</div>` : ''}
    <div class="action-row">
      <button class="primary-button" id="bidBtn" ${bidDisabled ? 'disabled' : ''}>${bidText}</button>
      <button class="danger-button" id="buyBtn" ${buyDisabled ? 'disabled' : ''}>${buyText}</button>
    </div>
    ${richSection}
    <div class="card panel">
      <h2>拍卖参数</h2>
      <div class="info-row"><span>随机降幅</span><span>¥${item.minDrop} - ¥${item.maxDrop}</span></div>
      <div class="info-row"><span>举牌冷却</span><span>${item.cooldownSeconds} 秒</span></div>
      <div class="info-row"><span>库存</span><span>${item.stock} 件</span></div>
      <div class="info-row"><span>人数上限</span><span>${item.maxParticipants || '不限'}</span></div>
    </div>
    <div class="card panel">
      <h2>举牌记录</h2>
      ${records.length === 0 ? '<div class="empty">暂无举牌，等你来打下第一口价</div>' : records.map((r) => `
        <div class="record-row">
          <div>
            <div style="font-weight:700;color:var(--ink)">${r.userName}</div>
            <div style="font-size:12px;color:var(--muted)">${new Date(r.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div class="record-price">-¥${money(r.drop)} → ¥${money(r.priceAfter)}</div>
        </div>
      `).join('')}
    </div>
  `
}

function handleBid() {
  const now = Date.now()
  const auction = state.auctions.find((item) => item.id === activeAuctionId)
  if (!auction || auction.status !== 'active') return
  const user = USER
  const cooldownLeft = Math.max(0, Math.ceil(((Number(auction.cooldowns[user.id] || 0) + Number(auction.cooldownSeconds || 10) * 1000) - now) / 1000))
  if (cooldownLeft > 0) {
    toast(`请等待 ${cooldownLeft} 秒`)
    return
  }
  const participants = auction.participants || []
  const isNew = participants.indexOf(user.id) === -1
  if (isNew && auction.maxParticipants && participants.length >= Number(auction.maxParticipants)) {
    toast('参与人数已满')
    return
  }
  const drop = randomDrop(auction.minDrop, auction.maxDrop, auction.currentPrice, auction.reservePrice)
  const nextPrice = Math.max(Number(auction.reservePrice || 0), toCents(auction.currentPrice) - toCents(drop)) / 100
  const reachedFloor = nextPrice <= Number(auction.reservePrice || 0)
  const record = {
    id: `rec_${now}`,
    userId: user.id,
    userName: user.name,
    drop,
    priceAfter: reachedFloor ? Number(auction.reservePrice) : nextPrice,
    createdAt: now
  }
  auction.currentPrice = record.priceAfter
  auction.bidCount = Number(auction.bidCount || 0) + 1
  auction.lastBidderId = user.id
  auction.lastBidderName = user.name
  auction.lastBidAt = now
  auction.records = (auction.records || []).concat(record)
  auction.cooldowns = { ...auction.cooldowns, [user.id]: now }
  if (isNew) auction.participants = participants.concat(user.id)
  if (reachedFloor) {
    auction.status = 'floor'
    auction.priorityBuyerId = user.id
    auction.priorityBuyerName = user.name
    auction.priorityExpireAt = now + PRIORITY_WINDOW
  }
  saveState(state)
  pulseAuctionId = auction.id
  setTimeout(() => { pulseAuctionId = ''; render() }, 220)
  toast(`本次降价 ¥${money(drop)}`)
  render()
}

function handleBuy() {
  const now = Date.now()
  const auction = state.auctions.find((item) => item.id === activeAuctionId)
  if (!auction || auction.status === 'sold' || auction.status === 'ended') return
  const user = USER
  if (auction.status === 'floor' && auction.priorityBuyerId && auction.priorityBuyerId !== user.id) {
    toast('优先购买权尚未结束')
    return
  }
  const order = {
    id: `ord_${Date.now()}`,
    auctionId: auction.id,
    title: auction.title,
    image: auction.image,
    buyerId: USER.id,
    buyerName: USER.name,
    price: auction.currentPrice,
    method: auction.status === 'floor' ? '触底优先购买' : '立即拍下',
    status: 'paid',
    createdAt: Date.now()
  }
  state.orders.unshift(order)
  auction.status = 'sold'
  auction.buyerId = USER.id
  auction.buyerName = USER.name
  auction.soldAt = Date.now()
  saveState(state)
  toast(`模拟支付成功，成交价 ¥${money(order.price)}`)
  showView('manage')
}

function renderSeller() {
  const active = state.auctions.filter((item) => item.status === 'active').length
  const floor = state.auctions.filter((item) => item.status === 'floor').length
  const sold = state.auctions.filter((item) => item.status === 'sold').length
  const bidCount = state.auctions.reduce((sum, item) => sum + Number(item.bidCount || 0), 0)
  document.getElementById('sellerStats').innerHTML = [
    ['进行中', active],
    ['触底待成交', floor],
    ['已成交', sold],
    ['累计举牌', bidCount],
    ['成交订单', state.orders.length]
  ].map(([label, value]) => `<div class="stat-card"><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>`).join('')
}

function renderManage() {
  const list = document.getElementById('manageList')
  const orders = document.getElementById('orderList')
  list.innerHTML = state.auctions.map(enriched).map((item) => `
    <div class="manage-card">
      <div class="row">
        <div class="title">${item.title}</div>
        <div class="tag ${tagClass(item.status)}">${item.statusLabel}</div>
      </div>
      <div class="price">¥${item.priceText}</div>
      <div class="manage-row"><span>参与 / 举牌</span><strong>${item.participantCount} 人 / ${item.bidCount} 次</strong></div>
      <div class="manage-row"><span>底价</span><strong>¥${item.reservePriceText}</strong></div>
      <div class="manage-row"><span>最后举牌</span><strong>${item.lastBidderName || '暂无'}</strong></div>
    </div>
  `).join('') || '<div class="empty card">暂无拍卖数据</div>'
  orders.innerHTML = state.orders.map((item) => `
    <div class="order-card row">
      <div>
        <div class="title">${item.title}</div>
        <div class="meta">${item.method} · ${item.buyerName}</div>
      </div>
      <div class="order-price">¥${money(item.price)}</div>
    </div>
  `).join('') || '<div class="empty card">暂无成交订单</div>'
}

document.addEventListener('click', (event) => {
  const viewButton = event.target.closest('[data-view]')
  if (viewButton) {
    showView(viewButton.dataset.view)
    return
  }
  const detailButton = event.target.closest('[data-detail]')
  if (detailButton) {
    activeAuctionId = detailButton.dataset.detail
    showView('detail')
    return
  }
  if (event.target.id === 'bidBtn') handleBid()
  if (event.target.id === 'buyBtn') handleBuy()
})

document.getElementById('resetDataBtn').addEventListener('click', () => {
  state = seedState()
  saveState(state)
  toast('演示数据已重置')
  showView('market')
})

document.getElementById('publishForm').addEventListener('submit', (event) => {
  event.preventDefault()
  const form = new FormData(event.currentTarget)
  const startPrice = Number(form.get('startPrice'))
  const reservePrice = Number(form.get('reservePrice'))
  const minDrop = Number(form.get('minDrop'))
  const maxDrop = Number(form.get('maxDrop'))
  if (startPrice <= reservePrice) {
    toast('起拍价需大于保底价')
    return
  }
  if (minDrop > maxDrop) {
    toast('最小降幅不能大于最大降幅')
    return
  }
  const now = Date.now()
  const auction = {
    id: `auc_${now}`,
    title: String(form.get('title')),
    image: SAMPLE_IMAGE,
    description: String(form.get('description') || '卖家暂未填写详细描述'),
    richContent: String(form.get('richContent') || ''),
    stock: Number(form.get('stock') || 1),
    startPrice,
    reservePrice,
    currentPrice: startPrice,
    minDrop,
    maxDrop,
    cooldownSeconds: Number(form.get('cooldownSeconds') || 10),
    maxParticipants: Number(form.get('maxParticipants') || 0),
    endAt: now + Number(form.get('durationHours') || 4) * 60 * 60 * 1000,
    status: 'active',
    bidCount: 0,
    participants: [],
    lastBidderId: '',
    lastBidderName: '',
    lastBidAt: 0,
    cooldowns: {},
    priorityBuyerId: '',
    priorityBuyerName: '',
    priorityExpireAt: 0,
    records: [],
    createdAt: now
  }
  state.auctions.unshift(auction)
  saveState(state)
  activeAuctionId = auction.id
  event.currentTarget.reset()
  toast('发布成功')
  showView('detail')
})


// 富文本插入图片
document.getElementById('insertImageBtn').addEventListener('click', () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxW = 800
        let w = img.width, h = img.height
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        const dataUri = canvas.toDataURL('image/jpeg', 0.8)
        const imgTag = `<img src="${dataUri}" style="max-width:100%;border-radius:8px;margin:8px 0">`
        const textarea = document.getElementById('richContentInput')
        textarea.value = (textarea.value || '') + '\n' + imgTag
        toast('图片已插入')
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }
  input.click()
})

setInterval(render, 1000)