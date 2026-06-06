function toCents(amount) {
  return Math.round(Number(amount || 0) * 100)
}

function fromCents(cents) {
  return Math.round(cents) / 100
}

function money(amount) {
  return Number(amount || 0).toFixed(2)
}

function randomDrop(minDrop, maxDrop, currentPrice, reservePrice) {
  const min = Math.max(1, toCents(minDrop))
  const max = Math.max(min, toCents(maxDrop))
  const usable = Math.max(0, toCents(currentPrice) - toCents(reservePrice))
  if (usable <= 0) return 0
  const boundedMax = Math.min(max, usable)
  const cents = Math.floor(Math.random() * (boundedMax - min + 1)) + min
  return fromCents(Math.min(cents, usable))
}

function applyDrop(auction) {
  const drop = randomDrop(
    auction.minDrop,
    auction.maxDrop,
    auction.currentPrice,
    auction.reservePrice
  )
  const nextPrice = fromCents(
    Math.max(toCents(auction.currentPrice) - toCents(drop), toCents(auction.reservePrice))
  )
  return {
    drop,
    nextPrice,
    reachedFloor: toCents(nextPrice) <= toCents(auction.reservePrice)
  }
}

function statusText(status) {
  const map = {
    active: '进行中',
    floor: '触底待成交',
    sold: '已成交',
    ended: '已结束'
  }
  return map[status] || '未知'
}

function countdownText(targetAt, now) {
  const diff = Math.max(0, Number(targetAt || 0) - now)
  const totalSeconds = Math.floor(diff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}时${minutes}分`
  if (minutes > 0) return `${minutes}分${seconds}秒`
  return `${seconds}秒`
}

function enrichAuction(auction, now) {
  const item = Object.assign({}, auction)
  if (item.status === 'active' && Number(item.endAt) <= now) {
    item.status = 'ended'
  }
  item.statusLabel = statusText(item.status)
  item.priceText = money(item.currentPrice)
  item.startPriceText = money(item.startPrice)
  item.reservePriceText = money(item.reservePrice)
  item.countdown = item.status === 'floor'
    ? countdownText(item.priorityExpireAt, now)
    : countdownText(item.endAt, now)
  item.participantCount = Array.isArray(item.participants) ? item.participants.length : 0
  return item
}

function cooldownLeft(auction, userId, now) {
  const cooldowns = auction.cooldowns || {}
  const lastAt = Number(cooldowns[userId] || 0)
  const diff = Number(auction.cooldownSeconds || 0) * 1000 - (now - lastAt)
  return Math.max(0, Math.ceil(diff / 1000))
}

function hasPriorityLock(auction, userId, now) {
  return auction.status === 'floor'
    && Number(auction.priorityExpireAt || 0) > now
    && auction.priorityBuyerId
    && auction.priorityBuyerId !== userId
}

module.exports = {
  applyDrop,
  cooldownLeft,
  countdownText,
  enrichAuction,
  hasPriorityLock,
  money,
  statusText
}
