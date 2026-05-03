FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files (correct for backend root)
COPY package*.json ./

# Force cache bust
RUN echo "rebuild-v3"

# Debug (optional, remove later)
RUN cat package.json

# Install deps
RUN npm install

# Copy rest of backend code
COPY . .

# Prisma + build
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]