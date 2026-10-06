import { Edges } from '@react-three/drei';
import type { Volume as V } from '../model.ts';
import type { Palette } from '../palette.ts';
import { useView } from './context.ts';

function material(kind: V['kind'], p: Palette): { color: string; opacity: number } {
  switch (kind) {
    case 'soil':
      return { color: p.openSpace, opacity: 1 };
    case 'glass':
      return { color: p.paper, opacity: 0.35 };
    case 'water':
      return { color: p.road, opacity: 1 };
    case 'dark':
      return { color: p.pencil, opacity: 1 };
    default:
      return { color: p.mass, opacity: 1 };
  }
}

/** נפח לבן מט עם קווי מתאר בדיו (EdgesGeometry, זווית סף 30°) */
export function Volume({ v }: { v: V }) {
  const { palette } = useView();
  const { color, opacity } = material(v.kind, palette);
  return (
    <mesh position={v.center} rotation={v.rotation ?? [0, 0, 0]}>
      <boxGeometry args={v.size} />
      <meshLambertMaterial color={color} transparent={opacity < 1} opacity={opacity} depthWrite={opacity === 1} />
      <Edges threshold={30} color={palette.ink} />
    </mesh>
  );
}
