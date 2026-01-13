#!/bin/bash

# MCP Gateway Deployment Script using uv

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying MCP Gateway with uv${NC}"

# Check if docker and docker-compose are available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not available${NC}"
    exit 1
fi

# Build and deploy with docker compose
echo -e "${YELLOW}🐳 Building and deploying containers...${NC}"

if docker compose version &> /dev/null; then
    docker compose up -d --build
else
    docker-compose up -d --build
fi

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 10

# Check service health
echo -e "${GREEN}🔍 Checking service health...${NC}"

# Check backend health
if curl -f http://localhost:8000/api/health &> /dev/null; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    exit 1
fi

# Check frontend health
if curl -f http://localhost:3000 &> /dev/null; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 MCP Gateway deployed successfully!${NC}"
echo -e "${BLUE}Access URLs:${NC}"
echo -e "  ${YELLOW}Frontend:${NC} http://localhost:3000"
echo -e "  ${YELLOW}Backend API:${NC} http://localhost:8000"
echo -e "  ${YELLOW}API Docs:${NC} http://localhost:8000/docs"
echo -e ""
echo -e "${BLUE}To view logs:${NC}"
echo -e "  docker compose logs -f"