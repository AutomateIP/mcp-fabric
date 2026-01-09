# Multi-stage build for MCP Gateway Frontend
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY mcp-gateway-ui/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY mcp-gateway-ui/ ./

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
