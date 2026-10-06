import { Edges } from '@react-three/drei';
import { TREE } from '../fixtures.ts';
import { TREE_FINISH } from '../materials.ts';
import type { Vec3 } from '../model.ts';
import { useView } from './context.ts';

/** עץ כגליל וכדור: גזע בגוון עץ וצמרת ירוקה, עם קו דיו */
export function Tree({ at }: { at: Vec3 }) {
  const { palette } = useView();
  const [x, y, z] = at;
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, TREE.trunkHeight / 2, 0]}>
        <cylinderGeometry args={[TREE.trunkRadius, TREE.trunkRadius, TREE.trunkHeight, 8]} />
        <meshStandardMaterial color={TREE_FINISH.trunk} roughness={0.9} />
        <Edges threshold={30} color={palette.ink} />
      </mesh>
      <mesh position={[0, TREE.trunkHeight + TREE.crownRadius * 0.8, 0]} castShadow>
        <sphereGeometry args={[TREE.crownRadius, 20, 14]} />
        <meshStandardMaterial color={TREE_FINISH.crown} roughness={0.85} />
        <Edges threshold={30} color={palette.ink} />
      </mesh>
    </group>
  );
}
