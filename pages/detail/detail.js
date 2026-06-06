const store = require('../../utils/store')
const auctionUtil = require('../../utils/auction')

const PRIORITY_WINDOW = 5 * 60 * 1000

Page({
  data: {
    id: '',
    auction: null,
    records: [],
    bidButtonText: '举牌降价',
    buyButtonText: '立即拍下',
    bidDisabled: false,
    buyDisabled: false,
    pricePulse: false
  },

  onLoad(options) {
    this.setData({ id: options.id })
  },

  onShow() {
    this.load()
    this.startTimer()
  },

  onHide() {
    this.stopTimer()
  },

  onUnload() {
    this.stopTimer()
  },

  load() {
    const raw = store.getAuction(this.data.id)
    if (!raw) {
      wx.showToast({ title: '拍卖不存在', icon: 'none' })
      return
    }

    const now = Date.now()
    const app = getApp()
    const user = app.globalData.currentUser
    let changed = false
    const auction = Object.assign({}, raw)

    if (auction.status === 'active' && Number(auction.endAt) <= now) {
      auction.status = 'ended'
      changed = true
    }

    if (auction.status === 'floor' && Number(auction.priorityExpireAt || 0) <= now) {
      auction.priorityBuyerId = ''
      auction.priorityBuyerName = ''
      changed = true
    }

    if (changed) {
      store.saveAuction(auction)
    }

    const enriched = auctionUtil.enrichAuction(auction, now)
    const cooldownLeft = auctionUtil.cooldownLeft(auction, user.id, now)
    const bidDisabled = enriched.status !== 'active' || cooldownLeft > 0
    const buyDisabled = enriched.status === 'sold'
      || enriched.status === 'ended'
      || auctionUtil.hasPriorityLock(enriched, user.id, now)

    const records = (enriched.records || []).slice().reverse().map((record) => ({
      id: record.id,
      userName: record.userName,
      dropText: auctionUtil.money(record.drop),
      priceText: auctionUtil.money(record.priceAfter),
      timeText: this.formatTime(record.createdAt)
    }))

    this.setData({
      auction: enriched,
      records,
      bidDisabled,
      buyDisabled,
      bidButtonText: this.getBidText(enriched, cooldownLeft),
      buyButtonText: buyDisabled && enriched.status === 'floor' ? '优先购买中' : '立即拍下'
    })
  },

  startTimer() {
    this.stopTimer()
    this.timer = setInterval(() => this.load(), 1000)
  },

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },

  getBidText(auction, cooldownLeft) {
    if (auction.status === 'floor') return '已触底'
    if (auction.status === 'sold') return '已成交'
    if (auction.status === 'ended') return '已结束'
    if (cooldownLeft > 0) return `${cooldownLeft}秒后可举牌`
    return '举牌降价'
  },

  handleBid() {
    const now = Date.now()
    const app = getApp()
    const user = app.globalData.currentUser
    const auction = store.getAuction(this.data.id)

    if (!auction || auction.status !== 'active') return

    const cooldownLeft = auctionUtil.cooldownLeft(auction, user.id, now)
    if (cooldownLeft > 0) {
      wx.showToast({ title: `请等待 ${cooldownLeft} 秒`, icon: 'none' })
      return
    }

    const participants = auction.participants || []
    const isNewParticipant = participants.indexOf(user.id) === -1
    if (isNewParticipant
      && auction.maxParticipants
      && participants.length >= Number(auction.maxParticipants)) {
      wx.showToast({ title: '参与人数已满', icon: 'none' })
      return
    }

    const result = auctionUtil.applyDrop(auction)
    const record = {
      id: `rec_${now}`,
      userId: user.id,
      userName: user.name,
      drop: result.drop,
      priceAfter: result.nextPrice,
      createdAt: now
    }

    auction.currentPrice = result.nextPrice
    auction.bidCount = Number(auction.bidCount || 0) + 1
    auction.lastBidderId = user.id
    auction.lastBidderName = user.name
    auction.lastBidAt = now
    auction.records = (auction.records || []).concat(record)
    auction.cooldowns = Object.assign({}, auction.cooldowns, { [user.id]: now })
    if (isNewParticipant) {
      auction.participants = participants.concat(user.id)
    }
    if (result.reachedFloor) {
      auction.status = 'floor'
      auction.priorityBuyerId = user.id
      auction.priorityBuyerName = user.name
      auction.priorityExpireAt = now + PRIORITY_WINDOW
    }

    store.saveAuction(auction)
    wx.showToast({ title: `本次降价 ¥${auctionUtil.money(result.drop)}`, icon: 'none' })
    this.flashPrice()
    this.load()
  },

  handleBuy() {
    const now = Date.now()
    const app = getApp()
    const user = app.globalData.currentUser
    const auction = store.getAuction(this.data.id)

    if (!auction || auction.status === 'sold' || auction.status === 'ended') return
    if (auctionUtil.hasPriorityLock(auction, user.id, now)) {
      wx.showToast({ title: '优先购买权尚未结束', icon: 'none' })
      return
    }

    const order = store.createOrder({
      auctionId: auction.id,
      title: auction.title,
      image: auction.image,
      buyerId: user.id,
      buyerName: user.name,
      price: auction.currentPrice,
      method: auction.status === 'floor' ? '触底优先购买' : '立即拍下'
    })

    auction.status = 'sold'
    auction.buyerId = user.id
    auction.buyerName = user.name
    auction.soldAt = now
    store.saveAuction(auction)

    wx.navigateTo({ url: `/pages/order/order?id=${order.id}` })
  },

  flashPrice() {
    this.setData({ pricePulse: true })
    setTimeout(() => this.setData({ pricePulse: false }), 220)
  },

  formatTime(timestamp) {
    const date = new Date(timestamp)
    const h = `${date.getHours()}`.padStart(2, '0')
    const m = `${date.getMinutes()}`.padStart(2, '0')
    return `${h}:${m}`
  }
})
