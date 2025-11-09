# 🐳 Docker Quick Start Guide

Quick reference for building and deploying the Procuroid Backend with Docker.

## 📋 Prerequisites

- Docker installed
- Google Cloud account (for Cloud Run deployment)
- Environment variables configured

## 🚀 Quick Deploy to Google Cloud Run

### Option 1: Automatic Deployment (Recommended)

1. **Connect GitHub to Cloud Build:**
   ```bash
   # Enable required APIs
   gcloud services enable cloudbuild.googleapis.com run.googleapis.com
   
   # Set up trigger in Cloud Console
   # Go to: Cloud Build > Triggers > Connect Repository
   ```

2. **Configure environment variables in Cloud Run:**
   - See `ENV_VARIABLES.md` for complete list
   - Minimum required: `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`

3. **Push to main branch:**
   ```bash
   git push origin main
   # Automatically builds and deploys!
   ```

### Option 2: Manual Deployment

```bash
# Build and deploy in one command
gcloud builds submit --config cloudbuild.yaml

# Or build locally and deploy
docker build -t gcr.io/YOUR_PROJECT_ID/procuroid-backend .
docker push gcr.io/YOUR_PROJECT_ID/procuroid-backend
gcloud run deploy procuroid-backend \
  --image gcr.io/YOUR_PROJECT_ID/procuroid-backend \
  --region us-central1 \
  --allow-unauthenticated
```

## 🏠 Local Development with Docker

### Build the image:
```bash
cd procuroid-backend
docker build -t procuroid-backend .
```

### Run with environment variables:
```bash
docker run -p 8080:8080 \
  -e SUPABASE_URL="https://your-project.supabase.co" \
  -e SUPABASE_KEY="your-key" \
  -e SUPABASE_SERVICE_KEY="your-service-key" \
  procuroid-backend
```

### Or use an env file:
```bash
# Create .env file with your variables
docker run -p 8080:8080 --env-file .env procuroid-backend
```

### Test the API:
```bash
curl http://localhost:8080
```

Expected response:
```json
{
  "message": "Procuroid Backend API",
  "version": "1.0.0",
  "status": "running"
}
```

## 🔧 Docker Commands Reference

### Build
```bash
# Standard build
docker build -t procuroid-backend .

# Build with no cache
docker build --no-cache -t procuroid-backend .

# Build with specific platform (for M1/M2 Macs)
docker build --platform linux/amd64 -t procuroid-backend .
```

### Run
```bash
# Run in foreground
docker run -p 8080:8080 procuroid-backend

# Run in background (detached)
docker run -d -p 8080:8080 --name procuroid-backend procuroid-backend

# Run with custom port
docker run -p 3000:8080 -e PORT=8080 procuroid-backend
```

### Manage
```bash
# List running containers
docker ps

# View logs
docker logs procuroid-backend

# Follow logs (live)
docker logs -f procuroid-backend

# Stop container
docker stop procuroid-backend

# Remove container
docker rm procuroid-backend

# Remove image
docker rmi procuroid-backend
```

### Debug
```bash
# Run interactive shell in container
docker run -it --entrypoint /bin/bash procuroid-backend

# Execute command in running container
docker exec -it procuroid-backend /bin/bash

# Inspect container
docker inspect procuroid-backend
```

## 📦 Docker Compose (Optional)

Create `docker-compose.yml` for local development:

```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
    env_file:
      - .env
```

Run with:
```bash
docker-compose up
```

## 🔍 Troubleshooting

### Build fails
```bash
# Check Dockerfile syntax
docker build --progress=plain -t procuroid-backend .

# Remove all cached layers
docker system prune -a
```

### Container won't start
```bash
# Check logs
docker logs procuroid-backend

# Run with interactive shell
docker run -it --entrypoint /bin/bash procuroid-backend
```

### Port already in use
```bash
# Find process using port 8080
lsof -i :8080  # Mac/Linux
netstat -ano | findstr :8080  # Windows

# Use different port
docker run -p 9000:8080 procuroid-backend
```

### Permission denied
```bash
# Run with sudo (if needed)
sudo docker build -t procuroid-backend .

# Or add user to docker group
sudo usermod -aG docker $USER
```

## 🎯 Production Checklist

- [ ] Environment variables configured in Cloud Run
- [ ] Secrets stored in Secret Manager (not plaintext)
- [ ] CORS origins updated with production URL
- [ ] `--allow-unauthenticated` removed (if authentication needed)
- [ ] Monitoring and logging enabled
- [ ] Auto-scaling configured
- [ ] Health checks configured
- [ ] CI/CD pipeline tested

## 📚 Additional Resources

- **Full deployment guide:** See `DEPLOYMENT.md`
- **Environment variables:** See `ENV_VARIABLES.md`
- **Docker docs:** https://docs.docker.com/
- **Cloud Run docs:** https://cloud.google.com/run/docs

## 💡 Pro Tips

1. **Multi-stage builds:** Current Dockerfile is optimized for size
2. **Layer caching:** Dependencies are installed before copying source code
3. **Security:** Runs as non-root user for better security
4. **Production server:** Uses Gunicorn instead of Flask dev server
5. **Logging:** Configured for Cloud Logging integration

## 🆘 Need Help?

- Check logs: `docker logs procuroid-backend`
- Cloud Run logs: `gcloud run services logs read procuroid-backend`
- Build logs: Cloud Build console

