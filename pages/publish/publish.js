const store = require('../../utils/store')

function pad(value) {
  return `${value}`.padStart(2, '0')
}

function todayDate() {
  const date = new Date()
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

Page({
  data: {
    image: '',
    richContent: '',
    date: todayDate(),
    time: '23:59'
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (file) {
          this.setData({ image: file.tempFilePath })
        }
      }
    })
  },

  insertImage() {
    const that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        wx.showLoading({ title: '处理中...' })
        // 读取文件并转为 base64
        const fs = wx.getFileSystemManager()
        try {
          const base64 = fs.readFileSync(file.tempFilePath, 'base64')
          // 用 Canvas 压缩图片，但小程序环境简化处理：直接限制大小
          const ext = file.tempFilePath.match(/\.(\w+)$/)?.[1] || 'png'
          const mime = ext === 'jpg' ? 'jpeg' : ext
          const imgTag = `<img src="data:image/${mime};base64,${base64}" style="max-width:100%;border-radius:8rpx;margin:8rpx 0">`
          const current = that.data.richContent || ''
          that.setData({ richContent: current + '\n' + imgTag })
          wx.hideLoading()
          wx.showToast({ title: '图片已插入', icon: 'success' })
        } catch (e) {
          wx.hideLoading()
          wx.showToast({ title: '图片处理失败', icon: 'none' })
        }
      }
    })
  },

  onDateChange(event) {
    this.setData({ date: event.detail.value })
  },

  onTimeChange(event) {
    this.setData({ time: event.detail.value })
  },

  handleSubmit(event) {
    const values = event.detail.value
    const startPrice = Number(values.startPrice)
    const reservePrice = Number(values.reservePrice)
    const minDrop = Number(values.minDrop)
    const maxDrop = Number(values.maxDrop)
    const endAt = new Date(`${this.data.date}T${this.data.time}:00`).getTime()

    if (!values.title) {
      wx.showToast({ title: '请填写商品标题', icon: 'none' })
      return
    }
    if (!startPrice || !reservePrice || startPrice <= reservePrice) {
      wx.showToast({ title: '起拍价需大于保底价', icon: 'none' })
      return
    }
    if (!minDrop || !maxDrop || minDrop > maxDrop) {
      wx.showToast({ title: '请检查随机降幅', icon: 'none' })
      return
    }
    if (endAt <= Date.now()) {
      wx.showToast({ title: '截拍时间需晚于当前时间', icon: 'none' })
      return
    }

    const auction = store.createAuction({
      title: values.title,
      description: values.description || '卖家暂未填写详细描述',
      richContent: values.richContent || '',
      image: this.data.image || '/assets/product-sample.svg',
      stock: Number(values.stock || 1),
      startPrice,
      reservePrice,
      minDrop,
      maxDrop,
      cooldownSeconds: Number(values.cooldownSeconds || 10),
      maxParticipants: Number(values.maxParticipants || 0),
      endAt
    })

    wx.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => {
      wx.navigateTo({ url: `/pages/detail/detail?id=${auction.id}` })
    }, 500)
  }
})