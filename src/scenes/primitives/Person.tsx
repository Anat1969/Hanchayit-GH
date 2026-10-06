import { PERSON_HEIGHT } from '../fixtures.ts';
import type { Vec3 } from '../model.ts';
import { useView } from './context.ts';

/** צללית אחת בגובה 1.70 מ' בעיפרון, כקנה מידה */
export function Person({ at }: { at: Vec3 }) {
  const { palette } = useView();
  const head = PERSON_HEIGHT * 0.07;
  const body = PERSON_HEIGHT - head * 2;
  return (
    <group position={at}>
      <mesh position={[0, body / 2, 0]}>
        <cylinderGeometry args={[0.16, 0.12, body, 10]} />
        <meshBasicMaterial color={palette.pencil} />
      </mesh>
      <mesh position={[0, body + head, 0]}>
        <sphereGeometry args={[head, 10, 8]} />
        <meshBasicMaterial color={palette.pencil} />
      </mesh>
    </group>
  );
}
