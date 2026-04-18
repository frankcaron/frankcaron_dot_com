import * as THREE from 'three';

// ============================================================
// SHADOW STRIKE — Third-Person Tactical Shooter
// ============================================================

// --- Constants ---
const TILE = 4;
const MAP_W = 60;
const MAP_H = 60;
const PLAYER_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.4;
const CAM_DIST = 6;
const CAM_HEIGHT = 3.5;
const CAM_LOOK_HEIGHT = 1.2;
const GRAVITY = -20;
const PI2 = Math.PI * 2;

// --- Renderer ---
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a2a1a);
scene.fog = new THREE.FogExp2(0x1a2a1a, 0.012);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, CAM_HEIGHT, CAM_DIST);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0x3a4a3a, 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffe8c0, 1.2);
dirLight.position.set(30, 40, 20);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -80;
dirLight.shadow.camera.right = 80;
dirLight.shadow.camera.top = 80;
dirLight.shadow.camera.bottom = -80;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 120;
dirLight.shadow.bias = -0.002;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0x8090c0, 0.3);
fillLight.position.set(-20, 15, -10);
scene.add(fillLight);

// --- Audio ---
let audioCtx = null;
function ensureAudio() {
  if (audioCtx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
    const p = audioCtx.resume();
    if (p && p.catch) p.catch(() => {});
  } catch (e) { audioCtx = null; }
}
function playSound(freq, dur, type, vol) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol || 0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}
function sfxShoot() { playSound(180, 0.08, 'sawtooth', 0.1); playSound(90, 0.12, 'square', 0.06); }
function sfxHit() { playSound(300, 0.1, 'sine', 0.12); }
function sfxKill() { playSound(500, 0.05, 'sine', 0.1); playSound(700, 0.08, 'sine', 0.07); }
function sfxReload() { playSound(800, 0.08, 'triangle', 0.05); }
function sfxDamage() { playSound(100, 0.15, 'sawtooth', 0.15); }

// --- Map ---
const map = [];
for (let y = 0; y < MAP_H; y++) {
  map[y] = [];
  for (let x = 0; x < MAP_W; x++) map[y][x] = 0;
}

// 0=floor 1=wall 2=crate 3=sandbag
const buildings = [
  {x:4,y:4,w:10,h:8},{x:20,y:3,w:8,h:7},{x:38,y:4,w:10,h:8},{x:52,y:3,w:6,h:6},
  {x:4,y:18,w:8,h:10},{x:16,y:16,w:12,h:10},{x:34,y:18,w:10,h:8},{x:48,y:16,w:10,h:10},
  {x:8,y:34,w:8,h:10},{x:22,y:32,w:10,h:8},{x:38,y:34,w:8,h:10},{x:50,y:34,w:8,h:8},
  {x:4,y:48,w:10,h:8},{x:24,y:46,w:12,h:10},{x:44,y:48,w:8,h:8},
];

function buildMap() {
  for (let x = 0; x < MAP_W; x++) { map[0][x] = 1; map[MAP_H-1][x] = 1; }
  for (let y = 0; y < MAP_H; y++) { map[y][0] = 1; map[y][MAP_W-1] = 1; }

  buildings.forEach(b => {
    for (let x = b.x; x < b.x + b.w; x++) { map[b.y][x] = 1; map[b.y + b.h - 1][x] = 1; }
    for (let y = b.y; y < b.y + b.h; y++) { map[y][b.x] = 1; map[y][b.x + b.w - 1] = 1; }
    for (let y = b.y+1; y < b.y+b.h-1; y++)
      for (let x = b.x+1; x < b.x+b.w-1; x++) map[y][x] = 0;
    // South door
    const sx = b.x + 2 + Math.floor(Math.random() * Math.max(1, b.w - 4));
    map[b.y + b.h - 1][sx] = 0;
    if (sx + 1 < b.x + b.w - 1) map[b.y + b.h - 1][sx + 1] = 0;
    // Second door
    if (Math.random() > 0.5) {
      const nx = b.x + 2 + Math.floor(Math.random() * Math.max(1, b.w - 4));
      map[b.y][nx] = 0;
      if (nx + 1 < b.x + b.w - 1) map[b.y][nx + 1] = 0;
    } else {
      const ny = b.y + 2 + Math.floor(Math.random() * Math.max(1, b.h - 4));
      map[ny][b.x + b.w - 1] = 0;
      if (ny + 1 < b.y + b.h - 1) map[ny + 1][b.x + b.w - 1] = 0;
    }
  });

  for (let i = 0; i < 50; i++) {
    const cx = 2 + Math.floor(Math.random() * (MAP_W - 4));
    const cy = 2 + Math.floor(Math.random() * (MAP_H - 4));
    if (map[cy][cx] === 0) map[cy][cx] = Math.random() > 0.5 ? 2 : 3;
  }
}
buildMap();

function isSolid(wx, wz) {
  const tx = Math.floor(wx / TILE);
  const tz = Math.floor(wz / TILE);
  if (tx < 0 || tx >= MAP_W || tz < 0 || tz >= MAP_H) return true;
  return map[tz][tx] >= 1;
}
function isSolidForMove(wx, wz) {
  const tx = Math.floor(wx / TILE);
  const tz = Math.floor(wz / TILE);
  if (tx < 0 || tx >= MAP_W || tz < 0 || tz >= MAP_H) return true;
  return map[tz][tx] === 1;
}

// --- Build 3D geometry ---
const wallMat = new THREE.MeshStandardMaterial({ color: 0x5a5a50, roughness: 0.9 });
const wallTopMat = new THREE.MeshStandardMaterial({ color: 0x6a6a5e, roughness: 0.85 });
const crateMat = new THREE.MeshStandardMaterial({ color: 0x7a6040, roughness: 0.8 });
const sandbagMat = new THREE.MeshStandardMaterial({ color: 0x6a6a4a, roughness: 0.95 });
const floorMat = new THREE.MeshStandardMaterial({ color: 0x3a4430, roughness: 1 });

function buildScene() {
  // Ground
  const groundGeo = new THREE.PlaneGeometry(MAP_W * TILE, MAP_H * TILE);
  const ground = new THREE.Mesh(groundGeo, floorMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(MAP_W * TILE / 2, 0, MAP_H * TILE / 2);
  ground.receiveShadow = true;
  scene.add(ground);

  // Batch walls using merged geometry
  const wallGeo = new THREE.BoxGeometry(TILE, 3, TILE);
  const crateGeo = new THREE.BoxGeometry(TILE * 0.8, 1.5, TILE * 0.8);
  const sandbagGeo = new THREE.CylinderGeometry(TILE * 0.35, TILE * 0.4, 0.8, 8);

  const wallMeshes = [];
  const crateMeshes = [];
  const sandbagMeshes = [];

  for (let z = 0; z < MAP_H; z++) {
    for (let x = 0; x < MAP_W; x++) {
      const wx = x * TILE + TILE / 2;
      const wz = z * TILE + TILE / 2;
      const t = map[z][x];
      if (t === 1) {
        const m = new THREE.Mesh(wallGeo, wallMat);
        m.position.set(wx, 1.5, wz);
        m.castShadow = true;
        m.receiveShadow = true;
        scene.add(m);
        wallMeshes.push(m);
      } else if (t === 2) {
        const m = new THREE.Mesh(crateGeo, crateMat);
        m.position.set(wx, 0.75, wz);
        m.castShadow = true;
        m.receiveShadow = true;
        scene.add(m);
        crateMeshes.push(m);
      } else if (t === 3) {
        const m = new THREE.Mesh(sandbagGeo, sandbagMat);
        m.position.set(wx, 0.4, wz);
        m.castShadow = true;
        m.receiveShadow = true;
        scene.add(m);
        sandbagMeshes.push(m);
      }
    }
  }
  return { wallMeshes, crateMeshes, sandbagMeshes };
}

const sceneObjects = buildScene();

// --- Player model (simple geometric soldier) ---
function createSoldierMesh(color) {
  const group = new THREE.Group();

  // Body
  const bodyGeo = new THREE.CylinderGeometry(0.3, 0.35, 1.0, 8);
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.9;
  body.castShadow = true;
  group.add(body);

  // Head
  const headGeo = new THREE.SphereGeometry(0.22, 8, 8);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xd4b896, roughness: 0.8 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.6;
  head.castShadow = true;
  group.add(head);

  // Helmet
  const helmetGeo = new THREE.SphereGeometry(0.26, 8, 6, 0, PI2, 0, Math.PI / 2);
  const helmetMat = new THREE.MeshStandardMaterial({ color: color === 0x3a6a3a ? 0x2a4a2a : 0x4a2a2a, roughness: 0.6 });
  const helmet = new THREE.Mesh(helmetGeo, helmetMat);
  helmet.position.y = 1.65;
  helmet.castShadow = true;
  group.add(helmet);

  // Gun
  const gunGeo = new THREE.BoxGeometry(0.08, 0.08, 0.7);
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.5 });
  const gun = new THREE.Mesh(gunGeo, gunMat);
  gun.position.set(0.3, 1.1, 0.3);
  gun.castShadow = true;
  group.add(gun);

  // Legs (two cylinders)
  const legGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.5, 6);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2a3a2a, roughness: 0.9 });
  const legL = new THREE.Mesh(legGeo, legMat);
  legL.position.set(-0.15, 0.25, 0);
  group.add(legL);
  const legR = new THREE.Mesh(legGeo, legMat);
  legR.position.set(0.15, 0.25, 0);
  group.add(legR);

  group.userData.gun = gun;
  return group;
}

// --- Weapons data ---
const WEAPONS = {
  m4a1: { name: 'M4A1', damage: 22, fireRate: 120, magSize: 30, reserve: 120, reloadTime: 2200, spread: 0.02, range: 80, auto: true },
  shotgun: { name: 'M870', damage: 12, fireRate: 700, magSize: 6, reserve: 24, reloadTime: 2800, spread: 0.08, range: 30, pellets: 6, auto: false },
};

// --- Game State ---
const state = {
  phase: 'title',
  wave: 1,
  kills: 0,
  totalKills: 0,
  waveKillTarget: 5,
  maxBots: 6,
  spawnTimer: 0,
  player: null,
  bots: [],
  bullets: [],
  particles: [],
  killfeed: [],
  damageFlash: 0,
};

// --- Utility ---
function dist2D(x1, z1, x2, z2) {
  const dx = x2 - x1, dz = z2 - z1;
  return Math.sqrt(dx * dx + dz * dz);
}
function angleTo2D(x1, z1, x2, z2) { return Math.atan2(x2 - x1, z2 - z1); }
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

// Circle-vs-tile collision
function moveEntity3D(ent, dx, dz) {
  const r = PLAYER_RADIUS;
  let nx = ent.x + dx;
  let nz = ent.z + dz;
  if (dx !== 0 && isSolidForMove(nx + (dx > 0 ? r : -r), ent.z)) nx = ent.x;
  if (dz !== 0 && isSolidForMove(nx, nz + (dz > 0 ? r : -r))) nz = ent.z;
  ent.x = nx;
  ent.z = nz;
}

// Line-of-sight
function hasLOS(x1, z1, x2, z2) {
  const dx = x2 - x1, dz = z2 - z1;
  const d = Math.sqrt(dx * dx + dz * dz);
  const steps = Math.ceil(d / 1.5);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (isSolidForMove(x1 + dx * t, z1 + dz * t)) return false;
  }
  return true;
}

// --- Bullet tracer system ---
const tracerGeo = new THREE.CylinderGeometry(0.02, 0.02, 1, 4);
tracerGeo.rotateX(Math.PI / 2);
const tracerMatPlayer = new THREE.MeshBasicMaterial({ color: 0xffee88 });
const tracerMatBot = new THREE.MeshBasicMaterial({ color: 0xff8866 });

function createTracer(owner) {
  const mat = owner === 'player' ? tracerMatPlayer : tracerMatBot;
  const mesh = new THREE.Mesh(tracerGeo, mat);
  scene.add(mesh);
  return mesh;
}

// --- Muzzle flash ---
const flashGeo = new THREE.SphereGeometry(0.15, 6, 6);
const flashMat = new THREE.MeshBasicMaterial({ color: 0xffff88, transparent: true, opacity: 0.8 });

function createMuzzleFlash(x, y, z) {
  const mesh = new THREE.Mesh(flashGeo, flashMat);
  mesh.position.set(x, y, z);
  mesh.scale.set(1 + Math.random(), 1 + Math.random(), 1 + Math.random());
  scene.add(mesh);
  return { mesh, life: 0.05 };
}

// --- Particle (hit sparks) ---
const sparkGeo = new THREE.SphereGeometry(0.05, 4, 4);
const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffaa44 });
const bloodMat = new THREE.MeshBasicMaterial({ color: 0xcc3333 });

function spawnSparks(x, y, z, count, isBlood) {
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(sparkGeo, isBlood ? bloodMat : sparkMat);
    mesh.position.set(x, y, z);
    const a = Math.random() * PI2;
    const s = 2 + Math.random() * 4;
    scene.add(mesh);
    state.particles.push({
      mesh,
      vx: Math.cos(a) * s, vy: 2 + Math.random() * 3, vz: Math.sin(a) * s,
      life: 0.3 + Math.random() * 0.3,
    });
  }
}

// --- Player creation ---
function createPlayer() {
  let sx, sz, attempts = 0;
  do {
    sx = (20 + Math.floor(Math.random() * 20)) * TILE + TILE / 2;
    sz = (35 + Math.floor(Math.random() * 15)) * TILE + TILE / 2;
    attempts++;
  } while (isSolidForMove(sx, sz) && attempts < 300);
  if (isSolidForMove(sx, sz)) { sx = 30 * TILE + TILE / 2; sz = 30 * TILE + TILE / 2; }

  const mesh = createSoldierMesh(0x3a6a3a);
  mesh.position.set(sx, 0, sz);
  scene.add(mesh);

  return {
    x: sx, y: 0, z: sz,
    yaw: 0, pitch: 0,
    mesh,
    health: 100, maxHealth: 100,
    weapons: [
      { ...WEAPONS.m4a1, mag: 30, reserveAmmo: 120 },
      { ...WEAPONS.shotgun, mag: 6, reserveAmmo: 24 },
    ],
    weaponIndex: 0,
    lastFire: 0,
    reloading: false,
    reloadStart: 0,
    firing: false,
  };
}

// --- Bot creation ---
function spawnBot() {
  const p = state.player;
  let bx, bz, attempts = 0;
  do {
    bx = (2 + Math.floor(Math.random() * (MAP_W - 4))) * TILE + TILE / 2;
    bz = (2 + Math.floor(Math.random() * (MAP_H - 4))) * TILE + TILE / 2;
    attempts++;
  } while ((isSolidForMove(bx, bz) || dist2D(bx, bz, p.x, p.z) < 30) && attempts < 200);

  const mesh = createSoldierMesh(0x6a3030);
  mesh.position.set(bx, 0, bz);
  scene.add(mesh);

  const waveHP = 40 + state.wave * 10;
  const waveSpeed = 4 + Math.min(state.wave * 0.5, 4);

  return {
    x: bx, y: 0, z: bz,
    yaw: Math.random() * PI2,
    mesh,
    health: Math.min(waveHP, 100),
    maxHealth: Math.min(waveHP, 100),
    speed: waveSpeed,
    weapon: { ...WEAPONS.m4a1, mag: 30, reserveAmmo: 120 },
    lastFire: 0,
    reloading: false,
    reloadStart: 0,
    aiState: 'patrol',
    targetX: bx, targetZ: bz,
    patrolTimer: 0,
    alertTimer: 0,
    sightRange: 40 + state.wave * 3,
    lastSeenX: 0, lastSeenZ: 0,
    stuckTimer: 0, prevX: bx, prevZ: bz,
    strafeDir: Math.random() > 0.5 ? 1 : -1,
    coverTimer: 0,
  };
}

// --- Input ---
const keys = {};
let mouseDown = false;
let mouseDX = 0, mouseDZ = 0;
let isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (isTouch) document.body.classList.add('touch-active');

document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'r' && state.phase === 'playing') startReload();
  if (e.key === '1' || e.key === '2') switchWeapon(parseInt(e.key) - 1);
});
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

let rightMouseDown = false;
let lastMouseX = 0, lastMouseY = 0;
canvas.addEventListener('mousedown', e => {
  if (e.button === 0) mouseDown = true;
  if (e.button === 2) { rightMouseDown = true; lastMouseX = e.clientX; lastMouseY = e.clientY; }
});
canvas.addEventListener('mouseup', e => {
  if (e.button === 0) mouseDown = false;
  if (e.button === 2) rightMouseDown = false;
});
canvas.addEventListener('mousemove', e => {
  if (state.phase !== 'playing') return;
  // Always rotate camera on mouse move (since no pointer lock)
  if (rightMouseDown || mouseDown) {
    mouseDX += e.clientX - lastMouseX;
    mouseDZ += e.clientY - lastMouseY;
  }
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Touch input — dual analog sticks
let joystickDX = 0, joystickDY = 0;
let moveStickId = null, moveStartX = 0, moveStartY = 0;
let aimStickId = null, aimStartX = 0, aimStartY = 0;
let touchFiring = false;

const STICK_RADIUS = 60; // half of .stick-base width
const STICK_MAX = 35;    // max thumb travel in px

const touchLeft = document.getElementById('touch-left');
const touchRight = document.getElementById('touch-right');
const moveBase = document.getElementById('move-base');
const moveThumb = document.getElementById('move-thumb');
const aimBase = document.getElementById('aim-base');
const aimThumb = document.getElementById('aim-thumb');
const fireBtn = document.getElementById('fire-btn');
const reloadBtnEl = document.getElementById('reload-btn');
const weaponSwitchBtn = document.getElementById('weapon-switch-btn');

function updateThumb(thumb, dx, dy) {
  const dist = Math.sqrt(dx * dx + dy * dy);
  const capped = Math.min(dist, STICK_MAX);
  const scale = dist > 0 ? capped / dist : 0;
  const tx = dx * scale;
  const ty = dy * scale;
  thumb.style.transform = 'translate(calc(-50% + ' + tx + 'px), calc(-50% + ' + ty + 'px))';
}

if (isTouch) {
  // Move stick (left side)
  touchLeft.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    moveStickId = t.identifier;
    moveStartX = t.clientX;
    moveStartY = t.clientY;
  }, { passive: false });
  touchLeft.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === moveStickId) {
        const rawDX = t.clientX - moveStartX;
        const rawDY = t.clientY - moveStartY;
        const dist = Math.sqrt(rawDX * rawDX + rawDY * rawDY);
        const clamped = Math.min(dist, STICK_MAX);
        const norm = dist > 0 ? clamped / dist : 0;
        joystickDX = (rawDX * norm) / STICK_MAX;
        joystickDY = (rawDY * norm) / STICK_MAX;
        updateThumb(moveThumb, rawDX, rawDY);
      }
    }
  }, { passive: false });
  touchLeft.addEventListener('touchend', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === moveStickId) {
        moveStickId = null; joystickDX = 0; joystickDY = 0;
        updateThumb(moveThumb, 0, 0);
      }
    }
  });
  touchLeft.addEventListener('touchcancel', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === moveStickId) {
        moveStickId = null; joystickDX = 0; joystickDY = 0;
        updateThumb(moveThumb, 0, 0);
      }
    }
  });

  // Aim stick (right side)
  touchRight.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    aimStickId = t.identifier;
    aimStartX = t.clientX;
    aimStartY = t.clientY;
  }, { passive: false });
  touchRight.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === aimStickId) {
        const dx = t.clientX - aimStartX;
        const dy = t.clientY - aimStartY;
        mouseDX += dx * 0.4;
        mouseDZ += dy * 0.4;
        aimStartX = t.clientX;
        aimStartY = t.clientY;
        // Visual: show displacement from current position
        updateThumb(aimThumb, dx * 2, dy * 2);
      }
    }
  }, { passive: false });
  touchRight.addEventListener('touchend', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === aimStickId) {
        aimStickId = null;
        updateThumb(aimThumb, 0, 0);
      }
    }
  });
  touchRight.addEventListener('touchcancel', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === aimStickId) {
        aimStickId = null;
        updateThumb(aimThumb, 0, 0);
      }
    }
  });

  // Action buttons
  fireBtn.addEventListener('touchstart', e => { e.preventDefault(); touchFiring = true; }, { passive: false });
  fireBtn.addEventListener('touchend', () => { touchFiring = false; });
  fireBtn.addEventListener('touchcancel', () => { touchFiring = false; });
  reloadBtnEl.addEventListener('touchstart', e => { e.preventDefault(); startReload(); }, { passive: false });
  weaponSwitchBtn.addEventListener('touchstart', e => { e.preventDefault(); if (state.player) switchWeapon((state.player.weaponIndex + 1) % state.player.weapons.length); }, { passive: false });
}

// --- Weapon helpers ---
function currentWeapon() { return state.player.weapons[state.player.weaponIndex]; }
function startReload() {
  const p = state.player;
  const w = currentWeapon();
  if (p.reloading || w.mag === w.magSize || w.reserveAmmo <= 0) return;
  p.reloading = true;
  p.reloadStart = performance.now();
  sfxReload();
}
function switchWeapon(idx) {
  const p = state.player;
  if (idx < 0 || idx >= p.weapons.length || idx === p.weaponIndex) return;
  p.weaponIndex = idx;
  p.reloading = false;
}

function fireBullet(owner, w, ox, oy, oz, dirX, dirY, dirZ) {
  const spread = w.spread;
  const dx = dirX + (Math.random() - 0.5) * spread;
  const dy = dirY + (Math.random() - 0.5) * spread * 0.5;
  const dz = dirZ + (Math.random() - 0.5) * spread;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const speed = 120;
  const tracer = createTracer(owner);

  state.bullets.push({
    x: ox, y: oy, z: oz,
    vx: (dx / len) * speed, vy: (dy / len) * speed, vz: (dz / len) * speed,
    damage: w.damage,
    range: w.range,
    traveled: 0,
    owner,
    tracer,
  });
}

// --- Kill feed & banner ---
function addKillFeed(msg) {
  state.killfeed.unshift({ text: msg, time: performance.now() });
  if (state.killfeed.length > 5) state.killfeed.pop();
}
function showBanner(text, dur) {
  const el = document.getElementById('round-banner');
  el.textContent = text;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, dur || 2000);
}

// --- Raycaster for shooting ---
const raycaster = new THREE.Raycaster();

// --- Bot AI ---
function updateBot(bot, dt, now) {
  const p = state.player;
  const d = dist2D(bot.x, bot.z, p.x, p.z);
  const canSee = d < bot.sightRange && hasLOS(bot.x, bot.z, p.x, p.z);

  if (canSee) {
    bot.lastSeenX = p.x;
    bot.lastSeenZ = p.z;
    bot.alertTimer = 5000;
    bot.aiState = d < bot.sightRange * 0.8 ? 'attack' : 'chase';
  } else if (bot.alertTimer > 0) {
    bot.alertTimer -= dt * 1000;
    bot.aiState = 'chase';
  } else {
    bot.aiState = 'patrol';
  }

  // Reload
  if (bot.reloading) {
    if (now - bot.reloadStart > bot.weapon.reloadTime) {
      const need = bot.weapon.magSize - bot.weapon.mag;
      const avail = Math.min(need, bot.weapon.reserveAmmo);
      bot.weapon.mag += avail;
      bot.weapon.reserveAmmo -= avail;
      bot.reloading = false;
    }
    return;
  }
  if (bot.weapon.mag <= 0 && bot.weapon.reserveAmmo > 0) {
    bot.reloading = true;
    bot.reloadStart = now;
    return;
  }

  const spd = bot.speed * dt;

  switch (bot.aiState) {
    case 'patrol': {
      bot.patrolTimer -= dt * 1000;
      if (bot.patrolTimer <= 0 || dist2D(bot.x, bot.z, bot.targetX, bot.targetZ) < 2) {
        bot.targetX = (4 + Math.floor(Math.random() * (MAP_W - 8))) * TILE;
        bot.targetZ = (4 + Math.floor(Math.random() * (MAP_H - 8))) * TILE;
        bot.patrolTimer = 3000 + Math.random() * 4000;
      }
      const ang = Math.atan2(bot.targetX - bot.x, bot.targetZ - bot.z);
      bot.yaw = ang;
      moveEntity3D(bot, Math.sin(ang) * spd * 0.5, Math.cos(ang) * spd * 0.5);
      break;
    }
    case 'chase': {
      const tx = canSee ? p.x : bot.lastSeenX;
      const tz = canSee ? p.z : bot.lastSeenZ;
      const ang = Math.atan2(tx - bot.x, tz - bot.z);
      bot.yaw = ang;
      moveEntity3D(bot, Math.sin(ang) * spd, Math.cos(ang) * spd);
      // Stuck detection
      if (dist2D(bot.x, bot.z, bot.prevX, bot.prevZ) < 0.05) {
        bot.stuckTimer += dt;
        if (bot.stuckTimer > 0.5) {
          const rAng = ang + (Math.random() > 0.5 ? 1 : -1) * Math.PI / 2;
          moveEntity3D(bot, Math.sin(rAng) * spd * 3, Math.cos(rAng) * spd * 3);
          bot.stuckTimer = 0;
        }
      } else { bot.stuckTimer = 0; }
      bot.prevX = bot.x; bot.prevZ = bot.z;
      break;
    }
    case 'attack': {
      const ang = Math.atan2(p.x - bot.x, p.z - bot.z);
      bot.yaw = ang;
      // Strafe
      bot.coverTimer -= dt * 1000;
      if (bot.coverTimer <= 0) { bot.strafeDir *= -1; bot.coverTimer = 800 + Math.random() * 1200; }
      if (d < 20) {
        const sa = ang + bot.strafeDir * Math.PI / 2;
        moveEntity3D(bot, Math.sin(sa) * spd * 0.4, Math.cos(sa) * spd * 0.4);
      } else {
        moveEntity3D(bot, Math.sin(ang) * spd * 0.6, Math.cos(ang) * spd * 0.6);
      }
      // Fire
      const fireDelay = bot.weapon.fireRate * (1.5 + Math.random() * 0.8);
      if (canSee && now - bot.lastFire > fireDelay && bot.weapon.mag > 0) {
        bot.lastFire = now;
        bot.weapon.mag--;
        const gx = bot.x + Math.sin(ang) * 0.8;
        const gz = bot.z + Math.cos(ang) * 0.8;
        const gy = 1.2;
        const dx = p.x - gx, dz = p.z - gz, dy = 1.0 - gy;
        fireBullet('bot', bot.weapon, gx, gy, gz, dx, dy, dz);
        state.particles.push(createMuzzleFlash(gx, gy, gz));
      }
      break;
    }
  }

  // Update mesh
  bot.mesh.position.set(bot.x, 0, bot.z);
  bot.mesh.rotation.y = bot.yaw;
}

// --- Main update ---
function update(dt) {
  const now = performance.now();
  const p = state.player;
  if (!p || state.phase !== 'playing') return;

  // Player movement
  let mx = 0, mz = 0;
  if (isTouch) {
    mx = joystickDX;
    mz = joystickDY;
  } else {
    if (keys['w'] || keys['arrowup']) mz -= 1;
    if (keys['s'] || keys['arrowdown']) mz += 1;
    if (keys['a'] || keys['arrowleft']) mx -= 1;
    if (keys['d'] || keys['arrowright']) mx += 1;
  }
  const mlen = Math.sqrt(mx * mx + mz * mz);
  const speed = 8;
  if (mlen > 0) {
    mx /= mlen; mz /= mlen;
    // Rotate movement by yaw
    const sinY = Math.sin(p.yaw), cosY = Math.cos(p.yaw);
    const fwdX = mx * cosY + mz * sinY;
    const fwdZ = mx * sinY - mz * cosY;
    moveEntity3D(p, fwdX * speed * dt, fwdZ * speed * dt);
  }

  // Camera rotation
  const sensitivity = isTouch ? 0.004 : 0.002;
  p.yaw -= mouseDX * sensitivity;
  p.pitch -= mouseDZ * sensitivity;
  p.pitch = clamp(p.pitch, -0.6, 0.8);
  mouseDX = 0;
  mouseDZ = 0;

  // Update player mesh
  p.mesh.position.set(p.x, 0, p.z);
  p.mesh.rotation.y = p.yaw;

  // Camera: third person behind player
  const camOffX = Math.sin(p.yaw + Math.PI) * CAM_DIST;
  const camOffZ = Math.cos(p.yaw + Math.PI) * CAM_DIST;
  const camY = CAM_HEIGHT - p.pitch * 2;
  camera.position.set(p.x + camOffX, camY, p.z + camOffZ);
  camera.lookAt(p.x, CAM_LOOK_HEIGHT + p.pitch, p.z);

  // Firing
  const w = currentWeapon();
  const firing = isTouch ? touchFiring : mouseDown;
  if (firing && !p.reloading && w.mag > 0 && now - p.lastFire > w.fireRate) {
    p.lastFire = now;
    w.mag--;
    // Shoot from gun barrel in aim direction
    const fwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), p.yaw);
    fwd.y = p.pitch * 0.5;
    fwd.normalize();
    const gx = p.x + fwd.x * 1.2;
    const gy = 1.2;
    const gz = p.z + fwd.z * 1.2;
    const pellets = w.pellets || 1;
    for (let i = 0; i < pellets; i++) {
      fireBullet('player', w, gx, gy, gz, fwd.x, fwd.y, fwd.z);
    }
    state.particles.push(createMuzzleFlash(gx, gy, gz));
    sfxShoot();
    if (!w.auto && !isTouch) mouseDown = false;
  }

  // Auto-reload
  if (w.mag <= 0 && w.reserveAmmo > 0 && !p.reloading) startReload();
  if (p.reloading && now - p.reloadStart > w.reloadTime) {
    const need = w.magSize - w.mag;
    const avail = Math.min(need, w.reserveAmmo);
    w.mag += avail;
    w.reserveAmmo -= avail;
    p.reloading = false;
  }

  // Update bullets
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    const step = dt;
    b.x += b.vx * step;
    b.y += b.vy * step;
    b.z += b.vz * step;
    b.traveled += Math.sqrt((b.vx * step) ** 2 + (b.vy * step) ** 2 + (b.vz * step) ** 2);

    // Update tracer
    b.tracer.position.set(b.x, b.y, b.z);
    b.tracer.lookAt(b.x + b.vx, b.y + b.vy, b.z + b.vz);

    let hit = false;

    // Wall collision
    if (isSolidForMove(b.x, b.z) || b.y < 0 || b.y > 5) {
      spawnSparks(b.x, b.y, b.z, 3, false);
      hit = true;
    }

    // Range
    if (b.traveled > b.range) hit = true;

    // Hit player
    if (!hit && b.owner === 'bot') {
      if (dist2D(b.x, b.z, p.x, p.z) < 0.8 && Math.abs(b.y - 1.0) < 1.2) {
        p.health -= b.damage;
        state.damageFlash = 0.3;
        sfxDamage();
        spawnSparks(b.x, b.y, b.z, 4, true);
        hit = true;
        if (p.health <= 0) { p.health = 0; gameOver(); return; }
      }
    }

    // Hit bots
    if (!hit && b.owner === 'player') {
      for (let j = state.bots.length - 1; j >= 0; j--) {
        const bot = state.bots[j];
        if (dist2D(b.x, b.z, bot.x, bot.z) < 0.8 && Math.abs(b.y - 1.0) < 1.2) {
          bot.health -= b.damage;
          sfxHit();
          spawnSparks(b.x, b.y, b.z, 5, true);
          hit = true;
          // Alert nearby bots
          state.bots.forEach(o => {
            if (dist2D(o.x, o.z, bot.x, bot.z) < 20) {
              o.alertTimer = 5000;
              o.lastSeenX = p.x; o.lastSeenZ = p.z;
            }
          });
          if (bot.health <= 0) {
            sfxKill();
            spawnSparks(bot.x, 1, bot.z, 10, true);
            scene.remove(bot.mesh);
            state.bots.splice(j, 1);
            state.kills++;
            state.totalKills++;
            addKillFeed('Tango eliminated');
          }
          break;
        }
      }
    }

    if (hit) {
      scene.remove(b.tracer);
      state.bullets.splice(i, 1);
    }
  }

  // Update bots
  state.bots.forEach(bot => updateBot(bot, dt, now));

  // Wave spawning
  state.spawnTimer -= dt * 1000;
  if (state.bots.length < state.maxBots && state.kills < state.waveKillTarget && state.spawnTimer <= 0) {
    state.bots.push(spawnBot());
    state.spawnTimer = 2000 - Math.min(state.wave * 100, 1500);
  }

  // Wave complete
  if (state.kills >= state.waveKillTarget && state.bots.length === 0) {
    state.wave++;
    state.kills = 0;
    state.waveKillTarget = 5 + state.wave * 2;
    state.maxBots = Math.min(6 + state.wave, 12);
    p.weapons.forEach(w => { w.reserveAmmo = Math.min(w.reserveAmmo + w.reserve / 2, w.reserve); });
    p.health = Math.min(p.health + 25, p.maxHealth);
    showBanner('WAVE ' + state.wave, 2500);
  }

  // Particles (muzzle flash + sparks)
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const pt = state.particles[i];
    pt.life -= dt;
    if (pt.vx !== undefined) {
      // Spark particle (has velocity)
      pt.mesh.position.x += pt.vx * dt;
      pt.mesh.position.y += pt.vy * dt;
      pt.mesh.position.z += pt.vz * dt;
      pt.vy += GRAVITY * dt;
      if (pt.life <= 0) {
        scene.remove(pt.mesh);
        state.particles.splice(i, 1);
      }
    } else if (pt.mesh) {
      // Muzzle flash (no velocity)
      if (pt.life <= 0) {
        scene.remove(pt.mesh);
        state.particles.splice(i, 1);
      }
    }
  }

  // Damage flash
  if (state.damageFlash > 0) state.damageFlash -= dt * 2;

  // Kill feed cleanup
  state.killfeed = state.killfeed.filter(k => now - k.time < 4000);
}

// --- Minimap ---
const mmCanvas = document.getElementById('minimap');
const mmCtx = mmCanvas.getContext('2d');

function drawMinimap() {
  const p = state.player;
  if (!p) return;
  const mmW = 130, mmH = 130;
  const scale = mmW / (MAP_W * TILE);

  mmCtx.clearRect(0, 0, mmW, mmH);
  mmCtx.fillStyle = 'rgba(0,0,0,0.6)';
  mmCtx.fillRect(0, 0, mmW, mmH);

  mmCtx.fillStyle = 'rgba(100,100,80,0.5)';
  for (let z = 0; z < MAP_H; z++)
    for (let x = 0; x < MAP_W; x++)
      if (map[z][x] === 1)
        mmCtx.fillRect(x * TILE * scale, z * TILE * scale, Math.max(1, TILE * scale), Math.max(1, TILE * scale));

  mmCtx.fillStyle = '#4f4';
  mmCtx.beginPath();
  mmCtx.arc(p.x * scale, p.z * scale, 3, 0, PI2);
  mmCtx.fill();

  mmCtx.strokeStyle = '#4f4';
  mmCtx.lineWidth = 1.5;
  mmCtx.beginPath();
  mmCtx.moveTo(p.x * scale, p.z * scale);
  mmCtx.lineTo(p.x * scale + Math.sin(p.yaw) * 8, p.z * scale + Math.cos(p.yaw) * 8);
  mmCtx.stroke();

  state.bots.forEach(bot => {
    if (dist2D(bot.x, bot.z, p.x, p.z) < 50 || bot.alertTimer > 0) {
      mmCtx.fillStyle = '#f44';
      mmCtx.beginPath();
      mmCtx.arc(bot.x * scale, bot.z * scale, 2, 0, PI2);
      mmCtx.fill();
    }
  });
}

// --- HUD ---
function updateHUD() {
  const p = state.player;
  if (!p) return;
  const w = currentWeapon();
  document.getElementById('health-fill').style.width = p.health + '%';
  document.getElementById('health-text').textContent = Math.ceil(p.health);
  document.getElementById('score-display').textContent = 'KILLS: ' + state.totalKills;
  document.getElementById('wave-display').textContent = 'WAVE ' + state.wave;
  document.getElementById('weapon-name').textContent = w.name;
  document.getElementById('ammo-count').textContent = w.mag;
  document.getElementById('ammo-reserve').textContent = '/ ' + w.reserveAmmo;
  document.getElementById('damage-flash').style.opacity = Math.max(0, state.damageFlash);

  const kf = document.getElementById('killfeed');
  kf.innerHTML = '';
  const now = performance.now();
  state.killfeed.forEach(k => {
    const age = now - k.time;
    const el = document.createElement('div');
    el.className = 'kill-msg';
    el.textContent = k.text;
    el.style.opacity = age > 3000 ? String(1 - (age - 3000) / 1000) : '1';
    kf.appendChild(el);
  });
}

// --- Game over ---
function gameOver() {
  state.phase = 'gameover';
  document.getElementById('game-over').classList.add('active');
  document.getElementById('go-wave').textContent = 'REACHED WAVE ' + state.wave;
  document.getElementById('go-stats').innerHTML = 'TOTAL KILLS: ' + state.totalKills;
}

// --- Start / Restart ---
function startGame() {
  setTimeout(ensureAudio, 100);
  // Cleanup old
  if (state.player) scene.remove(state.player.mesh);
  state.bots.forEach(b => scene.remove(b.mesh));
  state.bullets.forEach(b => scene.remove(b.tracer));
  state.particles.forEach(pt => { if (pt.mesh) scene.remove(pt.mesh); });

  state.phase = 'playing';
  state.wave = 1;
  state.kills = 0;
  state.totalKills = 0;
  state.waveKillTarget = 5;
  state.maxBots = 6;
  state.spawnTimer = 0;
  state.player = createPlayer();
  state.bots = [];
  state.bullets = [];
  state.particles = [];
  state.killfeed = [];
  state.damageFlash = 0;

  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('game-over').classList.remove('active');
  showBanner('WAVE 1', 2500);

  for (let i = 0; i < 3; i++) state.bots.push(spawnBot());

  // Camera controlled via mouse drag (no pointer lock in sandbox)
}

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('start-btn').addEventListener('touchstart', e => { e.preventDefault(); startGame(); }, { passive: false });
document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('touchstart', e => { e.preventDefault(); startGame(); }, { passive: false });

// --- Main loop ---
const clock = new THREE.Clock();
const FIXED_DT = 1 / 60;
let accumulator = 0;

function gameLoop() {
  requestAnimationFrame(gameLoop);
  const delta = Math.min(clock.getDelta(), 0.1);

  if (state.phase === 'playing') {
    accumulator += delta;
    let maxIter = 10;
    while (accumulator >= FIXED_DT && maxIter-- > 0) {
      update(FIXED_DT);
      accumulator -= FIXED_DT;
    }
    if (maxIter <= 0) accumulator = 0;
  }

  renderer.render(scene, camera);

  // Project aim point onto screen for crosshair placement
  if (state.player) {
    const pp = state.player;
    const aimFwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), pp.yaw);
    aimFwd.y = pp.pitch * 0.5;
    aimFwd.normalize();
    // Project a point 40 units ahead of the gun barrel
    const aimPt = new THREE.Vector3(
      pp.x + aimFwd.x * 40,
      1.2 + aimFwd.y * 40,
      pp.z + aimFwd.z * 40
    );
    aimPt.project(camera);
    const ch = document.getElementById('crosshair');
    if (ch) {
      const hw = window.innerWidth / 2;
      const hh = window.innerHeight / 2;
      const sx = (aimPt.x * hw) + hw;
      const sy = -(aimPt.y * hh) + hh;
      ch.style.transform = 'translate3d(' + (sx - 16) + 'px,' + (sy - 16) + 'px,0)';
    }
  }

  drawMinimap();
  updateHUD();
}

requestAnimationFrame(gameLoop);

// --- Testing hooks ---
window.render_game_to_text = function () {
  const p = state.player;
  return JSON.stringify({
    phase: state.phase,
    wave: state.wave,
    kills: state.kills,
    totalKills: state.totalKills,
    player: p ? { x: p.x.toFixed(1), z: p.z.toFixed(1), health: p.health, yaw: p.yaw.toFixed(2) } : null,
    bots: state.bots.map(b => ({ x: b.x.toFixed(1), z: b.z.toFixed(1), health: b.health, state: b.aiState })),
    bullets: state.bullets.length,
  });
};

window.advanceTime = function (ms) {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i++) update(FIXED_DT);
  renderer.render(scene, camera);
};
