export class OppoZoomSystem {
  private video: HTMLVideoElement;
  public currentZoom = 1.0;
  public minZoom = 0.6;
  public maxZoom = 10.0;
  public readonly ZOOM_LEVELS = [0.6, 1.0, 2.0, 5.0, 10.0];
  
  private lastPinchDist: number | null = null;

  constructor(videoElement: HTMLVideoElement) {
    this.video = videoElement;
    // Get initial capabilities if possible
    const stream = videoElement.srcObject as MediaStream | null;
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const caps = (track as any).getCapabilities?.() || {};
      if (caps.zoom) {
        this.minZoom = caps.zoom.min || 0.6;
        this.maxZoom = caps.zoom.max || 10.0;
      }
    }
  }

  public setZoom(zoom: number) {
    this.currentZoom = Math.min(this.maxZoom, Math.max(this.minZoom, zoom));
    
    // Apply zoom to actual camera track
    this.applyCameraZoom(this.currentZoom);
    
    return this.currentZoom;
  }

  private async applyCameraZoom(zoom: number) {
    const stream = this.video.srcObject as MediaStream | null;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    const caps = (track as any).getCapabilities?.() || {};
    if (caps.zoom) {
      try {
        await track.applyConstraints({ 
          advanced: [{ zoom: Math.min(zoom, caps.zoom.max) }] 
        } as any);
      } catch (e) {
        console.warn('Failed to apply hardware zoom:', e);
      }
    }
  }

  public snapToNearest(current: number): number {
    const nearest = this.ZOOM_LEVELS.reduce((prev, curr) =>
      Math.abs(curr - current) < Math.abs(prev - current) ? curr : prev
    );
    if (Math.abs(nearest - current) < 0.4) {
      return this.setZoom(nearest);
    }
    return current;
  }

  public handlePinch(touches: React.TouchList): number | null {
    if (touches.length !== 2) {
      this.lastPinchDist = null;
      return null;
    }

    const dist = this.getPinchDist(touches);
    if (this.lastPinchDist) {
      const ratio = dist / this.lastPinchDist;
      const newZoom = this.setZoom(this.currentZoom * ratio);
      this.lastPinchDist = dist;
      return newZoom;
    }
    this.lastPinchDist = dist;
    return this.currentZoom;
  }

  private getPinchDist(touches: React.TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
