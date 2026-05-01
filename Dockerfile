# Build stage for frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY react-frontend/package*.json ./
RUN npm ci
COPY react-frontend/ ./
RUN npm run build

# Build stage for backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY nodejs-express-api/package*.json ./
RUN npm ci --only=production
COPY nodejs-express-api/ ./
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./public

# Copy backend
COPY --from=backend-builder /app/backend ./backend
WORKDIR /app/backend

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

CMD ["node", "dist/app.js"]
