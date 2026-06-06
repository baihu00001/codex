const store = require('../../utils/store')
const auctionUtil = require('../../utils/auction')

Page({
  data: {
    order: null
  },

  onLoad(options) {
    const order = store.getOrder(options.id)
    if (!order) {
      wx.showToast({ title: '订单不存在', icon: 'none' })
      return
    }
    this.setData({
      order: Object.assign({}, order, {
        priceText: auctionUtil.money(order.price)
      })
    })
  },

  backHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
