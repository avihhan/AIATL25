# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the `procuroid-frontend` directory with the following variables:

```bash
# API Base URL (optional, will auto-detect if not set)
# For local development, uses http://localhost:8080
# For production, uses https://procuroid-369418280809.us-central1.run.app
VITE_API_BASE_URL=

# ElevenLabs API Configuration
# Get these from your ElevenLabs dashboard: https://elevenlabs.io/app/conversational-ai
VITE_ELEVENLABS_BEARER_TOKEN=your-elevenlabs-bearer-token-here
VITE_ELEVENLABS_AGENT_ID=agent_5201k5st2hbje8987zperec4w0db
VITE_ELEVENLABS_AGENT_PHONE_NUMBER_ID=phnum_4001k9kwr82jesdsn200z7t2ah7r
```

## How to Get ElevenLabs Credentials

1. **Bearer Token:**
   - Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
   - Navigate to your profile settings
   - Generate an API key
   - Copy the full bearer token (starts with `eyJ...`)

2. **Agent ID:**
   - Go to your Conversational AI agents
   - Select your agent
   - Copy the agent ID from the URL or settings (format: `agent_xxxxx`)

3. **Agent Phone Number ID:**
   - In your agent settings
   - Go to Phone Number configuration
   - Copy the phone number ID (format: `phnum_xxxxx`)

## Security Notes

- **Never commit `.env.local` to git** (it's already in .gitignore)
- Keep your bearer token secure and rotate it regularly
- Use different tokens for development and production environments

## Usage in Code

The `initiateElevenLabsCall` function automatically reads these variables:

```typescript
import { initiateElevenLabsCall } from './api/apiCalls';

// Example usage
const result = await initiateElevenLabsCall(
  '+14709299380',  // supplier phone number
  {
    productName: 'Aluminum Sheets',
    productDescription: '3 meters long and 2 millimeters thick',
    quantity: '500',
    unitOfMeasurement: 'units',
    lowerLimit: '50',
    upperLimit: '70',
    currency: 'USD',
    requiredDeliveryDate: '15th January, 2026',
    location: 'Atlanta, Georgia',
  },
  'MetalWorks Co.'  // seller company name
);

if (result.success) {
  console.log('Call initiated:', result.data);
} else {
  console.error('Call failed:', result.error);
}
```

