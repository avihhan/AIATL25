import os
import requests
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Optional, Dict, List, Any

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url: str = os.getenv("SUPABASE_URL", "")
supabase_key: str = os.getenv("SUPABASE_KEY", "")
supabase_service_key: str = os.getenv("SUPABASE_SERVICE_KEY", "")

# Create Supabase client instance with anon key for public operations
# Only create clients if credentials are provided, otherwise they'll be None
try:
    if supabase_url and supabase_key:
        supabase: Client = create_client(supabase_url, supabase_key)
    else:
        supabase = None
        print("Warning: SUPABASE_URL and SUPABASE_KEY not set. Authentication features will be disabled.")
except Exception as e:
    print(f"Warning: Failed to create Supabase client: {e}")
    supabase = None

try:
    if supabase_url and supabase_service_key:
        supabase_admin: Client = create_client(supabase_url, supabase_service_key)
    else:
        supabase_admin = None
except Exception as e:
    print(f"Warning: Failed to create Supabase admin client: {e}")
    supabase_admin = None


def verify_user_token(token: str) -> Optional[dict]:
    """
    Verify a user's JWT token and return their user information.
    
    Args:
        token: The JWT token from the Authorization header
        
    Returns:
        dict: User information if token is valid, None otherwise
    """
    try:
        if not supabase:
            print("Supabase client not initialized")
            return None
        
        # Verify the JWT token using Supabase
        response = supabase.auth.get_user(token)
        
        if response.user:
            return {
                "id": response.user.id,
                "email": response.user.email,
                "user_metadata": response.user.user_metadata,
            }
        return None
    except Exception as e:
        print(f"Token verification error: {e}")
        return None


def get_user_by_id(user_id: str) -> Optional[dict]:
    """
    Get user information by user ID using admin client.
    
    Args:
        user_id: The Supabase user ID
        
    Returns:
        dict: User information if found, None otherwise
    """
    try:
        response = supabase_admin.auth.admin.get_user_by_id(user_id)
        if response.user:
            return {
                "id": response.user.id,
                "email": response.user.email,
                "user_metadata": response.user.user_metadata,
            }
        return None
    except Exception as e:
        print(f"Error fetching user: {e}")
        return None


def sign_up_user(email: str, password: str, user_metadata: Optional[dict] = None) -> dict:
    """
    Sign up a new user with email and password.
    
    Args:
        email: User's email address
        password: User's password
        user_metadata: Optional metadata dictionary (e.g., first_name, last_name)
        
    Returns:
        dict: Response with user and session data or error message
    """
    try:
        if not supabase:
            return {"success": False, "error": "Supabase client not initialized"}
        
        # Build the sign up payload with metadata if provided
        sign_up_payload = {
            "email": email,
            "password": password,
        }
        
        if user_metadata:
            sign_up_payload["options"] = {"data": user_metadata}
        
        response = supabase.auth.sign_up(sign_up_payload)
        
        if response.user:
            return {
                "success": True,
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "user_metadata": response.user.user_metadata,
                },
                "message": "User created successfully. Check your email to confirm your account."
            }
        return {"success": False, "error": "Failed to create user"}
    except Exception as e:
        print(f"Sign up error: {e}")
        return {"success": False, "error": str(e)}


def sign_in_user(email: str, password: str) -> dict:
    """
    Sign in an existing user with email and password.
    
    Args:
        email: User's email address
        password: User's password
        
    Returns:
        dict: Response with user, session (including access_token) or error message
    """
    try:
        if not supabase:
            return {"success": False, "error": "Supabase client not initialized"}
        
        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password,
        })
        
        if response.user and response.session:
            return {
                "success": True,
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "user_metadata": response.user.user_metadata,
                },
                "session": {
                    "access_token": response.session.access_token,
                    "refresh_token": response.session.refresh_token,
                    "expires_at": response.session.expires_at,
                    "expires_in": response.session.expires_in,
                }
            }
        return {"success": False, "error": "Invalid credentials"}
    except Exception as e:
        print(f"Sign in error: {e}")
        return {"success": False, "error": str(e)}


def create_procurement_job(user_id: str, job_info: dict, expires_at: Optional[str] = None) -> dict:
    """
    Create a new procurement job in the procurement_jobs table.
    
    Args:
        user_id: The user's UUID
        job_info: The full job details as JSON
        expires_at: Optional expiration timestamp (defaults to now + 30 minutes)
        
    Returns:
        dict: Response with job data or error message
    """
    try:
        if not supabase_admin:
            return {"success": False, "error": "Supabase admin client not initialized"}
        
        # Prepare the job data
        job_data = {
            "user_id": user_id,
            "job_info": job_info,
            "status": "pending"
        }
        
        # Add expires_at if provided
        if expires_at:
            job_data["expires_at"] = expires_at
        
        # Insert into procurement_jobs table using admin client to bypass RLS
        response = supabase_admin.table("procurement_jobs").insert(job_data).execute()
        
        if response.data and len(response.data) > 0:
            return {
                "success": True,
                "job": response.data[0]
            }
        return {"success": False, "error": "Failed to create job"}
    except Exception as e:
        print(f"Create procurement job error: {e}")
        return {"success": False, "error": str(e)}


def get_procurement_jobs(user_id: str, status: Optional[str] = None) -> dict:
    """
    Get procurement jobs for a user, optionally filtered by status.
    
    Args:
        user_id: The user's UUID
        status: Optional status filter
        
    Returns:
        dict: Response with jobs or error message
    """
    try:
        if not supabase_admin:
            return {"success": False, "error": "Supabase admin client not initialized"}
        
        query = supabase_admin.table("procurement_jobs").select("*").eq("user_id", user_id)
        
        if status:
            query = query.eq("status", status)
        
        response = query.execute()
        
        return {
            "success": True,
            "jobs": response.data
        }
    except Exception as e:
        print(f"Get procurement jobs error: {e}")
        return {"success": False, "error": str(e)}


def update_procurement_job(job_id: str, updates: dict) -> dict:
    """
    Update a procurement job.
    
    Args:
        job_id: The job UUID
        updates: Dictionary of fields to update
        
    Returns:
        dict: Response with updated job data or error message
    """
    try:
        if not supabase_admin:
            return {"success": False, "error": "Supabase admin client not initialized"}
        
        response = supabase_admin.table("procurement_jobs").update(updates).eq("id", job_id).execute()
        
        if response.data and len(response.data) > 0:
            return {
                "success": True,
                "job": response.data[0]
            }
        return {"success": False, "error": "Failed to update job"}
    except Exception as e:
        print(f"Update procurement job error: {e}")
        return {"success": False, "error": str(e)}


def call_quotation_agent(procurement_jobs: List[Dict[str, Any]]) -> dict:
    """
    Call the ElevenLabs Quotation Agent for each procurement job.
    
    Args:
        procurement_jobs: List of procurement job objects, each containing:
            - id: Job UUID
            - seller_company_info: Dict with seller_company_name
            - buyer_company_info: Dict with buyer_company_name
            - job_info: Dict with job details
    
    Returns:
        dict: Response with success status and any errors
    """
    try:
        # Get ElevenLabs Quotation Agent URL from environment
        quotation_agent_url = os.getenv("ELEVENLABS_QUOTATION_AGENT_URL")
        
        if not quotation_agent_url:
            return {"success": False, "error": "ELEVENLABS_QUOTATION_AGENT_URL not configured"}
        
        results = []
        errors = []
        
        for job in procurement_jobs:
            job_id = job.get("id")
            if not job_id:
                errors.append({"job": job, "error": "Missing job id"})
                continue
            
            try:
                # Extract required information
                seller_company_name = job.get("seller_company_info", {}).get("seller_company_name")
                buyer_company_name = job.get("buyer_company_info", {}).get("buyer_company_name")
                job_info = job.get("job_info", {})
                
                if not seller_company_name or not buyer_company_name:
                    errors.append({
                        "job_id": job_id,
                        "error": "Missing seller_company_name or buyer_company_name"
                    })
                    continue
                
                # Get webhook URL for callback (where ElevenLabs will send the result)
                webhook_base_url = os.getenv("WEBHOOK_BASE_URL", "http://localhost:5000")
                webhook_url = f"{webhook_base_url}/quotation-agent/webhook"
                
                # Prepare payload for ElevenLabs Quotation Agent
                agent_payload = {
                    "job_id": job_id,
                    "seller_company_name": seller_company_name,
                    "buyer_company_name": buyer_company_name,
                    "job_info": job_info,
                    "webhook_url": webhook_url  # URL where ElevenLabs will POST the output_result
                }
                
                # Call ElevenLabs Quotation Agent API
                response = requests.post(
                    quotation_agent_url,
                    json=agent_payload,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {os.getenv('ELEVENLABS_API_KEY', '')}"
                    },
                    timeout=300  # 5 minute timeout for long-running calls
                )
                
                if response.status_code == 200 or response.status_code == 202:
                    # Agent accepted the request (202 = accepted, 200 = immediate result)
                    result_data = response.json() if response.text else {}
                    
                    # If the agent returns output_result immediately, update the job
                    if "output_result" in result_data:
                        update_result = update_procurement_job(job_id, {
                            "output_result": result_data["output_result"],
                            "status": "completed"
                        })
                        if not update_result.get("success"):
                            errors.append({
                                "job_id": job_id,
                                "error": f"Failed to update job: {update_result.get('error')}"
                            })
                    
                    results.append({
                        "job_id": job_id,
                        "status": "accepted",
                        "message": "Quotation agent processing"
                    })
                else:
                    errors.append({
                        "job_id": job_id,
                        "error": f"Agent API returned status {response.status_code}: {response.text}"
                    })
                    
            except requests.exceptions.RequestException as e:
                errors.append({
                    "job_id": job_id,
                    "error": f"Network error calling quotation agent: {str(e)}"
                })
            except Exception as e:
                errors.append({
                    "job_id": job_id,
                    "error": f"Error processing job: {str(e)}"
                })
        
        return {
            "success": len(errors) == 0,
            "results": results,
            "errors": errors if errors else None
        }
        
    except Exception as e:
        print(f"Call quotation agent error: {e}")
        return {"success": False, "error": str(e)}


def get_suppliers(
    page: int = 1, 
    page_size: int = 10, 
    search: Optional[str] = None,
    sort_by: str = "name",
    sort_order: str = "asc"
) -> dict:
    """
    Get suppliers from supplier table with pagination, optional search, and sorting.
    
    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page (default 10, max 100)
        search: Optional search term to filter by supplier name or other fields
        sort_by: Field to sort by (default: 'name')
        sort_order: Sort order 'asc' or 'desc' (default: 'asc')
        
    Returns:
        dict: Response with suppliers, pagination metadata, or error message
    """
    try:
        if not supabase_admin:
            return {"success": False, "error": "Supabase admin client not initialized"}
        
        # Validate and limit page_size
        page_size = min(max(1, page_size), 100)
        page = max(1, page)
        
        # Calculate offset
        offset = (page - 1) * page_size
        
        # Build query
        query = supabase_admin.table("suppliers").select("*", count="exact")
        
        # Add search filter if provided (adjust column names as needed)
        if search:
            # Search across common supplier fields using OR conditions
            # Supabase Python client or_() method expects PostgREST filter format
            # Format: "column1.ilike.pattern,column2.ilike.pattern"
            search_pattern = f"%{search}%"
            # Use or_ with proper PostgREST filter format
            # The or_ method expects filters in the format: "col1.op.val1,col2.op.val2"
            # Note: The % characters need to be URL encoded, but Supabase client should handle this
            try:
                # Build the filter string for OR search
                # Format: "column1.ilike.pattern,column2.ilike.pattern"
                filter_string = f"company_name.ilike.{search_pattern},contact_person.ilike.{search_pattern},email.ilike.{search_pattern}"
                query = query.or_(filter_string)
            except Exception as e:
                # If or_ fails, use a simpler approach - search only company_name
                print(f"OR search failed: {e}, falling back to single field search")
                query = query.ilike("company_name", search_pattern)
        
        # Map frontend sort field names to database column names
        sort_field_map = {
            "name": "company_name",
            "rating": "rating",
            "status": "status",
            "total_orders": "total_orders",
            "created_at": "created_at"
        }
        
        # Get the database column name, default to company_name
        db_sort_field = sort_field_map.get(sort_by, "company_name")
        desc = sort_order.lower() == "desc"
        
        # Apply sorting
        query = query.order(db_sort_field, desc=desc)
        
        # Apply pagination
        query = query.range(offset, offset + page_size - 1)
        
        # Execute query
        response = query.execute()
        
        # Calculate total pages
        total_count = response.count if hasattr(response, 'count') and response.count else len(response.data)
        total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 0
        
        return {
            "success": True,
            "suppliers": response.data,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_count": total_count,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1
            }
        }
    except Exception as e:
        print(f"Get suppliers error: {e}")
        return {"success": False, "error": str(e)}


def create_supplier(supplier_data: dict) -> dict:
    """
    Create a new supplier in the supplier database.
    
    Args:
        supplier_data: Dictionary containing supplier information
        
    Returns:
        dict: Response with created supplier or error message
    """
    try:
        if not supabase_admin:
            return {"success": False, "error": "Supabase admin client not initialized"}
        
        # Prepare the data for insertion
        insert_data = {}
        
        # Required field
        if not supplier_data.get("company_name"):
            return {"success": False, "error": "company_name is required"}
        insert_data["company_name"] = supplier_data["company_name"]
        
        # Optional basic info fields
        if supplier_data.get("contact_person"):
            insert_data["contact_person"] = supplier_data["contact_person"]
        if supplier_data.get("email"):
            insert_data["email"] = supplier_data["email"]
        if supplier_data.get("phone_number"):
            insert_data["phone_number"] = supplier_data["phone_number"]
        if supplier_data.get("address"):
            insert_data["address"] = supplier_data["address"]
        if supplier_data.get("country"):
            insert_data["country"] = supplier_data["country"]
        if supplier_data.get("website"):
            insert_data["website"] = supplier_data["website"]
        if supplier_data.get("image_url"):
            insert_data["image_url"] = supplier_data["image_url"]
        
        # Supplier classification
        if supplier_data.get("supplier_type"):
            insert_data["supplier_type"] = supplier_data["supplier_type"]
        if supplier_data.get("category"):
            insert_data["category"] = supplier_data["category"]
        if supplier_data.get("product_keywords"):
            insert_data["product_keywords"] = supplier_data["product_keywords"]
        
        # Capabilities & Compliance
        if supplier_data.get("product_certifications"):
            insert_data["product_certifications"] = supplier_data["product_certifications"]
        if supplier_data.get("min_order_quantity") is not None:
            insert_data["min_order_quantity"] = supplier_data["min_order_quantity"]
        if supplier_data.get("delivery_regions"):
            insert_data["delivery_regions"] = supplier_data["delivery_regions"]
        if supplier_data.get("average_lead_time"):
            insert_data["average_lead_time"] = supplier_data["average_lead_time"]
        
        # Pricing Info
        if supplier_data.get("currency"):
            insert_data["currency"] = supplier_data["currency"]
        if supplier_data.get("typical_unit_price") is not None:
            insert_data["typical_unit_price"] = supplier_data["typical_unit_price"]
        if supplier_data.get("negotiation_flexibility"):
            insert_data["negotiation_flexibility"] = supplier_data["negotiation_flexibility"]
        
        # Communication
        if supplier_data.get("preferred_contact_method"):
            insert_data["preferred_contact_method"] = supplier_data["preferred_contact_method"]
        
        # Insert the supplier
        response = supabase_admin.table("suppliers").insert(insert_data).execute()
        
        if response.data and len(response.data) > 0:
            return {
                "success": True,
                "supplier": response.data[0]
            }
        else:
            return {"success": False, "error": "Failed to create supplier"}
            
    except Exception as e:
        print(f"Create supplier error: {e}")
        return {"success": False, "error": str(e)}


def update_supplier(supplier_id: str, supplier_data: dict) -> dict:
    """
    Update an existing supplier in the supplier database.
    
    Args:
        supplier_id: The ID of the supplier to update
        supplier_data: Dictionary containing supplier information to update
        
    Returns:
        dict: Response with updated supplier or error message
    """
    try:
        if not supabase_admin:
            return {"success": False, "error": "Supabase admin client not initialized"}
        
        # Prepare the data for update
        update_data = {}
        
        # Optional basic info fields
        if supplier_data.get("company_name"):
            update_data["company_name"] = supplier_data["company_name"]
        if supplier_data.get("contact_person"):
            update_data["contact_person"] = supplier_data["contact_person"]
        if supplier_data.get("email"):
            update_data["email"] = supplier_data["email"]
        if supplier_data.get("phone_number"):
            update_data["phone_number"] = supplier_data["phone_number"]
        if supplier_data.get("address"):
            update_data["address"] = supplier_data["address"]
        if supplier_data.get("country"):
            update_data["country"] = supplier_data["country"]
        if supplier_data.get("website"):
            update_data["website"] = supplier_data["website"]
        if supplier_data.get("image_url"):
            update_data["image_url"] = supplier_data["image_url"]
        
        # Supplier classification
        if supplier_data.get("supplier_type"):
            update_data["supplier_type"] = supplier_data["supplier_type"]
        if supplier_data.get("category"):
            update_data["category"] = supplier_data["category"]
        if supplier_data.get("product_keywords"):
            update_data["product_keywords"] = supplier_data["product_keywords"]
        
        # Capabilities & Compliance
        if supplier_data.get("product_certifications"):
            update_data["product_certifications"] = supplier_data["product_certifications"]
        if supplier_data.get("min_order_quantity") is not None:
            update_data["min_order_quantity"] = supplier_data["min_order_quantity"]
        if supplier_data.get("delivery_regions"):
            update_data["delivery_regions"] = supplier_data["delivery_regions"]
        if supplier_data.get("average_lead_time"):
            update_data["average_lead_time"] = supplier_data["average_lead_time"]
        
        # Pricing Info
        if supplier_data.get("currency"):
            update_data["currency"] = supplier_data["currency"]
        if supplier_data.get("typical_unit_price") is not None:
            update_data["typical_unit_price"] = supplier_data["typical_unit_price"]
        if supplier_data.get("negotiation_flexibility"):
            update_data["negotiation_flexibility"] = supplier_data["negotiation_flexibility"]
        
        # Communication
        if supplier_data.get("preferred_contact_method"):
            update_data["preferred_contact_method"] = supplier_data["preferred_contact_method"]
        
        # Update the supplier
        response = supabase_admin.table("suppliers").update(update_data).eq("id", supplier_id).execute()
        
        if response.data and len(response.data) > 0:
            return {
                "success": True,
                "supplier": response.data[0]
            }
        else:
            return {"success": False, "error": "Supplier not found or failed to update"}
            
    except Exception as e:
        print(f"Update supplier error: {e}")
        return {"success": False, "error": str(e)}


def delete_supplier(supplier_id: str) -> dict:
    """
    Delete a supplier from the supplier database.
    
    Args:
        supplier_id: The ID of the supplier to delete
        
    Returns:
        dict: Response with success status or error message
    """
    try:
        if not supabase_admin:
            return {"success": False, "error": "Supabase admin client not initialized"}
        
        # Delete the supplier
        response = supabase_admin.table("suppliers").delete().eq("id", supplier_id).execute()
        
        # Check if deletion was successful
        # If response.data exists and is empty, it means the record was deleted
        # If response.data is None or empty list, the record might not have existed
        if response.data is not None:
            return {
                "success": True,
                "message": "Supplier deleted successfully"
            }
        else:
            return {"success": False, "error": "Supplier not found"}
            
    except Exception as e:
        print(f"Delete supplier error: {e}")
        return {"success": False, "error": str(e)}


def update_profile(user_id: str, profile_data: dict) -> dict:
    """
    Update a user's profile in the profiles table.
    
    Args:
        user_id: The user's UUID
        profile_data: Dictionary containing profile information to update
            - display_name: Optional display name
            - first_name: Optional first name
            - last_name: Optional last name
            - theme: Optional theme preference ('light', 'dark', 'system')
            - density: Optional density preference ('comfortable', 'compact')
            - language: Optional language preference
            - timezone: Optional timezone
            - notifications: Optional notifications settings (JSONB)
            - two_factor_enabled: Optional two-factor authentication flag
        
    Returns:
        dict: Response with updated profile or error message
    """
    try:
        if not supabase_admin:
            return {"success": False, "error": "Supabase admin client not initialized"}
        
        # Prepare the data for update
        # Start with basic fields that should always exist
        update_data = {}
        
        # Basic profile fields (should exist in all profiles tables)
        if "display_name" in profile_data:
            update_data["display_name"] = profile_data["display_name"] if profile_data["display_name"] else None
        if "first_name" in profile_data:
            update_data["first_name"] = profile_data["first_name"] if profile_data["first_name"] else None
        if "last_name" in profile_data:
            update_data["last_name"] = profile_data["last_name"] if profile_data["last_name"] else None
        
        # Extended fields (may not exist if migration hasn't been run)
        # We'll try to update these, but if they fail, we'll fall back to basic fields only
        extended_fields = {}
        if "theme" in profile_data:
            extended_fields["theme"] = profile_data["theme"]
        if "density" in profile_data:
            extended_fields["density"] = profile_data["density"]
        if "language" in profile_data:
            extended_fields["language"] = profile_data["language"]
        if "timezone" in profile_data:
            extended_fields["timezone"] = profile_data["timezone"]
        if "notifications" in profile_data:
            extended_fields["notifications"] = profile_data["notifications"]
        if "two_factor_enabled" in profile_data:
            extended_fields["two_factor_enabled"] = profile_data["two_factor_enabled"]
        
        # Merge extended fields into update_data
        update_data.update(extended_fields)
        
        # If no fields to update, return error
        if not update_data:
            return {"success": False, "error": "No valid fields to update"}
        
        # Update the profile
        # First, try to update with all fields (including extended fields)
        print(f"Attempting to update profile with data: {update_data}")
        try:
            response = supabase_admin.table("profiles").update(update_data).eq("id", user_id).execute()
        except Exception as e:
            # If update fails due to missing columns, try with only basic fields
            error_str = str(e)
            error_dict = {}
            if hasattr(e, '__dict__'):
                error_dict = e.__dict__
            elif isinstance(e, dict):
                error_dict = e
            
            # Check if it's a column not found error
            is_column_error = (
                "PGRST204" in error_str or 
                "column" in error_str.lower() or 
                "schema cache" in error_str.lower() or
                (isinstance(error_dict, dict) and error_dict.get("code") == "PGRST204")
            )
            
            if is_column_error:
                print(f"Extended columns not found, falling back to basic fields only. Error: {error_str}")
                # Remove extended fields and try again with only basic fields
                basic_update_data = {
                    k: v for k, v in update_data.items() 
                    if k in ["display_name", "first_name", "last_name"]
                }
                if not basic_update_data:
                    return {
                        "success": False, 
                        "error": "Database migration required. Please run the migration to add profile settings columns (theme, density, language, timezone, notifications, two_factor_enabled). See RUN_MIGRATION.md for instructions."
                    }
                print(f"Retrying with basic fields only: {basic_update_data}")
                try:
                    response = supabase_admin.table("profiles").update(basic_update_data).eq("id", user_id).execute()
                except Exception as retry_error:
                    error_msg = f"Failed to update profile even with basic fields: {str(retry_error)}"
                    print(error_msg)
                    return {"success": False, "error": error_msg}
            else:
                # Re-raise if it's a different error
                raise
        
        # Check for errors in the response
        if hasattr(response, 'error') and response.error:
            error_msg = f"Supabase error: {response.error}"
            print(error_msg)
            return {"success": False, "error": error_msg}
        
        if response.data and len(response.data) > 0:
            print(f"Profile updated successfully: {response.data[0]}")
            return {
                "success": True,
                "profile": response.data[0]
            }
        else:
            # Profile might not exist, try to create it
            print(f"Profile not found, attempting to create with data: {update_data}")
            insert_data = {"id": user_id}
            insert_data.update(update_data)
            insert_response = supabase_admin.table("profiles").insert(insert_data).execute()
            
            # Check for errors in the insert response
            if hasattr(insert_response, 'error') and insert_response.error:
                error_msg = f"Supabase insert error: {insert_response.error}"
                print(error_msg)
                return {"success": False, "error": error_msg}
            
            if insert_response.data and len(insert_response.data) > 0:
                print(f"Profile created successfully: {insert_response.data[0]}")
                return {
                    "success": True,
                    "profile": insert_response.data[0]
                }
            else:
                error_msg = "Failed to update or create profile - no data returned"
                print(error_msg)
                return {"success": False, "error": error_msg}
            
    except Exception as e:
        error_msg = f"Update profile exception: {str(e)}"
        print(error_msg)
        import traceback
        traceback.print_exc()
        return {"success": False, "error": error_msg}


def get_profile(user_id: str) -> dict:
    """
    Get a user's profile from the profiles table.
    
    Args:
        user_id: The user's UUID
        
    Returns:
        dict: Response with profile data or error message
    """
    try:
        if not supabase_admin:
            return {"success": False, "error": "Supabase admin client not initialized"}
        
        response = supabase_admin.table("profiles").select("*").eq("id", user_id).execute()
        
        if response.data and len(response.data) > 0:
            return {
                "success": True,
                "profile": response.data[0]
            }
        else:
            return {"success": False, "error": "Profile not found"}
            
    except Exception as e:
        print(f"Get profile error: {e}")
        return {"success": False, "error": str(e)}


def create_order(user_id: str, order_data: dict) -> dict:
    """
    Create a new order in the orders table.
    
    Args:
        user_id: The user's UUID
        order_data: Dictionary containing order information
        
    Returns:
        dict: Response with order data or error message
    """
    try:
        if not supabase_admin:
            return {"success": False, "error": "Supabase admin client not initialized"}
        
        # Get quantity value - ensure it's never None for NOT NULL constraint
        # Convert to int if quantity column is INTEGER type, otherwise keep as float
        quantity_raw = order_data.get("quantity", 0)
        if quantity_raw:
            try:
                # Try to convert to int first (if column is INTEGER)
                quantity_value = int(float(quantity_raw))
            except (ValueError, TypeError):
                quantity_value = 0
        else:
            quantity_value = 0
        
        # Prepare the order data with proper field mapping
        insert_data = {
            "user_id": user_id,
            "supplier_type": order_data.get("supplierType"),
            "product_name": order_data.get("productName", ""),
            "product_description": order_data.get("productDescription"),
            "product_specifications": order_data.get("productSpecifications"),
            "product_certification": order_data.get("productCertification"),
            "quantity": quantity_value,  # Map to quantity column (required, NOT NULL) - as INTEGER
            "unit_of_measurement": order_data.get("unitOfMeasurement", ""),
            "unit_price": float(order_data.get("unitPrice")) if order_data.get("unitPrice") else None,
            "lower_limit": float(order_data.get("lowerLimit")) if order_data.get("lowerLimit") else None,
            "upper_limit": float(order_data.get("upperLimit")) if order_data.get("upperLimit") else None,
            "currency": order_data.get("currency") or "USD",  # Ensure currency always has a value
            "total_price_estimate": float(order_data.get("totalPriceEstimate")) if order_data.get("totalPriceEstimate") else None,
            "payment_terms": order_data.get("paymentTerms"),
            "preferred_payment_method": order_data.get("preferredPaymentMethod"),
            "required_delivery_date": order_data.get("requiredDeliveryDate"),
            "delivery_location": order_data.get("location"),
            "shipping_cost": order_data.get("shippingCost"),
            "packaging_details": order_data.get("packagingDetails"),
            "incoterms": order_data.get("incoterms"),
            "status": "pending"
        }
        
        # Remove None values to avoid issues with optional fields, but keep required fields
        # Currency and quantity should always be present, so we don't filter them out
        insert_data = {k: v for k, v in insert_data.items() if v is not None or k in ("currency", "quantity")}
        
        # Insert into orders table using admin client to bypass RLS
        response = supabase_admin.table("orders").insert(insert_data).execute()
        
        if response.data and len(response.data) > 0:
            return {
                "success": True,
                "order": response.data[0]
            }
        return {"success": False, "error": "Failed to create order"}
    except Exception as e:
        print(f"Create order error: {e}")
        return {"success": False, "error": str(e)}


def get_orders(user_id: str, status: Optional[str] = None) -> dict:
    """
    Get orders for a user, optionally filtered by status.
    
    Args:
        user_id: The user's UUID
        status: Optional status filter
        
    Returns:
        dict: Response with orders list or error message
    """
    try:
        if not supabase_admin:
            return {"success": False, "error": "Supabase admin client not initialized"}
        
        query = supabase_admin.table("orders").select("*").eq("user_id", user_id)
        
        if status:
            query = query.eq("status", status)
        
        query = query.order("created_at", desc=True)
        
        response = query.execute()
        
        if response.data is not None:
            return {
                "success": True,
                "orders": response.data
            }
        return {"success": False, "error": "Failed to retrieve orders"}
    except Exception as e:
        print(f"Get orders error: {e}")
        return {"success": False, "error": str(e)}


def get_quotations(user_id: str, status: Optional[str] = None) -> dict:
    """
    Get quotations for a user, optionally filtered by status.
    
    Note: This assumes quotations table exists. If quotations are linked to procurement_jobs,
    we may need to join with procurement_jobs to filter by user_id.
    
    Args:
        user_id: The user's UUID
        status: Optional status filter (e.g., 'pending_approval')
        
    Returns:
        dict: Response with quotations or error message
    """
    try:
        if not supabase_admin:
            return {"success": False, "error": "Supabase admin client not initialized"}
        
        # Get quotations - we'll try to filter by user_id if the column exists
        # If quotations are linked via procurement_jobs, we may need a different approach
        query = supabase_admin.table("quotations").select("*")
        
        if status:
            query = query.eq("status", status)
        
        response = query.execute()
        quotations = response.data if response.data else []
        
        # If quotations table doesn't have user_id directly, we might need to filter via procurement_jobs
        # For now, return all quotations matching the status filter
        # TODO: Add proper user_id filtering if quotations table has user_id or via procurement_jobs join
        
        return {
            "success": True,
            "quotations": quotations
        }
    except Exception as e:
        print(f"Get quotations error: {e}")
        return {"success": False, "error": str(e)}


def update_quotation(quotation_id: str, updates: dict) -> dict:
    """
    Update a quotation (e.g., approve or reject).
    
    Args:
        quotation_id: The quotation UUID
        updates: Dictionary of fields to update (e.g., {"status": "approved"})
        
    Returns:
        dict: Response with updated quotation data or error message
    """
    try:
        if not supabase_admin:
            return {"success": False, "error": "Supabase admin client not initialized"}
        
        response = supabase_admin.table("quotations").update(updates).eq("id", quotation_id).execute()
        
        if response.data and len(response.data) > 0:
            return {
                "success": True,
                "quotation": response.data[0]
            }
        return {"success": False, "error": "Failed to update quotation"}
    except Exception as e:
        print(f"Update quotation error: {e}")
        return {"success": False, "error": str(e)}