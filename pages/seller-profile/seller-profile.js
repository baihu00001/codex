const store = require('../../utils/store')
const auctionUtil = require('../../utils/auction')

Page({
  data: {
    profile: {},
    rulesSegments: []
  },

  onShow() {
    var p = Object.assign({}, store.getSellerProfile())
    this.setData({
      profile: p,
      rulesSegments: auctionUtil.parseRichSegments(p.auctionRules || '')
    })
  },

  onField(event) {
    const { field } = event.currentTarget.dataset
    const profile = Object.assign({}, this.data.profile)
    profile[field] = event.detail.value
    var data = { profile }
    if (field === 'auctionRules') {
      data.rulesSegments = auctionUtil.parseRichSegments(event.detail.value)
    }
    this.setData(data)
  },

  chooseLogo() {
    const that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        wx.showLoading({ title: '处理中...' })
        const fs = wx.getFileSystemManager()
        try {
          const base64 = fs.readFileSync(file.tempFilePath, 'base64')
          const ext = (file.tempFilePath.match(/\.(\w+)$/) || [])[1] || 'png'
          const mime = ext === 'jpg' ? 'jpeg' : ext
          const dataUri = `data:image/${mime};base64,${base64}`
          const profile = Object.assign({}, that.data.profile, { storeLogo: dataUri })
          that.setData({ profile })
          wx.hideLoading()
        } catch (e) {
          wx.hideLoading()
          wx.showToast({ title: '图片处理失败', icon: 'none' })
        }
      }
    })
  },

  chooseQR() {
    const that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        wx.showLoading({ title: '处理中...' })
        const fs = wx.getFileSystemManager()
        try {
          const base64 = fs.readFileSync(file.tempFilePath, 'base64')
          const ext = (file.tempFilePath.match(/\.(\w+)$/) || [])[1] || 'png'
          const mime = ext === 'jpg' ? 'jpeg' : ext
          const dataUri = `data:image/${mime};base64,${base64}`
          const profile = Object.assign({}, that.data.profile, { wechatQR: dataUri })
          that.setData({ profile })
          wx.hideLoading()
        } catch (e) {
          wx.hideLoading()
          wx.showToast({ title: '图片处理失败', icon: 'none' })
        }
      }
    })
  },

  saveProfile() {
    store.saveSellerProfile(Object.assign({}, this.data.profile))
    wx.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 800)
  }
})