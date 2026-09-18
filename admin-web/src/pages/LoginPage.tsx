import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { 
  Shield, 
  KeyRound, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  BadgeCheck,
  Zap,
  Building2,
  CalendarDays,
  Coins
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);

  const handleFillDemo = () => {
    setEmail('admin@gmail.com');
    setPassword('Password@123');
    setError(null);
    setDemoLoaded(true);
    setTimeout(() => setDemoLoaded(false), 2500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login({
        email: email.trim().toLowerCase(),
        password,
        ...(mfaRequired ? { mfaCode: mfaCode.trim() } : {}),
      });

      if (res.mfaRequired) {
        setMfaRequired(true);
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAF8F5] text-[#1C1917] antialiased selection:bg-[#E65100] selection:text-white">
      {/* LEFT COLUMN: Hero & Visual Showcase (Visible on Large Screens) */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[50%] relative overflow-hidden bg-gradient-to-br from-[#4C0519] via-[#881337] to-[#C2410C] text-white p-12 xl:p-16 flex-col justify-between shadow-2xl">
        {/* Ambient Decorative Blurs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#F97316]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#D97706]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        {/* Subtle Decorative Pattern */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />

        {/* Brand Top Header */}
        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D97706] to-[#FBBF24] p-[2px] shadow-lg shadow-black/20">
              <div className="w-full h-full bg-[#4C0519] rounded-[14px] flex items-center justify-center font-black text-xl text-[#FBBF24] tracking-tight">
                SA
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white">Shubh Ausar</h1>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-white/15 text-[#FBBF24] border border-white/10">
                  Admin
                </span>
              </div>
              <p className="text-xs font-medium text-amber-200/80">Governance & Marketplace Console</p>
            </div>
          </div>
        </div>

        {/* Showcase Core Content */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-amber-200 mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span>Platform Governance & Audit Suite v2.4</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight mb-4 text-white">
            Orchestrating India's Premier <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FBBF24] via-amber-200 to-white">Celebration Marketplace</span>
          </h2>
          <p className="text-sm xl:text-base text-rose-100/85 leading-relaxed max-w-lg mb-8">
            Complete executive oversight across multi-category vendor vetting, customer event proposals, automated quote-to-booking dispatch, and escrow financial settlements.
          </p>

          {/* Value Highlights Grid */}
          <div className="grid grid-cols-1 gap-3.5 max-w-md">
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition duration-200">
              <div className="w-10 h-10 rounded-lg bg-[#D97706]/30 flex items-center justify-center text-[#FBBF24] shrink-0">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">Multi-Tier KYC & Onboarding</h4>
                <p className="text-[11px] text-rose-200/80 leading-normal">Document verification & quality audits for caterers, decorators, and artists.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition duration-200">
              <div className="w-10 h-10 rounded-lg bg-[#F97316]/30 flex items-center justify-center text-amber-200 shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">Real-time Quote & Booking Pipeline</h4>
                <p className="text-[11px] text-rose-200/80 leading-normal">End-to-end trace from inquiry submission to confirmed calendar booking.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition duration-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">Escrow Ledger & Payout Controls</h4>
                <p className="text-[11px] text-rose-200/80 leading-normal">Transparent platform commission deduction and instant vendor bank payouts.</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Health Footer in Left Pane */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-rose-200/80">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
            <span className="font-semibold text-white">Central Services Operational</span>
          </div>
          <span className="font-mono text-[11px] opacity-75">TLS 1.3 / AES-256</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Executive Sign-In Form */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 md:p-16 lg:p-12 xl:p-20 relative">
        {/* Mobile Header Brand (Only visible on small screens) */}
        <div className="lg:hidden flex items-center justify-between pb-6 mb-6 border-b border-[#E7E0D8]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#881337] to-[#E65100] flex items-center justify-center text-white font-black text-sm shadow-md">
              SA
            </div>
            <div>
              <h1 className="font-extrabold text-base text-[#1C1917] tracking-tight">Shubh Ausar</h1>
              <p className="text-[11px] text-[#E65100] font-semibold">Marketplace Admin Console</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-800">
            <Shield className="w-3 h-3 text-[#D97706]" />
            SECURE
          </span>
        </div>

        {/* Center Container */}
        <div className="w-full max-w-md mx-auto my-auto py-4">
          {/* Header Title */}
          <div className="mb-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FEF3C7] text-[#92400E] text-[11px] font-bold uppercase tracking-wider mb-3">
              <Shield className="w-3.5 h-3.5 text-[#D97706]" />
              Executive Access
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C1917] tracking-tight">
              Sign In to Console
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C] mt-1.5 leading-relaxed">
              Enter your authorized credentials to access platform operations, catalog curation, and transactions.
            </p>
          </div>

          {/* Quick Demo Credentials Pill (User Interactive) */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleFillDemo}
              className={`w-full group relative overflow-hidden flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
                demoLoaded 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm' 
                  : 'bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-amber-50/90 border-amber-200/80 text-[#92400E] hover:border-[#D97706] hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  demoLoaded ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200/80 text-[#B45309] group-hover:bg-[#D97706] group-hover:text-white'
                }`}>
                  {demoLoaded ? <CheckCircle2 className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">
                    {demoLoaded ? 'Credentials Loaded!' : 'Auto-fill Demo Admin'}
                  </p>
                  <p className="text-[10px] text-[#A8A29E] group-hover:text-[#78716C] transition">
                    admin@gmail.com • Password@123
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold underline underline-offset-2 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                {demoLoaded ? 'Ready' : 'Click to Load'}
                <ArrowRight className="w-3 h-3" />
              </span>
            </button>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/90 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Authentication Failed</p>
                <p className="text-[11px] text-red-600/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!mfaRequired ? (
              <>
                {/* Email Field */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#44403C] mb-1.5">
                    Admin Work Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A29E]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@gmail.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-white text-sm text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#881337] focus:border-transparent transition shadow-sm font-medium"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#44403C]">
                      Password
                    </label>
                    {capsLockActive && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        Caps Lock ON
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A29E]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your security password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#D6D3D1] bg-white text-sm text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#881337] focus:border-transparent transition shadow-sm font-medium"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A8A29E] hover:text-[#44403C] transition"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Options Row: Remember Me & Security Policy */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#D6D3D1] text-[#881337] focus:ring-[#881337]"
                    />
                    <span className="text-[#57534E] font-medium text-xs">Keep session active</span>
                  </label>
                  <span className="text-[11px] text-[#A8A29E]">Default Session: 7 Days</span>
                </div>
              </>
            ) : (
              /* MFA Step */
              <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-4 shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 text-amber-900">
                  <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center text-amber-800 shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider">Multi-Factor Authentication</h3>
                    <p className="text-[11px] text-amber-700">Enter the 6-digit TOTP code from your mobile authenticator</p>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••••"
                    className="w-full py-3 text-center text-2xl font-mono tracking-[0.35em] font-bold rounded-xl border-2 border-amber-300 bg-white text-[#1C1917] focus:outline-none focus:border-[#D97706] focus:ring-4 focus:ring-amber-200/50 shadow-inner transition"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setMfaRequired(false)}
                  className="text-xs font-bold text-amber-800 hover:text-amber-900 hover:underline block text-center w-full"
                >
                  &larr; Back to password login
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#881337] via-[#9F1239] to-[#E65100] hover:from-[#6B0D2B] hover:via-[#881337] hover:to-[#C2410C] text-white text-sm font-bold shadow-lg shadow-rose-950/20 hover:shadow-xl hover:shadow-rose-950/25 transition duration-200 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : mfaRequired ? (
                <>
                  <BadgeCheck className="w-4 h-4" />
                  <span>Verify TOTP & Enter Console</span>
                </>
              ) : (
                <>
                  <span>Sign In to Executive Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security & Access Notice */}
          <div className="mt-8 pt-5 border-t border-[#E7E0D8]/80 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#78716C] mb-1">
              <Shield className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Role-Based Privilege Level 1 • Strict Governance</span>
            </div>
            <p className="text-[11px] text-[#A8A29E] leading-relaxed max-w-xs mx-auto">
              Public registration is disabled. Administrative accounts are provisioned by corporate IT scripts. All access attempts are logged.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 text-center text-[11px] text-[#A8A29E]">
          © {new Date().getFullYear()} Shubh Ausar Technologies Private Limited. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
