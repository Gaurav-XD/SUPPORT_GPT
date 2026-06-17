FROM node:20-alpine AS builder

WORKDIR /app

ENV NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_WS_URL=ws://localhost:3001

COPY package.json ./
RUN npm install

COPY next.config.mjs tsconfig.json postcss.config.mjs tailwind.config.ts next-env.d.ts .eslintrc.cjs ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
