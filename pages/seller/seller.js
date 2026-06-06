const store = require('../../utils/store')

Page({
  data: {
    stats: {
      active: 0,
      floor: 0,
      sold: 0,
      bidCount: 0,
      orderCount: 0
    }
  },

  onShow() {
    const auctions = store.getAuctions()
    const orders = store.getOrders()
    this.setData({
      stats: {
        active: auctions.filter((item) => item.status === 'active').length,
        floor: auctions.filter((item) => item.status === 'floor').length,
        sold: auctions.filter((item) => item.status === 'sold').length,
        bidCount: auctions.reduce((sum, item) => sum + Number(item.bidCount || 0), 0),
        orderCount: orders.length
      }
    })
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/publish/publish' })
  },

  goManage() {
    wx.navigateTo({ url: '/pages/manage/manage' })
  },

  goProfile() {
    wx.navigateTo({ url: '/pages/seller-profile/seller-profile' })
  }
})