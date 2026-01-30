# Build Stage
FROM oven/bun:1 as build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# We don't need to load env vars here because they are build-time? 
# Vite replaces import.meta.env at build time. 
# So we DO need VITE_API_URL available during build? 
# Actually, for Docker builds, it's better to inject them at runtime or build time.
# Railway allows build-time args.
# But simpler is to build, and if variables are needed, providing them in Railway Variables tab works 
# IF we use 'ARG' instructions.

# However, Vite needs env vars at BUILD time usually.
# Let's add ARG instructions to support it.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN bun run build

# Serve Stage
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
