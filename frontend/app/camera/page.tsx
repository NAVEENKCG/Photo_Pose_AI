'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FlipHorizontal, RefreshCw, AlertCircle, CheckCircle, ScanSearch } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { posesApi } from '@/lib/api';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════════════
   POSE TEMPLATE LIBRARY  (normalised 0→1 coords)
═══════════════════════════════════════════════════════════════ */
type KpKey = 'nose'|'ls'|'rs'|'le'|'re'|'lw'|'rw'|'lh'|'rh'|'lk'|'rk'|'la'|'ra';
type PoseKps = Record<KpKey, [number, number]>;

interface PoseTemplate {
  id: string; name: string; emoji: string;
  instruction: string; detail: string;
  scenes: string[];
  kps: PoseKps;
}

function kps(o: { n:[number,number],ls:[number,number],rs:[number,number],le:[number,number],re:[number,number],lw:[number,number],rw:[number,number],lh:[number,number],rh:[number,number],lk:[number,number],rk:[number,number],la:[number,number],ra:[number,number] }): PoseKps {
  return { nose:o.n,ls:o.ls,rs:o.rs,le:o.le,re:o.re,lw:o.lw,rw:o.rw,lh:o.lh,rh:o.rh,lk:o.lk,rk:o.rk,la:o.la,ra:o.ra };
}

const ALL_POSES: PoseTemplate[] = [
  {
    id:'arms_wide', name:'Open Wide', emoji:'🦅',
    instruction:'Spread your arms — embrace the view!',
    detail:'Best for wide open spaces & skylines',
    scenes:['rooftop','outdoor','beach','nature'],
    kps: kps({ n:[.50,.09], ls:[.62,.27],rs:[.38,.27], le:[.82,.20],re:[.18,.20], lw:[.97,.13],rw:[.03,.13], lh:[.57,.54],rh:[.43,.54], lk:[.58,.73],rk:[.42,.73], la:[.59,.92],ra:[.41,.92] }),
  },
  {
    id:'victory', name:'Victory', emoji:'✌️',
    instruction:'Raise both hands — celebrate!',
    detail:'Energetic & joyful expression',
    scenes:['outdoor','nature','rooftop','urban'],
    kps: kps({ n:[.50,.09], ls:[.61,.27],rs:[.39,.27], le:[.66,.15],re:[.34,.15], lw:[.72,.03],rw:[.28,.03], lh:[.57,.54],rh:[.43,.54], lk:[.58,.73],rk:[.42,.73], la:[.59,.92],ra:[.41,.92] }),
  },
  {
    id:'hands_hips', name:'Confidence', emoji:'💪',
    instruction:'Hands on hips — own the moment!',
    detail:'Strong, confident stance',
    scenes:['urban','indoor','street','generic'],
    kps: kps({ n:[.50,.09], ls:[.61,.27],rs:[.39,.27], le:[.70,.44],re:[.30,.44], lw:[.62,.55],rw:[.38,.55], lh:[.57,.54],rh:[.43,.54], lk:[.58,.73],rk:[.42,.73], la:[.59,.92],ra:[.41,.92] }),
  },
  {
    id:'one_arm_up', name:'Wave & Shine', emoji:'🙋',
    instruction:'One arm high — wave to the camera!',
    detail:'Fun & spontaneous energy',
    scenes:['beach','nature','outdoor','generic'],
    kps: kps({ n:[.50,.09], ls:[.61,.27],rs:[.39,.27], le:[.66,.13],re:[.32,.42], lw:[.70,.01],rw:[.30,.56], lh:[.57,.54],rh:[.43,.54], lk:[.60,.72],rk:[.42,.73], la:[.61,.91],ra:[.41,.92] }),
  },
  {
    id:'casual_lean', name:'Easy Cool', emoji:'😎',
    instruction:'Relax one hip — casual & cool',
    detail:'Natural, effortless look',
    scenes:['urban','indoor','street'],
    kps: kps({ n:[.52,.09], ls:[.63,.27],rs:[.40,.29], le:[.70,.43],re:[.32,.44], lw:[.68,.56],rw:[.30,.57], lh:[.60,.54],rh:[.44,.57], lk:[.61,.73],rk:[.44,.76], la:[.62,.92],ra:[.45,.94] }),
  },
  {
    id:'turn_profile', name:'Side Portrait', emoji:'🎭',
    instruction:'Turn sideways — show your silhouette!',
    detail:'Great for structured backgrounds',
    scenes:['urban','indoor','rooftop'],
    kps: kps({ n:[.44,.09], ls:[.58,.27],rs:[.42,.30], le:[.64,.43],re:[.36,.45], lw:[.66,.57],rw:[.34,.58], lh:[.56,.54],rh:[.44,.56], lk:[.57,.73],rk:[.43,.75], la:[.58,.92],ra:[.43,.94] }),
  },
  {
    id:'crouch', name:'Get Low', emoji:'⚡',
    instruction:'Bend your knees — dynamic action pose!',
    detail:'Energy & movement',
    scenes:['outdoor','beach','nature','urban'],
    kps: kps({ n:[.50,.17], ls:[.62,.31],rs:[.38,.31], le:[.73,.42],re:[.27,.42], lw:[.78,.52],rw:[.22,.52], lh:[.58,.55],rh:[.42,.55], lk:[.63,.71],rk:[.37,.70], la:[.65,.88],ra:[.36,.88] }),
  },
  {
    id:'frame_face', name:'Frame It', emoji:'🤳',
    instruction:'Frame your face with both hands!',
    detail:'Fun & creative close-up',
    scenes:['indoor','generic','cafe'],
    kps: kps({ n:[.50,.09], ls:[.61,.27],rs:[.39,.27], le:[.60,.18],re:[.40,.18], lw:[.58,.10],rw:[.42,.10], lh:[.57,.54],rh:[.43,.54], lk:[.58,.73],rk:[.42,.73], la:[.59,.92],ra:[.41,.92] }),
  },
];

const SCENE_BONES: [KpKey, KpKey][] = [
  ['ls','rs'], ['ls','le'],['le','lw'], ['rs','re'],['re','rw'],
  ['ls','lh'],['rs','rh'], ['lh','rh'],
  ['lh','lk'],['lk','la'], ['rh','rk'],['rk','ra'],
];

/* ═══════════════════════════════════════════════════════════════
   SCENE DETECTION  (edge-biased pixel sampling)
═══════════════════════════════════════════════════════════════ */
type SceneType = 'rooftop'|'outdoor'|'nature'|'beach'|'urban'|'indoor'|'generic';

const SCENE_META: Record<SceneType, { label:string; emoji:string }> = {
  rooftop:{ label:'Rooftop / Skyline', emoji:'🏙️' },
  outdoor:{ label:'Outdoor / Sunny',   emoji:'☀️' },
  nature: { label:'Nature / Park',     emoji:'🌿' },
  beach:  { label:'Beach / Coast',     emoji:'🏖️' },
  urban:  { label:'Urban / Street',    emoji:'🏛️' },
  indoor: { label:'Indoor',            emoji:'🏠' },
  generic:{ label:'Scene',             emoji:'📷' },
};

function detectScene(video: HTMLVideoElement): SceneType {
  const tmp = document.createElement('canvas');
  tmp.width = 96; tmp.height = 72;
  const tc = tmp.getContext('2d'); if (!tc) return 'generic';
  tc.drawImage(video, 0, 0, 96, 72);
  const imgData = tc.getImageData(0, 0, 96, 72);
  const { data, width, height } = imgData;

  let skyBlue=0, skyTotal=0;
  let green=0, gray=0, teal=0, sand=0, total=0;

  // Sample edges + top third (avoid center where person is)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const onEdge = x < 14 || x > width - 14 || y < height * 0.45;
      if (!onEdge) continue;
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i+1], b = data[i+2];
      total++;
      if (y < height * 0.38) {
        skyTotal++;
        if (b > r + 15 && b > g - 8) skyBlue++;
      }
      if (g > r + 20 && g > b + 15) green++;
      const sat = Math.max(r,g,b) - Math.min(r,g,b);
      if (sat < 35 && r > 85) gray++;
      if (b > 145 && g > 125 && r < 115) teal++;
      if (r > 180 && g > 150 && b > 100 && b < 170) sand++;
    }
  }

  const sB = skyBlue / Math.max(skyTotal, 1);
  const gr = green / Math.max(total, 1);
  const gy = gray  / Math.max(total, 1);
  const te = teal  / Math.max(total, 1);
  const sa = sand  / Math.max(total, 1);

  if (te > 0.20) return 'beach';
  if (gr > 0.22) return 'nature';
  if (sB > 0.30 && gy > 0.18) return 'rooftop';
  if (sB > 0.35 || sa > 0.18) return 'outdoor';
  if (gy > 0.30) return 'urban';
  if (total < 20) return 'generic';
  return 'indoor';
}

function posesForScene(scene: SceneType): PoseTemplate[] {
  const matches = ALL_POSES.filter(p => p.scenes.includes(scene));
  if (matches.length >= 3) return matches;
  const extras = ALL_POSES.filter(p => p.scenes.includes('generic') && !matches.includes(p));
  return [...matches, ...extras].slice(0, Math.max(3, matches.length));
}

/* ═══════════════════════════════════════════════════════════════
   MINI POSE THUMBNAIL  (inline SVG stick figure)
═══════════════════════════════════════════════════════════════ */
function PoseThumbnail({ pose, selected, onClick }: {
  pose: PoseTemplate; selected: boolean; onClick: () => void;
}) {
  const W = 44, H = 66;
  const mx = (x: number) => x * W;
  const my = (y: number) => y * H;
  const k = pose.kps;
  const bones = SCENE_BONES;
  const headR = 5;
  const headX = mx(k.nose[0]);
  const headY = my(k.nose[1]) - headR * 0.4;
  const strokeC = selected ? '#60E6FF' : 'rgba(255,255,255,0.70)';

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      className="flex flex-col items-center gap-1.5 shrink-0 focus:outline-none bg-transparent appearance-none border-none p-0 cursor-pointer"
      style={{ WebkitAppearance: 'none' }}
    >
      <motion.div
        animate={{
          background: selected ? 'rgba(96,230,255,0.18)' : 'rgba(255,255,255,0.06)',
          borderColor: selected ? 'rgba(96,230,255,0.60)' : 'rgba(255,255,255,0.12)',
          scale: selected ? 1.08 : 1,
        }}
        transition={{ type:'spring', stiffness:400, damping:28 }}
        className="rounded-xl p-2 border"
        style={{ minWidth: W + 16 }}
      >
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display:'block' }}>
          {/* Head */}
          <circle cx={headX} cy={headY} r={headR} fill="none"
            stroke={strokeC} strokeWidth={selected ? 2 : 1.5} />
          {/* Bones */}
          {bones.map(([a, b], i) => (
            <line key={i}
              x1={mx(k[a][0])} y1={my(k[a][1])}
              x2={mx(k[b][0])} y2={my(k[b][1])}
              stroke={strokeC} strokeWidth={selected ? 2 : 1.5} strokeLinecap="round"
            />
          ))}
        </svg>
      </motion.div>
      <p className="text-[9px] font-medium leading-none"
        style={{ color: selected ? '#60E6FF' : 'rgba(255,255,255,0.45)' }}>
        {pose.name}
      </p>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CANVAS — Painterly White Ghost Pose  (Huawei-style)
═══════════════════════════════════════════════════════════════ */
interface LiveKp { name: string; x: number; y: number; confidence: number; }

const MP_TO_KP: Record<number, string> = {
  0:'nose', 11:'left_shoulder', 12:'right_shoulder',
  13:'left_elbow', 14:'right_elbow', 15:'left_wrist', 16:'right_wrist',
  23:'left_hip', 24:'right_hip', 25:'left_knee', 26:'right_knee',
  27:'left_ankle', 28:'right_ankle',
};

const KP_TO_SHORT: Record<string, KpKey> = {
  nose:'nose', left_shoulder:'ls', right_shoulder:'rs',
  left_elbow:'le', right_elbow:'re', left_wrist:'lw', right_wrist:'rw',
  left_hip:'lh', right_hip:'rh', left_knee:'lk', right_knee:'rk',
  left_ankle:'la', right_ankle:'ra',
};

function drawCanvas(
  ctx: CanvasRenderingContext2D,
  pose: PoseTemplate,
  w: number, h: number,
  userKps: LiveKp[],
  progress: number,
  phase: number,
) {
  ctx.clearRect(0, 0, w, h);

  const uMap: Record<string, LiveKp> = {};
  userKps.forEach(k => { uMap[k.name] = k; });

  // Compute ghost scale/offset to match user's body
  let sx = 1, sy = 1, ox = 0, oy = 0;
  const uLS = uMap['left_shoulder'], uRS = uMap['right_shoulder'];
  const uNose = uMap['nose'];

  if (uLS && uRS && uLS.confidence > 0.25 && uRS.confidence > 0.25) {
    const uShW = Math.abs(uLS.x - uRS.x);
    const tShW = Math.abs(pose.kps.ls[0] - pose.kps.rs[0]);
    if (tShW > 0.01) {
      sx = uShW / tShW;
      sy = sx * (w / h) / (w / h); // maintain proportion
      const uCx = (uLS.x + uRS.x) / 2;
      const tCx = (pose.kps.ls[0] + pose.kps.rs[0]) / 2;
      ox = uCx - tCx * sx;
      oy = uNose && uNose.confidence > 0.25
        ? uNose.y - pose.kps.nose[1] * sy
        : uLS.y - pose.kps.ls[1] * sy;
    }
  }

  const gx = (nx: number) => (nx * sx + ox) * w;
  const gy = (ny: number) => (ny * sy + oy) * h;
  const k = pose.kps;

  const flicker = progress * (0.80 + 0.15 * Math.sin(phase * 2.2));

  // — Draw user's actual body (dim white reference) —
  if (userKps.length > 0) {
    const UBONES: [string, string][] = [
      ['left_shoulder','right_shoulder'],
      ['left_shoulder','left_elbow'],['left_elbow','left_wrist'],
      ['right_shoulder','right_elbow'],['right_elbow','right_wrist'],
      ['left_shoulder','left_hip'],['right_shoulder','right_hip'],
      ['left_hip','right_hip'],
      ['left_hip','left_knee'],['left_knee','left_ankle'],
      ['right_hip','right_knee'],['right_knee','right_ankle'],
    ];
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (const [a, b] of UBONES) {
      const A = uMap[a], B = uMap[b];
      if (!A || !B || A.confidence < 0.3 || B.confidence < 0.3) continue;
      ctx.beginPath(); ctx.moveTo(A.x*w, A.y*h); ctx.lineTo(B.x*w, B.y*h); ctx.stroke();
    }
    if (uNose && uNose.confidence > 0.3 && uLS && uRS) {
      const hr = Math.abs(uLS.x - uRS.x) * w * 0.32;
      ctx.beginPath(); ctx.arc(uNose.x*w, uNose.y*h - hr*0.4, hr, 0, Math.PI*2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // — PAINTERLY WHITE GHOST POSE (Huawei-style) —
  // Each segment = [start, control/joint, end] → drawn as SMOOTH BEZIER CURVES
  const segments: [number,number][][] = [
    [[k.lw[0],k.lw[1]], [k.le[0],k.le[1]], [k.ls[0],k.ls[1]]],  // left arm  (elbow = ctrl)
    [[k.rw[0],k.rw[1]], [k.re[0],k.re[1]], [k.rs[0],k.rs[1]]],  // right arm (elbow = ctrl)
    [[k.ls[0],k.ls[1]], [k.lh[0],k.lh[1]]],                       // left torso
    [[k.rs[0],k.rs[1]], [k.rh[0],k.rh[1]]],                       // right torso
    [[k.ls[0],k.ls[1]], [k.rs[0],k.rs[1]]],                       // shoulder bar
    [[k.lh[0],k.lh[1]], [k.rh[0],k.rh[1]]],                       // hip bar
    [[k.lh[0],k.lh[1]], [k.lk[0],k.lk[1]], [k.la[0],k.la[1]]],   // left leg  (knee = ctrl)
    [[k.rh[0],k.rh[1]], [k.rk[0],k.rk[1]], [k.ra[0],k.ra[1]]],   // right leg (knee = ctrl)
  ];

  const totalSeg = segments.length;
  const visibleSeg = Math.ceil(progress * totalSeg);

  // Helper: build a smooth bezier path for a segment
  const buildPath = (seg: [number,number][]) => {
    ctx.beginPath();
    const P = seg.map(([x, y]) => [gx(x), gy(y)]);
    ctx.moveTo(P[0][0], P[0][1]);

    if (P.length === 2) {
      // 2-point segment: gentle organic S-curve using a slightly offset control point
      const mx = (P[0][0] + P[1][0]) / 2;
      const my = (P[0][1] + P[1][1]) / 2;
      // Perpendicular offset for natural body curvature (8% of segment length)
      const dx = P[1][0] - P[0][0], dy = P[1][1] - P[0][1];
      const len = Math.sqrt(dx*dx + dy*dy) || 1;
      const cx = mx - (dy / len) * len * 0.08;
      const cy = my + (dx / len) * len * 0.08;
      ctx.quadraticCurveTo(cx, cy, P[1][0], P[1][1]);
    } else if (P.length === 3) {
      // 3-point segment (arm/leg): joint is the bezier control point → natural arc
      ctx.quadraticCurveTo(P[1][0], P[1][1], P[2][0], P[2][1]);
    } else {
      // 4+ points: Catmull-Rom via sequential quadratic beziers
      for (let i = 1; i < P.length - 1; i++) {
        const mx = (P[i][0] + P[i+1][0]) / 2;
        const my = (P[i][1] + P[i+1][1]) / 2;
        ctx.quadraticCurveTo(P[i][0], P[i][1], mx, my);
      }
      ctx.lineTo(P[P.length-1][0], P[P.length-1][1]);
    }
  };

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let si = 0; si < visibleSeg; si++) {
    const seg = segments[si];
    // Partial reveal on the last visible segment (always draw full for simplicity)
    const segProgress = si < visibleSeg - 1 ? 1 : (progress * totalSeg - si);
    if (segProgress <= 0) continue;

    // Three-pass rendering: glow → mid → crisp
    // Pass 1: wide soft outer glow
    buildPath(seg);
    ctx.strokeStyle = `rgba(255,255,255,${(0.055 * flicker).toFixed(3)})`;
    ctx.lineWidth = 30; ctx.setLineDash([]); ctx.stroke();

    // Pass 2: mid glow
    buildPath(seg);
    ctx.strokeStyle = `rgba(255,255,255,${(0.13 * flicker).toFixed(3)})`;
    ctx.lineWidth = 11; ctx.stroke();

    // Pass 3: crisp bright main stroke
    buildPath(seg);
    ctx.strokeStyle = `rgba(255,255,255,${(0.90 * flicker).toFixed(3)})`;
    ctx.lineWidth = 3.2;
    ctx.setLineDash([]);
    ctx.stroke();
  }

  // Head circle (white)
  if (progress > 0.25) {
    const headX = gx(k.nose[0]);
    const headY = gy(k.nose[1]);
    const headR = Math.abs(gx(k.ls[0]) - gx(k.rs[0])) * 0.32;

    // Glow
    ctx.beginPath(); ctx.arc(headX, headY - headR*0.4, headR, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(255,255,255,${(0.08 * flicker).toFixed(3)})`;
    ctx.lineWidth = 22; ctx.setLineDash([]); ctx.stroke();

    ctx.beginPath(); ctx.arc(headX, headY - headR*0.4, headR, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(255,255,255,${(0.88 * flicker).toFixed(3)})`;
    ctx.lineWidth = 3; ctx.stroke();
  }

  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════════
   MAIN CAMERA PAGE
═══════════════════════════════════════════════════════════════ */
function CameraContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const rafRef        = useRef<number>(0);
  const phaseRef      = useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef = useRef<any>(null);
  const lastDetectRef = useRef(0);
  const lastSceneRef  = useRef(0);
  const progressRef   = useRef(0);
  const progressStartRef = useRef(0);
  const activePoseRef = useRef<PoseTemplate>(ALL_POSES[0]);
  const userKpsRef    = useRef<LiveKp[]>([]);

  const [modelLoading,  setModelLoading]  = useState(true);
  const [cameraOn,      setCameraOn]      = useState(false);
  const [camError,      setCamError]      = useState('');
  const [front,         setFront]         = useState(true);
  const [scene,         setScene]         = useState<SceneType>('generic');
  const [scenePoses,    setScenePoses]    = useState<PoseTemplate[]>(ALL_POSES.slice(0, 4));
  const [poseIndex,     setPoseIndex]     = useState(0);
  const [activePose,    setActivePoseState] = useState<PoseTemplate>(ALL_POSES[0]);
  const [personFound,   setPersonFound]   = useState(false);
  const [capturing,     setCapturing]     = useState(false);
  const [captured,      setCaptured]      = useState(false);
  const [scanning,      setScanning]      = useState(false);

  const setActivePose = useCallback((p: PoseTemplate) => {
    activePoseRef.current = p;
    setActivePoseState(p);
    progressRef.current = 0;
    progressStartRef.current = performance.now();
  }, []);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  /* ── Load MediaPipe ── */
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
          minPoseDetectionConfidence: 0.4,
          minPosePresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
        if (!cancelled) { landmarkerRef.current = lm; setModelLoading(false); }
      } catch { if (!cancelled) setModelLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── rAF render loop ── */
  const loop = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop); return;
    }
    phaseRef.current += 0.09;
    progressRef.current = Math.min(1, (performance.now() - progressStartRef.current) / 1800);
    const now = performance.now();

    // MediaPipe detection at ~100ms
    if (landmarkerRef.current && now - lastDetectRef.current > 100) {
      lastDetectRef.current = now;
      try {
        const res = landmarkerRef.current.detectForVideo(video, now);
        if (res.landmarks?.[0]) {
          const kps: LiveKp[] = Object.entries(MP_TO_KP).map(([idx, name]) => {
            const lm = res.landmarks[0][Number(idx)];
            return { name, x: lm.x, y: lm.y, confidence: lm.visibility ?? 0 };
          });
          userKpsRef.current = kps;
          setPersonFound(true);
        } else {
          userKpsRef.current = [];
          setPersonFound(false);
        }
      } catch { /* skip */ }
    }

    // Scene detection every 2s
    if (now - lastSceneRef.current > 2000) {
      lastSceneRef.current = now;
      try {
        const newScene = detectScene(video);
        setScene(prev => {
          if (prev !== newScene) {
            const poses = posesForScene(newScene);
            setScenePoses(poses);
            setPoseIndex(0);
            setActivePose(poses[0]);
          }
          return newScene;
        });
      } catch { /* skip */ }
    }

    // Draw canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width  = video.videoWidth  || 640;
      canvas.height = video.videoHeight || 480;
      drawCanvas(ctx, activePoseRef.current, canvas.width, canvas.height,
        userKpsRef.current, progressRef.current, phaseRef.current);
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [setActivePose]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null; setCameraOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCamError('');
    try {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: front ? 'user' : { exact: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
      } catch (err: any) {
        // Fallback for browsers that reject exact constraints
        if (err.name === 'OverconstrainedError' || err.name === 'NotFoundError') {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: front ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
          streamRef.current = stream;
        } else { throw err; }
      }
      if (videoRef.current) { videoRef.current.srcObject = streamRef.current; await videoRef.current.play(); }
      setCameraOn(true);
      progressStartRef.current = performance.now();
      rafRef.current = requestAnimationFrame(loop);
    } catch { setCamError('Camera access denied. Please enable permissions and reload.'); }
  }, [front, loop]);

  const forceRescan = useCallback(() => {
    const video = videoRef.current; if (!video) return;
    setScanning(true);
    setTimeout(() => {
      try {
        const newScene = detectScene(video);
        const poses = posesForScene(newScene);
        setScene(newScene); setScenePoses(poses);
        setPoseIndex(0); setActivePose(poses[0]);
      } catch { /* skip */ }
      setScanning(false);
    }, 600);
  }, [setActivePose]);

  useEffect(() => { if (!modelLoading) startCamera(); }, [modelLoading, front]); // eslint-disable-line
  useEffect(() => () => stopCamera(), [stopCamera]);

  const capture = async () => {
    if (!videoRef.current) return;
    setCapturing(true);
    try {
      const cc = document.createElement('canvas');
      cc.width  = videoRef.current.videoWidth  || 640;
      cc.height = videoRef.current.videoHeight || 480;
      cc.getContext('2d')!.drawImage(videoRef.current, 0, 0);
      const imageBase64 = cc.toDataURL('image/jpeg', 0.85).split(',')[1];
      const kps = userKpsRef.current.map(k => ({
        name: k.name, x: k.x, y: k.y, z: 0, confidence: k.confidence,
      }));
      const { data } = await posesApi.analyze({
        imageBase64, fileName: `pose_${Date.now()}.jpg`,
        keypoints: kps, score: 85, confidence: 0.90,
        poseType: activePose.id,
        recommendations: [{ area: activePose.name, suggestion: activePose.instruction, priority: 'low' }],
        metadata: { scene, pose: activePose.id, camera: front?'front':'back', ts: Date.now() },
      });
      setCaptured(true);
      setTimeout(() => router.push(`/history/${data.poseId}`), 1400);
    } catch { setCapturing(false); }
  };

  if (loading || !user) return null;

  const sm = SCENE_META[scene];

  return (
    <div className="w-full h-[100dvh] bg-black overflow-hidden relative">
      {/* Video feed */}
      <video ref={videoRef} className="fixed inset-0 w-full h-full object-cover z-0"
        playsInline muted aria-label="Camera feed"
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, objectFit: 'cover', transform: front ? 'scaleX(-1)' : 'none' }} />

      {/* Skeleton canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full object-cover pointer-events-none z-10"
        aria-hidden="true" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none', transform: front ? 'scaleX(-1)' : 'none' }} />

      {/* Vignette */}
      <div className="fixed inset-0 pointer-events-none z-[15]" style={{
        background:`radial-gradient(ellipse 75% 60% at 50% 42%, transparent 22%, rgba(0,0,0,0.38) 100%),
                    linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 22%, transparent 65%, rgba(0,0,0,0.92) 100%)`,
      }} />

      {/* Loading model */}
      <AnimatePresence>
        {modelLoading && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/80"
          >
            <div className="w-12 h-12 rounded-full border-[3px] border-white/15 border-t-white/70 animate-spin" />
            <p className="text-white/55 text-sm font-medium">Loading AI Pose System…</p>
            <p className="text-white/25 text-xs">MediaPipe · Pose Landmarker Lite</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera error */}
      <AnimatePresence>
        {camError && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 text-center px-8"
          >
            <AlertCircle size={50} className="text-red-400" />
            <p className="text-white/75 text-sm max-w-xs">{camError}</p>
            <button onClick={startCamera} className="btn-primary gap-2"><RefreshCw size={14}/>Retry</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOP BAR ── */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 60, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/dashboard" aria-label="Back"
          className="w-12 h-12 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-lg border border-white/10 shrink-0">
          <ArrowLeft size={20} className="text-white" />
        </Link>
        <AnimatePresence mode="wait">
          <motion.div key={scene}
            initial={{opacity:0, scale:0.9, y:-6}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.9}}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/50 backdrop-blur-lg border border-white/10 cursor-pointer shrink-0"
            onClick={forceRescan}
          >
            <span className="text-base">{sm.emoji}</span>
            <div>
              <p className="text-[10px] text-white/35 tracking-widest uppercase leading-none">Detected</p>
              <p className="text-[14px] font-semibold text-white leading-tight">{sm.label}</p>
            </div>
          </motion.div>
        </AnimatePresence>
        <div style={{ width: 48 }} /> {/* Spacer */}
      </div>

      {/* Pose instruction text (top-left below header) */}
      <AnimatePresence mode="wait">
        {cameraOn && (
          <motion.div key={activePose.id}
            initial={{opacity:0, x:-14}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-14}}
            style={{ position: 'fixed', top: '90px', left: '20px', zIndex: 50, maxWidth: '200px' }}
          >
            <p className="text-[11px] font-semibold tracking-widest uppercase text-white/45 mb-1">AI Pose</p>
            <p className="text-white font-bold text-[18px] leading-snug drop-shadow-md">{activePose.instruction}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM: shutter + pose carousel ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 60, paddingBottom: '24px' }}>
        
        {/* Pose Thumbnail Carousel */}
        <AnimatePresence>
          {cameraOn && (
            <motion.div initial={{opacity:0, y:30}} animate={{opacity:1, y:0}} exit={{opacity:0, y:30}}
              className="mx-4 mb-6 rounded-[20px] px-4 py-4"
              style={{ background:'rgba(5,10,22,0.85)', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(24px)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-white/35">Pose Suggestions</p>
                <p className="text-[11px] font-medium text-white/40">{sm.emoji} {sm.label}</p>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth:'none', WebkitOverflowScrolling: 'touch' }}>
                {scenePoses.map((pose, i) => (
                  <PoseThumbnail key={pose.id} pose={pose} selected={i === poseIndex}
                    onClick={() => { setPoseIndex(i); setActivePose(pose); }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shutter row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: '84px' }}>
          <div style={{ width: 48 }} /> {/* Spacer to align shutter centered */}
          
          {/* Shutter button */}
          <motion.button onClick={capture} disabled={capturing || !cameraOn || captured}
            whileTap={{ scale: 0.86 }} aria-label="Capture"
            className="flex items-center justify-center bg-transparent appearance-none border-none p-0 cursor-pointer focus:outline-none"
            style={{ position: 'relative', width: 84, height: 84, WebkitAppearance: 'none' }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)' }} />
            <div style={{ position: 'absolute', top: 6, left: 6, right: 6, bottom: 6, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)' }} />
            <motion.div className="rounded-full bg-white flex items-center justify-center"
              style={{ width: 62, height: 62 }} animate={{ scale: capturing ? 0.76 : 1 }}
            >
              {capturing && <div className="w-5 h-5 rounded-full border-[3px] border-black/20 border-t-black animate-spin" />}
            </motion.div>
          </motion.button>

          {/* Flip Camera Button */}
          <motion.button onClick={() => { stopCamera(); setFront(f => !f); }} whileTap={{ scale: 0.9 }}
            aria-label="Flip camera"
            className="w-12 h-12 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-lg border border-white/10"
          >
            <RefreshCw size={22} className="text-white" />
          </motion.button>
        </div>
      </div>

      {/* Capture flash */}
      <AnimatePresence>
        {captured && (
          <motion.div initial={{opacity:0}} animate={{opacity:[0,1,1,0]}} transition={{duration:0.65, times:[0,0.12,0.55,1]}}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div initial={{scale:0.4,opacity:0}} animate={{scale:1,opacity:1}} className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl">
                <CheckCircle size={40} className="text-white" />
              </div>
              <p className="text-emerald-700 font-bold text-sm">Pose captured!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CameraPage() {
  return <AuthProvider><CameraContent /></AuthProvider>;
}
