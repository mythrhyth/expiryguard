FROM node:22-slim

# Install OpenSSL for Prisma Client
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/

RUN npx prisma generate
RUN npm run build

EXPOSE 5000

CMD ["node", "dist/src/app.js"]
