import {
  AmbientLight,
  BackSide,
  DirectionalLight,
  Mesh,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  type Texture,
  type WebGLRenderer,
} from "three";

const vertexShader = `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const fragmentShader = `
  varying vec3 vPos;
  void main() {
    vec3 d = normalize(vPos);
    float u = atan(d.z, d.x);
    float v = d.y;
    float mixer = 0.5 + 0.5 * cos(u - 0.55);
    vec3 cool = vec3(0.20, 0.90, 1.02);
    vec3 warm = vec3(0.16, 0.36, 1.08);
    vec3 chroma = mix(cool, warm, mixer);
    chroma = mix(chroma, vec3(0.70, 0.62, 1.04), 0.55 * exp(-pow((u + 2.55) / 0.85, 2.0)));
    chroma = mix(chroma, vec3(0.95, 0.60, 0.96), 0.15 * exp(-pow((u - 1.9) / 0.7, 2.0)));
    vec3 col = chroma * mix(0.36, 1.62, smoothstep(-0.80, 0.72, v));
    col += vec3(1.00, 0.99, 0.97) * 4.60 * exp(-pow((v - 0.58) / 0.030, 2.0));
    col += vec3(0.97, 0.99, 1.00) * 2.60 * exp(-pow((v - 0.24) / 0.024, 2.0));
    col += vec3(1.00, 0.96, 0.99) * 1.00 * exp(-pow((v + 0.06) / 0.024, 2.0));
    col += vec3(0.72, 0.88, 1.00) * 0.55 * exp(-pow((v + 0.44) / 0.060, 2.0));
    float slat = 0.5 + 0.5 * sin(u * 5.0 + 1.2);
    col *= 1.0 + 0.28 * slat * exp(-pow((v - 0.30) / 0.55, 2.0));
    gl_FragColor = vec4(col, 1.0);
  }`;

export function createEnvironment(renderer: WebGLRenderer): Texture {
  const dome = new Mesh(
    new SphereGeometry(50, 64, 32),
    new ShaderMaterial({ side: BackSide, depthWrite: false, vertexShader, fragmentShader }),
  );
  const envScene = new Scene();
  envScene.add(dome);
  const pmrem = new PMREMGenerator(renderer);
  const texture = pmrem.fromScene(envScene, 0.012).texture;
  pmrem.dispose();
  dome.geometry.dispose();
  dome.material.dispose();
  return texture;
}

const lightRig = [
  { color: 0xffffff, intensity: 1.35, position: [2.5, 6, 5] },
  { color: 0xeaf4ff, intensity: 0.85, position: [-4, 3.5, 1.5] },
  { color: 0x3d6bff, intensity: 0.7, position: [-6, 1, 4] },
  { color: 0x5ee0f0, intensity: 1.45, position: [6, -1.5, 4] },
  { color: 0xa9c8f5, intensity: 0.35, position: [0, -6, 2] },
] as const;

export function addLights(scene: Scene): void {
  for (const { color, intensity, position } of lightRig) {
    const [x, y, z] = position;
    const light = new DirectionalLight(color, intensity);
    light.position.set(x, y, z);
    scene.add(light);
  }
  scene.add(new AmbientLight(0xbfd0e8, 0.05));
}
