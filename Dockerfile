# Builder
FROM node:20.9.0-slim@sha256:8fe6bcd0b46e9bfa80d732a1f3c252117bd9f66b4af0a02a6cb63fba9325caf3 AS builder
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl=3.0.11-1~deb12u1 \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY ./prisma/schema.prisma ./prisma/schema.prisma
RUN npm run prisma:client

COPY ./codegen.yml ./
COPY ./src ./src
RUN npm run codegen

COPY ./tsconfig.json rollup.config.js ./
RUN npm run rollup:build

# Runner
FROM node:20.9.0-slim@sha256:8fe6bcd0b46e9bfa80d732a1f3c252117bd9f66b4af0a02a6cb63fba9325caf3 AS runner
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl=3.0.11-1~deb12u1 \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

## install tini
ADD https://github.com/krallin/tini/releases/download/v0.19.0/tini /bin/tini
RUN chmod +x /bin/tini

## install production-only node.js dependencies
ENV NODE_ENV production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

## copy build dist
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client

ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/index.mjs"]

