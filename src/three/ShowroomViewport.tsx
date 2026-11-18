import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import {
  ChevronDown,
  ChevronUp,
  DoorOpen,
  Eye,
  Layers,
  Loader2,
  RotateCw,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { FurnitureDemoItem } from "../data/furnitureCatalog";

export type CameraPreset = "hero" | "front" | "side" | "underside";

interface AnimatedDoor {
  object: THREE.Object3D;
  restRotY: number;
  openAngle: number;
}

interface AnimatedDrawer {
  object: THREE.Object3D;
  restZ: number;
  pullDistance: number;
  staggerIndex: number;
}

interface AnimatedCushion {
  object: THREE.Object3D;
  restPos: THREE.Vector3;
  liftOffset: THREE.Vector3;
}

interface VariantBinding {
  mesh: THREE.Mesh;
  defaultMaterial: THREE.Material | THREE.Material[];
  variantMaterials: Map<string, THREE.Material>;
}

interface LoadedModelHandles {
  wrapper: THREE.Group;
  doors: AnimatedDoor[];
  drawers: AnimatedDrawer[];
  cushions: AnimatedCushion[];
  interactiveObjects: THREE.Object3D[];
  variants: string[];
  variantBindings: VariantBinding[];
  dispose: () => void;
}

export interface ShowroomViewportProps {
  product: FurnitureDemoItem;
  doorsOpen: boolean;
  drawersOpen: boolean;
  cushionsRemoved: boolean;
  undersideMode: boolean;
  autoRotate: boolean;
  selectedVariant: string | null;
  onVariantsDiscovered: (variants: string[]) => void;
  onSelectVariant: (variant: string) => void;
  onToggleDoors: () => void;
  onToggleDrawers: () => void;
  onToggleCushions: () => void;
  onToggleUnderside: () => void;
  onToggleAutoRotate: () => void;
  onResetAll: () => void;
}

const _camPosVec = new THREE.Vector3();

function detectSoftwareGl(): boolean {
  try {
    const probeCanvas = document.createElement("canvas");
    const gl =
      probeCanvas.getContext("webgl2") || probeCanvas.getContext("webgl");
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? "");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    12,
    size / 2,
    size / 2,
    size / 2
  );
  grad.addColorStop(0, "rgba(48, 39, 42, 0.32)");
  grad.addColorStop(0.55, "rgba(48, 39, 42, 0.11)");
  grad.addColorStop(1, "rgba(48, 39, 42, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function disposeObject3D(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry?.dispose();
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const mat of mats) {
        if (!mat) continue;
        for (const key of Object.keys(mat)) {
          const val = (mat as unknown as Record<string, unknown>)[key];
          if (val && typeof val === "object" && (val as THREE.Texture).isTexture) {
            (val as THREE.Texture).dispose();
          }
        }
        mat.dispose();
      }
    }
  });
}

async function extractModelHandles(
  gltf: GLTF,
  product: FurnitureDemoItem
): Promise<LoadedModelHandles> {
  const wrapper = new THREE.Group();
  const sceneRoot = gltf.scene;

  // Normalize scale so largest dimension is ~2.05m and pivot is bottom-center at y=0
  sceneRoot.updateMatrixWorld(true);
  const rawBox = new THREE.Box3().setFromObject(sceneRoot);
  const rawSize = rawBox.getSize(new THREE.Vector3());
  const rawCenter = rawBox.getCenter(new THREE.Vector3());
  const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z, 0.01);
  const scaleFactor = 2.05 / maxDim;

  sceneRoot.scale.setScalar(scaleFactor);
  sceneRoot.position.set(
    -rawCenter.x * scaleFactor,
    -rawBox.min.y * scaleFactor,
    -rawCenter.z * scaleFactor
  );
  wrapper.add(sceneRoot);

  // Enable shadows & calibrate environment reflection on genuine PBR materials
  sceneRoot.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      mats.forEach((m) => {
        if (m && "envMapIntensity" in m) {
          (m as THREE.MeshStandardMaterial).envMapIntensity = 0.95;
        }
      });
    }
    // Remove embedded scene directional/point lights inside Khronos sample GLBs so studio lighting stays consistent
    if ((child as THREE.Light).isLight) {
      child.visible = false;
    }
  });

  const doors: AnimatedDoor[] = [];
  const drawers: AnimatedDrawer[] = [];
  const cushions: AnimatedCushion[] = [];
  const interactiveObjects: THREE.Object3D[] = [];

  const markInteractive = (
    obj: THREE.Object3D,
    type: "door" | "drawer" | "cushion"
  ) => {
    interactiveObjects.push(obj);
    obj.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        c.userData.interactiveType = type;
        c.layers.enable(1);
      }
    });
  };

  // Detect authentic articulated sub-meshes inside loaded GLB/GLTF
  sceneRoot.traverse((node) => {
    const name = node.name || "";

    // Hinged doors (GothicCabinet_01_door1..4, WoodenTable_03_door, chinese_cabinet_door_01/02)
    if (
      product.supportsDoors &&
      (name.includes("_door") || name.includes("door_")) &&
      !name.includes("GothicCommode_01_door")
    ) {
      const box = new THREE.Box3().setFromObject(node);
      const center = box.getCenter(new THREE.Vector3());
      // Left-side doors swing negative Y, right-side doors swing positive Y
      const isLeft = center.x < 0;
      doors.push({
        object: node,
        restRotY: node.rotation.y,
        openAngle: isLeft ? -Math.PI * 0.48 : Math.PI * 0.48,
      });
      markInteractive(node, "door");
    }

    // Sliding drawers (WoodenTable_03_drawer01..04, chinese_cabinet_drawer_01..02, GothicCommode_01_door01..03)
    if (
      product.supportsDrawers &&
      (name.includes("drawer") || name.includes("GothicCommode_01_door"))
    ) {
      drawers.push({
        object: node,
        restZ: node.position.z,
        pullDistance: 0.28,
        staggerIndex: drawers.length % 3,
      });
      markInteractive(node, "drawer");
    }

    // Separate cushion / throw pillow meshes (SheenWoodLeatherSofa.glb: Paisley, Stripes, Brown)
    if (
      product.supportsCushionRemoval &&
      (name === "Paisley" || name === "Stripes" || name === "Brown")
    ) {
      const idx = cushions.length;
      const offsetX = name === "Paisley" ? -0.14 : name === "Stripes" ? 0.14 : 0;
      const offsetY = name === "Brown" ? 0.24 : 0.36;
      const offsetZ = name === "Brown" ? 0.22 : 0.12;
      cushions.push({
        object: node,
        restPos: node.position.clone(),
        liftOffset: new THREE.Vector3(offsetX, offsetY + idx * 0.02, offsetZ),
      });
      markInteractive(node, "cushion");
    }
  });

  // Extract genuine KHR_materials_variants from GLB/GLTF parser if present
  const variants: string[] = [];
  const variantBindings: VariantBinding[] = [];

  try {
    const parser = gltf.parser;
    const json = parser?.json as {
      extensions?: {
        KHR_materials_variants?: { variants?: { name: string }[] };
      };
      meshes?: {
        primitives?: {
          extensions?: {
            KHR_materials_variants?: {
              mappings?: { material: number; variants: number[] }[];
            };
          };
        }[];
      }[];
    };

    const variantDefs =
      json?.extensions?.KHR_materials_variants?.variants ?? [];
    if (variantDefs.length > 0 && parser.associations) {
      variantDefs.forEach((v) => variants.push(v.name));

      const meshesToCheck: THREE.Mesh[] = [];
      sceneRoot.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          meshesToCheck.push(obj as THREE.Mesh);
        }
      });

      for (const mesh of meshesToCheck) {
        const assoc = parser.associations.get(mesh) as
          | { meshes?: number; primitives?: number }
          | undefined;
        if (assoc?.meshes === undefined || assoc?.primitives === undefined) {
          continue;
        }
        const prim =
          json.meshes?.[assoc.meshes]?.primitives?.[assoc.primitives];
        const mappings = prim?.extensions?.KHR_materials_variants?.mappings;
        if (!mappings || mappings.length === 0) continue;

        const variantMaterials = new Map<string, THREE.Material>();
        for (const mapping of mappings) {
          const mat = (await parser.getDependency(
            "material",
            mapping.material
          )) as THREE.Material;
          if ("envMapIntensity" in mat) {
            (mat as THREE.MeshStandardMaterial).envMapIntensity = 0.95;
          }
          for (const vIdx of mapping.variants) {
            const vName = variantDefs[vIdx]?.name;
            if (vName) {
              variantMaterials.set(vName, mat);
            }
          }
        }
        variantBindings.push({
          mesh,
          defaultMaterial: mesh.material,
          variantMaterials,
        });
      }
    }
  } catch {
    // Variant extension optional
  }

  return {
    wrapper,
    doors,
    drawers,
    cushions,
    interactiveObjects,
    variants,
    variantBindings,
    dispose: () => disposeObject3D(wrapper),
  };
}

export const ShowroomViewport: React.FC<ShowroomViewportProps> = ({
  product,
  doorsOpen,
  drawersOpen,
  cushionsRemoved,
  undersideMode,
  autoRotate,
  selectedVariant,
  onVariantsDiscovered,
  onSelectVariant,
  onToggleDoors,
  onToggleDrawers,
  onToggleCushions,
  onToggleUnderside,
  onToggleAutoRotate,
  onResetAll,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [loadingState, setLoadingState] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [activeCameraPreset, setActiveCameraPreset] =
    useState<CameraPreset>("hero");
  const [photoFallbackErr, setPhotoFallbackErr] = useState(false);

  const stateRef = useRef({
    doorsOpen,
    drawersOpen,
    cushionsRemoved,
    undersideMode,
    autoRotate,
  });
  stateRef.current = {
    doorsOpen,
    drawersOpen,
    cushionsRemoved,
    undersideMode,
    autoRotate,
  };

  const callbacksRef = useRef({
    onToggleDoors,
    onToggleDrawers,
    onToggleCushions,
    onVariantsDiscovered,
  });
  callbacksRef.current = {
    onToggleDoors,
    onToggleDrawers,
    onToggleCushions,
    onVariantsDiscovered,
  };

  const sceneRefs = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    controls: OrbitControls | null;
    handles: LoadedModelHandles | null;
    requestRender: () => void;
    applyCameraPreset: (preset: CameraPreset) => void;
    zoomBy: (factor: number) => void;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    handles: null,
    requestRender: () => {},
    applyCameraPreset: () => {},
    zoomBy: () => {},
  });

  useEffect(() => {
    setPhotoFallbackErr(false);
  }, [product.id]);

  // Keyboard 'H' shortcut for Cinema / Zen Mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === "h" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Initialize Three.js Studio Scene ONCE
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: "high-performance",
      alpha: false,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    container.appendChild(renderer.domElement);

    const width = container.clientWidth || 960;
    const height = container.clientHeight || 600;
    renderer.setSize(width, height, false);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#FBF1F4");
    scene.fog = new THREE.Fog("#FBF1F4", 9, 24);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.08, 45);
    camera.position.set(2.3, 1.35, 2.5);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const hemiLight = new THREE.HemisphereLight(0xfff9f5, 0xe8d2da, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e8, 2.15);
    keyLight.position.set(4.2, 6.4, 4.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 18;
    const d = 2.4;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf8e4ea, 0.95);
    rimLight.position.set(-4.0, 3.4, -3.8);
    scene.add(rimLight);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softbox = new THREE.RectAreaLight(0xfff8f2, 2.2, 3.2, 2.4);
      softbox.position.set(-3.2, 2.3, 1.8);
      softbox.lookAt(0, 0.55, 0);
      scene.add(softbox);
    }

    const floorGeo = new THREE.CircleGeometry(7.5, 64);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xfbf3ef,
      roughness: 0.88,
      metalness: 0.02,
      transparent: true,
      opacity: 1,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.004;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const ringGeo = new THREE.RingGeometry(1.65, 1.67, 96);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      transparent: true,
      opacity: 0.35,
    });
    const plinthRing = new THREE.Mesh(ringGeo, ringMat);
    plinthRing.position.y = -0.002;
    scene.add(plinthRing);

    const shadowTex = createContactShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(3.0, 2.4);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.62,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.position.y = 0.001;
    scene.add(shadowPlane);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 1.1;
    controls.maxDistance = 6.8;
    controls.minPolarAngle = 0.1;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.target.set(0, 0.55, 0);
    controls.update();

    const animState = {
      doorT: 0,
      drawerT: 0,
      cushionT: 0,
      undersideT: 0,
      camTransitionActive: false,
      desiredCamPos: new THREE.Vector3().copy(camera.position),
      desiredTarget: new THREE.Vector3().copy(controls.target),
      lastTime: performance.now(),
    };

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || !gl.fenceSync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const advanceKinematics = (dt: number): boolean => {
      const s = stateRef.current;
      const handles = sceneRefs.current.handles;
      const lambda = 7.5;
      let moving = false;

      const stepVal = (curr: number, target: number) => {
        if (Math.abs(curr - target) > 0.0015) {
          moving = true;
          return THREE.MathUtils.damp(curr, target, lambda, dt);
        }
        return target;
      };

      animState.doorT = stepVal(animState.doorT, s.doorsOpen ? 1 : 0);
      animState.drawerT = stepVal(animState.drawerT, s.drawersOpen ? 1 : 0);
      animState.cushionT = stepVal(
        animState.cushionT,
        s.cushionsRemoved ? 1 : 0
      );
      animState.undersideT = stepVal(
        animState.undersideT,
        s.undersideMode ? 1 : 0
      );

      if (handles) {
        handles.wrapper.position.y = animState.undersideT * 0.45;
        floorMat.opacity = 1 - animState.undersideT * 0.72;
        plinthRing.visible = animState.undersideT < 0.7;
        shadowMat.opacity = 0.62 * (1 - animState.undersideT * 0.8);

        for (const door of handles.doors) {
          door.object.rotation.y = door.restRotY + door.openAngle * animState.doorT;
        }

        for (const drawer of handles.drawers) {
          const staggerDelay = drawer.staggerIndex * 0.14;
          const localT = THREE.MathUtils.clamp(
            (animState.drawerT - staggerDelay) /
              Math.max(0.25, 1 - staggerDelay),
            0,
            1
          );
          drawer.object.position.z =
            drawer.restZ + localT * drawer.pullDistance;
        }

        for (const cushion of handles.cushions) {
          cushion.object.position.set(
            cushion.restPos.x + cushion.liftOffset.x * animState.cushionT,
            cushion.restPos.y + cushion.liftOffset.y * animState.cushionT,
            cushion.restPos.z + cushion.liftOffset.z * animState.cushionT
          );
        }
      }

      if (animState.camTransitionActive) {
        const distPos = camera.position.distanceTo(animState.desiredCamPos);
        const distTgt = controls.target.distanceTo(animState.desiredTarget);
        if (distPos > 0.008 || distTgt > 0.008) {
          const alpha = 1 - Math.exp(-6.5 * dt);
          camera.position.lerp(animState.desiredCamPos, alpha);
          controls.target.lerp(animState.desiredTarget, alpha);
          moving = true;
        } else {
          camera.position.copy(animState.desiredCamPos);
          controls.target.copy(animState.desiredTarget);
          animState.camTransitionActive = false;
        }
      }

      controls.maxPolarAngle = s.undersideMode ? Math.PI * 0.92 : Math.PI * 0.49;
      controls.autoRotate = !isSoftwareGl && s.autoRotate && !s.undersideMode;
      controls.autoRotateSpeed = 1.0;
      if (controls.autoRotate) moving = true;

      return moving;
    };

    const requestRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        const now = performance.now();
        const dt = Math.min(
          0.05,
          Math.max(0.001, (now - animState.lastTime) / 1000)
        );
        animState.lastTime = now;

        const stillAnimating = advanceKinematics(dt);
        const dampingActive = controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (disposed) return;
          if (
            renderDirty ||
            stillAnimating ||
            (dampingActive && !isSoftwareGl)
          ) {
            requestRender();
          }
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    };

    const applyCameraPreset = (preset: CameraPreset) => {
      setActiveCameraPreset(preset);
      const handles = sceneRefs.current.handles;
      let centerY = 0.55;
      if (handles) {
        const box = new THREE.Box3().setFromObject(handles.wrapper);
        centerY = (box.min.y + box.max.y) * 0.48;
      }

      if (preset === "hero") {
        animState.desiredCamPos.set(2.15, centerY + 0.8, 2.35);
        animState.desiredTarget.set(0, centerY, 0);
      } else if (preset === "front") {
        animState.desiredCamPos.set(0, centerY + 0.4, 2.95);
        animState.desiredTarget.set(0, centerY, 0);
      } else if (preset === "side") {
        animState.desiredCamPos.set(2.95, centerY + 0.45, 0.12);
        animState.desiredTarget.set(0, centerY, 0);
      } else if (preset === "underside") {
        animState.desiredCamPos.set(1.45, 0.08, 2.25);
        animState.desiredTarget.set(0, centerY + 0.4, 0);
      }
      animState.camTransitionActive = true;
      requestRender();
    };

    const zoomBy = (factor: number) => {
      animState.camTransitionActive = false;
      _camPosVec.copy(camera.position).sub(controls.target);
      const nextLen = THREE.MathUtils.clamp(
        _camPosVec.length() * factor,
        controls.minDistance,
        controls.maxDistance
      );
      _camPosVec.setLength(nextLen);
      camera.position.copy(controls.target).add(_camPosVec);
      controls.update();
      requestRender();
    };

    const onControlStart = () => {
      animState.camTransitionActive = false;
    };
    const onControlChange = () => {
      requestRender();
    };
    controls.addEventListener("start", onControlStart);
    controls.addEventListener("change", onControlChange);

    // Raycast Click & Hover on interactive GLB/GLTF sub-meshes (Layer 1)
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };
    let lastHoverTime = 0;

    const updatePointer = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (ev: PointerEvent) => {
      pointerDownPos = { x: ev.clientX, y: ev.clientY };
    };

    const onPointerUp = (ev: PointerEvent) => {
      const dx = ev.clientX - pointerDownPos.x;
      const dy = ev.clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) > 6) return;
      const handles = sceneRefs.current.handles;
      if (!handles || handles.interactiveObjects.length === 0) return;

      updatePointer(ev);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(handles.interactiveObjects, true);
      if (hits.length > 0) {
        const type = hits[0].object.userData.interactiveType as
          | "door"
          | "drawer"
          | "cushion"
          | undefined;
        if (type === "door") callbacksRef.current.onToggleDoors();
        else if (type === "drawer") callbacksRef.current.onToggleDrawers();
        else if (type === "cushion") callbacksRef.current.onToggleCushions();
      }
    };

    const onPointerMove = (ev: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverTime < 60) return;
      lastHoverTime = now;
      const handles = sceneRefs.current.handles;
      if (!handles || handles.interactiveObjects.length === 0) {
        setHoveredPart(null);
        return;
      }
      updatePointer(ev);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(handles.interactiveObjects, true);
      if (hits.length > 0) {
        const type = hits[0].object.userData.interactiveType as string | undefined;
        if (type === "door") setHoveredPart("Click door to open / close");
        else if (type === "drawer") setHoveredPart("Click drawer to open / close");
        else if (type === "cushion")
          setHoveredPart("Click cushions to remove / restore");
        else setHoveredPart(null);
        renderer.domElement.style.cursor = type ? "pointer" : "grab";
      } else {
        setHoveredPart(null);
        renderer.domElement.style.cursor = "grab";
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointermove", onPointerMove);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
      requestRender();
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    renderer.domElement.addEventListener(
      "webglcontextrestored",
      onContextRestored
    );

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(300, Math.floor(entry.contentRect.width));
        const h = Math.max(300, Math.floor(entry.contentRect.height));
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        requestRender();
      }
    });
    resizeObserver.observe(container);

    sceneRefs.current = {
      renderer,
      scene,
      camera,
      controls,
      handles: null,
      requestRender,
      applyCameraPreset,
      zoomBy,
    };

    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      controls.removeEventListener("start", onControlStart);
      controls.removeEventListener("change", onControlChange);
      controls.dispose();

      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener(
        "webglcontextrestored",
        onContextRestored
      );

      sceneRefs.current.handles?.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTex.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Load genuine GLB / GLTF whenever product changes
  useEffect(() => {
    const { scene, handles, requestRender, applyCameraPreset } =
      sceneRefs.current;
    if (!scene) return;

    if (handles) {
      scene.remove(handles.wrapper);
      handles.dispose();
      sceneRefs.current.handles = null;
    }
    callbacksRef.current.onVariantsDiscovered([]);

    if (!product.modelUrl) {
      setLoadingState({ loading: false, error: null });
      requestRender();
      return;
    }

    let cancelled = false;
    setLoadingState({ loading: true, error: null });

    const loader = new GLTFLoader();
    loader.load(
      product.modelUrl,
      async (gltf) => {
        if (cancelled) {
          disposeObject3D(gltf.scene);
          return;
        }
        try {
          const nextHandles = await extractModelHandles(gltf, product);
          if (cancelled) {
            nextHandles.dispose();
            return;
          }
          scene.add(nextHandles.wrapper);
          sceneRefs.current.handles = nextHandles;
          callbacksRef.current.onVariantsDiscovered(nextHandles.variants);
          setLoadingState({ loading: false, error: null });
          applyCameraPreset("hero");
        } catch (err) {
          setLoadingState({
            loading: false,
            error:
              err instanceof Error
                ? err.message
                : "Failed to initialize 3D asset.",
          });
        }
      },
      undefined,
      (err) => {
        if (cancelled) return;
        setLoadingState({
          loading: false,
          error:
            err instanceof Error
              ? err.message
              : "Unable to load 3D GLTF/GLB asset.",
        });
      }
    );

    return () => {
      cancelled = true;
    };
  }, [product]);

  // Apply KHR_materials_variants when selectedVariant changes
  useEffect(() => {
    const { handles, requestRender } = sceneRefs.current;
    if (!handles || handles.variantBindings.length === 0) return;

    for (const binding of handles.variantBindings) {
      if (selectedVariant && binding.variantMaterials.has(selectedVariant)) {
        binding.mesh.material = binding.variantMaterials.get(selectedVariant)!;
      } else {
        binding.mesh.material = binding.defaultMaterial;
      }
    }
    requestRender();
  }, [selectedVariant]);

  // Trigger render & camera update when interactive states change
  useEffect(() => {
    if (undersideMode) {
      sceneRefs.current.applyCameraPreset("underside");
    } else if (activeCameraPreset === "underside") {
      sceneRefs.current.applyCameraPreset("hero");
    } else {
      sceneRefs.current.requestRender();
    }
  }, [doorsOpen, drawersOpen, cushionsRemoved, undersideMode, autoRotate]);

  // If no 3D model exists for this category (e.g., Recliners), render honest photography preview + notice
  if (!product.supports3D || !product.modelUrl) {
    return (
      <div className="relative w-full h-[540px] lg:h-[640px] rounded-xl overflow-hidden border gold-hairline bg-[#F8E4EA]/40 flex flex-col">
        <div className="relative flex-1 overflow-hidden">
          {!photoFallbackErr ? (
            <img
              src={product.photoUrl}
              alt={product.photoAlt}
              referrerPolicy="no-referrer"
              onError={() => setPhotoFallbackErr(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#F8E4EA] p-6 text-center">
              <p className="font-display text-2xl text-[#30272A]">
                Showroom Photograph Unavailable
              </p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-[#30272A]/85 via-[#30272A]/50 to-transparent text-[#FFF9F5]">
            <p className="text-xs uppercase tracking-[0.1em] text-[#E8CF78]">
              Interactive 3D Status
            </p>
            <p className="mt-1 font-display text-2xl font-medium">
              Interactive 3D Model Not Yet Available
            </p>
            <p className="mt-1 text-sm text-[#FFF9F5]/90 max-w-xl">
              An authentic multi-part GLB/GLTF reclining asset is not yet in our
              3D catalog for this piece. High-resolution showroom photography is
              shown instead of a simulated 3D substitute.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const variants = sceneRefs.current.handles?.variants ?? [];

  return (
    <div className="relative w-full h-[540px] lg:h-[640px] rounded-xl overflow-hidden border gold-hairline bg-[#FBF1F4] select-none">
      {/* Dedicated WebGL Mount Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Loading Indicator while GLB/GLTF streams */}
      {loadingState.loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#FFF9F5]/90 p-6 text-center">
          <Loader2 className="w-7 h-7 text-[#D4AF37] animate-spin" />
          <p className="mt-3 font-display text-2xl text-[#30272A]">
            Loading Photorealistic 3D Asset
          </p>
          <p className="mt-1 text-xs text-[#67575C]">
            {product.assetSourceNote}
          </p>
        </div>
      )}

      {/* Honest Error Fallback if GLTF fails */}
      {loadingState.error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#FFF9F5] p-6 text-center">
          <p className="font-display text-2xl text-[#30272A]">
            3D Asset Could Not Be Loaded
          </p>
          <p className="mt-2 text-sm text-[#67575C] max-w-md">
            {loadingState.error}
          </p>
        </div>
      )}

      {/* WebGL Context Lost */}
      {contextLost && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#FFF9F5] p-6 text-center">
          <p className="font-display text-2xl text-[#30272A]">
            3D Viewport Restoring
          </p>
        </div>
      )}

      {/* Top-Left Guidance */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="px-3.5 py-2 rounded-lg bg-[#FFF9F5]/95 border gold-hairline shadow-sm">
          <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-[#8A604B]">
            360° GLB / GLTF Viewer
          </p>
          <p className="text-xs text-[#30272A] mt-0.5">
            {hoveredPart ??
              "Drag to rotate 360° · Scroll to zoom · Inspect underside"}
          </p>
        </div>
      </div>

      {/* Top-Right Auto-Orbit & Reset */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleAutoRotate}
          className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            autoRotate
              ? "bg-[#30272A] text-[#FFF9F5] border-[#D4AF37]"
              : "bg-[#FFF9F5]/95 text-[#30272A] gold-hairline hover:bg-[#F8E4EA]"
          }`}
          aria-pressed={autoRotate}
        >
          <RotateCw className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>{autoRotate ? "Orbiting" : "Auto-Orbit"}</span>
        </button>

        <button
          type="button"
          onClick={onResetAll}
          className="px-3 py-2 rounded-lg text-xs font-medium bg-[#FFF9F5]/95 text-[#30272A] border gold-hairline hover:bg-[#F8E4EA] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Reset View
        </button>
      </div>

      {/* Collapsible Bottom Control Dock */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-10 transition-transform duration-300 ease-out"
        style={{
          bottom: "16px",
          width: "min(880px, 94%)",
          transform: dockCollapsed
            ? "translate(-50%, calc(100% - 34px))"
            : "translate(-50%, 0)",
        }}
      >
        <div className="flex justify-center mb-1.5">
          <button
            type="button"
            onClick={() => setDockCollapsed((v) => !v)}
            className="px-3.5 py-1 rounded-t-lg bg-[#FFF9F5] border border-b-0 gold-hairline text-[11px] font-medium text-[#30272A] flex items-center gap-1.5 shadow-sm hover:bg-[#F8E4EA] transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3 h-3 text-[#D4AF37]" />
            <span>{dockCollapsed ? "Show 3D Controls" : "Hide Controls"}</span>
            {dockCollapsed ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#8A604B]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#8A604B]" />
            )}
          </button>
        </div>

        <div className="rounded-xl bg-[#FFF9F5]/95 border gold-hairline-strong shadow-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Camera Angles & Zoom */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                { id: "hero", label: "3/4 View" },
                { id: "front", label: "Front" },
                { id: "side", label: "Profile" },
              ] as { id: CameraPreset; label: string }[]
            ).map((cam) => (
              <button
                key={cam.id}
                type="button"
                onClick={() => {
                  if (undersideMode) onToggleUnderside();
                  sceneRefs.current.applyCameraPreset(cam.id);
                }}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeCameraPreset === cam.id && !undersideMode
                    ? "bg-[#30272A] text-[#FFF9F5]"
                    : "bg-[#F8E4EA]/65 text-[#30272A] hover:bg-[#F8E4EA]"
                }`}
              >
                {cam.label}
              </button>
            ))}

            <button
              type="button"
              onClick={onToggleUnderside}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                undersideMode
                  ? "bg-[#D4AF37] text-[#241C1E] border-[#B89228]"
                  : "bg-[#FFF9F5] text-[#30272A] gold-hairline hover:bg-[#F8E4EA]"
              }`}
              aria-pressed={undersideMode}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Underside</span>
            </button>

            <div className="flex items-center border gold-hairline rounded-md overflow-hidden ml-1">
              <button
                type="button"
                onClick={() => sceneRefs.current.zoomBy(0.84)}
                className="p-1.5 bg-[#FFF9F5] hover:bg-[#F8E4EA] text-[#30272A] transition-colors cursor-pointer"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => sceneRefs.current.zoomBy(1.18)}
                className="p-1.5 bg-[#FFF9F5] hover:bg-[#F8E4EA] text-[#30272A] border-l gold-hairline transition-colors cursor-pointer"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Real Articulated Geometry & Embedded GLB Variants */}
          <div className="flex items-center gap-2 flex-wrap">
            {product.supportsDoors && (
              <button
                type="button"
                onClick={onToggleDoors}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                  doorsOpen
                    ? "bg-[#30272A] text-[#FFF9F5] border-[#D4AF37]"
                    : "bg-[#F8E4EA] text-[#30272A] gold-hairline hover:border-[#D4AF37]"
                }`}
                aria-pressed={doorsOpen}
              >
                <DoorOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{doorsOpen ? "Close Doors" : "Open Doors"}</span>
              </button>
            )}

            {product.supportsDrawers && (
              <button
                type="button"
                onClick={onToggleDrawers}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                  drawersOpen
                    ? "bg-[#30272A] text-[#FFF9F5] border-[#D4AF37]"
                    : "bg-[#F8E4EA] text-[#30272A] gold-hairline hover:border-[#D4AF37]"
                }`}
                aria-pressed={drawersOpen}
              >
                <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{drawersOpen ? "Close Drawers" : "Open Drawers"}</span>
              </button>
            )}

            {product.supportsCushionRemoval && (
              <button
                type="button"
                onClick={onToggleCushions}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                  cushionsRemoved
                    ? "bg-[#30272A] text-[#FFF9F5] border-[#D4AF37]"
                    : "bg-[#F8E4EA] text-[#30272A] gold-hairline hover:border-[#D4AF37]"
                }`}
                aria-pressed={cushionsRemoved}
              >
                <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>
                  {cushionsRemoved ? "Restore Cushions" : "Remove Cushions"}
                </span>
              </button>
            )}

            {variants.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {variants.map((vName) => {
                  const active = selectedVariant === vName;
                  return (
                    <button
                      key={vName}
                      type="button"
                      onClick={() => onSelectVariant(vName)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? "bg-[#D4AF37] text-[#241C1E] border-[#B89228]"
                          : "bg-[#FFF9F5] text-[#30272A] gold-hairline hover:bg-[#F8E4EA]"
                      }`}
                    >
                      {vName}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
