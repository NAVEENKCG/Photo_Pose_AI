export interface ContourPoint {
  x: number;
  y: number;
  cp1x?: number | null;
  cp1y?: number | null;
  cp2x?: number | null;
  cp2y?: number | null;
}

export interface GestureStroke {
  id: string;
  baseWidth: number;
  pts: ContourPoint[];
  scaledPts?: ContourPoint[];
}

export class GestureDrawingRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private activeStrokes: GestureStroke[] = [];
  private strokeProgress: number[] = [];
  private strokeStartTimes: number[] = [];
  private poseStartTime: number = 0;
  private glowPhase: number = 0;
  private glowDir: number = 1;
  private rafId: number | null = null;
  private isLocked: boolean = false;
  private lockedBounds: any = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');
    this.ctx = context;
  }

  setPose(pose: { strokes: GestureStroke[] }, personBounds: any) {
    this.isLocked = true;
    this.lockedBounds = personBounds;

    this.activeStrokes = pose.strokes.map(stroke =>
      this.scaleStrokeToBounds(stroke, personBounds)
    );

    this.strokeProgress = this.activeStrokes.map(() => 0);
    this.strokeStartTimes = this.activeStrokes.map((_, i) => i * 180);
    this.poseStartTime = performance.now();

    this.startLoop();
  }

  private scaleStrokeToBounds(stroke: GestureStroke, bounds: any): GestureStroke {
    const { centerX, topY, bodyH, shoulderW } = bounds;
    // Huawei specific scaling factors
    const scaleX = shoulderW * 3.2;
    const scaleY = bodyH * 1.08;

    return {
      ...stroke,
      scaledPts: stroke.pts.map(p => ({
        x: centerX + (p.x - 0.5) * scaleX,
        y: topY + p.y * scaleY,
        cp1x: p.cp1x != null ? centerX + (p.cp1x - 0.5) * scaleX : null,
        cp1y: p.cp1y != null ? topY + p.cp1y * scaleY : null,
        cp2x: p.cp2x != null ? centerX + (p.cp2x - 0.5) * scaleX : null,
        cp2y: p.cp2y != null ? topY + p.cp2y * scaleY : null,
      })),
    };
  }

  private startLoop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    const loop = () => {
      const now = performance.now();
      const elapsed = now - this.poseStartTime;

      this.activeStrokes.forEach((stroke, i) => {
        const strokeElapsed = elapsed - this.strokeStartTimes[i];
        const pts = stroke.scaledPts || [];
        const strokeDuration = 600 + pts.length * 8;
        this.strokeProgress[i] = Math.min(1, Math.max(0, strokeElapsed / strokeDuration));
      });

      this.glowPhase += 0.025 * this.glowDir;
      if (this.glowPhase > 1) this.glowDir = -1;
      if (this.glowPhase < 0.3) this.glowDir = 1;

      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.activeStrokes.forEach((stroke, i) => {
      const prog = this.strokeProgress[i];
      if (prog <= 0) return;

      const pts = stroke.scaledPts || [];
      const drawCount = Math.max(2, Math.floor(prog * pts.length));
      const slice = pts.slice(0, drawCount);

      this.drawGestureStroke(stroke, slice, prog);
    });
  }

  private drawGestureStroke(stroke: GestureStroke, pts: ContourPoint[], progress: number) {
    if (pts.length < 2) return;
    const ctx = this.ctx;
    const glow = this.glowPhase;
    const baseW = stroke.baseWidth || 4.5;

    // LAYER 1: Deep outer glow
    ctx.save();
    ctx.beginPath();
    this.buildSmoothPath(ctx, pts);
    ctx.strokeStyle = `rgba(220, 235, 255, ${0.06 + glow * 0.04})`;
    ctx.lineWidth = baseW * 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.filter = 'blur(24px)';
    ctx.stroke();
    ctx.restore();

    // LAYER 2: Mid glow
    ctx.save();
    ctx.beginPath();
    this.buildSmoothPath(ctx, pts);
    ctx.strokeStyle = `rgba(240, 248, 255, ${0.14 + glow * 0.08})`;
    ctx.lineWidth = baseW * 4;
    ctx.filter = 'blur(8px)';
    ctx.stroke();
    ctx.restore();

    // LAYER 3: Inner bright glow
    ctx.save();
    ctx.beginPath();
    this.buildSmoothPath(ctx, pts);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 + glow * 0.15})`;
    ctx.lineWidth = baseW * 2;
    ctx.filter = 'blur(2px)';
    ctx.stroke();
    ctx.restore();

    // LAYER 4: Sharp white core 
    ctx.save();
    ctx.beginPath();
    this.buildSmoothPath(ctx, pts);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.90 + glow * 0.10})`;
    ctx.lineWidth = baseW;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.filter = 'none';
    ctx.stroke();
    ctx.restore();

    // LAYER 5: Drawing tip dot
    if (progress < 0.98) {
      const tip = pts[pts.length - 1];
      ctx.save();
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, baseW * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.shadowColor = 'rgba(200, 230, 255, 0.9)';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.restore();
    }
  }

  private buildSmoothPath(ctx: CanvasRenderingContext2D, pts: ContourPoint[]) {
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i];
      if (p.cp2x != null && p.cp1x != null && p.cp1y != null && p.cp2y != null) {
        ctx.bezierCurveTo(p.cp1x, p.cp1y, p.cp2x, p.cp2y, p.x, p.y);
      } else if (p.cp1x != null && p.cp1y != null) {
        ctx.quadraticCurveTo(p.cp1x, p.cp1y, p.x, p.y);
      } else {
        ctx.lineTo(p.x, p.y);
      }
    }
  }

  clear() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.activeStrokes = [];
    this.isLocked = false;
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }
}
