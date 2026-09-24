export interface Pose {
  readonly px: number;
  readonly py: number;
  readonly pz: number;
  readonly rx: number;
  readonly ry: number;
  readonly rz: number;
  readonly ph: number;
}

interface Keyframe extends Pose {
  readonly at: number;
}

const restingPose: Pose = { px: 0, py: 1.3, pz: 0, rx: 0.3, ry: 0.22, rz: -0.62, ph: 0 };

const sectionPoses: readonly (readonly [string, Pose])[] = [
  ["hero", restingPose],
  ["features", { px: 0.8, py: -5, pz: 0.6, rx: -0.2, ry: 0.18, rz: -0.34, ph: 1.6 }],
  ["console", { px: 6.4, py: 0.6, pz: 1.2, rx: 0.55, ry: 0.1, rz: -1.32, ph: 2.9 }],
  ["chain", { px: -1, py: 6.9, pz: 1, rx: 1.3, ry: 0.15, rz: -0.28, ph: 4.1 }],
  ["invariant", { px: 7.5, py: 7.8, pz: 0.8, rx: 1.1, ry: 0.14, rz: -0.5, ph: 4.7 }],
  ["how-it-works", { px: 5.6, py: -13.2, pz: 0.4, rx: -0.34, ry: 0.2, rz: -0.4, ph: 5.3 }],
  ["proof", { px: -3.6, py: 10.8, pz: 1.6, rx: 0.95, ry: 0.12, rz: -0.62, ph: 6.4 }],
  ["failures", { px: 0.6, py: -5.8, pz: 0.8, rx: -0.16, ry: 0.18, rz: -0.3, ph: 7.6 }],
  ["faq", { px: -3.2, py: 11.2, pz: 1, rx: 1.25, ry: 0.15, rz: -0.3, ph: 8.7 }],
  ["cta", { px: 0.2, py: 6.8, pz: 0.2, rx: 0.26, ry: 0.2, rz: -0.58, ph: 9.8 }],
  ["contact", { px: 0, py: 8.6, pz: 0.6, rx: 1.1, ry: 0.16, rz: -0.44, ph: 10.6 }],
];

export function measureKeyframes(): readonly Keyframe[] {
  const viewport = window.innerHeight;
  return sectionPoses
    .flatMap(([id, pose]) => {
      const element = document.getElementById(id);
      if (!element) return [];
      const rect = element.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const centre = top + Math.min(rect.height, viewport * 1.4) / 2 - viewport / 2;
      return [{ ...pose, at: Math.max(0, centre) / viewport }];
    })
    .sort((a, b) => a.at - b.at);
}

const ease = (value: number): number => value * value * (3 - 2 * value);

const mix = (from: number, to: number, amount: number): number => from + (to - from) * amount;

export function samplePose(keyframes: readonly Keyframe[], at: number): Pose {
  const first = keyframes[0];
  const last = keyframes[keyframes.length - 1];
  if (!first || !last) return restingPose;
  if (at <= first.at) return first;
  if (at >= last.at) return last;
  const nextIndex = keyframes.findIndex((keyframe) => keyframe.at >= at);
  const from = keyframes[nextIndex - 1] ?? first;
  const to = keyframes[nextIndex] ?? last;
  const amount = ease((at - from.at) / Math.max(1e-6, to.at - from.at));
  return {
    px: mix(from.px, to.px, amount),
    py: mix(from.py, to.py, amount),
    pz: mix(from.pz, to.pz, amount),
    rx: mix(from.rx, to.rx, amount),
    ry: mix(from.ry, to.ry, amount),
    rz: mix(from.rz, to.rz, amount),
    ph: mix(from.ph, to.ph, amount),
  };
}
