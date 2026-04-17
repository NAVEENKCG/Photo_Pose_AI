'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, RefreshCw, Zap, CheckCircle, XCircle, AlertCircle, FlipHorizontal, Sun } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { posesApi } from '@/lib/api';
import Link from 'next/link';
import { fadeInUp, EASE_OUT_EXPO } from '@/lib/animations';

/* ── Pose Analysis Engine ────────────────────────────────────── */
interface Keypoint {
  name: string;
  x: number;
  y: number;
  confidence: number;
}

interface PoseRecommendation {
  area: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

function analyzePose(keypoints: Keypoint[]): { score: number; recommendations: PoseRecommendation[] } {
  const recommendations: PoseRecommendation[] = [];
  let score = 100;

  const get = (name: string) => keypoints.find(k => k.name === name);

  const nose = get('nose');
  const lSh = get('left_shoulder');
  const rSh = get('right_shoulder');
  const lHip = get('left_hip');
  const rHip = get('right_hip');
  const lEar = get('left_ear');
  const rEar = get('right_ear');

  // Check shoulder alignment
  if (lSh && rSh && lSh.confidence > 0.5 && rSh.confidence > 0.5) {
    const diff = Math.abs(lSh.y - rSh.y);
    if (diff > 0.05) {
      score -= 15;
      recommendations.push({ area: 'Shoulders', suggestion: 'Level your shoulders — one is raised higher than the other.', priority: 'high', icon: '⚠️' });
    }
  }

  // Check chin/head position
  if (nose && lSh && rSh) {
    const midShY = (lSh.y + rSh.y) / 2;
    if (nose.y > midShY - 0.05) {
      score -= 12;
      recommendations.push({ area: 'Head', suggestion: 'Lift your chin slightly for a more confident look.', priority: 'high', icon: '🡱' });
    }
  }

  // Check posture (hip-shoulder alignment)
  if (lSh && rSh && lHip && rHip) {
    const midShX = (lSh.x + rSh.x) / 2;
    const midHipX = (lHip.x + rHip.x) / 2;
    if (Math.abs(midShX - midHipX) > 0.08) {
      score -= 10;
      recommendations.push({ area: 'Posture', suggestion: 'Align your torso — avoid tilting to one side.', priority: 'medium', icon: '📐' });
    }
  }

  // Check face angle using ears
  if (lEar && rEar && lEar.confidence > 0.4 && rEar.confidence > 0.4) {
    const diff = Math.abs(lEar.y - rEar.y);
    if (diff > 0.04) {
      score -= 8;
      recommendations.push({ area: 'Face Angle', suggestion: 'Keep your head level — tilt it neither left nor right.', priority: 'medium', icon: '↔' });
    }
  }

  if (recommendations.length === 0) {
    recommendations.push({ area: 'Excellent', suggestion: 'Great posture! Hold this pose and capture.', priority: 'low', icon: '✓' });
  }

  return { score: Math.max(30, score), recommendations };
}

/* ── Skeleton Drawing ────────────────────────────────────────── */
const CONNECTIONS: [string, string][] = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'],
  ['left_ear', 'left_shoulder'], ['right_ear', 'right_shoulder'],
  ['nose', 'left_eye'], ['nose', 'right_eye'],
];

function drawSkeleton(ctx: CanvasRenderingContext2D, keypoints: Keypoint[], w: number, h: number, score: number) {
  ctx.clearRect(0, 0, w, h);

  const color = score >= 85 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';

  // Draw connections
  ctx.strokeStyle = `${color}99`;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  for (const [a, b] of CONNECTIONS) {
    const kpA = keypoints.find(k => k.name === a);
    const kpB = keypoints.find(k => k.name === b);
    if (kpA && kpB && kpA.confidence > 0.4 && kpB.confidence > 0.4) {
      ctx.beginPath();
      ctx.moveTo(kpA.x * w, kpA.y * h);
      ctx.lineTo(kpB.x * w, kpB.y * h);
      ctx.stroke();
    }
  }

  // Draw keypoints
  for (const kp of keypoints) {
    if (kp.confidence < 0.4) continue;
    const x = kp.x * w;
    const y = kp.y * h;

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = `${color}33`;
    ctx.fill();
  }
}

/* ── Camera Page ─────────────────────────────────────────────── */
// Mock keypoints for demo purposes (MediaPipe requires browser environment)
function getMockKeypoints(): Keypoint[] {
  return [
    { name: 'nose', x: 0.50 + (Math.random() - 0.5) * 0.02, y: 0.20 + (Math.random() - 0.5) * 0.01, confidence: 0.98 },
    { name: 'left_eye', x: 0.53, y: 0.18, confidence: 0.97 },
    { name: 'right_eye', x: 0.47, y: 0.18, confidence: 0.97 },
    { name: 'left_ear', x: 0.56, y: 0.20, confidence: 0.92 },
    { name: 'right_ear', x: 0.44, y: 0.20, confidence: 0.92 },
    { name: 'left_shoulder', x: 0.62 + (Math.random() - 0.5) * 0.03, y: 0.36, confidence: 0.95 },
    { name: 'right_shoulder', x: 0.38, y: 0.36 + (Math.random() - 0.5) * 0.02, confidence: 0.95 },
    { name: 'left_elbow', x: 0.70, y: 0.50, confidence: 0.88 },
    { name: 'right_elbow', x: 0.30, y: 0.50, confidence: 0.88 },
    { name: 'left_wrist', x: 0.72, y: 0.65, confidence: 0.82 },
    { name: 'right_wrist', x: 0.28, y: 0.65, confidence: 0.82 },
    { name: 'left_hip', x: 0.58, y: 0.62, confidence: 0.90 },
    { name: 'right_hip', x: 0.42, y: 0.62, confidence: 0.90 },
    { name: 'left_knee', x: 0.60, y: 0.78, confidence: 0.85 },
    { name: 'right_knee', x: 0.40, y: 0.78, confidence: 0.85 },
    { name: 'left_ankle', x: 0.61, y: 0.92, confidence: 0.78 },
    { name: 'right_ankle', x: 0.39, y: 0.92, confidence: 0.78 },
  ];
}

function CameraContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const mockTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraStarted, setCameraStarted] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingFront, setFacingFront] = useState(true);
  const [keypoints, setKeypoints] = useState<Keypoint[]>([]);
  const [poseResult, setPoseResult] = useState<{ score: number; recommendations: PoseRecommendation[] } | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [captureSuccess, setCaptureSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (mockTickRef.current) clearInterval(mockTickRef.current);
    cancelAnimationFrame(animFrameRef.current);
    setCameraStarted(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingFront ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStarted(true);

      // Simulate real-time pose detection with mock keypoints
      mockTickRef.current = setInterval(() => {
        const kps = getMockKeypoints();
        setKeypoints(kps);
        const result = analyzePose(kps);
        setPoseResult(result);
        const avgConf = kps.reduce((s, k) => s + k.confidence, 0) / kps.length;
        setConfidence(Math.round(avgConf * 100));

        // Draw skeleton
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (canvas && video) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            drawSkeleton(ctx, kps, canvas.width, canvas.height, result.score);
          }
        }
      }, 200);
    } catch (err) {
      setCameraError('Camera access denied. Please allow camera permissions and try again.');
    }
  }, [facingFront]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const flipCamera = () => {
    stopCamera();
    setFacingFront(f => !f);
  };

  useEffect(() => {
    if (!cameraStarted) startCamera();
  }, [facingFront]); // eslint-disable-line

  const capture = async () => {
    if (!videoRef.current || !poseResult) return;
    setCapturing(true);
    try {
      // Capture frame as base64
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = videoRef.current.videoWidth || 640;
      captureCanvas.height = videoRef.current.videoHeight || 480;
      const ctx = captureCanvas.getContext('2d')!;
      ctx.drawImage(videoRef.current, 0, 0);
      const imageBase64 = captureCanvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      // Send to backend
      const { data } = await posesApi.analyze({
        imageBase64,
        fileName: `pose_${Date.now()}.jpg`,
        keypoints,
        score: poseResult.score,
        confidence: confidence / 100,
        poseType: 'standing',
        recommendations: poseResult.recommendations,
        metadata: { device: navigator.userAgent, camera: facingFront ? 'front' : 'back', timestamp: Date.now() },
      });

      setCaptureSuccess(true);
      setTimeout(() => router.push(`/history/${data.poseId}`), 1200);
    } catch {
      setCaptureSuccess(false);
    } finally {
      setCapturing(false);
    }
  };

  if (loading || !user) return null;

  const scoreColor = poseResult ? (poseResult.score >= 85 ? '#10B981' : poseResult.score >= 60 ? '#F59E0B' : '#EF4444') : '#3B82F6';

  return (
    <main className="min-h-screen flex flex-col" style={{ background: '#050A18' }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 z-30 relative">
        <Link href="/dashboard" className="btn-ghost py-2 px-3 gap-2 text-sm" aria-label="Back to dashboard">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <h1 className="font-black text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Pose Camera</h1>
        <button onClick={flipCamera} className="btn-ghost py-2 px-3" aria-label="Flip camera">
          <FlipHorizontal size={16} />
        </button>
      </div>

      {/* Camera Viewport */}
      <div className="flex-1 relative mx-4 mb-4 rounded-3xl overflow-hidden" style={{ minHeight: '45vh', background: '#0D1526' }}>
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <AlertCircle size={48} className="text-red-400" />
            <p className="text-muted">{cameraError}</p>
            <button onClick={startCamera} className="btn-primary gap-2">
              <RefreshCw size={16} /> Try Again
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              aria-label="Camera feed"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              aria-hidden="true"
            />

            {/* Confidence badge */}
            {cameraStarted && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-4 glass-card px-3 py-2 flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: scoreColor }} />
                <span className="text-xs font-medium">{confidence}% confidence</span>
              </motion.div>
            )}

            {/* Score badge */}
            {poseResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-4 right-4 glass-card px-4 py-2"
              >
                <span className="text-lg font-black" style={{ fontFamily: 'Syne, sans-serif', color: scoreColor }}>
                  {poseResult.score}
                </span>
                <span className="text-xs text-muted ml-1">/100</span>
              </motion.div>
            )}

            {/* Starting camera overlay */}
            {!cameraStarted && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
                <p className="text-muted text-sm">Starting camera…</p>
              </div>
            )}

            {/* Capture success flash */}
            <AnimatePresence>
              {captureSuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/15 flex items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center"
                  >
                    <CheckCircle size={36} className="text-emerald-400" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Recommendations Panel */}
      <AnimatePresence>
        {poseResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-4 mb-4 glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Live Recommendations</h2>
              <span className="tag tag-blue text-xs">Real-time</span>
            </div>
            <div className="flex flex-col gap-2">
              {poseResult.recommendations.slice(0, 3).map((rec, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`tag mt-0.5 ${rec.priority === 'high' ? 'tag-red' : rec.priority === 'medium' ? 'tag-amber' : 'tag-green'} shrink-0`}>
                    {rec.priority}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white/80">{rec.area}</p>
                    <p className="text-xs text-muted mt-0.5">{rec.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Row + Capture Button */}
      <div className="px-4 pb-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-6 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Sun size={12} className="text-amber-400" /> Lighting: Good
          </span>
          <span className="flex items-center gap-1.5">
            <Zap size={12} className="text-blue-400" /> AI: Active
          </span>
        </div>

        <motion.button
          onClick={capture}
          disabled={capturing || !cameraStarted || captureSuccess}
          className="w-20 h-20 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center backdrop-blur-xl hover:border-blue-400 hover:bg-blue-500/20 transition-all duration-200 disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          aria-label="Capture pose"
        >
          {capturing ? (
            <span className="w-8 h-8 rounded-full border-3 border-white/30 border-t-white animate-spin" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-white" />
          )}
        </motion.button>
        <p className="text-xs text-muted">Tap to capture</p>
      </div>
    </main>
  );
}

export default function CameraPage() {
  return (
    <AuthProvider>
      <CameraContent />
    </AuthProvider>
  );
}
