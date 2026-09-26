// 20.625 – 24.84s  27 MODULES → 3x3x3 CUBE → LOGO
// 27 module pills pop in (counter ticks with each one), implode, then burst out
// as 27 rounded 3D cubelets that assemble into a cube. The cube settles facing
// the camera while a dolly-zoom flattens it: its front face IS the logo.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { tl, b, add, gsap, cue, headline, hlIn, hlOut, windowed, icon, onFrame, prog, rng, clamp, lerp, E, shake } from '../lib.js';
import { SEED } from './languages.js';

export const T_IN = b(44);
export const P0 = b(48);          // 3D burst — drop 2
export const T_LOGO = b(53);      // cube face == 2D logo
export const LOGO = { cx: 540, cy: 560, size: 320 };

const MODULES = [
  ['calendar-days', 'Reservations'], ['concierge-bell', 'Front Desk'], ['door-open', 'Rooms'], ['brush-cleaning', 'Housekeeping'],
  ['users-round', 'Guest CRM'], ['star', 'Guest Feedback'], ['receipt', 'Billing'], ['credit-card', 'Payments'],
  ['trending-up', 'Revenue'], ['landmark', 'Accounting'], ['moon', 'Night Audit'], ['cable', 'Channel Manager', 1],
  ['globe', 'Booking Engine', 1], ['building-2', 'Corporate', 1], ['wrench', 'Maintenance', 1], ['boxes', 'Inventory', 1],
  ['users', 'Staff', 1], ['utensils', 'Restaurant POS', 1], ['flower-2', 'Spa & Wellness', 1], ['presentation', 'Events', 1],
  ['layout-dashboard', 'Dashboard'], ['chart-line', 'Reports'], ['shield-check', 'Users & Roles'], ['bell', 'Notifications'],
  ['file-text', 'Documents'], ['plug', 'API'], ['settings', 'Settings'],
];

export async function build({ world, overlay, gl }) {
  const scene = add(world, `<div class="scene" id="s-mods"><div class="dots"></div></div>`);
  windowed(scene, T_IN + 0.21, T_LOGO + 0.5);   // seed hand-off from the language switcher lands at T_IN + 0.22

  add(document.head, `<style>
    #s-mods .seed { position:absolute; left:${SEED.x - SEED.size / 2}px; top:${SEED.y - SEED.size / 2}px; width:${SEED.size}px; height:${SEED.size}px;
      border-radius:18.75%; background:var(--orange); }
    #s-mods .num { position:absolute; left:0; top:700px; width:1080px; text-align:center; font-family:var(--display); font-weight:800; font-size:400px;
      letter-spacing:-0.07em; line-height:1; color:var(--text); }
    #s-mods .lbl { position:absolute; left:0; top:1120px; width:1080px; text-align:center; font-family:var(--display); font-weight:600; font-size:62px; letter-spacing:-0.02em; color:var(--orange); }
    #s-mods .mp { position:absolute; left:0; top:0; display:flex; align-items:center; gap:12px; height:66px; padding:0 24px 0 16px; border-radius:33px;
      background:#1b1b22; border:1.5px solid var(--line2); font-weight:650; font-size:27px; white-space:nowrap; box-shadow:0 14px 30px rgba(0,0,0,.4); }
    #s-mods .mp .ico { color:var(--orange); }
    #s-mods .mp.add { border:2px dashed rgba(122,167,255,.55); background:#151a26; }
    #s-mods .mp.add .ico { color:var(--blue); }
    #s-mods .legend { position:absolute; left:0; width:1080px; top:1216px; display:flex; justify-content:center; gap:36px; font-weight:600; font-size:25px; color:var(--muted); }
    #s-mods .legend i { display:inline-block; width:22px; height:22px; border-radius:7px; margin-right:10px; vertical-align:-3px; }
    #s-mods .glow { position:absolute; left:40px; top:400px; width:1000px; height:1000px; border-radius:50%;
      background:radial-gradient(closest-side, rgba(255,77,31,.35), rgba(255,77,31,.08) 55%, transparent 100%); }
  </style>`);

  // ---------- 2D: pills + counter ----------
  const seed = add(scene, `<div class="seed"></div>`);
  tl.fromTo(seed, { scale: 1, rotation: 0 }, { scale: 0, rotation: 90, duration: 0.35, ease: 'back.in(2)' }, T_IN + 0.24);
  const num = add(scene, `<div class="num">0</div>`);
  const lbl = add(scene, `<div class="lbl">modules</div>`);
  const legend = add(scene, `<div class="legend"><span><i style="background:var(--orange)"></i>Core — included</span><span><i style="border:2.5px dashed var(--blue)"></i>Add-ons — as you grow</span></div>`);
  tl.fromTo(num, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' }, T_IN + 0.24);
  tl.fromTo([lbl, legend], { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'expo.out', stagger: 0.08 }, T_IN + 0.36);

  const rows = [330, 420, 510, 600, 1330, 1420, 1510, 1600, 1690];
  const R = rng(27);
  const order = MODULES.map((_, i) => i).sort(() => R() - 0.5);
  const pills = [];
  const measure = add(scene, `<div style="position:absolute;visibility:hidden"></div>`);
  MODULES.forEach(([ic, name, addon], i) => {
    const el = add(scene, `<div class="mp${addon ? ' add' : ''}">${icon(ic, { size: 30, sw: 2.3 })}${name}</div>`);
    pills.push({ el, name });
  });
  // lay pills out 3 per row, rows alternately shifted (brick pattern)
  pills.forEach((p, i) => { p.w = p.el.getBoundingClientRect().width; });
  for (let r = 0; r < 9; r++) {
    const rowP = pills.slice(r * 3, r * 3 + 3);
    const total = rowP.reduce((a, p) => a + p.w, 0) + 2 * 18;
    let x = 540 - total / 2 + (r % 2 ? 36 : -36);
    rowP.forEach((p) => { p.x = x + p.w / 2; p.y = rows[r]; x += p.w + 18; });
  }
  measure.remove();
  const POP0 = T_IN + 0.3, POPK = 0.04;    // every pop starts before the implosion (last: T_IN + 1.34)
  const popT = [];
  order.forEach((idx, k) => {
    const p = pills[idx];
    const t = POP0 + k * POPK;
    popT.push(t);
    gsap.set(p.el, { x: p.x, y: p.y, xPercent: -50, yPercent: -50 });
    tl.fromTo(p.el, { scale: 0, rotation: (R() - 0.5) * 30 }, { scale: 1, rotation: (R() - 0.5) * 6, duration: 0.3, ease: 'back.out(2.6)' }, t);
    cue('count', t, { k });
  });
  onFrame((t) => {
    let n = 0, last = -9;
    for (const x of popT) if (t >= x) { n++; last = x; }
    const s = String(n);
    if (num.__s !== s) { num.textContent = s; num.__s = s; }
    const punch = 1 + 0.05 * Math.exp(-(t - last) * 22);
    num.style.scale = t < P0 - 0.3 ? punch.toFixed(4) : '';
  });

  // implosion into the centre (the 3D burst takes over from here)
  const IMP = P0 - 0.3;
  pills.forEach((p) => {
    const d = Math.hypot(p.x - 540, p.y - 960);
    tl.to(p.el, { x: 540, y: 960, scale: 0, rotation: (p.x < 540 ? -1 : 1) * 120, duration: 0.3, ease: 'power3.in' }, IMP + (1 - d / 900) * 0.04);
  });
  tl.to(num, { scale: 0, rotation: -40, duration: 0.3, ease: 'power3.in' }, IMP + 0.02);
  tl.to([lbl, legend], { scale: 0, y: -200, opacity: 0, duration: 0.28, ease: 'power3.in' }, IMP);
  cue('suck_short', IMP);

  // ---------- 3D cube ----------
  const glow = add(scene, `<div class="glow"></div>`);
  gsap.set(glow, { opacity: 0 });
  tl.to(glow, { opacity: 1, duration: 0.4 }, P0);
  tl.to(glow, { y: -340, scale: 0.7, duration: T_LOGO - P0 - 0.9, ease: 'power2.inOut' }, P0 + 0.9);
  tl.to(glow, { opacity: 0.5, duration: 0.5 }, T_LOGO - 0.4);

  const renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(1080, 1920, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x000000, 0);
  const s3 = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  s3.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const cam = new THREE.PerspectiveCamera(30, 1080 / 1920, 0.5, 2000);

  const key = new THREE.DirectionalLight(0xfff1e8, 1.7); key.position.set(4, 8, 10); s3.add(key);
  const rim = new THREE.DirectionalLight(0xffc2a0, 2.2); rim.position.set(-9, 4, -6); s3.add(rim);
  const fillL = new THREE.DirectionalLight(0xff7a45, 0.8); fillL.position.set(-6, -6, 6); s3.add(fillL);
  const brand = new THREE.Color('#ff4d1f');
  const mat = new THREE.MeshPhysicalMaterial({ color: brand.clone(), roughness: 0.42, metalness: 0, clearcoat: 0.75, clearcoatRoughness: 0.22,
    emissive: brand.clone(), emissiveIntensity: 0.22, envMapIntensity: 0.5 });
  const LIT = { key: 1.7, rim: 2.2, fill: 0.8, env: 0.5, emi: 0.22, cc: 0.75 };

  const RAD = 24 / 128;
  const boxGeo = new RoundedBoxGeometry(1, 1, 1, 6, RAD);
  // hollow cubelet: square tube whose front face is the logo's hollow square
  const bev = 0.05;
  const shape = new THREE.Shape();
  const rr = (p, x, y, w, h, r) => {
    p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
    p.lineTo(x + w, y + h - r); p.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
    p.lineTo(x + r, y + h); p.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
    p.lineTo(x, y + r); p.absarc(x + r, y + r, r, Math.PI, 1.5 * Math.PI, false);
  };
  rr(shape, -0.5 + bev, -0.5 + bev, 1 - 2 * bev, 1 - 2 * bev, RAD - bev);
  const hole = new THREE.Path();
  rr(hole, -0.25 - bev, -0.25 - bev, 0.5 + 2 * bev, 0.5 + 2 * bev, 6 / 128 + bev);
  shape.holes.push(hole);
  const tubeGeo = new THREE.ExtrudeGeometry(shape, { depth: 1 - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 4, curveSegments: 24 });
  tubeGeo.center();

  const group = new THREE.Group();
  s3.add(group);
  const cubes = [];
  const R3 = rng(333);
  let k = 0;
  for (let zi = 0; zi < 3; zi++) for (let yi = 0; yi < 3; yi++) for (let xi = 0; xi < 3; xi++) {
    // front layer is z = +1.5; logo's hollow square is bottom-right of the front face → a tunnel along z
    const hollow = xi === 2 && yi === 0;
    const m = new THREE.Mesh(hollow ? tubeGeo : boxGeo, mat);
    const g = new THREE.Vector3((xi - 1) * 1.5, (yi - 1) * 1.5, (zi - 1) * 1.5);
    const dir = new THREE.Vector3(R3() - 0.5, R3() - 0.5, R3() - 0.5).normalize();
    const sc = g.clone().normalize().multiplyScalar(0.6).add(dir).normalize().multiplyScalar(6 + R3() * 5);
    cubes.push({ m, g, s: sc, rot: new THREE.Euler((R3() - 0.5) * 6, (R3() - 0.5) * 6, (R3() - 0.5) * 6), order: 0, k: k++ });
    group.add(m);
  }
  const ord = cubes.map((_, i) => i).sort(() => R3() - 0.5);
  ord.forEach((ci, n) => { cubes[ci].order = n; });

  const A0 = P0 + 0.28, AK = 0.028, AD = 0.5;
  cubes.forEach((c) => cue('clack', A0 + c.order * AK + AD * 0.85, { k: c.order }));
  cue('burst3d', P0);
  const ALIGN0 = P0 + 1.3;

  const eBurst = E('expo.out'), eAsm = E('back.out(1.25)'), eSpin = E('power3.out');
  const tmpQ = new THREE.Quaternion(), idQ = new THREE.Quaternion();
  onFrame((t) => {
    const on = t >= P0 - 0.02 && t < T_LOGO + 0.3;
    gl.style.display = on ? 'block' : 'none';
    if (!on) return;
    gl.style.opacity = String(1 - prog(t, T_LOGO, 0.22));
    const ub = eBurst(clamp((t - P0) / 0.42));
    for (const c of cubes) {
      const ta = A0 + c.order * AK;
      const ua = clamp((t - ta) / AD);
      const ea = eAsm(ua);
      // burst from the centre to the scattered position, then fly into the grid
      const bx = c.s.x * ub, by = c.s.y * ub, bz = c.s.z * ub;
      c.m.position.set(lerp(bx, c.g.x, ea), lerp(by, c.g.y, ea), lerp(bz, c.g.z, ea));
      tmpQ.setFromEuler(new THREE.Euler(c.rot.x * ub, c.rot.y * ub, c.rot.z * ub));
      c.m.quaternion.copy(tmpQ).slerp(idQ, clamp(ea));
      const sc = lerp(0.15, 1, ub);
      c.m.scale.setScalar(sc);
    }
    // settling spin: fast while assembling, lands exactly face-on at T_LOGO
    const us = eSpin(clamp((t - P0) / (T_LOGO - P0)));
    group.rotation.y = (1 - us) * (-Math.PI * 2.35);
    group.rotation.x = (1 - us) * 0.62;
    group.rotation.z = (1 - us) * -0.18;
    // camera: dolly-zoom from a 30° lens to a 4° lens, cube shrinks & rises to the logo slot
    const uz = E('power2.inOut')(clamp((t - ALIGN0) / (T_LOGO - ALIGN0)));
    const fov = lerp(30, 4, uz);
    const Hv = lerp(13.2, 1920 / (LOGO.size / 4), uz);             // world units visible at face plane
    const shift = lerp(0, (960 - LOGO.cy) / (1920 / Hv), uz);      // raise cube to the logo's y
    const D = Hv / 2 / Math.tan(THREE.MathUtils.degToRad(fov / 2));
    cam.fov = fov;
    cam.position.set(0, -shift, D + 2.25 * (1 - uz) + 2 * uz);
    cam.lookAt(0, -shift, 0);
    cam.updateProjectionMatrix();
    // flatten shading into the exact brand colour for the hand-off to 2D
    const uf = prog(t, T_LOGO - 0.45, 0.4, 'power2.inOut');
    mat.color.copy(brand).multiplyScalar(1 - uf);
    mat.emissiveIntensity = lerp(LIT.emi, 1, uf);
    mat.envMapIntensity = LIT.env * (1 - uf);
    mat.clearcoat = LIT.cc * (1 - uf);
    mat.specularIntensity = 1 - uf;
    key.intensity = LIT.key * (1 - uf); rim.intensity = LIT.rim * (1 - uf); fillL.intensity = LIT.fill * (1 - uf);
    renderer.render(s3, cam);
  });

  // headline for the cube moment lives above the WebGL layer
  const hl = headline(overlay, ['27 modules.', '<span class="accent">One system.</span>'], { top: 300, align: 'center', size: 100 });
  hlIn(hl, P0 + 0.25);
  hlOut(hl, T_LOGO - 0.8);
  shake(A0 + 26 * AK + AD * 0.85, 0.3, 9);
}
