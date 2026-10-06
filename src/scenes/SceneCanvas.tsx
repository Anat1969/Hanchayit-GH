import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, N8AO, SMAA } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { SceneModel, View } from './model.ts';
import { fitZoom, modelBounds, viewBasis } from './viewing.ts';
import { readPalette } from './palette.ts';
import { SKY } from './materials.ts';
import { ViewContext } from './primitives/context.ts';
import { Volume } from './primitives/Volume.tsx';
import { Surface } from './primitives/Surface.tsx';
import { PlotBoundary } from './primitives/PlotBoundary.tsx';
import { Tree } from './primitives/Tree.tsx';
import { Person } from './primitives/Person.tsx';
import { Dimension, PencilLabel, TagLabel } from './primitives/Dimension.tsx';

const DISTANCE = 200;
const DURATION = 300;

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * מצלמה אורתוגרפית: מעבר של 300ms בין תצוגות (מיידי בהפחתת תנועה),
 * סיבוב רק באקסונומטריה, הגדלה בגבולות.
 */
export type NavMode = 'pan' | 'rotate';

/** פקודת זום מהכפתורים: n משתנה בכל לחיצה, factor הוא היחס */
export interface ZoomCommand {
  n: number;
  factor: number;
}

function CameraRig({ model, view, resetKey, mode, zoom, onZoom }: {
  model: SceneModel;
  view: View;
  resetKey: number;
  mode: NavMode;
  zoom: ZoomCommand;
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

  // זום מהכפתורים, בגבולות
  useEffect(() => {
    if (!zoom.n) return;
    const cam = camera as THREE.OrthographicCamera;
    cam.zoom = THREE.MathUtils.clamp(cam.zoom * zoom.factor, fit * 0.5, fit * 6);
    cam.updateProjectionMatrix();
    controls.current?.update();
    onZoom(cam.zoom, cam.getWorldDirection(new THREE.Vector3()).negate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom.n]);

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
      enableRotate={mode === 'rotate'}
      mouseButtons={{
        LEFT: mode === 'pan' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: mode === 'pan' ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN,
      }}
      touches={{ ONE: mode === 'pan' ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
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

/** סביבת סטודיו מקומית להשתקפויות (בלי קבצים מהרשת), כדי שזכוכית ומים יבריקו */
function Studio() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** אור שמש עם צל רך, שמצלמת הצל שלו מכסה את הסצנה */
function Sun({ model }: { model: SceneModel }) {
  const box = useMemo(() => modelBounds(model), [model]);
  const size = box.getSize(new THREE.Vector3()).length() / 2 + 2;
  const c = box.getCenter(new THREE.Vector3());
  const light = useRef<THREE.DirectionalLight>(null);
  useEffect(() => {
    const l = light.current;
    if (!l) return;
    l.target.position.copy(c);
    l.target.updateMatrixWorld();
    const cam = l.shadow.camera;
    cam.left = -size;
    cam.right = size;
    cam.top = size;
    cam.bottom = -size;
    cam.near = 0.5;
    cam.far = size * 6;
    cam.updateProjectionMatrix();
  }, [c, size]);
  return (
    <directionalLight
      ref={light}
      position={[c.x - size, c.y + size * 2, c.z + size * 1.2]}
      intensity={1.7}
      color="#fff4e2"
      castShadow={!model.computedShadows}
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0004}
      shadow-radius={4}
    />
  );
}

/** קולט צל שקוף על הקרקע */
function ShadowCatcher({ model }: { model: SceneModel }) {
  const box = useMemo(() => modelBounds(model), [model]);
  const s = box.getSize(new THREE.Vector3());
  const c = box.getCenter(new THREE.Vector3());
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[c.x, -0.02, c.z]} receiveShadow>
      <planeGeometry args={[s.x + 20, s.z + 20]} />
      <shadowMaterial transparent opacity={0.22} />
    </mesh>
  );
}

export default function SceneCanvas({ sceneKey, model, view, resetKey, mode, zoom, onZoom }: {
  /** מזהה הסצנה: החלפה מפעילה מחדש את הנפשת הכניסה */
  sceneKey: string;
  model: SceneModel;
  view: View;
  resetKey: number;
  mode: NavMode;
  zoom: ZoomCommand;
  onZoom: (zoom: number) => void;
}) {
  const palette = useMemo(readPalette, []);
  const [state, setState] = useState({ zoom: 20, viewDir: viewBasis(view, model.sectionAxis).dir });
  const last = useRef(0);

  const handleZoom = (zoom: number, viewDir: THREE.Vector3) => {
    // עדכון התוויות והסימנים לפי הזום, בלי לרנדר בכל פריים
    const now = performance.now();
    if (now - last.current < 80 && Math.abs(zoom - state.zoom) / state.zoom < 0.05 && viewDir.distanceTo(state.viewDir) < 0.05) return;
    last.current = now;
    setState({ zoom, viewDir });
    onZoom(zoom);
  };

  return (
    <Canvas
      orthographic
      shadows="soft"
      dpr={[1, 3]}
      gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 0.9 }}
      camera={{ position: [0, 0, 0], zoom: 20, near: 0.1, far: 1000 }}
      aria-hidden="true"
    >
      <color attach="background" args={[SKY]} />
      <Studio />
      <hemisphereLight args={['#eaf3ff', '#b8a98a', 0.55]} />
      <Sun model={model} />
      {!model.computedShadows && <ShadowCatcher model={model} />}
      <ViewContext.Provider value={{ palette, zoom: state.zoom, viewDir: state.viewDir }}>
        <CameraRig model={model} view={view} resetKey={resetKey} mode={mode} zoom={zoom} onZoom={handleZoom} />
        <group key={sceneKey}>
          {model.surfaces.map((s, i) => <Surface key={`s${i}`} s={s} />)}
          {model.lines.map((l, i) => <PlotBoundary key={`l${i}`} line={l} />)}
          {model.volumes.map((v, i) => <Volume key={`v${i}`} v={v} delay={Math.min(i, 30) * 18} />)}
          {model.trees.map((t, i) => <Tree key={`t${i}`} at={t} />)}
          {model.persons.map((p, i) => <Person key={`p${i}`} at={p} />)}
          {model.dims.map((d) => <Dimension key={`${d.ruleId}/${d.paramKey}`} d={d} />)}
          {model.tags.map((t) => <TagLabel key={`${t.ruleId}/${t.paramKey}`} t={t} />)}
          {model.labels.map((l, i) => <PencilLabel key={`b${i}`} text={l.text} at={l.at} />)}
        </group>
      </ViewContext.Provider>
      {/* עומק בפינות ובמגע עם הקרקע, והחלקת קצוות */}
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <N8AO aoRadius={1.2} distanceFalloff={0.6} intensity={2.2} color="#3a3328" quality="medium" />
        <SMAA />
      </EffectComposer>
    </Canvas>
  );
}
