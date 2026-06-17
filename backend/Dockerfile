FROM node:20-alpine AS builder

WORKDIR /app

ENV DATABASE_URL=postgresql://supportgpt:supportgpt@localhost:5432/supportgpt

COPY package.json ./
COPY prisma ./prisma
RUN npm install

COPY tsconfig.json prettier.config.cjs jest.config.cjs ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
COPY prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
