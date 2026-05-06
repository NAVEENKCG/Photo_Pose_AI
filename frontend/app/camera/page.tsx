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
type ContourPoint = { x: number; y: number; cp1x?: number; cp1y?: number; cp2x?: number; cp2y?: number; };
type ContourStroke = { type: string; points: ContourPoint[] };

interface PoseTemplate {
  id: string; name: string; emoji: string;
  instruction: string; detail: string;
  scenes: string[];
  strokes: ContourStroke[];
}

const ALL_POSES: PoseTemplate[] = [
  {
    id: 'graduation_cap_toss', name: 'Cap Toss', emoji: '🎓',
    instruction: 'One arm up, celebrate!', detail: 'Proud & Accomplished',
    scenes: ['rooftop', 'generic', 'indoor'],
    strokes: [
      {
        type: "body_outline",
        points: [
          { x: 0.50, y: 0.08, cp1x: 0.44, cp1y: 0.08, cp2x: 0.44, cp2y: 0.16 },
          { x: 0.44, y: 0.14, cp1x: 0.44, cp1y: 0.20, cp2x: 0.45, cp2y: 0.22 },
          { x: 0.46, y: 0.22, cp1x: 0.45, cp1y: 0.25, cp2x: 0.42, cp2y: 0.27 },
          { x: 0.38, y: 0.28, cp1x: 0.32, cp1y: 0.28, cp2x: 0.30, cp2y: 0.32 },
          { x: 0.28, y: 0.22, cp1x: 0.26, cp1y: 0.18, cp2x: 0.24, cp2y: 0.14 },
          { x: 0.22, y: 0.10, cp1x: 0.20, cp1y: 0.06, cp2x: 0.22, cp2y: 0.04 },
          { x: 0.24, y: 0.04, cp1x: 0.26, cp1y: 0.03, cp2x: 0.28, cp2y: 0.04 },
          { x: 0.30, y: 0.12, cp1x: 0.32, cp1y: 0.18, cp2x: 0.34, cp2y: 0.28 },
          { x: 0.36, y: 0.44, cp1x: 0.35, cp1y: 0.50, cp2x: 0.35, cp2y: 0.54 },
          { x: 0.36, y: 0.56, cp1x: 0.35, cp1y: 0.60, cp2x: 0.36, cp2y: 0.62 },
          { x: 0.37, y: 0.68, cp1x: 0.37, cp1y: 0.74, cp2x: 0.38, cp2y: 0.78 },
          { x: 0.39, y: 0.80, cp1x: 0.39, cp1y: 0.84, cp2x: 0.39, cp2y: 0.88 },
          { x: 0.39, y: 0.92, cp1x: 0.39, cp1y: 0.94, cp2x: 0.40, cp2y: 0.96 },
          { x: 0.40, y: 0.97, cp1x: 0.40, cp1y: 0.98, cp2x: 0.44, cp2y: 0.98 },
          { x: 0.50, y: 0.98, cp1x: 0.54, cp1y: 0.98, cp2x: 0.56, cp2y: 0.97 },
          { x: 0.58, y: 0.96, cp1x: 0.59, cp1y: 0.94, cp2x: 0.60, cp2y: 0.92 },
          { x: 0.60, y: 0.88, cp1x: 0.60, cp1y: 0.84, cp2x: 0.61, cp2y: 0.80 },
          { x: 0.61, y: 0.78, cp1x: 0.62, cp1y: 0.74, cp2x: 0.62, cp2y: 0.68 },
          { x: 0.62, y: 0.62, cp1x: 0.62, cp1y: 0.58, cp2x: 0.63, cp2y: 0.54 },
          { x: 0.63, y: 0.50, cp1x: 0.63, cp1y: 0.46, cp2x: 0.62, cp2y: 0.42 },
          { x: 0.62, y: 0.34, cp1x: 0.62, cp1y: 0.30, cp2x: 0.64, cp2y: 0.28 },
          { x: 0.64, y: 0.26, cp1x: 0.68, cp1y: 0.24, cp2x: 0.70, cp2y: 0.28 },
          { x: 0.72, y: 0.38, cp1x: 0.73, cp1y: 0.44, cp2x: 0.72, cp2y: 0.50 },
          { x: 0.71, y: 0.52, cp1x: 0.70, cp1y: 0.54, cp2x: 0.68, cp2y: 0.54 },
          { x: 0.66, y: 0.44, cp1x: 0.65, cp1y: 0.38, cp2x: 0.64, cp2y: 0.32 },
          { x: 0.54, y: 0.24, cp1x: 0.53, cp1y: 0.22, cp2x: 0.52, cp2y: 0.20 },
          { x: 0.54, y: 0.16, cp1x: 0.55, cp1y: 0.12, cp2x: 0.54, cp2y: 0.08 },
          { x: 0.50, y: 0.08 }
        ]
      },
      {
        type: "gown_detail",
        points: [
          { x: 0.40, y: 0.44, cp1x: 0.42, cp1y: 0.52, cp2x: 0.44, cp2y: 0.58 },
          { x: 0.46, y: 0.62, cp1x: 0.48, cp1y: 0.64, cp2x: 0.50, cp2y: 0.64 },
          { x: 0.54, y: 0.62, cp1x: 0.56, cp1y: 0.60, cp2x: 0.58, cp2y: 0.56 }
        ]
      }
    ]
  },
  {
    id: 'street_wall_lean', name: 'Wall Lean', emoji: '🧱',
    instruction: 'Lean back, one foot kicked up', detail: 'Cool & Effortless',
    scenes: ['urban', 'street'],
    strokes: [
      {
        type: "body_outline",
        points: [
          { x: 0.50, y: 0.08 }, { x: 0.44, y: 0.12 }, { x: 0.44, y: 0.20 }, { x: 0.46, y: 0.24 },
          { x: 0.36, y: 0.28 }, { x: 0.30, y: 0.36 }, { x: 0.28, y: 0.46 }, { x: 0.30, y: 0.48 },
          { x: 0.34, y: 0.44 }, { x: 0.36, y: 0.56 }, { x: 0.38, y: 0.72 }, { x: 0.40, y: 0.86 },
          { x: 0.42, y: 0.92 }, { x: 0.46, y: 0.98 }, { x: 0.58, y: 0.98 }, { x: 0.62, y: 0.92 },
          { x: 0.62, y: 0.78 }, { x: 0.62, y: 0.64 }, { x: 0.63, y: 0.52 }, { x: 0.65, y: 0.28 },
          { x: 0.70, y: 0.26 }, { x: 0.76, y: 0.28 }, { x: 0.74, y: 0.36 }, { x: 0.65, y: 0.30 },
          { x: 0.55, y: 0.24 }, { x: 0.54, y: 0.18 }, { x: 0.54, y: 0.10 }, { x: 0.50, y: 0.08 }
        ]
      }
    ]
  },
  {
    id: 'easy_cool', name: 'Easy Cool', emoji: '😎',
    instruction: 'Relax one hip — casual & cool', detail: 'Natural, effortless look',
    scenes: ['indoor', 'generic', 'beach', 'outdoor', 'nature'],
    strokes: [
      {
        type: "body_outline",
        points: [
          { x: 0.50, y: 0.07 }, { x: 0.44, y: 0.10 }, { x: 0.44, y: 0.19 }, { x: 0.46, y: 0.23 },
          { x: 0.37, y: 0.28 }, { x: 0.30, y: 0.32 }, { x: 0.28, y: 0.46 }, { x: 0.30, y: 0.50 },
          { x: 0.33, y: 0.48 }, { x: 0.34, y: 0.56 }, { x: 0.36, y: 0.68 }, { x: 0.38, y: 0.84 },
          { x: 0.39, y: 0.97 }, { x: 0.46, y: 0.98 }, { x: 0.54, y: 0.98 }, { x: 0.60, y: 0.97 },
          { x: 0.62, y: 0.84 }, { x: 0.63, y: 0.68 }, { x: 0.64, y: 0.54 }, { x: 0.64, y: 0.44 },
          { x: 0.66, y: 0.30 }, { x: 0.68, y: 0.26 }, { x: 0.72, y: 0.40 }, { x: 0.71, y: 0.52 },
          { x: 0.68, y: 0.52 }, { x: 0.64, y: 0.30 }, { x: 0.55, y: 0.24 }, { x: 0.54, y: 0.16 },
          { x: 0.54, y: 0.09 }, { x: 0.50, y: 0.07 }
        ]
      }
    ]
  },
  {
    id: 'silhouette', name: 'Silhouette Gaze', emoji: '🌇',
    instruction: 'Back to camera, look at horizon', detail: 'Mysterious & Iconic',
    scenes: ['rooftop', 'outdoor'],
    strokes: [{
      type: "body_outline", points: [
        {x:0.5, y:0.09}, {x:0.46, y:0.12}, {x:0.46, y:0.2}, {x:0.42, y:0.24},
        {x:0.42, y:0.3}, {x:0.44, y:0.35}, {x:0.45, y:0.45}, {x:0.44, y:0.55},
        {x:0.44, y:0.75}, {x:0.46, y:0.95}, {x:0.54, y:0.95}, {x:0.54, y:0.75},
        {x:0.56, y:0.55}, {x:0.58, y:0.4}, {x:0.62, y:0.36}, {x:0.68, y:0.4},
        {x:0.72, y:0.42}, {x:0.68, y:0.36}, {x:0.56, y:0.2}, {x:0.54, y:0.12}, {x:0.5, y:0.09}
      ]
    }]
  },
  {
    id: 'sit_sand', name: 'Sand Lounge', emoji: '🏖️',
    instruction: 'Casual sit with one knee up', detail: 'Relaxed Holiday',
    scenes: ['beach', 'nature'],
    strokes: [{
      type: "body_outline", points: [
        {x:0.5, y:0.25}, {x:0.46, y:0.28}, {x:0.46, y:0.38}, {x:0.40, y:0.45},
        {x:0.35, y:0.55}, {x:0.28, y:0.70}, {x:0.28, y:0.80}, {x:0.35, y:0.80},
        {x:0.42, y:0.70}, {x:0.45, y:0.80}, {x:0.48, y:0.92}, {x:0.60, y:0.92},
        {x:0.62, y:0.80}, {x:0.68, y:0.65}, {x:0.75, y:0.65}, {x:0.75, y:0.55},
        {x:0.68, y:0.48}, {x:0.65, y:0.35}, {x:0.60, y:0.35}, {x:0.55, y:0.28}, {x:0.5, y:0.25}
      ]
    }]
  },
  {
    id: 'victory', name: 'Victory', emoji: '✌️',
    instruction: 'Raise both hands — celebrate!', detail: 'Energetic & joyful',
    scenes: ['outdoor', 'nature', 'rooftop'],
    strokes: [{
      type: "body_outline", points: [
        {x:0.5, y:0.09}, {x:0.46, y:0.12}, {x:0.45, y:0.20}, {x:0.38, y:0.18},
        {x:0.28, y:0.08}, {x:0.24, y:0.08}, {x:0.30, y:0.25}, {x:0.36, y:0.38},
        {x:0.40, y:0.48}, {x:0.40, y:0.65}, {x:0.42, y:0.80}, {x:0.42, y:0.95},
        {x:0.50, y:0.95}, {x:0.52, y:0.75}, {x:0.54, y:0.95}, {x:0.62, y:0.95},
        {x:0.62, y:0.80}, {x:0.64, y:0.65}, {x:0.64, y:0.48}, {x:0.68, y:0.38},
        {x:0.74, y:0.25}, {x:0.80, y:0.08}, {x:0.76, y:0.08}, {x:0.66, y:0.18},
        {x:0.58, y:0.20}, {x:0.56, y:0.12}, {x:0.5, y:0.09}
      ]
    }]
  }
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

  if (te > 0.15) return 'beach';
  if (gr > 0.18) return 'nature';
  if (sB > 0.25 && gy > 0.15) return 'rooftop';
  if (sB > 0.20 || sa > 0.15) return 'outdoor';
  if (gy > 0.25) return 'urban';
  if (total < 15) return 'generic';
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
// Mini SVG contour icon for each pose card (NOT a stick man — a mini gesture drawing)
function PoseContourIcon({ poseId, active }: { poseId: string, active: boolean }) {
  const color = active ? '#00D4FF' : 'rgba(255,255,255,0.8)';
  
  // Each pose has a unique simplified mini SVG path
  const iconPaths: Record<string, string> = {
    graduation_cap_toss:
      'M30,8 C28,9 26,11 26,14 C26,17 27,19 28,20 C25,21 22,23 21,27 C20,32 20,38 20,44 C19,50 18,60 18,68 C19,75 20,82 22,86 C24,86 25,87 25,88 C27,88 29,88 29,88 C30,88 31,87 32,86 C34,82 35,75 36,68 C36,60 35,50 34,44 C34,38 34,32 32,28 C31,24 30,22 30,20 C31,19 33,17 33,14 C33,11 31,9 30,8 Z M22,27 L18,20 L16,14 L18,12 L20,16 L22,22',
    easy_cool:
      'M30,8 C28,9 26,12 26,15 C26,18 28,20 28,21 C25,22 22,25 22,30 C22,36 22,44 23,54 C24,62 25,70 25,80 C26,86 27,88 27,88 C29,88 31,88 31,88 C33,88 33,86 34,80 C35,70 36,62 36,54 C37,44 37,36 36,30 C36,26 34,23 32,22 C32,20 33,18 33,15 C33,12 32,9 30,8 Z M22,38 L18,34 L16,38 M36,36 L40,32 L42,36',
    street_wall_lean:
      'M30,8 C28,9 26,12 26,15 C26,18 28,20 28,21 C25,22 21,24 20,28 C20,34 20,42 21,52 C21,60 22,68 23,80 C23,85 24,88 25,88 C27,88 29,88 29,88 C31,88 32,85 32,80 C33,68 34,60 35,52 C36,42 37,34 38,28 C40,24 42,24 44,24 L44,22 C42,20 40,20 38,20 C38,18 34,18 32,20 C32,20 31,19 30,19 C30,18 32,16 32,15 C32,12 31,9 30,8 Z',
    silhouette:
      'M31,10 Q28,10 27,15 Q26,20 25,28 Q25,38 27,51 Q29,66 29,82 Q31,82 34,82 Q34,66 36,51 Q38,38 38,28 Q37,20 36,15 Q35,10 31,10 M25,28 Q18,30 16,35 M38,28 Q45,30 47,35',
    sit_sand:
      'M30,30 Q28,32 28,38 Q25,48 20,60 Q15,70 15,80 L20,80 Q25,72 26,80 Q28,88 36,88 Q40,88 43,80 Q46,70 48,60 Q45,55 43,48 Q40,38 34,32 Q32,30 30,30 M28,38 L25,48',
    victory:
      'M30,10 Q28,12 28,18 Q25,18 20,10 Q16,5 12,12 Q18,25 22,35 Q25,45 25,60 Q25,75 28,88 Q32,88 35,88 Q38,75 38,60 Q38,45 42,35 Q46,25 50,12 Q48,5 42,10 Q38,18 35,18 Q35,12 33,10 Q32,9 30,10'
  };

  return (
    <svg width="40" height="44" viewBox="0 0 60 96" fill="none" style={{ transform: 'scale(1.1)' }}>
      <path
        d={iconPaths[poseId] || iconPaths.easy_cool}
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function PoseThumbnail({ pose, selected, isBest, onClick }: { pose: PoseTemplate, selected: boolean, isBest?: boolean, onClick: () => void }) {
  return (
    <motion.button onClick={onClick} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
      style={{
        flexShrink: 0, width: 68,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        padding: '8px 4px', borderRadius: '14px',
        background: selected ? 'rgba(96, 230, 255, 0.1)' : 'transparent',
        border: selected ? '1.5px solid rgba(96, 230, 255, 0.8)' : '1.5px solid transparent',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        WebkitAppearance: 'none',
        position: 'relative'
      }}
    >
      {isBest && (
        <div style={{
          position: 'absolute', top: -6, right: -6,
          backgroundColor: '#00FF88', color: '#000',
          fontSize: '8px', fontWeight: 800, padding: '2px 5px', borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,255,136,0.3)'
        }}>
          BEST
        </div>
      )}
      <motion.div style={{ width: 40, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }} animate={{ scale: selected ? 1.05 : 1 }}>
        <PoseContourIcon poseId={pose.id} active={selected} />
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

function drawCanvas(
  ctx: CanvasRenderingContext2D,
  pose: PoseTemplate,
  w: number, h: number,
  userKps: LiveKp[],
  progress: number,
  phase: number,
  smoothBounds: { topY: number; bottomY: number; centerX: number; bodyHeight: number; shoulderWidth: number }
) {
  ctx.clearRect(0, 0, w, h);

  // 1. Get Person Bounds from live keypoints
  const kpArray = userKps.filter(k => k.confidence > 0.4);
  if (kpArray.length === 0) return;

  const xs = kpArray.map(k => k.x * w);
  const ys = kpArray.map(k => k.y * h);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  const uLS = userKps.find(k => k.name === 'left_shoulder');
  const uRS = userKps.find(k => k.name === 'right_shoulder');

  const personBounds = {
    topY: minY,
    bottomY: maxY,
    centerX: (minX + maxX) / 2,
    bodyHeight: maxY - minY,
    shoulderWidth: Math.abs(
      (uRS?.x || 0.6) * w - (uLS?.x || 0.4) * w
    )
  };

  // EMA Smoothing to eliminate all nervous jitter / shaking
  if (smoothBounds.topY === -1 || Math.abs(smoothBounds.centerX - personBounds.centerX) > w * 0.4) {
    // Snap immediately if uninitialized or if target moves extremely far (reset)
    Object.assign(smoothBounds, personBounds);
  } else {
    const EMA = 0.12; // High smoothing factor (Huawei level lock)
    smoothBounds.topY += (personBounds.topY - smoothBounds.topY) * EMA;
    smoothBounds.bottomY += (personBounds.bottomY - smoothBounds.bottomY) * EMA;
    smoothBounds.centerX += (personBounds.centerX - smoothBounds.centerX) * EMA;
    smoothBounds.bodyHeight += (personBounds.bodyHeight - smoothBounds.bodyHeight) * EMA;
    smoothBounds.shoulderWidth += (personBounds.shoulderWidth - smoothBounds.shoulderWidth) * EMA;
  }

  // 2. Scale Contour to Person (using smoothBounds)
  const scaleX = smoothBounds.shoulderWidth * 2.8;
  const scaleY = smoothBounds.bodyHeight * 1.05;
  const originX = smoothBounds.centerX;
  const originY = smoothBounds.topY - smoothBounds.bodyHeight * 0.04;

  const scaledStrokes = pose.strokes.map(stroke => ({
    ...stroke,
    scaledPoints: stroke.points.map(p => ({
      x: originX + (p.x - 0.5) * scaleX,
      y: originY + p.y * scaleY,
      cp1x: p.cp1x ? originX + (p.cp1x - 0.5) * scaleX : undefined,
      cp1y: p.cp1y ? originY + p.cp1y * scaleY : undefined,
      cp2x: p.cp2x ? originX + (p.cp2x - 0.5) * scaleX : undefined,
      cp2y: p.cp2y ? originY + p.cp2y * scaleY : undefined,
    }))
  }));

  // Glow pulsing math
  let glowIntensity = Math.sin(phase * 4); // oscillates between -1 and 1
  if (glowIntensity < 0) glowIntensity = 0; // clamp 0 to 1

  // Path builder for Catmull-Rom to Cubic Bezier
  const buildSmoothPath = (c: CanvasRenderingContext2D, points: ContourPoint[]) => {
    if (points.length === 0) return;
    c.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const pnt = points[i];
      if (pnt.cp1x !== undefined && pnt.cp1y !== undefined) {
        c.bezierCurveTo(
          pnt.cp1x, pnt.cp1y,
          pnt.cp2x ?? pnt.cp1x, pnt.cp2y ?? pnt.cp1y,
          pnt.x, pnt.y
        );
      } else {
        // Catmull-Rom curve tension
        const p0 = i > 1 ? points[i - 2] : points[i - 1];
        const p1 = points[i - 1];
        const p2 = points[i];
        const p3 = i < points.length - 1 ? points[i + 1] : points[i];
        
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        
        c.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
    }
  };

  // Draw each stroke
  scaledStrokes.forEach(stroke => {
    const points = stroke.scaledPoints;
    if (!points || points.length < 2) return;
    
    const pointsToDrawCount = Math.max(2, Math.floor(progress * points.length));
    const pointsToDraw = points.slice(0, pointsToDrawCount);

    // === LAYER 1: Outer soft glow (wide, very transparent) ===
    ctx.save();
    ctx.beginPath();
    buildSmoothPath(ctx, pointsToDraw);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 + glowIntensity * 0.06})`;
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.filter = 'blur(8px)';
    ctx.stroke();
    ctx.restore();

    // === LAYER 2: Middle glow (medium, semi-transparent) ===
    ctx.save();
    ctx.beginPath();
    buildSmoothPath(ctx, pointsToDraw);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + glowIntensity * 0.1})`;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.filter = 'blur(3px)';
    ctx.stroke();
    ctx.restore();

    // === LAYER 3: Sharp white core line ===
    ctx.save();
    ctx.beginPath();
    buildSmoothPath(ctx, pointsToDraw);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.88 + glowIntensity * 0.12})`;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.filter = 'none';
    ctx.stroke();
    ctx.restore();

    // === LAYER 4: Bright leading tip dot ===
    if (progress < 0.99) {
      const lastPoint = pointsToDraw[pointsToDraw.length - 1];
      ctx.save();
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.9 + glowIntensity * 0.1})`;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.restore();
    }
  });
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
  const smoothBoundsRef = useRef({ topY: -1, bottomY: -1, centerX: -1, bodyHeight: -1, shoulderWidth: -1 });
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
  const [zoom,          setZoom]          = useState(1);
  const [zoomRange,     setZoomRange]     = useState({ min: 1, max: 1 });

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
        userKpsRef.current, progressRef.current, phaseRef.current, smoothBoundsRef.current);
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
      
      if (videoRef.current) { 
        videoRef.current.srcObject = streamRef.current; 
        await videoRef.current.play(); 
      }
      
      const track = streamRef.current.getVideoTracks()[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const caps = track.getCapabilities() as any;
      if (caps.zoom) {
        setZoomRange({ min: caps.zoom.min || 1, max: caps.zoom.max || 3 });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setZoom((track.getSettings() as any).zoom || caps.zoom.min || 1);
      } else {
        setZoomRange({ min: 1, max: 1 });
      }

      setCameraOn(true);
      progressStartRef.current = performance.now();
      rafRef.current = requestAnimationFrame(loop);
    } catch { setCamError('Camera access denied. Please enable permissions and reload.'); }
  }, [front, loop]);

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setZoom(val);
    const track = streamRef.current?.getVideoTracks()[0];
    if (track && track.applyConstraints) {
      // Apply advanced constraints for zoom
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      track.applyConstraints({ advanced: [{ zoom: val }] } as any).catch(() => {});
    }
  };

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
      <video ref={videoRef} className="fixed inset-0 w-full h-full object-cover z-0 top-0 left-0"
        playsInline muted aria-label="Camera feed"
        style={{ transform: front ? 'scaleX(-1)' : 'none' }} />

      {/* Skeleton canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full object-cover pointer-events-none z-10 top-0 left-0"
        aria-hidden="true" style={{ transform: front ? 'scaleX(-1)' : 'none' }} />

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
      <div className="camera-top-bar">
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
            className="camera-pose-instruction"
          >
            <p className="text-[11px] font-semibold tracking-widest uppercase text-white/45 mb-1">AI Pose</p>
            <p className="text-white font-bold text-[18px] leading-snug drop-shadow-md">{activePose.instruction}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM: shutter + pose carousel ── */}
      <div className="camera-bottom-bar">
        
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
                  <PoseThumbnail key={pose.id} pose={pose} selected={i === poseIndex} isBest={i === 0}
                    onClick={() => { setPoseIndex(i); setActivePose(pose); }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shutter row */}
        <div className="camera-shutter-row">
          
          {/* Zoom Slider */}
          <div className="flex flex-col items-center justify-center gap-[6px] camera-zoom-widget" style={{ visibility: zoomRange.max > 1.2 ? 'visible' : 'hidden' }}>
            <span className="text-[10px] font-bold text-white shadow-sm drop-shadow-md">{zoom.toFixed(1)}x</span>
            <label htmlFor="zoom-slider" className="sr-only">Camera zoom</label>
            <input id="zoom-slider" type="range" min={zoomRange.min} max={Math.min(zoomRange.max, 5)} step="0.1" value={zoom} onChange={handleZoomChange}
              title="Camera zoom"
              className="w-[60px] h-[3px] appearance-none rounded-full bg-white/25 accent-white cursor-pointer -rotate-90 origin-center absolute translate-y-[-24px] z-10 outline-none" style={{ right: -6 }} />
          </div>
          
          {/* Shutter button */}
          <motion.button onClick={capture} disabled={capturing || !cameraOn || captured}
            whileTap={{ scale: 0.86 }} aria-label="Capture"
            className="camera-shutter-btn flex items-center justify-center focus:outline-none"
          >
            <div className="camera-shutter-outer" />
            <div className="camera-shutter-inner" />
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
