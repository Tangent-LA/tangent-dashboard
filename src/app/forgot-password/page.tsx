'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#030308]">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#00AEEF]/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#8B5CF6]/10 blur-[100px] animate-pulse-slow animation-delay-2000" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#030308_70%)]" />
      </div>

      {/* Card */}
      <div 
        className={`relative z-10 w-full max-w-[440px] mx-4 transition-all duration-1000 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-[#00AEEF]/20 via-[#8B5CF6]/20 to-[#00AEEF]/20 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 p-[1px]">
            <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a12]" />
          </div>

          <div className="relative bg-[#0a0a12]/90 backdrop-blur-xl rounded-3xl p-10 border border-white/[0.08] shadow-2xl shadow-black/50">
            
            {/* Back Link */}
            <Link 
              href="/login"
              className={`inline-flex items-center gap-2 text-gray-500 hover:text-[#00AEEF] transition-colors duration-300 mb-8 group/back ${
                mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              }`}
              style={{ transitionDelay: '100ms' }}
            >
              <ArrowLeft className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform duration-300" />
              <span className="text-sm">Back to login</span>
            </Link>

            {!success ? (
              <>
                {/* Header */}
                <div className={`mb-8 transition-all duration-700 delay-150 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}>
                  <div className="w-16 h-16 rounded-2xl bg-[#00AEEF]/10 flex items-center justify-center mb-6">
                    <Mail className="w-8 h-8 text-[#00AEEF]" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white mb-2">Reset Password</h2>
                  <p className="text-gray-500 text-sm">Enter your email and we'll send you a link to reset your password.</p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 animate-shake">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className={`transition-all duration-700 delay-200 ${
                    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className={`relative group/input transition-all duration-300 ${
                      emailFocused ? 'scale-[1.02]' : ''
                    }`}>
                      <div className={`absolute -inset-[1px] bg-gradient-to-r from-[#00AEEF] to-[#8B5CF6] rounded-xl opacity-0 blur-sm transition-opacity duration-300 ${
                        emailFocused ? 'opacity-50' : 'group-hover/input:opacity-30'
                      }`} />
                      
                      <div className="relative flex items-center">
                        <div className={`absolute left-4 transition-colors duration-300 ${
                          emailFocused ? 'text-[#00AEEF]' : 'text-gray-500'
                        }`}>
                          <Mail className="w-5 h-5" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setEmailFocused(true)}
                          onBlur={() => setEmailFocused(false)}
                          placeholder="name@company.com"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#00AEEF]/50 focus:bg-white/[0.05] transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className={`pt-2 transition-all duration-700 delay-250 ${
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
                            <span>Send Reset Link</span>
                            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Success State */
              <div className={`text-center transition-all duration-700 ${
                mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}>
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-3">Check Your Email</h2>
                <p className="text-gray-400 text-sm mb-8">
                  We've sent a password reset link to<br />
                  <span className="text-[#00AEEF] font-medium">{email}</span>
                </p>
                <p className="text-gray-500 text-xs mb-6">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button 
                    onClick={() => setSuccess(false)}
                    className="text-[#00AEEF] hover:underline"
                  >
                    try again
                  </button>
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-[#00AEEF] hover:text-[#33c4ff] transition-colors duration-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to login</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`text-center mt-8 transition-all duration-700 delay-300 ${
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
