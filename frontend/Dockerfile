# ─────────────────────────────────────────────────────────────────────────────
# Frontend Dockerfile
# ─────────────────────────────────────────────────────────────────────────────
#
# Multi-stage build:
#   Stage 1 (builder) — Node.js builds the React app into static files
#   Stage 2 (runtime) — Nginx serves those static files, no Node needed
#
# Why Nginx for the frontend?
#   React builds to plain HTML/CSS/JS. Nginx is purpose-built to serve
#   static files extremely efficiently. It also handles:
#     - SPA routing (redirect all 404s to index.html)
#     - Proxying /api/* calls to the Django backend
#     - Gzip compression
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build React app ──────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first — Docker layer caching means npm install only
# re-runs when package.json actually changes (not on every code change)
COPY package.json package-lock.json* ./
RUN npm install -g npm@latest && npm ci
# Copy source and build
COPY . .
RUN npm run build


# ── Stage 2: Serve with Nginx ─────────────────────────────────────────────────
FROM nginx:alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from the builder stage
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
