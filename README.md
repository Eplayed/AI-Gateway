# AI Gateway

多模态 AI Agent 平台，基于阿里云百炼（DashScope）构建。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org)

## 项目架构

```
AI-Gateway/
├── apps/                      # 应用层
│   ├── api-gateway/           # API Gateway 服务
│   ├── agent-orchestrator/    # Agent 编排服务
│   └── prompt-manager/        # Prompt 管理服务
├── packages/                  # 共享包
│   ├── core/                  # 核心领域模型
│   ├── model-adapter/         # DashScope 适配器
│   ├── router/                # 模型路由策略
│   ├── logger/                # 统一日志
│   ├── cache/                 # 缓存抽象
│   └── queue/                 # 消息队列抽象
├── infrastructure/            # 基础设施
│   └── database/              # 数据库迁移
└── docs/                      # 文档
    └── openapi.yaml           # API 文档
```

## 核心功能

### 1. Prompt 工程化管理
- 数据库存储，版本控制
- A/B 测试支持
- Handlebars 模板引擎
- 热更新，无需重启服务

### 2. 智能模型路由
- 成本优先策略
- 延迟优先策略（预留）
- 质量优先策略（预留）
- 混合策略（预留）

### 3. 多模态支持
- 文本生成 / 对话
- 图片理解
- 语音处理（预留）

### 4. Agent 编排
- Agent 注册表
- 单 Agent 执行
- 状态管理
- 调用历史记录

### 5. 成本管控
- Token 精确计费
- 成本预估
- 日度 / 月度预算
- 超额预警

## 快速开始

### 前置要求

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker & Docker Compose

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动基础设施

```bash
docker-compose up -d
```

这将启动：
- PostgreSQL (port 5432)
- Redis (port 6379)
- RabbitMQ (port 5672/15672)

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入 DASHSCOPE_API_KEY
```

**重要**：必须配置 `DASHSCOPE_API_KEY`（阿里云百炼 API Key）

### 4. 初始化数据库

```bash
pnpm db:push
pnpm db:seed
```

### 5. 运行开发服务

```bash
# 启动 API Gateway
pnpm dev:gateway

# 启动 Agent Orchestrator
pnpm dev:orchestrator

# 启动 Prompt Manager
pnpm dev:prompt-manager
```

## API 接口

### Prompt 管理

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/v1/prompts` | 创建 Prompt |
| GET | `/api/v1/prompts/:id` | 获取 Prompt 详情 |
| GET | `/api/v1/prompts` | 列表查询 |
| PUT | `/api/v1/prompts/:id` | 更新 Prompt |
| DELETE | `/api/v1/prompts/:id` | 删除 Prompt |
| GET | `/api/v1/prompts/:id/versions` | 版本历史 |
| POST | `/api/v1/prompts/:id/rollback/:versionId` | 版本回滚 |
| POST | `/api/v1/prompts/:id/render` | 渲染 Prompt |

### AI 推理

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/v1/inference/text` | 文本生成 |
| POST | `/api/v1/inference/chat` | 对话接口 |
| POST | `/api/v1/inference/image-analysis` | 图片理解 |
| POST | `/api/v1/inference/estimate-cost` | 成本预估 |

### 成本与用量

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/v1/usage/token` | Token 使用统计 |
| GET | `/api/v1/usage/cost` | 成本统计 |

### Agent

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/v1/agents` | 创建 Agent |
| GET | `/api/v1/agents` | Agent 列表 |
| GET | `/api/v1/agents/:agentId` | Agent 详情 |
| DELETE | `/api/v1/agents/:agentId` | 删除 Agent |
| POST | `/api/v1/agents/:agentId/invoke` | 调用 Agent |

完整 API 文档请参考 [docs/openapi.yaml](docs/openapi.yaml)

## 使用示例

### 对话

```bash
curl -X POST http://localhost:3000/api/v1/inference/chat \
  -H "Authorization: Bearer sk-test-xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen-turbo",
    "messages": [
      { "role": "user", "content": "你好" }
    ]
  }'
```

### 创建 Prompt

```bash
curl -X POST http://localhost:3002/api/v1/prompts \
  -H "Authorization: Bearer sk-test-xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "对话助手",
    "category": "chat",
    "template": "你是 {{role}}，请回答：{{question}}",
    "tags": ["chat", "assistant"]
  }'
```

### 调用 Agent

```bash
curl -X POST http://localhost:3001/api/v1/agents/{agentId}/invoke \
  -H "Authorization: Bearer sk-test-xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "请用 Python 写一个快速排序算法"
  }'
```

## 开发指南

### 代码规范

```bash
# Lint 检查
pnpm lint

# Lint 自动修复
pnpm lint:fix

# 类型检查
pnpm type-check
```

### 构建

```bash
# 构建所有应用
pnpm build

# 构建特定应用
pnpm --filter api-gateway build
```

### 测试

```bash
# 运行所有测试
pnpm test

# 单元测试
pnpm test:unit

# 集成测试
pnpm test:integration
```

## 部署

详细部署指南请参考 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

### 快速部署（Docker）

```bash
# 加载环境变量
export $(cat .env.production | xargs)

# 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

### PM2 部署

```bash
# 构建项目
pnpm build

# 启动服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status
```

## 技术栈

- **后端框架**: Hono (轻量级 Web 框架)
- **语言**: TypeScript + Node.js
- **模型提供方**: 阿里云百炼 (DashScope)
- **数据库**: PostgreSQL (via Prisma)
- **缓存**: Redis
- **消息队列**: RabbitMQ
- **日志**: Pino
- **包管理**: pnpm (workspace)
- **测试**: Vitest
- **API 文档**: OpenAPI 3.0

## 设计原则

1. **Prompt 工程化**：所有 Prompt 数据库管理，版本控制
2. **模型路由可插拔**：支持基于成本/延迟/质量的动态路由
3. **多模态统一抽象**：文本/图片/语音统一接口
4. **Agent 编排解耦**：Agent 间通过消息总线通信
5. **成本管控前置**：请求前预估 Token 成本

## 项目状态

### Phase 1 - MVP（已完成）
- [x] 基础工程搭建
- [x] 数据库设计
- [x] DashScope 适配器
- [x] Prompt 管理模块
- [x] API Gateway 核心
- [x] Agent 编排基础
- [x] 测试和文档

### Phase 2 - 扩展功能（待实现）
- [ ] Workflow 引擎
- [ ] 多 Agent 协作
- [ ] A/B 测试系统
- [ ] 高级路由策略
- [ ] 实时流式输出（SSE）
- [ ] 监控和告警

### Phase 3 - 优化和增强（待实现）
- [ ] 性能优化
- [ ] 缓存策略优化
- [ ] 安全增强（API Key 轮换、IP 白名单）
- [ ] 多租户支持
- [ ] 国际化支持

## 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## License

MIT License - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- 项目主页: [GitHub Repository]
- 问题反馈: [Issues]
- 文档: [docs/openapi.yaml](docs/openapi.yaml)
