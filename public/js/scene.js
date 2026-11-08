// AMÉ hero scene: a procedurally built cappuccino (cup, saucer, latte art,
// steam) surrounded by floating coffee beans. No external models — the whole
// scene is generated here so it loads instantly.
import * as THREE from 'three';
import { RoomEnvironment } from '/vendor/RoomEnvironment.js';

const BRAND = { espresso: 0x1e1713, taupe: 0x6e625b, cream: 0xf4eee7, crema: 0xc8935a };

/* ---------- Canvas textures ---------- */

function latteArtTexture() {
  const s = 1024, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  // espresso + crema body
  const base = g.createRadialGradient(s / 2, s / 2, s * 0.05, s / 2, s / 2, s / 2);
  base.addColorStop(0, '#7a4521');
  base.addColorStop(0.55, '#5e3216');
  base.addColorStop(0.86, '#3d1e0c');
  base.addColorStop(1, '#2a1407');
  g.fillStyle = base; g.fillRect(0, 0, s, s);

  // speckle for crema texture
  for (let i = 0; i < 2600; i++) {
    const r = Math.random() * s * 0.48, a = Math.random() * Math.PI * 2;
    g.fillStyle = `rgba(${Math.random() < .5 ? '240,210,170' : '70,35,15'},${Math.random() * 0.08})`;
    g.beginPath(); g.arc(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r, Math.random() * 6, 0, 7); g.fill();
  }

  // rosetta: stacked leaves shrinking toward the top, then a heart + pull-through line
  g.save();
  g.translate(s / 2, s / 2 + 40);
  g.fillStyle = '#f6ecdf';
  g.shadowColor = 'rgba(120,70,30,.6)'; g.shadowBlur = 18;
  const leaves = 7;
  for (let i = 0; i < leaves; i++) {
    const t = i / (leaves - 1);
    const y = 230 - t * 400;
    const w = 330 * (1 - t * 0.6);
    const h = 70 * (1 - t * 0.35);
    g.beginPath();
    g.moveTo(-w, y);
    g.quadraticCurveTo(0, y - h * 2.2, w, y);
    g.quadraticCurveTo(0, y - h * 0.9, -w, y);
    g.fill();
  }
  // heart on top
  g.beginPath();
  const hy = -235;
  g.moveTo(0, hy + 70);
  g.bezierCurveTo(-120, hy - 10, -60, hy - 100, 0, hy - 40);
  g.bezierCurveTo(60, hy - 100, 120, hy - 10, 0, hy + 70);
  g.fill();
  // pull-through line
  g.shadowBlur = 0;
  g.strokeStyle = 'rgba(94,50,22,.95)'; g.lineWidth = 9; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, -300); g.lineTo(0, 300); g.stroke();
  g.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function logoDecalTexture() {
  const w = 1024, h = 512, c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.clearRect(0, 0, w, h);
  g.strokeStyle = '#2b211c'; g.fillStyle = '#2b211c';
  g.lineWidth = 12;
  g.strokeRect(222, 120, 580, 190);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '500 118px Montserrat, sans-serif';
  if ('letterSpacing' in g) g.letterSpacing = '46px';
  g.fillText('AMÉ', w / 2 + 23, 220);
  g.font = '600 32px Montserrat, sans-serif';
  if ('letterSpacing' in g) g.letterSpacing = '9px';
  g.fillText('SPECIALTY ♡ COFFEE', w / 2 + 4, 370);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ---------- Geometry ---------- */

function cupGroup() {
  const group = new THREE.Group();

  const ceramic = new THREE.MeshPhysicalMaterial({
    color: 0xf7f3ee, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0.4, sheenColor: new THREE.Color(0xffffff),
  });

  // Cup body: outer wall, rim, inner wall (single lathe profile, open top)
  const pts = [];
  const prof = [
    [0.00, 0.00], [0.52, 0.00], [0.60, 0.04], [0.66, 0.14], [0.80, 0.42], [0.92, 0.76], [0.99, 1.04], [1.02, 1.12],
    [1.00, 1.15], [0.95, 1.12], [0.91, 1.02], [0.82, 0.72], [0.70, 0.40], [0.56, 0.16], [0.00, 0.12],
  ];
  for (const [x, y] of prof) pts.push(new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), ceramic);
  body.castShadow = true;
  group.add(body);

  // Coffee surface with latte art
  const coffee = new THREE.Mesh(
    new THREE.CircleGeometry(0.885, 96),
    new THREE.MeshStandardMaterial({ map: latteArtTexture(), roughness: 0.55, envMapIntensity: 0.35 })
  );
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.96;
  group.add(coffee);

  // Handle
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.075, 24, 64, Math.PI * 1.25), ceramic);
  handle.position.set(0.98, 0.62, 0);
  handle.rotation.z = -Math.PI * 0.62;
  group.add(handle);

  // Logo decal: a thin conical band hugging the outer wall
  const decal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.955, 0.835, 0.42, 64, 1, true, -0.62, 1.24),
    new THREE.MeshPhysicalMaterial({ map: logoDecalTexture(), transparent: true, roughness: 0.3, clearcoat: 1, depthWrite: false })
  );
  decal.position.y = 0.66;
  decal.rotation.y = Math.PI * 1.5; // face camera (-Z side of lathe → +Z)
  group.add(decal);

  // Saucer
  const sp = [[0, 0], [0.9, 0], [1.05, 0.02], [1.45, 0.12], [1.62, 0.2], [1.6, 0.23], [1.42, 0.17], [1.0, 0.08], [0.72, 0.07], [0, 0.07]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const saucer = new THREE.Mesh(new THREE.LatheGeometry(sp, 96), ceramic);
  saucer.position.y = -0.07;
  saucer.receiveShadow = true;
  group.add(saucer);

  return group;
}

function beanGeometry() {
  const geo = new THREE.SphereGeometry(1, 32, 20);
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    // flatten the top face
    if (v.y > 0) v.y *= 0.55;
    // centre crease along the long axis
    if (v.y > 0) v.y -= 0.32 * Math.exp(-Math.pow(v.x / 0.11, 2)) * Math.min(1, v.y * 6 + 0.3);
    p.setXYZ(i, v.x * 0.62, v.y * 0.5, v.z * 0.9);
  }
  geo.computeVertexNormals();
  return geo;
}

function steamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uSeed: { value: Math.random() * 10 }, uOpacity: { value: 0.32 } },
    vertexShader: /* glsl */`
      varying vec2 vUv; uniform float uTime; uniform float uSeed;
      void main(){
        vUv = uv;
        vec3 p = position;
        p.x += sin(uv.y * 5.0 + uTime * 0.9 + uSeed) * 0.18 * uv.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; uniform float uTime; uniform float uSeed; uniform float uOpacity;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
      float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }
      void main(){
        vec2 uv = vUv;
        float n = fbm(vec2(uv.x * 2.4 + uSeed, uv.y * 2.0 - uTime * 0.35));
        float wisp = smoothstep(0.42, 0.85, n);
        float edge = smoothstep(0.0, 0.35, uv.x) * smoothstep(1.0, 0.65, uv.x);
        float fade = smoothstep(0.0, 0.18, uv.y) * smoothstep(1.0, 0.45, uv.y);
        gl_FragColor = vec4(vec3(1.0, 0.97, 0.93), wisp * edge * fade * uOpacity);
      }`,
  });
}

/* ---------- Scene ---------- */

export function initHeroScene(canvas, { onProgress } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  // Lights: warm key, cool rim
  const key = new THREE.DirectionalLight(0xffe2c4, 2.4);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc8935a, 1.6);
  rim.position.set(-5, 2, -4);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0x6e625b, 0.4));

  // Stage
  const stage = new THREE.Group();
  scene.add(stage);

  const cup = cupGroup();
  stage.add(cup);

  // Soft contact shadow
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.35 }));
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -0.08;
  shadowPlane.receiveShadow = true;
  stage.add(shadowPlane);

  // Steam
  const steams = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.4, 1, 32), steamMaterial());
    m.position.set((i - 1) * 0.22, 2.25, (i - 1) * 0.1);
    m.rotation.y = i * 0.9;
    cup.add(m);
    steams.push(m);
  }

  // Beans (instanced)
  const BEANS = window.innerWidth < 700 ? 26 : 46;
  const beanMat = new THREE.MeshPhysicalMaterial({ color: 0x4a2a17, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.3, sheen: 0.3 });
  const beans = new THREE.InstancedMesh(beanGeometry(), beanMat, BEANS);
  beans.castShadow = true;
  scene.add(beans);
  const beanData = Array.from({ length: BEANS }, () => {
    const wide = window.innerWidth >= 760;
    let x = wide ? -1.6 + Math.random() * 7 : -3 + Math.random() * 6;
    if (Math.abs(x) < 1.3) x += Math.sign(x || 1) * 1.3; // clear of the cup
    return {
      base: new THREE.Vector3(x, -1.2 + Math.random() * 4.8, -3.5 + Math.random() * 4.5),
      rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      spin: new THREE.Vector3((Math.random() - .5) * .6, (Math.random() - .5) * .6, (Math.random() - .5) * .6),
      scale: 0.12 + Math.random() * 0.14,
      phase: Math.random() * 10,
      drift: 0.15 + Math.random() * 0.3,
    };
  });
  const dummy = new THREE.Object3D();

  /* ---------- Layout ---------- */
  const state = { progress: 0, mx: 0, my: 0, tmx: 0, tmy: 0, intro: 0, visible: true };

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const mobile = w < 760;
    // put the cup on the right on desktop, low + centred on mobile
    stage.userData.baseX = mobile ? 0 : Math.min(2.4, 1.1 * camera.aspect);
    stage.userData.baseY = mobile ? 1.55 : -0.55;
    stage.userData.scale = mobile ? 0.6 : 1.15;
  }
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('pointermove', (e) => {
    state.tmx = (e.clientX / window.innerWidth) * 2 - 1;
    state.tmy = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  const io = new IntersectionObserver(([en]) => { state.visible = en.isIntersecting; }, { threshold: 0 });
  io.observe(canvas);

  /* ---------- Loop ---------- */
  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!state.visible) return;
    const t = clock.getElapsedTime();
    state.mx += (state.tmx - state.mx) * 0.05;
    state.my += (state.tmy - state.my) * 0.05;
    const p = state.progress, intro = state.intro;

    // camera: orbit + dolly on scroll
    const ang = -0.25 + p * 1.1 + state.mx * 0.12;
    const dist = 9.5 - p * 1.6;
    camera.position.set(Math.sin(ang) * dist, 3.4 - p * 1.4 + state.my * 0.3, Math.cos(ang) * dist);
    camera.lookAt(0, 0.9 - p * 0.4, 0);

    // stage placement
    const s = stage.userData.scale * (0.6 + 0.4 * intro);
    stage.scale.setScalar(s);
    stage.position.set(stage.userData.baseX * (1 - p * 0.35), stage.userData.baseY - (1 - intro) * 1.5 + p * 0.6, 0);
    cup.rotation.y = t * 0.12 + p * Math.PI * 0.9;
    cup.rotation.z = Math.sin(t * 0.6) * 0.015;

    steams.forEach((m, i) => {
      m.material.uniforms.uTime.value = t + i * 3.1;
      m.material.uniforms.uOpacity.value = 0.3 * intro * (1 - p);
      m.lookAt(camera.position.x, m.getWorldPosition(new THREE.Vector3()).y, camera.position.z);
    });

    beanData.forEach((b, i) => {
      const y = b.base.y + Math.sin(t * b.drift + b.phase) * 0.35 - p * (1.5 + b.drift * 4);
      dummy.position.set(b.base.x + state.mx * 0.3 * b.drift * 3, y, b.base.z);
      dummy.rotation.set(b.rot.x + t * b.spin.x, b.rot.y + t * b.spin.y, b.rot.z + t * b.spin.z);
      dummy.scale.setScalar(b.scale * intro);
      dummy.updateMatrix();
      beans.setMatrixAt(i, dummy.matrix);
    });
    beans.instanceMatrix.needsUpdate = true;
    beans.position.x = stage.position.x * 0.6;

    renderer.render(scene, camera);
  }
  frame();
  onProgress && onProgress(1);

  return {
    setProgress(v) { state.progress = v; },
    setIntro(v) { state.intro = v; },
    state,
  };
}
