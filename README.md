# DOOH Platform

A full-stack Digital Out-of-Home advertising platform. Advertisers browse digital boards on an interactive map, book time slots, upload ad creatives, and the platform automatically displays them at the scheduled time via WebSocket-connected board simulators.

---

## Architecture Overview

```
React (Leaflet map) ──→ Nginx ──→ Django + Daphne (ASGI)
                                      │            │
                                   REST API    WebSocket
                                      │            │
                                 PostgreSQL   Django Channels
                                              (Redis layer)
                                                   │
                                             Celery Worker
                                          (fires tasks at ETA)
```

---

## Local Development (without Docker)

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 16
- Redis 7

### 1. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (copy and edit)
cp .env.example .env

# Create the database
createdb dooh_db

# Run migrations
python manage.py migrate

# Seed demo boards
python manage.py seed_boards

# Create an admin user
python manage.py createsuperuser

# Start Django (ASGI server)
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### 2. Start Celery worker (separate terminal)

```bash
cd backend
source venv/bin/activate
celery -A config worker --loglevel=info
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm start
# Opens at http://localhost:3000
```

### 4. Open a board simulator

Open a new browser tab at:
```
http://localhost:3000/simulator/1
```
This connects to Board #1 via WebSocket. When you create a booking for Board #1 and the scheduled time arrives, Celery pushes the ad to this tab.

---

## Docker Compose (recommended for local testing)

```bash
# Build and start all services
docker-compose up --build

# App is available at http://localhost:80

# Stop all services
docker-compose down

# Stop and remove all data (clean slate)
docker-compose down -v
```

**Services started:**
| Service   | Container       | Internal port |
|-----------|-----------------|---------------|
| Database  | dooh_db         | 5432          |
| Redis     | dooh_redis      | 6379          |
| Backend   | dooh_backend    | 8000          |
| Celery    | dooh_celery     | —             |
| Frontend  | dooh_frontend   | 80 (exposed)  |

---

## Full End-to-End Test

1. Go to `http://localhost`
2. Register a new account
3. You'll see the map with boards across Tunis
4. Click a board pin → sidebar opens
5. Click **Book This Board**
6. Pick tomorrow's date → select a time slot 2 minutes from now
7. Upload an image (any JPG)
8. Confirm the booking
9. Open `http://localhost/simulator/<board_id>` in another tab
10. Wait for the scheduled time → your ad displays automatically

---

## Kubernetes Deployment (AWS EKS)

### Prerequisites
- AWS CLI configured
- eksctl or an existing EKS cluster
- kubectl connected to the cluster
- AWS Load Balancer Controller installed
- Amazon ECR repositories created

### 1. Build and push Docker images to ECR

```bash
# Authenticate Docker with ECR
aws ecr get-login-password --region eu-west-1 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.eu-west-1.amazonaws.com

# Build and push backend
docker build -t dooh-backend ./backend
docker tag dooh-backend:latest YOUR_ECR_URI/dooh-backend:latest
docker push YOUR_ECR_URI/dooh-backend:latest

# Build and push frontend
docker build -t dooh-frontend ./frontend
docker tag dooh-frontend:latest YOUR_ECR_URI/dooh-frontend:latest
docker push YOUR_ECR_URI/dooh-frontend:latest
```

### 2. Update image references

In `k8s/02-backend.yaml` and `k8s/03-frontend-ingress.yaml`, replace:
```
YOUR_ECR_REGISTRY/dooh-backend:latest
YOUR_ECR_REGISTRY/dooh-frontend:latest
```
with your actual ECR URIs.

### 3. Update secrets

Generate real base64-encoded secrets:
```bash
echo -n "your-production-secret-key" | base64
echo -n "your-db-password" | base64
```
Update `k8s/00-namespace-config.yaml` with the new values.

### 4. Apply all manifests

```bash
# Apply in order (namespace first, then dependencies)
kubectl apply -f k8s/00-namespace-config.yaml
kubectl apply -f k8s/01-databases.yaml
kubectl apply -f k8s/02-backend.yaml
kubectl apply -f k8s/03-frontend-ingress.yaml

# Watch pods come up
kubectl get pods -n dooh -w

# Check the ALB address
kubectl get ingress -n dooh
```

### 5. Run migrations on the cluster

```bash
# Run as a one-off Job (not on every restart)
kubectl run migrate --rm -it --restart=Never \
  --image=YOUR_ECR_URI/dooh-backend:latest \
  --namespace=dooh \
  --env-from=configmap/dooh-config \
  --env-from=secret/dooh-secrets \
  -- python manage.py migrate
```

---

## Project Structure

```
dooh_platform/
├── backend/
│   ├── apps/
│   │   ├── accounts/     # User model, auth, JWT
│   │   ├── boards/       # Board registry, WebSocket consumer
│   │   ├── bookings/     # Booking engine, conflict detection, availability API
│   │   └── ads/          # Ad upload, Celery tasks (the scheduler)
│   ├── config/
│   │   ├── settings.py   # All Django settings
│   │   ├── urls.py       # URL routing
│   │   ├── asgi.py       # ASGI config (HTTP + WebSocket)
│   │   └── celery.py     # Celery app config
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/          # Leaflet map + board sidebar
│   │   │   ├── Booking/      # Multi-step booking form
│   │   │   ├── Board/        # Board simulator (WebSocket display)
│   │   │   └── Common/       # Navbar
│   │   ├── pages/            # One file per route
│   │   ├── services/
│   │   │   ├── api.js        # Axios + JWT interceptors
│   │   │   └── websocket.js  # WebSocket client for board simulator
│   │   └── store/
│   │       └── authStore.js  # Zustand auth state
│   ├── nginx.conf
│   └── Dockerfile
│
├── k8s/
│   ├── 00-namespace-config.yaml   # Namespace, ConfigMap, Secrets
│   ├── 01-databases.yaml          # PostgreSQL StatefulSet, Redis Deployment
│   ├── 02-backend.yaml            # Backend + Celery Deployments, HPA
│   └── 03-frontend-ingress.yaml   # Frontend Deployment + ALB Ingress
│
└── docker-compose.yml
```

---

## Key Design Decisions

**Why Django Channels + Redis for WebSockets?**
The Channels layer routes WebSocket messages through Redis, which means multiple backend pods (in Kubernetes) can all talk to each other. A Celery task running on Pod A can push a message to a board simulator connected to Pod B.

**Why Celery for scheduling?**
Django itself is synchronous and request-scoped. Celery is a dedicated async worker with ETA support — you can say "run this task at 14:30:00" and it executes exactly then.

**Why separate the Celery worker in Kubernetes?**
Separating concerns means you can scale workers independently from the API. If you have 100 ads scheduled at 15:00, you scale up Celery workers — not the web server.

**Why multi-stage Docker builds?**
The builder stage has gcc, libpq-dev, etc. for compiling native extensions. The runtime stage copies only the compiled venv — no build tools. This reduces the final image size from ~800MB to ~200MB.
