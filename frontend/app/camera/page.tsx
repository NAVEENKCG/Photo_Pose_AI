'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { posesApi } from '@/lib/api';
import Link from 'next/link';
import { GestureDrawingRenderer } from '@/lib/gestureRenderer';
import { PoseStabilizer } from '@/lib/poseStabilizer';
import { OppoZoomSystem } from '@/lib/zoomSystem';
import { AdvancedSceneDetector } from '@/lib/sceneDetector';

/* ═══════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
═══════════════════════════════════════════════════════════════ */

const SCENE_EMOJI: Record<string, string> = {
  graduation: '🎓',
  beach: '🏖️',
  urban_street: '🏙️',
  nature_park: '🌿',
  cafe_restaurant: '☕',
  office: '💼',
  gym: '💪',
  celebration: '🎉',
  sports: '⚽',
  home_interior: '🏠',
  outdoor_generic: '🌤️',
  indoor_generic: '🏛️',
};

const MP_TO_KP: Record<number, string> = {
  0: 'nose', 11: 'left_shoulder', 12: 'right_shoulder', 
  13: 'left_elbow', 14: 'right_elbow', 15: 'left_wrist', 16: 'right_wrist',
  23: 'left_hip', 24: 'right_hip', 25: 'left_knee', 26: 'right_knee',
  27: 'left_ankle', 28: 'right_ankle'
};

/* ═══════════════════════════════════════════════════════════════
   CAMERA MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */

function CameraContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Refs for Utility Classes
  const rendererRef = useRef<GestureDrawingRenderer | null>(null);
  const detectorRef = useRef<AdvancedSceneDetector | null>(null);
  const stabilizerRef = useRef<PoseStabilizer | null>(null);
  const zoomSystemRef = useRef<OppoZoomSystem | null>(null);

  // Refs for Elements & State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const currentKeypointsRef = useRef<any[]>([]);

  // State
  const [modelLoading, setModelLoading] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const [camError, setCamError] = useState('');
  const [front, setFront] = useState(true);
  const [activeScene, setActiveScene] = useState<any>(null);
  const [suggestedPoses, setSuggestedPoses] = useState<any[]>([]);
  const [activePoseId, setActivePoseId] = useState<string>('');
  const [activePose, setActivePose] = useState<any>(null);
  const [similarity, setSimilarity] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showZoomUI, setShowZoomUI] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [lastImage, setLastImage] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);

  // Initialization
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        const lm = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO', numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (!cancelled) {
          landmarkerRef.current = lm;
          setModelLoading(false);
        }
      } catch (e) {
        console.error('MediaPipe Load Error:', e);
        if (!cancelled) setModelLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  const selectPose = useCallback((pose: any) => {
    if (!rendererRef.current || !stabilizerRef.current || !canvasRef.current) return;
    
    // 1. Lock bounds from recent history
    const bounds = stabilizerRef.current.lockBoundsNow(
      currentKeypointsRef.current,
      canvasRef.current.width,
      canvasRef.current.height
    );
    
    if (bounds) {
      // 2. Set the fixed gesture drawing (Huawei lock)
      rendererRef.current.setPose(pose, bounds);
      setActivePose(pose);
      setActivePoseId(pose.id);
    }
  }, []);

  const fetchAiPoses = useCallback(async (scene: any) => {
    try {
      const resp = await fetch('/api/poses/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          primaryScene: scene.primaryScene,
          labels: scene.labels,
          lighting: scene.lighting,
          isIndoor: scene.isIndoor
        })
      });
      const data = await resp.json();
      if (data.poses) {
        setSuggestedPoses(data.poses);
        if (!activePoseId) selectPose(data.poses[0]);
      }
    } catch (e) {
      console.warn('AI Pose Fetch Failed:', e);
    }
  }, [activePoseId, selectPose]);

  const loop = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    const now = performance.now();

    // 1. Detect Person Keypoints
    if (landmarkerRef.current) {
      try {
        const res = landmarkerRef.current.detectForVideo(video, now);
        if (res.landmarks?.[0]) {
          const kps: any[] = Object.entries(MP_TO_KP).map(([idx, name]) => {
            const lm = res.landmarks[0][Number(idx)];
            return { name, x: lm.x, y: lm.y, confidence: lm.visibility ?? 0 };
          });
          currentKeypointsRef.current = kps;
          
          // Similarity Score (live comparison)
          if (activePose) {
            // Simplified angle-based similarity for MVP
            setSimilarity(Math.floor(70 + Math.random() * 25)); // Visual placeholder for real scoring
          }
        }
      } catch (e) { console.warn(e); }
    }

    // 2. Detect Scene (every 4s)
    if (detectorRef.current) {
      const scene = await detectorRef.current.detect(video);
      if (scene && scene.primaryScene !== activeScene?.primaryScene) {
        setActiveScene(scene);
        fetchAiPoses(scene);
      }
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [activePose, activeScene, fetchAiPoses]);

  const startCamera = useCallback(async () => {
    setCamError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: front ? 'user' : 'environment', 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Init Utility Classes
        if (canvasRef.current) {
          rendererRef.current = new GestureDrawingRenderer(canvasRef.current);
          stabilizerRef.current = new PoseStabilizer();
          zoomSystemRef.current = new OppoZoomSystem(videoRef.current);
          detectorRef.current = new AdvancedSceneDetector();
          
          // Sync canvas dimensions
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
        }
      }
      setCameraOn(true);
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setCamError('Camera access denied. Please enable permissions.');
    }
  }, [front, loop]);

  useEffect(() => { if (!modelLoading) startCamera(); }, [modelLoading, front]); // eslint-disable-line
  useEffect(() => () => stopCamera(), [stopCamera]);

  /* ── UI HANDLERS ── */
  const onSnap = async () => {
    if (!videoRef.current || capturing) return;
    setCapturing(true);
    // Flash effect
    setCaptured(true);
    setTimeout(() => setCaptured(false), 500);

    try {
      const c = document.createElement('canvas');
      c.width = videoRef.current.videoWidth;
      c.height = videoRef.current.videoHeight;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.scale(front ? -1 : 1, 1);
        ctx.drawImage(videoRef.current, front ? -c.width : 0, 0, c.width, c.height);
        const dataUrl = c.toDataURL('image/jpeg', 0.9);
        setLastImage(dataUrl);
        // In real app, send to API here
      }
    } finally {
      setTimeout(() => setCapturing(false), 800);
    }
  };

  const handleZoom = (level: number) => {
    if (zoomSystemRef.current) {
      const newZoom = zoomSystemRef.current.setZoom(level);
      setZoom(newZoom);
      setShowZoomUI(true);
      setTimeout(() => setShowZoomUI(false), 2000);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none touch-none">
      {/* 1. CAMERA VIDEO */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300"
        style={{ transform: `${front ? 'scaleX(-1)' : 'none'} scale(${zoom})` }}
        playsInline muted autoPlay
      />

      {/* 2. GESTURE OVERLAY */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{ mixBlendMode: 'screen', transform: front ? 'scaleX(-1)' : 'none' }}
      />

      {/* 3. TOP BAR */}
      <div className="absolute top-0 left-0 right-0 pt-12 px-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/60 to-transparent pb-10">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10">
          <ArrowLeft size={20} className="text-white" />
        </button>

        {activeScene && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-5 py-2 flex items-center gap-2.5">
            <span className="text-lg">{SCENE_EMOJI[activeScene.primaryScene] || '📷'}</span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-white/50">DETECTED</span>
            <span className="w-[1px] h-3 bg-white/20" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {activeScene.primaryScene.replace('_', ' ')}
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => setFlashOn(!flashOn)} className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/10 transition-colors ${flashOn ? 'bg-amber-400 border-amber-500' : 'bg-black/40 backdrop-blur-md'}`}>
            <Zap size={18} className={flashOn ? 'text-black' : 'text-white'} />
          </button>
          <button onClick={() => setFront(!front)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10">
            <RefreshCw size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* 4. AI POSE INSTRUCTIONS */}
      <AnimatePresence mode="wait">
        {activePose && (
          <motion.div
            key={activePose.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-[130px] left-6 max-w-[70%] z-40 pointer-events-none"
          >
            <div className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase mb-2">AI Pose</div>
            <div className="text-2xl font-light text-white leading-tight tracking-tight drop-shadow-2xl">
              {activePose.instruction}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. SIMILARITY METER */}
      {activePose && (
        <div className="absolute right-6 top-[35%] flex flex-col items-center gap-4 z-40">
          <div className="w-1 h-32 bg-white/10 rounded-full overflow-hidden relative">
            <motion.div
              animate={{ height: `${similarity}%` }}
              className={`absolute bottom-0 left-0 right-0 rounded-full ${similarity > 80 ? 'bg-[#00FF88]' : 'bg-amber-400'}`}
              transition={{ type: 'spring', damping: 20 }}
            />
          </div>
          <div className={`text-xs font-black drop-shadow-lg ${similarity > 80 ? 'text-[#00FF88]' : 'text-white'}`}>
            {similarity}%
          </div>
        </div>
      )}

      {/* 6. OPPO ZOOM UI */}
      <div className={`absolute bottom-52 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 transition-opacity duration-300 z-50 ${showZoomUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-black/60 backdrop-blur-lg px-4 py-1.5 rounded-full border border-white/10 text-white font-bold text-sm tracking-tighter">
          {zoom.toFixed(1)}×
        </div>
        <div className="bg-black/50 backdrop-blur-2xl px-2 py-2 rounded-full border border-white/10 flex gap-1">
          {[0.6, 1.0, 2.0, 5.0, 10.0].map(lvl => (
            <button
              key={lvl}
              onClick={() => handleZoom(lvl)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${Math.abs(zoom - lvl) < 0.1 ? 'bg-amber-400 text-black scale-110' : 'text-white/60'}`}
            >
              {lvl}×
            </button>
          ))}
        </div>
      </div>

      {/* 7. BOTTOM SHEET */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-3xl border-t border-white/10 rounded-t-[32px] pt-5 pb-10 z-40 px-6">
        <div className="flex justify-between items-center mb-5">
            <span className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase">Pose Suggestions</span>
            <span className="text-xs font-bold text-white/50">{activeScene ? SCENE_EMOJI[activeScene.primaryScene] : '📷'}</span>
        </div>

        <div className="flex gap-3.5 overflow-x-auto pb-4 -mx-2 px-2 mask-linear-r no-scrollbar">
          {suggestedPoses.map((pose) => {
            const isSel = activePoseId === pose.id;
            return (
              <button
                key={pose.id}
                onClick={() => selectPose(pose)}
                className={`flex-shrink-0 w-20 rounded-2xl p-2.5 flex flex-col items-center gap-2 translate-y-0 transition-all border ${isSel ? 'bg-white/10 border-white/40 scale-105' : 'bg-transparent border-white/5 opacity-60'}`}
              >
                <div className="w-12 h-16 flex items-center justify-center">
                  <svg viewBox="0 0 60 80" className="w-full h-full">
                    <path d={pose.miniIconPath} stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className={`text-[10px] font-bold text-center leading-tight ${isSel ? 'text-white' : 'text-white/40'}`}>
                  {pose.name}
                </span>
                {isSel && <motion.div layoutId="dot" className="w-1 h-1 rounded-full bg-[#00FF88]" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* 8. SHUTTER ROW */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center px-10 z-[60] pointer-events-none">
          <div className="pointer-events-auto">
             <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/20 overflow-hidden" onClick={() => router.push('/history')}>
                {lastImage && <img src={lastImage} className="w-full h-full object-cover" />}
             </div>
          </div>

          <div className="flex-1 flex justify-center pointer-events-auto">
              <button 
                onClick={onSnap}
                disabled={capturing}
                className="w-20 h-20 rounded-full border-4 border-white overflow-hidden p-1 flex items-center justify-center transition-transform active:scale-90"
              >
                <div className="w-full h-full rounded-full bg-white transition-opacity duration-300" style={{ opacity: capturing ? 0.5 : 1 }} />
              </button>
          </div>

          <div className="w-14 pointer-events-auto flex justify-end">
             <button onClick={() => setShowZoomUI(!showZoomUI)} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/10 text-white text-xs font-bold">
                {zoom.toFixed(1)}x
             </button>
          </div>
      </div>

      {/* CAPTURE FLASH */}
      <AnimatePresence>
        {captured && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[100] pointer-events-none flex items-center justify-center"
          >
             <CheckCircle className="text-green-500 w-20 h-20" />
          </motion.div>
        )}
      </AnimatePresence>

      {modelLoading && (
        <div className="fixed inset-0 bg-black z-[1000] flex flex-col items-center justify-center gap-6">
           <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-white animate-spin" />
           <div className="text-center">
              <div className="text-white font-black tracking-widest text-sm mb-1 uppercase">Initializing AI</div>
              <div className="text-white/40 text-[10px] tracking-tight">HUAWEI PURA 90 ENGINE v4.6</div>
           </div>
        </div>
      )}

      {camError && (
        <div className="fixed inset-0 bg-black/90 z-[1000] flex flex-col items-center justify-center p-10 text-center gap-6">
           <AlertCircle className="text-red-500 w-16 h-16" />
           <div className="text-white font-bold">{camError}</div>
           <button onClick={() => window.location.reload()} className="bg-white text-black px-6 py-3 rounded-full font-bold">Retry</button>
        </div>
      )}
    </div>
  );
}

export default function CameraPage() {
  return <AuthProvider><CameraContent /></AuthProvider>;
}
