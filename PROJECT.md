# 智能任务管理系统 (Intelligent Task Management System)

## 一、项目目标

构建一个功能完备的**智能任务管理系统**，覆盖后端开发、前端开发、全栈集成和 AI/LLM 四个技术方向，具体目标如下：

### 核心目标
- 提供完整的任务 CRUD 操作，支持任务的创建、查询、更新和删除
- 实现任务过滤、排序、分页和依赖关系管理
- 构建现代化前端界面，支持列表视图和看板视图，含拖拽交互
- 集成 AI 智能功能，包括自然语言创建任务、智能标签推荐、任务分解等
- 提供可配置的多 AI 提供商支持（OpenAI / Anthropic），用户可通过界面切换

### 非功能性目标
- API 基本操作响应时间 < 100ms
- 响应式设计，支持移动端访问
- 清晰的项目结构和代码组织
- Docker 容器化部署支持

---

## 二、技术选型

### 2.1 后端技术栈

| 技术 | 版本 | 选型理由 |
|------|------|----------|
| **Python** | 3.11+ | 生态丰富，开发效率高，AI/ML 库支持完善 |
| **FastAPI** | 0.115+ | 异步支持好，自带 OpenAPI 文档，类型安全，性能优秀 |
| **SQLAlchemy** | 2.0+ | Python 最成熟的 ORM，支持复杂查询构建 |
| **SQLite** | - | 零配置，无需安装数据库服务，适合演示和评估 |
| **Alembic** | 1.14+ | 数据库迁移管理工具，跟随 SQLAlchemy 生态 |
| **Pydantic** | 2.10+ | 数据验证和序列化，与 FastAPI 深度集成 |
| **Uvicorn** | 0.34+ | 高性能 ASGI 服务器 |

### 2.2 前端技术栈

| 技术 | 版本 | 选型理由 |
|------|------|----------|
| **React** | 19+ | 生态最大，社区活跃，组件化开发 |
| **TypeScript** | 5.7+ | 类型安全，提升代码质量和可维护性 |
| **Vite** | 6+ | 极速构建，现代开发体验，替代已废弃的 CRA |
| **Tailwind CSS** | 4+ | 原子化 CSS，快速构建一致 UI，无需写自定义样式 |
| **Axios** | 1.7+ | HTTP 客户端，拦截器支持完善 |
| **@hello-pangea/dnd** | 18+ | react-beautiful-dnd 维护分支，专为看板拖拽设计 |
| **Lucide React** | - | 轻量图标库，风格统一 |
| **date-fns** | 4+ | 日期处理工具，轻量且模块化 |

### 2.3 AI 集成

| 技术 | 选型理由 |
|------|----------|
| **OpenAI SDK** | 支持 GPT 系列模型，API 稳定 |
| **Anthropic SDK** | 支持 Claude 系列模型，长文本处理优秀 |
| **可配置提供商架构** | 策略模式 + 工厂模式，运行时可切换 |

### 2.4 基础设施

| 技术 | 选型理由 |
|------|----------|
| **Docker + Docker Compose** | 容器化部署，一键启动前后端 |
| **Git** | 版本控制，清晰的提交历史 |

---

## 三、系统架构

### 3.1 整体架构

```
┌─────────────────────────────────────────────────┐
│                   用户浏览器                      │
│         React + TypeScript + Tailwind            │
└────────────────────┬────────────────────────────┘
                     │ HTTP / REST API
                     ▼
┌─────────────────────────────────────────────────┐
│              FastAPI 后端服务                     │
│  ┌───────────┐ ┌───────────┐ ┌───────────────┐  │
│  │ Task API  │ │ Deps API  │ │   AI API      │  │
│  └─────┬─────┘ └─────┬─────┘ └──────┬────────┘  │
│        │             │              │            │
│  ┌─────▼─────────────▼──────────────▼────────┐  │
│  │            Service Layer                   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐  │  │
│  │  │Task Svc  │ │Dep Svc   │ │ AI Svc    │  │  │
│  │  └──────────┘ └──────────┘ └───────────┘  │  │
│  │  ┌──────────┐                              │  │
│  │  │Cache Svc │                              │  │
│  │  └──────────┘                              │  │
│  └────────────────────────────────────────────┘  │
│        │                             │           │
│  ┌─────▼──────┐           ┌─────────▼────────┐  │
│  │  SQLite DB  │           │ AI Provider      │  │
│  │ (tasks.db)  │           │ ┌──────┐┌──────┐ │  │
│  └─────────────┘           │ │OpenAI││Anthr.│ │  │
│                            │ └──────┘└──────┘ │  │
│                            └──────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 3.2 项目目录结构

```
codingTest/
├── PROJECT.md                    # 本文档
├── README.md                     # 项目说明（英文，面向评审）
├── .gitignore
├── .env.example                  # 环境变量模板
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
│
├── backend/
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/
│   └── app/
│       ├── main.py               # FastAPI 应用入口
│       ├── config.py             # 配置管理
│       ├── database.py           # 数据库连接
│       ├── models/               # ORM 模型
│       │   ├── task.py
│       │   └── dependency.py
│       ├── schemas/              # Pydantic 数据模型
│       │   ├── task.py
│       │   ├── dependency.py
│       │   └── ai.py
│       ├── api/                  # API 路由
│       │   ├── router.py
│       │   ├── tasks.py
│       │   ├── dependencies.py
│       │   └── ai.py
│       ├── services/             # 业务逻辑
│       │   ├── task_service.py
│       │   ├── dependency_service.py
│       │   └── cache.py
│       ├── ai/                   # AI 模块
│       │   ├── provider.py       # 抽象基类
│       │   ├── openai_provider.py
│       │   ├── anthropic_provider.py
│       │   ├── factory.py
│       │   └── prompts.py
│       └── utils/
│           └── exceptions.py
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/                  # API 调用层
│       │   ├── client.ts
│       │   ├── tasks.ts
│       │   └── ai.ts
│       ├── types/                # TypeScript 类型
│       │   └── index.ts
│       ├── context/              # 状态管理
│       │   └── TaskContext.tsx
│       ├── hooks/                # 自定义 Hooks
│       │   ├── useTasks.ts
│       │   ├── useAI.ts
│       │   └── useDebounce.ts
│       ├── components/
│       │   ├── layout/
│       │   ├── tasks/
│       │   ├── filters/
│       │   ├── ai/
│       │   └── common/
│       └── utils/
│           ├── constants.ts
│           └── formatters.ts
│
└── tests/                        # 测试目录
    ├── backend/
    │   ├── conftest.py
    │   ├── test_tasks.py
    │   ├── test_dependencies.py
    │   └── test_ai.py
    └── frontend/
        └── (Vitest 测试文件)
```

---

## 四、数据库设计

### 4.1 tasks 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | 唯一标识 |
| `title` | VARCHAR(255) | NOT NULL | 任务标题 |
| `description` | TEXT | NULLABLE | 任务描述 |
| `status` | VARCHAR(20) | NOT NULL DEFAULT 'pending' | 状态：pending / in_progress / completed |
| `priority` | VARCHAR(10) | NOT NULL DEFAULT 'medium' | 优先级：low / medium / high |
| `tags` | TEXT | NULLABLE | JSON 字符串数组，如 `["工作","紧急"]` |
| `due_date` | DATETIME | NULLABLE | 截止时间（AI 可提取或手动设置） |
| `created_at` | DATETIME | NOT NULL DEFAULT NOW | 创建时间 |
| `updated_at` | DATETIME | NOT NULL DEFAULT NOW | 更新时间 |

**索引设计：**
- `(status, priority, created_at)` — 覆盖最常用的过滤 + 排序查询模式

### 4.2 task_dependencies 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | 唯一标识 |
| `task_id` | INTEGER | FOREIGN KEY → tasks(id) CASCADE | 被依赖的任务 |
| `depends_on_id` | INTEGER | FOREIGN KEY → tasks(id) CASCADE | 依赖的任务 |

**约束：**
- UNIQUE(`task_id`, `depends_on_id`) — 防止重复依赖
- 应用层检测循环依赖（DFS 遍历依赖图）

### 4.3 ai_settings 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PRIMARY KEY | 单行表 |
| `provider` | VARCHAR(20) | NOT NULL DEFAULT 'openai' | 当前 AI 提供商 |
| `api_key` | VARCHAR(255) | NULLABLE | API 密钥 |
| `updated_at` | DATETIME | NOT NULL | 最后更新时间 |

---

## 五、API 设计

### 5.1 任务 CRUD

| 方法 | 路径 | 说明 | 关键参数 |
|------|------|------|----------|
| `POST` | `/api/tasks` | 创建任务 | body: TaskCreate |
| `GET` | `/api/tasks` | 获取任务列表 | `status`, `priority`, `tags`, `search`, `sort_by`, `sort_order`, `page`, `page_size` |
| `GET` | `/api/tasks/{id}` | 获取单个任务 | — |
| `PUT` | `/api/tasks/{id}` | 更新任务 | body: TaskUpdate |
| `DELETE` | `/api/tasks/{id}` | 删除任务 | — |
| `PATCH` | `/api/tasks/{id}/status` | 快速更新状态 | body: `{"status": "..."}` |

### 5.2 任务依赖

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/tasks/{id}/dependencies` | 添加依赖关系 |
| `GET` | `/api/tasks/{id}/dependencies` | 获取直接依赖列表 |
| `DELETE` | `/api/tasks/{id}/dependencies/{dep_id}` | 删除依赖关系 |
| `GET` | `/api/tasks/{id}/dependency-tree` | 获取完整依赖树（递归） |
| `GET` | `/api/tasks/{id}/can-complete` | 检查是否可完成（依赖是否全部完成） |

### 5.3 AI 功能

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/ai/parse-task` | 自然语言解析为任务字段 |
| `POST` | `/api/ai/suggest-tags` | 智能标签推荐 |
| `POST` | `/api/ai/recommend-priority` | 优先级推荐 |
| `POST` | `/api/ai/breakdown-task` | 任务分解为子任务 |
| `POST` | `/api/ai/summarize-tasks` | 任务摘要生成 |
| `POST` | `/api/ai/detect-similar` | 相似任务检测 |
| `GET` | `/api/ai/settings` | 获取 AI 配置（密钥脱敏） |
| `PUT` | `/api/ai/settings` | 更新 AI 配置 |

### 5.4 系统

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/health` | 健康检查 |

---

## 六、前端设计

### 6.1 页面与视图

| 视图 | 说明 |
|------|------|
| **列表视图** | 表格形式展示任务，支持排序、分页 |
| **看板视图** | 三列（待办/进行中/已完成），支持拖拽切换状态 |
| **任务详情面板** | 侧边栏或弹窗，展示完整信息和操作 |
| **AI 设置弹窗** | 配置 AI 提供商和 API Key |

### 6.2 核心交互

| 交互 | 说明 |
|------|------|
| 拖拽改状态 | 看板视图中拖拽卡片到不同列 |
| 搜索过滤 | 实时搜索（防抖），按状态/优先级/标签过滤 |
| 快捷操作 | 一键完成、删除、编辑 |
| 自然语言输入 | 输入一段话，AI 解析后自动填充表单 |
| AI 标签推荐 | 编辑任务时自动推荐标签 |
| 任务分解 | 点击按钮将复杂任务拆分为子任务 |

### 6.3 状态管理

使用 React Context + useReducer 进行全局状态管理：

```
State {
  tasks: Task[]           // 任务列表
  filters: {              // 当前过滤条件
    status, priority, tags, search
  }
  viewMode: 'list' | 'kanban'
  loading: boolean
  error: string | null
  pagination: { page, pageSize, total }
}

Actions:
  SET_TASKS | ADD_TASK | UPDATE_TASK | DELETE_TASK
  SET_FILTERS | SET_VIEW_MODE | SET_LOADING | SET_ERROR
```

---

## 七、AI 模块设计

### 7.1 架构（策略模式 + 工厂模式）

```
AIProvider (抽象基类)
  ├── complete(system_prompt, user_prompt) -> str
  └── get_embeddings(text) -> list[float]

OpenAIProvider implements AIProvider   →  调用 GPT 系列 API
AnthropicProvider implements AIProvider →  调用 Claude 系列 API

AIFactory.get_provider() → 根据配置返回对应 Provider 实例
```

### 7.2 AI 功能详述

| 功能 | 输入 | 输出 | 实现方式 |
|------|------|------|----------|
| 自然语言解析 | 一段自然语言文本 | `{title, description, priority, tags, due_date}` | LLM 结构化提取 |
| 标签推荐 | 任务标题 + 描述 | 推荐标签数组 | LLM 生成 |
| 优先级推荐 | 任务详情 | `{priority, reason}` | LLM 判断 |
| 任务分解 | 复杂任务 | 子任务数组 `[{title, description}]` | LLM 拆分 |
| 任务摘要 | 任务列表 | 自然语言摘要文本 | LLM 总结 |
| 相似检测 | 目标任务 | 相似任务 ID 列表 + 相似度描述 | LLM 对比分析 |

### 7.3 Prompt 模板

每个功能使用独立的 Prompt 模板，统一管理在 `prompts.py` 中。所有 Prompt 要求 LLM 返回结构化 JSON，便于解析。

---

## 八、测试方案

### 8.1 测试策略概览

```
┌─────────────────────────────────────┐
│           端到端测试 (E2E)            │  ← 前后端联调完整流程
│  ┌─────────────────────────────┐    │
│  │       集成测试               │    │  ← API 级别测试
│  │  ┌─────────────────────┐    │    │
│  │  │     单元测试         │    │    │  ← 函数/组件级别
│  │  └─────────────────────┘    │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### 8.2 后端单元测试

#### 8.2.1 测试框架
- **pytest** — 测试运行器
- **httpx** — FastAPI TestClient 的异步 HTTP 客户端
- 测试数据库使用独立的 SQLite 内存数据库（`:memory:`），每个测试函数自动创建和销毁

#### 8.2.2 任务 CRUD 测试

| 测试用例 | 测试数据 | 预期结果 |
|----------|----------|----------|
| 创建任务 - 正常 | `{title: "完成项目报告", priority: "high"}` | 201, 返回含 id 的完整任务对象 |
| 创建任务 - 标题为空 | `{title: ""}` | 422, 验证错误 |
| 创建任务 - 标题超长 | `{title: "a"*300}` | 422, 验证错误 |
| 创建任务 - 无效状态 | `{title: "test", status: "invalid"}` | 422, 枚举验证错误 |
| 获取任务列表 - 空 | 无数据 | 200, `items: []`, `total: 0` |
| 获取任务列表 - 分页 | 25 条测试数据, `page=1, page_size=10` | 200, 返回 10 条, `total: 25`, `total_pages: 3` |
| 获取单个任务 | 已存在的 id | 200, 返回完整任务 |
| 获取不存在的任务 | `id=9999` | 404, 任务不存在 |
| 更新任务 | 修改 title 和 priority | 200, 返回更新后的数据 |
| 删除任务 | 已存在的 id | 204, 无返回体 |
| 删除不存在的任务 | `id=9999` | 404, 任务不存在 |

#### 8.2.3 过滤/排序/搜索测试

| 测试用例 | 测试数据 | 预期结果 |
|----------|----------|----------|
| 按状态过滤 | 3 条 pending + 2 条 completed, `status=pending` | 返回 3 条 |
| 按优先级过滤 | 1 high + 4 medium, `priority=high` | 返回 1 条 |
| 按标签过滤 | tags 含 `["工作"]` 和 `["生活"]`, `tags=工作` | 返回含"工作"标签的任务 |
| 多条件组合过滤 | `status=pending&priority=high` | 仅返回同时满足条件的任务 |
| 按创建时间排序 | 不同时间创建的任务, `sort_by=created_at&sort_order=desc` | 最新的排在最前 |
| 按优先级排序 | high/medium/low 各一条, `sort_by=priority&sort_order=desc` | high → medium → low |
| 模糊搜索 | title 含 "报告" 和 "会议", `search=报告` | 返回含"报告"的任务 |

#### 8.2.4 依赖关系测试

| 测试用例 | 测试数据 | 预期结果 |
|----------|----------|----------|
| 添加依赖 | 任务A 依赖任务B | 201, 依赖关系创建成功 |
| 添加重复依赖 | 已存在的依赖关系 | 409, 依赖已存在 |
| 循环依赖检测 | A→B→C, 尝试 C→A | 400, 检测到循环依赖 |
| 依赖未完成时完成任务 | A 依赖 B, B 未完成, 完成 A | 400, 依赖未全部完成 |
| 依赖全部完成后完成任务 | A 依赖 B, B 已完成, 完成 A | 200, 成功 |
| 获取依赖树 | A→B→C, 查询 A 的依赖树 | 返回树形结构 `{A: {B: {C: {}}}}` |
| 删除依赖 | 删除 A→B 依赖 | 204, 依赖删除成功 |
| 删除任务级联删除依赖 | 删除被依赖的任务B | B 的所有依赖关系自动删除 |

#### 8.2.5 缓存测试

| 测试用例 | 预期结果 |
|----------|----------|
| 首次查询缓存未命中 | 调用数据库查询，结果写入缓存 |
| 重复查询缓存命中 | 直接返回缓存数据，不调用数据库 |
| 创建任务后缓存失效 | 后续查询触发新的数据库查询 |
| 更新任务后缓存失效 | 同上 |
| 缓存过期（TTL） | 等待过期后重新查询数据库 |

#### 8.2.6 AI 模块测试

| 测试用例 | 测试方式 | 预期结果 |
|----------|----------|----------|
| 自然语言解析 | Mock AI 响应，输入"明天下午3点提醒我买菜" | 返回 `{title: "买菜", due_date: 明天15:00, ...}` |
| 标签推荐 | Mock AI 响应，输入任务标题"季度报告" | 返回 `["工作", "报告", "文档"]` |
| 优先级推荐 | Mock AI 响应 | 返回 `{priority: "high", reason: "..."}` |
| 任务分解 | Mock AI 响应 | 返回子任务数组 |
| AI 设置读取 | 存入配置后读取 | API Key 脱敏显示（仅后4位） |
| AI 设置更新 | 更新 provider 为 anthropic | 配置更新成功 |
| AI 不可用时的降级 | 不配置 API Key 时调用 AI 功能 | 返回友好错误提示 |

### 8.3 前端测试

#### 8.3.1 测试框架
- **Vitest** — 单元测试运行器
- **React Testing Library** — 组件测试

#### 8.3.2 组件测试

| 测试用例 | 测试方式 | 预期结果 |
|----------|----------|----------|
| TaskCard 渲染 | 渲染 high priority 的任务卡片 | 显示红色优先级标识 |
| TaskForm 提交 | 填写表单并提交 | 调用 onCreate 回调，传入正确数据 |
| TaskForm 验证 | 不填标题直接提交 | 显示"标题不能为空"错误 |
| 搜索防抖 | 快速输入 "报告" | 仅在 300ms 后触发搜索 |
| 过滤器交互 | 点击 "high" 优先级过滤器 | 过滤条件更新，任务列表刷新 |
| 看板拖拽 | 模拟从 pending 列拖到 completed 列 | 调用状态更新 API |
| 模态框开关 | 点击创建按钮 | 弹窗出现；点击关闭按钮弹窗消失 |
| AI 设置弹窗 | 选择 provider，输入 key，保存 | 调用 API 更新设置 |

#### 8.3.3 状态管理测试

| 测试用例 | 预期结果 |
|----------|----------|
| SET_TASKS | tasks 正确更新 |
| ADD_TASK | 新任务添加到列表 |
| UPDATE_TASK | 指定任务更新 |
| DELETE_TASK | 指定任务移除 |
| SET_FILTERS | 过滤条件更新 |
| SET_VIEW_MODE | 视图模式切换 |

### 8.4 端到端测试（E2E）

#### 8.4.1 测试框架
- 手动测试方案（编写详细测试步骤，用于演示验证）
- 可选：Playwright 自动化 E2E 测试

#### 8.4.2 测试数据准备

```json
{
  "tasks": [
    {
      "title": "完成季度报告",
      "description": "编写 Q4 季度项目进展报告，包含数据分析和团队总结",
      "status": "in_progress",
      "priority": "high",
      "tags": ["工作", "报告"],
      "due_date": "2026-04-25T18:00:00"
    },
    {
      "title": "团队周会",
      "description": "每周一上午10点，讨论项目进展和问题",
      "status": "pending",
      "priority": "medium",
      "tags": ["工作", "会议"],
      "due_date": "2026-04-21T10:00:00"
    },
    {
      "title": "购买生日礼物",
      "description": "给妈妈挑选生日礼物",
      "status": "pending",
      "priority": "medium",
      "tags": ["生活", "购物"],
      "due_date": "2026-04-20T00:00:00"
    },
    {
      "title": "健身房锻炼",
      "description": "每周三次有氧运动",
      "status": "pending",
      "priority": "low",
      "tags": ["生活", "健康"],
      "due_date": null
    },
    {
      "title": "代码审查",
      "description": "审查前端重构的 Pull Request",
      "status": "completed",
      "priority": "high",
      "tags": ["工作", "开发"],
      "due_date": "2026-04-17T17:00:00"
    },
    {
      "title": "学习 TypeScript",
      "description": "完成 TypeScript 进阶教程第3-5章",
      "status": "in_progress",
      "priority": "medium",
      "tags": ["学习", "编程"],
      "due_date": "2026-04-30T00:00:00"
    },
    {
      "title": "修复登录页面 Bug",
      "description": "用户反馈在 Safari 浏览器上登录按钮点击无响应",
      "status": "pending",
      "priority": "high",
      "tags": ["工作", "开发", "Bug"],
      "due_date": "2026-04-19T12:00:00"
    },
    {
      "title": "准备技术分享",
      "description": "准备下周技术分享会的内容：微服务架构设计",
      "status": "pending",
      "priority": "low",
      "tags": ["工作", "分享"],
      "due_date": "2026-04-24T00:00:00"
    }
  ],
  "dependencies": [
    {"task": "完成季度报告", "depends_on": "团队周会"},
    {"task": "完成季度报告", "depends_on": "代码审查"},
    {"task": "准备技术分享", "depends_on": "学习 TypeScript"}
  ],
  "ai_test_cases": [
    {
      "input": "明天下午3点提醒我去超市买菜",
      "expected": {
        "title": "去超市买菜",
        "due_date": "次日15:00",
        "priority": "medium"
      }
    },
    {
      "input": "紧急！周五之前必须完成产品演示 PPT",
      "expected": {
        "title": "完成产品演示PPT",
        "priority": "high",
        "due_date": "本周五"
      }
    },
    {
      "input": "周末有空的话整理一下书架",
      "expected": {
        "title": "整理书架",
        "priority": "low"
      }
    }
  ]
}
```

#### 8.4.3 端到端测试场景

**场景 1：完整任务生命周期**

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 打开应用首页 | 显示空看板（三列：待办/进行中/已完成） |
| 2 | 点击「新建任务」按钮 | 弹出创建表单 |
| 3 | 填写标题"完成季度报告"，选择优先级"高"，添加标签"工作" | 表单正常填写 |
| 4 | 点击提交 | 弹窗关闭，待办列出现新卡片，显示红色高优先级标识 |
| 5 | 拖拽卡片到「进行中」列 | 卡片移动到进行中列，状态更新为 in_progress |
| 6 | 点击卡片查看详情 | 侧边栏显示完整任务信息 |
| 7 | 点击编辑按钮 | 详情切换为编辑模式 |
| 8 | 添加描述"包含数据分析"，保存 | 描述更新成功 |
| 9 | 拖拽到「已完成」列 | 卡片移动到已完成列 |
| 10 | 确认任务列表接口返回数据 | API 返回更新后的数据 |

**场景 2：依赖关系管理**

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 创建任务 A "完成报告" | 任务创建成功 |
| 2 | 创建任务 B "收集数据" | 任务创建成功 |
| 3 | 创建任务 C "撰写摘要" | 任务创建成功 |
| 4 | 设置 A 依赖 B | 依赖关系创建成功 |
| 5 | 设置 A 依赖 C | 依赖关系创建成功 |
| 6 | 尝试将 A 标记为完成 | 提示"依赖任务未全部完成" |
| 7 | 将 B 标记为完成 | B 状态更新为 completed |
| 8 | 尝试将 A 标记为完成 | 仍提示未完成（C 未完成） |
| 9 | 将 C 标记为完成 | C 状态更新为 completed |
| 10 | 将 A 标记为完成 | 成功，所有依赖已完成 |
| 11 | 查看 A 的依赖树 | 显示树形结构：A → [B(已完成), C(已完成)] |

**场景 3：AI 自然语言创建任务**

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 打开 AI 设置，配置 OpenAI API Key | 保存成功 |
| 2 | 在侧边栏自然语言输入框输入"明天下午3点提醒我去超市买菜" | 加载动画 |
| 3 | AI 解析完成 | 创建表单弹出，标题预填"去超市买菜"，时间预填明天15:00 |
| 4 | 确认并提交 | 任务创建成功 |
| 5 | 在任务详情中点击"AI 推荐标签" | 显示推荐标签列表 |
| 6 | 点击"AI 任务分解" | 显示分解后的子任务列表 |

**场景 4：过滤/排序/搜索**

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 导入测试数据（8条任务） | 看板显示所有任务 |
| 2 | 在搜索框输入"报告" | 仅显示标题/描述含"报告"的任务 |
| 3 | 切换到列表视图 | 表格展示搜索结果 |
| 4 | 点击优先级过滤器，选择"high" | 仅显示高优先级任务 |
| 5 | 按创建时间降序排序 | 最新创建的任务排最前 |
| 6 | 清除所有过滤器 | 恢复显示全部任务 |
| 7 | 翻到第2页（如有分页） | 显示第2页数据 |

**场景 5：Docker 部署验证**

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 执行 `docker-compose up --build` | 前后端容器启动成功 |
| 2 | 访问 `http://localhost:3000` | 前端页面正常加载 |
| 3 | 访问 `http://localhost:8000/docs` | FastAPI Swagger 文档页面正常 |
| 4 | 在前端创建任务 | 任务数据通过 API 存入 SQLite |
| 5 | 重启后端容器 | 数据持久化，任务仍存在 |
| 6 | 执行 `docker-compose down` | 容器正常停止 |

---

## 九、关键技术决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 同步 vs 异步 SQLAlchemy | 同步 | SQLite 不支持真正的并发写入，异步增加复杂度无实际收益 |
| 标签存储方式 | JSON 字符串列 | 避免 JOIN 查询，SQLite 原生支持 json_each() 函数 |
| 状态管理 | Context + useReducer | 内置方案，无额外依赖，适合本项目复杂度 |
| 拖拽库 | @hello-pangea/dnd | react-beautiful-dnd 维护分支，API 简洁，专为看板设计 |
| 相似任务检测 | LLM 直接对比 | 避免引入向量数据库，适合中小规模任务 |
| 缓存方案 | 内存 TTL 缓存 | SQLite 查询本身很快，缓存用于演示设计模式 |
| 构建工具 | Vite | CRA 已废弃，Vite 是 React 社区标准 |
| API Key 存储 | SQLite 表 | 支持运行时切换，无需重启服务 |

---

## 十、实施计划

| 阶段 | 内容 | 预计时间 |
|------|------|----------|
| 阶段 1 | 项目骨架搭建（Git、目录结构、配置文件） | 15 分钟 |
| 阶段 2 | 后端核心（CRUD + 过滤/排序/分页 + 缓存） | 45 分钟 |
| 阶段 3 | 后端进阶（依赖关系 + AI 模块 + 所有 AI 端点） | 45 分钟 |
| 阶段 4 | 前端核心（布局 + 列表/看板 + 拖拽 + 过滤器） | 60 分钟 |
| 阶段 5 | 前端 AI 功能（NL 创建 + 设置弹窗 + 标签/分解/摘要） | 30 分钟 |
| 阶段 6 | Docker + README + 测试 + 收尾 | 25 分钟 |
| **总计** | | **约 3.5 小时** |
