# AI Gateway 部署指南

## 目录
- [开发环境](#开发环境)
- [生产环境](#生产环境)
- [Docker 部署](#docker-部署)
- [Kubernetes 部署](#kubernetes-部署)
- [监控与日志](#监控与日志)
- [故障排查](#故障排查)

---

## 开发环境

### 前置要求
- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker & Docker Compose
- PostgreSQL 16+
- Redis 7+
- RabbitMQ 3+

### 快速启动

```bash
# 1. 克隆项目
git clone <repository-url>
cd AI-Gateway

# 2. 安装依赖
pnpm install

# 3. 启动基础设施
docker-compose up -d

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 DASHSCOPE_API_KEY

# 5. 初始化数据库
pnpm db:push
pnpm db:seed

# 6. 启动服务
# 终端 1 - API Gateway
pnpm dev:gateway

# 终端 2 - Prompt Manager
pnpm dev:prompt-manager

# 终端 3 - Agent Orchestrator
pnpm dev:orchestrator
```

---

## 生产环境

### 环境变量配置

创建生产环境配置文件 `.env.production`:

```bash
# Application
NODE_ENV=production

# DashScope
DASHSCOPE_API_KEY=<your-production-api-key>
DASHSCOPE_ENDPOINT=dashscope.aliyuncs.com
DASHSCOPE_REGION=cn-beijing

# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Redis
REDIS_URL=redis://:password@host:6379/0

# RabbitMQ
RABBITMQ_URL=amqp://user:password@host:5672

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
```

### 使用 PM2 部署

```bash
# 安装 PM2
pnpm add -g pm2

# 构建项目
pnpm build

# 启动服务
pm2 start apps/api-gateway/dist/index.js --name api-gateway
pm2 start apps/prompt-manager/dist/index.js --name prompt-manager
pm2 start apps/agent-orchestrator/dist/index.js --name agent-orchestrator

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启服务
pm2 restart all

# 停止服务
pm2 stop all
```

### PM2 配置文件 (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: './apps/api-gateway/dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/api-gateway-error.log',
      out_file: './logs/api-gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'prompt-manager',
      script: './apps/prompt-manager/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
    },
    {
      name: 'agent-orchestrator',
      script: './apps/agent-orchestrator/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
```

使用 PM2 配置文件：

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Docker 部署

### 构建镜像

```bash
# 构建所有服务
docker build -t ai-gateway:latest .

# 构建特定服务
docker build --target api-gateway -t ai-gateway:api-gateway .
docker build --target prompt-manager -t ai-gateway:prompt-manager .
docker build --target agent-orchestrator -t ai-gateway:agent-orchestrator .
```

### Docker Compose 生产环境

创建 `docker-compose.prod.yml`:

```yaml
version: '3.9'

services:
  api-gateway:
    image: ai-gateway:api-gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - DASHSCOPE_API_KEY=${DASHSCOPE_API_KEY}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  prompt-manager:
    image: ai-gateway:prompt-manager
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  agent-orchestrator:
    image: ai-gateway:agent-orchestrator
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - RABBITMQ_URL=${RABBITMQ_URL}
      - DASHSCOPE_API_KEY=${DASHSCOPE_API_KEY}
    depends_on:
      - postgres
      - redis
      - rabbitmq
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ai_gateway
      POSTGRES_USER: ai_gateway_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  rabbitmq:
    image: rabbitmq:3-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
```

启动生产环境：

```bash
# 加载环境变量
export $(cat .env.production | xargs)

# 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

---

## Kubernetes 部署

### Namespace

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ai-gateway
```

### ConfigMap

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ai-gateway-config
  namespace: ai-gateway
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
```

### Secrets

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ai-gateway-secrets
  namespace: ai-gateway
type: Opaque
data:
  DASHSCOPE_API_KEY: <base64-encoded-key>
  DATABASE_URL: <base64-encoded-url>
  REDIS_URL: <base64-encoded-url>
  RABBITMQ_URL: <base64-encoded-url>
```

### API Gateway Deployment

```yaml
# api-gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: ai-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: ai-gateway:api-gateway
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: ai-gateway-config
        - secretRef:
            name: ai-gateway-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: ai-gateway
spec:
  selector:
    app: api-gateway
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 部署到 Kubernetes

```bash
# 应用配置
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml
kubectl apply -f api-gateway-deployment.yaml

# 查看状态
kubectl get pods -n ai-gateway
kubectl get services -n ai-gateway

# 查看日志
kubectl logs -f deployment/api-gateway -n ai-gateway
```

---

## 监控与日志

### 日志配置

日志使用 Pino 格式，推荐使用以下工具查看：

```bash
# 使用 pino-pretty 查看日志
pnpm exec pino-pretty < logs/api-gateway-out.log

# 使用 jq 过滤
tail -f logs/api-gateway-out.log | jq 'select(.level >= 30)'
```

### Prometheus 监控（预留）

建议集成 Prometheus 进行监控：

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'ai-gateway'
    static_configs:
      - targets: ['api-gateway:3000']
    metrics_path: /metrics
```

---

## 故障排查

### 常见问题

#### 1. 数据库连接失败

```bash
# 检查数据库状态
docker ps | grep postgres

# 查看数据库日志
docker logs ai-gateway-postgres

# 测试连接
psql -h localhost -U ai_gateway_user -d ai_gateway
```

#### 2. Redis 连接失败

```bash
# 检查 Redis 状态
redis-cli -h localhost -p 6379 ping

# 查看 Redis 日志
docker logs ai-gateway-redis
```

#### 3. 服务启动失败

```bash
# 查看服务日志
pm2 logs api-gateway

# 查看 Docker 日志
docker logs <container-id>

# 检查端口占用
lsof -i :3000
```

#### 4. DashScope API 调用失败

```bash
# 检查 API Key
echo $DASHSCOPE_API_KEY

# 测试 API 连接
curl -X POST https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation \
  -H "Authorization: Bearer $DASHSCOPE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen-turbo", "input": {"messages": [{"role": "user", "content": "hello"}]}}'
```

---

## 备份与恢复

### 数据库备份

```bash
# 备份
pg_dump -h localhost -U ai_gateway_user ai_gateway > backup.sql

# 恢复
psql -h localhost -U ai_gateway_user ai_gateway < backup.sql
```

### Redis 备份

```bash
# 备份
redis-cli -h localhost SAVE

# 恢复
cp dump.rdb /var/lib/redis/
```
