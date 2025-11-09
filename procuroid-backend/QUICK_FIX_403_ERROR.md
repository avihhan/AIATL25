# 🚨 Quick Fix: 403 Error & Malformed Response

## Problem
Your Cloud Run service is returning errors because:
1. ❌ Missing environment variables (causing crashes)
2. ❌ Authentication required (403 Forbidden)

## ✅ Solution: Set Environment Variables NOW

### Step 1: Get Your Supabase Credentials

1. Go to: https://app.supabase.com/project/_/settings/api
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - ⚠️ Keep this secret!

### Step 2: Configure Cloud Run

**Method A: Via Console (5 minutes)**

1. Go to: https://console.cloud.google.com/run
2. Click on **`procuroid-backend`** service
3. Click **"EDIT & DEPLOY NEW REVISION"** (yellow button at top)
4. Scroll down to **"VARIABLES & SECRETS"** section
5. Click **"+ ADD VARIABLE"** three times to add:

```
Name: SUPABASE_URL
Value: https://your-project-id.supabase.co

Name: SUPABASE_KEY
Value: your-anon-key-here

Name: SUPABASE_SERVICE_KEY
Value: your-service-role-key-here
```

6. Under **"SECURITY"** tab, check **"Allow unauthenticated invocations"**
7. Click **"DEPLOY"** at the bottom
8. Wait 1-2 minutes for deployment

### Step 3: Test

```bash
curl https://procuroid-backend-369418280809.us-central1.run.app/

# Should return:
{
  "message": "Procuroid Backend API",
  "version": "1.0.0",
  "status": "running",
  ...
}
```

## 🔐 Better Solution: Use Secret Manager (Production)

For production, use Google Secret Manager instead of plain environment variables:

### Create Secrets:
```bash
# Create secrets (one-time setup)
echo -n "your-supabase-url" | gcloud secrets create supabase-url --data-file=-
echo -n "your-anon-key" | gcloud secrets create supabase-key --data-file=-
echo -n "your-service-key" | gcloud secrets create supabase-service-key --data-file=-

# Grant access to Cloud Run
PROJECT_NUMBER=$(gcloud projects describe procuroid --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding supabase-url \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding supabase-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding supabase-service-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Update cloudbuild.yaml:
```yaml
- '--set-secrets'
- 'SUPABASE_URL=supabase-url:latest,SUPABASE_KEY=supabase-key:latest,SUPABASE_SERVICE_KEY=supabase-service-key:latest'
```

## 🔍 Debugging Tips

### View Logs:
```bash
# If you have gcloud CLI
gcloud run services logs read procuroid-backend --region us-central1 --limit 50
```

Or in Console:
https://console.cloud.google.com/run/detail/us-central1/procuroid-backend/logs

### Common Errors:

**"ModuleNotFoundError"**
- Problem: Missing Python dependency
- Fix: Add to `requirements.txt` and redeploy

**"Connection refused"**
- Problem: App not binding to correct port
- Fix: Dockerfile already handles this correctly

**"Health check failed"**
- Problem: App taking too long to start
- Fix: Increase startup timeout in Cloud Run settings

**"403 Forbidden"**
- Problem: Authentication required
- Fix: Enable "Allow unauthenticated invocations" in Security tab

## 📝 Checklist

Before your API will work, you need:

- [ ] Supabase project created
- [ ] SUPABASE_URL environment variable set in Cloud Run
- [ ] SUPABASE_KEY environment variable set in Cloud Run
- [ ] SUPABASE_SERVICE_KEY environment variable set in Cloud Run
- [ ] "Allow unauthenticated invocations" enabled
- [ ] Service redeployed with new configuration
- [ ] Test endpoint: `curl https://your-service-url/`

## 🆘 Still Not Working?

1. **Check logs** in Cloud Console
2. **Verify environment variables** are set (no typos!)
3. **Test Supabase connection** separately
4. **Check if service is running**: Green checkmark in Cloud Run console

## 🎯 Expected Result

After configuration:

```bash
$ curl https://procuroid-backend-369418280809.us-central1.run.app/

{
  "message": "Procuroid Backend API",
  "version": "1.0.0",
  "status": "running",
  "modules": {
    "api": "Authentication and procurement endpoints",
    "agents": "AI agent webhooks and processing"
  }
}
```

---

**Next Steps After This Works:**
1. Update frontend API URL to point to Cloud Run
2. Add Cloud Run URL to CORS allow_list in `src/main.py`
3. Set up monitoring and alerts
4. Configure custom domain (optional)

