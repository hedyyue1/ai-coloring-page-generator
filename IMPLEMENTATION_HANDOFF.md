# IMPLEMENTATION_HANDOFF — R8.1A Linea → Next.js 迁移

交付人: 筑构 (qianduan profile)
日期: 2026-08-02
仓库: https://github.com/hedyyue1/ai-coloring-page-generator (private)

## 范围

以 `owner-input/linea-complete-frontend-package.zip` 为唯一视觉源，完成 Linea 全套前端到
Next.js 15 App Router + TypeScript 的迁移；PRD-V5 (`prd-auth-creem-v5-zh.md`) 与
`PRICING_SOURCE_OF_TRUTH_V5.md` 仅用于校正文案与价格边界。

本卡 (t_88dc2e07) 只负责: 页面/导航/响应式/可见交互迁移、lint/typecheck/build 修复、
`SOURCE_MAPPING.md` / 本文件、`.gitignore` 检查、commit + push main。
Cloudflare 部署由子卡 R8.1B (t_c253f102) 执行。

## 交付物

- `app/` — Next.js 15.5.22 + React 19 + TypeScript 5.7, App Router
- 20 个路由全部静态预渲染成功 (见 `logs/build.log`)
- `app/SOURCE_MAPPING.md` — 逐屏 Linea→Next.js 映射表
- 日志: `logs/r8.1-install.log`, `logs/r8.1a-lint.log`, `logs/typecheck.log`, `logs/build.log`

## 技术栈

- Next.js 15.5.22 (App Router), React 19.0.0, TypeScript 5.7.3
- lucide-react 0.469.0 图标
- ESLint 9 + eslint-config-next
- 无运行时后端依赖 (NO_BACKEND_REQUIRED)；登录/账户/结算为前端壳，待 R6 后端接入

## 续作期修复记录 (相对 Run #43 中断点)

1. `src/pages/` → `src/screens/` 重命名: Next.js 15 对 App Router 项目内名为 `pages`
   的目录套用 Pages Router 类型约束，build 报 `PagesPageConfig` / `Property 'default'
   is missing`。已重命名并批量更新 18 个路由壳的 `@/pages` → `@/screens` 导入。
2. `/support` 屏 `PolicyPages.tsx` 移除 `<form onSubmit={...}>`: 该文件为 server
   component，事件处理器导致 prerender 失败 ("Event handlers cannot be passed to
   Client Component props")。表单全部输入为 disabled 原型态，改用静态 `action="#support"`。

## 质量门 (真实执行结果)

| 门 | 命令 | 结果 | 日志 |
|---|---|---|---|
| Lint | `npm run lint` | exit 0, 0 errors / 0 warnings | `logs/r8.1a-lint.log` |
| Typecheck | `npx tsc --noEmit` | exit 0 | `logs/typecheck.log` |
| Build | `npm run build` | exit 0, 20/20 static prerender | `logs/build.log` |
| .gitignore | 人工核查 | node_modules/.next/.env*/.dev.vars/.wrangler/.open-next/*.pem 均已排除 | — |

## R8.1B Cloudflare Workers 生产交付

部署卡: `t_b73a3cf7`

- 生产入口: <https://ai-coloring-page-generator.hedyyue1.workers.dev>
- Cloudflare Worker: `ai-coloring-page-generator`
- 首次生产版本标识: `5e14fd8d-be7f-4925-a6e1-47eae783bc3c`；已用 `wrangler deployments list` 独立核验当前 100% 流量版本。
- 适配器: `@opennextjs/cloudflare`；Wrangler 配置仅启用 `workers.dev`，未绑定自定义域名。
- 发布基线提交: `b10355dc8d2bc84ee07e43a61bf5c48aa48e489c`；本次新增的适配器配置、依赖锁定与部署文档随 R8.1B 提交推送。
- 无环境变量、Cloudflare token、`.dev.vars`、`.env*`、`.wrangler/` 或 `.open-next/` 构建产物提交到仓库。

### 真实质量门与发布证据

| 门 | 命令 / 检查 | 结果 | 证据 |
|---|---|---|---|
| Lint | `npm run lint` | exit 0 | `../logs/r8.1b-lint.log` |
| Typecheck | `npm run typecheck` | exit 0 | `../logs/r8.1b-typecheck.log` |
| Next build | `npm run build` | exit 0，20/20 路由预渲染 | `../logs/r8.1b-next-build.log` |
| OpenNext adapter | `npm run cf:build` | exit 0，Worker bundle 创建成功 | `../logs/r8.1b-adapter-build.log` |
| 依赖审计 | `npm audit --omit=dev --audit-level=high` | exit 0，0 vulnerabilities | Kanban 运行记录 |
| Deploy | `npx opennextjs-cloudflare deploy` | exit 0，版本已发布 | `../logs/deploy.log` |
| Git 同步 | local `HEAD` vs `origin/main` | 发布基线一致；R8.1B 提交后再次核对 | Kanban 运行记录 |

浏览器已真实访问 `/`、`/pricing`、`/photo-to-coloring-page`、`/account`、`/privacy`；页面标题与主体内容均成功渲染，控制台为 0 message / 0 JavaScript error。照片工作流的权利确认 checkbox 可切换，未选择本地文件时 `Preview generation reservation` 保持 disabled；站内导航点击可抵达 `/pricing`，价格页 4 个购买按钮继续保持 disabled，未越过产品闸口。完整记录见 `BROWSER_SMOKE.md`。

关键截图:

- `../evidence-r8.1b-production/01-home-desktop-full.png`
- `../evidence-r8.1b-production/02-pricing-desktop-full.png`
- `../evidence-r8.1b-production/03-photo-workflow-full.png`
- `../evidence-r8.1b-production/04-account-desktop-full.png`
- `../evidence-r8.1b-production/05-privacy-desktop-full.png`

### 已知边界

`/support` 表单、OAuth、账户、真实上传/生成、Creem 结算与持久化仍为前端壳或禁用态；生产部署只交付当前已审核前端，不宣称这些能力已接通。OpenNext 构建日志中的 Node.js middleware opt-in 提示不影响本次静态路由交付；Cloudflare Wrangler 仅提示存在可更新版本，不构成发布失败。

## R8.2 Account 登录边界、动态数据与品牌修复

本轮根据产品复核意见完成以下修复：

1. 未登录状态不渲染 Account 导航组；顶部只保留登录入口。
2. `/account`、积分、订阅、数据删除和结算状态页统一经过 `ProtectedAccount`，游客直接访问会跳转到 `/login?next=...`。
3. Account 用户名、邮箱、头像、套餐、积分余额、周期和积分事件统一消费 `AccountSession`；移除演示账户和固定用户数据。
4. 新增 `/api/session` 会话边界。可信认证尚未接入时明确返回未登录，不伪造生产用户。
5. 重写首页、工具、价格、登录、Account 和政策页的用户文案，移除面向用户暴露的内部实现及审批术语。
6. 新增并接入 `favicon.ico`、Linea Logo、品牌标记和 Apple Touch Icon。

### R8.2 质量门

| 门 | 结果 |
|---|---|
| TypeScript | `npm run typecheck` exit 0 |
| ESLint | `npm run lint` exit 0，0 warnings / 0 errors |
| 生产依赖审计 | `npm audit --omit=dev --audit-level=high` exit 0，0 vulnerabilities |
| OpenNext / Cloudflare | `npm run cf:build` exit 0，22/22 页面生成，Worker bundle 成功 |
| Chromium 桌面与移动端 | 首页、工具、政策页渲染通过；favicon/Logo 资源均 HTTP 200；0 个致命 JavaScript 控制台签名 |
| 游客权限回归 | Account 导航不存在；直接访问 `/account`、`/account/credits` 均进入登录页，Account 数据未泄漏 |

### R8.2 真实能力边界

当前代码已经建立统一会话模型与 Account 数据消费边界，但 Google OAuth、服务端 Session Store、订阅、积分持久化和生成服务仍未接通。因此生产访客会被诚实判定为未登录，不能访问 Account 页面；不得将这一前端边界描述为真实认证后端已经完成。
