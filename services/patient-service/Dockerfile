FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/common/package*.json ./packages/common/
COPY services/patient-service/package*.json ./services/patient-service/

RUN npm install

COPY packages/common ./packages/common
COPY services/patient-service ./services/patient-service

RUN npm run build:common
RUN npm run build --workspace=@hospital/patient-service

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=builder /app/packages/common/package.json ./packages/common/package.json
COPY --from=builder /app/services/patient-service/dist ./services/patient-service/dist
COPY --from=builder /app/services/patient-service/package.json ./services/patient-service/package.json
COPY --from=builder /app/node_modules ./node_modules

USER node
EXPOSE 8002

CMD ["node", "services/patient-service/dist/server.js"]
