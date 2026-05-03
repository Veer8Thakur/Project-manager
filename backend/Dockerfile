FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# 🔥 Copy prisma BEFORE install (fixes your error)
COPY prisma ./prisma

# Cache bust
RUN echo "rebuild-v4"

# Debug (optional)
RUN cat package.json

# Install dependencies (now prisma schema exists)
RUN npm install

# Copy rest of code
COPY . .

# Generate prisma client (safe now)
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]