FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/common/package*.json ./packages/common/
COPY services/api-gateway/package*.json ./services/api-gateway/

RUN npm install

COPY packages/common ./packages/common
COPY services/api-gateway ./services/api-gateway

RUN npm run build:common
RUN npm run build --workspace=@hospital/api-gateway

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=builder /app/packages/common/package.json ./packages/common/package.json
COPY --from=builder /app/services/api-gateway/dist ./services/api-gateway/dist
COPY --from=builder /app/services/api-gateway/package.json ./services/api-gateway/package.json
COPY --from=builder /app/node_modules ./node_modules

USER node
EXPOSE 8000

CMD ["node", "services/api-gateway/dist/server.js"]
