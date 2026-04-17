'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, TrendingUp, Clock, Award, History, LogOut, User, Zap, ChevronRight, RefreshCw } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { posesApi, usersApi } from '@/lib/api';
import Link from 'next/link';
import { fadeInUp, staggerContainer, EASE_OUT_EXPO } from '@/lib/animations';

interface Pose {
  id: string;
  score: number;
  poseType: string;
  confidence: number;
  createdAt: string;
  recommendations: { area: string; suggestion: string; priority: string }[];
}

interface Stats {
  totalPoses: number;
  weeklyPoses: number;
  averageScore: number;
  topScore: number;
}

function ScoreColor(score: number) {
  if (score >= 85) return '#10B981';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
}

function Navbar({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav
      className="fixed top-4 left-0 right-0 z-40 flex justify-center pointer-events-none"
      role="navigation"
      aria-label="App navigation"
    >
      <motion.div
        className={`glass-card pointer-events-auto flex items-center gap-4 px-5 py-3 max-w-3xl w-full mx-4 transition-all duration-300 ${scrolled ? 'backdrop-blur-2xl bg-black/40' : ''}`}
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

        <div className="flex items-center gap-2">
          <Link href="/camera" className="btn-primary py-2 px-4 text-sm gap-1.5">
            <Camera size={14} />
            New Pose
          </Link>
          <Link href="/history" className="btn-ghost py-2 px-3 text-sm">
            <History size={14} aria-label="View history" />
          </Link>
          <Link href="/profile" className="btn-ghost py-2 px-3 text-sm">
            <User size={14} aria-label="Profile" />
          </Link>
          <button onClick={onLogout} className="btn-ghost py-2 px-3 text-sm" aria-label="Sign out">
            <LogOut size={14} />
          </button>
          {user && (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </nav>
  );
}

function DashboardContent() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [poses, setPoses] = useState<Pose[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [poseLoading, setPoseLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [posesRes, statsRes] = await Promise.all([
          posesApi.history(1, 5),
          usersApi.stats(),
        ]);
        setPoses(posesRes.data.poses || []);
        setStats(statsRes.data);
      } catch { /* silent */ }
      finally { setPoseLoading(false); }
    };
    fetchData();
  }, [user]);

  if (loading || !user) return null;

  const statCards = [
    { label: 'Total Poses', value: stats?.totalPoses ?? '–', icon: Camera, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'This Week', value: stats?.weeklyPoses ?? '–', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Avg Score', value: stats?.averageScore ? `${stats.averageScore}%` : '–', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Top Score', value: stats?.topScore ? `${stats.topScore}%` : '–', icon: Award, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  ];

  return (
    <main className="min-h-screen pt-28 pb-16 px-6">
      <Navbar onLogout={logout} />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="mb-12"
        >
          <motion.p variants={fadeInUp} transition={EASE_OUT_EXPO} className="tag tag-blue mb-4">
            Dashboard
          </motion.p>
          <motion.h1
            variants={fadeInUp}
            transition={EASE_OUT_EXPO}
            className="text-5xl font-black mb-3"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.03em' }}
          >
            Welcome back,{' '}
            <span className="gradient-text">{user.firstName}</span>!
          </motion.h1>
          <motion.p variants={fadeInUp} transition={EASE_OUT_EXPO} className="text-muted text-lg">
            Ready to capture your perfect pose today?
          </motion.p>
        </motion.div>

        {/* CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...EASE_OUT_EXPO, delay: 0.1 }}
          className="glass-card p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(99,102,241,0.08) 100%)' }}
        >
          <div>
            <h2 className="text-2xl font-black mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
              Start a new session
            </h2>
            <p className="text-muted">Open the camera and get real-time pose feedback from AI.</p>
          </div>
          <Link href="/camera" className="btn-primary gap-2 whitespace-nowrap text-base px-6 py-3">
            <Camera size={18} />
            Open Camera
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              className="glass-card interactive p-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...EASE_OUT_EXPO, delay: 0.15 + i * 0.06 }}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.96 }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
              }}
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${card.bg}`}>
                <card.icon size={18} className={card.color} />
              </div>
              <p className="text-muted text-xs mb-1">{card.label}</p>
              <p className="text-2xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>
                {poseLoading ? <span className="skeleton w-16 h-7 block rounded" /> : card.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Recent Poses */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...EASE_OUT_EXPO, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Recent Sessions</h2>
            <Link href="/history" className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>

          {poseLoading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => (
                <div key={i} className="glass-card p-5 skeleton h-20" />
              ))}
            </div>
          ) : poses.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Camera size={40} className="text-muted mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>No poses yet</h3>
              <p className="text-muted text-sm mb-6">Open the camera and capture your first pose!</p>
              <Link href="/camera" className="btn-primary inline-flex gap-2">
                <Camera size={16} /> Open Camera
              </Link>
            </div>
          ) : (
            <AnimatePresence>
              <div className="flex flex-col gap-3">
                {poses.map((pose, i) => (
                  <motion.div
                    key={pose.id}
                    className="glass-card interactive p-5 flex items-center gap-5 cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...EASE_OUT_EXPO, delay: i * 0.06 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/history/${pose.id}`)}
                  >
                    {/* Score Ring */}
                    <div className="relative w-14 h-14 shrink-0">
                      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
                        <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                        <circle
                          cx="28" cy="28" r="24"
                          fill="none"
                          stroke={ScoreColor(pose.score)}
                          strokeWidth="5"
                          strokeDasharray={`${(pose.score / 100) * 150.8} 150.8`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-black" style={{ fontFamily: 'Syne, sans-serif', color: ScoreColor(pose.score) }}>
                        {pose.score}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold capitalize mb-1">{pose.poseType} Pose</p>
                      <p className="text-muted text-xs flex items-center gap-1.5">
                        <Clock size={11} />
                        {new Date(pose.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>

                    {/* Recommendation preview */}
                    {pose.recommendations?.length > 0 && (
                      <div className="hidden md:block shrink-0">
                        <span className={`tag ${pose.recommendations[0].priority === 'high' ? 'tag-red' : pose.recommendations[0].priority === 'medium' ? 'tag-amber' : 'tag-green'}`}>
                          {pose.recommendations[0].area}
                        </span>
                      </div>
                    )}

                    <ChevronRight size={16} className="text-muted shrink-0" />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
