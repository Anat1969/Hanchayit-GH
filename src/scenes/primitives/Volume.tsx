import { Edges } from '@react-three/drei';
import type { Volume as V } from '../model.ts';
import { useView } from './context.ts';

/** נפח לבן מט עם קווי מתאר בדיו (EdgesGeometry, זווית סף 30°) */
export function Volume({ v }: { v: V }) {
  const { palette } = useView();
  const color = v.kind === 'soil' ? palette.openSpace : palette.mass;
  return (
    <mesh position={v.center}>
      <boxGeometry args={v.size} />
      <meshLambertMaterial color={color} />
      <Edges threshold={30} color={palette.ink} />
    </mesh>
  );
}
