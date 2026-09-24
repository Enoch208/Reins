import { Color, InstancedMesh, MeshPhysicalMaterial, Object3D } from "three";
import { createSlabGeometry } from "./slab-geometry";

const count = 110;
const spacing = 0.52;
const helixStep = 0.135;
const helixBase = -0.9;
const helixTurn = 0.42;

const tints = {
  cobalt: new Color("#8fa8ff"),
  cyan: new Color("#7adceb"),
  pearl: new Color("#d9d4fa"),
  white: new Color("#ffffff"),
};

function paint(mesh: InstancedMesh): void {
  const color = new Color();
  for (let index = 0; index < count; index++) {
    const cobaltMix = 0.5 + 0.5 * Math.sin(index * 0.17 + 1.3);
    const pearlMix = 0.5 + 0.5 * Math.sin(index * 0.08 - 0.6);
    const bleach = 0.06 + 0.52 * Math.pow(0.5 + 0.5 * Math.sin(index * 0.105 + 2.2), 2);
    color
      .copy(tints.cyan)
      .lerp(tints.cobalt, cobaltMix * 0.5)
      .lerp(tints.pearl, pearlMix * 0.3)
      .lerp(tints.white, bleach);
    mesh.setColorAt(index, color);
  }
}

export interface Chain {
  readonly mesh: InstancedMesh;
  readonly layout: (phase: number) => void;
  readonly dispose: () => void;
}

export function createChain(): Chain {
  const material = new MeshPhysicalMaterial({
    color: 0xffffff,
    vertexColors: true,
    metalness: 0.45,
    roughness: 0.085,
    clearcoat: 1,
    clearcoatRoughness: 0.022,
    envMapIntensity: 1.55,
    specularIntensity: 1.3,
    iridescence: 1,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [180, 780],
  });
  const mesh = new InstancedMesh(createSlabGeometry(), material, count);
  mesh.frustumCulled = false;
  paint(mesh);

  const dummy = new Object3D();
  const layout = (phase: number): void => {
    for (let index = 0; index < count; index++) {
      const offset = index - count / 2;
      dummy.position.set(
        offset * spacing,
        0.42 * Math.sin(offset * 0.085),
        0.22 * Math.sin(offset * 0.06 + 1.2),
      );
      const breathing = 0.05 * Math.sin(index * 0.21 - phase * 0.9);
      dummy.rotation.set(helixBase + index * helixStep + phase * helixTurn + breathing, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  return {
    mesh,
    layout,
    dispose: () => {
      mesh.geometry.dispose();
      material.dispose();
      mesh.dispose();
    },
  };
}
