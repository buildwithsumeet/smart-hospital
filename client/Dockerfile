# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configurations
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/common/package*.json ./packages/common/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install

# Copy source files
COPY packages/common ./packages/common
COPY client ./client

# Build common library and client
RUN npm run build:common
RUN npm run build --workspace=@hospital/client

# Production runtime stage
FROM nginx:alpine

COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
