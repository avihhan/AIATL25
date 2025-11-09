// src/pages/auth/SignUp.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../../api/apiCalls';
import { supabase } from '../../lib/supabase';

export default function SignUp() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    try {
      const response = await signUp({
        email,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      if (response.success && response.session) {
        // Set session in Supabase
        await supabase.auth.setSession({
          access_token: response.session.access_token,
          refresh_token: response.session.refresh_token,
        });

        navigate('/dashboard');
      } else if (response.success) {
        // Show confirmation message if email verification needed
        setMsg(response.message || 'Check your email to confirm your account.');
      } else {
        setErr(response.error || 'Sign up failed');
      }
    } catch (error: any) {
      setErr(error.response?.data?.error || error.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <nav className="absolute top-0 left-0 w-full z-10 flex justify-between items-center px-8 py-4 bg-black/40 rounded-b-lg text-white shadow-2xl">
      <Link to="/" className="text-2xl font-bold text-primary-600">Procuroid</Link>


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
        src="/src/assets/background.png"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover z-0 filter grayscale-[50%]"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 z-0"></div>

      {/* Sign Up Card */}
      <div className="relative z-10 w-full max-w-md bg-white/70 rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create Account</h1>

        {msg && <div className="mb-4 text-sm text-green-700">{msg}</div>}
        {err && <div className="mb-4 text-sm text-red-600">{err}</div>}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="********"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-md hover:scale-105 transition-transform"
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-sm text-black-600 mt-6 text-center">
          Already have an account?{' '}
          <Link to="/signin" className="text-primary-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
