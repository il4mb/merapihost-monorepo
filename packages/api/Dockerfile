# We use Bun v1.4.0 because no official Bun image is available for v1.4.0 yet use the canary version instead.
FROM oven/bun:canary-alpine 

WORKDIR /usr/local/merapihost/api

COPY package.json bun.lock* tsconfig.json ./
RUN bun install --frozen-lockfile --no-cache

COPY . .

EXPOSE 4000

CMD ["bun", "run", "dev"]