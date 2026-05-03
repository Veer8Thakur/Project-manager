FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 🔥 Force copy EVERYTHING first (no partial copies)
COPY . .

# 🔍 Debug to verify correct files
RUN echo "FILES:"
RUN ls -la
RUN echo "PACKAGE.JSON CONTENT:"
RUN cat package.json

# Install deps
RUN npm install

# Prisma + build
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]