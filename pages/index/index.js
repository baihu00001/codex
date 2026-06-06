const store = require('../../utils/store')
const auctionUtil = require('../../utils/auction')

Page({
  data: {
    auctions: []
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
      .sort((a, b) => {
        const weight = { active: 1, floor: 2, ended: 3, sold: 4 }
        return (weight[a.status] || 9) - (weight[b.status] || 9)
      })
    this.setData({ auctions })
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
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/publish/publish' })
  }
})
