import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Navigate, Link } from 'react-router-dom';

export const Login: React.FC = () => {
  const { login, loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log(`[AUTH] Submitting login...`);
    try {
      await login(email, password);
      console.log(`[AUTH] login() resolved successfully in Login.tsx`);
    } catch (err: any) {
      let msg = err.message || 'Failed to login';
      if (err.code === 'auth/invalid-credential') msg = 'Incorrect email or password.';
      if (err.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
      if (err.code === 'auth/network-request-failed') msg = 'Unable to connect. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      let msg = err.message || 'Failed to login with Google';
      if (err.code === 'auth/popup-closed-by-user') msg = 'Google sign-in was cancelled.';
      if (err.code === 'auth/network-request-failed') msg = 'Unable to connect. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-primary flex">
      {/* LEFT COLUMN: BRANDING */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 bg-surface-secondary border-r border-border-dim relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-primary blur-[100px]" />
          <div className="absolute top-[80%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500 blur-[100px]" />
        </div>
        
        <div className="relative z-10 max-w-md w-full text-center">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-brand-primary/10 rounded-2xl border border-brand-primary/30">
              <ShieldCheck className="w-16 h-16 text-brand-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-brand-bright mb-4 tracking-tight">
            NetSecure <span className="text-brand-primary">AI</span>
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            Enterprise-grade configuration auditing and continuous compliance monitoring powered by advanced intelligence.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="p-3 bg-brand-primary/10 rounded-xl border border-brand-primary/30 mb-4">
              <ShieldCheck className="w-10 h-10 text-brand-primary" />
            </div>
            <h2 className="text-2xl font-bold text-brand-bright">NetSecure AI</h2>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-brand-bright mb-2">Welcome back</h2>
            <p className="text-text-secondary">Sign in to your account to continue.</p>
          </div>

          <div className="bg-surface-secondary/50 backdrop-blur-xl border border-border-dim p-8 rounded-2xl shadow-2xl">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-lg text-sm flex items-start gap-3">
                  <div className="mt-0.5"><ShieldCheck className="w-4 h-4 text-red-500" /></div>
                  <div>{error}</div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-border-dim rounded-xl bg-surface-primary text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all sm:text-sm"
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-border-dim rounded-xl bg-surface-primary text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all sm:text-sm pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-dim hover:text-text-primary transition-colors focus:outline-none rounded-xl"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-primary focus:ring-brand-primary disabled:opacity-50 transition-all duration-200"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
                </button>
              </div>
            </form>

            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-border-dim" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-surface-secondary text-text-dim">Or continue with</span>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-border-dim rounded-xl shadow-sm bg-surface-primary hover:bg-surface-primary/80 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-primary focus:ring-brand-primary disabled:opacity-50 transition-all duration-200"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-sm">
            <span className="text-text-dim">Don't have an account? </span>
            <Link to="/register" className="font-semibold text-brand-primary hover:text-brand-primary/80 transition-colors">
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
