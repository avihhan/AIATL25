import os
from elevenlabs import ElevenLabs
from twilio.rest import Client as TwilioClient

class QuotationAgent:
    def __init__(self):
        # ElevenLabs client
        api_key = os.getenv("ELEVENLABS_API_KEY")
        if not api_key:
            raise ValueError("ELEVENLABS_API_KEY not set")
        self.elevenlabs_client = ElevenLabs(api_key=api_key)
        
        # Twilio client
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        if not account_sid or not auth_token:
            raise ValueError("Twilio credentials not set")
        self.twilio_client = TwilioClient(account_sid, auth_token)
        
        self.from_phone = os.getenv("TWILIO_PHONE_NUMBER")
        if not self.from_phone:
            raise ValueError("TWILIO_PHONE_NUMBER not set")
        
        print("QuotationAgent initialized")
    
    def get_quote(self, supplier, product_details):
        try:
            # Compose prompt for the quote
            quote_text = f"""
            Hello {supplier['name']},
            
            We are requesting a quotation for the following product:
            {product_details}
            
            Please provide your best quote including pricing, availability, and delivery timeline.
            Thank you.
            """
            
            # Generate speech using ElevenLabs Text-to-Speech
            # You can use a specific voice_id or use the default
            audio = self.elevenlabs_client.text_to_speech.convert(
                text=quote_text.strip(),
                voice_id="21m00Tcm4TlvDq8ikWAM",  # Default "Rachel" voice
                model_id="eleven_monolingual_v1",
                output_format="mp3_22050_32"
            )
            
            # Save the audio temporarily (optional - for debugging)
            # with open("quote_audio.mp3", "wb") as f:
            #     for chunk in audio:
            #         f.write(chunk)
            
            print(f"📜 Generated quote audio for {supplier['name']}")
            
        except Exception as e:
            print(f"✗ ElevenLabs TTS failed: {e}")
            return {
                "supplier_id": supplier["id"],
                "supplier_name": supplier["name"],
                "status": "error",
                "error": f"Failed to generate speech: {e}"
            }
        
        # Twilio call with TwiML to say the text
        try:
            call = self.twilio_client.calls.create(
                to=supplier["phone"],
                from_=self.from_phone,
                twiml=f"<Response><Say>{quote_text.strip()}</Say></Response>"
            )
            print(f"📞 Call initiated, SID: {call.sid}")
            
        except Exception as e:
            print(f"✗ Twilio call failed: {e}")
            return {
                "supplier_id": supplier["id"],
                "supplier_name": supplier["name"],
                "status": "error",
                "error": f"Twilio call failed: {e}"
            }
        
        return {
            "supplier_id": supplier["id"],
            "supplier_name": supplier["name"],
            "status": "success",
            "quote_text": quote_text.strip(),
            "call_sid": call.sid
        }