import { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle, 
  Phone,
  X,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  Truck,
  Loader2,
  Package
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { getOrders, getQuotations, updateQuotation, type Quotation } from '../api/apiCalls';

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

const Dashboard = () => {
  const [timeframe, setTimeframe] = useState('weekly');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<Quotation[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(true);
  const [approvalsError, setApprovalsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('Full user object:', user);
        console.log('User metadata:', user.user_metadata);
        console.log('Display name from metadata:', user.user_metadata?.display_name);
        console.log('First name:', user.user_metadata?.first_name);
        console.log('Last name:', user.user_metadata?.last_name);

        const metaDisplayName = user.user_metadata?.display_name;
        
        if (metaDisplayName) {
          console.log('Setting display name from metadata:', metaDisplayName);
        } else {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .single();
          
          console.log('Profile data:', profile);
          console.log('Profile error:', error);
          
          if (profile?.display_name) {
            console.log('Setting display name from profile:', profile.display_name);
          }
        }
      } else {
        console.log('No user found in session');
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchPendingApprovals();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOrders();

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

  const fetchPendingApprovals = async () => {
    try {
      setApprovalsLoading(true);
      setApprovalsError(null);
      const response = await getQuotations('pending_approval');

      if (response.success && response.quotations) {
        setPendingApprovals(response.quotations);
      } else {
        setApprovalsError(response.error || 'Failed to fetch pending approvals');
      }
    } catch (err: any) {
      setApprovalsError(err.message || 'Failed to fetch pending approvals');
      console.error('Error fetching pending approvals:', err);
    } finally {
      setApprovalsLoading(false);
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
    return `ORD-${id.substring(0, 8).toUpperCase()}`;
  };

  // Calculate order amount - use total_price_estimate or calculate from unit_price * quantity
  const getOrderAmount = (order: Order): number => {
    if (order.total_price_estimate) {
      return Number(order.total_price_estimate) || 0;
    }
    // Fallback: calculate from unit_price * quantity
    if (order.unit_price && order.quantity) {
      const unitPrice = Number(order.unit_price) || 0;
      const quantity = Number(order.quantity) || 0;
      return unitPrice * quantity;
    }
    return 0;
  };

  // Generate chart data from orders
  const generateChartData = () => {
    const now = new Date();
    const data: { name: string; amount: number }[] = [];

    if (timeframe === 'daily') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const dayOrders = orders.filter(order => {
          const orderDate = new Date(order.created_at);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === date.getTime();
        });
        
        const total = dayOrders.reduce((sum, order) => {
          const amount = getOrderAmount(order);
          return Number(sum) + Number(amount);
        }, 0);
        
        data.push({ name: dateStr, amount: Number(total) });
      }
    } else if (timeframe === 'weekly') {
      // Last 4 weeks (starting from Monday of each week)
      // Calculate the Monday of the current week
      const currentMonday = new Date(now);
      const dayOfWeek = currentMonday.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days to go back to Monday
      currentMonday.setDate(currentMonday.getDate() - daysToMonday);
      currentMonday.setHours(0, 0, 0, 0);
      
      
      for (let i = 3; i >= 0; i--) {
        // Calculate the Monday of week i weeks ago
        const weekStart = new Date(currentMonday);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        weekStart.setHours(0, 0, 0, 0);
        
        // Calculate the Sunday of that week
        const weekEndDate = new Date(weekStart);
        weekEndDate.setDate(weekEndDate.getDate() + 6); // Sunday
        weekEndDate.setHours(23, 59, 59, 999);
        
        const weekOrders = orders.filter(order => {
          const orderDate = new Date(order.created_at);
          
          // Compare using getTime() for accurate numeric comparison
          // Don't normalize order date - use full timestamp for accurate comparison
          const orderTime = orderDate.getTime();
          const weekStartTime = weekStart.getTime();
          const weekEndTime = weekEndDate.getTime();
          
          const isInWeek = orderTime >= weekStartTime && orderTime <= weekEndTime;
          
          return isInWeek;
        });
        
        const total = weekOrders.reduce((sum, order) => {
          const amount = getOrderAmount(order);
          return Number(sum) + Number(amount);
        }, 0);
        
        data.push({ name: `Week ${4 - i}`, amount: Number(total) });
      }
    } else {
      // Last 4 months
      for (let i = 3; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = month.toLocaleDateString('en-US', { month: 'short' });
        
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);
        
        const monthOrders = orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= monthStart && orderDate <= monthEnd;
        });
        
        const total = monthOrders.reduce((sum, order) => {
          const amount = getOrderAmount(order);
          return Number(sum) + Number(amount);
        }, 0);
        
        data.push({ name: monthStr, amount: Number(total) });
      }
    }

    return data;
  };


  // Get recent orders (last 5)
  const recentOrders = useMemo(() => {
    return orders
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [orders]);

  // Memoize chart data to recalculate when orders or timeframe changes
  const chartData = useMemo(() => {
    const data = generateChartData();
    return data;
  }, [orders, timeframe]);

  const handleApprove = async (quotationId: string) => {
    try {
      const response = await updateQuotation(quotationId, { status: 'approved' });
      if (response.success) {
        // Remove the approved quotation from the list
        setPendingApprovals(prev => prev.filter(q => q.id !== quotationId));
        // Optionally refresh the list to ensure consistency
        await fetchPendingApprovals();
      } else {
        console.error('Failed to approve quotation:', response.error);
        alert('Failed to approve quotation: ' + (response.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Error approving quotation:', err);
      alert('Error approving quotation: ' + err.message);
    }
  };

  const handleRequestMeeting = (quotationId: string) => {
    // TODO: Implement meeting request functionality
    console.log('Requesting meeting for quotation:', quotationId);
    alert('Meeting request functionality coming soon');
  };

  const handleReject = async (quotationId: string) => {
    if (!confirm('Are you sure you want to reject this quotation?')) {
      return;
    }
    
    try {
      const response = await updateQuotation(quotationId, { status: 'rejected' });
      if (response.success) {
        // Remove the rejected quotation from the list
        setPendingApprovals(prev => prev.filter(q => q.id !== quotationId));
        // Optionally refresh the list to ensure consistency
        await fetchPendingApprovals();
      } else {
        console.error('Failed to reject quotation:', response.error);
        alert('Failed to reject quotation: ' + (response.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Error rejecting quotation:', err);
      alert('Error rejecting quotation: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 text-lg">Overview of your procurement activities</p>
      </div>

      {/* Order Expenses Chart */}
      <div className="card bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Order Expenses</h2>
            <p className="text-sm text-gray-500">Track your spending trends</p>
          </div>
          <div className="flex space-x-2 bg-gray-100/50 p-1 rounded-lg">
            {['daily', 'weekly', 'monthly'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  timeframe === period
                    ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="h-80 bg-white/50 rounded-lg p-4 border border-gray-200/50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  formatter={(value) => [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Amount']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="url(#colorGradient)" 
                  strokeWidth={3}
                  dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="card bg-gradient-to-br from-white via-amber-50/20 to-orange-50/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-md">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Pending Approvals</h2>
              <p className="text-sm text-gray-500">Quotes awaiting your review</p>
            </div>
          </div>
          {approvalsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              <span className="ml-3 text-gray-600">Loading approvals...</span>
            </div>
          ) : approvalsError ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-600 text-sm">{approvalsError}</p>
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((quotation) => {
                const quotationData = quotation.quotation_data || {};
                const totalPrice = quotationData.total_price || quotationData.price || 0;
                const unitPrice = quotationData.unit_price || 0;
                const currency = quotationData.currency || 'USD';
                const deliveryDate = quotationData.delivery_time || 'TBD';
                const terms = quotationData.payment_terms || 'N/A';
                const quantity = quotationData.quantity;
                const unitOfMeasurement = quotationData.unit_of_measurement;
                
                // Format product description
                const product = quantity && unitOfMeasurement
                  ? `${quantity} ${unitOfMeasurement}`
                  : 'Product details';
                
                // Format quotation ID for display
                const quotationId = quotation.id ? `QT-${quotation.id.substring(0, 8).toUpperCase()}` : 'N/A';
                
                // Format created date
                const createdDate = quotation.created_at 
                  ? formatDate(quotation.created_at)
                  : '';

                return (
                  <div key={quotation.id} className="border border-gray-200/50 rounded-xl p-5 bg-white/60 backdrop-blur-sm hover:border-primary-300 hover:shadow-lg transition-all duration-300 hover:bg-white/80">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 text-base">{quotation.supplier_name || 'Unknown Supplier'}</h3>
                          {createdDate && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{createdDate}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{quotationId}</span>
                          {unitPrice > 0 && quantity && (
                            <span className="text-xs text-gray-600">
                              @ {currency} {unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{unitOfMeasurement}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-1 font-medium">{product}</p>
                        {quotation.reason && (
                          <p className="text-xs text-gray-500 mt-2 italic line-clamp-2 bg-gray-50/50 p-2 rounded">{quotation.reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600 bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-lg p-3 border border-gray-100">
                      {totalPrice > 0 && (
                        <span className="flex items-center font-bold text-gray-900 text-base">
                          <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                          {currency} {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                      <span className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-1 text-primary-600" />
                        {deliveryDate}
                      </span>
                      <span className="text-gray-500">{terms}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(quotation.id)}
                        className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleRequestMeeting(quotation.id)}
                        className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <Phone className="h-4 w-4" />
                        <span>Request Call</span>
                      </button>
                      <button
                        onClick={() => handleReject(quotation.id)}
                        className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <X className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Orders Timeline */}
        <div className="card bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-md">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recent Orders Timeline</h2>
              <p className="text-sm text-gray-500">Track your latest orders</p>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              <span className="ml-3 text-gray-600">Loading orders...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">No recent orders</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order, index) => {
                const progress = 
                  order.status === 'delivered' ? 100 :
                  order.status === 'shipped' ? 90 :
                  order.status === 'in_progress' ? 75 :
                  order.status === 'confirmed' ? 60 :
                  order.status === 'submitted' ? 40 :
                  order.status === 'pending' ? 20 : 0;

                return (
                  <div key={order.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-white/60 transition-all duration-200">
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full shadow-md ${
                        progress === 100 ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 
                        progress >= 75 ? 'bg-gradient-to-br from-blue-500 to-indigo-500' : 
                        progress >= 50 ? 'bg-gradient-to-br from-yellow-500 to-amber-500' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                      }`} />
                      {index < recentOrders.length - 1 && (
                        <div className="w-0.5 h-8 bg-gradient-to-b from-gray-300 to-transparent mt-2" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{formatOrderId(order.id)}</span>
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{formatDate(order.created_at)}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">{order.product_name}</p>
                      {order.product_description && (
                        <p className="text-xs text-gray-600 line-clamp-1 mb-2">{order.product_description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1.5">{formatStatus(order.status)}</span>
                        </span>
                        {order.total_price_estimate && (
                          <span className="text-xs text-gray-700 flex items-center gap-1 font-semibold bg-green-50 px-2 py-1 rounded">
                            <DollarSign className="h-3 w-3 text-green-600" />
                            {order.currency || 'USD'} {order.total_price_estimate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;