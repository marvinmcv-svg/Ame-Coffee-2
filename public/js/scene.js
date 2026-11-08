// AMÉ hero — a scroll-driven "film" of a cappuccino being made.
//
// Scroll progress p (0 → 1) drives everything:
//   0.00  hero shot: empty AMÉ cup, beans orbiting
//   0.12  beans spiral up and fall into the cup          (01 · El grano)
//   0.32  espresso pours, crema rises                    (02 · La extracción)
//   0.54  steamed milk pours, colour turns caramel       (03 · La leche)
//   0.72  latte art blooms, camera looks straight down   (04 · El arte)
//   0.88  pull back to a product shot, beans return      (finale)
//
// Everything is procedural (no external models) so it loads instantly.
import * as THREE from 'three';
import { RoomEnvironment } from '/vendor/RoomEnvironment.js';

/* ---------- helpers ---------- */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);

/* ---------- canvas textures ---------- */

function canvasTex(draw, w = 1024, h = 1024) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Espresso crema: golden centre, darker tiger-striped rim
const cremaTexture = () => canvasTex((g, s) => {
  const r = g.createRadialGradient(s / 2, s / 2, s * 0.02, s / 2, s / 2, s / 2);
  r.addColorStop(0, '#9a6232'); r.addColorStop(0.5, '#7a4520');
  r.addColorStop(0.85, '#4a240d'); r.addColorStop(1, '#2a1306');
  g.fillStyle = r; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 3200; i++) {
    const rr = Math.random() * s * 0.49, a = Math.random() * Math.PI * 2;
    g.fillStyle = `rgba(${Math.random() < 0.5 ? '235,190,130' : '60,28,10'},${Math.random() * 0.12})`;
    g.beginPath(); g.arc(s / 2 + Math.cos(a) * rr, s / 2 + Math.sin(a) * rr, Math.random() * 7, 0, 7); g.fill();
  }
});

// Milk + espresso mixed surface: caramel with a lighter foam ring
const mixTexture = () => canvasTex((g, s) => {
  const r = g.createRadialGradient(s / 2, s / 2, s * 0.02, s / 2, s / 2, s / 2);
  r.addColorStop(0, '#8a5530'); r.addColorStop(0.62, '#71411f');
  r.addColorStop(0.84, '#9a6a42'); r.addColorStop(0.94, '#e2d0b8'); r.addColorStop(1, '#efe4d4');
  g.fillStyle = r; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 1800; i++) {
    const rr = Math.random() * s * 0.49, a = Math.random() * Math.PI * 2;
    g.fillStyle = `rgba(255,245,230,${Math.random() * 0.08})`;
    g.beginPath(); g.arc(s / 2 + Math.cos(a) * rr, s / 2 + Math.sin(a) * rr, Math.random() * 5, 0, 7); g.fill();
  }
});

// Rosetta on a transparent background (sits on top of the mix surface)
const artTexture = () => canvasTex((g, s) => {
  g.clearRect(0, 0, s, s);
  g.save();
  g.translate(s / 2, s / 2 + 40);
  g.fillStyle = '#f8efe2';
  g.shadowColor = 'rgba(110,60,25,.55)'; g.shadowBlur = 16;
  const leaves = 7;
  for (let i = 0; i < leaves; i++) {
    const t = i / (leaves - 1);
    const y = 230 - t * 400, w = 320 * (1 - t * 0.6), h = 70 * (1 - t * 0.35);
    g.beginPath();
    g.moveTo(-w, y);
    g.quadraticCurveTo(0, y - h * 2.2, w, y);
    g.quadraticCurveTo(0, y - h * 0.9, -w, y);
    g.fill();
  }
  const hy = -235;
  g.beginPath();
  g.moveTo(0, hy + 70);
  g.bezierCurveTo(-120, hy - 10, -60, hy - 100, 0, hy - 40);
  g.bezierCurveTo(60, hy - 100, 120, hy - 10, 0, hy + 70);
  g.fill();
  g.shadowBlur = 0;
  g.strokeStyle = 'rgba(120,70,35,.9)'; g.lineWidth = 9; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, -300); g.lineTo(0, 300); g.stroke();
  g.restore();
});

const logoDecalTexture = () => canvasTex((g, w, h) => {
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
}, 1024, 512);

/* ---------- geometry ---------- */

// Inner wall radius of the cup at height y (matches the lathe profile)
const INNER = [[0.12, 0.0], [0.16, 0.56], [0.40, 0.70], [0.72, 0.82], [1.02, 0.91], [1.12, 0.95]];
function innerR(y) {
  for (let i = 1; i < INNER.length; i++) {
    if (y <= INNER[i][0]) {
      const [y0, r0] = INNER[i - 1], [y1, r1] = INNER[i];
      return lerp(r0, r1, (y - y0) / (y1 - y0)) - 0.018;
    }
  }
  return INNER[INNER.length - 1][1] - 0.018;
}

function buildCup() {
  const group = new THREE.Group();
  const ceramic = new THREE.MeshPhysicalMaterial({
    color: 0xf7f3ee, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0.4, sheenColor: new THREE.Color(0xffffff),
  });

  const prof = [
    [0.00, 0.00], [0.52, 0.00], [0.60, 0.04], [0.66, 0.14], [0.80, 0.42], [0.92, 0.76], [0.99, 1.04], [1.02, 1.12],
    [1.00, 1.15], [0.95, 1.12], [0.91, 1.02], [0.82, 0.72], [0.70, 0.40], [0.56, 0.16], [0.00, 0.12],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), ceramic);
  body.castShadow = true;
  group.add(body);

  // Liquid surfaces: crema (espresso), mix (with milk), art (rosetta)
  const disc = new THREE.CircleGeometry(1, 96);
  const mk = (map, transparent) => {
    const m = new THREE.Mesh(disc, new THREE.MeshStandardMaterial({
      map, roughness: 0.6, envMapIntensity: 0.15, transparent, depthWrite: !transparent,
    }));
    m.rotation.x = -Math.PI / 2;
    m.visible = false;
    group.add(m);
    return m;
  };
  const crema = mk(cremaTexture(), false);
  const mix = mk(mixTexture(), true);
  const art = mk(artTexture(), true);

  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.075, 24, 64, Math.PI * 1.25), ceramic);
  handle.position.set(0.98, 0.62, 0);
  handle.rotation.z = -Math.PI * 0.62;
  group.add(handle);

  const decal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.955, 0.835, 0.42, 64, 1, true, -0.62, 1.24),
    new THREE.MeshPhysicalMaterial({ map: logoDecalTexture(), transparent: true, roughness: 0.3, clearcoat: 1, depthWrite: false })
  );
  decal.position.y = 0.66;
  decal.rotation.y = Math.PI * 1.5;
  group.add(decal);

  const sp = [[0, 0], [0.9, 0], [1.05, 0.02], [1.45, 0.12], [1.62, 0.2], [1.6, 0.23], [1.42, 0.17], [1.0, 0.08], [0.72, 0.07], [0, 0.07]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const saucer = new THREE.Mesh(new THREE.LatheGeometry(sp, 96), ceramic);
  saucer.position.y = -0.07;
  saucer.receiveShadow = true;
  group.add(saucer);

  return { group, crema, mix, art };
}

function beanGeometry() {
  const geo = new THREE.SphereGeometry(1, 32, 20);
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    if (v.y > 0) v.y *= 0.55;
    if (v.y > 0) v.y -= 0.32 * Math.exp(-Math.pow(v.x / 0.11, 2)) * Math.min(1, v.y * 6 + 0.3);
    p.setXYZ(i, v.x * 0.62, v.y * 0.5, v.z * 0.9);
  }
  geo.computeVertexNormals();
  return geo;
}

function steamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uSeed: { value: Math.random() * 10 }, uOpacity: { value: 0 } },
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

// A falling liquid column (unit height, hangs down from its origin)
function buildStream(radius, color, rough) {
  const geo = new THREE.CylinderGeometry(radius, radius * 0.82, 1, 20, 24, true);
  geo.translate(0, -0.5, 0);
  const mat = new THREE.MeshPhysicalMaterial({ color, roughness: rough, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  const m = new THREE.Mesh(geo, mat);
  m.visible = false;
  return m;
}

/* ---------- timeline ---------- */

const STORY = {
  beans: [0.12, 0.32],
  espresso: [0.31, 0.52],
  milk: [0.54, 0.71],
  art: [0.68, 0.8],
  finale: 0.88,
};
const LEVEL = { empty: 0.13, espresso: 0.55, full: 0.99 };

// Camera keyframes in cup space: [progress, camera position, look-at target]
const KEYS = [
  [0.00, [-2.36, 3.4, 9.2], [0, 0.9, 0]],
  [0.14, [2.4, 5.4, 7.2], [0, 1.9, 0]],
  [0.27, [1.5, 3.7, 4.4], [0, 1.4, 0]],
  [0.40, [1.25, 1.75, 3.4], [0, 1.0, 0]],
  [0.52, [-0.5, 3.6, 3.5], [0, 0.75, 0]],
  [0.64, [-2.6, 2.4, 3.7], [0, 1.0, 0]],
  [0.78, [0.0, 5.7, 0.75], [0, 0.85, 0]],
  [0.90, [-2.2, 2.3, 5.8], [0, 0.75, 0]],
  [1.00, [-2.9, 2.8, 7.6], [0, 0.7, 0]],
];
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
function cameraAt(p, outPos, outTarget) {
  let i = 1;
  while (i < KEYS.length - 1 && p > KEYS[i][0]) i++;
  const [p0, c0, t0] = KEYS[i - 1], [p1, c1, t1] = KEYS[i];
  const k = smoother(clamp((p - p0) / (p1 - p0)));
  outPos.set(lerp(c0[0], c1[0], k), lerp(c0[1], c1[1], k), lerp(c0[2], c1[2], k));
  outTarget.set(lerp(t0[0], t1[0], k), lerp(t0[1], t1[1], k), lerp(t0[2], t1[2], k));
}

/* ---------- scene ---------- */

export function initHeroScene(canvas) {
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

  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 100);

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

  const stage = new THREE.Group();
  scene.add(stage);
  const cup = buildCup();
  stage.add(cup.group);

  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.35 }));
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -0.08;
  shadowPlane.receiveShadow = true;
  stage.add(shadowPlane);

  // Streams live on the (non-rotating) stage so they stay put while the cup turns
  const espressoStream = buildStream(0.045, 0x3a1b0b, 0.25);
  const milkStream = buildStream(0.075, 0xf4ede3, 0.45);
  espressoStream.position.x = 0.14;
  milkStream.position.x = -0.12;
  stage.add(espressoStream, milkStream);

  // Ripple rings where the stream hits the surface
  const ripples = Array.from({ length: 3 }, () => {
    const r = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1, 48),
      new THREE.MeshBasicMaterial({ color: 0xfff4e6, transparent: true, opacity: 0, depthWrite: false })
    );
    r.rotation.x = -Math.PI / 2;
    stage.add(r);
    return r;
  });

  const steams = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.4, 1, 32), steamMaterial());
    m.position.set((i - 1) * 0.22, 2.25, (i - 1) * 0.1);
    m.rotation.y = i * 0.9;
    cup.group.add(m);
    steams.push(m);
  }

  // Beans
  const BEANS = window.innerWidth < 700 ? 26 : 46;
  const beanMat = new THREE.MeshPhysicalMaterial({ color: 0x4a2a17, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.3, sheen: 0.3 });
  const beans = new THREE.InstancedMesh(beanGeometry(), beanMat, BEANS);
  beans.castShadow = true;
  scene.add(beans);
  const beanData = Array.from({ length: BEANS }, (_, i) => {
    const wide = window.innerWidth >= 760;
    let x = wide ? -1.6 + Math.random() * 7 : -3 + Math.random() * 6;
    if (Math.abs(x) < 1.3) x += Math.sign(x || 1) * 1.3;
    return {
      base: new THREE.Vector3(x, -1.2 + Math.random() * 4.8, -3.5 + Math.random() * 4.5),
      rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      spin: new THREE.Vector3((Math.random() - .5) * .6, (Math.random() - .5) * .6, (Math.random() - .5) * .6),
      scale: 0.12 + Math.random() * 0.14,
      phase: Math.random() * 10,
      drift: 0.15 + Math.random() * 0.3,
      delay: i / BEANS,
      a0: Math.random() * Math.PI * 2,
    };
  });
  const dummy = new THREE.Object3D();

  /* ---------- layout ---------- */
  const state = { progress: 0, mx: 0, my: 0, tmx: 0, tmy: 0, intro: 0, visible: true, mobile: false };
  const hero = { x: 0, y: 0, s: 1 };

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    state.mobile = w < 760;
    hero.x = state.mobile ? 0 : Math.min(2.4, 1.1 * camera.aspect);
    hero.y = state.mobile ? 1.55 : -0.55;
    hero.s = state.mobile ? 0.6 : 1.15;
  }
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('pointermove', (e) => {
    state.tmx = (e.clientX / window.innerWidth) * 2 - 1;
    state.tmy = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  const io = new IntersectionObserver(([en]) => { state.visible = en.isIntersecting; }, { threshold: 0 });
  io.observe(canvas);

  /* ---------- loop ---------- */
  const clock = new THREE.Clock();
  const camPos = new THREE.Vector3(), camTarget = new THREE.Vector3();
  const cupWorld = new THREE.Vector3();

  function setSurface(mesh, y, opacity) {
    mesh.visible = opacity > 0.001 && y > LEVEL.empty + 0.005;
    mesh.position.y = y;
    mesh.scale.setScalar(innerR(y));
    mesh.material.opacity = opacity;
  }

  function pour(stream, range, level, t) {
    const [a, b] = range;
    const fall = smooth(a, a + 0.025, state.progress);   // head falls in
    const lift = smooth(b - 0.025, b, state.progress);   // tail lifts out
    const top = 9;
    const bottom = lerp(top, level, fall);
    const upper = lerp(top, level, lift);
    const len = upper - bottom;
    stream.visible = len > 0.02 && fall > 0;
    stream.position.y = upper;
    stream.scale.set(1 + Math.sin(t * 38) * 0.08, Math.max(0.0001, len), 1 + Math.cos(t * 31) * 0.08);
    return fall > 0.95 && lift < 0.05; // actively hitting the surface
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!state.visible) return;
    const t = clock.getElapsedTime();
    state.mx += (state.tmx - state.mx) * 0.05;
    state.my += (state.tmy - state.my) * 0.05;
    const p = state.progress, intro = state.intro;

    /* stage: from the hero layout to centre stage */
    const toCenter = smooth(0.02, 0.16, p);
    const s = lerp(hero.s, 1, toCenter) * (0.6 + 0.4 * intro);
    stage.scale.setScalar(s);
    stage.position.set(lerp(hero.x, 0, toCenter), lerp(hero.y, 0, toCenter) - (1 - intro) * 1.5, 0);
    // one full turn through the story, landing back on the logo for the finale
    cup.group.rotation.y = Math.sin(t * 0.25) * 0.3 * (1 - toCenter) + smooth(0.1, 0.9, p) * (Math.PI * 2 + 1.0);

    /* liquid level */
    const esp = smooth(STORY.espresso[0] + 0.02, STORY.espresso[1] - 0.01, p);
    const milk = smooth(STORY.milk[0] + 0.02, STORY.milk[1] - 0.01, p);
    let level = lerp(LEVEL.empty, LEVEL.espresso, esp);
    level = lerp(level, LEVEL.full, milk);
    const wobble = Math.sin(t * 6) * 0.004 * (esp < 1 || milk < 1 ? 1 : 0.2);

    const mixK = smooth(STORY.milk[0] + 0.03, STORY.milk[0] + 0.12, p);
    const artK = smooth(STORY.art[0], STORY.art[1], p);
    setSurface(cup.crema, level + wobble, 1);
    setSurface(cup.mix, level + wobble + 0.002, mixK);
    setSurface(cup.art, level + wobble + 0.004, artK);
    cup.art.scale.multiplyScalar(lerp(0.55, 1, artK));
    cup.art.rotation.z = (1 - artK) * 0.6;

    /* streams + ripples */
    const hitE = pour(espressoStream, STORY.espresso, level, t);
    const hitM = pour(milkStream, STORY.milk, level, t);
    ripples.forEach((r, i) => {
      const k = (t * 1.4 + i / ripples.length) % 1;
      const active = hitE || hitM;
      r.position.set(hitM ? milkStream.position.x : espressoStream.position.x, level + 0.006, 0);
      r.scale.setScalar(0.04 + k * 0.32);
      r.material.opacity = active ? (1 - k) * 0.5 : 0;
    });

    /* steam once there is hot coffee */
    const heat = smooth(STORY.espresso[0] + 0.05, STORY.espresso[1], p);
    steams.forEach((m, i) => {
      m.position.y = level + 1.25;
      m.material.uniforms.uTime.value = t + i * 3.1;
      m.material.uniforms.uOpacity.value = 0.3 * intro * heat * (1 - smooth(0.74, 0.8, p) * 0.7);
      m.lookAt(camera.position.x, m.getWorldPosition(_b).y, camera.position.z);
    });

    /* camera */
    cameraAt(p, camPos, camTarget);
    if (state.mobile) {
      camPos.sub(camTarget).multiplyScalar(lerp(1, 1.55, toCenter)).add(camTarget);
      camTarget.y -= 0.45 * toCenter;
    }
    // keyframes are in cup space: follow the stage
    camPos.multiplyScalar(lerp(1, s, toCenter)).add(_a.set(stage.position.x * toCenter, stage.position.y * toCenter, 0));
    camTarget.multiplyScalar(lerp(1, s, toCenter)).add(_a.set(stage.position.x * toCenter, stage.position.y * toCenter, 0));
    camPos.x += state.mx * 0.25;
    camPos.y += state.my * 0.15;
    camera.position.copy(camPos);
    camera.lookAt(camTarget);

    /* beans: orbit → spiral into the cup → return for the finale */
    cup.group.getWorldPosition(cupWorld);
    const back = smooth(STORY.finale, 1, p);
    beanData.forEach((b, i) => {
      const orbit = _a.set(
        b.base.x + state.mx * 0.3 * b.drift * 3,
        b.base.y + Math.sin(t * b.drift + b.phase) * 0.35,
        b.base.z
      );
      const k = clamp((p - STORY.beans[0] - b.delay * 0.08) / (STORY.beans[1] - STORY.beans[0] - 0.08));
      const ang = b.a0 + k * 7 + t * 0.4;
      const rad = lerp(1.7, 0.08, smooth(0.25, 1, k));
      const hgt = lerp(3.4, 0.6, smooth(0.25, 1, k));
      const spiral = _b.set(cupWorld.x + Math.cos(ang) * rad * s, cupWorld.y + hgt * s, cupWorld.z + Math.sin(ang) * rad * s);
      const e = smooth(0, 0.3, k);
      dummy.position.copy(orbit).lerp(spiral, e);
      if (back > 0) dummy.position.lerp(orbit, back);
      dummy.rotation.set(b.rot.x + t * b.spin.x * (1 + k * 4), b.rot.y + t * b.spin.y, b.rot.z + t * b.spin.z);
      const vanish = 1 - smooth(0.82, 1, k);
      dummy.scale.setScalar(b.scale * intro * Math.max(vanish, back));
      dummy.updateMatrix();
      beans.setMatrixAt(i, dummy.matrix);
    });
    beans.instanceMatrix.needsUpdate = true;

    renderer.render(scene, camera);
  }
  frame();

  return {
    setProgress(v) { state.progress = v; },
    setIntro(v) { state.intro = v; },
    state,
  };
}
