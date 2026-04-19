export class AdvancedSceneDetector {
  private lastResult: any = null;
  private lastDetectionTime = 0;
  private readonly INTERVAL = 4000;
  private consecutiveResults: string[] = [];

  async detect(videoElement: HTMLVideoElement): Promise<any> {
    const now = Date.now();
    if (now - this.lastDetectionTime < this.INTERVAL && this.lastResult) {
      return this.lastResult;
    }

    const result = await this.runFullDetection(videoElement);
    
    this.consecutiveResults.push(result.primaryScene);
    if (this.consecutiveResults.length > 3) this.consecutiveResults.shift();
    
    const stable = this.getMostCommon(this.consecutiveResults);
    result.primaryScene = stable;
    result.isStable = this.consecutiveResults.filter(r => r === stable).length >= 2;
    
    this.lastResult = result;
    this.lastDetectionTime = now;
    return result;
  }

  private async runFullDetection(videoElement: HTMLVideoElement): Promise<any> {
    const canvas = document.createElement('canvas');
    canvas.width = 224; canvas.height = 224;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { primaryScene: 'indoor_generic' };
    
    ctx.drawImage(videoElement, 0, 0, 224, 224);

    const brightness = this.analyzeBrightness(ctx, 224, 224);
    const colors = this.analyzeDominantColors(ctx, 224, 224);
    const depth = this.estimateDepthClues(ctx, 224, 224);

    // Simplified logic for on-device without full Vision API for now, 
    // but structure is ready for backend labels.
    const labels: any[] = []; // Potential to add labels from backend here

    const outdoorSignals = [
      brightness > 0.55,
      colors.hasBlue && brightness > 0.5,
      !depth.hasCeiling,
    ].filter(Boolean).length;

    const indoorSignals = [
      brightness < 0.45,
      colors.hasArtificialLight,
      depth.hasCeiling,
    ].filter(Boolean).length;

    const isIndoor = indoorSignals > outdoorSignals;
    const lighting = this.classifyLighting(brightness, colors);
    const primaryScene = this.calculatePrimaryScene(isIndoor, colors, brightness);

    return {
      primaryScene,
      isIndoor,
      lighting,
      labels,
      brightness,
      dominantColors: colors
    };
  }

  private analyzeBrightness(ctx: CanvasRenderingContext2D, w: number, h: number): number {
    const imageData = ctx.getImageData(0, 0, w, h).data;
    let total = 0;
    for (let i = 0; i < imageData.length; i += 16) {
      total += (imageData[i] * 0.299 + imageData[i + 1] * 0.587 + imageData[i + 2] * 0.114);
    }
    return total / (imageData.length / 16) / 255;
  }

  private analyzeDominantColors(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const imageData = ctx.getImageData(0, 0, w, h).data;
    let blueCount = 0, greenCount = 0, warmCount = 0, grayCount = 0;
    let samples = 0;
    for (let i = 0; i < imageData.length; i += 32) {
      const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2];
      if (b > r + 30 && b > g + 20) blueCount++;
      if (g > r + 20 && g > b + 20) greenCount++;
      if (r > b + 30 && r > g - 20) warmCount++;
      const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
      if (maxC - minC < 30 && maxC > 100) grayCount++;
      samples++;
    }
    return {
      hasBlue: blueCount / samples > 0.15,
      hasGreen: greenCount / samples > 0.15,
      hasWarm: warmCount / samples > 0.2,
      hasArtificialLight: grayCount / samples > 0.4 && warmCount / samples > 0.3
    };
  }

  private estimateDepthClues(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const topData = ctx.getImageData(0, 0, w, Math.floor(h * 0.25)).data;
    let skyLike = 0, ceilingLike = 0;
    for (let i = 0; i < topData.length; i += 16) {
      const r = topData[i], g = topData[i + 1], b = topData[i + 2];
      if (b > r && b > g && b > 120) skyLike++;
      const diff = Math.max(r, g, b) - Math.min(r, g, b);
      if (diff < 20 && r > 160) ceilingLike++;
    }
    const total = topData.length / 16;
    return {
      hasCeiling: ceilingLike / total > 0.4 && skyLike / total < 0.2
    };
  }

  private classifyLighting(brightness: number, colors: any): string {
    if (brightness > 0.75) return 'bright_daylight';
    if (brightness > 0.55) return 'natural';
    if (brightness > 0.35) return colors.hasWarm ? 'golden_hour' : 'overcast';
    if (brightness > 0.15) return 'dim_indoor';
    return 'night';
  }

  private calculatePrimaryScene(isIndoor: boolean, colors: any, brightness: number): string {
    if (!isIndoor) {
      if (colors.hasBlue && brightness > 0.6) return 'beach';
      if (colors.hasGreen) return 'nature_park';
      return 'urban_street';
    }
    if (colors.hasWarm && brightness < 0.4) return 'cafe_restaurant';
    return 'indoor_generic';
  }

  private getMostCommon(arr: string[]): string {
    const counts: Record<string, number> = {};
    arr.forEach(v => counts[v] = (counts[v] || 0) + 1);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }
}
