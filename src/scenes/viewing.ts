import * as THREE from 'three';
import type { SceneModel, View } from './model.ts';

/** כיוון המצלמה (מהמטרה אל המצלמה) וכיוון "למעלה" בכל תצוגה */
export function viewBasis(view: View, sectionAxis: 'x' | 'z'): { dir: THREE.Vector3; up: THREE.Vector3 } {
  if (view === 'plan') return { dir: new THREE.Vector3(0, 1, 0), up: new THREE.Vector3(0, 0, -1) };
  if (view === 'section') {
    return { dir: sectionAxis === 'x' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1), up: new THREE.Vector3(0, 1, 0) };
  }
  // אקסונומטריה 30°/30° (DESIGN.md, "מצלמה")
  const az = THREE.MathUtils.degToRad(30);
  const el = THREE.MathUtils.degToRad(30);
  return {
    dir: new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)),
    up: new THREE.Vector3(0, 1, 0),
  };
}

export function modelBounds(m: SceneModel): THREE.Box3 {
  const box = new THREE.Box3();
  for (const v of m.volumes) {
    const c = new THREE.Vector3(...v.center);
    const h = new THREE.Vector3(...v.size).multiplyScalar(0.5);
    box.expandByPoint(c.clone().sub(h)).expandByPoint(c.clone().add(h));
  }
  for (const s of m.surfaces) for (const [x, z] of s.polygon) box.expandByPoint(new THREE.Vector3(x, s.y, z));
  for (const d of m.dims) {
    box.expandByPoint(new THREE.Vector3(...d.from).add(new THREE.Vector3(...d.offset)));
    box.expandByPoint(new THREE.Vector3(...d.to).add(new THREE.Vector3(...d.offset)));
  }
  return box;
}

/** הזום שממלא את הגיליון בתצוגה הנתונה, עם שוליים */
export function fitZoom(box: THREE.Box3, view: View, sectionAxis: 'x' | 'z', width: number, height: number): number {
  const { dir, up } = viewBasis(view, sectionAxis);
  const right = new THREE.Vector3().crossVectors(up, dir).normalize();
  const trueUp = new THREE.Vector3().crossVectors(dir, right).normalize();
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    const p = new THREE.Vector3(x, y, z);
    const px = p.dot(right);
    const py = p.dot(trueUp);
    minX = Math.min(minX, px); maxX = Math.max(maxX, px);
    minY = Math.min(minY, py); maxY = Math.max(maxY, py);
  }
  const margin = 1.3;
  return Math.min(width / ((maxX - minX) * margin || 1), height / ((maxY - minY) * margin || 1));
}
