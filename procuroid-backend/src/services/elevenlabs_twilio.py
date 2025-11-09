"""
Simple and clean Twilio + ElevenLabs integration.
This module handles making automated calls using Twilio that connect to ElevenLabs agents.
"""

import os
from typing import Dict, Any, Optional
from urllib.parse import urlencode
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Connect
from dotenv import load_dotenv

load_dotenv()


class CallError(Exception):
    """Raised when call initiation fails."""
    pass


def initiate_call(
    to_number: str,
    agent_id: str,
    metadata: Optional[Dict[str, Any]] = None,
    from_number: Optional[str] = None
) -> Dict[str, Any]:
    """
    Initiate an outbound call that connects to an ElevenLabs agent.
    
    Args:
        to_number: Phone number to call (E.164 format, e.g. +14155551234)
        agent_id: ElevenLabs agent ID
        metadata: Optional metadata to pass to the agent
        from_number: Optional Twilio number to use (defaults to env var)
        
    Returns:
        Dict with call information including call SID and status
        
    Raises:
        CallError: If call initiation fails
    """
    # Get Twilio credentials
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_number = from_number or os.getenv("TWILIO_FROM_NUMBER")
    
    # Get backend webhook URL (where this app is hosted)
    webhook_base_url = os.getenv("WEBHOOK_BASE_URL", "http://localhost:8080")
    
    # Validate
    if not account_sid or not auth_token:
        raise CallError("Missing Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)")
    if not twilio_number:
        raise CallError("Missing TWILIO_FROM_NUMBER")
    if not to_number:
        raise CallError("Destination phone number required")
    if not agent_id:
        raise CallError("ElevenLabs agent_id required")
    
    # Build webhook URL with parameters
    # This webhook will be called by Twilio when the call is answered
    webhook_params = {
        "agent_id": agent_id,
    }
    
    # Add metadata as query parameters
    if metadata:
        for key, value in metadata.items():
            if value is not None:
                webhook_params[f"meta_{key}"] = str(value)
    
    webhook_url = f"{webhook_base_url}/elevenlabs/twiml?{urlencode(webhook_params)}"
    
    # Initiate call via Twilio
    try:
        client = Client(account_sid, auth_token)
        call = client.calls.create(
            to=to_number,
            from_=twilio_number,
            url=webhook_url,
            method="POST",
            status_callback=f"{webhook_base_url}/elevenlabs/call-status",
            status_callback_event=["initiated", "ringing", "answered", "completed"],
            status_callback_method="POST"
        )
        
        return {
            "success": True,
            "call_sid": call.sid,
            "status": call.status,
            "to": to_number,
            "from": twilio_number,
            "agent_id": agent_id,
            "webhook_url": webhook_url
        }
        
    except Exception as e:
        raise CallError(f"Failed to initiate call: {str(e)}")


def generate_twiml(agent_id: str, metadata: Optional[Dict[str, Any]] = None) -> str:
    """
    Generate TwiML that connects the call to an ElevenLabs agent.
    
    Args:
        agent_id: ElevenLabs agent ID
        metadata: Optional metadata to pass to the agent
        
    Returns:
        TwiML XML string
    """
    response = VoiceResponse()
    
    # Build ElevenLabs endpoint URL with agent_id and metadata
    elevenlabs_params = {"agent_id": agent_id}
    
    if metadata:
        elevenlabs_params.update(metadata)
    
    # ElevenLabs WebSocket endpoint for Twilio
    elevenlabs_url = f"wss://api.elevenlabs.io/v1/convai/conversation?{urlencode(elevenlabs_params)}"
    
    # Connect to ElevenLabs via Stream
    connect = Connect()
    connect.stream(url=elevenlabs_url)
    response.append(connect)
    
    return str(response)
