FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY server/package*.json ./server/

RUN npm install --prefix server

COPY server/ ./server/

RUN npm --prefix server run prisma:generate
RUN npm --prefix server run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl libc6-compat

COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/package*.json ./server/

EXPOSE 5001

CMD ["node", "server/dist/index.js"]
