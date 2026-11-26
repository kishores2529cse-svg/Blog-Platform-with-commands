# Stage 1: Build client frontend
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build server backend
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npx prisma generate
RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy server production dependencies
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev

# Copy Prisma schema and engines
COPY server/prisma ./prisma
RUN npx prisma generate

# Copy compiled backend
COPY --from=server-builder /app/server/dist ./dist

# Copy compiled frontend into client/dist
WORKDIR /app
COPY --from=client-builder /app/client/dist ./client/dist

# Expose server port
EXPOSE 5000

WORKDIR /app/server
CMD ["node", "dist/server.js"]
