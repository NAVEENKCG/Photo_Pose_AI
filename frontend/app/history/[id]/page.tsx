'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Clock, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { posesApi } from '@/lib/api';
import Link from 'next/link';
import { fadeInUp, staggerContainer, EASE_OUT_EXPO } from '@/lib/animations';

interface PoseDetail {
  id: string;
  score: number;
  confidence: number;
  poseType: string;
  createdAt: string;
  recommendations: { area: string; suggestion: string; priority: string }[];
  keypoints: { name: string; x: number; y: number; confidence: number }[];
}

function ScoreColor(score: number) {
  if (score >= 85) return '#10B981';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
}

function PriorityIcon({ priority }: { priority: string }) {
  if (priority === 'high') return <AlertCircle size={16} className="text-red-400 shrink-0" />;
  if (priority === 'medium') return <Info size={16} className="text-amber-400 shrink-0" />;
  return <CheckCircle size={16} className="text-emerald-400 shrink-0" />;
}

function PoseDetailContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [pose, setPose] = useState<PoseDetail | null>(null);
  const [fetching, setFetching] = useState(true);
  const [scoreVisible, setScoreVisible] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !id) return;
    posesApi.getById(id)
      .then(({ data }) => { setPose(data); setTimeout(() => setScoreVisible(true), 300); })
      .catch(() => router.push('/history'))
      .finally(() => setFetching(false));
  }, [user, id, router]);

  if (loading || !user || fetching) {
    return (
      <main className="min-h-screen pt-8 px-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      </main>
    );
  }

  if (!pose) return null;
  const scoreColor = ScoreColor(pose.score);

  return (
    <main className="min-h-screen pt-8 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/history" className="btn-ghost py-2 px-3" aria-label="Back to history">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-3xl font-black" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.03em' }}>
            Analysis Results
          </h1>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex flex-col gap-6"
        >
          {/* Score Hero Card */}
          <motion.div
            variants={fadeInUp}
            transition={EASE_OUT_EXPO}
            className="glass-card p-8 text-center"
            style={{ background: `linear-gradient(135deg, ${scoreColor}10 0%, transparent 70%)`, borderColor: `${scoreColor}30` }}
          >
            {/* Circular score */}
            <div className="relative w-36 h-36 mx-auto mb-6">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 144 144" aria-label={`Score: ${pose.score} out of 100`}>
                <circle cx="72" cy="72" r="60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                <circle
                  cx="72" cy="72" r="60"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="12"
                  strokeDasharray={`${scoreVisible ? (pose.score / 100) * 376.99 : 0} 376.99`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black" style={{ fontFamily: 'Syne, sans-serif', color: scoreColor }}>
                  {pose.score}
                </span>
                <span className="text-muted text-sm">/ 100</span>
              </div>
            </div>

            <h2 className="text-2xl font-black mb-1 capitalize" style={{ fontFamily: 'Syne, sans-serif' }}>
              {pose.poseType} Pose
            </h2>
            <p className="text-muted text-sm flex items-center justify-center gap-2 mb-4">
              <Clock size={13} />
              {new Date(pose.createdAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
            </p>

            {/* Confidence bar */}
            <div className="max-w-xs mx-auto">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted">AI Confidence</span>
                <span className="font-semibold">{Math.round(pose.confidence * 100)}%</span>
              </div>
              <div className="score-bar">
                <div
                  className="score-bar-fill"
                  style={{ width: scoreVisible ? `${pose.confidence * 100}%` : '0%', background: scoreColor }}
                />
              </div>
            </div>
          </motion.div>

          {/* Recommendations */}
          <motion.div variants={fadeInUp} transition={EASE_OUT_EXPO} className="glass-card p-6">
            <h2 className="text-lg font-black mb-5" style={{ fontFamily: 'Syne, sans-serif' }}>
              Recommendations
            </h2>
            <div className="flex flex-col gap-4">
              {pose.recommendations?.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...EASE_OUT_EXPO, delay: 0.3 + i * 0.08 }}
                  className={`p-4 rounded-xl border-l-4 flex items-start gap-3 ${
                    rec.priority === 'high'
                      ? 'bg-red-500/[0.06] border-red-500/60'
                      : rec.priority === 'medium'
                        ? 'bg-amber-500/[0.06] border-amber-500/60'
                        : 'bg-emerald-500/[0.06] border-emerald-500/60'
                  }`}
                >
                  <PriorityIcon priority={rec.priority} />
                  <div>
                    <p className="font-semibold text-sm mb-0.5">{rec.area}</p>
                    <p className="text-muted text-sm">{rec.suggestion}</p>
                    <span className={`tag mt-2 ${rec.priority === 'high' ? 'tag-red' : rec.priority === 'medium' ? 'tag-amber' : 'tag-green'}`}>
                      {rec.priority} priority
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Keypoints breakdown */}
          {pose.keypoints?.length > 0 && (
            <motion.div variants={fadeInUp} transition={EASE_OUT_EXPO} className="glass-card p-6">
              <h2 className="text-lg font-black mb-5" style={{ fontFamily: 'Syne, sans-serif' }}>
                Joint Detection
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {pose.keypoints.filter(k => k.confidence > 0.5).slice(0, 10).map((kp) => (
                  <div key={kp.name} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                    <span className="text-sm capitalize text-muted">{kp.name.replace(/_/g, ' ')}</span>
                    <span className={`text-xs font-semibold ${kp.confidence > 0.85 ? 'text-emerald-400' : kp.confidence > 0.6 ? 'text-amber-400' : 'text-red-400'}`}>
                      {Math.round(kp.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div variants={fadeInUp} transition={EASE_OUT_EXPO} className="flex flex-col sm:flex-row gap-3">
            <Link href="/camera" className="btn-primary flex-1 gap-2 justify-center py-3">
              <Camera size={16} /> Retake Pose
            </Link>
            <Link href="/history" className="btn-ghost flex-1 justify-center py-3">
              View All History
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}

export default function PoseDetailPage() {
  return (
    <AuthProvider>
      <PoseDetailContent />
    </AuthProvider>
  );
}
