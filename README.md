# 词格使用手册

## GitHub Pages 静态版

运行 `npm run build:static` 输出到 `out/`。GitHub Pages 工作流会在 main 更新后构建和部署。页面路径为 `/lyric-grid-docs/`，换仓库名称时需同步修改 `vite.static.config.ts` 中的 base。

静态版提供文档阅读和 GitHub 源码编辑入口，不运行云端草稿、登录和图片上传 API。修改 content/default-fields.json 并提交后自动发布；原服务端编辑器源码保留供需要时部署。

北艾sama的词格独立使用文档，包含阅读页面及可视化文档编辑器。

## 本地运行

需要 Node.js 22.13 或更新版本及 npm。

```sh
npm ci
npm run dev
```

以终端显示的本地地址为准。生产构建使用 `npm run build`。编辑、保存与发布还需要下面列出的数据库、图片存储和身份认证配置，单独启动页面不代表编辑后端已就绪。

## 在代码里修改文档

- `content/default-fields.json`：默认文档文字。
- `app/doc-view.tsx`：文档结构。
- `app/globals.css`：样式。
- `app/editor/`：可视化编辑器。
- `app/edit/page.tsx`：编辑入口。
- `drizzle/`：数据库迁移文件。

在线发布内容可能覆盖默认文字。云端草稿、已发布的数据库记录和上传图片不包含在 Git 中；修改默认文字不等于修改云端已发布内容。

## 服务端依赖与迁移

当前项目使用 Vinext、Cloudflare Workers 和 Sites，需要 D1 绑定 `DB`、R2 绑定 `DOCS_IMAGES`，以及私密环境变量 `DOCS_OWNER_EMAIL`。数据库结构由 `drizzle/` 中的迁移文件管理。

编辑权限依赖 Sites 注入的可信身份请求头和登录入口，参见 `app/chatgpt-auth.ts`。跨站请求检查位于 `lib/authorization.ts`。换域名或托管平台时，需要适配可信身份认证和允许的来源；不能直接信任公网客户端自行发送的身份头。

`.openai/hosting.json` 保留原站点关联信息。此仓库不包含密钥、云端数据库备份、R2 图片备份、依赖缓存或构建产物。上传 GitHub 不会自动部署网站，GitHub Pages 不能运行此编辑器的数据库及服务端 API。

词格主站源码：`https://github.com/beiai-sama/lyric-grid`。
