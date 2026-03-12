'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, CheckCircle2, AlertCircle, Check } from 'lucide-react';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains uppercase', met: /[A-Z]/.test(password) },
  ];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;

      setSuccess('Account created! Please check your email to verify.');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#030308] py-12">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#8B5CF6]/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#00AEEF]/10 blur-[100px] animate-pulse-slow animation-delay-2000" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#030308_70%)]" />
      </div>

      {/* Signup Card */}
      <div 
        className={`relative z-10 w-full max-w-[440px] mx-4 transition-all duration-1000 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-[#8B5CF6]/20 via-[#00AEEF]/20 to-[#8B5CF6]/20 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 p-[1px]">
            <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a12]" />
          </div>

          <div className="relative bg-[#0a0a12]/90 backdrop-blur-xl rounded-3xl p-10 border border-white/[0.08] shadow-2xl shadow-black/50">
            
            {/* Logo Section */}
            <div className={`text-center mb-8 transition-all duration-700 delay-100 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <div className="inline-flex items-center justify-center mb-6 group/logo">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#00AEEF] rounded-xl blur-xl opacity-30 group-hover/logo:opacity-50 transition-opacity duration-300" />
                  <div className="relative w-12 h-12 bg-gradient-to-br from-[#00AEEF] to-[#0088cc] rounded-xl flex items-center justify-center shadow-lg shadow-[#00AEEF]/25 group-hover/logo:scale-105 transition-all duration-300">
                    <span className="text-white text-xl font-bold">T</span>
                  </div>
                </div>
                <div className="ml-3 text-left">
                  <h1 className="text-xl font-bold text-white tracking-wide">TANGENT</h1>
                  <p className="text-[9px] text-gray-400 tracking-[0.25em] uppercase">Landscape Architecture</p>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-2">Create Account</h2>
              <p className="text-gray-500 text-sm">Join Tangent to manage your projects</p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Full Name Input */}
              <div className={`transition-all duration-700 delay-150 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-[#00AEEF] transition-colors duration-300">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00AEEF]/50 focus:bg-white/[0.05] transition-all duration-300"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className={`transition-all duration-700 delay-200 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-[#00AEEF] transition-colors duration-300">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00AEEF]/50 focus:bg-white/[0.05] transition-all duration-300"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className={`transition-all duration-700 delay-250 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-[#00AEEF] transition-colors duration-300">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00AEEF]/50 focus:bg-white/[0.05] transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#00AEEF] transition-colors duration-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Requirements */}
                {password && (
                  <div className="mt-3 space-y-1.5">
                    {passwordRequirements.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors duration-300 ${
                          req.met ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-600'
                        }`}>
                          <Check className="w-3 h-3" />
                        </div>
                        <span className={`text-xs transition-colors duration-300 ${
                          req.met ? 'text-green-400' : 'text-gray-500'
                        }`}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className={`transition-all duration-700 delay-300 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-[#00AEEF] transition-colors duration-300">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00AEEF]/50 focus:bg-white/[0.05] transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#00AEEF] transition-colors duration-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Sign Up Button */}
              <div className={`pt-3 transition-all duration-700 delay-350 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full group/btn overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00AEEF] to-[#0088cc] rounded-xl opacity-80 group-hover/btn:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00AEEF] to-[#8B5CF6] rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                  
                  <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
                  
                  <div className="relative flex items-center justify-center gap-2 py-4 px-6 text-white font-semibold rounded-xl shadow-lg shadow-[#00AEEF]/25 group-hover/btn:shadow-[#00AEEF]/40 transition-all duration-300 group-hover/btn:scale-[1.02] active:scale-[0.98]">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </form>

            {/* Sign In Link */}
            <div className={`text-center mt-8 transition-all duration-700 delay-400 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <p className="text-gray-500 text-sm">
                Already have an account?{' '}
                <Link 
                  href="/login"
                  className="text-[#00AEEF] font-medium hover:text-[#33c4ff] transition-colors duration-300 relative group/link"
                >
                  <span>Sign in</span>
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#00AEEF] group-hover/link:w-full transition-all duration-300" />
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`text-center mt-8 transition-all duration-700 delay-500 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}>
          <p className="text-gray-600 text-xs">
            © 2026 Tangent Landscape Architecture. All rights reserved.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
