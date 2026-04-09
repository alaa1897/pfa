# ─────────────────────────────────────────────────────────────────────────────
# Backend Dockerfile
# ─────────────────────────────────────────────────────────────────────────────
#
# Multi-stage build:
#   Stage 1 (builder) — install Python deps into a virtual env
#   Stage 2 (runtime) — copy only the venv and app code, no build tools
#
# Why multi-stage?
#   The builder stage needs gcc, libpq-dev, etc. to compile native extensions
#   (psycopg2, Pillow). The runtime image doesn't need those tools — dropping
#   them cuts the final image size significantly and reduces attack surface.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

# System deps needed to compile psycopg2 (PostgreSQL adapter) and Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment so we can copy it cleanly to the next stage
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt


# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

# Only the runtime system libraries needed (not build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libjpeg62-turbo \
    && rm -rf /var/lib/apt/lists/*

# Copy the virtual environment from the builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Create a non-root user for security
# Running as root in a container is a security risk
RUN groupadd -r dooh && useradd -r -g dooh dooh

# Set working directory
WORKDIR /app

# Copy application code
COPY . .

# Create media directory with correct ownership
RUN mkdir -p /app/media /app/staticfiles && \
    chown -R dooh:dooh /app

# Switch to non-root user
USER dooh

# Expose the port Daphne (ASGI server) will listen on
EXPOSE 8000

# Health check — Docker will ping this to know if the container is healthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/admin/')" || exit 1

# Default command: run Daphne (ASGI server that handles HTTP + WebSocket)
# Use 0.0.0.0 so it binds to all interfaces inside the container
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
