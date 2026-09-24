import { BufferAttribute, type BufferGeometry, ExtrudeGeometry, Shape } from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

const width = 3.4;
const height = 2.4;
const radius = 0.5;
const frontZ = 0.05 + 0.055 - 0.025;
const backZ = -0.025 - 0.055;

function roundedCard(): Shape {
  const x = -width / 2;
  const y = -height;
  const shape = new Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.absarc(x + width - radius, y + radius, radius, -Math.PI / 2, 0);
  shape.lineTo(x + width, y + height - radius);
  shape.absarc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2);
  shape.lineTo(x + radius, y + height);
  shape.absarc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI);
  shape.lineTo(x, y + radius);
  shape.absarc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5);
  return shape;
}

function bakeOcclusion(geometry: BufferGeometry): void {
  const position = geometry.getAttribute("position");
  const shade = new Float32Array(position.count * 3);
  for (let index = 0; index < position.count; index++) {
    const front = (position.getZ(index) - backZ) / (frontZ - backZ);
    const spine = 1 - Math.min(1, Math.max(0, (-position.getY(index) - 0.15) / 0.75));
    const value = (0.38 + 0.62 * front) * (1 - 0.3 * spine);
    shade.fill(value, index * 3, index * 3 + 3);
  }
  geometry.setAttribute("color", new BufferAttribute(shade, 3));
}

export function createSlabGeometry(): BufferGeometry {
  const extruded = new ExtrudeGeometry(roundedCard(), {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.055,
    bevelSize: 0.05,
    bevelSegments: 5,
    curveSegments: 16,
  });
  const geometry = mergeVertices(extruded, 1e-4);
  extruded.dispose();
  geometry.computeVertexNormals();
  geometry.translate(0, 0.1, -0.025);
  bakeOcclusion(geometry);
  geometry.rotateY(Math.PI / 2);
  return geometry;
}
