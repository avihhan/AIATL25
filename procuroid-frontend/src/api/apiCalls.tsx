import axios from 'axios';
import { supabase } from '../lib/supabase';

// Resolve API base URL: prefer env var, otherwise pick based on current host
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080'
    : 'https://procuroid-369418280809.us-central1.run.app');

export interface SignUpPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface QuoteRequestPayload {
    description: string;
    orderType: string;
    productDescription: string;
    quantity: string;        // Note: currently captured as string in the form
    lowerLimit: string;      // same here
    upperLimit: string;      // same here
    deliveryDate: string;
    location: string;
    supplierSelection: 'preferred' | 'discovery';
    discoveryMode: boolean;
  }

export const signUp = async (payload: SignUpPayload) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/signup`,
    payload
  );
  return response.data;
};

export const signIn = async (payload: SignInPayload) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/signin`,
    payload
  );
  return response.data;
};

export const sendQuoteRequest = async (userId: string, payload: QuoteRequestPayload) => {
  // Get the current session token
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await axios.post(
    `${API_BASE_URL}/send-quote-request/${encodeURIComponent(userId)}`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      withCredentials: true
    }
  );
  return response.data;
};

export interface SuppliersResponse {
  success: boolean;
  suppliers: any[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export const getSuppliers = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
): Promise<SuppliersResponse> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  if (search) {
    params.append('search', search);
  }
  
  if (sortBy) {
    params.append('sort_by', sortBy);
  }
  
  if (sortOrder) {
    params.append('sort_order', sortOrder);
  }

  const response = await axios.get(
    `${API_BASE_URL}/suppliers?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      withCredentials: true
    }
  );
  return response.data;
};

export interface CreateSupplierPayload {
  company_name: string;
  contact_person?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  country?: string;
  website?: string;
  supplier_type?: 'manufacturer' | 'distributor' | 'service_provider';
  category?: string;
  product_keywords?: string[];
  product_certifications?: string[];
  min_order_quantity?: number | null;
  delivery_regions?: string[];
  average_lead_time?: string;
  currency?: string;
  typical_unit_price?: number | null;
  negotiation_flexibility?: 'low' | 'medium' | 'high';
  preferred_contact_method?: 'email' | 'phone' | 'both';
}

export interface CreateSupplierResponse {
  success: boolean;
  supplier?: any;
  error?: string;
}

export const createSupplier = async (payload: CreateSupplierPayload): Promise<CreateSupplierResponse> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await axios.post(
    `${API_BASE_URL}/suppliers`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      withCredentials: true
    }
  );
  return response.data;
};

export interface UpdateSupplierPayload extends CreateSupplierPayload {
  // All fields are optional for updates
}

export interface UpdateSupplierResponse {
  success: boolean;
  supplier?: any;
  error?: string;
}

export const updateSupplier = async (supplierId: string, payload: UpdateSupplierPayload): Promise<UpdateSupplierResponse> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await axios.patch(
    `${API_BASE_URL}/suppliers/${encodeURIComponent(supplierId)}`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      withCredentials: true
    }
  );
  return response.data;
};

export interface DeleteSupplierResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const deleteSupplier = async (supplierId: string): Promise<DeleteSupplierResponse> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await axios.delete(
    `${API_BASE_URL}/suppliers/${encodeURIComponent(supplierId)}`,
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      withCredentials: true
    }
  );
  return response.data;
};

export interface UpdateProfilePayload {
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  theme?: 'light' | 'dark' | 'system';
  density?: 'comfortable' | 'compact';
  language?: string;
  timezone?: string;
  notifications?: {
    email?: boolean;
    marketing?: boolean;
    system?: boolean;
  };
  two_factor_enabled?: boolean;
}

export interface ProfileResponse {
  success: boolean;
  profile?: any;
  error?: string;
}

export const updateProfile = async (payload: UpdateProfilePayload): Promise<ProfileResponse> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await axios.patch(
    `${API_BASE_URL}/profile`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      withCredentials: true
    }
  );
  return response.data;
};

export const getProfile = async (): Promise<ProfileResponse> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await axios.get(
    `${API_BASE_URL}/profile`,
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      withCredentials: true
    }
  );
  return response.data;
};

export interface OrderPayload {
  supplierType: 'manufacturer' | 'distributor' | 'service_provider';
  productName: string;
  productDescription: string;
  productSpecifications?: string;
  productCertification?: string;
  quantity: string;
  unitOfMeasurement: string;
  unitPrice?: string;
  lowerLimit?: string;
  upperLimit?: string;
  currency: string;
  totalPriceEstimate?: string;
  paymentTerms: string;
  preferredPaymentMethod: string;
  requiredDeliveryDate: string;
  location: string;
  shippingCost: 'included' | 'separate';
  packagingDetails?: string;
  incoterms?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message?: string;
  order?: any;
  error?: string;
}

export interface GetOrdersResponse {
  success: boolean;
  orders?: any[];
  error?: string;
}

export const createOrder = async (payload: OrderPayload): Promise<CreateOrderResponse> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await axios.post(
    `${API_BASE_URL}/orders`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      withCredentials: true
    }
  );
  return response.data;
};

export const getOrders = async (status?: string): Promise<GetOrdersResponse> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const params = new URLSearchParams();
  if (status) {
    params.append('status', status);
  }

  const response = await axios.get(
    `${API_BASE_URL}/orders${params.toString() ? `?${params.toString()}` : ''}`,
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      withCredentials: true
    }
  );
  return response.data;
};

export interface Quotation {
  id: string;
  supplier_id?: string;
  supplier_name?: string;
  quotation_data?: {
    price?: number;
    unit_price?: number;
    total_price?: number;
    currency?: string;
    delivery_time?: string;
    payment_terms?: string;
    quantity?: number;
    unit_of_measurement?: string;
  };
  status: string;
  reason?: string;
  created_at?: string;
}

export interface GetQuotationsResponse {
  success: boolean;
  quotations?: Quotation[];
  error?: string;
}

export const getQuotations = async (status?: string): Promise<GetQuotationsResponse> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const params = new URLSearchParams();
  if (status) {
    params.append('status', status);
  }

  const response = await axios.get(
    `${API_BASE_URL}/quotations${params.toString() ? `?${params.toString()}` : ''}`,
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      withCredentials: true
    }
  );
  return response.data;
};

export interface UpdateQuotationPayload {
  status: 'approved' | 'rejected';
}

export interface UpdateQuotationResponse {
  success: boolean;
  quotation?: Quotation;
  error?: string;
}

export const updateQuotation = async (quotationId: string, payload: UpdateQuotationPayload): Promise<UpdateQuotationResponse> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await axios.patch(
    `${API_BASE_URL}/quotations/${encodeURIComponent(quotationId)}`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      withCredentials: true
    }
  );
  return response.data;
};

export interface GenerateContractResponse {
  success: boolean;
  contract?: any;
  pdf_url?: string;
  error?: string;
}

export const generateContract = async (quotationId: string): Promise<GenerateContractResponse> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await axios.post(
    `${API_BASE_URL}/quotations/${encodeURIComponent(quotationId)}/generate-contract`,
    {},
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      withCredentials: true
    }
  );
  return response.data;
};

export interface Contract {
  id: string;
  quotation_id: string;
  user_id: string;
  supplier_id?: string;
  supplier_name: string;
  contract_data: any;
  pdf_url: string;
  pdf_path: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface GetContractsResponse {
  success: boolean;
  contracts?: Contract[];
  error?: string;
}

export const getContracts = async (): Promise<GetContractsResponse> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await axios.get(
    `${API_BASE_URL}/contracts`,
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      withCredentials: true
    }
  );
  return response.data;
}
// ElevenLabs API Configuration from environment variables
const ELEVENLABS_API_URL = 'https://api.us.elevenlabs.io/v1/convai/twilio/outbound-call';
const ELEVENLABS_BEARER_TOKEN = import.meta.env.VITE_ELEVENLABS_BEARER_TOKEN;
const ELEVENLABS_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
const ELEVENLABS_AGENT_PHONE_NUMBER_ID = import.meta.env.VITE_ELEVENLABS_AGENT_PHONE_NUMBER_ID;

export interface ElevenLabsCallPayload {
  productName: string;
  productDescription: string;
  quantity: string;
  unitOfMeasurement: string;
  lowerLimit: string;
  upperLimit: string;
  currency: string;
  requiredDeliveryDate: string;
  location: string;
  buyer_company_name?: string;
  seller_company_name?: string;
}

/**
 * Initiate an outbound call via ElevenLabs API
 * @param toNumber - The supplier's phone number to call
 * @param formData - The order form data containing product details
 * @param sellerCompanyName - The supplier/seller company name
 * @returns Promise with the API response
 */
export const initiateElevenLabsCall = async (
  toNumber: string,
  formData: ElevenLabsCallPayload,
  sellerCompanyName: string = 'Supplier'
): Promise<any> => {
  try {
    // Validate required environment variables
    if (!ELEVENLABS_BEARER_TOKEN) {
      throw new Error('ELEVENLABS_BEARER_TOKEN is not configured in environment variables');
    }
    if (!ELEVENLABS_AGENT_ID) {
      throw new Error('ELEVENLABS_AGENT_ID is not configured in environment variables');
    }
    if (!ELEVENLABS_AGENT_PHONE_NUMBER_ID) {
      throw new Error('ELEVENLABS_AGENT_PHONE_NUMBER_ID is not configured in environment variables');
    }

    // Format the payload for ElevenLabs API
    const payload = {
      agent_id: ELEVENLABS_AGENT_ID,
      agent_phone_number_id: ELEVENLABS_AGENT_PHONE_NUMBER_ID,
      to_number: toNumber,
      conversation_initiation_client_data: {
        dynamic_variables: {
          productName: formData.productName,
          productDescription: formData.productDescription,
          quantity: `${formData.quantity} ${formData.unitOfMeasurement}`,
          lowerLimit: `${formData.currency} ${formData.lowerLimit}`,
          upperLimit: `${formData.currency} ${formData.upperLimit}`,
          requiredDeliveryDate: formData.requiredDeliveryDate,
          location: formData.location,
          buyer_company_name: formData.buyer_company_name || 'Procuroid Client',
          seller_company_name: sellerCompanyName,
        }
      }
    };

    // Make the API call to ElevenLabs
    const response = await axios.post(
      ELEVENLABS_API_URL,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${ELEVENLABS_BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      data: response.data,
      message: 'Call initiated successfully'
    };
  } catch (error: any) {
    console.error('Error initiating ElevenLabs call:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to initiate call',
      details: error.response?.data
    };
  }
};

/**
 * Create a supplier call record in the database
 * @param callData - The call data to store
 * @returns Promise with the created record
 */
export const createSupplierCall = async (callData: {
  job_id?: string;
  supplier_id?: string;
  supplier_name: string;
  call_id: string;
  status: string;
  user_id?: string;
}): Promise<any> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Insert into supplier_calls table
    const { data, error } = await supabase
      .from('supplier_calls')
      .insert({
        job_id: callData.job_id || null,
        supplier_id: callData.supplier_id || null,
        supplier_name: callData.supplier_name,
        call_id: callData.call_id,
        status: callData.status,
        user_id: callData.user_id || session.user.id,
        transcript: '',  // Will be updated by webhook
        summary: '',     // Will be updated by webhook
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: data
    };
  } catch (error: any) {
    console.error('Error creating supplier call record:', error);
    return {
      success: false,
      error: error.message || 'Failed to create supplier call record'
    };
  }
};