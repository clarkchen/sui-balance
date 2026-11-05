# Sui Balance 隐私政策

[English version](PRIVACY_EN.md)

更新日期：2026-11-04

Sui Balance 的唯一用途是查询用户指定的 Sui 主网地址或对象 ID 的链上币种余额。

## 处理的数据

- 用户点击插件图标时，插件读取当前标签页的 URL，仅用于识别 Suiscan 地址或对象页面中的 Sui ID。插件不读取网页正文、浏览历史、Cookie 或钱包密钥。
- 用户也可以手动输入 Sui 地址或对象 ID。查询时，插件通过 HTTPS 将该 ID 和有关币种类型发送到 Sui 公共 GraphQL 接口 `https://graphql.mainnet.sui.io/graphql`，接收链上余额与币种精度。该服务的运营方可能按其自身政策处理请求。
- 查询结果只在当前弹窗显示。插件不将输入或结果保存到浏览器存储，也不发送到插件开发者的服务器。插件不含广告、分析或跟踪代码。
- 只有用户点击弹窗中的 Suiscan 链接时，浏览器才会打开相应的 Suiscan 页面。

## 数据用途和分享

插件仅为显示用户请求的链上余额而处理上述数据。除向 Sui 公共 GraphQL 接口发起查询外，开发者不出售、分享或另行使用这些数据。插件对从 Chrome API 获取的信息的使用遵守 Chrome Web Store User Data Policy 的 Limited Use 要求。

## 保存与删除

插件不持久保存地址、对象 ID、余额或浏览数据。关闭弹窗后，当前显示内容即不再由插件保留。

如有隐私问题，请通过 Chrome Web Store 页面列出的开发者联系渠道联系发布者。
