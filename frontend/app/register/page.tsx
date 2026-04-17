'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mail, Lock, Eye, EyeOff, User, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import Link from 'next/link';
import { fadeInUp, staggerContainer, EASE_OUT_EXPO } from '@/lib/animations';

function RegisterContent() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const passwordStrength = (pw: string) => {
    if (pw.length < 6) return { label: 'Weak', color: '#EF4444', pct: 20 };
    if (pw.length < 8) return { label: 'Fair', color: '#F59E0B', pct: 45 };
    if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pw)) return { label: 'Strong', color: '#10B981', pct: 100 };
    return { label: 'Moderate', color: '#3B82F6', pct: 70 };
  };

  const strength = passwordStrength(form.password);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required.';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required.';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email.';
    if (!form.password || form.password.length < 8) errs.password = 'Minimum 8 characters with uppercase, lowercase, and number.';
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) errs.password = 'Must include uppercase, lowercase, and a number.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form);
      router.push('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr?.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    setFieldErrors(p => ({ ...p, [field]: '' }));
  };

  const passwordRequirements = [
    { label: 'At least 8 characters', met: form.password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(form.password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(form.password) },
    { label: 'Number', met: /\d/.test(form.password) },
  ];

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="w-full max-w-md"
      >
        <motion.div variants={fadeInUp} transition={EASE_OUT_EXPO} className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors text-sm" aria-label="Back to home">
            <ArrowLeft size={14} /> Back to home
          </Link>
        </motion.div>

        <motion.div variants={fadeInUp} transition={EASE_OUT_EXPO} className="glass-card p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <Camera size={18} className="text-white" />
            </div>
            <div>
              <p className="font-black text-base" style={{ fontFamily: 'Syne, sans-serif' }}>AI Pose Aid</p>
              <p className="text-muted text-xs">Create your account</p>
            </div>
          </div>

          <h1 className="text-3xl font-black mb-2" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.03em' }}>
            Start improving
          </h1>
          <p className="text-muted text-sm mb-8">Free account — analyze unlimited poses</p>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-start gap-3 p-4 mb-6 border-l-4 border-red-500/70 glass-card rounded-xl bg-red-500/[0.06]"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-fname" className="block text-sm font-medium mb-2">First name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                  <input
                    id="reg-fname"
                    type="text"
                    value={form.firstName}
                    onChange={set('firstName')}
                    className={`input-field pl-10 ${fieldErrors.firstName ? 'input-error' : ''}`}
                    placeholder="John"
                    autoComplete="given-name"
                    aria-invalid={!!fieldErrors.firstName}
                  />
                </div>
                {fieldErrors.firstName && <p className="mt-1 text-xs text-red-400">{fieldErrors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="reg-lname" className="block text-sm font-medium mb-2">Last name</label>
                <input
                  id="reg-lname"
                  type="text"
                  value={form.lastName}
                  onChange={set('lastName')}
                  className={`input-field ${fieldErrors.lastName ? 'input-error' : ''}`}
                  placeholder="Doe"
                  autoComplete="family-name"
                  aria-invalid={!!fieldErrors.lastName}
                />
                {fieldErrors.lastName && <p className="mt-1 text-xs text-red-400">{fieldErrors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium mb-2">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                <input
                  id="reg-email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  className={`input-field pl-10 ${fieldErrors.email ? 'input-error' : ''}`}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={!!fieldErrors.email}
                />
              </div>
              {fieldErrors.email && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  className={`input-field pl-10 pr-10 ${fieldErrors.password ? 'input-error' : ''}`}
                  placeholder="Make it strong…"
                  autoComplete="new-password"
                  aria-invalid={!!fieldErrors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.password}</p>}

              {/* Strength bar */}
              {form.password && (
                <div className="mt-2">
                  <div className="score-bar">
                    <div
                      className="score-bar-fill"
                      style={{ width: `${strength.pct}%`, background: strength.color }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: strength.color }}>{strength.label}</p>
                </div>
              )}

              {/* Requirements */}
              {form.password && (
                <div className="mt-3 grid grid-cols-2 gap-1">
                  {passwordRequirements.map(req => (
                    <div key={req.label} className="flex items-center gap-1.5">
                      <CheckCircle size={11} className={req.met ? 'text-emerald-400' : 'text-white/20'} />
                      <span className={`text-xs ${req.met ? 'text-emerald-400' : 'text-muted'}`}>{req.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 justify-center"
              whileTap={{ scale: 0.96 }}
              aria-label="Create account"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating account…
                </span>
              ) : 'Create Free Account'}
            </motion.button>
          </form>

          <div className="divider my-6" />

          <p className="text-center text-muted text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <AuthProvider>
      <RegisterContent />
    </AuthProvider>
  );
}
