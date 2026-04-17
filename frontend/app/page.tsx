'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Camera, Zap, ShieldCheck, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { fadeInUp, staggerContainer, EASE_OUT_EXPO } from '@/lib/animations';

function HomeContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const features = [
    {
      icon: Camera,
      title: 'Real-time Pose Detection',
      desc: 'MediaPipe AI analyzes your pose 30 frames per second with skeleton overlay.',
    },
    {
      icon: Zap,
      title: 'Instant Recommendations',
      desc: 'Get live coaching: lift chin, relax shoulders, adjust lighting — right as you pose.',
    },
    {
      icon: TrendingUp,
      title: 'Track Your Progress',
      desc: 'Score every session from 0–100 and see your weekly improvement trajectory.',
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise Security',
      desc: 'JWT auth with refresh rotation, bcrypt hashing, rate limiting, and CORS control.',
    },
  ];

  return (
    <main className="min-h-screen flex flex-col">
      {/* ── Skip to content ─────────────────────────────────────── */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">
        Skip to content
      </a>

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="fixed top-4 left-0 right-0 z-40 flex justify-center pointer-events-none" role="navigation" aria-label="Main navigation">
        <motion.div
          className="glass-card pointer-events-auto flex items-center gap-8 px-6 py-3 max-w-2xl w-full mx-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={EASE_OUT_EXPO}
        >
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
              <Camera size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>AI Pose Aid</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost py-2 px-4 text-sm">Sign In</Link>
            <Link href="/register" className="btn-primary py-2 px-4 text-sm">Get Started</Link>
          </div>
        </motion.div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section id="main-content" className="min-h-screen flex items-center justify-center px-6 pt-24">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="flex flex-col items-center gap-6"
          >
            <motion.div variants={fadeInUp} transition={EASE_OUT_EXPO}>
              <span className="tag tag-blue">
                <Sparkles size={10} className="mr-1" /> AI-Powered Photography
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              transition={EASE_OUT_EXPO}
              className="text-6xl md:text-8xl font-black leading-none tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.04em' }}
            >
              Your Perfect{' '}
              <span className="gradient-text">Pose</span>
              <br />
              Every Shot
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              transition={EASE_OUT_EXPO}
              className="text-lg md:text-xl text-muted max-w-2xl leading-relaxed"
            >
              AI Pose Aid uses MediaPipe ML to analyze your body posture in real time,
              giving instant recommendations so every photo looks professional.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              transition={EASE_OUT_EXPO}
              className="flex flex-col sm:flex-row items-center gap-4 mt-2"
            >
              <Link href="/register" className="btn-primary gap-2 group text-base px-6 py-3">
                Start for Free
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/login" className="btn-ghost text-base px-6 py-3">
                Sign In
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={fadeInUp}
              transition={EASE_OUT_EXPO}
              className="flex items-center gap-6 mt-4 opacity-60"
            >
              <div className="flex -space-x-2">
                {['#3B82F6','#8B5CF6','#EC4899','#10B981'].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#050A18]" style={{ background: c }} />
                ))}
              </div>
              <p className="text-sm text-muted">2,400+ poses analyzed</p>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <span key={i} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Features Grid ───────────────────────────────────────── */}
      <section className="py-32 px-6" aria-label="Features">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={EASE_OUT_EXPO}
            className="text-center mb-16"
          >
            <p className="tag tag-blue inline-flex mb-4">Why AI Pose Aid</p>
            <h2 className="text-5xl font-black" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.03em' }}>
              Built for photographers
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                className="glass-card interactive p-8"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ ...EASE_OUT_EXPO, delay: i * 0.08 }}
                whileHover={{ y: -8 }}
                whileTap={{ scale: 0.96 }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                  e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                }}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
                  <feat.icon size={22} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>{feat.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ─────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <motion.div
          className="max-w-4xl mx-auto glass-card p-16 text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={EASE_OUT_EXPO}
        >
          <h2 className="text-5xl font-black mb-6" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.03em' }}>
            Ready to pose<br /><span className="gradient-text">perfectly?</span>
          </h2>
          <p className="text-muted text-lg mb-10 max-w-lg mx-auto">
            Join thousands of photographers using AI to improve their posing — in real time.
          </p>
          <Link href="/register" className="btn-primary text-base px-8 py-3 gap-2 group inline-flex">
            Start Free Today
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center">
              <Camera size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>AI Pose Aid</span>
          </div>
          <p className="text-muted text-sm">© 2026 AI Pose Aid. Built with enterprise security.</p>
        </div>
      </footer>
    </main>
  );
}

export default function HomePage() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}
