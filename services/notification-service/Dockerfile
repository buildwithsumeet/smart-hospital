FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/common/package*.json ./packages/common/
COPY services/notification-service/package*.json ./services/notification-service/

RUN npm install

COPY packages/common ./packages/common
COPY services/notification-service ./services/notification-service

RUN npm run build:common
RUN npm run build --workspace=@hospital/notification-service

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=builder /app/packages/common/package.json ./packages/common/package.json
COPY --from=builder /app/services/notification-service/dist ./services/notification-service/dist
COPY --from=builder /app/services/notification-service/package.json ./services/notification-service/package.json
COPY --from=builder /app/node_modules ./node_modules

USER node
EXPOSE 8006

CMD ["node", "services/notification-service/dist/server.js"]
