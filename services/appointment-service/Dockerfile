FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/common/package*.json ./packages/common/
COPY services/appointment-service/package*.json ./services/appointment-service/

RUN npm install

COPY packages/common ./packages/common
COPY services/appointment-service ./services/appointment-service

RUN npm run build:common
RUN npm run build --workspace=@hospital/appointment-service

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=builder /app/packages/common/package.json ./packages/common/package.json
COPY --from=builder /app/services/appointment-service/dist ./services/appointment-service/dist
COPY --from=builder /app/services/appointment-service/package.json ./services/appointment-service/package.json
COPY --from=builder /app/node_modules ./node_modules

USER node
EXPOSE 8004

CMD ["node", "services/appointment-service/dist/server.js"]
