import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Surface as S } from '../model.ts';
import { useView } from './context.ts';

/** גוון ייעוד קרקע באטימות 35%, מתחת לקווי הדיו. במדרכה: שתי שורות ריצוף מרומזות. */
export function Surface({ s }: { s: S }) {
  const { palette } = useView();
  const shape = useMemo(() => {
    const sh = new THREE.Shape();
    s.polygon.forEach(([x, z], i) => (i === 0 ? sh.moveTo(x, -z) : sh.lineTo(x, -z)));
    sh.closePath();
    return sh;
  }, [s.polygon]);

  const paving = useMemo(() => {
    if (!s.paving) return [];
    const { from, to, width } = s.paving;
    const y = s.y + 0.005;
    return [1 / 3, 2 / 3].map((f) => [
      [from[0], y, from[1] + width * f],
      [to[0], y, to[1] + width * f],
    ] as [number, number, number][]);
  }, [s.paving, s.y]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, s.y, 0]} renderOrder={-1}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial color={palette[s.use]} transparent opacity={0.35} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {paving.map((pts, i) => (
        <Line key={i} points={pts} color={palette.pencil} lineWidth={0.75} />
      ))}
    </group>
  );
}
