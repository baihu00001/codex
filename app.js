const store = require('./utils/store')

App({
  globalData: {
    currentUser: {
      id: 'buyer_001',
      name: '体验买家',
      level: 'normal'
    }
  },

  onLaunch() {
    store.ensureSeedData()
  }
})
