import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { SceneModel, View } from './model.ts';
import { fitZoom, modelBounds, viewBasis } from './viewing.ts';
import { readPalette } from './palette.ts';
import { ViewContext } from './primitives/context.ts';
import { Volume } from './primitives/Volume.tsx';
import { Surface } from './primitives/Surface.tsx';
import { PlotBoundary } from './primitives/PlotBoundary.tsx';
import { Tree } from './primitives/Tree.tsx';
import { Person } from './primitives/Person.tsx';
import { Dimension, TagLabel } from './primitives/Dimension.tsx';

const DISTANCE = 200;
const DURATION = 300;

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * מצלמה אורתוגרפית: מעבר של 300ms בין תצוגות (מיידי בהפחתת תנועה),
 * סיבוב רק באקסונומטריה, הגדלה בגבולות.
 */
function CameraRig({ model, view, resetKey, onZoom }: {
  model: SceneModel;
  view: View;
  resetKey: number;
  onZoom: (zoom: number, viewDir: THREE.Vector3) => void;
}) {
  const { camera, size } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const box = useMemo(() => modelBounds(model), [model]);
  const center = useMemo(() => box.getCenter(new THREE.Vector3()), [box]);
  const fit = useMemo(() => fitZoom(box, view, model.sectionAxis, size.width, size.height), [box, view, model.sectionAxis, size]);
  const anim = useRef<{ t0: number; from: { pos: THREE.Vector3; up: THREE.Vector3; zoom: number; target: THREE.Vector3 } } | null>(null);
  const [settled, setSettled] = useState(0);

  const { dir, up } = viewBasis(view, model.sectionAxis);
  const goal = useMemo(
    () => ({ pos: center.clone().add(dir.clone().multiplyScalar(DISTANCE)), up: up.clone(), zoom: fit, target: center.clone() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [center, view, model.sectionAxis, fit],
  );

  useEffect(() => {
    const target = controls.current?.target.clone() ?? center.clone();
    anim.current = { t0: performance.now(), from: { pos: camera.position.clone(), up: camera.up.clone(), zoom: (camera as THREE.OrthographicCamera).zoom, target } };
    if (reducedMotion() || camera.position.lengthSq() === 0) anim.current.t0 = -Infinity;
  }, [goal, resetKey, camera, center]);

  useFrame(() => {
    const a = anim.current;
    if (!a) return;
    const cam = camera as THREE.OrthographicCamera;
    const t = Math.min(1, (performance.now() - a.t0) / DURATION);
    const k = t * t * (3 - 2 * t);
    cam.position.lerpVectors(a.from.pos, goal.pos, k);
    cam.up.lerpVectors(a.from.up, goal.up, k).normalize();
    cam.zoom = a.from.zoom + (goal.zoom - a.from.zoom) * k;
    const target = a.from.target.clone().lerp(goal.target, k);
    cam.lookAt(target);
    cam.updateProjectionMatrix();
    if (t >= 1) {
      anim.current = null;
      setSettled((n) => n + 1);
      onZoom(cam.zoom, dir.clone());
    }
  });

  return (
    <OrbitControls
      // הרכבה מחדש אחרי כל מעבר, כדי שהבקר יקבל את כיוון "למעלה" של התצוגה
      key={`${view}-${settled}`}
      ref={controls}
      makeDefault
      target={goal.target}
      enableRotate={view === 'axo'}
      enableDamping={false}
      minZoom={fit * 0.5}
      maxZoom={fit * 6}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2}
      onChange={(e) => {
        if (anim.current || !e) return;
        const cam = camera as THREE.OrthographicCamera;
        onZoom(cam.zoom, cam.getWorldDirection(new THREE.Vector3()).negate());
      }}
    />
  );
}

export default function SceneCanvas({ model, view, resetKey, onZoom }: {
  model: SceneModel;
  view: View;
  resetKey: number;
  onZoom: (zoom: number) => void;
}) {
  const palette = useMemo(readPalette, []);
  const [state, setState] = useState({ zoom: 20, viewDir: viewBasis(view, model.sectionAxis).dir });
  const last = useRef(0);

  const handleZoom = (zoom: number, viewDir: THREE.Vector3) => {
    // עדכון התוויות והסימנים לפי הזום, בלי לרנדר בכל פריים
    const now = performance.now();
    if (now - last.current < 80 && Math.abs(zoom - state.zoom) / state.zoom < 0.05) return;
    last.current = now;
    setState({ zoom, viewDir });
    onZoom(zoom);
  };

  return (
    <Canvas orthographic dpr={[1, 2]} camera={{ position: [0, 0, 0], zoom: 20, near: 0.1, far: 1000 }} aria-hidden="true">
      <color attach="background" args={[palette.paper]} />
      <ambientLight intensity={2.2} />
      <directionalLight position={[-30, 60, 40]} intensity={1} />
      <ViewContext.Provider value={{ palette, zoom: state.zoom, viewDir: state.viewDir }}>
        <CameraRig model={model} view={view} resetKey={resetKey} onZoom={handleZoom} />
        {model.surfaces.map((s, i) => <Surface key={`s${i}`} s={s} />)}
        {model.lines.map((l, i) => <PlotBoundary key={`l${i}`} line={l} />)}
        {model.volumes.map((v, i) => <Volume key={`v${i}`} v={v} />)}
        {model.trees.map((t, i) => <Tree key={`t${i}`} at={t} />)}
        {model.persons.map((p, i) => <Person key={`p${i}`} at={p} />)}
        {model.dims.map((d) => <Dimension key={`${d.ruleId}/${d.paramKey}`} d={d} />)}
        {model.tags.map((t) => <TagLabel key={`${t.ruleId}/${t.paramKey}`} t={t} />)}
      </ViewContext.Provider>
    </Canvas>
  );
}
