import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../reduced-motion";
import { startHelixScene } from "./helix-scene";

export function HelixCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("webgl2", { antialias: true, alpha: true });
    if (!context) {
      canvas.hidden = true;
      return;
    }
    const scene = startHelixScene(canvas, context, !prefersReducedMotion());
    return () => {
      scene.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="scene" aria-hidden />;
}
