FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx tsc --project tsconfig.json

FROM node:22-alpine
WORKDIR /app
RUN addgroup -g 1001 -S botuser && adduser -S botuser -u 1001
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
USER botuser
EXPOSE 3000
CMD ["node", "dist/bot-entry.js"]
