FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 🔥 Explicit copy (fixes your issue)
COPY ./backend/package.json ./package.json

RUN cat package.json

RUN npm install

COPY ./backend .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]