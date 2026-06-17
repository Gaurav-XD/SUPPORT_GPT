# SupportGPT Deployment Guide

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Docker & Docker Compose](#docker--docker-compose)
3. [Production Deployment](#production-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Migrations](#database-migrations)
6. [Monitoring & Logging](#monitoring--logging)
7. [Backup & Recovery](#backup--recovery)
8. [Troubleshooting](#troubleshooting)

---

## Development Environment Setup

### Prerequisites

```bash
# Required
- Node.js 20+
- Docker Desktop (or Docker + Docker Compose)
- PostgreSQL 14+ (or use Docker)
- Redis 7+ (or use Docker)

# Optional
- Git
- VS Code with extensions:
  - Prisma
  - REST Client
  - Docker
```

### Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/yourusername/supportgpt.git
cd supportgpt

# 2. Setup backend
cd backend
cp .env.example .env.local
npm install

# 3. Setup frontend
cd ../frontend
cp .env.example .env.local
npm install

# 4. Start services with Docker Compose
cd ..
docker-compose -f docker-compose.yml up

# 5. Run database migrations
npm --prefix backend run db:migrate

# 6. Seed development data
npm --prefix backend run db:seed

# 7. Access applications
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Database: localhost:5432
- Redis: localhost:6379
```

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Create .env.local
cat > .env.local << EOF
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/supportgpt_dev"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="dev_secret_key_change_in_production"
OPENAI_API_KEY="sk-..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
EOF

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev

# Run tests
npm test

# Run type checking
npm run type-check
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
EOF

# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check
```

---

## Docker & Docker Compose

### Docker Architecture

```
docker-compose
├── postgres (database)
├── redis (cache & sessions)
├── backend (Node.js/Express)
├── frontend (Next.js)
└── mailhog (email testing)
```

### Development: docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: supportgpt_postgres
    environment:
      POSTGRES_USER: supportgpt
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: supportgpt_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - supportgpt
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U supportgpt"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: supportgpt_redis
    ports:
      - "6379:6379"
    networks:
      - supportgpt
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: supportgpt_backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://supportgpt:devpassword@postgres:5432/supportgpt_dev
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev_secret_key_change_in_production
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      NODE_LOG_LEVEL: debug
    ports:
      - "3001:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - supportgpt
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run dev

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: supportgpt_frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
      NEXT_PUBLIC_WS_URL: ws://localhost:3001
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - supportgpt
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

  # Mail Testing (MailHog)
  mailhog:
    image: mailhog/mailhog:latest
    container_name: supportgpt_mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    networks:
      - supportgpt

volumes:
  postgres_data:

networks:
  supportgpt:
    driver: bridge
```

### Backend Dockerfile

```dockerfile
# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start development server
CMD ["npm", "run", "dev"]

---

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY . .

# Run migrations
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start production server
CMD ["npm", "start"]
```

### Frontend Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}

RUN npm run build

---

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

RUN npm install -g next

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["next", "start"]
```

### Docker Compose Commands

```bash
# Build and start services
docker-compose up --build

# Start services (background)
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Access database
docker-compose exec postgres psql -U supportgpt -d supportgpt_dev

# Access Redis
docker-compose exec redis redis-cli

# Remove volumes (careful!)
docker-compose down -v
```

---

## Production Deployment

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] SSL/TLS certificates installed
- [ ] Secrets in secret management (not .env)
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Error tracking configured
- [ ] Load balancer configured
- [ ] Rate limiting enabled
- [ ] API keys rotated
- [ ] SSL certificate auto-renewal configured

### AWS Deployment (Example)

#### Architecture

```
                   ┌─ Route 53 (DNS)
                   │
                   ▼
            ┌─ CloudFront (CDN)
            │
            ▼
    ┌─ ALB (Load Balancer)
    │
    ├─ ECS Task (Backend 1)
    ├─ ECS Task (Backend 2)
    └─ ECS Task (Backend 3)
            │
    ┌───────┼───────┐
    │       │       │
    ▼       ▼       ▼
RDS    ElastiCache  S3
(DB)   (Redis)      (Files)
```

#### Backend Deployment (ECS)

```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name supportgpt-backend

# 2. Build and push image
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker build -t supportgpt-backend:latest ./backend
docker tag supportgpt-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/supportgpt-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/supportgpt-backend:latest

# 3. Create ECS task definition
cat > task-definition.json << 'EOF'
{
  "family": "supportgpt-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "$AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/supportgpt-backend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:$AWS_ACCOUNT_ID:secret:supportgpt/db-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:$AWS_ACCOUNT_ID:secret:supportgpt/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/supportgpt-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# 4. Create ECS service
aws ecs create-service \
  --cluster supportgpt \
  --service-name supportgpt-backend \
  --task-definition supportgpt-backend:1 \
  --desired-count 3 \
  --launch-type FARGATE
```

#### Database Setup (RDS)

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier supportgpt-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.0 \
  --allocated-storage 100 \
  --storage-type gp3 \
  --master-username supportgpt \
  --master-user-password <strong-password> \
  --db-name supportgpt \
  --vpc-security-group-ids sg-xxxx \
  --backup-retention-period 30 \
  --enable-cloudwatch-logs-exports postgresql \
  --multi-az

# Wait for instance to be available
aws rds wait db-instance-available --db-instance-identifier supportgpt-db

# Run migrations
npx prisma migrate deploy --skip-generate
```

#### Redis Setup (ElastiCache)

```bash
# Create ElastiCache Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id supportgpt-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --vpc-security-group-ids sg-xxxx \
  --auto-failover-enabled \
  --snapshot-retention-limit 5
```

### Kubernetes Deployment (Alternative)

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: supportgpt-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: supportgpt-backend
  template:
    metadata:
      labels:
        app: supportgpt-backend
    spec:
      containers:
      - name: backend
        image: supportgpt-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: supportgpt-secrets
              key: database-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---

apiVersion: v1
kind: Service
metadata:
  name: supportgpt-backend
spec:
  selector:
    app: supportgpt-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

---

## Environment Configuration

### Environment Variables

#### Backend (.env.production)

```bash
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@host:5432/supportgpt
DATABASE_POOL_MIN=10
DATABASE_POOL_MAX=20

# Redis
REDIS_URL=redis://host:6379/0

# JWT
JWT_SECRET=<generate-secure-random-secret>
JWT_EXPIRY=900
REFRESH_TOKEN_EXPIRY=604800

# OpenAI
OPENAI_API_KEY=sk-...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@supportgpt.com
SMTP_PASS=<app-specific-password>

# AWS S3 (for file storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=supportgpt-files

# Monitoring
SENTRY_DSN=https://...

# Security
CORS_ORIGIN=https://supportgpt.com
SESSION_SECRET=<generate-secure-random-secret>
```

#### Frontend (.env.production)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.supportgpt.com
NEXT_PUBLIC_WS_URL=wss://api.supportgpt.com

# Analytics
NEXT_PUBLIC_GA_ID=G-...
NEXT_PUBLIC_SENTRY_DSN=https://...

# Feature Flags
NEXT_PUBLIC_ENABLE_BETA_FEATURES=false
```

### Secrets Management

#### AWS Secrets Manager

```bash
# Store secrets securely
aws secretsmanager create-secret \
  --name supportgpt/database-url \
  --secret-string "postgresql://..."

aws secretsmanager create-secret \
  --name supportgpt/jwt-secret \
  --secret-string "$(openssl rand -base64 32)"

aws secretsmanager create-secret \
  --name supportgpt/openai-api-key \
  --secret-string "sk-..."
```

#### HashiCorp Vault (Enterprise)

```bash
# Store in Vault instead of environment variables
vault kv put secret/supportgpt/db-url value="postgresql://..."
vault kv put secret/supportgpt/jwt-secret value="..."
```

---

## Database Migrations

### Running Migrations

```bash
# Development
npx prisma migrate dev --name add_new_field

# Production (apply migrations)
npx prisma migrate deploy

# Verify migrations
npx prisma migrate status

# Reset database (development only!)
npx prisma migrate reset
```

### Creating a Migration

```bash
# 1. Update schema.prisma
# Add new model or field

# 2. Create migration
npx prisma migrate dev --name descriptive_name

# 3. Review migration in prisma/migrations/

# 4. Commit to version control
git add prisma/migrations/
git commit -m "Add user preferences table"

# 5. Test in staging
# ... deploy to staging first

# 6. Deploy to production
npx prisma migrate deploy
```

### Migration Best Practices

1. **Backward Compatibility**: Migrations should be reversible
2. **Testing**: Test migrations in staging first
3. **Downtime**: Schedule migrations during low-traffic periods
4. **Monitoring**: Watch database performance during migration
5. **Rollback Plan**: Always have rollback strategy

```prisma
// Safe migration example
model UserPreferences {
  id      String @id @default(cuid())
  userId  String @unique
  theme   String @default("light")
  
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Add nullable field first
// Then backfill data
// Then make non-nullable
```

---

## Monitoring & Logging

### Application Monitoring

```typescript
// Prometheus metrics
import client from 'prom-client';

// Create metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Record metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  next();
});

// Expose metrics
app.get('/metrics', (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(client.register.metrics());
});
```

### Structured Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: {
    service: 'supportgpt-backend',
    environment: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Usage
logger.info('API request', {
  method: req.method,
  path: req.path,
  userId: req.user?.id,
  orgId: req.user?.orgId
});

logger.error('Database error', {
  error: err.message,
  query: err.sql,
  userId: req.user?.id
});
```

### Error Tracking (Sentry)

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});

app.use(Sentry.Handlers.requestHandler());

// Your routes here

app.use(Sentry.Handlers.errorHandler());
```

### Dashboard (Grafana)

```
Prometheus → Grafana Dashboard

Key Metrics:
- API response time (p50, p95, p99)
- Error rate
- Database connection count
- Cache hit rate
- Active WebSocket connections
- Job queue depth
- CPU and memory usage
```

---

## Backup & Recovery

### Database Backups

```bash
# Manual backup
pg_dump supportgpt > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backups (AWS RDS)
- Automated backups: 30 days retention
- Manual snapshots: monthly
- Cross-region replication: enabled

# Restore from backup
psql supportgpt < backup_20260617_120000.sql
```

### Disaster Recovery Procedure

```
Scenario: Database corruption

1. Detect issue (monitoring alert)
2. Stop applications (prevent writes)
3. Restore from latest backup
4. Verify data integrity
5. Restart applications
6. Notify users if needed

Recovery Time Objective (RTO): 1 hour
Recovery Point Objective (RPO): 1 hour
```

---

## Troubleshooting

### Common Issues

#### Database Connection Timeout

```bash
# Check database status
docker-compose logs postgres

# Verify connection string
psql postgresql://user:password@localhost:5432/supportgpt

# Check network connectivity
docker network inspect supportgpt

# Increase pool size if needed
DATABASE_POOL_MAX=30
```

#### Redis Connection Error

```bash
# Check Redis status
redis-cli ping

# Clear Redis cache
redis-cli FLUSHALL

# Check memory usage
redis-cli INFO memory
```

#### Out of Memory

```bash
# Check Node.js memory
node --max-old-space-size=4096 server.js

# Analyze heap
node --inspect=0.0.0.0:9229 server.js
# Open chrome://inspect

# Reduce cache TTL
# Implement pagination limits
```

#### Slow API Responses

```
1. Check database query performance
   - Enable query logging
   - Analyze slow queries
   - Add missing indexes

2. Check API latency
   - Profile with clinic.js
   - Look for CPU bottlenecks
   - Check external API calls

3. Monitor scaling
   - Horizontal scale if needed
   - Add caching layer
   - Implement rate limiting
```

---

## Conclusion

SupportGPT deployment is production-ready with:
- **Docker containerization** for consistency
- **Multiple deployment options** (Docker Compose, ECS, Kubernetes)
- **Environment-based configuration** for security
- **Database migration strategy** for schema changes
- **Monitoring & logging** for observability
- **Backup & recovery** for reliability

This deployment guide covers the full lifecycle from development to production.

---

**Version**: 1.0
**Last Updated**: 2026-06-17
**Status**: Deployment Ready
