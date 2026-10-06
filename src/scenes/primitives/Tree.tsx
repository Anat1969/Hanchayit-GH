import { Edges } from '@react-three/drei';
import { TREE } from '../fixtures.ts';
import type { Vec3 } from '../model.ts';
import { useView } from './context.ts';

/** עץ כגליל וכדור בגוון השצ"פ, עם קו דיו */
export function Tree({ at }: { at: Vec3 }) {
  const { palette } = useView();
  const [x, y, z] = at;
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, TREE.trunkHeight / 2, 0]}>
        <cylinderGeometry args={[TREE.trunkRadius, TREE.trunkRadius, TREE.trunkHeight, 8]} />
        <meshLambertMaterial color={palette.openSpace} />
        <Edges threshold={30} color={palette.ink} />
      </mesh>
      <mesh position={[0, TREE.trunkHeight + TREE.crownRadius * 0.8, 0]}>
        <sphereGeometry args={[TREE.crownRadius, 12, 8]} />
        <meshLambertMaterial color={palette.openSpace} />
        <Edges threshold={30} color={palette.ink} />
      </mesh>
    </group>
  );
}
