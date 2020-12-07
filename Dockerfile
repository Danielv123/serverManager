FROM node:14 AS builder

WORKDIR /usr/src/app

# Add package.json and run npm install
# Its important to copy in package.json first to avoid caching issues
COPY frontend/package*.json ./
RUN npm ci --only=production

# Copy rest of the project and build
COPY frontend/ .
RUN npm run build

FROM node:14-alpine

LABEL org.opencontainers.image.source https://github.com/Danielv123/serverManager

# Open a port in the firewall
EXPOSE 8080

RUN apk add ipmitool

WORKDIR /usr/src/app

COPY backend/package*.json ./
RUN npm ci --only=production

# Copy rest of the backend
COPY backend/src ./src

# Copy our frontend build result
COPY --from=builder /usr/src/app/build build

CMD [ "npm", "start" ]
