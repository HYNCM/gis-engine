#!/bin/bash
# Git pre-push hook — 推送前自动验证
#
# 检查项：
#   1. Schema 同步状态
#   2. TypeScript 编译
#   3. 相关测试
#
# 安装：将此文件复制到 .git/hooks/pre-push

set -e

echo "🔍 GIS Engine pre-push validation..."

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

# 检查是否安装了 pnpm
if ! command -v pnpm &> /dev/null; then
  echo "⚠️  pnpm not found, skipping pre-push checks"
  exit 0
fi

# 快速 schema 构建检查
echo "  → Checking schema build..."
if ! pnpm build:schema > /dev/null 2>&1; then
  echo "❌ Schema build failed. Run 'pnpm build:schema' to fix."
  exit 1
fi

# TypeScript 检查
echo "  → Running type check..."
if ! pnpm check > /dev/null 2>&1; then
  echo "❌ Type check failed. Run 'pnpm check' to view errors."
  exit 1
fi

# 快速 smoke 测试
echo "  → Running smoke tests..."
if ! pnpm test:snapshot:smoke > /dev/null 2>&1; then
  echo "❌ Smoke tests failed."
  exit 1
fi

echo "✅ Pre-push validation passed"
exit 0
