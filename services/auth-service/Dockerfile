FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/common/package*.json ./packages/common/
COPY services/auth-service/package*.json ./services/auth-service/

RUN npm install

COPY packages/common ./packages/common
COPY services/auth-service ./services/auth-service

RUN npm run build:common
RUN npm run build --workspace=@hospital/auth-service

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=builder /app/packages/common/package.json ./packages/common/package.json
COPY --from=builder /app/services/auth-service/dist ./services/auth-service/dist
COPY --from=builder /app/services/auth-service/package.json ./services/auth-service/package.json
COPY --from=builder /app/node_modules ./node_modules

USER node
EXPOSE 8001

CMD ["node", "services/auth-service/dist/server.js"]
