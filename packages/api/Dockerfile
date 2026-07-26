FROM oven/bun:1

WORKDIR /usr/local/merapihost/api

COPY . .

RUN bun install

EXPOSE 4000

CMD ["bun", "run", "dev"]