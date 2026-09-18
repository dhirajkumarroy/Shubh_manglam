import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { Shield, KeyRound, AlertCircle, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-[#E7E0D8] p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <span className="block text-xs font-bold uppercase tracking-widest text-[#D97706] mb-1">
            Executive Portal
          </span>
          <h1 className="text-2xl font-black text-[#1C1917]">Shubh Ausar Admin</h1>
          <p className="text-xs text-[#78716C] mt-1">
            शुभ अवसर • Administrative Governance Console
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!mfaRequired ? (
            <>
              <div>
                <label className="block text-xs font-bold text-[#1C1917] mb-1 uppercase tracking-wider">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin.demo@shubhausar.local"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7E0D8] bg-[#FAF8F5] text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1917] mb-1 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7E0D8] bg-[#FAF8F5] text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent transition"
                />
              </div>
            </>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                <KeyRound className="w-4 h-4" />
                <span>Multi-Factor Authentication Required</span>
              </div>
              <p className="text-xs text-amber-700">
                Enter the 6-digit TOTP code from your authenticator app.
              </p>
              <input
                type="text"
                required
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="123456"
                className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest rounded-lg border border-amber-300 bg-white text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-lg bg-[#800020] hover:bg-[#600018] text-white text-sm font-bold shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : mfaRequired ? (
              <span>Verify & Sign In</span>
            ) : (
              <span>Sign In to Executive Console</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-[#E7E0D8] text-center">
          <p className="text-[11px] text-[#78716C]">
            Public registration is forbidden. Administrative accounts are created exclusively via provisioning scripts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
