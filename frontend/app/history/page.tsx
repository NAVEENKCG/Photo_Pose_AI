'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Clock, ChevronRight, Trash2, Filter } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { posesApi } from '@/lib/api';
import Link from 'next/link';
import { fadeInUp, EASE_OUT_EXPO } from '@/lib/animations';

interface Pose {
  id: string;
  score: number;
  poseType: string;
  confidence: number;
  createdAt: string;
  recommendations: { area: string; suggestion: string; priority: string }[];
}

function ScoreColor(score: number) {
  if (score >= 85) return '#10B981';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
}

function HistoryContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [poses, setPoses] = useState<Pose[]>([]);
  const [fetching, setFetching] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setFetching(true);
      try {
        const { data } = await posesApi.history(page, 20);
        setPoses(prev => page === 1 ? data.poses : [...prev, ...data.poses]);
        setHasMore(data.pagination.page < data.pagination.totalPages);
      } catch { /* silent */ }
      finally { setFetching(false); }
    };
    load();
  }, [user, page]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pose?')) return;
    try {
      await posesApi.delete(id);
      setPoses(prev => prev.filter(p => p.id !== id));
    } catch { /* silent */ }
  };

  const filtered = poses.filter(p => {
    if (filter === 'all') return true;
    const d = new Date(p.createdAt);
    const now = Date.now();
    if (filter === 'week') return now - d.getTime() < 7 * 86400000;
    if (filter === 'month') return now - d.getTime() < 30 * 86400000;
    return true;
  });

  if (loading || !user) return null;

  return (
    <main className="min-h-screen pt-8 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="btn-ghost py-2 px-3" aria-label="Back to dashboard">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-3xl font-black" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.03em' }}>
            Pose History
          </h1>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-8 glass-card p-1.5 w-fit">
          {(['all', 'week', 'month'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${
                filter === f ? 'bg-blue-500 text-white' : 'text-muted hover:text-white'
              }`}
              aria-pressed={filter === f}
            >
              {f === 'all' ? 'All Time' : f === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        {/* Poses */}
        {fetching && page === 1 ? (
          <div className="flex flex-col gap-3">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={EASE_OUT_EXPO}
            className="glass-card p-16 text-center"
          >
            <Camera size={48} className="text-muted mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>No poses yet</h2>
            <p className="text-muted text-sm mb-8">Capture your first pose to see it here.</p>
            <Link href="/camera" className="btn-primary inline-flex gap-2">
              <Camera size={16} /> Open Camera
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((pose, i) => {
              const scoreColor = ScoreColor(pose.score);
              return (
                <motion.div
                  key={pose.id}
                  className="glass-card interactive p-5 flex items-center gap-5 group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...EASE_OUT_EXPO, delay: i * 0.04 }}
                  whileHover={{ x: 4 }}
                >
                  {/* Score ring */}
                  <div
                    className="relative w-14 h-14 shrink-0 cursor-pointer"
                    onClick={() => router.push(`/history/${pose.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && router.push(`/history/${pose.id}`)}
                    aria-label={`View pose with score ${pose.score}`}
                  >
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                      <circle
                        cx="28" cy="28" r="24"
                        fill="none" stroke={scoreColor}
                        strokeWidth="5"
                        strokeDasharray={`${(pose.score / 100) * 150.8} 150.8`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-black" style={{ color: scoreColor, fontFamily: 'Syne, sans-serif' }}>
                      {pose.score}
                    </span>
                  </div>

                  {/* Info */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => router.push(`/history/${pose.id}`)}
                  >
                    <p className="font-semibold capitalize mb-1">{pose.poseType} Pose</p>
                    <p className="text-muted text-xs flex items-center gap-1.5">
                      <Clock size={11} />
                      {new Date(pose.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    {pose.recommendations?.[0] && (
                      <p className="text-muted text-xs mt-1 truncate">{pose.recommendations[0].suggestion}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDelete(pose.id)}
                      className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                      aria-label="Delete pose"
                    >
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                    <ChevronRight size={16} className="text-muted" onClick={() => router.push(`/history/${pose.id}`)} />
                  </div>
                </motion.div>
              );
            })}

            {hasMore && (
              <button
                onClick={() => setPage(p => p + 1)}
                className="btn-ghost w-full justify-center mt-4"
                disabled={fetching}
              >
                {fetching ? 'Loading…' : 'Load More'}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function HistoryPage() {
  return (
    <AuthProvider>
      <HistoryContent />
    </AuthProvider>
  );
}
