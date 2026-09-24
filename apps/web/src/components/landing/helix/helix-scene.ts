import {
  ACESFilmicToneMapping,
  Fog,
  Group,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  WebGLRenderer,
} from "three";
import { createChain } from "./chain";
import { addLights, createEnvironment } from "./environment";
import { measureKeyframes, samplePose } from "./poses";

const baseCameraDistance = 21;
const stillPhase = 7.3;

export interface HelixScene {
  readonly dispose: () => void;
}

export function startHelixScene(
  canvas: HTMLCanvasElement,
  context: WebGL2RenderingContext,
  animate: boolean,
): HelixScene {
  const renderer = new WebGLRenderer({ canvas, context, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const environment = createEnvironment(renderer);
  scene.environment = environment;
  scene.fog = new Fog(0xf1f1f3, 28, 52);
  addLights(scene);

  const chain = createChain();
  const group = new Group();
  group.add(chain.mesh);
  scene.add(group);

  const camera = new PerspectiveCamera(32, 1, 0.1, 100);
  let keyframes = measureKeyframes();

  const draw = (scrollY: number, time: number): void => {
    const pose = samplePose(keyframes, scrollY / window.innerHeight);
    group.position.set(pose.px, pose.py, pose.pz);
    group.rotation.set(pose.rx, pose.ry, pose.rz);
    chain.layout(time * 0.55 + pose.ph);
    renderer.render(scene, camera);
  };

  const drawStill = (): void => {
    draw(window.scrollY, stillPhase);
  };

  const resize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const distance = baseCameraDistance * Math.max(1, Math.pow(1.15 / camera.aspect, 0.65));
    camera.position.set(0, 0, distance);
    camera.updateProjectionMatrix();
    keyframes = measureKeyframes();
    if (!animate) drawStill();
  };

  let frame = 0;
  let smoothY = window.scrollY;
  let last = performance.now();
  const loop = (now: number): void => {
    const elapsed = Math.min((now - last) / 1000, 0.05);
    last = now;
    smoothY += (window.scrollY - smoothY) * (1 - Math.exp(-elapsed * 6));
    draw(smoothY, now / 1000);
    frame = requestAnimationFrame(loop);
  };

  const layoutObserver = new ResizeObserver(() => {
    keyframes = measureKeyframes();
  });
  layoutObserver.observe(document.body);
  window.addEventListener("resize", resize);
  resize();
  if (animate) {
    frame = requestAnimationFrame(loop);
  } else {
    window.addEventListener("scroll", drawStill, { passive: true });
  }

  return {
    dispose: () => {
      cancelAnimationFrame(frame);
      layoutObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", drawStill);
      chain.dispose();
      environment.dispose();
      renderer.dispose();
    },
  };
}
