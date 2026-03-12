'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mounted, setMounted] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setMounted(true);
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      router.push('/dashboard');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@tangentlandscape.com');
    setPassword('demo123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#030308]">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#00AEEF]/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#8B5CF6]/10 blur-[100px] animate-pulse-slow animation-delay-2000" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-[#00AEEF]/5 blur-[80px] animate-float" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        
        {/* Radial Gradient Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#030308_70%)]" />
      </div>

      {/* Login Card */}
      <div 
        className={`relative z-10 w-full max-w-[440px] mx-4 transition-all duration-1000 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Glass Card */}
        <div className="relative group">
          {/* Glow Effect */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-[#00AEEF]/20 via-[#8B5CF6]/20 to-[#00AEEF]/20 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Card Border */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 p-[1px]">
            <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a12]" />
          </div>

          {/* Card Content */}
          <div className="relative bg-[#0a0a12]/90 backdrop-blur-xl rounded-3xl p-10 border border-white/[0.08] shadow-2xl shadow-black/50">
            
            {/* Logo Section */}
            <div className={`text-center mb-10 transition-all duration-700 delay-100 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {/* Logo */}
              <div className="inline-flex items-center justify-center mb-6 group/logo">
                <div className="relative">
                  {/* Logo Glow */}
                  <div className="absolute inset-0 bg-[#00AEEF] rounded-xl blur-xl opacity-30 group-hover/logo:opacity-50 transition-opacity duration-300" />
                  {/* Logo Box */}
                  <div className="relative w-14 h-14 bg-gradient-to-br from-[#00AEEF] to-[#0088cc] rounded-xl flex items-center justify-center shadow-lg shadow-[#00AEEF]/25 group-hover/logo:shadow-[#00AEEF]/40 group-hover/logo:scale-105 transition-all duration-300">
                    <span className="text-white text-2xl font-bold">T</span>
                  </div>
                </div>
                <div className="ml-4 text-left">
                  <h1 className="text-2xl font-bold text-white tracking-wide">TANGENT</h1>
                  <p className="text-[10px] text-gray-400 tracking-[0.3em] uppercase">Landscape Architecture</p>
                </div>
              </div>

              {/* Welcome Text */}
              <h2 className="text-2xl font-semibold text-white mb-2">Welcome Back</h2>
              <p className="text-gray-500 text-sm">Sign in to continue to your dashboard</p>
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
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Input */}
              <div className={`transition-all duration-700 delay-200 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className={`relative group/input transition-all duration-300 ${
                  emailFocused ? 'scale-[1.02]' : ''
                }`}>
                  {/* Input Glow */}
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

              {/* Password Input */}
              <div className={`transition-all duration-700 delay-300 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className={`relative group/input transition-all duration-300 ${
                  passwordFocused ? 'scale-[1.02]' : ''
                }`}>
                  {/* Input Glow */}
                  <div className={`absolute -inset-[1px] bg-gradient-to-r from-[#00AEEF] to-[#8B5CF6] rounded-xl opacity-0 blur-sm transition-opacity duration-300 ${
                    passwordFocused ? 'opacity-50' : 'group-hover/input:opacity-30'
                  }`} />
                  
                  <div className="relative flex items-center">
                    <div className={`absolute left-4 transition-colors duration-300 ${
                      passwordFocused ? 'text-[#00AEEF]' : 'text-gray-500'
                    }`}>
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder="Enter your password"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-12 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#00AEEF]/50 focus:bg-white/[0.05] transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-gray-500 hover:text-[#00AEEF] transition-colors duration-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sign In Button */}
              <div className={`pt-2 transition-all duration-700 delay-400 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full group/btn overflow-hidden"
                >
                  {/* Button Glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00AEEF] to-[#0088cc] rounded-xl opacity-80 group-hover/btn:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00AEEF] to-[#8B5CF6] rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
                  
                  {/* Button Content */}
                  <div className="relative flex items-center justify-center gap-2 py-4 px-6 text-white font-semibold rounded-xl shadow-lg shadow-[#00AEEF]/25 group-hover/btn:shadow-[#00AEEF]/40 transition-all duration-300 group-hover/btn:scale-[1.02] active:scale-[0.98]">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </form>

            {/* Forgot Password */}
            <div className={`text-center mt-6 transition-all duration-700 delay-500 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <Link 
                href="/forgot-password"
                className="text-[#00AEEF] text-sm hover:text-[#33c4ff] transition-colors duration-300 relative group/link"
              >
                <span>Forgot your password?</span>
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#00AEEF] group-hover/link:w-full transition-all duration-300" />
              </Link>
            </div>

            {/* Divider */}
            <div className={`flex items-center gap-4 my-8 transition-all duration-700 delay-600 ${
              mounted ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <span className="text-gray-600 text-xs uppercase tracking-wider">or</span>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            {/* Sign Up Link */}
            <div className={`text-center transition-all duration-700 delay-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <p className="text-gray-500 text-sm">
                Don't have an account?{' '}
                <Link 
                  href="/signup"
                  className="text-[#00AEEF] font-medium hover:text-[#33c4ff] transition-colors duration-300 relative group/link"
                >
                  <span>Sign up</span>
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#00AEEF] group-hover/link:w-full transition-all duration-300" />
                </Link>
              </p>
            </div>

            {/* Demo Mode */}
            <div className={`mt-8 pt-6 border-t border-white/5 transition-all duration-700 delay-800 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <button
                onClick={handleDemoLogin}
                className="w-full group/demo flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 hover:border-[#00AEEF]/30 hover:bg-white/[0.02] transition-all duration-300"
              >
                <Sparkles className="w-4 h-4 text-[#00AEEF] group-hover/demo:rotate-12 transition-transform duration-300" />
                <span className="text-gray-400 text-sm group-hover/demo:text-gray-300 transition-colors duration-300">
                  <span className="text-[#00AEEF] font-medium">Demo Mode:</span> Explore all features
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`text-center mt-8 transition-all duration-700 delay-900 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}>
          <p className="text-gray-600 text-xs">
            © 2026 Tangent Landscape Architecture. All rights reserved.
          </p>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(0) translateX(20px); }
          75% { transform: translateY(20px) translateX(10px); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        
        .animate-float {
          animation: float 15s ease-in-out infinite;
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
