# Environment Variables Configuration

This document lists all environment variables used by the Procuroid Backend.

## Required Variables

### Supabase Database
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
```

**Where to find:**
- Go to your Supabase project dashboard
- Settings > API
- Copy the URL and anon/service role keys

## Optional Variables

### Server Configuration
```bash
PORT=8080                    # Port for the server (default: 8080)
PYTHON_ENV=production        # Environment: development, production
```

### ElevenLabs AI Voice
```bash
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_QUOTATION_AGENT_URL=your-agent-url
ELEVENLABS_TWILIO_ENDPOINT=your-twilio-endpoint
```

**Used for:** AI-powered voice calls to suppliers

**Where to find:**
- Sign up at [ElevenLabs](https://elevenlabs.io/)
- Go to Profile > API Keys

### Twilio SMS/Phone
```bash
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_FROM_NUMBER=+1234567890
```

**Used for:** SMS notifications and phone call integration

**Where to find:**
- Sign up at [Twilio](https://www.twilio.com/)
- Console Dashboard > Account Info

### Google AI (Gemini)
```bash
GOOGLE_API_KEY=your-google-ai-api-key
```

**Used for:** Conversation analysis with Google Gemini AI

**Where to find:**
- Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create an API key

### LLM Extraction
```bash
LLM_EXTRACTION_ENDPOINT=your-llm-endpoint
LLM_EXTRACTION_API_KEY=your-llm-api-key
LLM_EXTRACTION_MODEL=gpt-4o-mini
```

**Used for:** Advanced text extraction and analysis

### Webhook Configuration
```bash
WEBHOOK_BASE_URL=http://localhost:5000
```

**Used for:** Callback URLs for external services

**For production:** Set this to your deployed Cloud Run URL

### Testing
```bash
TEST_SUPPLIER_PHONE=+1234567890
```

**Used for:** Testing phone call functionality

## Setting Variables in Google Cloud Run

### Via Console:
1. Go to Cloud Run > Select your service
2. Click "Edit & Deploy New Revision"
3. Go to "Variables & Secrets" tab
4. Add each variable

### Via gcloud CLI:
```bash
gcloud run services update procuroid-backend \
  --region us-central1 \
  --set-env-vars "SUPABASE_URL=https://your-url,SUPABASE_KEY=your-key"
```

### Via cloudbuild.yaml:
```yaml
- '--set-env-vars'
- 'SUPABASE_URL=your-url,SUPABASE_KEY=your-key'
```

## Using Secrets (Recommended for Sensitive Data)

### Create a secret:
```bash
echo -n "your-secret-value" | gcloud secrets create SECRET_NAME --data-file=-
```

### Grant access:
```bash
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Use in Cloud Run:
```bash
gcloud run services update procuroid-backend \
  --region us-central1 \
  --set-secrets "SUPABASE_KEY=SECRET_NAME:latest"
```

## Local Development

Create a `.env` file in the `procuroid-backend` directory:

```bash
# Copy the template
cp ENV_VARIABLES.md .env

# Edit with your values
nano .env
```

The Flask app automatically loads `.env` files using `python-dotenv`.

## Security Best Practices

1. ✅ **Never commit** `.env` files to git (already in .gitignore)
2. ✅ **Use Secret Manager** for production secrets
3. ✅ **Rotate keys** regularly
4. ✅ **Use service accounts** with minimal permissions
5. ✅ **Enable Cloud Audit Logs** for secret access monitoring

## Minimal Configuration

To run the backend with basic functionality, you only need:

```bash
SUPABASE_URL=your-url
SUPABASE_KEY=your-key
SUPABASE_SERVICE_KEY=your-service-key
PORT=8080
```

All other variables are optional and enable additional features.

