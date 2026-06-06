const now = Date.now()

const sampleImage = '/assets/product-sample.svg'

const sampleRichContent = `
<div style="margin-bottom:16px">
  <h3 style="font-size:16px;color:#1a1a2e;margin:0 0 8px">产品亮点</h3>
  <ul style="padding-left:18px;margin:0;color:#4a4a6a;line-height:1.8">
    <li>精选三大产区咖啡豆，口感层次丰富</li>
    <li>手冲器具套装，新手也能轻松上手</li>
    <li>精美礼盒包装，送礼自用两相宜</li>
  </ul>
</div>
<div style="margin-bottom:16px">
  <h3 style="font-size:16px;color:#1a1a2e;margin:0 0 8px">规格参数</h3>
  <table style="width:100%;border-collapse:collapse;font-size:13px;color:#4a4a6a">
    <tr><td style="padding:6px 8px;border-bottom:1px solid #eaeaf2;width:40%">净含量</td><td style="padding:6px 8px;border-bottom:1px solid #eaeaf2">500g x 3</td></tr>
    <tr><td style="padding:6px 8px;border-bottom:1px solid #eaeaf2;width:40%">保质期</td><td style="padding:6px 8px;border-bottom:1px solid #eaeaf2">12个月</td></tr>
    <tr><td style="padding:6px 8px;border-bottom:1px solid #eaeaf2;width:40%">储存方式</td><td style="padding:6px 8px;border-bottom:1px solid #eaeaf2">阴凉干燥处</td></tr>
  </table>
</div>
<p style="color:#8e8ea0;font-size:12px;margin:0">* 图片仅供参考，以实物为准</p>
`.trim()

module.exports = {
  auctions: [
    {
      id: 'auc_1001',
      title: '精品手冲咖啡礼盒',
      image: sampleImage,
      description: '含三支不同产区咖啡豆，适合办公室与家庭冲煮。',
      richContent: sampleRichContent,
      stock: 1,
      startPrice: 299,
      reservePrice: 188,
      currentPrice: 259,
      minDrop: 3,
      maxDrop: 15,
      cooldownSeconds: 12,
      maxParticipants: 30,
      endAt: now + 2 * 60 * 60 * 1000,
      status: 'active',
      bidCount: 3,
      participants: ['buyer_102', 'buyer_088'],
      lastBidderId: 'buyer_088',
      lastBidderName: '用户088',
      lastBidAt: now - 4 * 60 * 1000,
      cooldowns: {},
      priorityBuyerId: '',
      priorityBuyerName: '',
      priorityExpireAt: 0,
      records: [
        {
          id: 'rec_1',
          userId: 'buyer_102',
          userName: '用户102',
          drop: 12,
          priceAfter: 287,
          createdAt: now - 18 * 60 * 1000
        },
        {
          id: 'rec_2',
          userId: 'buyer_088',
          userName: '用户088',
          drop: 13,
          priceAfter: 274,
          createdAt: now - 9 * 60 * 1000
        },
        {
          id: 'rec_3',
          userId: 'buyer_088',
          userName: '用户088',
          drop: 15,
          priceAfter: 259,
          createdAt: now - 4 * 60 * 1000
        }
      ],
      createdAt: now - 30 * 60 * 1000
    },
    {
      id: 'auc_1002',
      title: '桌面无线充电台灯',
      image: sampleImage,
      description: '三档色温，带手机无线充电区域，适合书桌与床头。',
      richContent: '',
      stock: 2,
      startPrice: 199,
      reservePrice: 129,
      currentPrice: 199,
      minDrop: 2,
      maxDrop: 8,
      cooldownSeconds: 8,
      maxParticipants: 20,
      endAt: now + 5 * 60 * 60 * 1000,
      status: 'active',
      bidCount: 0,
      participants: [],
      lastBidderId: '',
      lastBidderName: '',
      lastBidAt: 0,
      cooldowns: {},
      priorityBuyerId: '',
      priorityBuyerName: '',
      priorityExpireAt: 0,
      records: [],
      createdAt: now - 10 * 60 * 1000
    }
  ],
  orders: []
}