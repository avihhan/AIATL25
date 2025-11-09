import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Calendar as CalendarIcon,
  Plus,
  Bell,
  ChevronDown,
  LogOut,
  Settings
} from 'lucide-react';
import PlaceOrderModal from './PlaceOrderModal';
import NotificationCenter from './NotificationCenter';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isPlaceOrderOpen, setIsPlaceOrderOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [initials, setInitials] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Helper function to fetch and update user data
  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Always check profiles table first (most up-to-date)
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, first_name, last_name')
        .eq('id', user.id)
        .single();
      
      if (profile?.display_name) {
        setDisplayName(profile.display_name);
        const names = profile.display_name.split(' ');
        const userInitials = names.map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
        setInitials(userInitials);
      } else if (profile?.first_name || profile?.last_name) {
        const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        setDisplayName(name);
        const userInitials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();
        setInitials(userInitials);
      } else {
        // Fallback to user metadata
        const metaDisplayName = user.user_metadata?.display_name;
        const firstName = user.user_metadata?.first_name;
        const lastName = user.user_metadata?.last_name;
        
        if (metaDisplayName) {
          setDisplayName(metaDisplayName);
          const names = metaDisplayName.split(' ');
          const userInitials = names.map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
          setInitials(userInitials);
        } else if (firstName || lastName) {
          const name = `${firstName || ''} ${lastName || ''}`.trim();
          setDisplayName(name);
          const userInitials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
          setInitials(userInitials);
        } else {
          // Final fallback to email
          setDisplayName(user.email || 'User');
          setInitials(user.email?.[0].toUpperCase() || 'U');
        }
      }
    }
  };

  // Fetch user's display name on component mount and when location changes
  useEffect(() => {
    fetchUserData();
  }, [location.pathname]); // Refetch when navigating (especially when leaving account settings)

  // Listen to auth state changes (when user metadata is updated)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'USER_UPDATED' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUserData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Suppliers', href: '/suppliers', icon: Users },
    { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  ];

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-800 shadow-2xl border-r border-slate-700/50">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-slate-700/50 bg-gradient-to-r from-primary-600/10 to-indigo-600/10">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">
              Procuroid
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-4 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg shadow-primary-500/30'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-md border-b border-gray-200/50">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsPlaceOrderOpen(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Place New Order</span>
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notification Center */}
              <div className="relative z-50">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:shadow-md"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center shadow-lg">
                    3
                  </span>
                </button>
                {isNotificationOpen && <NotificationCenter onClose={() => setIsNotificationOpen(false)} />}
              </div>

              {/* Profile Dropdown */}
              <div className="relative z-50">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:shadow-md"
                >
                  <div className="h-8 w-8 bg-gradient-to-br from-primary-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-sm font-medium text-white">
                      {initials || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {displayName || 'Loading...'}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200/50 py-1 z-50 overflow-hidden">
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-indigo-50 transition-all duration-200"
                      onClick={() => { navigate('/accountsettings'); }}
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      Account Settings
                    </button>
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200"
                      onClick={async () => { await supabase.auth.signOut(); }}
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Modals */}
      {isPlaceOrderOpen && (
        <PlaceOrderModal onClose={() => setIsPlaceOrderOpen(false)} />
      )}
    </div>
  );
};

export default Layout;