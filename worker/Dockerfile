FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY worker/package*.json ./worker/

RUN npm install --prefix worker

COPY worker/ ./worker/
COPY server/prisma/ ./worker/prisma/

RUN npm --prefix worker run prisma:generate
RUN npm --prefix worker run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY worker/package*.json ./worker/
COPY server/prisma/ ./worker/prisma/

RUN npm install --prefix worker --omit=dev
RUN npm --prefix worker run prisma:generate

COPY --from=builder /app/worker/dist ./worker/dist

CMD ["node", "worker/dist/index.js"]
