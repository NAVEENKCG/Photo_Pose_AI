export interface UserKeypoint {
  name: string;
  x: number;
  y: number;
  confidence: number;
}

export interface Bounds {
  topY: number;
  bottomY: number;
  centerX: number;
  bodyH: number;
  shoulderW: number;
}

export class PoseStabilizer {
  private livePoseHistory: UserKeypoint[][] = [];
  private readonly MAX_HISTORY = 5;
  private lockedBounds: Bounds | null = null;
  public isLocked = false;

  lockBoundsNow(currentKeypoints: UserKeypoint[], canvasWidth: number, canvasHeight: number): Bounds | null {
    this.livePoseHistory.push(currentKeypoints);
    if (this.livePoseHistory.length > this.MAX_HISTORY) {
      this.livePoseHistory.shift();
    }

    const avgBounds = this.averageBounds(this.livePoseHistory, canvasWidth, canvasHeight);
    if (avgBounds) {
      this.lockedBounds = avgBounds;
      this.isLocked = true;
    }
    return avgBounds;
  }

  private averageBounds(history: UserKeypoint[][], cW: number, cH: number): Bounds | null {
    const n = history.length;
    if (n === 0) return null;

    let sumTopY = 0, sumBottomY = 0, sumCenterX = 0, sumShoulderW = 0;
    let validFrames = 0;

    history.forEach(kp => {
      const visible = kp.filter(k => k.confidence > 0.4);
      if (visible.length < 4) return;

      const xs = visible.map(k => k.x * cW);
      const ys = visible.map(k => k.y * cH);

      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      sumTopY += minY;
      sumBottomY += maxY;
      sumCenterX += (minX + maxX) / 2;

      const ls = kp.find(k => k.name === 'left_shoulder');
      const rs = kp.find(k => k.name === 'right_shoulder');
      if (ls && rs) {
        sumShoulderW += Math.abs(rs.x - ls.x) * cW;
      } else {
        sumShoulderW += (maxX - minX) * 0.4; // Fallback
      }
      validFrames++;
    });

    if (validFrames === 0) return null;

    return {
      topY: sumTopY / validFrames,
      bottomY: sumBottomY / validFrames,
      centerX: sumCenterX / validFrames,
      bodyH: (sumBottomY - sumTopY) / validFrames,
      shoulderW: sumShoulderW / validFrames,
    };
  }

  getBoundsForRendering(): Bounds | null {
    return this.lockedBounds;
  }

  reset() {
    this.isLocked = false;
    this.lockedBounds = null;
    this.livePoseHistory = [];
  }
}
