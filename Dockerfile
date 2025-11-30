# Multi-stage build for Pistonary
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build frontend (nur Vite, ohne TypeScript-Check)
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (ts-node und tsconfig-paths werden für den Server benötigt)
RUN npm ci

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy ALL source code (TypeScript wird zur Laufzeit mit ts-node ausgeführt)
COPY src ./src
COPY tsconfig*.json ./

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start the server
CMD ["npm", "run", "server"]
