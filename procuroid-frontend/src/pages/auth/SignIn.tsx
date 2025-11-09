// src/pages/auth/SignIn.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { signIn } from '../../api/apiCalls';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSplash] = useState(false); // 🔹 new
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true); 
    setErr(null);
    
    try {
      // Call backend API to sign in
      const response = await signIn({ email, password });
      
      if (response.success && response.session) {
        // Set the session in Supabase client so future requests work
        await supabase.auth.setSession({
          access_token: response.session.access_token,
          refresh_token: response.session.refresh_token,
        });
        
        navigate('/dashboard');
      } else {
        setErr(response.error || 'Sign in failed');
      }
    } catch (error: any) {
      setErr(error.response?.data?.error || error.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <nav className="absolute top-0 left-0 w-full z-10 flex justify-between items-center px-8 py-4 bg-black/40 rounded-b-lg text-white shadow-2xl">
        <div className="flex items-center space-x-4">
          <img src="/assets/logo.png" alt="Logo" className="h-10 w-10"/>
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">Procuroid</Link>
        </div>
        <div className="space-x-4">
          <button
            onClick={() => navigate('/signin')}
            className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/30 transition"
          >
            Log In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Sign Up
          </button>
        </div>
      </nav>
      {/* Background Image */}
      <img
        src="/assets/background.png"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover z-0 filter grayscale-[50%]"
      />


      {/* Optional overlay to control opacity */}
      <div className="absolute inset-0 bg-black/20 z-0"></div>

      {/* Sign In Card */}
      <div className="relative z-10 w-full max-w-md bg-white/70 rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign in</h1>

        {err && <div className="mb-4 text-sm text-red-600">{err}</div>}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="********"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-md hover:scale-105 transition-transform"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-sm text-black-600 mt-6 text-center">
          No account? <Link to="/signup" className="text-primary-600 font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}