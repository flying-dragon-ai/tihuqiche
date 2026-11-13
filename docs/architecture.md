# 目录规范与死代码清理

这份文档只描述当前仓库的职责边界和清理流程。项目规模不大，所以保留扁平的 `src/`，不强行套 `features/` 分层；关键是每个目录只做一类事。

## 目录职责

| 路径 | 职责 |
| --- | --- |
| `src/main.js` | 浏览器入口，挂载 Vue 应用 |
| `src/entry-server.js` | 中英文静态页面预渲染入口 |
| `src/App.vue` | 应用组装：状态、偏好、弹窗、引擎桥接 |
| `src/game.js` | 游戏组合根：世界、角色、课程、会话、渲染循环 |
| `src/game-session.js` | 开局、暂停、结算、动作、物理步进 |
| `src/game-render.js` | 帧循环、角色摆放、HUD 节流 |
| `src/game-preview.js` | 首页 / 装扮预览控制器 |
| `src/game-theme.js` | 主题切换 |
| `src/game-camera.js` | 追随镜头与双人标记 |
| `src/rules.js` | 纯规则：计分、星级、冲刺、道具 |
| `src/collisions.js` | 扫掠碰撞与拾取判定 |
| `src/storage.js` | 进度、外观、迁移与损坏保护 |
| `src/course*.js` | 赛道实体、布局、标记、粒子 |
| `src/world.js` | 场景、灯光、道路、海面、终点门 |
| `src/scenery*.js` / `src/city-scenery.js` | 自然场景、城市地标、路边细节、动态生活 |
| `src/rider*.js` | 鹈鹕、载具、装扮、护盾与喷火 |
| `src/components/` | Vue UI 组件，只负责展示与交互 |
| `src/composables/` | 可复用的 Vue 组合式函数 |
| `src/styles/` | 全局样式、主题与响应式布局 |
| `src/assets/` | Logo、装扮缩略图等静态资源 |
| `scripts/` | 构建、素材生成、死代码扫描 |
| `tests/` | Node 单元测试 + Playwright 浏览器检查 |
| `public/` | favicon、分享图、robots、sitemap |
| `vendor/three/` | Three.js 原始许可证（运行时引擎由 npm 包提供） |

## 新增代码放哪里

- 纯规则、计分、碰撞、存档迁移：放 `src/` 根目录的纯 JS 模块，不引入 Three.js / DOM / Vue。
- 新的 3D 模型或场景：放对应的 `world.js`、`scenery*.js`、`rider*.js`，并补场景测试。
- 新的 UI 弹窗或面板：放 `src/components/`，状态提升到 `App.vue` 或 composable。
- 跨组件复用的状态逻辑：放 `src/composables/`。
- 构建、素材、清理脚本：放 `scripts/`，并在 `package.json` 里加命令。
- 动态导入、字符串路径引用、只在运行时加载的文件：必须加入 `knip.json` 的 `entry` 或 `ignoreUnresolved`，否则会被误报。

## 死代码清理流程

```bash
pnpm deadcode:check              # Knip 全量报告：文件 / export / 依赖
pnpm deadcode:report             # 输出 JSON 报告到 deadcode-report.json
pnpm deadcode:files              # 只报告 src/ 下完全未使用的文件
pnpm deadcode:files -- --delete  # 确认后删除
```

`scripts/find-unused.mjs` 只扫描 `src/`，保护入口文件和生成文件，并跳过 `.id.` / `.my.` 等 locale 变体。默认 dry-run，确认后再加 `--delete`。

每删完一批，按顺序跑：

```bash
pnpm format:check
pnpm lint
pnpm deadcode:check
pnpm test
```

`pnpm test` 会执行单元测试、构建和 Playwright 浏览器检查。确认首页、开始游戏、关卡切换、存档、分享和设置没有回归后再提交。

## 工程约束

- 不提交 `dist/`、`test-results/`、`deadcode-report.json`。
- 新增文件前先想清楚它属于哪个目录；不要往 `src/` 根目录堆“先留着备用”的文件。
- 删除文件时优先用 `pnpm deadcode:files` 的 dry-run 结果，不要直接清空目录。
- 动态导入和运行时路径引用必须显式登记，避免 Knip 误删。
