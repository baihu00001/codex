const store = require('../../utils/store')

function pad(value) {
  return `${value}`.padStart(2, '0')
}

function todayDate() {
  const date = new Date()
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function persistTempImage(tempFilePath) {
  try {
    const extMatch = tempFilePath.match(/\.(\w+)$/)
    const ext = extMatch ? extMatch[1] : 'jpg'
    const filePath = `${wx.env.USER_DATA_PATH}/rich_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    wx.getFileSystemManager().copyFileSync(tempFilePath, filePath)
    return filePath
  } catch (error) {
    return tempFilePath
  }
}

Page({
  data: {
    image: '',
    richContent: '',
    richImages: [],
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
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return

        const imagePath = persistTempImage(file.tempFilePath)
        const richImages = (this.data.richImages || []).concat(imagePath)
        const current = this.data.richContent || ''
        this.setData({
          richImages,
          richContent: `${current}\n<p>[图片${richImages.length}]</p>`
        })
        wx.showToast({ title: '图片已插入', icon: 'success' })
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
      richImages: this.data.richImages || [],
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
