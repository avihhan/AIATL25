"""Helper utilities for launching ElevenLabs AI calls via Twilio."""

from __future__ import annotations

import os
import requests
from typing import Any, Dict, Optional
from urllib.parse import urlencode

from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER") or "+13262223398"
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_TWILIO_ENDPOINT = os.getenv(
    "ELEVENLABS_TWILIO_ENDPOINT",
    "https://api.us.elevenlabs.io/twilio/inbound_call",
)


class ElevenLabsCallError(RuntimeError):
    """Error raised when initiating an ElevenLabs call fails."""


def _build_twilio_client() -> Client:
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        raise ElevenLabsCallError(
            "Twilio credentials are not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN."
        )

    return Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)


def _build_inbound_url(metadata: Optional[Dict[str, Any]]) -> str:
    base_url = ELEVENLABS_TWILIO_ENDPOINT.rstrip("?")

    if not metadata:
        return base_url

    if not isinstance(metadata, dict):
        raise ElevenLabsCallError("metadata must be a JSON object/dict if provided.")

    query = urlencode({k: v for k, v in metadata.items() if v is not None}, doseq=True)
    return f"{base_url}?{query}" if query else base_url


def initiate_elevenlabs_call(
    to: str,
    *,
    agent_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Trigger an outbound call via Twilio that connects to the ElevenLabs Twilio endpoint."""

    if not to:
        raise ElevenLabsCallError("Destination phone number ('to') is required.")

    if not TWILIO_FROM_NUMBER:
        raise ElevenLabsCallError("TWILIO_FROM_NUMBER environment variable is not set.")

    twilio_client = _build_twilio_client()

    # Merge agent_id into metadata so it is forwarded to ElevenLabs as a query param
    merged_metadata: Optional[Dict[str, Any]]
    if metadata is None:
        merged_metadata = {"agent_id": agent_id} if agent_id else None
    else:
        merged_metadata = dict(metadata)
        if agent_id and "agent_id" not in merged_metadata:
            merged_metadata["agent_id"] = agent_id

    target_url = _build_inbound_url(merged_metadata)

    try:
        twilio_call = twilio_client.calls.create(
            to=to,
            from_=TWILIO_FROM_NUMBER,
            url=target_url,
        )
    except Exception as exc:  # noqa: BLE001
        raise ElevenLabsCallError(f"Failed to initiate ElevenLabs call via Twilio: {exc}") from exc

    return {
        "sid": twilio_call.sid,
        "status": twilio_call.status,
        "to": twilio_call.to,
        "from": TWILIO_FROM_NUMBER,
        "uri": twilio_call.uri,
    }


def initiate_elevenlabs_call_with_twiml(
    to: str,
    *,
    agent_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    twiml_endpoint_base: str = "http://localhost:8080",
) -> Dict[str, Any]:
    """
    Trigger an outbound call via Twilio using a custom TwiML endpoint.
    This approach routes through your own backend TwiML generator first.
    
    Args:
        to: Destination phone number
        agent_id: ElevenLabs agent ID
        metadata: Additional metadata to pass
        twiml_endpoint_base: Base URL of your backend (default: localhost)
    
    Returns:
        Dict with call information (sid, status, etc.)
    """
    if not to:
        raise ElevenLabsCallError("Destination phone number ('to') is required.")
    
    if not agent_id:
        raise ElevenLabsCallError("agent_id is required for ElevenLabs calls.")

    if not TWILIO_FROM_NUMBER:
        raise ElevenLabsCallError("TWILIO_FROM_NUMBER environment variable is not set.")

    twilio_client = _build_twilio_client()

    # Build URL to your own TwiML endpoint
    params = {"agent_id": agent_id}
    if metadata:
        params.update(metadata)
    
    query = urlencode({k: v for k, v in params.items() if v is not None}, doseq=True)
    twiml_url = f"{twiml_endpoint_base}/twiml/elevenlabs?{query}"

    try:
        twilio_call = twilio_client.calls.create(
            to=to,
            from_=TWILIO_FROM_NUMBER,
            url=twiml_url,
        )
    except Exception as exc:  # noqa: BLE001
        raise ElevenLabsCallError(f"Failed to initiate call via Twilio: {exc}") from exc

    return {
        "sid": twilio_call.sid,
        "status": twilio_call.status,
        "to": twilio_call.to,
        "from": TWILIO_FROM_NUMBER,
        "uri": twilio_call.uri,
        "twiml_url": twiml_url,
    }


def initiate_elevenlabs_call_via_api(
    to: str,
    *,
    agent_id: str,
    from_number: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Initiate a call using ElevenLabs' Twilio outbound call API.
    This is the RECOMMENDED approach - ElevenLabs handles the Twilio integration internally.
    
    Flow: Your Backend → ElevenLabs API → Twilio → Target Phone Number
    
    Args:
        to: Destination phone number (E.164 format, e.g., +14709299380)
        agent_id: ElevenLabs agent ID (required)
        from_number: Twilio number connected in ElevenLabs (defaults to TWILIO_FROM_NUMBER)
        metadata: Optional metadata to pass to the agent during the call
    
    Returns:
        Dict with call information from ElevenLabs
        
    Raises:
        ElevenLabsCallError: If the API call fails
    """
    if not ELEVENLABS_API_KEY:
        raise ElevenLabsCallError("Missing ELEVENLABS_API_KEY environment variable")
    
    if not to:
        raise ElevenLabsCallError("Destination phone number ('to') is required")
    
    if not agent_id:
        raise ElevenLabsCallError("agent_id is required")
    
    # Use provided from_number or fall back to TWILIO_FROM_NUMBER
    from_num = from_number or TWILIO_FROM_NUMBER
    if not from_num:
        raise ElevenLabsCallError("from_number or TWILIO_FROM_NUMBER environment variable must be set")
    
    # ElevenLabs Conversational AI outbound call endpoint
    url = "https://api.elevenlabs.io/v1/convai/conversation/outbound_call"
    
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }
    
    payload = {
        "agent_id": agent_id,
        "phone_number": to,  # ElevenLabs uses "phone_number" not "to_number"
    }
    
    # Add metadata if provided
    if metadata:
        payload["metadata"] = metadata
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        
        return {
            "success": True,
            "call_id": result.get("call_id"),
            "status": result.get("status"),
            "to": to,
            "from": from_num,
            "agent_id": agent_id,
            "response": result
        }
        
    except requests.exceptions.HTTPError as exc:
        error_detail = "Unknown error"
        try:
            error_detail = exc.response.json()
        except:
            error_detail = exc.response.text
        
        raise ElevenLabsCallError(
            f"ElevenLabs API error (status {exc.response.status_code}): {error_detail}"
        ) from exc
        
    except requests.exceptions.RequestException as exc:
        raise ElevenLabsCallError(f"Failed to call ElevenLabs API: {exc}") from exc

