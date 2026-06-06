const mock = require('../data/mock')

const AUCTIONS_KEY = 'reverse_auction_auctions'
const ORDERS_KEY = 'reverse_auction_orders'
const SELLER_KEY = 'reverse_auction_seller_profile'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function ensureSeedData() {
  const existing = wx.getStorageSync(AUCTIONS_KEY)
  if (!existing || !existing.length) {
    wx.setStorageSync(AUCTIONS_KEY, clone(mock.auctions))
    wx.setStorageSync(ORDERS_KEY, clone(mock.orders))
  }
}

/* ---- 拍卖 ---- */

function getAuctions() {
  ensureSeedData()
  return wx.getStorageSync(AUCTIONS_KEY) || []
}

function saveAuctions(auctions) {
  wx.setStorageSync(AUCTIONS_KEY, auctions)
}

function getAuction(id) {
  return getAuctions().find((item) => item.id === id)
}

function saveAuction(auction) {
  const auctions = getAuctions()
  const index = auctions.findIndex((item) => item.id === auction.id)
  if (index >= 0) {
    auctions[index] = auction
  } else {
    auctions.unshift(auction)
  }
  saveAuctions(auctions)
  return auction
}

function createAuction(payload) {
  const now = Date.now()
  const auction = Object.assign({
    id: `auc_${now}`,
    image: '/assets/product-sample.svg',
    currentPrice: Number(payload.startPrice),
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
  }, payload)
  auction.currentPrice = Number(auction.startPrice)
  return saveAuction(auction)
}

/* ---- 订单 ---- */

function getOrders() {
  ensureSeedData()
  return wx.getStorageSync(ORDERS_KEY) || []
}

function saveOrders(orders) {
  wx.setStorageSync(ORDERS_KEY, orders)
}

function createOrder(payload) {
  const order = Object.assign({
    id: `ord_${Date.now()}`,
    createdAt: Date.now(),
    paidAt: Date.now(),
    status: 'paid'
  }, payload)
  const orders = getOrders()
  orders.unshift(order)
  saveOrders(orders)
  return order
}

function getOrder(id) {
  return getOrders().find((item) => item.id === id)
}

/* ---- 卖家信息 ---- */

const DEFAULT_RULES = `<h3>拍卖规则</h3>
<ol>
  <li>采用动态降价模式，每次举牌系统随机降价一次。</li>
  <li>价格不会跌破保底价，触底后最后举牌者享有优先购买权（5分钟）。</li>
  <li>举牌后有冷却时间，冷却期内不可再次举牌。</li>
  <li>买家可随时以当前价格直接拍下商品。</li>
  <li>拍卖结束后，成交买家请于24小时内联系卖家完成交易。</li>
  <li>卖家保留对拍卖活动的最终解释权。</li>
</ol>`

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

function getSellerProfile() {
  const raw = wx.getStorageSync(SELLER_KEY)
  if (!raw) {
    const def = getDefaultProfile()
    wx.setStorageSync(SELLER_KEY, def)
    return def
  }
  return raw
}

function saveSellerProfile(profile) {
  wx.setStorageSync(SELLER_KEY, profile)
  return profile
}

module.exports = {
  createAuction,
  createOrder,
  ensureSeedData,
  getAuction,
  getAuctions,
  getDefaultProfile,
  getOrder,
  getOrders,
  getSellerProfile,
  saveAuction,
  saveSellerProfile
}