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

## 交接给 R8.1B (Cloudflare 部署)

- main 分支已推送 (SHA 见 kanban complete metadata)。
- 构建产物为纯静态 prerender + 标准 Next.js server output；如走 OpenNext/Cloudflare
  Workers，`.gitignore` 已预置 `.open-next` / `.wrangler` / `.dev.vars` 排除。
- 无环境变量 / 密钥被提交；部署所需任何密钥由部署卡现场注入，勿写入仓库。
- 已知边界: `/support` 表单、登录、账户、结算均为前端壳，线上展示时遵循 PRD-V5
  “未完成不宣称完成” 原则。
