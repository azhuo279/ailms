"use client";

import {
  Suspense,
  createElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Environment, PerspectiveCamera, RoundedBox } from "@react-three/drei";
import { RoundedBoxGeometry } from "three-stdlib";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export type AiAvatarState = "dormant" | "active";

export interface AiAvatarProps {
  /**
   * Which pose the avatar animates toward.
   *
   * - **Controlled** — pass `state` explicitly and the parent owns the pose;
   *   clicking the avatar still fires no internal toggle (the parent's value
   *   always wins).
   * - **Uncontrolled** (default) — omit `state` and the avatar manages its
   *   own dormant/active pose internally, toggling on click of the body cube.
   */
  state?: AiAvatarState;
  /**
   * Fires when the avatar's body cube is clicked. In controlled mode (an
   * explicit `state` prop) this is the signal a parent listens to for the
   * click, since the avatar no longer toggles its own pose — e.g. the App
   * Shell uses it to open the Copilot panel and drive `state` itself.
   */
  onClick?: () => void;
  className?: string;
  /**
   * Single source of truth for the avatar's on-screen footprint, in pixels.
   * The canvas is always square (width === height === `size`) — this is the
   * one control that resizes both the canvas box and the rendered cube
   * together, since the camera's field of view and distance are tuned to
   * frame the cube tightly regardless of pixel size. Default matches the
   * previous `max-w-xs` footprint at typical viewport widths.
   */
  size?: number;
}

/**
 * Design-token colors resolved to sRGB hex for Three.js materials/lights,
 * which need numeric color values rather than CSS custom properties.
 *
 * Source: the reserved `--color-ai-*` ramp in src/app/globals.css (hue 190,
 * teal — reserved exclusively for AI reasoning/override surfaces). Each hex
 * value below is the sRGB conversion of that token's OKLCH definition, so the
 * mapping stays traceable back to the token source instead of being a
 * disconnected magic value.
 */
const TOKEN_COLORS = {
  /** --color-ai-50: oklch(0.97 0.013 190) — softest fill-light tint. */
  ai50: "#ecf8f7",
  /** --color-ai-100: oklch(0.93 0.013 190) — top-facet highlight tone. */
  ai100: "#dfebea",
  /** --color-ai-200: oklch(0.87 0.028 190) — legacy base fill; retained for reference, no longer used on body/appendage geometry (see ai400). */
  ai200: "#c0dbd8",
  /** --color-ai-300: oklch(0.79 0.05 190) — side-facet shadow tone. */
  ai300: "#96c5c2",
  /** --color-ai-400: oklch(0.71 0.083 190) — base body/appendage fill. A more saturated ramp step than ai200 so the teal reads clearly under the light rig instead of washing out to grey. */
  ai400: "#5eb2ad",
  /** --color-ai-500: oklch(0.63 0.11 190) — rim-light bounce-color accent. */
  ai500: "#009e98",
  /** --color-ai-700: oklch(0.44 0.104 190) — deepened rim/AO accent for the lower facets. */
  ai700: "#00645f",
  /** --color-neutral-900: oklch(0.22 0.014 258) — face decal (eyes/mouth) ink tone. */
  neutral900: "#171b21",
} as const;

/** Body cube edge length, in Three.js scene units. */
const BODY_SIZE = 1.6;
const BODY_RADIUS = 0.16;
/** Appendage cube edge length, in Three.js scene units. */
const APPENDAGE_SIZE = 0.42;
const APPENDAGE_RADIUS = 0.09;

/** Facing rotations, in radians, for each named pose. */
const ROTATION_DORMANT = new THREE.Euler(0.18, Math.PI / 4 + 0.15, 0);
const ROTATION_ACTIVE = new THREE.Euler(0, 0, 0);

function lerpAngle(current: number, target: number, t: number) {
  // Shortest-path angle interpolation so a spin never takes the "long way around".
  let delta = target - current;
  delta = ((delta + Math.PI) % (Math.PI * 2)) - Math.PI;
  return current + delta * t;
}

/**
 * Paints a top-to-bottom vertex color gradient onto a geometry in place —
 * top vertices get `topColor`, bottom vertices get `bottomColor`, interpolated
 * by each vertex's normalized Y position. Combined with `vertexColors: true`
 * on the material, this is what gives the body its dimensional gradient
 * (per the reference mascot) instead of one single flat fill color.
 */
function applyVerticalGradient(
  geometry: THREE.BufferGeometry,
  topColor: string,
  bottomColor: string,
) {
  const position = geometry.attributes.position;
  const top = new THREE.Color(topColor);
  const bottom = new THREE.Color(bottomColor);
  const colors = new Float32Array(position.count * 3);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const minY = box.min.y;
  const range = box.max.y - minY || 1;
  const c = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    const t = (position.getY(i) - minY) / range;
    // Both stops are now teal (ai300 crown → ai400 base), so this is a gentle
    // top-lit dimensional shade rather than a two-hue blend. A mild top bias
    // (t^0.85) keeps the lighter crown reading as a soft highlight without a
    // hard band. The blue accent is no longer in this gradient at all — it
    // lives on the fresnel rim glow (see RimGlow) so it stays on the edges.
    const biasedT = Math.pow(t, 0.85);
    c.copy(bottom).lerp(top, biasedT);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

/**
 * A rounded-corner box with a real per-vertex color gradient, built directly
 * from three-stdlib's `RoundedBoxGeometry` (the same geometry drei's
 * `RoundedBox` wraps) instead of drei's helper, so the geometry object is
 * owned here and can be gradient-painted once via `applyVerticalGradient`.
 * The material must set `vertexColors: true` for this to take effect —
 * `color` is left at "#ffffff" so it multiplies the vertex colors as-is
 * rather than tinting them.
 */
function GradientRoundedBox({
  args,
  radius,
  topColor,
  bottomColor,
  children,
  ...meshProps
}: {
  args: [number, number, number];
  radius: number;
  topColor: string;
  bottomColor: string;
  children?: React.ReactNode;
} & Record<string, unknown>) {
  const geometry = useMemo(() => {
    const geo = new RoundedBoxGeometry(args[0], args[1], args[2], 4, radius);
    applyVerticalGradient(geo, topColor, bottomColor);
    return geo;
  }, [args, radius, topColor, bottomColor]);

  return createElement(mesh, { geometry, ...meshProps }, children);
}

/**
 * Builds a flat ellipse outline as a `THREE.Shape` so the eyes render as true
 * 2D fills (ShapeGeometry) rather than sphere geometry with apparent volume.
 */
function ellipseShape(radiusX: number, radiusY: number) {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, radiusX, radiusY, 0, Math.PI * 2, false, 0);
  return shape;
}

/**
 * Builds a flat, thin crescent band as a `THREE.Shape` — an outer smile arc
 * offset from an inner arc of the same curvature, so the fill reads as a
 * rounded smile line with no 3D volume (a stroke approximated as a filled
 * sliver, since ShapeGeometry only fills, it cannot stroke a path).
 */
function smileShape(radius: number, thickness: number, arc: number) {
  const shape = new THREE.Shape();
  const halfArc = arc / 2;
  const startAngle = Math.PI / 2 - halfArc;
  const endAngle = Math.PI / 2 + halfArc;
  const outerRadius = radius + thickness / 2;
  const innerRadius = radius - thickness / 2;
  shape.absarc(0, 0, outerRadius, startAngle, endAngle, false);
  shape.absarc(0, 0, innerRadius, endAngle, startAngle, true);
  shape.closePath();
  return shape;
}

/*
 * NOTE on createElement vs JSX below: every react-three-fiber scene node in
 * this file (mesh/group/shapeGeometry/meshBasicMaterial/etc.) is built with
 * `createElement` instead of JSX syntax. This is a deliberate workaround, not
 * a style choice — the project's dev-only Starling annotation tooling runs a
 * babel plugin that stamps `data-inspector-*` attributes onto every
 * lowercase-first JSX tag to support its design-annotation feature. That
 * plugin can't distinguish real DOM host elements from react-three-fiber's
 * lowercase Three.js intrinsics, so it stamps those too — and R3F's custom
 * reconciler throws at runtime ("Cannot set data-inspector-line") because
 * those aren't DOM nodes. Starling's plugin only rewrites JSX syntax, so
 * building this subtree via createElement calls keeps it invisible to that
 * babel pass entirely. The outer wrapper (Suspense/div) stays normal JSX
 * since those ARE real DOM elements Starling can safely annotate.
 */
const group = "group";
const mesh = "mesh";
const shapeGeometry = "shapeGeometry";
const meshBasicMaterial = "meshBasicMaterial";
const ambientLight = "ambientLight";
const directionalLight = "directionalLight";
const shaderMaterial = "shaderMaterial";

/**
 * Fresnel-based rim glow: a slightly larger, backface-only copy of the body
 * geometry whose brightness increases toward the silhouette edge (view angle
 * near-perpendicular to the surface normal). This is what makes the glow hug
 * the cube's actual rounded-edge shape instead of sitting behind it as a flat
 * circle — matching Microsoft Copilot's blob, whose glow is a thin rim that
 * follows the body's contour, not a soft halo shape independent of it.
 */
const RIM_GLOW_VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;
const RIM_GLOW_FRAGMENT_SHADER = `
  uniform vec3 glowColor;
  uniform float intensity;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    float rim = 1.0 - max(dot(normalize(vNormal), normalize(vViewPosition)), 0.0);
    // Higher power than before (4.0 vs 2.5) narrows the visible band to a
    // crisp thin edge instead of a broad soft glow — a tighter "radius" per
    // the reference — while intensity brightens that thinner band so it
    // still reads clearly rather than fading out.
    float fresnel = pow(rim, 4.0) * intensity;
    gl_FragColor = vec4(glowColor, fresnel);
  }
`;

function RimGlow({
  geometryArgs,
  radius,
  scale = 1.035,
  color,
  intensity = 1.1,
}: {
  geometryArgs: [number, number, number];
  radius: number;
  scale?: number;
  color: string;
  intensity?: number;
}) {
  const uniforms = useMemo(
    () => ({
      glowColor: { value: new THREE.Color(color) },
      intensity: { value: intensity },
    }),
    [color, intensity],
  );

  return createElement(
    group,
    { scale: [scale, scale, scale] },
    createElement(
      RoundedBox,
      { args: geometryArgs, radius, smoothness: 4 },
      createElement(shaderMaterial, {
        uniforms,
        vertexShader: RIM_GLOW_VERTEX_SHADER,
        fragmentShader: RIM_GLOW_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
      }),
    ),
  );
}

/**
 * The face decal — two flat ellipse eyes and a flat rounded-line smile,
 * painted onto the body's front facet as thin flat planes (ShapeGeometry)
 * rather than modeled in relief, matching the reference mascots' flat 2D
 * face style. Rendered with an unlit `meshBasicMaterial` since a painted
 * decal should read as flat ink regardless of the body's scene lighting.
 * Visible only in the active pose; fades in/out via the revealRef driven
 * from the parent's state machine.
 */
function Face({ revealRef }: { revealRef: React.MutableRefObject<number> }) {
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);

  // Flat shapes are built once; geometry is stable across the component's lifetime.
  const eyeShape = useMemo(() => ellipseShape(0.075, 0.12), []);
  const mouthShapeGeo = useMemo(
    () => smileShape(0.22, 0.05, Math.PI * 0.62),
    [],
  );

  // Blink state: randomized natural blink timing (fast close, slower open),
  // driven by a self-scheduling timeout rather than a continuous frame-loop
  // computation — a blink is a discrete, infrequent event (roughly every 3-6s),
  // not a continuous animation, so a timer here is simpler and cheaper than
  // running blink-phase math on every frame while idle between blinks.
  const blink = useRef({
    phase: "idle" as "idle" | "closing" | "opening",
    progress: 0,
  });

  useMemo(() => {
    function scheduleNextBlink() {
      const delayMs = 3000 + Math.random() * 3000; // every 3-6s, randomized
      return setTimeout(() => {
        blink.current.phase = "closing";
        blink.current.progress = 0;
        scheduleNextBlink();
      }, delayMs);
    }
    const timer = scheduleNextBlink();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    const b = blink.current;
    if (b.phase === "closing") {
      b.progress += delta / 0.09; // fast close (~90ms)
      if (b.progress >= 1) {
        b.progress = 0;
        b.phase = "opening";
      }
    } else if (b.phase === "opening") {
      b.progress += delta / 0.14; // slightly slower open (~140ms)
      if (b.progress >= 1) {
        b.progress = 1;
        b.phase = "idle";
      }
    }

    const closedAmount =
      b.phase === "closing"
        ? b.progress
        : b.phase === "opening"
          ? 1 - b.progress
          : 0;
    const eyeScaleY = Math.max(0.05, 1 - closedAmount) * revealRef.current;
    const reveal = revealRef.current;

    if (leftEyeRef.current) {
      leftEyeRef.current.scale.set(reveal, eyeScaleY, 1);
      (leftEyeRef.current.material as THREE.MeshBasicMaterial).opacity = reveal;
    }
    if (rightEyeRef.current) {
      rightEyeRef.current.scale.set(reveal, eyeScaleY, 1);
      (rightEyeRef.current.material as THREE.MeshBasicMaterial).opacity =
        reveal;
    }
    if (mouthRef.current) {
      mouthRef.current.scale.setScalar(reveal);
      (mouthRef.current.material as THREE.MeshBasicMaterial).opacity = reveal;
    }
  });

  const faceZ = BODY_SIZE / 2 + 0.01;

  // Flat ellipse eyes: ShapeGeometry fills with no 3D volume, painted onto the
  // front facet. Flat rounded smile: a thin flat crescent, not a modeled torus arc.
  return createElement(
    group,
    { position: [0, 0.08, faceZ] },
    createElement(
      mesh,
      // Narrower gap (was ±0.32, now ±0.22) and shifted down (was 0.18, now
      // 0.06) per the reference — eyes read too wide-set and too high before.
      { ref: leftEyeRef, position: [-0.22, 0.06, 0] },
      createElement(shapeGeometry, { args: [eyeShape] }),
      createElement(meshBasicMaterial, {
        color: TOKEN_COLORS.neutral900,
        transparent: true,
      }),
    ),
    createElement(
      mesh,
      { ref: rightEyeRef, position: [0.22, 0.06, 0] },
      createElement(shapeGeometry, { args: [eyeShape] }),
      createElement(meshBasicMaterial, {
        color: TOKEN_COLORS.neutral900,
        transparent: true,
      }),
    ),
    createElement(
      mesh,
      { ref: mouthRef, position: [0, -0.22, 0], rotation: [0, 0, Math.PI] },
      createElement(shapeGeometry, { args: [mouthShapeGeo] }),
      createElement(meshBasicMaterial, {
        color: TOKEN_COLORS.neutral900,
        transparent: true,
      }),
    ),
  );
}

/**
 * One rounded-corner appendage cube. Fully static in position (no bob in
 * either pose) — only its rotation, scale, and opacity animate as the avatar
 * transitions between dormant and active.
 */
function Appendage({
  basePosition,
  visibilityRef,
  poseRef,
}: {
  basePosition: [number, number, number];
  visibilityRef: React.MutableRefObject<number>;
  poseRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);

  useFrame(() => {
    if (groupRef.current) {
      const scale = 0.6 + 0.4 * visibilityRef.current;
      groupRef.current.scale.setScalar(scale);
      // Match the body's own dormant-to-active rotation so the appendage
      // faces the same direction as the body instead of always sitting
      // axis-aligned to the camera — per the reference sketch, the small
      // cube shares the body's corner-leading orientation in dormant.
      const pose = poseRef.current;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        ROTATION_DORMANT.y,
        ROTATION_ACTIVE.y,
        pose,
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        ROTATION_DORMANT.x,
        ROTATION_ACTIVE.x,
        pose,
      );
    }
    if (materialRef.current) {
      materialRef.current.opacity = visibilityRef.current;
    }
  });

  return createElement(
    group,
    { ref: groupRef, position: basePosition },
    createElement(
      GradientRoundedBox,
      {
        args: [APPENDAGE_SIZE, APPENDAGE_SIZE, APPENDAGE_SIZE],
        radius: APPENDAGE_RADIUS,
        // Same teal-only face treatment as the body (see AvatarScene): a
        // gentle ai300→ai400 teal gradient with no blue on the faces. The
        // blue accent lives on the rim glow below so it stays on the edges.
        topColor: TOKEN_COLORS.ai300,
        bottomColor: TOKEN_COLORS.ai400,
      },
      // Soft satin-plastic material: matches the body's clearcoat treatment
      // so the appendages read as the same toy material, not a flatter finish.
      // meshPhysicalMaterial extends meshStandardMaterial, so it also
      // supports vertexColors — this picks up the gradient painted onto the
      // geometry above; `color` stays white so it multiplies the vertex
      // colors unmodified rather than tinting them.
      createElement("meshPhysicalMaterial", {
        ref: materialRef,
        color: "#ffffff",
        vertexColors: true,
        roughness: 0.32,
        metalness: 0,
        clearcoat: 0.75,
        clearcoatRoughness: 0.16,
        envMapIntensity: 0.9,
        transparent: true,
      }),
    ),
    createElement(RimGlow, {
      geometryArgs: [APPENDAGE_SIZE, APPENDAGE_SIZE, APPENDAGE_SIZE],
      radius: APPENDAGE_RADIUS,
      color: TOKEN_COLORS.ai100,
      intensity: 1.6,
    }),
  );
}

/**
 * The animated scene contents: body cube, face, and two appendages, driven by
 * a single state machine that eases rotation/reveal toward the target pose on
 * every frame (a continuous frame-loop drive, not discrete setInterval steps —
 * this is what lets dormant <-> active read as one continuous spin/reveal
 * rather than a jump-cut).
 *
 * `onToggle` fires on a click of the body cube — the parent decides what that
 * means (uncontrolled `AiAvatar` toggles its own pose; a controlled parent may
 * ignore it or use it as a signal alongside its own `state` prop).
 */
function AvatarScene({
  state,
  onToggle,
}: {
  state: AiAvatarState;
  onToggle: () => void;
}) {
  const bodyGroupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // 0 = fully dormant pose, 1 = fully active pose. Eased toward target each frame.
  const poseRef = useRef(state === "active" ? 1 : 0);
  const faceRevealRef = useRef(state === "active" ? 1 : 0);
  const secondAppendageRef = useRef(state === "active" ? 1 : 0);
  const firstAppendageRef = useRef(1);

  useFrame((three, delta) => {
    const target = state === "active" ? 1 : 0;
    const ease = 1 - Math.pow(0.001, delta); // frame-rate-independent smoothing
    poseRef.current += (target - poseRef.current) * ease;
    faceRevealRef.current += (target - faceRevealRef.current) * ease;
    secondAppendageRef.current += (target - secondAppendageRef.current) * ease;
    firstAppendageRef.current = 1; // the primary appendage is always visible

    const pose = poseRef.current;
    const t = three.clock.getElapsedTime();

    if (bodyGroupRef.current) {
      const targetRotY = THREE.MathUtils.lerp(
        ROTATION_DORMANT.y,
        ROTATION_ACTIVE.y,
        pose,
      );
      const targetRotX = THREE.MathUtils.lerp(
        ROTATION_DORMANT.x,
        ROTATION_ACTIVE.x,
        pose,
      );

      // The dormant pose is fully static (no wobble) per the reference
      // sketch's fixed cube positions — motion only appears once the avatar
      // has actually started leaning active, as a gentle hover bob scaled by
      // pose (0 at rest, full amplitude once fully active).
      const hoverBob = Math.sin(t * 1.2) * 0.05 * pose;

      bodyGroupRef.current.rotation.y = lerpAngle(
        bodyGroupRef.current.rotation.y,
        targetRotY,
        ease,
      );
      bodyGroupRef.current.rotation.x = lerpAngle(
        bodyGroupRef.current.rotation.x,
        targetRotX,
        ease,
      );
      bodyGroupRef.current.position.y = hoverBob;
    }
  });

  return createElement(
    "group",
    // Fragment substitute: a plain array of top-level scene children.
    null,
    createElement(
      group,
      { ref: bodyGroupRef, key: "body" },
      createElement(
        GradientRoundedBox,
        {
          args: [BODY_SIZE, BODY_SIZE, BODY_SIZE],
          radius: BODY_RADIUS,
          // Body faces are pure teal now — a gentle lighter-to-base teal
          // gradient (ai300 crown → ai400 base) for top-lit dimension, with
          // NO blue on the faces. The blue accent lives entirely on the
          // fresnel rim glow (see RimGlow below), so it rides the silhouette
          // edges alongside the highlight rather than flooding the upper
          // faces the way a blue crown gradient did (the "too much blue"
          // ice-cube reading).
          topColor: TOKEN_COLORS.ai300,
          bottomColor: TOKEN_COLORS.ai400,
          // Click-to-activate: the body cube is the clickable region, not the
          // full canvas, so clicking empty canvas space around the mascot is a
          // no-op. R3F's native pointer events work the same via createElement
          // as they would via JSX.
          onClick: (event: ThreeEvent<MouseEvent>) => {
            event.stopPropagation();
            onToggle();
          },
          onPointerOver: (event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          },
          onPointerOut: () => {
            setHovered(false);
            document.body.style.cursor = "auto";
          },
        },
        // Soft satin-plastic/clay material, retuned for a crisper single
        // highlight: a smoother clearcoat (lower clearcoatRoughness) plus a
        // slightly lower base roughness reads as one well-defined rounded
        // specular hotspot under the now-dominant key light, instead of the
        // previous rougher finish that spread the highlight thin and let it
        // wash out toward grey. envMapIntensity picks up the Environment
        // preset below for subtle ambient reflection, which keeps the form
        // from reading as flat/plastic-bad the way a zero-reflection
        // physical material does. A light hover lift on roughness/clearcoat
        // gives the click affordance a subtle "ready to press" glint.
        // vertexColors picks up the gradient painted onto the geometry
        // above; `color` stays white so it multiplies the vertex colors
        // unmodified rather than tinting them.
        createElement("meshPhysicalMaterial", {
          color: "#ffffff",
          vertexColors: true,
          roughness: hovered ? 0.24 : 0.28,
          metalness: 0,
          clearcoat: 0.8,
          clearcoatRoughness: hovered ? 0.1 : 0.14,
          envMapIntensity: 0.9,
        }),
      ),
      createElement(RimGlow, {
        geometryArgs: [BODY_SIZE, BODY_SIZE, BODY_SIZE],
        radius: BODY_RADIUS,
        color: TOKEN_COLORS.ai100,
        intensity: 1.9,
      }),
      createElement(Face, { revealRef: faceRevealRef }),
    ),
    // Right appendage: always visible in both states — this is the single
    // cube visible in the dormant pose per the reference sketch, sitting
    // against the corner-leading body's lower-right edge.
    createElement(Appendage, {
      key: "appendage-right",
      basePosition: [1.05, -0.5, 0.3],
      visibilityRef: firstAppendageRef,
      poseRef,
    }),
    // Left appendage: tucked/hidden in dormant, revealed in active.
    createElement(Appendage, {
      key: "appendage-left",
      basePosition: [-1.05, -0.5, 0.3],
      visibilityRef: secondAppendageRef,
      poseRef,
    }),
  );
}

/**
 * Minimal token-based canvas fallback shown while the Three.js scene mounts.
 * No existing loading/spinner primitive in the component library targets a
 * canvas surface (Button's spinner is inline-control-scoped, app/loading.tsx
 * is a route-level skeleton) so this is a small bespoke fallback rather than
 * a reused component.
 */
function CanvasFallback() {
  return (
    <div
      className="size-full animate-pulse rounded-lg bg-ai-surface"
      aria-hidden
    />
  );
}

/**
 * Anthropomorphic cube avatar representing the AI agent's presence. Renders a
 * rounded, soft-shaded 3D cube with an expressive flat front-facing decal and
 * two floating appendage cubes, using only the reserved `ai-*` token ramp.
 *
 * - `dormant` — corner-on, face hidden, one appendage visible, subtle idle wobble.
 * - `active` — front-facing, face revealed, both appendages visible, gentle hover.
 *
 * Transitions between states animate continuously (rotation + reveal) rather
 * than cutting, driven every frame from the `state` prop.
 *
 * **Controlled vs uncontrolled:** pass `state` to drive the pose from a
 * parent (controlled mode — clicking the cube fires no internal toggle, the
 * `state` prop always wins). Omit `state` and the avatar manages its own
 * dormant/active pose internally (uncontrolled mode, the default), toggling
 * on a click of the body cube — this is what makes clicking the avatar on
 * the homepage "just work" with no plumbing.
 *
 * The canvas itself renders with a transparent background (`gl={{ alpha: true }}`,
 * no scene background color) so the avatar can be overlaid directly on top of
 * arbitrary app UI. Only the mount-time fallback keeps an opaque surface token,
 * since it has no 3D content to show through.
 *
 * **WebGL context-loss recovery:** the underlying GPU context can be lost at
 * any time (GPU process reset, driver crash, too many concurrent WebGL
 * contexts, tab backgrounding, or a dev-mode Fast Refresh remount doubled up
 * by React Strict Mode) and, unhandled, leaves the canvas permanently showing
 * the browser's native grey placeholder. This component listens for
 * `webglcontextlost`/`webglcontextrestored` on the canvas DOM element (via
 * `Canvas`'s `onCreated`), prevents the loss event's default per the WebGL
 * spec so restoration can occur at all, and forces a full `<Canvas>` remount
 * on restore (via a bumped `key`) since GPU resources from the old context
 * are unusable. `CanvasFallback` is reused as the brief overlay shown between
 * loss and the remount completing.
 */
export function AiAvatar({
  state: controlledState,
  onClick,
  className,
  size = 128,
}: AiAvatarProps) {
  const [uncontrolledState, setUncontrolledState] =
    useState<AiAvatarState>("dormant");
  const isControlled = controlledState !== undefined;
  const state = isControlled ? controlledState : uncontrolledState;

  function handleToggle() {
    // Always surface the click to the parent first, so a controlled parent
    // (e.g. the App Shell opening the Copilot panel) gets the signal even
    // though it owns the pose via `state`.
    onClick?.();
    // Controlled mode takes precedence for the pose: a parent driving `state`
    // directly owns it, so we don't also flip the internal uncontrolled state.
    if (isControlled) return;
    setUncontrolledState((prev) => (prev === "dormant" ? "active" : "dormant"));
  }

  // WebGL context-loss recovery for a PERSISTENT, layout-level canvas.
  //
  // This avatar is mounted once in the root-layout AppShell and never unmounts
  // across route changes — the single-persistent-canvas pattern the R3F
  // maintainers recommend (mounting/unmounting a canvas per route churns the
  // browser's fixed ~10-20 WebGL-context pool until it refuses new ones and the
  // context is lost). The flip side of a persistent canvas is that when its
  // context IS lost (GPU process reset, driver crash, tab backgrounding, or a
  // dev Fast Refresh), nothing above it ever remounts to hand it a fresh one —
  // so it must recover itself.
  //
  // Recovery: on `webglcontextlost`, call `event.preventDefault()` (a hard
  // WebGL-spec requirement — without it the loss is permanent) and then force a
  // full React REMOUNT of the `<Canvas>` subtree by bumping `canvasKey`. We do
  // NOT restore the context in place (`gl.forceContextRestore()` / waiting on
  // `webglcontextrestored`): in-place restore revives the context on the same
  // canvas, but this scene's geometries, materials, and shaders are all built in
  // `useMemo` and were uploaded to the dead context — R3F never re-uploads them,
  // so the canvas comes back blank ("context restored but avatar gone"). Only a
  // remount re-runs those `useMemo`s and rebuilds every GPU resource under the
  // new context, which is the reliable recovery for a custom scene like this.
  const [canvasKey, setCanvasKey] = useState<number>(0);
  const [isRecovering, setIsRecovering] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Attach the context-loss listener to whatever <canvas> is live in the DOM
  // right now, resolved from `wrapperRef` rather than from R3F's `onCreated`.
  // This matters: React 19 Strict Mode (and dev Fast Refresh) mount → unmount →
  // remount the tree, and R3F does NOT re-fire `onCreated` on that second mount
  // for an unchanged `key` — so listeners attached inside `onCreated` get torn
  // down by the Strict Mode unmount and are never re-attached, leaving the
  // settled canvas with no handler at all (the original crash). Because this is
  // a real React effect it re-runs on every mount, always binding the CURRENT
  // canvas and tearing its listener back down symmetrically. Depends on
  // `canvasKey` so a recovery remount re-binds the fresh canvas.
  useEffect(() => {
    const canvasEl = wrapperRef.current?.querySelector("canvas");
    if (!canvasEl) return;

    function handleContextLost(event: Event) {
      // Required by the WebGL spec: without this the loss is permanent and the
      // context can never come back on this element.
      event.preventDefault();
      setIsRecovering(true);
      // Recover by fully REMOUNTING the <Canvas> (bump `canvasKey`) rather than
      // restoring the context in place. In-place restore
      // (`gl.forceContextRestore()` + waiting on `webglcontextrestored`) brings
      // the GPU context back on the SAME canvas, but every geometry, material,
      // and shader in this scene is created in a `useMemo` and was uploaded to
      // the now-dead context — R3F does not re-upload them on restore, so the
      // canvas comes back blank (the "context restored but avatar gone" symptom).
      // A remount re-runs those `useMemo`s against a brand-new context, which is
      // the only reliable rebuild. Deferred a tick so the browser finishes
      // tearing the old context down before the fresh Canvas mounts.
      window.setTimeout(() => {
        setCanvasKey((key) => key + 1);
        setIsRecovering(false);
      }, 1);
    }

    canvasEl.addEventListener("webglcontextlost", handleContextLost);

    return () => {
      canvasEl.removeEventListener("webglcontextlost", handleContextLost);
    };
  }, [canvasKey]);

  // Last-resort self-heal for the persistent mount: if a loss ever leaves the
  // context dead with neither `forceContextRestore()` nor the browser's own
  // `webglcontextrestored` recovering it (most likely after the tab was
  // backgrounded), force a full remount when the tab returns to the foreground.
  // Cheap — only runs on visibility change — and a no-op when the context is
  // healthy.
  useEffect(() => {
    function handleVisible() {
      if (document.visibilityState !== "visible") return;
      const canvasEl = wrapperRef.current?.querySelector("canvas");
      if (!canvasEl) return;
      const gl = canvasEl.getContext("webgl2") ?? canvasEl.getContext("webgl");
      if (gl && gl.isContextLost()) {
        setCanvasKey((key) => key + 1);
        setIsRecovering(false);
      }
    }
    document.addEventListener("visibilitychange", handleVisible);
    return () =>
      document.removeEventListener("visibilitychange", handleVisible);
  }, []);

  return (
    // Inline width/height (not a Tailwind size/aspect utility) so the canvas
    // is always a true square driven by one number, `size`, immune to a
    // caller's className overriding only one axis (the previous
    // `aspect-square` + `w-full`/`max-w-*` combination could resolve to a
    // non-square box depending on the parent's available width). `relative`
    // is a default positioning class (not inline style, so a caller's own
    // position utility in `className` — e.g. `fixed`/`absolute` — overrides
    // it via cn()'s tailwind-merge conflict resolution) establishing a
    // positioning context for this wrapper: without one, R3F's internal
    // ResizeObserver can read a stale/default size on first paint when the
    // ancestor chain includes a `position: fixed` element, producing a
    // non-square canvas.
    <div
      ref={wrapperRef}
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {isRecovering && (
        // Absolutely positioned to overlay the still-mounted (but
        // context-lost) Canvas beneath it, rather than stack in normal flow
        // above/before it — the Canvas only actually unmounts once
        // `webglcontextrestored` bumps `canvasKey` below, so this fallback
        // needs to mask the native grey "context lost" placeholder in the
        // meantime, not just precede it in the DOM.
        <div className="absolute inset-0 z-10">
          <CanvasFallback />
        </div>
      )}
      <Suspense fallback={<CanvasFallback />}>
        <Canvas
          key={canvasKey}
          dpr={[1, 2]}
          // `powerPreference: "high-performance"` asks the browser for the
          // discrete GPU where one exists, which is less prone to eviction than
          // a shared integrated context; `failIfMajorPerformanceCaveat: false`
          // keeps a software/limited context rather than refusing one outright,
          // so the avatar still renders (and can recover) on constrained
          // machines instead of never getting a context at all.
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance" as const,
            failIfMajorPerformanceCaveat: false,
          }}
        >
          {/* No <color attach="background"> — the scene stays transparent so the
              app UI beneath shows through around the avatar. fov: 40 is the
              tightest that avoids clipping the body+appendages+rim-glow
              bounding volume through the full hover-bob/rotation range. */}
          {createElement(PerspectiveCamera, {
            makeDefault: true,
            position: [0, 0, 5],
            fov: 40,
          })}
          {/* Subtle neutral environment for soft ambient reflection on the
              clearcoat (picked up via envMapIntensity on the materials above).
              A meshPhysicalMaterial with zero environment reads flat/plastic.
              "apartment" (previously used here) is a warm indoor HDRI and was
              the source of a visible orange tint bleeding onto the cube's top
              facet — "studio" is a neutral grey-lit preset from drei with no
              color cast, so it grounds the specular response without tinting
              the body's own gradient. Rendered background-invisible so it
              never overrides the transparent canvas. */}
          {createElement(Environment, { preset: "studio", background: false })}
          {/* Ambient fill lowered and neutralized: the previous 0.55 intensity
              warm-tinted ambient was washing out the body's saturated fill
              color and diluting the key light's specular contrast into a
              muddy, multi-source highlight. A dim, more neutral ambient still
              keeps shadowed facets off pure black without competing with the
              key light for the specular hotspot. */}
          {createElement(ambientLight, {
            intensity: 0.22,
            color: TOKEN_COLORS.ai50,
          })}
          {/* Key light: now the single dominant light source (raised intensity,
              narrower effective contribution relative to fill/rim below) so
              the clearcoat forms one crisp, well-defined rounded highlight
              instead of several soft ones averaging into mush. Physically-
              neutral white key light; not a semantic surface/text color, no
              token in the ai-* or neutral catalog represents pure white light. */}
          {createElement(directionalLight, {
            position: [2.5, 3.5, 4],
            intensity: 1.35,
            color: "#ffffff",
          })}
          {/* Fill light intensity reduced further below the key light so it
              lifts the shadow side without casting its own competing
              highlight. Same physically-neutral white rationale as the key
              light above. */}
          {createElement(directionalLight, {
            position: [-2, 1, 3],
            intensity: 0.15,
            color: "#ffffff",
          })}
          {/* Soft under-fill from below-behind, tinted with the reserved ai-*
              ramp, replacing the previous darker rim/point-light pair. Per
              the Copilot-style reference the lower/trailing facets should
              stay bright and glow-lit, not fall into a dark saturated
              shadow — this is a gentle lift, not an accent. */}
          {createElement(directionalLight, {
            position: [-1.5, -2.5, -2],
            intensity: 0.4,
            color: TOKEN_COLORS.ai100,
          })}
          {/* The halo is no longer a sprite behind the body — it's now the
              per-mesh RimGlow fresnel shell rendered alongside the body and
              each appendage (see AvatarScene/Appendage), so the glow hugs
              the actual rounded-edge silhouette of each cube rather than
              sitting behind them as an independent circular shape. */}
          {createElement(AvatarScene, { state, onToggle: handleToggle })}
        </Canvas>
      </Suspense>
    </div>
  );
}
