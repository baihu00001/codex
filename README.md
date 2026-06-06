# 动态降价式拍卖微信小程序

这是一个原生微信小程序首版原型，支持卖家发布拍卖、买家举牌随机降价、冷却限制、触底优先购买、模拟支付和卖家管理。

## 使用方式

1. 打开微信开发者工具。
2. 选择“导入项目”。
3. 项目目录选择本文件夹：`D:\AI_Code\codex\weixin_sales`。
4. AppID 可使用测试号，或直接使用项目中的 `touristappid` 体验。
5. 编译后从底部 tab 进入“拍卖”或“卖家”。

## 浏览器试用

如果暂时不导入微信开发者工具，可以直接用浏览器打开：

`D:\AI_Code\codex\weixin_sales\web\index.html`

这个页面是 H5 试用版，使用浏览器 `localStorage` 保存演示数据，覆盖拍卖大厅、详情举牌、模拟购买、卖家发布和管理。

## 首版说明

- 数据使用 `wx` 本地缓存，首次打开会写入模拟拍卖数据。
- 支付为模拟支付成功，不调用真实微信支付。
- 登录为模拟用户 `体验买家`。
- 商品图片可在发布页选择本地临时图片；未选择时使用内置示意图。
- 后续接微信云开发时，优先替换 `utils/store.js` 的读写实现。

## 核心页面

- `pages/index/index`：买家商品列表。
- `pages/detail/detail`：拍卖详情、举牌、购买。
- `pages/order/order`：模拟支付结果。
- `pages/seller/seller`：卖家中心。
- `pages/publish/publish`：发布拍卖。
- `pages/manage/manage`：拍卖进度与成交记录。
