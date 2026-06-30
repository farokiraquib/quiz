import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hexagon, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('livequizz_token');
    if (token) {
      if (localStorage.getItem('intended_plan')) {
        navigate('/pricing', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem('livequizz_token', data.token);
        localStorage.setItem('livequizz_user', JSON.stringify(data.user));
        
        if (localStorage.getItem('intended_plan')) {
          navigate('/pricing');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#163022] flex items-center justify-center p-4 relative bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:32px_32px]">
      
      <div className="w-full max-w-md relative">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-10 group">
          <div className="w-10 h-10 rounded-xl bg-[#fcd34d] flex items-center justify-center shadow-[0_0_10px_rgba(252,211,77,0.3)] border-2 border-white/20 group-hover:scale-110 transition-transform duration-300">
            <Hexagon className="w-5 h-5 text-[#163022] fill-[#163022]" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight font-serif">LiveQuizz</span>
        </Link>

        {/* Card */}
        <div className="bg-[#1b3a2a] border-2 border-[#12261a] shadow-2xl rounded-2xl p-8 sm:p-10 animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white tracking-tight mb-2 font-serif">Welcome Back</h1>
            <p className="text-white/60 text-sm font-medium">Sign in to manage your quizzes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  className="input-field !bg-[#163022] !border-white/20 focus:!border-yellow-400 !pl-11 text-white placeholder-white/40"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field !bg-[#163022] !border-white/20 focus:!border-yellow-400 !pl-11 !pr-11 text-white placeholder-white/40"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-fade-in">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#fcd34d] text-[#163022] font-bold text-lg px-8 py-3.5 rounded-xl hover:bg-[#fde68a] hover:scale-[0.98] transition-all shadow-[0_4px_0_#d97706] active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Signing In...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Log In
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-white/40">
              Don't have an account?{' '}
              <Link to="/signup" className="text-white font-semibold hover:underline">
                Sign up free
              </Link>
            </p>
          </div>
        </div>

        {/* Back to landing */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-white/30 hover:text-white/60 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
