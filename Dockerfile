# Multi-stage build for SmartFix API
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S smartfix -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=smartfix:nodejs /app/dist ./dist
COPY --from=builder --chown=smartfix:nodejs /app/package.json ./

# Create necessary directories
RUN mkdir -p logs uploads && \
    chown -R smartfix:nodejs logs uploads

# Switch to non-root user
USER smartfix

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/app.js"]

# Development stage
FROM node:18-alpine AS development

# Install development tools
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start in development mode
CMD ["npm", "run", "dev"]

