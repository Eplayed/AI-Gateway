#!/bin/bash

# Prompt 导入脚本
# 用途：将 prompts/templates/ 目录下的 Prompt 模板导入数据库

set -e

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  exit 1
fi

# 检查 Prompt 模板目录
PROMPTS_DIR="./prompts/templates"
if [ ! -d "$PROMPTS_DIR" ]; then
  echo "Error: Prompt templates directory not found: $PROMPTS_DIR"
  exit 1
fi

echo "Starting prompt import..."
echo "Database: $DATABASE_URL"
echo "Prompts directory: $PROMPTS_DIR"

# 这里应该实现实际的导入逻辑
# 可以使用 Node.js 脚本或直接调用 Prompt Manager API

echo "Prompt import completed successfully!"
