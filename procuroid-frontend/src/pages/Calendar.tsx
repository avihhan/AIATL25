import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Phone, 
  Users, 
  Truck,
  Calendar as CalendarIcon,
  Loader2,
  AlertCircle,
  Package,
  Download
} from 'lucide-react';
import { getOrders } from '../api/apiCalls';
import { supabase } from '../lib/supabase';

interface Order {
  id: string;
  product_name: string;
  product_description?: string;
  delivery_date?: string;
  delivery_location?: string;
  status: string;
  total_price_estimate?: number;
  currency?: string;
  quantity?: number;
  unit_of_measurement?: string;
}

interface MeetingRequest {
  id: string;
  supplier_id?: string;
  order_id?: string;
  supplier_name: string;
  reason?: string;
  meeting_id?: string;
  scheduled_time: string;
  meeting_link?: string;
  created_at: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  type: 'meeting' | 'call' | 'delivery';
  date: string;
  time?: string;
  duration?: string;
  location?: string;
  attendees?: string[];
  description?: string;
  orderId?: string;
  orderStatus?: string;
  meetingId?: string;
  meetingLink?: string;
  supplierName?: string;
  originalDateTime?: Date; // For meetings with full timestamp
}

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '09:00',
    type: 'delivery' as 'meeting' | 'call' | 'delivery',
    location: '',
    selectedOrderId: ''
  });

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Generate calendar days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    fetchOrders();
    fetchMeetingRequests();
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

  const fetchMeetingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('meeting_requests')
        .select('*')
        .order('scheduled_time', { ascending: true });

      if (error) {
        console.error('Error fetching meeting requests:', error);
        return;
      }

      if (data) {
        setMeetingRequests(data);
      }
    } catch (err: any) {
      console.error('Error fetching meeting requests:', err);
    }
  };

  const formatOrderId = (id: string): string => {
    return `ORD-${id.substring(0, 8).toUpperCase()}`;
  };

  // Convert orders with delivery dates to calendar events
  const orderEvents: CalendarEvent[] = orders
    .filter(order => order.delivery_date)
    .map(order => {
      const deliveryDate = order.delivery_date!;
      // Format date to YYYY-MM-DD if it's not already
      const dateStr = deliveryDate.includes('T') 
        ? deliveryDate.split('T')[0] 
        : deliveryDate;

      return {
        id: order.id,
        title: `Delivery - ${order.product_name}`,
        type: 'delivery' as const,
        date: dateStr,
        time: '9:00 AM', // Default time for deliveries
        duration: '2 hours',
        location: order.delivery_location || 'TBD',
        attendees: ['Delivery Team'],
        description: order.product_description || `Order ${formatOrderId(order.id)} - ${order.product_name}`,
        orderId: formatOrderId(order.id),
        orderStatus: order.status
      };
    });

  // Convert meeting requests to calendar events
  const meetingEvents: CalendarEvent[] = meetingRequests
    .filter(meeting => meeting.scheduled_time)
    .map(meeting => {
      const scheduledTime = new Date(meeting.scheduled_time);
      const dateStr = scheduledTime.toISOString().split('T')[0];
      const timeStr = scheduledTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });

      return {
        id: meeting.id,
        title: `Meeting - ${meeting.supplier_name}`,
        type: 'meeting' as const,
        date: dateStr,
        time: timeStr,
        duration: '1 hour',
        location: meeting.meeting_link || 'TBD',
        attendees: [meeting.supplier_name],
        description: meeting.reason || `Meeting with ${meeting.supplier_name}`,
        meetingId: meeting.meeting_id,
        meetingLink: meeting.meeting_link,
        supplierName: meeting.supplier_name,
        orderId: meeting.order_id ? formatOrderId(meeting.order_id) : undefined,
        originalDateTime: scheduledTime // Store original datetime for accurate iCal export
      };
    });

  // Combine all events
  const events: CalendarEvent[] = [...orderEvents, ...meetingEvents];

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'delivery':
        return <Truck className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'call':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'delivery':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventsForDate = (date: Date) => {
    // Format date as YYYY-MM-DD in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return events.filter(event => {
      // Handle both YYYY-MM-DD format and date objects
      const eventDate = event.date.includes('T') 
        ? event.date.split('T')[0] 
        : event.date;
      return eventDate === dateStr;
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    
    // Format date for form
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Get orders for this date
    const dateEvents = getEventsForDate(date);
    
    // Auto-fill form if there are orders on this date
    if (dateEvents.length > 0) {
      const firstEvent = dateEvents[0];
      const order = orders.find(o => o.id === firstEvent.id);
      
      if (order) {
        setFormData({
          title: `Delivery - ${order.product_name}`,
          date: dateStr,
          time: '09:00',
          type: 'delivery',
          location: order.delivery_location || '',
          selectedOrderId: order.id
        });
      } else {
        // Reset form with date
        setFormData({
          title: '',
          date: dateStr,
          time: '09:00',
          type: 'delivery',
          location: '',
          selectedOrderId: ''
        });
      }
    } else {
      // Reset form with date
      setFormData({
        title: '',
        date: dateStr,
        time: '09:00',
        type: 'delivery',
        location: '',
        selectedOrderId: ''
      });
    }
    
    setShowAddEvent(true);
  };
  
  // const handleOrderSelect = (orderId: string) => {
  //   const order = orders.find(o => o.id === orderId);
  //   if (order && order.delivery_date) {
  //     const deliveryDate = order.delivery_date.includes('T') 
  //       ? order.delivery_date.split('T')[0] 
  //       : order.delivery_date;
      
  //     setFormData({
  //       ...formData,
  //       title: `Delivery - ${order.product_name}`,
  //       date: deliveryDate,
  //       type: 'delivery',
  //       location: order.delivery_location || '',
  //       selectedOrderId: order.id
  //     });
  //   }
  // };
  
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleCloseModal = () => {
    setShowAddEvent(false);
    setFormData({
      title: '',
      date: '',
      time: '09:00',
      type: 'delivery',
      location: '',
      selectedOrderId: ''
    });
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month;
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Previous month's trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push(
        <div
          key={`prev-${i}`}
          className="h-24 p-1 border border-gray-200 bg-gray-50"
        >
          <span className="text-gray-400 text-sm">{date.getDate()}</span>
        </div>
      );
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = getEventsForDate(date);
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

      days.push(
        <div
          key={day}
          className={`h-24 p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
            isSelected ? 'bg-primary-50 border-primary-200' : ''
          } ${!isCurrentMonth(date) ? 'bg-gray-50' : ''}`}
          onClick={() => handleDateClick(date)}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-medium ${
              isToday(date) ? 'text-primary-600 bg-primary-100 rounded-full w-6 h-6 flex items-center justify-center' : 
              isCurrentMonth(date) ? 'text-gray-900' : 'text-gray-400'
            }`}>
              {day}
            </span>
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded border-l-2 ${getEventTypeColor(event.type)} truncate`}
                title={event.title}
              >
                <div className="flex items-center space-x-1">
                  {getEventTypeIcon(event.type)}
                  <span className="truncate">{event.title}</span>
                </div>
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    // Next month's leading days
    const totalCells = 42; // 6 weeks * 7 days
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      days.push(
        <div
          key={`next-${day}`}
          className="h-24 p-1 border border-gray-200 bg-gray-50"
        >
          <span className="text-gray-400 text-sm">{date.getDate()}</span>
        </div>
      );
    }

    return days;
  };

  const getSelectedDateEvents = () => {
    if (!selectedDate) return [];
    return getEventsForDate(selectedDate);
  };

  // Format date for iCal (YYYYMMDDTHHMMSS)
  const formatDateForICal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  };

  // Escape text for iCal format
  const escapeICalText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  // Generate iCal file content
  const generateICalContent = (): string => {
    const now = new Date();
    const nowStr = formatDateForICal(now);
    
    let ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Procuroid//Calendar Export//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ].join('\r\n') + '\r\n';

    // Add all events
    events.forEach(event => {
      // Use original datetime if available (for meetings), otherwise parse from date/time
      let startDate: Date;
      if (event.originalDateTime) {
        startDate = new Date(event.originalDateTime);
      } else {
        const eventDate = new Date(event.date);
        
        // Parse time if available, otherwise use default
        startDate = new Date(eventDate);
        if (event.time) {
          // Try 12-hour format first (e.g., "9:00 AM")
          const timeMatch12 = event.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (timeMatch12) {
            let hours = parseInt(timeMatch12[1]);
            const minutes = parseInt(timeMatch12[2]);
            const ampm = timeMatch12[3].toUpperCase();
            
            if (ampm === 'PM' && hours !== 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            
            startDate.setHours(hours, minutes, 0, 0);
          } else {
            // Try 24-hour format (e.g., "09:00" or "14:30")
            const timeMatch24 = event.time.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch24) {
              const hours = parseInt(timeMatch24[1]);
              const minutes = parseInt(timeMatch24[2]);
              startDate.setHours(hours, minutes, 0, 0);
            } else {
              startDate.setHours(9, 0, 0, 0); // Default to 9 AM
            }
          }
        } else {
          startDate.setHours(9, 0, 0, 0); // Default to 9 AM
        }
      }

      // Calculate end date (default 1 hour duration)
      const endDate = new Date(startDate);
      if (event.duration) {
        const durationMatch = event.duration.match(/(\d+)/);
        if (durationMatch) {
          const hours = parseInt(durationMatch[1]);
          endDate.setHours(endDate.getHours() + hours);
        } else {
          endDate.setHours(endDate.getHours() + 1);
        }
      } else {
        endDate.setHours(endDate.getHours() + 1);
      }

      const dtstart = formatDateForICal(startDate);
      const dtend = formatDateForICal(endDate);
      const summary = escapeICalText(event.title);
      const description = escapeICalText(
        event.description || 
        (event.type === 'delivery' ? `Delivery for ${event.title}` : `Meeting: ${event.title}`) +
        (event.orderId ? `\nOrder ID: ${event.orderId}` : '') +
        (event.supplierName ? `\nSupplier: ${event.supplierName}` : '') +
        (event.meetingLink ? `\nMeeting Link: ${event.meetingLink}` : '')
      );
      const location = escapeICalText(event.location || 'TBD');
      const uid = `${event.id}@procuroid.com`;

      ical += [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${nowStr}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        event.meetingLink ? `URL:${event.meetingLink}` : '',
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT'
      ].filter(line => line !== '').join('\r\n') + '\r\n';
    });

    ical += 'END:VCALENDAR\r\n';
    return ical;
  };

  // Download calendar as iCal file
  const downloadCalendar = () => {
    try {
      const icalContent = generateICalContent();
      const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `procuroid-calendar-${new Date().toISOString().split('T')[0]}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading calendar:', error);
      alert('Failed to download calendar. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">View orders with delivery dates</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading orders...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        <button 
          onClick={downloadCalendar}
          className="btn-secondary flex items-center space-x-2"
          title="Download calendar as .ics file"
        >
          <Download className="h-4 w-4" />
          <span>Download Calendar</span>
        </button>
        <button 
          onClick={() => {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            setFormData({
              title: '',
              date: `${year}-${month}-${day}`,
              time: '09:00',
              type: 'delivery',
              location: '',
              selectedOrderId: ''
            });
            setShowAddEvent(true);
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Event</span>
        </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <div className="card">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {monthNames[month]} {year}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
              {/* Day Headers */}
              {dayNames.map((day) => (
                <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-700 border-b border-gray-200">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {renderCalendarDays()}
            </div>
          </div>
        </div>

        {/* Events Panel */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedDate ? selectedDate.toLocaleDateString() : 'Upcoming Events'}
            </h2>
            
            <div className="space-y-3">
              {selectedDate ? (
                getSelectedDateEvents().length > 0 ? (
                  getSelectedDateEvents().map((event) => (
                    <div key={event.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className={`p-1 rounded ${getEventTypeColor(event.type)}`}>
                          {getEventTypeIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {event.title}
                          </h3>
                          {event.orderId && (
                            <p className="text-xs text-gray-600 font-mono mt-1">
                              {event.orderId}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {event.time} • {event.duration}
                          </p>
                          <p className="text-xs text-gray-500">
                            {event.location}
                          </p>
                          {event.orderStatus && (
                            <p className="text-xs text-gray-500 mt-1">
                              Status: {event.orderStatus}
                            </p>
                          )}
                          {event.meetingLink && (
                            <a 
                              href={event.meetingLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 block"
                            >
                              Join Meeting →
                            </a>
                          )}
                          {event.supplierName && (
                            <p className="text-xs text-gray-500 mt-1">
                              Supplier: {event.supplierName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No events scheduled</p>
                )
              ) : loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                  <span className="ml-3 text-gray-600">Loading orders...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <p className="text-red-600 text-sm mb-2">{error}</p>
                  <button
                    onClick={fetchOrders}
                    className="text-sm text-primary-600 hover:text-primary-700 underline"
                  >
                    Try again
                  </button>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">No orders with delivery dates</p>
                </div>
              ) : (
                events
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .slice(0, 5)
                  .map((event) => (
                    <div key={event.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className={`p-1 rounded ${getEventTypeColor(event.type)}`}>
                          {getEventTypeIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {event.title}
                          </h3>
                          {event.orderId && (
                            <p className="text-xs text-gray-600 font-mono mt-1">
                              {event.orderId}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {event.date} • {event.time}
                          </p>
                          <p className="text-xs text-gray-500">
                            {event.location}
                          </p>
                          {event.orderStatus && (
                            <p className="text-xs text-gray-500 mt-1">
                              Status: {event.orderStatus}
                            </p>
                          )}
                          {event.meetingLink && (
                            <a 
                              href={event.meetingLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 block"
                            >
                              Join Meeting →
                            </a>
                          )}
                          {event.supplierName && (
                            <p className="text-xs text-gray-500 mt-1">
                              Supplier: {event.supplierName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Schedule Event</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <form 
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  // TODO: Implement event creation/saving
                  console.log('Form submitted:', formData);
                  handleCloseModal();
                }}
              >                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Delivery - Product Name"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={formData.date}
                      onChange={(e) => handleFormChange('date', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      className="input-field"
                      value={formData.time}
                      onChange={(e) => handleFormChange('time', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type
                  </label>
                  <select 
                    className="input-field"
                    value={formData.type}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                  >
                    <option value="meeting">Meeting</option>
                    <option value="call">Phone Call</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Conference Room A, Phone, Warehouse, etc."
                    value={formData.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                  />
                </div>
                
                {/* Show order details if an order is selected */}
                {formData.selectedOrderId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    {(() => {
                      const order = orders.find(o => o.id === formData.selectedOrderId);
                      if (!order) return null;
                      return (
                        <div className="text-xs text-blue-800 space-y-1">
                          <p><span className="font-medium">Order ID:</span> {formatOrderId(order.id)}</p>
                          <p><span className="font-medium">Product:</span> {order.product_name}</p>
                          {order.product_description && (
                            <p><span className="font-medium">Description:</span> {order.product_description.substring(0, 100)}...</p>
                          )}
                          {order.quantity && (
                            <p><span className="font-medium">Quantity:</span> {order.quantity} {order.unit_of_measurement || ''}</p>
                          )}
                          {order.total_price_estimate && (
                            <p><span className="font-medium">Total:</span> {order.currency || 'USD'} {order.total_price_estimate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          )}
                          <p><span className="font-medium">Status:</span> {order.status}</p>
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Schedule Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
