import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle,
  Truck,
  Loader2,
  ChevronDown,
  ChevronUp,
  Package,
  DollarSign,
  Calendar,
  MapPin,
  CreditCard,
  FileText,
} from 'lucide-react';
import { getOrders } from '../api/apiCalls';

interface Order {
  id: string;
  product_name: string;
  product_description?: string;
  product_specifications?: string;
  product_certification?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  total_price_estimate?: number;
  currency?: string;
  quantity?: number;
  unit_of_measurement?: string;
  unit_price?: number;
  lower_limit?: number;
  upper_limit?: number;
  supplier_type?: string;
  payment_terms?: string;
  preferred_payment_method?: string;
  required_delivery_date?: string;
  delivery_location?: string;
  shipping_cost?: string;
  packaging_details?: string;
  incoterms?: string;
}

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const response = await getOrders(status);

      if (response.success && response.orders) {
        setOrders(response.orders);
      } else {
        setError(response.error || 'Failed to fetch orders');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'Pending',
      'submitted': 'Submitted',
      'confirmed': 'Confirmed',
      'in_progress': 'In Progress',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
    };
    return statusMap[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'submitted':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-purple-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-blue-600 bg-blue-100';
      case 'submitted':
        return 'text-yellow-600 bg-yellow-100';
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-purple-600 bg-purple-100';
      case 'shipped':
        return 'text-purple-600 bg-purple-100';
      case 'delivered':
        return 'text-gray-600 bg-gray-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatOrderId = (id: string): string => {
    // Use first 8 characters of UUID for display
    return `ORD-${id.substring(0, 8).toUpperCase()}`;
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      order.product_name.toLowerCase().includes(searchLower) ||
      order.product_description?.toLowerCase().includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower) ||
      formatOrderId(order.id).toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrder(selectedOrder === orderId ? null : orderId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2">
          Orders
        </h1>
        <p className="text-gray-600 text-lg">Manage all your procurement requests and orders</p>
      </div>

      {/* Search and Filters */}
      <div className="card bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product name, description, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filter:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20">
        <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-blue-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-indigo-500 rounded-lg shadow-md">
                <Package className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Orders</h2>
            </div>
            <span className="text-sm font-semibold text-gray-600 bg-white/80 px-3 py-1.5 rounded-lg shadow-sm">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <span className="ml-3 text-gray-600">Loading orders...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-2 font-medium">{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-lg hover:from-primary-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Try again
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-1">
              {searchTerm || statusFilter !== 'all'
                ? 'No orders match your filters'
                : 'No orders found'}
            </p>
            <p className="text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first order to get started'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order) => {
              const isExpanded = selectedOrder === order.id;
              return (
                <div key={order.id} className="transition-all duration-200 hover:bg-white/60 border-b border-gray-100/50 last:border-b-0">
                  {/* Main Order Row */}
                  <div
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => handleSelectOrder(order.id)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Expand/Collapse Icon */}
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>

                      {/* Order ID & Status */}
                      <div className="flex-shrink-0 w-32">
                        <div className="text-xs text-gray-500 mb-1">Order ID</div>
                        <div className="font-mono text-sm font-semibold text-gray-900">{formatOrderId(order.id)}</div>
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1.5">{formatStatus(order.status)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <Package className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 mb-1">{order.product_name}</div>
                            {order.product_description && (
                              <div className="text-sm text-gray-600 line-clamp-2">{order.product_description}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Date & Price */}
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                        {order.total_price_estimate && (
                          <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span>
                              {order.currency || 'USD'} {order.total_price_estimate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-6 py-6 bg-gradient-to-br from-gray-50/50 to-blue-50/30 border-t border-gray-200/50">
                      <div className="max-w-6xl mx-auto space-y-6">
                        {/* Detailed Information Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Product Information */}
                          <div className="card bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/20">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                              <FileText className="h-5 w-5 text-gray-600" />
                              <h3 className="text-base font-semibold text-gray-900">Product Information</h3>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Product Name</label>
                                <p className="text-sm text-gray-900 font-medium">{order.product_name}</p>
                              </div>
                              {order.product_description && (
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Description</label>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{order.product_description}</p>
                                </div>
                              )}                                
                              {order.supplier_type && (
                                <div className="pt-2 border-t border-gray-100">
                                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Supplier Type</label>
                                  <p className="text-sm text-gray-900 capitalize">{order.supplier_type.replace('_', ' ')}</p>
                                </div>
                              )}
                              {order.product_specifications && (
                                <div className="pt-2 border-t border-gray-100">
                                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Specifications</label>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{order.product_specifications}</p>
                                </div>
                              )}
                              {order.product_certification && (
                                <div className="pt-2 border-t border-gray-100">
                                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Certifications</label>
                                  <p className="text-sm text-gray-900">{order.product_certification}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Order & Financial Details */}
                          <div className="card bg-gradient-to-br from-white via-green-50/20 to-emerald-50/20">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                              <DollarSign className="h-5 w-5 text-gray-600" />
                              <h3 className="text-base font-semibold text-gray-900">Order & Financial Details</h3>
                            </div>
                            <div className="space-y-4">
                              {order.quantity && (
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                  <span className="text-sm text-gray-600">Quantity</span>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {order.quantity} {order.unit_of_measurement || ''}
                                  </span>
                                </div>
                              )}
                              {order.unit_price && (
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                  <span className="text-sm text-gray-600">Unit Price</span>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {order.currency || 'USD'} {order.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}
                              {order.total_price_estimate && (
                                <div className="flex items-center justify-between py-2 bg-gradient-to-r from-primary-50 to-indigo-50 rounded-lg p-3 border border-primary-100">
                                  <span className="text-base font-bold text-gray-900">Total Estimate</span>
                                  <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                                    {order.currency || 'USD'} {order.total_price_estimate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}
                              {(order.lower_limit || order.upper_limit) && (
                                <div className="pt-3 border-t border-gray-200 mt-2">
                                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Negotiation Range</label>
                                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-600">Lower Limit</span>
                                      <span className="text-sm font-semibold text-gray-900">
                                        {order.currency || 'USD'} {order.lower_limit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-600">Upper Limit</span>
                                      <span className="text-sm font-semibold text-gray-900">
                                        {order.currency || 'USD'} {order.upper_limit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Delivery Information */}
                          <div className="card bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                              <Truck className="h-5 w-5 text-gray-600" />
                              <h3 className="text-base font-semibold text-gray-900">Delivery Information</h3>
                            </div>
                            <div className="space-y-3">
                              {order.required_delivery_date && (
                                <div className="flex items-center justify-between py-2">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="h-4 w-4" />
                                    <span>Required Date</span>
                                  </div>
                                  <span className="text-sm font-semibold text-gray-900">{formatDate(order.required_delivery_date)}</span>
                                </div>
                              )}
                              {order.delivery_location && (
                                <div className="py-2 border-t border-gray-100">
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                    <MapPin className="h-4 w-4" />
                                    <span className="font-medium">Location</span>
                                  </div>
                                  <p className="text-sm text-gray-900 ml-6">{order.delivery_location}</p>
                                </div>
                              )}
                              {order.shipping_cost && (
                                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                                  <span className="text-sm text-gray-600">Shipping Cost</span>
                                  <span className="text-sm font-semibold text-gray-900 capitalize">{order.shipping_cost}</span>
                                </div>
                              )}
                              {order.incoterms && (
                                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                                  <span className="text-sm text-gray-600">Incoterms</span>
                                  <span className="text-sm font-semibold text-gray-900">{order.incoterms}</span>
                                </div>
                              )}
                              {order.packaging_details && (
                                <div className="pt-2 border-t border-gray-100">
                                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Packaging Details</label>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{order.packaging_details}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Payment Information */}
                          <div className="card bg-gradient-to-br from-white via-amber-50/20 to-orange-50/20">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                              <CreditCard className="h-5 w-5 text-gray-600" />
                              <h3 className="text-base font-semibold text-gray-900">Payment Information</h3>
                            </div>
                            <div className="space-y-3">
                              {order.payment_terms && (
                                <div className="flex items-center justify-between py-2">
                                  <span className="text-sm text-gray-600">Payment Terms</span>
                                  <span className="text-sm font-semibold text-gray-900">{order.payment_terms}</span>
                                </div>
                              )}
                              {order.preferred_payment_method && (
                                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                                  <span className="text-sm text-gray-600">Payment Method</span>
                                  <span className="text-sm font-semibold text-gray-900">{order.preferred_payment_method}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
