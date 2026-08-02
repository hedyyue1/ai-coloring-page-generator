# SOURCE_MAPPING — Linea → Next.js (R8.1A)

唯一视觉源: `owner-input/linea-complete-frontend-package.zip`
文案/价格边界校正源: `prd-auth-creem-v5-zh.md`, `PRICING_SOURCE_OF_TRUTH_V5.md`

迁移策略: 每个 App Router 路由为薄壳 (thin shell)，视图实现集中在 `src/screens/*` 与 `src/components/*`，
视觉与结构按 Linea 完整包逐屏映射，品牌色 / 文案边界按 PRD-V5 校正。

## 路由 → 源屏映射

| App Router 路由 | 实现文件 | Linea 源屏 | 说明 |
|---|---|---|---|
| `/` | `src/screens/Home.tsx` | Linea home / landing | 首屏 hero、workflow 步骤、对比卡、价格摘要 |
| `/photo-to-coloring-page` | `src/screens/ToolPages.tsx` (`ToolPage mode="photo"`) | Linea photo tool | 照片转涂色页工具页，上传/参数/结果区结构 |
| `/text-to-coloring-page` | `src/screens/ToolPages.tsx` (`ToolPage mode="text"`) | Linea text tool | 文生涂色页工具页 |
| `/pricing` | `src/screens/ToolPages.tsx` (`PricingPage`) | Linea pricing | 按 PRICING_SOURCE_OF_TRUTH_V5 校正文案与价格边界 |
| `/login` | `src/screens/ToolPages.tsx` (`LoginPage`) | Linea login | Google 登录入口 (前端壳，接 Creem/Auth 后端) |
| `/account` | `src/screens/AccountPages.tsx` (`AccountPage`) | Linea account | 账户总览 |
| `/account/subscription` | `src/screens/AccountPages.tsx` (`SubscriptionPage`) | Linea subscription | 订阅状态页 |
| `/account/credits` | `src/screens/AccountPages.tsx` (`CreditsPage`) | Linea credits | 积分账本页 |
| `/account/data-deletion` | `src/screens/AccountPages.tsx` (`DataDeletionPage`) | Linea data deletion | 数据删除申请页 |
| `/checkout/pending` | `src/screens/AccountPages.tsx` (`CheckoutStatePage type="pending"`) | Linea checkout pending | 支付处理中 |
| `/success` | `src/screens/AccountPages.tsx` (`CheckoutStatePage type="success"`) | Linea checkout success | 支付成功 |
| `/cancel` | `src/screens/AccountPages.tsx` (`CheckoutStatePage type="cancel"`) | Linea checkout cancel | 支付取消 |
| `/privacy` | `src/screens/PolicyPages.tsx` (`PolicyPage type="privacy"`) | Linea privacy | 隐私政策 (按 PRD-V5 P0 边界) |
| `/terms` | `src/screens/PolicyPages.tsx` (`PolicyPage type="terms"`) | Linea terms | 服务条款 |
| `/acceptable-use` | `src/screens/PolicyPages.tsx` (`PolicyPage type="acceptable-use"`) | Linea acceptable use | 可接受使用政策 |
| `/refunds` | `src/screens/PolicyPages.tsx` (`PolicyPage type="refunds"`) | Linea refunds | 退款政策 |
| `/support` | `src/screens/PolicyPages.tsx` (`PolicyPage type="support"`) | Linea support | 支持页；表单后端未接通 (按 NO_BACKEND_REQUIRED 前端壳) |
| `not-found` | `src/screens/PolicyPages.tsx` (`NotFoundPage`) | Linea 404 | 404 |

## 共享组件

| 组件 | 文件 | Linea 源 |
|---|---|---|
| 全局布局 (header/footer/nav) | `src/components/ProductLayout.tsx` | Linea layout |
| 对比卡 (before/after slider) | `src/components/ComparisonCard.tsx` | Linea comparison widget |
| 全局样式 / 品牌 token | `src/app/globals.css` | Linea design tokens |
| 根布局 | `src/app/layout.tsx` | Linea root |

## 迁移期结构说明

- `src/screens/*` 为 Linea 各屏的 React 实现，供 `src/app/**/page.tsx` 薄壳复用。
- 早期迁移曾置于 `src/pages/`，因 Next.js 15 将 App Router 中名为 `pages` 的目录识别为
  Pages Router 导致 `PagesPageConfig` 类型错误，R8.1A 续作时重命名为 `src/screens/`
  并同步更新全部 `@/pages` → `@/screens` 导入。
- `/support` 表单移除客户端 `onSubmit` 处理器（该屏为 server component，
  全部输入为 disabled 原型态），消除 prerender 时 "Event handlers cannot be
  passed to Client Component props" 错误。

## 验证

- `npm run lint` — 0 errors / 0 warnings (日志: `logs/r8.1a-lint.log`)
- `npx tsc --noEmit` — exit 0 (日志: `logs/typecheck.log`)
- `npm run build` — exit 0, 20/20 路由静态预渲染成功 (日志: `logs/build.log`)
