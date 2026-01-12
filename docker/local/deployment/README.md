# Novu Docker Compose Setup Guide

This guide will help you set up and run Novu using Docker Compose for local deployment.

## Prerequisites

- Docker installed (version 20.10 or higher)
- Docker Compose installed (version 2.0 or higher)
- At least 4GB of available RAM
- Ports available: 4200 (Web), 8001 (API), 3003 (WebSocket), 4500 (Widget), 4701 (Embed), 27017 (MongoDB)

## Quick Start

### 1. Navigate to the deployment directory

```bash
cd docker/local/deployment
```

### 2. Create your environment file

Copy the example environment file and customize it:

```bash
# For local development
cp .env.local.example .env

# Or for production
cp .env.production.example .env
```

### 3. Configure your environment

Open the `.env` file and update the following **CRITICAL** settings before starting:

```bash
# MUST CHANGE THESE FOR PRODUCTION!
JWT_SECRET=your-secret-jwt-key-here
STORE_ENCRYPTION_KEY=your-encryption-key-here

# MongoDB credentials
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your-secure-password

# MongoDB connection string (update with your credentials)
MONGO_URL=mongodb://admin:your-secure-password@mongodb:27017/novu-db
```

### 4. (Optional) Set Project Name

You can set a custom project name to make commands easier. Choose one of these methods:

**Option 1: In docker-compose.yml (Recommended)**
```yaml
version: '3.9'
name: novu

services:
  # ... rest of services
```

**Option 2: In .env file**
```bash
COMPOSE_PROJECT_NAME=novu
```

**Option 3: Inline with -p flag**

If not set in the file, use `-p novu` with every command:
```bash
docker compose -p novu up -d
docker compose -p novu down
docker compose -p novu logs -f
```

### 5. Start Novu

```bash
# If project name is set in docker-compose.yml or .env
docker compose up -d

# Or with inline project name
docker compose -p novu up -d
```

This will start all Novu services:
- **MongoDB**: Database (port 27017)
- **API**: Backend API (port 8001)
- **Worker**: Background job processor
- **WebSocket**: Real-time notifications (port 3003)
- **Web**: Admin dashboard (port 4200)
- **Widget**: Notification widget (port 4500)
- **Embed**: Widget embed script (port 4701)

### 6. Access Novu

Once all containers are running (this may take 1-2 minutes):

- **Web Dashboard**: http://localhost:4200
- **API**: http://localhost:8001
- **WebSocket**: http://localhost:3003

## Configuration

### Environment Variables

Key environment variables you should configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT tokens | **MUST CHANGE** |
| `STORE_ENCRYPTION_KEY` | Encryption key for sensitive data | **MUST CHANGE** |
| `MONGO_URL` | MongoDB connection string | mongodb://admin:pass1234@mongodb:27017/novu-db |
| `DISABLE_USER_REGISTRATION` | Disable new user signups | false |
| `API_ROOT_URL` | API public URL | http://localhost:8001 |
| `FRONT_BASE_URL` | Web dashboard URL | http://localhost:4200 |
| `REDIS_HOST` | Redis host (optional) | - |

### Optional Services

#### Redis (Recommended for Production)

To enable Redis for caching and queuing, uncomment the Redis service in `docker-compose.yml` and update your `.env`:

```bash
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

## Managing Your Novu Instance

### Check Service Status

```bash
docker compose ps
# Or with project name:
docker compose -p novu ps
```

### View Logs

```bash
# All services
docker compose logs -f
# Or: docker compose -p novu logs -f

# Specific service
docker compose logs -f api
docker compose logs -f worker
docker compose logs -f web
# Or: docker compose -p novu logs -f api
```

### Stop Novu

```bash
# Stop all services (containers remain)
docker compose stop
# Or: docker compose -p novu stop

# Stop and remove containers
docker compose down
# Or: docker compose -p novu down

# Stop and remove containers + volumes (WARNING: deletes data!)
docker compose down -v
# Or: docker compose -p novu down -v
```

## Restarting After .env Changes

When you modify environment variables in the `.env` file, you need to restart the affected services:

### Method 1: Restart All Services (Recommended)

```bash
# Stop all services
docker compose down
# Or: docker compose -p novu down

# Start with new environment variables
docker compose up -d
# Or: docker compose -p novu up -d

# Or in one command (force recreate)
docker compose up -d --force-recreate
# Or: docker compose -p novu up -d --force-recreate
```

### Method 2: Restart Specific Services

If you only changed variables for specific services:

```bash
# Restart API only
docker compose restart api
# Or: docker compose -p novu restart api

# Restart multiple services
docker compose restart api worker ws
# Or: docker compose -p novu restart api worker ws

# Recreate specific services (ensures env vars are reloaded)
docker compose up -d --force-recreate api worker
# Or: docker compose -p novu up -d --force-recreate api worker
```

### Method 3: Zero-Downtime Restart

```bash
# Restart services one by one
docker compose up -d --no-deps api
docker compose up -d --no-deps worker
docker compose up -d --no-deps ws
docker compose up -d --no-deps web
# Or with project name: docker compose -p novu up -d --no-deps api
```

### After Restart: Verify Changes

```bash
# Check if services are running
docker compose ps
# Or: docker compose -p novu ps

# Verify environment variables loaded correctly
docker compose exec api env | grep JWT_SECRET
docker compose exec api env | grep MONGO_URL
# Or: docker compose -p novu exec api env | grep JWT_SECRET

# Check logs for errors
docker compose logs --tail=50 api
# Or: docker compose -p novu logs --tail=50 api
```

## Troubleshooting

### Services Not Starting

```bash
# Check container logs
docker compose logs api
docker compose logs worker
# Or: docker compose -p novu logs api

# Check if ports are already in use
netstat -an | findstr "4200 8001 3003"  # Windows
# or
lsof -i :4200,8001,3003  # Linux/Mac
```

### MongoDB Connection Issues

```bash
# Check MongoDB is running
docker compose ps mongodb
# Or: docker compose -p novu ps mongodb

# Test MongoDB connection
docker compose exec mongodb mongosh -u admin -p your-password --authenticationDatabase admin
# Or: docker compose -p novu exec mongodb mongosh -u admin -p your-password --authenticationDatabase admin

# Check MongoDB logs
docker compose logs mongodb
# Or: docker compose -p novu logs mongodb
```

### Reset Database (Development Only)

```bash
# WARNING: This deletes all data!
docker compose down -v
docker compose up -d
# Or: docker compose -p novu down -v && docker compose -p novu up -d
```

### Container Keeps Restarting

```bash
# Check what's wrong
docker compose logs --tail=100 <service-name>
# Or: docker compose -p novu logs --tail=100 <service-name>

# Common issues:
# - Incorrect environment variables
# - Database connection failed
# - Port already in use
```

### Update Novu Version

Edit `docker-compose.yml` and change the image tags:

```yaml
# From:
image: 'ghcr.io/novuhq/novu/api:0.22.0'

# To (example):
image: 'ghcr.io/novuhq/novu/api:0.24.0'
```

Then restart:

```bash
docker compose pull
docker compose up -d
# Or: docker compose -p novu pull && docker compose -p novu up -d
```

## Production Considerations

### Security Checklist

- ✅ Change `JWT_SECRET` to a strong random value
- ✅ Change `STORE_ENCRYPTION_KEY` to a strong random value  
- ✅ Use strong MongoDB credentials
- ✅ Set `DISABLE_USER_REGISTRATION=true` if not needed
- ✅ Use Redis for production workloads
- ✅ Configure proper S3/storage for file uploads
- ✅ Set up proper monitoring and logging
- ✅ Use HTTPS/SSL with reverse proxy (nginx/traefik)
- ✅ Backup MongoDB regularly

### Performance Tuning

```bash
# Increase MongoDB connection pool
MONGO_MAX_POOL_SIZE=500
MONGO_MIN_POOL_SIZE=10

# Configure Redis for better performance
REDIS_CLUSTER_SERVICE_HOST=redis
REDIS_CACHE_SERVICE_HOST=redis
```

### Backup MongoDB

```bash
# Backup
docker compose exec -T mongodb mongodump --username admin --password your-password --authenticationDatabase admin --out /backup
# Or: docker compose -p novu exec -T mongodb mongodump --username admin --password your-password --authenticationDatabase admin --out /backup

# Restore
docker compose exec -T mongodb mongorestore --username admin --password your-password --authenticationDatabase admin /backup
# Or: docker compose -p novu exec -T mongodb mongorestore --username admin --password your-password --authenticationDatabase admin /backup
```

## Useful Commands Reference

```bash
# Start services
docker compose up -d
docker compose -p novu up -d  # with project name

# Stop services
docker compose down
docker compose -p novu down  # with project name

# Restart after .env changes
docker compose down && docker compose up -d
docker compose -p novu down && docker compose -p novu up -d  # with project name

# View logs
docker compose logs -f
docker compose -p novu logs -f  # with project name

# Update images
docker compose pull && docker compose up -d
docker compose -p novu pull && docker compose -p novu up -d  # with project name

# Scale worker
docker compose up -d --scale worker=3
docker compose -p novu up -d --scale worker=3  # with project name

# Execute command in container
docker compose exec api npm run your-command
docker compose -p novu exec api npm run your-command  # with project name

# Clean everything (WARNING: deletes data!)
docker compose down -v --remove-orphans
docker compose -p novu down -v --remove-orphans  # with project name
```

## Getting Help

- **Documentation**: https://docs.novu.co
- **Discord**: https://discord.gg/novu
- **GitHub Issues**: https://github.com/novuhq/novu/issues

## Next Steps

1. Create your first notification template in the dashboard
2. Integrate Novu SDK in your application
3. Set up notification channels (Email, SMS, Push, etc.)
4. Configure provider integrations (SendGrid, Twilio, etc.)

---

**Note**: This setup is for local development. For production deployments, consider using Kubernetes or a managed hosting solution.
