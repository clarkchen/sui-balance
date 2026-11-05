# Chrome 应用商店审核字段：不要粘贴到公开详细说明

名称：Sui Balance
分类建议：工具
简短说明：查询 Sui 主网地址的币种余额，并查看支持的 Vault 对象内部余额。
公开详细说明：只复制 `LISTING.md` 全文。
首页网址：https://sui-balance.0xclark.dev/zh/
隐私政策网址：https://sui-balance.0xclark.dev/zh/privacy/

单一用途：显示用户指定的 Sui 主网地址或对象 ID 的链上币种余额。

`activeTab` 权限用途：用户点击扩展程序时读取当前标签页 URL，仅识别 Suiscan 页面中的 Sui ID。

`https://graphql.mainnet.sui.io/*` 主机权限用途：向 Sui 公共 GraphQL 查询余额、对象动态字段和币种资料。

处理的数据：当前 Suiscan 页面 URL 中的 Sui ID，或用户手动输入的 ID，以及查询币种资料所需的币种类型。ID 与币种类型经 HTTPS 发送给 Sui 公共 GraphQL 服务。扩展程序自身不持久保存，也不向发布者运营的服务器发送数据。

远程代码：无。所有可执行 JavaScript 均在扩展程序软件包中，公共 GraphQL 接口只返回数据。
