#!/bin/bash

# ============================================
# 部署脚本 - 支持本地和 GitHub CI
# 使用方法：
#   本地: ./deploy.sh
#   CI:   由 GitHub Actions 自动调用
# ============================================

set -e  # 遇到错误立即退出

# ============================================
# 1. 配置项（优先级：环境变量 > 默认值）
# ============================================

# 服务器配置
DEPLOY_HOST=${DEPLOY_HOST:-8.152.214.136}
DEPLOY_USER=${DEPLOY_USER:-root}
DEPLOY_REMOTE_DIR=${DEPLOY_REMOTE_DIR:-/var/www/html/dist}
DEPLOY_SSH_KEY=${DEPLOY_SSH_KEY:-~/.ssh/id_ed25519}

# 前端环境变量（构建时使用）
VITE_ENV=${VITE_ENV:-test}
VITE_API_BASE=${VITE_API_BASE:-/api}
VITE_SERVER=${VITE_SERVER:-http://8.152.214.136:8000}

# ============================================
# 2. 颜色输出（美化日志）
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================
# 3. 检查依赖
# ============================================

log_info "检查依赖..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    log_error "npm 未安装，请先安装 npm"
    exit 1
fi

# 检查 SSH 密钥文件（仅在本地模式，CI 中密钥由环境变量提供）
if [ -z "$GITHUB_ACTIONS" ] && [ ! -f "${DEPLOY_SSH_KEY/#\~/$HOME}" ]; then
    log_error "SSH 密钥文件不存在: $DEPLOY_SSH_KEY"
    log_info "请确认密钥路径正确，或设置 DEPLOY_SSH_KEY 环境变量"
    exit 1
fi

log_success "依赖检查通过"

# ============================================
# 4. 构建项目
# ============================================

log_info "开始构建项目..."
log_info "环境配置:"
echo "  VITE_ENV = $VITE_ENV"
echo "  VITE_API_BASE = $VITE_API_BASE"
echo "  VITE_SERVER = $VITE_SERVER"

# 安装依赖（如果 node_modules 不存在）
if [ ! -d "node_modules" ]; then
    log_info "安装依赖..."
    npm install
fi

# 构建
export VITE_ENV="$VITE_ENV"
export VITE_API_BASE="$VITE_API_BASE"
export VITE_SERVER="$VITE_SERVER"

npm run build

# 检查构建产物
if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
    log_error "构建失败：dist 目录为空或不存在"
    exit 1
fi

log_success "构建完成"

# ============================================
# 5. 部署到服务器
# ============================================

log_info "开始部署到服务器..."
log_info "目标: $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_REMOTE_DIR"

# 判断是否在 GitHub Actions 环境中
if [ -n "$GITHUB_ACTIONS" ]; then
    log_info "检测到 GitHub Actions 环境，使用环境变量中的密钥"
    
    # GitHub Actions 中，密钥通过环境变量传入
    if [ -z "$DEPLOY_SSH_KEY" ]; then
        log_error "DEPLOY_SSH_KEY 环境变量未设置"
        exit 1
    fi
    
    # 创建临时 SSH 密钥文件
    SSH_KEY_FILE="$HOME/.ssh/deploy_key"
    mkdir -p "$HOME/.ssh"
    echo "$DEPLOY_SSH_KEY" > "$SSH_KEY_FILE"
    chmod 600 "$SSH_KEY_FILE"
    chmod 700 "$HOME/.ssh"
    
    SSH_CMD="ssh -i $SSH_KEY_FILE -o StrictHostKeyChecking=no -o ConnectTimeout=10"
    SCP_CMD="scp -i $SSH_KEY_FILE -o StrictHostKeyChecking=no -o ConnectTimeout=10"
    
else
    log_info "本地环境，使用密钥文件: $DEPLOY_SSH_KEY"
    
    # 展开 ~ 路径
    SSH_KEY_PATH="${DEPLOY_SSH_KEY/#\~/$HOME}"
    
    if [ ! -f "$SSH_KEY_PATH" ]; then
        log_error "SSH 密钥文件不存在: $SSH_KEY_PATH"
        exit 1
    fi
    
    SSH_CMD="ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no -o ConnectTimeout=10"
    SCP_CMD="scp -i $SSH_KEY_PATH -o StrictHostKeyChecking=no -o ConnectTimeout=10"
fi

# 测试 SSH 连接
log_info "测试 SSH 连接..."
if ! $SSH_CMD "$DEPLOY_USER@$DEPLOY_HOST" "echo 'Connection successful'" > /dev/null 2>&1; then
    log_error "SSH 连接失败，请检查网络、IP 和密钥配置"
    exit 1
fi
log_success "SSH 连接成功"

# 清空远程目录
log_info "清空远程目录: $DEPLOY_REMOTE_DIR"
if ! $SSH_CMD "$DEPLOY_USER@$DEPLOY_HOST" "rm -rf $DEPLOY_REMOTE_DIR/*"; then
    log_warning "清空目录失败（可能目录不存在），继续上传..."
fi

# 创建远程目录（如果不存在）
$SSH_CMD "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p $DEPLOY_REMOTE_DIR" > /dev/null 2>&1

# 上传文件
log_info "上传文件..."
if ! $SCP_CMD -r ./dist/* "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_REMOTE_DIR/"; then
    log_error "文件上传失败"
    exit 1
fi

# ============================================
# 6. 验证部署
# ============================================

log_info "验证部署..."

# 检查远程目录文件数量
REMOTE_COUNT=$($SSH_CMD "$DEPLOY_USER@$DEPLOY_HOST" "find $DEPLOY_REMOTE_DIR -type f | wc -l" 2>/dev/null || echo "0")
LOCAL_COUNT=$(find ./dist -type f | wc -l)

log_info "本地文件数: $LOCAL_COUNT"
log_info "远程文件数: $REMOTE_COUNT"

if [ "$REMOTE_COUNT" -eq "$LOCAL_COUNT" ]; then
    log_success "文件数量一致，部署成功！"
else
    log_warning "文件数量不一致 (本地: $LOCAL_COUNT, 远程: $REMOTE_COUNT)，请检查"
fi

# ============================================
# 7. 清理（仅在 CI 环境）
# ============================================

if [ -n "$GITHUB_ACTIONS" ] && [ -f "$SSH_KEY_FILE" ]; then
    log_info "清理临时 SSH 密钥..."
    rm -f "$SSH_KEY_FILE"
fi

# ============================================
# 完成
# ============================================

echo ""
log_success "========================================"
log_success "部署完成！"
log_success "========================================"
log_info "访问地址: http://$DEPLOY_HOST"
echo ""