# Use the official Bun image
FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Expose port (must match PORT env var)
EXPOSE 5000

# Start command
CMD ["bun", "run", "index.ts"]
