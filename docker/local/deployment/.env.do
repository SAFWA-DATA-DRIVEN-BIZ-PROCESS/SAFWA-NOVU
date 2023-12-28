# Secrets
# YOU MUST CHANGE THESE BEFORE GOING INTO PRODUCTION
JWT_SECRET=Lzy7QvFVFmakSWBwCZSxyDeJ6VHRTP2H
STORE_ENCRYPTION_KEY="d9Xv8WfJC8Lu%8dY4Pph3B9&&Mt+&LVm"

# General
NODE_ENV=production

MONGO_URL=mongodb://admin:pass1234@mongodb:27017/novu-db?w=majority
# MONGO_URL=mongodb://mongodb:27017/novu-db
MONGO_MAX_POOL_SIZE=500
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=pass1234
MONGO_INITDB_DATABASE=novu-db

REDIS_HOST=redis
REDIS_PASSWORD=
REDIS_CACHE_SERVICE_HOST=

# AWS
S3_LOCAL_STACK=http://localhost:4566
S3_BUCKET_NAME=novu-local
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# Ports
API_PORT=3000
REDIS_PORT=6379
REDIS_CACHE_SERVICE_PORT=6379
WS_PORT=3002

# Root URL
REACT_APP_WS_URL=http://localhost:3002
# Uncomment this one when deploying Novu in the local environment
# as Web app local Dockerfile will have to load this to be used. 
# Deployment version doesn't need as we inject it with API_ROOT_URL value.
# REACT_APP_API_URL=http://localhost:3000
API_ROOT_URL=http://localhost:3000
DISABLE_USER_REGISTRATION=false
FRONT_BASE_URL=http://client:4200
WIDGET_EMBED_PATH=http://localhost:4701/embed.umd.min.js
WIDGET_URL=http://localhost:4500

# Context Paths
# Only needed for setups with reverse-proxies
GLOBAL_CONTEXT_PATH=
WEB_CONTEXT_PATH=
API_CONTEXT_PATH=
WS_CONTEXT_PATH=
WIDGET_CONTEXT_PATH=

# Analytics
SENTRY_DSN=
NEW_RELIC_APP_NAME=
NEW_RELIC_LICENSE_KEY=
