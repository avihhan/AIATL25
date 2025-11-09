from flask import Blueprint, request, Response
import os

twiml_bp = Blueprint('twiml', __name__, url_prefix='/twiml')

@twiml_bp.route('/elevenlabs-connect', methods=['POST', 'GET'])
def elevenlabs_connect():
    """
    TwiML endpoint that connects Twilio call to ElevenLabs WebSocket
    This is called when a call is initiated to start the AI conversation
    """
    signed_url = request.args.get('url')
    
    if not signed_url:
        return Response(
            '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Connection error. Please try again later.</Say></Response>',
            mimetype='text/xml'
        )
    
    print(f"📞 Connecting call to ElevenLabs WebSocket: {signed_url[:50]}...")
    
    # TwiML to connect to ElevenLabs WebSocket
    twiml = f'''<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="{signed_url}" />
    </Connect>
</Response>'''
    
    return Response(twiml, mimetype='text/xml')


@twiml_bp.route('/elevenlabs-stream', methods=['POST', 'GET'])
def elevenlabs_stream():
    """
    Alternative TwiML endpoint for streaming with agent ID
    """
    agent_id = request.args.get('agent_id')
    
    if not agent_id:
        return Response(
            '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Agent configuration error.</Say></Response>',
            mimetype='text/xml'
        )
    
    # Build WebSocket URL for ElevenLabs
    elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
    ws_url = f"wss://api.elevenlabs.io/v1/convai/conversation?agent_id={agent_id}"
    
    print(f"📞 Streaming call to agent: {agent_id}")
    
    twiml = f'''<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="{ws_url}">
            <Parameter name="api_key" value="{elevenlabs_api_key}" />
        </Stream>
    </Connect>
</Response>'''
    
    return Response(twiml, mimetype='text/xml')


@twiml_bp.route('/webhook/call-status', methods=['POST'])
def call_status_webhook():
    """
    Webhook to receive Twilio call status updates
    Twilio will POST here with call status changes
    """
    call_sid = request.form.get('CallSid')
    call_status = request.form.get('CallStatus')
    duration = request.form.get('CallDuration', '0')
    from_number = request.form.get('From')
    to_number = request.form.get('To')
    
    print(f"📞 Call Status Update:")
    print(f"   SID: {call_sid}")
    print(f"   Status: {call_status}")
    print(f"   Duration: {duration}s")
    print(f"   From: {from_number} → To: {to_number}")
    
    # TODO: Update database with call status
    # Example:
    # from database.supabase_client import SupabaseClient
    # db = SupabaseClient()
    # db.update_call_by_sid(call_sid, {
    #     'call_status': call_status,
    #     'call_duration': int(duration)
    # })
    
    return {'status': 'received'}, 200


@twiml_bp.route('/simple-say', methods=['POST', 'GET'])
def simple_say():
    """
    Simple TwiML endpoint for testing
    Speaks a message and hangs up
    """
    message = request.args.get('message', 'Hello, this is a test call.')
    
    twiml = f'''<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>{message}</Say>
</Response>'''
    
    return Response(twiml, mimetype='text/xml')
