const store = require('../../utils/store')
const auctionUtil = require('../../utils/auction')

Page({
  data: {
    id: '',
    auction: null,
    records: [],
    participants: [],
    sellerProfile: {},
    soldTimeText: ''
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
    if (!raw) return

    const now = Date.now()
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
    if (changed) store.saveAuction(auction)

    const enriched = auctionUtil.enrichAuction(auction, now)

    // 参与者统计
    const bidCounts = {}
    ;(enriched.records || []).forEach((r) => {
      bidCounts[r.userId] = (bidCounts[r.userId] || 0) + 1
    })
    const participants = (enriched.participants || []).map((uid) => {
      const rec = (enriched.records || []).find((r) => r.userId === uid)
      return {
        userId: uid,
        userName: rec ? rec.userName : uid,
        bidCount: bidCounts[uid] || 0
      }
    })

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
      participants,
      sellerProfile: store.getSellerProfile(),
      soldTimeText: auction.soldAt ? this.formatFull(auction.soldAt) : ''
    })
  },

  startTimer() {
    this.stopTimer()
    this.timer = setInterval(() => this.load(), 1000)
  },

  stopTimer() {
    if (this.timer) { clearInterval(this.timer); this.timer = null }
  },

  endAuction() {
    wx.showModal({
      title: '确认结束',
      content: '确定要提前结束这场拍卖吗？结束后买家将无法继续举牌。',
      success: (res) => {
        if (res.confirm) {
          const auction = store.getAuction(this.data.id)
          if (auction) {
            auction.status = 'ended'
            store.saveAuction(auction)
            wx.showToast({ title: '已结束', icon: 'success' })
            this.load()
          }
        }
      }
    })
  },

  goBack() {
    wx.navigateBack()
  },

  formatTime(timestamp) {
    const date = new Date(timestamp)
    const h = `${date.getHours()}`.padStart(2, '0')
    const m = `${date.getMinutes()}`.padStart(2, '0')
    return `${h}:${m}`
  },

  formatFull(timestamp) {
    const d = new Date(timestamp)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }
})