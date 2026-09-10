FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY worker/package*.json ./worker/

RUN npm install --prefix worker

COPY worker/ ./worker/
COPY server/prisma/ ./worker/prisma/

RUN npx --prefix worker prisma generate --schema=./worker/prisma/schema.prisma
RUN npm --prefix worker run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl libc6-compat

COPY --from=builder /app/worker/dist ./worker/dist
COPY --from=builder /app/worker/node_modules ./worker/node_modules
COPY --from=builder /app/worker/package*.json ./worker/

CMD ["node", "worker/dist/index.js"]
