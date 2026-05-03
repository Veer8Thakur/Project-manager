# Use Node base image
FROM node:20-slim

# Install openssl (needed for Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy only package files first (for caching)
COPY package*.json ./

# 🔥 Force cache bust + debug
RUN echo "cache-bust-v2"
RUN cat package.json

# Install dependencies
RUN npm install

# Copy rest of the code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port (Railway uses dynamic PORT)
EXPOSE 3000

# Start app (IMPORTANT: must keep container alive)
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]