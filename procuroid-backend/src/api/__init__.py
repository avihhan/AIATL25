from flask import Blueprint, request, jsonify
from functools import wraps
import json
from datetime import datetime
from services.database import (
    verify_user_token,
    sign_up_user,
    sign_in_user,
    create_procurement_job,
    get_procurement_jobs,
    update_procurement_job,
    get_suppliers,
    create_supplier,
    update_supplier,
    delete_supplier,
    call_quotation_agent,
    update_profile,
    get_profile,
    create_order,
    get_orders,
    get_quotations,
    update_quotation,
)
from services.llm import extract_call_conclusion
from services.elevenlabs import initiate_elevenlabs_call, ElevenLabsCallError

# Create a blueprint for API routes
api_bp = Blueprint('api', __name__)

# In-memory storage (temporary)
QUOTE_REQUESTS = []


def require_auth(f):
    """
    Decorator to require authentication for a route.
    Expects Authorization header with format: Bearer <token>
    Flask-CORS handles OPTIONS requests automatically before reaching this decorator.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get the Authorization header
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({"error": "Missing authorization header"}), 401
        
        # Extract the token from "Bearer <token>"
        try:
            token = auth_header.split(' ')[1]
        except IndexError:
            return jsonify({"error": "Invalid authorization header format. Use: Bearer <token>"}), 401
        
        # Verify the token
        user_info = verify_user_token(token)
        
        if not user_info:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        # Attach user info to request context so route handlers can access it
        request.user = user_info
        
        # Call the original function
        return f(*args, **kwargs)
    
    return decorated_function


@api_bp.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Procuroid API is running"})


@api_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@api_bp.route("/auth/signup", methods=["POST"])
def signup():
    data = request.get_json()
    
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400
    
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required"}), 400
    
    # Extract user metadata if provided
    user_metadata = {}
    if data.get("firstName"):
        user_metadata["first_name"] = data.get("firstName")
    if data.get("lastName"):
        user_metadata["last_name"] = data.get("lastName")
    if data.get("firstName") or data.get("lastName"):
        user_metadata["display_name"] = f"{data.get('firstName', '')} {data.get('lastName', '')}".strip()
    
    result = sign_up_user(email, password, user_metadata if user_metadata else None)
    
    if result.get("success"):
        return jsonify(result), 201
    else:
        return jsonify(result), 400


@api_bp.route("/auth/signin", methods=["POST"])
def signin():
    data = request.get_json()
    
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400
    
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required"}), 400
    
    result = sign_in_user(email, password)
    
    if result.get("success"):
        return jsonify(result), 200
    else:
        return jsonify(result), 401


@api_bp.route("/send-quote-request/<user_id>", methods=["POST"])
@require_auth
def send_quote_request(user_id):
    data = request.get_json()
    print("Received data:", data)
    print("Authenticated user:", request.user)
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Get the authenticated user's ID from the token
    authenticated_user_id = request.user["id"]
    
    # Create the procurement job in the database
    result = create_procurement_job(authenticated_user_id, data)
    
    if result.get("success"):
        return jsonify({
            "status": "ok",
            "message": "Job created successfully",
            "job_id": result["job"]["id"],
            "user_id": authenticated_user_id
        }), 201
    else:
        return jsonify({"error": result.get("error", "Failed to create job")}), 500

@api_bp.route("/procurement-jobs", methods=["GET"])
@require_auth
def get_jobs():
    """Get all procurement jobs for the authenticated user"""
    status = request.args.get("status", None)
    result = get_procurement_jobs(request.user["id"], status)
    
    if result.get("success"):
        return jsonify(result), 200
    else:
        return jsonify(result), 500


@api_bp.route("/procurement-jobs/<job_id>", methods=["PATCH"])
@require_auth
def update_job(job_id):
    """Update a procurement job"""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Add allowed fields that can be updated
    allowed_fields = ["status", "output_result", "expires_at"]
    updates = {k: v for k, v in data.items() if k in allowed_fields}
    
    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400
    
    result = update_procurement_job(job_id, updates)
    
    if result.get("success"):
        return jsonify(result), 200
    else:
        return jsonify(result), 500


@api_bp.route("/suppliers", methods=["GET"])
@require_auth
def get_suppliers_endpoint():
    """
    Get suppliers with pagination.
    Query parameters:
    - page: Page number (default: 1)
    - page_size: Items per page (default: 10, max: 100)
    - search: Optional search term
    - sort_by: Field to sort by (default: 'name')
    - sort_order: Sort order 'asc' or 'desc' (default: 'asc')
    """
    try:
        # Get query parameters
        page = int(request.args.get("page", 1))
        page_size = int(request.args.get("page_size", 10))
        search = request.args.get("search", None)
        sort_by = request.args.get("sort_by", "name")
        sort_order = request.args.get("sort_order", "asc")
        
        # Get suppliers from database
        result = get_suppliers(
            page=page, 
            page_size=page_size, 
            search=search,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        if result.get("success"):
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    except ValueError:
        return jsonify({"error": "Invalid page or page_size parameter"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route("/suppliers", methods=["POST"])
@require_auth
def create_supplier_endpoint():
    """
    Create a new supplier.
    Request body should contain supplier information.
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        # Create supplier in database
        result = create_supplier(data)
        
        if result.get("success"):
            return jsonify(result), 201
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@api_bp.route("/suppliers/<supplier_id>", methods=["PATCH"])
@require_auth
def update_supplier_endpoint(supplier_id):
    """
    Update an existing supplier.
    Request body should contain supplier information to update.
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        # Update supplier in database
        result = update_supplier(supplier_id, data)
        
        if result.get("success"):
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@api_bp.route("/suppliers/<supplier_id>", methods=["DELETE"])
@require_auth
def delete_supplier_endpoint(supplier_id):
    """
    Delete an existing supplier.
    """
    try:
        # Delete supplier from database
        result = delete_supplier(supplier_id)
        
        if result.get("success"):
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@api_bp.route("/elevenlabs/calls", methods=["POST"])
@require_auth
def initiate_elevenlabs_call_endpoint():
    """Initiate an outbound call using the ElevenLabs Calls API."""

    data = request.get_json(silent=True) or {}

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON payload; expected an object."}), 400

    to_number = data.get("to")
    agent_id = data.get("agent_id")
    metadata = data.get("metadata")
    job_id = data.get("job_id")

    if metadata is not None and not isinstance(metadata, dict):
        return jsonify({"error": "metadata must be an object if provided."}), 400

    if not to_number:
        return jsonify({"error": "'to' (destination phone number) is required."}), 400

    metadata_payload = dict(metadata or {})
    user_id = request.user.get("id") if isinstance(request.user, dict) else None
    if user_id is not None:
        metadata_payload.setdefault("userId", user_id)

    if job_id:
        metadata_payload.setdefault("jobId", job_id)

    metadata_payload = {key: value for key, value in metadata_payload.items() if value is not None}

    try:
        call_response = initiate_elevenlabs_call(
            to_number,
            agent_id=agent_id,
            metadata=metadata_payload or None,
        )
    except ElevenLabsCallError as exc:
        return jsonify({"success": False, "error": str(exc)}), 502

    return jsonify({"success": True, "call": call_response}), 200


@api_bp.route("/quotation-agent/call", methods=["POST"])
@require_auth
def call_quotation_agent_endpoint():
    """
    Call the ElevenLabs Quotation Agent for procurement jobs.
    
    Expected payload: Array of procurement job objects:
    [
      {
        "id": "job-uuid",
        "seller_company_info": {"seller_company_name": "..."},
        "buyer_company_info": {"buyer_company_name": "..."},
        "job_info": {...}
      }
    ]
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Ensure data is a list
        if not isinstance(data, list):
            return jsonify({"error": "Expected array of procurement jobs"}), 400
        
        if len(data) == 0:
            return jsonify({"error": "Empty array provided"}), 400
        
        # Call the quotation agent function
        result = call_quotation_agent(data)
        
        if result.get("success"):
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route("/quotation-agent/webhook", methods=["POST"])
def quotation_agent_webhook():
    """
    Webhook endpoint to receive output_result from ElevenLabs Quotation Agent.
    
    Expected payload:
    {
      "job_id": "job-uuid",
      "output_result": {...},
      "status": "completed" | "failed"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        job_id = data.get("job_id")
        output_result = data.get("output_result")
        status = data.get("status", "completed")
        
        if not job_id:
            return jsonify({"error": "Missing job_id"}), 400
        
        # Update the procurement job with output_result
        updates = {
            "output_result": output_result,
            "status": status
        }
        
        result = update_procurement_job(job_id, updates)
        
        if result.get("success"):
            return jsonify({
                "success": True,
                "message": "Job updated successfully",
                "job_id": job_id
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": result.get("error", "Failed to update job")
            }), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route("/quotation-agent/transcript", methods=["POST"])
def quotation_agent_transcript():
    """
    Webhook endpoint to receive transcript data from ElevenLabs Quotation Agent.
    
    This endpoint accepts any JSON data and prints it for logging purposes.
    """
    try:
        payload = request.get_json()

        if not payload:
            return jsonify({"error": "No data provided"}), 400

        # ElevenLabs wraps the call payload in {"type", "event_timestamp", "data"}
        event_type = payload.get("type") if isinstance(payload, dict) else None
        event_timestamp = payload.get("event_timestamp") if isinstance(payload, dict) else None
        data = payload.get("data") if isinstance(payload, dict) else payload
        if not isinstance(data, dict):
            data = {}

        # Fallback for legacy format where event fields are at the top level
        event_timestamp = event_timestamp or data.get("event_timestamp")
        user_id = data.get("user_id")
        conversation_id = data.get("conversation_id")
        agent_id = data.get("agent_id")

        # Extract conversation messages that belong to the agent or user roles
        conversation = data.get("conversation")
        if isinstance(conversation, dict):
            messages = conversation.get("messages", [])
        elif isinstance(conversation, list):
            messages = conversation
        else:
            messages = []

        dialogue = []
        for message in messages:
            role = message.get("role")
            if role not in {"agent", "user"}:
                continue

            content_blocks = message.get("content", [])
            if isinstance(content_blocks, list) and content_blocks:
                for block in content_blocks:
                    text = block.get("text") if isinstance(block, dict) else None
                    if text:
                        dialogue.append({"role": role, "text": text})

            # Some payloads provide a direct message field
            direct_text = message.get("message") or message.get("text")
            if direct_text:
                dialogue.append({"role": role, "text": direct_text})

        if not dialogue:
            transcript_entries = data.get("transcript", [])
            if isinstance(transcript_entries, list):
                for entry in transcript_entries:
                    if not isinstance(entry, dict):
                        continue
                    role = entry.get("role")
                    if role not in {"agent", "user"}:
                        continue
                    text = entry.get("message") or entry.get("text")
                    if text:
                        dialogue.append({"role": role, "text": text})

        # Retrieve transcript summary from the analysis section following the webhook spec
        analysis = data.get("analysis")
        summary = None
        if isinstance(analysis, dict):
            summary = analysis.get("transcript_summary") or analysis.get("summary")

            # Some responses may nest the summary
            summary_obj = analysis.get("transcript_summary") if isinstance(analysis.get("transcript_summary"), dict) else None
            if isinstance(summary_obj, dict):
                summary = summary_obj.get("text") or summary_obj.get("summary")

        summary = summary or data.get("transcript_summary")

        # Determine call connection status
        call_success_raw = None
        if isinstance(analysis, dict):
            call_success_raw = analysis.get("call_successful")
        call_success_raw = call_success_raw or data.get("status") or data.get("call_connected")

        call_connected = None
        if isinstance(call_success_raw, bool):
            call_connected = call_success_raw
        elif isinstance(call_success_raw, str):
            call_connected = call_success_raw.lower() in {
                "success",
                "successful",
                "connected",
                "completed",
                "done",
                "true",
                "yes",
            }

        # Compute call timestamp / datetime
        metadata = data.get("metadata") if isinstance(data.get("metadata"), dict) else {}
        call_timestamp = event_timestamp or metadata.get("start_time_unix_secs")
        call_datetime_iso = None
        if call_timestamp is not None:
            try:
                call_datetime_iso = datetime.fromtimestamp(float(call_timestamp)).isoformat()
            except Exception:
                call_datetime_iso = str(call_timestamp)

        transcript_turns = [
            {
                "speaker": "Agent" if turn["role"] == "agent" else "User",
                "text": turn["text"],
            }
            for turn in dialogue
        ]

        conclusion = extract_call_conclusion(summary or "")

        call_report = {
            "call_id": conversation_id or data.get("id"),
            "call_connected": call_connected,
            "call_datetime_iso": call_datetime_iso,
            "transcript": transcript_turns,
            "summary": summary,
            "conclusion": {
                "quoted_price": conclusion.get("quoted_price"),
                "moq": conclusion.get("moq"),
                "terms_of_delivery": conclusion.get("terms_of_delivery"),
                "payment_terms": conclusion.get("payment_terms"),
                "meeting_requested": conclusion.get("meeting_requested"),
                "meeting_preferred_time": conclusion.get("meeting_preferred_time"),
                "call_success": conclusion.get("call_success"),
                "decision_reason": conclusion.get("decision_reason"),
                "important_notes": conclusion.get("important_notes"),
            },
        }

        print("📝 QUOTATION AGENT CALL REPORT")
        print(json.dumps(call_report))

        return jsonify({"success": True, "call_report": call_report}), 200

    except Exception as e:
        print(f"Error receiving transcript data: {e}")
        return jsonify({"error": str(e)}), 500


@api_bp.get("/_debug/quote-requests")
def list_quote_requests():
    return jsonify(QUOTE_REQUESTS)


@api_bp.route("/procurement-jobs/<job_id>/quotations", methods=["GET"])
@require_auth
def get_job_quotations(job_id: str):
    """
    Get all quotations for a job with AI analysis.
    Returns detailed comparison data for frontend display.
    """
    
    try:
        # Fetch all quotations for this job
        quotations = supabase.table("quotations")\
            .select("*, suppliers(*)")\
            .eq("job_id", job_id)\
            .order("comparison_metrics->overall_recommendation_score", desc=True)\
            .execute()
        
        # Fetch conversation analyses
        analyses = supabase.table("conversation_analyses")\
            .select("*")\
            .execute()
        
        # Combine data
        enriched_quotations = []
        for quote in quotations.data:
            # Find matching analysis
            analysis = next(
                (a for a in analyses.data if a["supplier_id"] == quote["supplier_id"]),
                None
            )
            
            enriched_quotations.append({
                "id": quote["id"],
                "supplier": {
                    "id": quote["supplier_id"],
                    "name": quote["supplier_name"],
                    "contact": quote.get("suppliers", {})
                },
                "quotation": quote["quotation_data"],
                "sentiment": quote.get("sentiment_data", {}),
                "metrics": quote.get("comparison_metrics", {}),
                "key_points": quote.get("key_points", []),
                "confidence_score": quote.get("confidence_score", 0),
                "full_analysis": analysis.get("analysis_data") if analysis else None,
                "status": quote["status"],
                "created_at": quote["created_at"]
            })
        
        # Calculate comparison summary
        summary = _calculate_quotation_summary(enriched_quotations)
        
        return jsonify({
            "success": True,
            "job_id": job_id,
            "quotations": enriched_quotations,
            "summary": summary,
            "count": len(enriched_quotations)
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


def _calculate_quotation_summary(quotations: List[Dict]) -> Dict:
    """Calculate summary statistics for quotations"""
    
    if not quotations:
        return {}
    
    prices = [q["quotation"]["pricing"]["total_price"] 
              for q in quotations 
              if q["quotation"].get("pricing", {}).get("total_price")]
    
    delivery_days = [q["quotation"]["delivery"]["lead_time_days"]
                     for q in quotations
                     if q["quotation"].get("delivery", {}).get("lead_time_days")]
    
    return {
        "total_quotations": len(quotations),
        "price_range": {
            "lowest": min(prices) if prices else None,
            "highest": max(prices) if prices else None,
            "average": sum(prices) / len(prices) if prices else None
        },
        "delivery_range": {
            "fastest": min(delivery_days) if delivery_days else None,
            "slowest": max(delivery_days) if delivery_days else None,
            "average": sum(delivery_days) / len(delivery_days) if delivery_days else None
        },
        "top_recommended": quotations[0] if quotations else None
    }


@api_bp.route("/procurement-jobs/<job_id>/meetings", methods=["GET"])
@require_auth
def get_job_meetings(job_id: str):
    """Get all meeting requests for a job"""
    
    try:
        meetings = supabase.table("meeting_requests")\
            .select("*, suppliers(*)")\
            .eq("job_id", job_id)\
            .order("urgency", desc=True)\
            .execute()
        
        return jsonify({
            "success": True,
            "meetings": meetings.data,
            "count": len(meetings.data)
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api_bp.route("/procurement-jobs/<job_id>/comparison", methods=["GET"])
@require_auth
def get_quotation_comparison(job_id: str):
    """
    Get side-by-side comparison of all quotations.
    Optimized for frontend comparison view.
    """
    
    try:
        quotations = supabase.table("quotations")\
            .select("*")\
            .eq("job_id", job_id)\
            .execute()
        
        # Build comparison matrix
        comparison = {
            "suppliers": [],
            "metrics": {
                "price": [],
                "delivery": [],
                "value_score": [],
                "reliability_score": [],
                "overall_score": []
            },
            "detailed_comparison": []
        }
        
        for quote in quotations.data:
            supplier_name = quote["supplier_name"]
            comparison["suppliers"].append(supplier_name)
            
            # Extract metrics
            pricing = quote["quotation_data"].get("pricing", {})
            delivery = quote["quotation_data"].get("delivery", {})
            metrics = quote.get("comparison_metrics", {})
            
            comparison["metrics"]["price"].append(pricing.get("total_price"))
            comparison["metrics"]["delivery"].append(delivery.get("lead_time_days"))
            comparison["metrics"]["value_score"].append(metrics.get("value_score"))
            comparison["metrics"]["reliability_score"].append(metrics.get("reliability_score"))
            comparison["metrics"]["overall_score"].append(metrics.get("overall_recommendation_score"))
            
            # Detailed comparison
            comparison["detailed_comparison"].append({
                "supplier": supplier_name,
                "price": pricing.get("total_price"),
                "price_per_unit": pricing.get("price_per_unit"),
                "delivery_days": delivery.get("lead_time_days"),
                "payment_terms": quote["quotation_data"].get("terms", {}).get("payment_terms"),
                "pros": metrics.get("pros", []),
                "cons": metrics.get("cons", []),
                "scores": {
                    "value": metrics.get("value_score"),
                    "reliability": metrics.get("reliability_score"),
                    "responsiveness": metrics.get("responsiveness_score"),
                    "flexibility": metrics.get("flexibility_score"),
                    "overall": metrics.get("overall_recommendation_score")
                }
            })
        
        return jsonify({
            "success": True,
            "comparison": comparison
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api_bp.route("/profile", methods=["GET"])
@require_auth
def get_job_quotations(job_id: str):
    """
    Get all quotations for a job with AI analysis.
    Returns detailed comparison data for frontend display.
    """
    
    try:
        # Fetch all quotations for this job
        quotations = supabase.table("quotations")\
            .select("*, suppliers(*)")\
            .eq("job_id", job_id)\
            .order("comparison_metrics->overall_recommendation_score", desc=True)\
            .execute()
        
        # Fetch conversation analyses
        analyses = supabase.table("conversation_analyses")\
            .select("*")\
            .execute()
        
        # Combine data
        enriched_quotations = []
        for quote in quotations.data:
            # Find matching analysis
            analysis = next(
                (a for a in analyses.data if a["supplier_id"] == quote["supplier_id"]),
                None
            )
            
            enriched_quotations.append({
                "id": quote["id"],
                "supplier": {
                    "id": quote["supplier_id"],
                    "name": quote["supplier_name"],
                    "contact": quote.get("suppliers", {})
                },
                "quotation": quote["quotation_data"],
                "sentiment": quote.get("sentiment_data", {}),
                "metrics": quote.get("comparison_metrics", {}),
                "key_points": quote.get("key_points", []),
                "confidence_score": quote.get("confidence_score", 0),
                "full_analysis": analysis.get("analysis_data") if analysis else None,
                "status": quote["status"],
                "created_at": quote["created_at"]
            })
        
        # Calculate comparison summary
        summary = _calculate_quotation_summary(enriched_quotations)
        
        return jsonify({
            "success": True,
            "job_id": job_id,
            "quotations": enriched_quotations,
            "summary": summary,
            "count": len(enriched_quotations)
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


def _calculate_quotation_summary(quotations: List[Dict]) -> Dict:
    """Calculate summary statistics for quotations"""
    
    if not quotations:
        return {}
    
    prices = [q["quotation"]["pricing"]["total_price"] 
              for q in quotations 
              if q["quotation"].get("pricing", {}).get("total_price")]
    
    delivery_days = [q["quotation"]["delivery"]["lead_time_days"]
                     for q in quotations
                     if q["quotation"].get("delivery", {}).get("lead_time_days")]
    
    return {
        "total_quotations": len(quotations),
        "price_range": {
            "lowest": min(prices) if prices else None,
            "highest": max(prices) if prices else None,
            "average": sum(prices) / len(prices) if prices else None
        },
        "delivery_range": {
            "fastest": min(delivery_days) if delivery_days else None,
            "slowest": max(delivery_days) if delivery_days else None,
            "average": sum(delivery_days) / len(delivery_days) if delivery_days else None
        },
        "top_recommended": quotations[0] if quotations else None
    }


@api_bp.route("/procurement-jobs/<job_id>/meetings", methods=["GET"])
@require_auth
def get_job_meetings(job_id: str):
    """Get all meeting requests for a job"""
    
    try:
        meetings = supabase.table("meeting_requests")\
            .select("*, suppliers(*)")\
            .eq("job_id", job_id)\
            .order("urgency", desc=True)\
            .execute()
        
        return jsonify({
            "success": True,
            "meetings": meetings.data,
            "count": len(meetings.data)
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api_bp.route("/procurement-jobs/<job_id>/comparison", methods=["GET"])
@require_auth
def get_quotation_comparison(job_id: str):
    """
    Get side-by-side comparison of all quotations.
    Optimized for frontend comparison view.
    """
    
    try:
        quotations = supabase.table("quotations")\
            .select("*")\
            .eq("job_id", job_id)\
            .execute()
        
        # Build comparison matrix
        comparison = {
            "suppliers": [],
            "metrics": {
                "price": [],
                "delivery": [],
                "value_score": [],
                "reliability_score": [],
                "overall_score": []
            },
            "detailed_comparison": []
        }
        
        for quote in quotations.data:
            supplier_name = quote["supplier_name"]
            comparison["suppliers"].append(supplier_name)
            
            # Extract metrics
            pricing = quote["quotation_data"].get("pricing", {})
            delivery = quote["quotation_data"].get("delivery", {})
            metrics = quote.get("comparison_metrics", {})
            
            comparison["metrics"]["price"].append(pricing.get("total_price"))
            comparison["metrics"]["delivery"].append(delivery.get("lead_time_days"))
            comparison["metrics"]["value_score"].append(metrics.get("value_score"))
            comparison["metrics"]["reliability_score"].append(metrics.get("reliability_score"))
            comparison["metrics"]["overall_score"].append(metrics.get("overall_recommendation_score"))
            
            # Detailed comparison
            comparison["detailed_comparison"].append({
                "supplier": supplier_name,
                "price": pricing.get("total_price"),
                "price_per_unit": pricing.get("price_per_unit"),
                "delivery_days": delivery.get("lead_time_days"),
                "payment_terms": quote["quotation_data"].get("terms", {}).get("payment_terms"),
                "pros": metrics.get("pros", []),
                "cons": metrics.get("cons", []),
                "scores": {
                    "value": metrics.get("value_score"),
                    "reliability": metrics.get("reliability_score"),
                    "responsiveness": metrics.get("responsiveness_score"),
                    "flexibility": metrics.get("flexibility_score"),
                    "overall": metrics.get("overall_recommendation_score")
                }
            })
        
        return jsonify({
            "success": True,
            "comparison": comparison
        }), 200
        
    except Exception as e:
        print(f"Exception in update_profile_endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@api_bp.route("/orders", methods=["POST"])
@require_auth
def create_order_endpoint():
    """
    Create a new order.
    Request body should contain order information.
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        # Get the authenticated user's ID from the token
        authenticated_user_id = request.user["id"]
        
        # Create order in database
        result = create_order(authenticated_user_id, data)
        
        if result.get("success"):
            return jsonify({
                "success": True,
                "message": "Order created successfully",
                "order": result["order"]
            }), 201
        else:
            return jsonify({
                "success": False,
                "error": result.get("error", "Failed to create order")
            }), 500
    except Exception as e:
        print(f"Exception in create_order_endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@api_bp.route("/orders", methods=["GET"])
@require_auth
def get_orders_endpoint():
    """
    Get all orders for the authenticated user.
    Query parameters:
    - status: Optional status filter
    """
    try:
        status = request.args.get("status", None)
        user_id = request.user["id"]
        
        result = get_orders(user_id, status)
        
        if result.get("success"):
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    except Exception as e:
        print(f"Exception in get_orders_endpoint: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@api_bp.route("/quotations", methods=["GET"])
@require_auth
def get_quotations_endpoint():
    """
    Get all quotations for the authenticated user.
    Query parameters:
    - status: Optional status filter (e.g., 'pending_approval')
    """
    try:
        status = request.args.get("status", None)
        user_id = request.user["id"]
        
        result = get_quotations(user_id, status)
        
        if result.get("success"):
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    except Exception as e:
        print(f"Exception in get_quotations_endpoint: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@api_bp.route("/quotations/<quotation_id>", methods=["PATCH"])
@require_auth
def update_quotation_endpoint(quotation_id):
    """
    Update a quotation (e.g., approve or reject).
    
    Expected payload:
    {
        "status": "approved" | "rejected"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Only allow updating status for now
        allowed_fields = ["status"]
        updates = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not updates:
            return jsonify({"error": "No valid fields to update"}), 400
        
        result = update_quotation(quotation_id, updates)
        
        if result.get("success"):
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    except Exception as e:
        print(f"Exception in update_quotation_endpoint: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
