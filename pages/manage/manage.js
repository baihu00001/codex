const store = require('../../utils/store')
const auctionUtil = require('../../utils/auction')

Page({
  data: {
    auctions: [],
    orders: []
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
    const now = Date.now()
    const auctions = store.getAuctions()
      .map((item) => auctionUtil.enrichAuction(item, now))
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    const orders = store.getOrders().map((item) => Object.assign({}, item, {
      priceText: auctionUtil.money(item.price)
    }))
    this.setData({ auctions, orders })
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

  goDetail(event) {
    const { id } = event.currentTarget.dataset
    wx.navigateTo({ url: `/pages/manage-detail/manage-detail?id=${id}` })
  }
})