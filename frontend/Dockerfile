# --- Stage 1: Build ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Stage 2: Production Run ---
FROM node:22-alpine
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy the entire SvelteKit Node build output directory
COPY --from=builder /app/build ./build

EXPOSE 3000
CMD ["node", "build/index.js"]