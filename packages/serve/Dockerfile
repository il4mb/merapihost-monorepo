FROM oven/bun:1

WORKDIR /usr/local/merapihost/serve

# Copy package.json and bun.lock to the working directory
COPY package.json bun.lock* ./

# Install pm2 globally and then install project dependencies
RUN bun install -g pm2

# Install project dependencies with frozen lockfile and no cache
RUN bun install --frozen-lockfile --no-cache

# Build the project using webpack
RUN bun run build

COPY . .

EXPOSE 4000

# Run pm2-runtime directly in the CMD to keep the container alive
CMD ["pm2-runtime", "start", "src/server.ts", "--interpreter", "bun", "-i", "max"]