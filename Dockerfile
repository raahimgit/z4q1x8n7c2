FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npx tsc src/bot-entry.ts --outDir dist --module commonjs --target es2022 --moduleResolution node --esModuleInterop --skipLibCheck --resolveJsonModule

FROM node:22-alpine
WORKDIR /app
RUN addgroup -g 1001 -S botuser && adduser -S botuser -u 1001
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER botuser
EXPOSE 3000
CMD ["node", "dist/bot-entry.js"]
