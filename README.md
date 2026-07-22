# TronStore

基于 TRON 区块链的 USDT 虚拟商店，用户可通过 MPC 钱包充值 USDT 并购买虚拟商品。

## 功能特性

- MPC 钱包：为每个用户分配独立的 TRC20 USDT 充值地址
- 自动充值：监听链上交易，自动到账用户余额
- 商品管理：支持商品的增删改查及购买流程
- 资金归集：定期将用户地址的 USDT 归集到平台主地址
- 交易记录：完整的充值、购买、归集流水记录

## 技术栈

- 前端：Nuxt 4 + @nuxt/ui 4 + VueUse
- 后端：Nitro + unstorage (文件系统存储)
- 区块链：TronWeb + MPC 钱包 (@fystack/mpcium-ts)
- 消息队列：NATS JetStream
- 开发工具：Bun (开发) / Node.js (生产) + oxlint/oxfmt

## 快速开始

### 环境要求

- Node.js ≥ 21.7.0 (生产环境)
- Bun ≥ 1.1 (开发环境)

### 基础设施

- NATS：https://nats.io
- mpcium：https://github.com/fystack/mpcium
- tronecho：https://github.com/jerryshell/tronecho

### 安装依赖

```bash
bun install
```

### 配置环境变量

```bash
cp .env.example .env
```

然后编辑 `.env` 文件，填写实际值。各变量说明请参考 `.env.example` 中的注释。

### 启动开发服务器

```bash
bun run dev
```

### 生产构建

```bash
bun run build
node .output/server/index.mjs
```

## 项目结构

```
tronstore/
├── app/                 # 前端应用
│   ├── components/      # Vue 组件
│   ├── composables/     # 组合式函数
│   ├── layouts/         # 布局组件
│   ├── middleware/      # 路由中间件
│   ├── pages/           # 页面文件
│   └── utils/           # 工具函数
├── server/              # 后端服务
│   ├── api/             # API 接口
│   ├── services/        # 业务服务
│   ├── plugins/         # 服务插件
│   └── utils/           # 服务工具
├── data/                # 数据存储 (gitignore)
└── docs/                # 项目文档
```

## 开发命令

```bash
bun run dev          # 启动开发服务器
bun run build        # 生产构建
bun run lint         # 代码检查
bun run format       # 代码格式化
bun run typecheck    # 类型检查
```

## 许可证

MIT
