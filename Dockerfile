# Build stage
FROM node:18-alpine AS build

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Create a non-root user
RUN adduser -D jane

# Set environment variables
ENV NODE_ENV=production \
    JANE_DIR=/app/Jane

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Create and set permissions for Jane directory
RUN mkdir -p ${JANE_DIR} && \
    chown -R jane:jane ${JANE_DIR}

# Switch to non-root user
USER jane

# Volume for persistent storage
VOLUME ${JANE_DIR}

# Set the entrypoint
ENTRYPOINT ["node", "dist/index.js"]

# Label the image with metadata
LABEL org.opencontainers.image.title="Jane MCP Server" \
      org.opencontainers.image.description="Knowledge management MCP server for stdlib and specs" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.authors="Jane Maintainers" \
      org.opencontainers.image.source="https://github.com/username/jane" \
      org.opencontainers.image.licenses="MIT"