import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Loader2, Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';
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
    try {
      await login(email, password);
    } catch (err: any) {
      let msg = err.message || 'Failed to login';
      if (err.code === 'auth/invalid-credential') msg = 'Incorrect email or password.';
      if (err.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
      if (err.code === 'auth/network-request-failed') msg = 'Unable to connect. Please check network.';
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
      if (err.code === 'auth/network-request-failed') msg = 'Unable to connect. Please check network.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F3F7] text-[#0A282D] flex flex-col lg:flex-row font-sans selection:bg-[#3DB663]/25 selection:text-[#0A282D]">
      {/* LEFT COLUMN: EDITORIAL BRAND NARRATIVE (POTADOT DARK AESTHETIC) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 lg:p-16 bg-[#0A282D] text-white border-r border-[#1E4950] relative overflow-hidden">
        <div className="dark-dots absolute inset-0 opacity-35 pointer-events-none" />
        <div className="orb orb--dark-ring w-[400px] h-[400px] -right-20 top-20" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#3DB663] text-white shadow-xs">
              <Shield size={20} className="stroke-[2.4]" />
            </div>
            <div className="text-base font-display font-bold tracking-tight text-white">
              NetSecure AI
            </div>
          </Link>
        </div>

        <div className="max-w-md my-auto space-y-6 relative z-10">
          <span className="eyebrow eyebrow-dark">Enterprise Access Portal</span>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight leading-tight">
            Deterministic security compliance for network backbones.
          </h1>
          <p className="text-sm text-[#A3B8BC] leading-relaxed">
            Multi-vendor AST parsing across Cisco IOS-XE, Fortinet FortiOS, Palo Alto PAN-OS, and Juniper Junos. Continuous verification against CIS and NIST regulatory benchmarks.
          </p>

          <div className="pt-6 border-t border-white/10 font-mono text-xs text-[#A3B8BC] space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#3DB663]" />
              <span>Strict human-in-the-loop authorization safeguards</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#3DB663]" />
              <span>Persistent learned mapping registry &bull; SQLite backed</span>
            </div>
          </div>
        </div>

        <div className="text-xs font-mono text-[#7E8F95] relative z-10">
          &copy; {new Date().getFullYear()} NetSecure AI Platform &bull; v1.0.0
        </div>
      </div>

      {/* RIGHT COLUMN: AUTHENTICATION FORM */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center py-12 px-4 sm:px-8 lg:px-16">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Brand Link */}
          <div className="lg:hidden flex items-center justify-between pb-6 border-b border-[#D7DCE5]">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0A282D] text-white">
                <Shield size={18} className="text-[#3DB663]" />
              </div>
              <span className="font-display font-bold text-base text-[#0A282D]">NetSecure AI</span>
            </Link>
          </div>

          <div>
            <div className="eyebrow mb-2">Auditor Authentication</div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0A282D] tracking-tight">
              Sign In to Console
            </h2>
            <p className="text-xs sm:text-sm text-[#4A5B60] mt-1">
              Enter your credentials to access the fleet audit workspace.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-[#D7DCE5] rounded-3xl p-6 sm:p-8 shadow-xs">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3.5 bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] rounded-2xl text-xs font-mono flex items-start gap-2">
                  <span className="font-bold uppercase tracking-wider block">Error:</span>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#7E8F95] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F2F3F7] border border-[#D7DCE5] rounded-full text-xs text-[#0A282D] placeholder:text-[#7E8F95] focus:outline-none focus:border-[#3DB663] font-mono"
                  placeholder="auditor@organization.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#7E8F95] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F2F3F7] border border-[#D7DCE5] rounded-full text-xs text-[#0A282D] placeholder:text-[#7E8F95] focus:outline-none focus:border-[#3DB663] pr-10 font-mono"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7E8F95] hover:text-[#0A282D]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn--green text-xs py-3 justify-center disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Console</span>
                    <span className="btn-ico">
                      <ArrowRight size={13} className="stroke-[2.5]" />
                    </span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#D7DCE5]" />
              </div>
              <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-wider">
                <span className="px-3 bg-white text-[#7E8F95]">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-[#D7DCE5] hover:border-[#0A282D] bg-[#F2F3F7] hover:bg-[#E8EAF0] rounded-full font-mono text-xs font-semibold text-[#0A282D] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google Enterprise SSO</span>
              </button>
            </div>
          </div>

          {/* Registration Link */}
          <div className="text-center font-mono text-xs text-[#4A5B60]">
            Need auditor clearance?{' '}
            <Link
              to="/register"
              className="text-[#0A282D] hover:text-[#3DB663] font-bold underline transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
