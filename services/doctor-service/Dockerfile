FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/common/package*.json ./packages/common/
COPY services/doctor-service/package*.json ./services/doctor-service/

RUN npm install

COPY packages/common ./packages/common
COPY services/doctor-service ./services/doctor-service

RUN npm run build:common
RUN npm run build --workspace=@hospital/doctor-service

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=builder /app/packages/common/package.json ./packages/common/package.json
COPY --from=builder /app/services/doctor-service/dist ./services/doctor-service/dist
COPY --from=builder /app/services/doctor-service/package.json ./services/doctor-service/package.json
COPY --from=builder /app/node_modules ./node_modules

USER node
EXPOSE 8003

CMD ["node", "services/doctor-service/dist/server.js"]
