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

COPY package*.json ./
COPY server/package*.json ./server/
COPY server/prisma/ ./server/prisma/

RUN npm install --prefix server --omit=dev
RUN npm --prefix server run prisma:generate

COPY --from=builder /app/server/dist ./server/dist

EXPOSE 5001

CMD ["node", "server/dist/index.js"]
