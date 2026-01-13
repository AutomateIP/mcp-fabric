#!/bin/bash

# MCP Gateway Development Script using uv

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 MCP Gateway Development Environment${NC}"

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo -e "${RED}❌ uv is not installed. Installing uv...${NC}"
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
fi

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
    uv venv
fi

# Activate virtual environment
echo -e "${BLUE}🔧 Activating virtual environment...${NC}"
source .venv/bin/activate

# Install dependencies
echo -e "${GREEN}📥 Installing dependencies...${NC}"
uv pip install -e .
uv pip install -e ".[dev]"

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
alembic upgrade head

echo -e "${GREEN}✅ Development environment ready!${NC}"
echo -e "${BLUE}Available commands:${NC}"
echo -e "  ${YELLOW}uv run uvicorn app.main:app --reload${NC} - Start development server"
echo -e "  ${YELLOW}uv run pytest${NC} - Run tests"
echo -e "  ${YELLOW}uv run ruff check .${NC} - Run linter"
echo -e "  ${YELLOW}uv run black .${NC} - Format code"
echo -e "  ${YELLOW}uv run mypy app/${NC} - Run type checker"