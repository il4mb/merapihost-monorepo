FROM oven/bun:1

WORKDIR /usr/local/merapihost/api

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --no-cache

COPY . .

EXPOSE 4000

CMD ["bun", "run", "dev"]