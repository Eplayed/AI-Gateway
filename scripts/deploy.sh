#!/bin/bash

# 部署脚本

set -e

# 环境变量
ENV=${1:-development}
echo "Deploying to environment: $ENV"

# 构建
echo "Building project..."
pnpm install
pnpm build

# 停止现有服务
echo "Stopping existing services..."
if [ "$ENV" = "production" ]; then
  docker-compose down
fi

# 启动服务
if [ "$ENV" = "production" ]; then
  echo "Starting production services..."
  docker-compose up -d
else
  echo "Starting development services..."
  docker-compose up -d
fi

echo "Deployment completed!"
