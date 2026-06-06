const mock = require('../data/mock')

const AUCTIONS_KEY = 'reverse_auction_auctions'
const ORDERS_KEY = 'reverse_auction_orders'

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

module.exports = {
  createAuction,
  createOrder,
  ensureSeedData,
  getAuction,
  getAuctions,
  getOrder,
  getOrders,
  saveAuction
}
