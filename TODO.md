# 第二版迭代 TODO 清单

> 本文档记录所有缺失功能及迭代方案，按优先级分组。
> 每项前缀 `[ ]` 表示未完成，完成后改为 `[x]`。

---

## P0 — 高优先级（核心功能缺陷，必须修复）

### TODO-01: NLTaskCreator 解析数据未流入 TaskForm
- **问题**: `NLTaskCreator.tsx` 将 AI 解析结果写入 `window.__aiParsedTask`，但 `TaskForm.tsx` 从未读取该值，导致 AI 解析后创建表单为空
- **影响**: Track D 核心功能 — 自然语言创建任务流程断裂
- **涉及文件**:
  - `frontend/src/components/tasks/TaskForm.tsx`
  - `frontend/src/components/ai/NLTaskCreator.tsx`
  - `frontend/src/context/TaskContext.tsx`
- **迭代方案**:
  1. 在 `TaskContext` 的 State 中新增 `aiParsedTask: NLTaskParseResult | null`
  2. 新增 Action `SET_AI_PARSED_TASK`
  3. NLTaskCreator 解析成功后 dispatch `SET_AI_PARSED_TASK`
  4. TaskForm 挂载时检测 `state.aiParsedTask`，如果有值则预填充表单字段（title、description、priority、tags、due_date），并 dispatch 清空
- **验收标准**: 输入"明天下午3点提醒我买菜" → 点击解析 → 创建表单自动填入标题"买菜"、截止时间明天15:00

---

### TODO-02: TaskBreakdown 未集成到 TaskDetail
- **问题**: `TaskBreakdown.tsx` 组件存在但未在 `TaskDetail.tsx` 中引用使用
- **影响**: Track D — 任务分解功能不可达
- **涉及文件**:
  - `frontend/src/components/tasks/TaskDetail.tsx`
  - `frontend/src/components/ai/TaskBreakdown.tsx`
- **迭代方案**:
  1. 在 `TaskDetail.tsx` 的内容区域（描述下方）引入 `TaskBreakdown` 组件
  2. 传入当前任务的 `taskId`、`title`、`description`
- **验收标准**: 打开任务详情 → 看到"AI 任务分解"按钮 → 点击后展示子任务列表 → 可一键创建子任务

---

### TODO-03: AI 标签推荐无前端 UI
- **问题**: 后端 `POST /api/ai/suggest-tags` 已实现，前端 `api/ai.ts` 有 `suggestTags()` 函数，但无任何 UI 组件调用它
- **影响**: Track D — 智能标签推荐不可用
- **涉及文件**:
  - `frontend/src/components/tasks/TaskForm.tsx`（在表单中添加）
- **迭代方案**:
  1. 在 `TaskForm` 的标签输入区域旁添加"AI 推荐"按钮
  2. 点击后调用 `suggestTags(title, description)`
  3. 在标签输入框下方展示推荐标签 chips，点击可追加到 tags 输入
- **验收标准**: 填写标题"季度报告" → 点击 AI 推荐 → 显示["工作","报告","文档"]等标签 → 点击标签自动加入

---

### TODO-04: AI 优先级推荐无前端 UI
- **问题**: 后端 `POST /api/ai/recommend-priority` 已实现，前端有 `recommendPriority()` 函数，但无 UI 调用
- **影响**: Track D — 优先级推荐不可用
- **涉及文件**:
  - `frontend/src/components/tasks/TaskForm.tsx`
- **迭代方案**:
  1. 在 `TaskForm` 的优先级选择区域旁添加"AI 推荐"按钮
  2. 点击后调用 `recommendPriority(title, description)`
  3. 展示推荐优先级和理由，用户可一键采纳
- **验收标准**: 填写标题"紧急修复线上Bug" → 点击 AI 推荐 → 显示"高优先级：标题包含紧急关键词" → 一键设置

---

### TODO-05: AI 相似任务检测无前端 UI
- **问题**: 后端 `POST /api/ai/detect-similar` 已实现，前端有 `detectSimilar()` 函数，但无 UI
- **影响**: Track D — 相似任务检测不可用
- **涉及文件**:
  - `frontend/src/components/tasks/TaskDetail.tsx`（新增区域）
- **迭代方案**:
  1. 在 `TaskDetail` 底部新增"相似任务"区域
  2. 点击"检测相似任务"按钮，调用 `detectSimilar(taskId)`
  3. 展示相似任务列表（标题 + 相似原因），点击可跳转到对应任务
- **验收标准**: 打开"完成季度报告"任务详情 → 点击检测 → 显示相似任务"团队周会"（原因：同属工作/报告类）

---

### TODO-06: 补充后端单元测试
- **问题**: `backend/tests/` 目录为空，无任何测试文件
- **影响**: 代码质量要求（评估权重 30%）
- **涉及文件**（需新建）:
  - `backend/tests/conftest.py`
  - `backend/tests/test_tasks.py`
  - `backend/tests/test_dependencies.py`
  - `backend/tests/test_ai.py`
- **迭代方案**:
  1. `conftest.py`: 创建测试用 SQLite 内存数据库、TestClient fixture、自动建表/清理
  2. `test_tasks.py`: 覆盖 CRUD 全流程 + 空标题/超长标题/无效状态等验证 + 过滤/排序/分页/搜索
  3. `test_dependencies.py`: 覆盖添加/删除依赖、循环检测、依赖未完成不可完成、依赖树构建、级联删除
  4. `test_ai.py`: Mock AI 响应，测试自然语言解析、标签推荐、任务分解、AI 设置读写
- **验收标准**: `pytest` 全部通过，覆盖核心业务逻辑至少 20 个测试用例

---

### TODO-07: Git 提交历史
- **问题**: Git 仓库已初始化但零提交
- **影响**: 题目明确要求有意义的 commit 历史
- **迭代方案**:
  1. 按功能分批提交，至少 5-6 个 commit：
     - `feat: init project skeleton and config`
     - `feat: implement task CRUD with filtering, sorting, pagination`
     - `feat: add task dependency management with cycle detection`
     - `feat: implement AI module with multi-provider support`
     - `feat: build React frontend with kanban and list views`
     - `feat: add AI feature UI and Docker deployment`
- **验收标准**: `git log` 显示清晰的分阶段提交记录

---

## P1 — 中优先级（Track 必做功能不完整）

### TODO-08: 日历视图
- **问题**: 题目要求 list/kanban/calendar 三种视图，当前只有 list 和 kanban
- **影响**: Track B 显式要求
- **涉及文件**（需新建/修改）:
  - `frontend/src/components/tasks/TaskCalendar.tsx`（新建）
  - `frontend/src/components/layout/Header.tsx`（添加视图切换）
  - `frontend/src/App.tsx`（添加 calendar 路由）
  - `frontend/src/types/index.ts`（ViewMode 添加 calendar）
  - `frontend/src/utils/constants.ts`（日历相关常量）
- **迭代方案**:
  1. 新建 `TaskCalendar.tsx`，实现月历网格视图
  2. 按 `due_date` 将任务分配到对应日期格子
  3. 无截止日期的任务单独展示在底部
  4. Header 视图切换添加日历图标按钮（Calendar icon）
  5. ViewMode 扩展为 `'list' | 'kanban' | 'calendar'`
- **验收标准**: 切换到日历视图 → 看到当月日历网格 → 有任务的日期显示任务卡片 → 可点击查看详情

---

### TODO-09: 系统扩展设计文档（100k+ 任务）
- **问题**: Track A 要求设计考虑扩展到 100k+ 任务的方案，当前无此文档
- **影响**: Track A 系统设计要求（评估权重 25%）
- **涉及文件**（需新建）:
  - `docs/ARCHITECTURE.md`
- **迭代方案**:
  1. 数据库层：SQLite → PostgreSQL 迁移方案、索引策略、分区方案
  2. 缓存层：内存缓存 → Redis、缓存预热、缓存击穿防护
  3. API 层：分页优化（游标分页 vs 偏移分页）、连接池配置
  4. 搜索：SQLite ilike → PostgreSQL FTS / Elasticsearch
  5. 部署：水平扩展、负载均衡、读写分离
  6. 前端：虚拟滚动、懒加载、WebSocket 推送
- **验收标准**: 文档覆盖上述 6 个维度，每项有现状 → 目标 → 迁移路径

---

### TODO-10: 性能 Benchmark
- **问题**: Track A 要求 API 基本操作 < 100ms，无实测数据
- **影响**: Track A 性能优化要求
- **涉及文件**（需新建）:
  - `backend/tests/test_performance.py`
- **迭代方案**:
  1. 使用 `time.perf_counter()` 在测试中测量各 API 响应时间
  2. 测试场景：单任务查询、列表查询（100 条数据）、创建、更新、删除
  3. 在 README 中添加性能测试结果表格
- **验收标准**: 所有基本操作 < 100ms，有测试数据记录

---

## P2 — 低优先级（加分项）

### TODO-11: 暗色模式
- **问题**: 无暗色主题支持
- **影响**: Track B Bonus
- **涉及文件**:
  - `frontend/src/index.css`（添加暗色变量）
  - `frontend/src/components/layout/Header.tsx`（添加切换按钮）
  - 所有使用颜色的组件（添加 `dark:` 前缀）
- **迭代方案**:
  1. 在 `index.css` 定义暗色 CSS 变量
  2. Header 添加日/月切换按钮
  3. 核心组件添加 `dark:` Tailwind 类（bg、text、border）
  4. 偏好存储到 `localStorage`
- **验收标准**: 点击切换按钮 → 全局切换暗色/亮色 → 刷新后保持

---

### TODO-12: 导出任务（CSV/JSON）
- **问题**: 无任务导出功能
- **影响**: Track C Bonus
- **涉及文件**:
  - `backend/app/api/tasks.py`（新增导出端点）
  - `frontend/src/components/layout/Header.tsx`（添加导出按钮）
- **迭代方案**:
  1. 后端新增 `GET /api/tasks/export?format=csv|json`
  2. CSV: 用 Python `csv` 模块生成，设置 `Content-Disposition` 下载头
  3. JSON: 直接返回完整任务列表
  4. 前端 Header 添加导出按钮，选择格式后触发下载
- **验收标准**: 点击导出 → 选择 CSV/JSON → 浏览器下载文件 → 内容正确

---

### TODO-13: 全文搜索（SQLite FTS5）
- **问题**: 当前搜索使用 `ilike` 模糊匹配，非全文索引
- **影响**: Track A Bonus
- **涉及文件**:
  - `backend/app/models/task.py`（新增 FTS 虚拟表）
  - `backend/app/services/task_service.py`（搜索逻辑改用 FTS）
  - `backend/app/database.py`（建表时同步 FTS 索引）
- **迭代方案**:
  1. 创建 FTS5 虚拟表 `tasks_fts` 同步 title 和 description
  2. 任务创建/更新/删除时同步更新 FTS 索引
  3. 搜索参数存在时使用 `MATCH` 查询替代 `ilike`
- **验收标准**: 搜索"报告"能匹配到标题和描述中包含"报告"的任务，且利用 FTS 索引

---

### TODO-14: 用户认证
- **问题**: 无用户系统，所有 API 无需认证
- **影响**: Track A/C Bonus
- **涉及文件**（需新建/修改）:
  - `backend/app/models/user.py`（新建）
  - `backend/app/api/auth.py`（新建）
  - `backend/app/services/auth_service.py`（新建）
  - `backend/app/main.py`（添加 JWT 中间件）
  - `frontend/src/components/auth/LoginForm.tsx`（新建）
- **迭代方案**:
  1. 新增 User 模型（username, hashed_password）
  2. JWT Token 认证：`POST /api/auth/register`、`POST /api/auth/login`
  3. 所有 API 添加 `Depends(get_current_user)`
  4. 前端添加登录页面，Axios 拦截器自动附加 Token
- **验收标准**: 未登录访问 API 返回 401 → 注册/登录成功 → 正常使用

---

### TODO-15: Rate Limiting
- **问题**: API 无访问频率限制
- **影响**: Track A Bonus
- **涉及文件**:
  - `backend/app/main.py`（添加中间件）
- **迭代方案**:
  1. 使用 `slowapi` 库添加全局限流（如 60 次/分钟）
  2. AI 相关端点单独限流（如 10 次/分钟）
- **验收标准**: 短时间大量请求后返回 429 Too Many Requests

---

### TODO-16: 键盘快捷键
- **问题**: 仅有 Escape 关闭弹窗
- **影响**: Track B Bonus
- **涉及文件**:
  - `frontend/src/App.tsx`（添加全局 keydown 监听）
- **迭代方案**:
  1. `N` — 新建任务
  2. `Ctrl+K` — 聚焦搜索框
  3. `1/2/3` — 切换列表/看板/日历视图
  4. `Esc` — 关闭弹窗/取消选中
- **验收标准**: 按对应键触发对应操作

---

### TODO-17: 数据可视化图表
- **问题**: 无任务统计图表
- **影响**: Track B Bonus
- **涉及文件**（需新建）:
  - `frontend/src/components/tasks/TaskStats.tsx`（新建）
  - `frontend/src/components/layout/Sidebar.tsx`（集成）
  - 需安装 `recharts` 依赖
- **迭代方案**:
  1. 安装 `recharts`
  2. 新建 `TaskStats.tsx`，展示：
     - 状态分布饼图（待办/进行中/已完成）
     - 优先级分布柱状图
     - 近 7 天创建趋势折线图
  3. 集成到 Sidebar 底部
- **验收标准**: 侧边栏显示任务统计图表，数据随任务变化实时更新

---

### TODO-18: CI/CD（GitHub Actions）
- **问题**: 无自动化构建/测试流程
- **影响**: Bonus
- **涉及文件**（需新建）:
  - `.github/workflows/ci.yml`
- **迭代方案**:
  1. 配置 GitHub Actions
  2. 触发条件：push to main / PR
  3. 后端步骤：安装依赖 → pytest
  4. 前端步骤：npm install → tsc --noEmit → npm run build
- **验收标准**: Push 代码后自动运行测试和构建

---

## 汇总

| 优先级 | 数量 | 预计工作量 |
|--------|------|-----------|
| P0（必须修复） | 7 项 | 约 3 小时 |
| P1（功能补全） | 3 项 | 约 2 小时 |
| P2（加分项） | 8 项 | 约 4 小时 |
| **总计** | **18 项** | **约 9 小时** |

---

## 执行顺序建议

```
第一轮：P0 全部（TODO-01 ~ TODO-07）
  ├─ TODO-01~05: AI 前端集成修复（可并行）
  ├─ TODO-06: 后端测试
  └─ TODO-07: Git 提交

第二轮：P1（TODO-08 ~ TODO-10）
  ├─ TODO-08: 日历视图
  ├─ TODO-09: 架构文档
  └─ TODO-10: 性能测试

第三轮：P2 挑选高性价比项
  ├─ TODO-11: 暗色模式（视觉冲击力强）
  ├─ TODO-12: 导出功能（实用）
  └─ TODO-13: FTS5 全文搜索（后端亮点）
```
