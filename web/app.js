const STORAGE_KEY = 'reverse_auction_web_state_v2'
const SELLER_KEY = 'reverse_auction_web_seller_v1'
const USER = { id: 'buyer_001', name: '体验买家' }
const PRIORITY_WINDOW = 5 * 60 * 1000
const SAMPLE_IMAGE = '../assets/product-sample.svg'

const DEFAULT_RULES = `<h3>拍卖规则</h3><ol><li>采用动态降价模式，每次举牌系统随机降价一次。</li><li>价格不会跌破保底价，触底后最后举牌者享有优先购买权（5分钟）。</li><li>举牌后有冷却时间，冷却期内不可再次举牌。</li><li>买家可随时以当前价格直接拍下商品。</li><li>拍卖结束后，成交买家请于24小时内联系卖家完成交易。</li><li>卖家保留对拍卖活动的最终解释权。</li></ol>`

function getDefaultProfile() {
  return {
    storeName: '我的小店',
    storeLogo: '',
    contactPerson: '',
    contactPhone: '',
    contactAddress: '',
    wechatQR: '',
    storeDescription: '',
    auctionRules: DEFAULT_RULES
  }
}

function loadProfile() {
  const raw = localStorage.getItem(SELLER_KEY)
  if (!raw) {
    const def = getDefaultProfile()
    localStorage.setItem(SELLER_KEY, JSON.stringify(def))
    return def
  }
  return JSON.parse(raw)
}

function saveProfile(p) {
  localStorage.setItem(SELLER_KEY, JSON.stringify(p))
}

function seedState() {
  const now = Date.now()
  const sampleRichContent = `<div style="margin-bottom:16px"><h3 style="font-size:16px;color:#1a1a2e;margin:0 0 8px">产品亮点</h3><ul style="padding-left:18px;margin:0;color:#4a4a6a;line-height:1.8"><li>精选三大产区咖啡豆，口感层次丰富</li><li>手冲器具套装，新手也能轻松上手</li><li>精美礼盒包装，送礼自用两相宜</li></ul></div><div style="margin-bottom:16px"><h3 style="font-size:16px;color:#1a1a2e;margin:0 0 8px">规格参数</h3><table style="width:100%;border-collapse:collapse;font-size:13px;color:#4a4a6a"><tr><td style="padding:6px 8px;border-bottom:1px solid #eaeaf2;width:40%">净含量</td><td style="padding:6px 8px;border-bottom:1px solid #eaeaf2">500g x 3</td></tr><tr><td style="padding:6px 8px;border-bottom:1px solid #eaeaf2;width:40%">保质期</td><td style="padding:6px 8px;border-bottom:1px solid #eaeaf2">12个月</td></tr><tr><td style="padding:6px 8px;border-bottom:1px solid #eaeaf2;width:40%">储存方式</td><td style="padding:6px 8px;border-bottom:1px solid #eaeaf2">阴凉干燥处</td></tr></table></div><p style="color:#8e8ea0;font-size:12px;margin:0">* 图片仅供参考，以实物为准</p>`
  return {
    auctions: [
      {
        id: 'auc_1001', title: '精品手冲咖啡礼盒', image: SAMPLE_IMAGE,
        description: '含三支不同产区咖啡豆，适合办公室与家庭冲煮。',
        richContent: sampleRichContent,
        stock: 1, startPrice: 299, reservePrice: 188, currentPrice: 259,
        minDrop: 3, maxDrop: 15, cooldownSeconds: 12, maxParticipants: 30,
        endAt: now + 2 * 60 * 60 * 1000, status: 'active', bidCount: 3,
        participants: ['buyer_102', 'buyer_088'],
        lastBidderId: 'buyer_088', lastBidderName: '用户088', lastBidAt: now - 4 * 60 * 1000,
        cooldowns: {}, priorityBuyerId: '', priorityBuyerName: '', priorityExpireAt: 0,
        records: [
          { id: 'rec_1', userId: 'buyer_102', userName: '用户102', drop: 12, priceAfter: 287, createdAt: now - 18 * 60 * 1000 },
          { id: 'rec_2', userId: 'buyer_088', userName: '用户088', drop: 13, priceAfter: 274, createdAt: now - 9 * 60 * 1000 },
          { id: 'rec_3', userId: 'buyer_088', userName: '用户088', drop: 15, priceAfter: 259, createdAt: now - 4 * 60 * 1000 }
        ],
        createdAt: now - 30 * 60 * 1000
      },
      {
        id: 'auc_1002', title: '桌面无线充电台灯', image: SAMPLE_IMAGE,
        description: '三档色温，带手机无线充电区域，适合书桌与床头。',
        richContent: '',
        stock: 2, startPrice: 199, reservePrice: 129, currentPrice: 199,
        minDrop: 2, maxDrop: 8, cooldownSeconds: 8, maxParticipants: 20,
        endAt: now + 5 * 60 * 60 * 1000, status: 'active', bidCount: 0,
        participants: [], lastBidderId: '', lastBidderName: '', lastBidAt: 0,
        cooldowns: {}, priorityBuyerId: '', priorityBuyerName: '', priorityExpireAt: 0,
        records: [], createdAt: now - 10 * 60 * 1000
      }
    ],
    orders: []
  }
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) { const s = seedState(); saveState(s); return s }
  return JSON.parse(raw)
}
function saveState(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) }

let state = loadState()
let profile = loadProfile()
let activeAuctionId = ''
let pulseAuctionId = ''

function money(v) { return Number(v || 0).toFixed(2) }
function toCents(v) { return Math.round(Number(v || 0) * 100) }
function fromCents(v) { return Math.round(v) / 100 }

function randomDrop(minD, maxD, cur, reserve) {
  const min = Math.max(1, toCents(minD)), max = Math.max(min, toCents(maxD))
  const usable = Math.max(0, toCents(cur) - toCents(reserve))
  if (usable <= 0) return 0
  return fromCents(Math.floor(Math.random() * (Math.min(max, usable) - min + 1)) + min)
}

function countdownText(targetAt) {
  const diff = Math.max(0, Number(targetAt || 0) - Date.now())
  const ts = Math.floor(diff / 1000)
  const h = Math.floor(ts / 3600), m = Math.floor((ts % 3600) / 60), s = ts % 60
  if (h > 0) return h + '时' + m + '分'
  if (m > 0) return m + '分' + s + '秒'
  return s + '秒'
}

function statusText(s) {
  return { active: '进行中', floor: '触底待成交', sold: '已成交', ended: '已结束' }[s] || '未知'
}

function tagClass(s) {
  if (s === 'sold') return 'green'; if (s === 'ended') return 'gray'; return ''
}

function enriched(a) {
  return {
    ...a,
    statusLabel: statusText(a.status),
    priceText: money(a.currentPrice),
    startPriceText: money(a.startPrice),
    reservePriceText: money(a.reservePrice),
    participantCount: (a.participants || []).length,
    countdown: a.status === 'floor' ? countdownText(a.priorityExpireAt) : countdownText(a.endAt)
  }
}

function normalizeState() {
  let changed = false; const now = Date.now()
  state.auctions.forEach((a) => {
    if (a.status === 'active' && Number(a.endAt) <= now) { a.status = 'ended'; changed = true }
    if (a.status === 'floor' && Number(a.priorityExpireAt || 0) <= now) {
      a.priorityBuyerId = ''; a.priorityBuyerName = ''; changed = true
    }
  })
  if (changed) saveState(state)
}

function showView(id) {
  document.querySelectorAll('.view').forEach((el) => el.classList.remove('active'))
  const target = document.getElementById(id)
  if (target) target.classList.add('active')
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === id)
  })
  render()
}

function toast(msg, dur) {
  dur = dur || 2200
  const el = document.getElementById('toast')
  el.textContent = msg; el.classList.add('show')
  clearTimeout(el._timer)
  el._timer = setTimeout(() => el.classList.remove('show'), dur)
}

function imageToBase64(file, callback) {
  const reader = new FileReader()
  reader.onload = (ev) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxW = 600; let w = img.width, h = img.height
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      callback(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.src = ev.target.result
  }
  reader.readAsDataURL(file)
}

/* ---- Render ---- */

function render() {
  normalizeState()
  renderMarket()
  renderSeller()
  if (document.getElementById('detail').classList.contains('active')) renderDetail()
  if (document.getElementById('manage').classList.contains('active')) renderManage()
  if (document.getElementById('manage-detail').classList.contains('active')) renderManageDetail()
}

function renderMarket() {
  const list = document.getElementById('auctionList')
  const storeName = profile.storeName || ''
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
        ${storeName ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line);color:var(--muted);font-size:12px">${storeName}</div>` : ''}
      </div>
    </div>
  `).join('') || '<div class="empty card">暂无拍卖数据</div>'
}

function renderDetail() {
  const auction = state.auctions.find((a) => a.id === activeAuctionId)
  if (!auction) { document.getElementById('detailPanel').innerHTML = '<div class="empty card">拍卖不存在</div>'; return }
  const item = enriched(auction); const now = Date.now()
  const cooldownLeft = Math.max(0, Math.ceil(((Number(item.cooldowns[USER.id] || 0) + Number(item.cooldownSeconds || 10) * 1000) - now) / 1000))
  const bidDisabled = item.status !== 'active' || cooldownLeft > 0
  const hasPriority = item.status === 'floor' && item.priorityBuyerId && item.priorityBuyerId !== USER.id
  const buyDisabled = item.status === 'sold' || item.status === 'ended' || hasPriority
  const pulse = pulseAuctionId === item.id ? 'pulse' : ''
  const records = (item.records || []).slice().reverse()
  const bidText = item.status === 'floor' ? '已触底' : item.status === 'sold' ? '已成交' : item.status === 'ended' ? '已结束' : cooldownLeft > 0 ? cooldownLeft + '秒后可举牌' : '举牌降价'
  const buyText = buyDisabled && item.status === 'floor' && !hasPriority ? '优先购买中' : '立即拍下'

  const rich = item.richContent ? `<div class="card panel"><h2>商品详情</h2><div class="rich-content">${item.richContent}</div></div>` : ''
  const rules = profile.auctionRules ? `<div class="card panel"><h2>拍卖规则</h2><div class="rich-content">${profile.auctionRules}</div></div>` : ''
  const sellerInfo = profile.storeName ? `
    <div class="card panel">
      <h2>卖家信息</h2>
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
        ${profile.storeLogo ? `<img src="${profile.storeLogo}" style="width:56px;height:56px;border-radius:10px;border:1px solid var(--line);object-fit:cover">` : `<div style="width:56px;height:56px;border-radius:10px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;font-size:22px;font-weight:800">店</div>`}
        <strong style="font-size:16px">${profile.storeName}</strong>
      </div>
      ${profile.storeDescription ? `<p style="margin-bottom:12px">${profile.storeDescription}</p>` : ''}
      ${(profile.contactPerson || profile.contactPhone || profile.contactAddress) ? `<div style="padding-top:4px">
        ${profile.contactPerson ? `<div style="display:flex;gap:12px;padding:8px 0"><span style="color:var(--muted)">联系人</span><span>${profile.contactPerson}</span></div>` : ''}
        ${profile.contactPhone ? `<div style="display:flex;gap:12px;padding:8px 0"><span style="color:var(--muted)">电话</span><span style="color:var(--accent);font-weight:700">${profile.contactPhone}</span></div>` : ''}
        ${profile.contactAddress ? `<div style="display:flex;gap:12px;padding:8px 0"><span style="color:var(--muted)">地址</span><span>${profile.contactAddress}</span></div>` : ''}
      </div>` : ''}
      ${profile.wechatQR ? `<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line);display:flex;align-items:center;gap:14px;cursor:pointer" onclick="previewImage('${profile.wechatQR}')"><img src="${profile.wechatQR}" style="width:80px;height:80px;border-radius:6px;border:1px solid var(--line);object-fit:contain"><span style="color:var(--accent);font-size:13px">点击查看微信二维码</span></div>` : ''}
    </div>
  ` : ''

  document.getElementById('detailPanel').innerHTML = `
    <img class="detail-cover" src="${item.image}" alt="${item.title}">
    <div class="card panel">
      <div class="row"><h1 style="flex:1;min-width:0;margin:0">${item.title}</h1><div class="tag ${tagClass(item.status)}">${item.statusLabel}</div></div>
      <p style="margin-top:10px">${item.description}</p>
      <div class="price-panel ${pulse}"><div class="stat-label" style="color:#9a3412">当前成交价</div><div class="price">¥${item.priceText}</div><div style="color:#9a3412;font-size:13px;margin-top:6px">起拍 ¥${item.startPriceText} · 保底 ¥${item.reservePriceText}</div></div>
      <div class="stats-grid" style="margin-top:16px">
        <div class="stat-card"><div class="stat-value">${item.participantCount}</div><div class="stat-label">参与人数</div></div>
        <div class="stat-card"><div class="stat-value">${item.bidCount}</div><div class="stat-label">举牌次数</div></div>
        <div class="stat-card"><div class="stat-value">${item.countdown}</div><div class="stat-label">${item.status === 'floor' ? '优先剩余' : '剩余时间'}</div></div>
      </div>
    </div>
    ${item.status === 'floor' && hasPriority ? `<div class="notice panel">已触及保底价，${item.priorityBuyerName} 拥有优先购买权。</div>` : ''}
    <div class="action-row"><button class="primary-button" id="bidBtn" ${bidDisabled ? 'disabled' : ''}>${bidText}</button><button class="danger-button" id="buyBtn" ${buyDisabled ? 'disabled' : ''}>${buyText}</button></div>
    ${rich}
    <div class="card panel"><h2>拍卖参数</h2>
      <div class="info-row"><span>随机降幅</span><span>¥${item.minDrop} - ¥${item.maxDrop}</span></div>
      <div class="info-row"><span>举牌冷却</span><span>${item.cooldownSeconds} 秒</span></div>
      <div class="info-row"><span>库存</span><span>${item.stock} 件</span></div>
      <div class="info-row"><span>人数上限</span><span>${item.maxParticipants || '不限'}</span></div>
    </div>
    ${rules}
    ${sellerInfo}
    <div class="card panel"><h2>举牌记录</h2>
      ${records.length === 0 ? '<div class="empty">暂无举牌</div>' : records.map((r) => `<div class="record-row"><div><div style="font-weight:700;color:var(--ink)">${r.userName}</div><div style="font-size:12px;color:var(--muted)">${new Date(r.createdAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</div></div><div class="record-price">-¥${money(r.drop)} → ¥${money(r.priceAfter)}</div></div>`).join('')}
    </div>
  `
}

function renderManage() {
  const list = document.getElementById('manageList')
  list.innerHTML = state.auctions.map(enriched).map((item) => `
    <div class="manage-card" data-manage="${item.id}" style="cursor:pointer">
      <div class="row"><div class="title">${item.title}</div><div class="tag ${tagClass(item.status)}">${item.statusLabel}</div></div>
      <div class="price">¥${item.priceText}</div>
      <div class="manage-row"><span>参与 / 举牌</span><strong>${item.participantCount} 人 / ${item.bidCount} 次</strong></div>
      <div class="manage-row"><span>底价</span><strong>¥${item.reservePriceText}</strong></div>
      <div class="manage-row"><span>最后举牌</span><strong>${item.lastBidderName || '暂无'}</strong></div>
    </div>
  `).join('') || '<div class="empty card">暂无拍卖数据</div>'

  const orders = document.getElementById('orderList')
  orders.innerHTML = state.orders.map((item) => `
    <div class="order-card row">
      <div><div class="title">${item.title}</div><div class="meta">${item.method} · ${item.buyerName}</div></div>
      <div class="order-price">¥${money(item.price)}</div>
    </div>
  `).join('') || '<div class="empty card">暂无成交订单</div>'
}

function renderManageDetail() {
  const auction = state.auctions.find((a) => a.id === activeAuctionId)
  if (!auction) return
  const item = enriched(auction)
  const bidCounts = {}; (item.records || []).forEach((r) => { bidCounts[r.userId] = (bidCounts[r.userId] || 0) + 1 })
  const participants = (item.participants || []).map((uid) => {
    const rec = (item.records || []).find((r) => r.userId === uid)
    return { userId: uid, userName: rec ? rec.userName : uid, bidCount: bidCounts[uid] || 0 }
  })
  const records = (item.records || []).slice().reverse()
  const soldTime = auction.soldAt ? new Date(auction.soldAt).toLocaleString('zh-CN') : ''

  document.getElementById('manageDetailPanel').innerHTML = `
    <div class="card panel">
      <div class="row"><h1 style="flex:1;min-width:0;margin:0">${item.title}</h1><div class="tag ${tagClass(item.status)}">${item.statusLabel}</div></div>
      <div class="price" style="margin-top:14px">¥${item.priceText}</div>
      <div style="color:var(--muted);font-size:13px;margin-top:6px">起拍 ¥${item.startPriceText} · 保底 ¥${item.reservePriceText}</div>
    </div>
    <div class="card panel">
      <h2>数据概览</h2>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value">${item.participantCount}</div><div class="stat-label">参与人数</div></div>
        <div class="stat-card"><div class="stat-value">${item.bidCount}</div><div class="stat-label">举牌次数</div></div>
        <div class="stat-card"><div class="stat-value">${item.countdown}</div><div class="stat-label">${item.status === 'floor' ? '优先剩余' : item.status === 'active' ? '剩余时间' : '已结束'}</div></div>
      </div>
    </div>
    ${participants.length ? `<div class="card panel"><h2>参与者 (${participants.length}人)</h2>${participants.map((p) => `<div class="info-row"><span>${p.userName}</span><strong style="color:var(--accent)">举牌 ${p.bidCount} 次</strong></div>`).join('')}</div>` : ''}
    <div class="card panel"><h2>举牌记录</h2>${records.length === 0 ? '<div class="empty">暂无举牌</div>' : records.map((r) => `<div class="record-row"><div><div style="font-weight:700;color:var(--ink)">${r.userName}</div><div style="font-size:12px;color:var(--muted)">${new Date(r.createdAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</div></div><div class="record-price">-¥${money(r.drop)} → ¥${money(r.priceAfter)}</div></div>`).join('')}</div>
    ${item.status === 'sold' ? `<div class="card panel"><h2>成交信息</h2><div class="info-row"><span>买家</span><strong>${auction.buyerName}</strong></div><div class="info-row"><span>成交价</span><strong style="color:var(--accent)">¥${item.priceText}</strong></div><div class="info-row"><span>成交时间</span><strong>${soldTime}</strong></div></div>` : ''}
    <div class="action-row">
      ${item.status === 'active' ? '<button class="danger-button" id="endAuctionBtn">结束拍卖</button>' : ''}
      <button class="ghost-button" data-view="manage">返回管理列表</button>
    </div>
  `
}

/* ---- Seller Profile ---- */

function renderSellerProfile() {
  const form = document.getElementById('sellerProfileForm')
  form.querySelector('[name="storeName"]').value = profile.storeName || ''
  form.querySelector('[name="contactPerson"]').value = profile.contactPerson || ''
  form.querySelector('[name="contactPhone"]').value = profile.contactPhone || ''
  form.querySelector('[name="contactAddress"]').value = profile.contactAddress || ''
  form.querySelector('[name="storeDescription"]').value = profile.storeDescription || ''
  form.querySelector('[name="auctionRules"]').value = profile.auctionRules || ''
  const logoPreview = document.getElementById('profileLogoPreview')
  const qrPreview = document.getElementById('profileQRPreview')
  if (profile.storeLogo) { logoPreview.innerHTML = `<img src="${profile.storeLogo}" style="width:100%;height:100%;object-fit:cover;border-radius:10px">` }
  else { logoPreview.innerHTML = '<span style="color:var(--muted);font-size:13px">点击选择Logo</span>' }
  if (profile.wechatQR) { qrPreview.innerHTML = `<img src="${profile.wechatQR}" style="width:100%;height:100%;object-fit:contain">` }
  else { qrPreview.innerHTML = '<span style="color:var(--muted);font-size:14px">点击上传微信二维码</span>' }
}

/* ---- Handlers ---- */

function handleBid() {
  const now = Date.now()
  const auction = state.auctions.find((a) => a.id === activeAuctionId)
  if (!auction || auction.status !== 'active') return
  const cooldownLeft = Math.max(0, Math.ceil(((Number(auction.cooldowns[USER.id] || 0) + Number(auction.cooldownSeconds || 10) * 1000) - now) / 1000))
  if (cooldownLeft > 0) { toast('请等待 ' + cooldownLeft + ' 秒'); return }
  const participants = auction.participants || []
  const isNew = participants.indexOf(USER.id) === -1
  if (isNew && auction.maxParticipants && participants.length >= Number(auction.maxParticipants)) { toast('参与人数已满'); return }
  const drop = randomDrop(auction.minDrop, auction.maxDrop, auction.currentPrice, auction.reservePrice)
  const nextPrice = Math.max(Number(auction.reservePrice || 0), toCents(auction.currentPrice) - toCents(drop)) / 100
  const reachedFloor = nextPrice <= Number(auction.reservePrice || 0)
  const record = { id: 'rec_' + now, userId: USER.id, userName: USER.name, drop, priceAfter: reachedFloor ? Number(auction.reservePrice) : nextPrice, createdAt: now }
  auction.currentPrice = record.priceAfter; auction.bidCount = Number(auction.bidCount || 0) + 1
  auction.lastBidderId = USER.id; auction.lastBidderName = USER.name; auction.lastBidAt = now
  auction.records = (auction.records || []).concat(record)
  auction.cooldowns = { ...auction.cooldowns, [USER.id]: now }
  if (isNew) auction.participants = participants.concat(USER.id)
  if (reachedFloor) { auction.status = 'floor'; auction.priorityBuyerId = USER.id; auction.priorityBuyerName = USER.name; auction.priorityExpireAt = now + PRIORITY_WINDOW }
  saveState(state); pulseAuctionId = auction.id
  setTimeout(() => { pulseAuctionId = ''; render() }, 220)
  toast('本次降价 ¥' + money(drop)); render()
}

function handleBuy() {
  const auction = state.auctions.find((a) => a.id === activeAuctionId)
  if (!auction || auction.status === 'sold' || auction.status === 'ended') return
  if (auction.status === 'floor' && auction.priorityBuyerId && auction.priorityBuyerId !== USER.id) { toast('优先购买权尚未结束'); return }
  const order = { id: 'ord_' + Date.now(), auctionId: auction.id, title: auction.title, image: auction.image, buyerId: USER.id, buyerName: USER.name, price: auction.currentPrice, method: auction.status === 'floor' ? '触底优先购买' : '立即拍下', status: 'paid', createdAt: Date.now() }
  state.orders.unshift(order); auction.status = 'sold'; auction.buyerId = USER.id; auction.buyerName = USER.name; auction.soldAt = Date.now()
  saveState(state); toast('模拟支付成功，成交价 ¥' + money(order.price)); showView('manage')
}

function handleEndAuction() {
  if (!confirm('确定要提前结束这场拍卖吗？')) return
  const auction = state.auctions.find((a) => a.id === activeAuctionId)
  if (auction) { auction.status = 'ended'; saveState(state); toast('拍卖已结束'); render() }
}

window.previewImage = function(url) {
  const win = window.open('', '_blank')
  if (win) { win.document.write('<img src="' + url + '" style="max-width:100%">') }
}

/* ---- Events ---- */

document.addEventListener('click', (event) => {
  const viewBtn = event.target.closest('[data-view]')
  if (viewBtn) { showView(viewBtn.dataset.view); return }
  const detailBtn = event.target.closest('[data-detail]')
  if (detailBtn) { activeAuctionId = detailBtn.dataset.detail; showView('detail'); return }
  const manageBtn = event.target.closest('[data-manage]')
  if (manageBtn) { activeAuctionId = manageBtn.dataset.manage; showView('manage-detail'); return }
  if (event.target.id === 'bidBtn') handleBid()
  if (event.target.id === 'buyBtn') handleBuy()
  if (event.target.id === 'endAuctionBtn') handleEndAuction()
})

document.getElementById('resetDataBtn').addEventListener('click', () => {
  state = seedState(); saveState(state); toast('演示数据已重置'); showView('market')
})

document.getElementById('publishForm').addEventListener('submit', (event) => {
  event.preventDefault(); const form = new FormData(event.currentTarget)
  const startPrice = Number(form.get('startPrice')), reservePrice = Number(form.get('reservePrice'))
  const minDrop = Number(form.get('minDrop')), maxDrop = Number(form.get('maxDrop'))
  if (startPrice <= reservePrice) { toast('起拍价需大于保底价'); return }
  if (minDrop > maxDrop) { toast('最小降幅不能大于最大降幅'); return }
  const now = Date.now()
  const auction = {
    id: 'auc_' + now, title: String(form.get('title')), image: SAMPLE_IMAGE,
    description: String(form.get('description') || '卖家暂未填写详细描述'),
    richContent: String(form.get('richContent') || ''),
    stock: Number(form.get('stock') || 1), startPrice, reservePrice, currentPrice: startPrice,
    minDrop, maxDrop, cooldownSeconds: Number(form.get('cooldownSeconds') || 10),
    maxParticipants: Number(form.get('maxParticipants') || 0),
    endAt: now + Number(form.get('durationHours') || 4) * 60 * 60 * 1000,
    status: 'active', bidCount: 0, participants: [], lastBidderId: '', lastBidderName: '', lastBidAt: 0,
    cooldowns: {}, priorityBuyerId: '', priorityBuyerName: '', priorityExpireAt: 0, records: [], createdAt: now
  }
  state.auctions.unshift(auction); saveState(state); activeAuctionId = auction.id
  event.currentTarget.reset(); toast('发布成功'); showView('detail')
})

document.getElementById('sellerProfileForm').addEventListener('submit', (event) => {
  event.preventDefault(); const form = new FormData(event.currentTarget)
  profile.storeName = String(form.get('storeName') || '我的小店')
  profile.contactPerson = String(form.get('contactPerson') || '')
  profile.contactPhone = String(form.get('contactPhone') || '')
  profile.contactAddress = String(form.get('contactAddress') || '')
  profile.storeDescription = String(form.get('storeDescription') || '')
  profile.auctionRules = String(form.get('auctionRules') || DEFAULT_RULES)
  saveProfile(profile); toast('店铺信息已保存')
})

document.getElementById('profileLogoBtn').addEventListener('click', () => {
  const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files[0]; if (!file) return
    imageToBase64(file, (dataUri) => {
      profile.storeLogo = dataUri; saveProfile(profile)
      document.getElementById('profileLogoPreview').innerHTML = `<img src="${dataUri}" style="width:100%;height:100%;object-fit:cover;border-radius:10px">`
    })
  }
  input.click()
})

document.getElementById('profileQRBtn').addEventListener('click', () => {
  const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files[0]; if (!file) return
    imageToBase64(file, (dataUri) => {
      profile.wechatQR = dataUri; saveProfile(profile)
      document.getElementById('profileQRPreview').innerHTML = `<img src="${dataUri}" style="width:100%;height:100%;object-fit:contain">`
    })
  }
  input.click()
})

/* ---- Rich text image insert ---- */

document.getElementById('insertImageBtn').addEventListener('click', () => {
  const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files[0]; if (!file) return
    imageToBase64(file, (dataUri) => {
      const imgTag = `<img src="${dataUri}" style="max-width:100%;border-radius:8px;margin:8px 0">`
      const textarea = document.getElementById('richContentInput')
      textarea.value = (textarea.value || '') + '\n' + imgTag; toast('图片已插入')
    })
  }
  input.click()
})

function renderSeller() {
  const active = state.auctions.filter((a) => a.status === 'active').length
  const floor = state.auctions.filter((a) => a.status === 'floor').length
  const sold = state.auctions.filter((a) => a.status === 'sold').length
  const bidCount = state.auctions.reduce((sum, a) => sum + Number(a.bidCount || 0), 0)
  document.getElementById('sellerStats').innerHTML = [
    ['进行中', active], ['触底待成交', floor], ['已成交', sold], ['累计举牌', bidCount], ['成交订单', state.orders.length]
  ].map(([l, v]) => `<div class="stat-card"><div class="stat-value">${v}</div><div class="stat-label">${l}</div></div>`).join('')
}

setInterval(render, 1000)
render()