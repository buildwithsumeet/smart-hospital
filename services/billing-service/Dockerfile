FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/common/package*.json ./packages/common/
COPY services/billing-service/package*.json ./services/billing-service/

RUN npm install

COPY packages/common ./packages/common
COPY services/billing-service ./services/billing-service

RUN npm run build:common
RUN npm run build --workspace=@hospital/billing-service

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=builder /app/packages/common/package.json ./packages/common/package.json
COPY --from=builder /app/services/billing-service/dist ./services/billing-service/dist
COPY --from=builder /app/services/billing-service/package.json ./services/billing-service/package.json
COPY --from=builder /app/node_modules ./node_modules

USER node
EXPOSE 8005

CMD ["node", "services/billing-service/dist/server.js"]
