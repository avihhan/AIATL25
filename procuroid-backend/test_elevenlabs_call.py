"""
Test script to make an ElevenLabs call via Twilio
"""
import time
from twilio.rest import Client

# Twilio credentials
TWILIO_ACCOUNT_SID = 'ACef652ac8a3a534e6a6118b79d3a25b01'
TWILIO_AUTH_TOKEN = 'f87fab58cf9f38c0fa206e00a66a8c5f'

# Phone numbers
FROM_NUMBER = '+13262223398'
TO_NUMBER = '+14709299380'

# ElevenLabs agent ID
ELEVENLABS_AGENT_ID = 'agent_5201k5st2hbje8987zperec4w0db'

def make_call():
    try:
        # Initialize Twilio client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        # Step 1: Initiate call via Twilio
        # The URL points to ElevenLabs TwiML endpoint that will handle the agent
        call = client.calls.create(
            to=TO_NUMBER,
            from_=FROM_NUMBER,
            url=f'https://api.elevenlabs.io/v1/convai/twilio/{ELEVENLABS_AGENT_ID}'
        )
        
        print(f'Call SID: {call.sid}')
        print(f'Status: {call.status}')
        
        # Step 2: Poll call status until it becomes "in-progress"
        status = call.status
        
        while status not in ['in-progress', 'completed', 'failed', 'canceled', 'no-answer', 'busy']:
            time.sleep(2)  # wait 2 seconds
            updated_call = client.calls(call.sid).fetch()
            status = updated_call.status
            print(f'Call status: {status}')
        
        if status == 'in-progress':
            print('✅ ElevenLabs agent is now live on the call!')
        else:
            print(f'⚠️  Call ended or failed with status: {status}')
            
    except Exception as err:
        print(f'❌ Error making call: {err}')

if __name__ == '__main__':
    print('🔄 Initiating ElevenLabs call via Twilio...')
    make_call()

