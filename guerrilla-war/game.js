// ============================================================
// GUERRILLA WAR - NES-Style Top-Down Run-and-Gun
// ============================================================

// --- CONSTANTS & CONFIG ---
const NATIVE_W = 256;
const NATIVE_H = 240;
const TILE_SIZE = 16;
const COLS = NATIVE_W / TILE_SIZE; // 16
const ROWS = NATIVE_H / TILE_SIZE; // 15
const SCROLL_SPEED = 28; // pixels per second base scroll
const PLAYER_SPEED = 80;
const BULLET_SPEED = 260;
const ENEMY_BULLET_SPEED = 100;
const GRENADE_SPEED = 120;
const MAX_PLAYER_BULLETS = 16;
const MAX_ENEMY_BULLETS = 20;
const MAX_GRENADES = 4;
const MAX_ENEMIES = 20;
const MAX_PARTICLES = 80;
const MAX_PICKUPS = 6;
const MAX_HOSTAGES = 4;

// NES Palette (authentic NES color values)
const PAL = {
  black: '#0f0f0f',
  dkGreen: '#005800', green: '#00a800', ltGreen: '#00e840',
  dkBrown: '#783000', brown: '#a85400', ltBrown: '#c89040',
  dkBlue: '#0000a8', blue: '#0058f8', ltBlue: '#3cbcfc',
  red: '#a80000', ltRed: '#f83800', orange: '#f87858',
  yellow: '#f8d878', white: '#fcfcfc', gray: '#bcbcbc',
  dkGray: '#747474', sand: '#c8a040', skin: '#fca860',
  dkSkin: '#c87418', water: '#0078f8', dkWater: '#0040c0',
  jungle: '#186800', dkJungle: '#004000', ltJungle: '#30b818',
  teal: '#008888', purple: '#6844fc',
};

// --- CANVAS SETUP ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = NATIVE_W;
canvas.height = NATIVE_H;
ctx.imageSmoothingEnabled = false;

let touchVisible = false;
function resizeCanvas() {
  const overlay = document.getElementById('touch-controls');
  touchVisible = overlay && overlay.classList.contains('visible');
  // On touch devices, reserve bottom 180px for controls
  const availH = touchVisible ? window.innerHeight - 170 : window.innerHeight;
  const scaleX = window.innerWidth / NATIVE_W;
  const scaleY = availH / NATIVE_H;
  const scale = Math.max(1, Math.floor(Math.min(scaleX, scaleY)));
  canvas.style.width = (NATIVE_W * scale) + 'px';
  canvas.style.height = (NATIVE_H * scale) + 'px';
  if (touchVisible) {
    // Shift canvas up to make room for controls
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -60%)';
  } else {
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
  }
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// --- SPRITE DATA (pixel art drawn to offscreen canvases) ---
// Each sprite is defined as a small pixel grid using palette colors
// Matching the Guerrilla War NES aesthetic: small 16x16 or 16x24 sprites

function createSpriteCanvas(w, h, pixelData) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const cx = c.getContext('2d');
  for (let y = 0; y < pixelData.length; y++) {
    for (let x = 0; x < pixelData[y].length; x++) {
      if (pixelData[y][x]) {
        cx.fillStyle = pixelData[y][x];
        cx.fillRect(x, y, 1, 1);
      }
    }
  }
  return c;
}

// Player sprite facing up (like Guerrilla War - small soldier, blue/teal outfit)
const B = PAL.blue, T = PAL.teal, S = PAL.skin, K = PAL.black, W = PAL.white;
const Br = PAL.brown, G = PAL.green, R = PAL.red, Y = PAL.yellow, Gr = PAL.gray;
const DG = PAL.dkGreen, LG = PAL.ltGreen, DB = PAL.dkBlue, LB = PAL.ltBlue;
const O = PAL.orange, DR = PAL.dkBrown;

// Player sprites - 16x16 commando in blue outfit (matches the cyan/blue player from screenshots)
const playerUp1 = createSpriteCanvas(16, 16, [
  [0,0,0,0,0,0,S,S,S,S,0,0,0,0,0,0],
  [0,0,0,0,0,S,DG,DG,DG,DG,S,0,0,0,0,0],
  [0,0,0,0,0,S,S,S,S,S,S,0,0,0,0,0],
  [0,0,0,0,0,0,S,S,S,S,0,0,0,0,0,0],
  [0,0,0,0,T,T,T,T,T,T,T,T,0,0,0,0],
  [0,0,0,T,T,T,T,T,T,T,T,T,T,0,0,0],
  [0,0,S,T,T,T,T,T,T,T,T,T,T,S,0,0],
  [0,0,S,0,T,T,T,T,T,T,T,T,0,S,0,0],
  [0,0,0,0,T,T,T,T,T,T,T,T,0,0,0,0],
  [0,0,0,0,0,T,T,T,T,T,T,0,0,0,0,0],
  [0,0,0,0,0,T,T,T,T,T,T,0,0,0,0,0],
  [0,0,0,0,0,T,0,0,0,0,T,0,0,0,0,0],
  [0,0,0,0,DG,DG,0,0,0,0,DG,DG,0,0,0,0],
  [0,0,0,0,DG,DG,0,0,0,0,DG,DG,0,0,0,0],
  [0,0,0,Br,Br,Br,0,0,0,0,Br,Br,Br,0,0,0],
  [0,0,0,Br,Br,0,0,0,0,0,0,Br,Br,0,0,0],
]);

const playerUp2 = createSpriteCanvas(16, 16, [
  [0,0,0,0,0,0,S,S,S,S,0,0,0,0,0,0],
  [0,0,0,0,0,S,DG,DG,DG,DG,S,0,0,0,0,0],
  [0,0,0,0,0,S,S,S,S,S,S,0,0,0,0,0],
  [0,0,0,0,0,0,S,S,S,S,0,0,0,0,0,0],
  [0,0,0,0,T,T,T,T,T,T,T,T,0,0,0,0],
  [0,0,0,T,T,T,T,T,T,T,T,T,T,0,0,0],
  [0,0,S,T,T,T,T,T,T,T,T,T,T,S,0,0],
  [0,0,S,0,T,T,T,T,T,T,T,T,0,S,0,0],
  [0,0,0,0,T,T,T,T,T,T,T,T,0,0,0,0],
  [0,0,0,0,0,T,T,T,T,T,T,0,0,0,0,0],
  [0,0,0,0,0,T,T,T,T,T,T,0,0,0,0,0],
  [0,0,0,0,DG,0,T,0,0,T,0,DG,0,0,0,0],
  [0,0,0,DG,DG,0,0,0,0,0,0,DG,DG,0,0,0],
  [0,0,0,0,Br,Br,0,0,0,0,Br,Br,0,0,0,0],
  [0,0,0,0,Br,0,0,0,0,0,0,Br,0,0,0,0],
  [0,0,0,Br,Br,0,0,0,0,0,0,Br,Br,0,0,0],
]);

const playerDown1 = createSpriteCanvas(16, 16, [
  [0,0,0,0,0,0,DG,DG,DG,DG,0,0,0,0,0,0],
  [0,0,0,0,0,DG,DG,DG,DG,DG,DG,0,0,0,0,0],
  [0,0,0,0,0,S,S,S,S,S,S,0,0,0,0,0],
  [0,0,0,0,0,S,K,S,S,K,S,0,0,0,0,0],
  [0,0,0,0,0,0,S,S,S,S,0,0,0,0,0,0],
  [0,0,0,0,T,T,T,T,T,T,T,T,0,0,0,0],
  [0,0,0,T,T,T,T,T,T,T,T,T,T,0,0,0],
  [0,0,S,T,T,T,T,T,T,T,T,T,T,S,0,0],
  [0,0,S,0,T,T,T,T,T,T,T,T,0,S,0,0],
  [0,0,0,0,T,T,T,T,T,T,T,T,0,0,0,0],
  [0,0,0,0,0,T,T,T,T,T,T,0,0,0,0,0],
  [0,0,0,0,0,T,0,0,0,0,T,0,0,0,0,0],
  [0,0,0,0,DG,DG,0,0,0,0,DG,DG,0,0,0,0],
  [0,0,0,0,DG,DG,0,0,0,0,DG,DG,0,0,0,0],
  [0,0,0,Br,Br,Br,0,0,0,0,Br,Br,Br,0,0,0],
  [0,0,0,Br,Br,0,0,0,0,0,0,Br,Br,0,0,0],
]);

const playerDown2 = createSpriteCanvas(16, 16, [
  [0,0,0,0,0,0,DG,DG,DG,DG,0,0,0,0,0,0],
  [0,0,0,0,0,DG,DG,DG,DG,DG,DG,0,0,0,0,0],
  [0,0,0,0,0,S,S,S,S,S,S,0,0,0,0,0],
  [0,0,0,0,0,S,K,S,S,K,S,0,0,0,0,0],
  [0,0,0,0,0,0,S,S,S,S,0,0,0,0,0,0],
  [0,0,0,0,T,T,T,T,T,T,T,T,0,0,0,0],
  [0,0,0,T,T,T,T,T,T,T,T,T,T,0,0,0],
  [0,0,S,T,T,T,T,T,T,T,T,T,T,S,0,0],
  [0,0,S,0,T,T,T,T,T,T,T,T,0,S,0,0],
  [0,0,0,0,T,T,T,T,T,T,T,T,0,0,0,0],
  [0,0,0,0,0,T,T,T,T,T,T,0,0,0,0,0],
  [0,0,0,0,DG,0,T,0,0,T,0,DG,0,0,0,0],
  [0,0,0,DG,DG,0,0,0,0,0,0,DG,DG,0,0,0],
  [0,0,0,0,Br,Br,0,0,0,0,Br,Br,0,0,0,0],
  [0,0,0,0,Br,0,0,0,0,0,0,Br,0,0,0,0],
  [0,0,0,Br,Br,0,0,0,0,0,0,Br,Br,0,0,0],
]);

// Enemy soldier (green outfit like the original)
const EG = PAL.green, EDG = PAL.dkGreen;
const enemyDown1 = createSpriteCanvas(16, 16, [
  [0,0,0,0,0,0,EG,EG,EG,EG,0,0,0,0,0,0],
  [0,0,0,0,0,EG,EG,EG,EG,EG,EG,0,0,0,0,0],
  [0,0,0,0,0,S,S,S,S,S,S,0,0,0,0,0],
  [0,0,0,0,0,S,K,S,S,K,S,0,0,0,0,0],
  [0,0,0,0,0,0,S,S,S,S,0,0,0,0,0,0],
  [0,0,0,0,EG,EG,EG,EG,EG,EG,EG,EG,0,0,0,0],
  [0,0,0,EG,EG,EG,EG,EG,EG,EG,EG,EG,EG,0,0,0],
  [0,0,S,EG,EG,EG,EG,EG,EG,EG,EG,EG,EG,S,0,0],
  [0,0,S,0,EG,EG,EG,EG,EG,EG,EG,EG,0,S,0,0],
  [0,0,0,0,EG,EG,EG,EG,EG,EG,EG,EG,0,0,0,0],
  [0,0,0,0,0,EG,EG,EG,EG,EG,EG,0,0,0,0,0],
  [0,0,0,0,0,EG,0,0,0,0,EG,0,0,0,0,0],
  [0,0,0,0,EDG,EDG,0,0,0,0,EDG,EDG,0,0,0,0],
  [0,0,0,0,EDG,EDG,0,0,0,0,EDG,EDG,0,0,0,0],
  [0,0,0,Br,Br,Br,0,0,0,0,Br,Br,Br,0,0,0],
  [0,0,0,Br,Br,0,0,0,0,0,0,Br,Br,0,0,0],
]);

const enemyDown2 = createSpriteCanvas(16, 16, [
  [0,0,0,0,0,0,EG,EG,EG,EG,0,0,0,0,0,0],
  [0,0,0,0,0,EG,EG,EG,EG,EG,EG,0,0,0,0,0],
  [0,0,0,0,0,S,S,S,S,S,S,0,0,0,0,0],
  [0,0,0,0,0,S,K,S,S,K,S,0,0,0,0,0],
  [0,0,0,0,0,0,S,S,S,S,0,0,0,0,0,0],
  [0,0,0,0,EG,EG,EG,EG,EG,EG,EG,EG,0,0,0,0],
  [0,0,0,EG,EG,EG,EG,EG,EG,EG,EG,EG,EG,0,0,0],
  [0,0,S,EG,EG,EG,EG,EG,EG,EG,EG,EG,EG,S,0,0],
  [0,0,S,0,EG,EG,EG,EG,EG,EG,EG,EG,0,S,0,0],
  [0,0,0,0,EG,EG,EG,EG,EG,EG,EG,EG,0,0,0,0],
  [0,0,0,0,0,EG,EG,EG,EG,EG,EG,0,0,0,0,0],
  [0,0,0,0,EDG,0,EG,0,0,EG,0,EDG,0,0,0,0],
  [0,0,0,EDG,EDG,0,0,0,0,0,0,EDG,EDG,0,0,0],
  [0,0,0,0,Br,Br,0,0,0,0,Br,Br,0,0,0,0],
  [0,0,0,0,Br,0,0,0,0,0,0,Br,0,0,0,0],
  [0,0,0,Br,Br,0,0,0,0,0,0,Br,Br,0,0,0],
]);

// Red enemy (drops powerups)
const RE = PAL.ltRed, DRE = PAL.red;
const enemyRedDown1 = createSpriteCanvas(16, 16, [
  [0,0,0,0,0,0,RE,RE,RE,RE,0,0,0,0,0,0],
  [0,0,0,0,0,RE,RE,RE,RE,RE,RE,0,0,0,0,0],
  [0,0,0,0,0,S,S,S,S,S,S,0,0,0,0,0],
  [0,0,0,0,0,S,K,S,S,K,S,0,0,0,0,0],
  [0,0,0,0,0,0,S,S,S,S,0,0,0,0,0,0],
  [0,0,0,0,RE,RE,RE,RE,RE,RE,RE,RE,0,0,0,0],
  [0,0,0,RE,RE,RE,RE,RE,RE,RE,RE,RE,RE,0,0,0],
  [0,0,S,RE,RE,RE,RE,RE,RE,RE,RE,RE,RE,S,0,0],
  [0,0,S,0,RE,RE,RE,RE,RE,RE,RE,RE,0,S,0,0],
  [0,0,0,0,RE,RE,RE,RE,RE,RE,RE,RE,0,0,0,0],
  [0,0,0,0,0,RE,RE,RE,RE,RE,RE,0,0,0,0,0],
  [0,0,0,0,0,RE,0,0,0,0,RE,0,0,0,0,0],
  [0,0,0,0,DRE,DRE,0,0,0,0,DRE,DRE,0,0,0,0],
  [0,0,0,0,DRE,DRE,0,0,0,0,DRE,DRE,0,0,0,0],
  [0,0,0,Br,Br,Br,0,0,0,0,Br,Br,Br,0,0,0],
  [0,0,0,Br,Br,0,0,0,0,0,0,Br,Br,0,0,0],
]);

// Hostage (civilian in white)
const hostageSprite = createSpriteCanvas(16, 16, [
  [0,0,0,0,0,0,S,S,S,S,0,0,0,0,0,0],
  [0,0,0,0,0,S,K,S,S,K,S,0,0,0,0,0],
  [0,0,0,0,0,S,S,S,S,S,S,0,0,0,0,0],
  [0,0,0,0,0,0,S,S,S,S,0,0,0,0,0,0],
  [0,0,0,0,W,W,W,W,W,W,W,W,0,0,0,0],
  [0,0,0,W,W,W,W,W,W,W,W,W,W,0,0,0],
  [0,0,S,W,W,W,W,W,W,W,W,W,W,S,0,0],
  [0,0,S,0,W,W,W,W,W,W,W,W,0,S,0,0],
  [0,0,0,0,W,W,W,W,W,W,W,W,0,0,0,0],
  [0,0,0,0,0,W,W,W,W,W,W,0,0,0,0,0],
  [0,0,0,0,0,W,W,W,W,W,W,0,0,0,0,0],
  [0,0,0,0,0,Br,0,0,0,0,Br,0,0,0,0,0],
  [0,0,0,0,Br,Br,0,0,0,0,Br,Br,0,0,0,0],
  [0,0,0,0,Br,Br,0,0,0,0,Br,Br,0,0,0,0],
  [0,0,0,K,K,K,0,0,0,0,K,K,K,0,0,0],
  [0,0,0,K,K,0,0,0,0,0,0,K,K,0,0,0],
]);

// Tank sprite (player rideable tank - olive/dark green)
const TK = PAL.dkGray, TG = PAL.dkGreen, TL = PAL.gray;
const tankSprite = createSpriteCanvas(24, 24, [
  [0,0,0,0,0,0,0,0,0,TG,TG,TG,TG,TG,TG,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,TG,TG,TG,TG,TG,TG,TG,TG,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,0,0,0,0,0,0,0],
  [0,0,0,0,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,0,0,0,0],
  [0,0,0,TK,TK,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TK,TK,0,0,0],
  [0,0,TK,TK,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TK,TK,0,0],
  [0,0,TK,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TK,0,0],
  [0,TK,TK,TG,TG,TG,TG,TL,TL,TG,TG,TG,TG,TL,TL,TG,TG,TG,TG,TG,TG,TK,TK,0],
  [0,TK,TG,TG,TG,TG,TL,TL,TL,TL,TG,TG,TL,TL,TL,TL,TG,TG,TG,TG,TG,TG,TK,0],
  [0,TK,TG,TG,TG,TG,TL,TL,TL,TL,TG,TG,TL,TL,TL,TL,TG,TG,TG,TG,TG,TG,TK,0],
  [0,TK,TG,TG,TG,TG,TG,TL,TL,TG,TG,TG,TG,TL,TL,TG,TG,TG,TG,TG,TG,TG,TK,0],
  [0,TK,TK,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TK,TK,0],
  [0,0,TK,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TK,0,0],
  [0,0,TK,TK,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TK,TK,0,0],
  [0,0,0,TK,TK,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TK,TK,0,0,0],
  [0,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,0],
  [TK,TL,TK,TL,TK,TL,TK,TL,TK,TL,TK,TL,TK,TL,TK,TL,TK,TL,TK,TL,TK,TL,TK,TL],
  [TK,TK,TL,TK,TK,TL,TK,TK,TL,TK,TK,TL,TK,TK,TL,TK,TK,TL,TK,TK,TL,TK,TK,TL],
  [TK,TL,TK,TL,TK,TL,TK,TL,TK,TL,TK,TL,TK,TL,TK,TL,TK,TL,TK,TL,TK,TL,TK,TL],
  [0,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,TK,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
]);

// Enemy tank (darker, enemy colored)
const ET = PAL.dkGray, ETG = PAL.dkJungle, ETL = PAL.gray;
const enemyTankSprite = createSpriteCanvas(24, 24, [
  [0,0,0,0,0,0,0,0,0,ET,ET,ET,ET,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,ET,ET,ET,ET,ET,ET,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,ET,ET,ET,ET,ET,ET,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,0,0,0,0],
  [0,0,0,ET,ET,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ET,ET,0,0,0],
  [0,0,ET,ET,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ET,ET,0,0],
  [0,0,ET,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ET,0,0],
  [0,ET,ET,ETG,ETG,ETG,ETG,ETL,ETL,ETG,ETG,ETG,ETG,ETL,ETL,ETG,ETG,ETG,ETG,ETG,ETG,ET,ET,0],
  [0,ET,ETG,ETG,ETG,ETG,ETL,ETL,ETL,ETL,ETG,ETG,ETL,ETL,ETL,ETL,ETG,ETG,ETG,ETG,ETG,ETG,ET,0],
  [0,ET,ETG,ETG,ETG,ETG,ETL,ETL,ETL,ETL,ETG,ETG,ETL,ETL,ETL,ETL,ETG,ETG,ETG,ETG,ETG,ETG,ET,0],
  [0,ET,ETG,ETG,ETG,ETG,ETG,ETL,ETL,ETG,ETG,ETG,ETG,ETL,ETL,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ET,0],
  [0,ET,ET,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ET,ET,0],
  [0,0,ET,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ET,0,0],
  [0,0,ET,ET,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ET,ET,0,0],
  [0,0,0,ET,ET,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ETG,ET,ET,0,0,0],
  [0,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,0],
  [ET,ETL,ET,ETL,ET,ETL,ET,ETL,ET,ETL,ET,ETL,ET,ETL,ET,ETL,ET,ETL,ET,ETL,ET,ETL,ET,ETL],
  [ET,ET,ETL,ET,ET,ETL,ET,ET,ETL,ET,ET,ETL,ET,ET,ETL,ET,ET,ETL,ET,ET,ETL,ET,ET,ETL],
  [ET,ETL,ET,ETL,ET,ETL,ET,ETL,ET,ETL,ET,ETL,ET,ETL,ET,ETL,ET,ETL,ET,ETL,ET,ETL,ET,ETL],
  [0,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,ET,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
]);

// Powerup icons (small 12x12 boxes with letters)
function createPowerupSprite(letter, bgColor) {
  const c = document.createElement('canvas');
  c.width = 12; c.height = 12;
  const cx = c.getContext('2d');
  cx.fillStyle = bgColor;
  cx.fillRect(0, 0, 12, 12);
  cx.fillStyle = PAL.black;
  cx.fillRect(1, 1, 10, 10);
  cx.fillStyle = bgColor;
  cx.fillRect(2, 2, 8, 8);
  cx.fillStyle = PAL.white;
  cx.font = 'bold 8px monospace';
  cx.textAlign = 'center';
  cx.textBaseline = 'middle';
  cx.fillText(letter, 6, 7);
  return c;
}

const powerupSprites = {
  S: createPowerupSprite('S', PAL.blue),
  F: createPowerupSprite('F', PAL.ltRed),
  L: createPowerupSprite('L', PAL.green),
  B: createPowerupSprite('B', PAL.yellow),
  C: createPowerupSprite('C', PAL.purple),
  life: createPowerupSprite('1', PAL.orange),
};

// Palm tree tile (24x32 sprite to match the game's iconic palm trees)
const PT = PAL.dkBrown, PL = PAL.green, PD = PAL.dkGreen;
const palmTreeSprite = createSpriteCanvas(24, 32, [
  [0,0,0,0,0,0,0,0,PD,PL,PL,PD,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,PD,PL,PL,PL,PL,PL,PL,PL,PL,PD,0,0,0,0,0,0,0,0,0],
  [0,0,0,PD,PL,PL,PL,PL,PL,PL,PL,PL,PL,PL,PL,PL,PD,0,0,0,0,0,0,0],
  [0,0,PD,PL,PL,PL,PD,PL,PL,PL,PL,PL,PL,PD,PL,PL,PL,PD,0,0,0,0,0,0],
  [0,PD,PL,PL,PD,0,0,PD,PL,PL,PL,PL,PD,0,0,PD,PL,PL,PD,0,0,0,0,0],
  [PD,PL,PL,PD,0,0,0,PD,PL,PL,PL,PL,PD,0,0,0,PD,PL,PL,PD,0,0,0,0],
  [PD,PL,PD,0,0,0,0,0,PD,PL,PL,PD,0,0,0,0,0,PD,PL,PD,0,0,0,0],
  [PD,PD,0,0,0,0,0,0,PD,PL,PL,PD,0,0,0,0,0,0,PD,PD,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,PD,PD,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,PT,PT,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,PT,PT,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,PT,PT,PT,PT,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,PT,PT,PT,PT,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,PT,PT,PT,PT,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,PT,PT,PT,PT,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,PT,PT,PT,PT,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,PT,PT,PT,PT,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,PT,PT,PT,PT,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,PT,PT,PT,PT,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,PT,PT,PT,PT,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,PT,PT,PT,PT,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,PT,PT,PT,PT,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,PT,PT,PT,PT,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,PT,PT,PT,PT,PT,PT,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,PT,PT,PT,PT,PT,PT,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
]);

// --- PLAYER SPRITE SETS ---
const playerSprites = {
  up: [playerUp1, playerUp2],
  down: [playerDown1, playerDown2],
  left: [playerUp1, playerUp2],   // we'll flip
  right: [playerUp1, playerUp2],  // we'll flip
};

const enemySprites = {
  green: [enemyDown1, enemyDown2],
  red: [enemyRedDown1, enemyRedDown1],
};

// --- AUDIO (procedural NES-style sounds) ---
let audioCtx = null;
let musicGain = null;
let sfxGain = null;
let musicPlaying = false;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new AudioContext();
  musicGain = audioCtx.createGain();
  musicGain.gain.value = 0.15;
  musicGain.connect(audioCtx.destination);
  sfxGain = audioCtx.createGain();
  sfxGain.gain.value = 0.25;
  sfxGain.connect(audioCtx.destination);
}

function playTone(freq, duration, type = 'square', dest = sfxGain, detune = 0) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(dest);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playShoot() { playTone(800, 0.05, 'square'); playTone(400, 0.03, 'square'); }
function playExplosion() {
  if (!audioCtx) return;
  const bufferSize = audioCtx.sampleRate * 0.3;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  src.connect(gain);
  gain.connect(sfxGain);
  src.start();
}
function playGrenade() { playTone(200, 0.15, 'sawtooth'); }
function playPickup() { playTone(660, 0.05); playTone(880, 0.1); }
function playHostage() { playTone(523, 0.08); playTone(659, 0.08); playTone(784, 0.12); }
function playDeath() { playTone(300, 0.1, 'sawtooth'); playTone(150, 0.2, 'sawtooth'); }
function playTankHit() { playTone(100, 0.15, 'sawtooth'); }

// NES-style background music loop
let musicInterval = null;
const musicNotes = [
  // March/action melody in NES style
  [262, 0.12], [330, 0.12], [392, 0.12], [523, 0.24],
  [392, 0.12], [330, 0.12], [262, 0.12], [294, 0.24],
  [330, 0.12], [392, 0.12], [440, 0.12], [392, 0.24],
  [330, 0.12], [294, 0.12], [262, 0.12], [262, 0.24],
  [392, 0.12], [440, 0.12], [523, 0.12], [587, 0.24],
  [523, 0.12], [440, 0.12], [392, 0.12], [440, 0.24],
  [523, 0.12], [587, 0.12], [659, 0.12], [523, 0.24],
  [440, 0.12], [392, 0.12], [330, 0.12], [294, 0.24],
];

function startMusic() {
  if (musicPlaying) return;
  musicPlaying = true;
  let noteIdx = 0;
  let nextNoteTime = audioCtx.currentTime;
  
  function scheduleNotes() {
    while (nextNoteTime < audioCtx.currentTime + 0.2) {
      const [freq, dur] = musicNotes[noteIdx % musicNotes.length];
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, nextNoteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, nextNoteTime + dur * 0.9);
      osc.connect(gain);
      gain.connect(musicGain);
      osc.start(nextNoteTime);
      osc.stop(nextNoteTime + dur);
      
      // Bass line
      const bass = audioCtx.createOscillator();
      const bassGain = audioCtx.createGain();
      bass.type = 'triangle';
      bass.frequency.value = freq / 4;
      bassGain.gain.setValueAtTime(0.1, nextNoteTime);
      bassGain.gain.exponentialRampToValueAtTime(0.001, nextNoteTime + dur * 0.8);
      bass.connect(bassGain);
      bassGain.connect(musicGain);
      bass.start(nextNoteTime);
      bass.stop(nextNoteTime + dur);
      
      nextNoteTime += dur;
      noteIdx++;
    }
  }
  
  musicInterval = setInterval(scheduleNotes, 100);
  scheduleNotes();
}

// --- INPUT ---
const Input = {
  keys: {},
  justPressed: {},
  init() {
    document.addEventListener('keydown', (e) => {
      e.preventDefault();
      if (!this.keys[e.code]) this.justPressed[e.code] = true;
      this.keys[e.code] = true;
    });
    document.addEventListener('keyup', (e) => {
      e.preventDefault();
      this.keys[e.code] = false;
    });
  },
  endFrame() { this.justPressed = {}; },
  isDown(code) { return !!this.keys[code]; },
  wasPressed(code) { return !!this.justPressed[code]; },
};
Input.init();

// --- TOUCH CONTROLS ---
(function initTouchControls() {
  const overlay = document.getElementById('touch-controls');
  if (!overlay) return;

  // Detect touch-capable device and show overlay
  let isTouchDevice = false;
  function showTouch() {
    if (isTouchDevice) return;
    isTouchDevice = true;
    overlay.classList.add('visible');
    resizeCanvas(); // re-layout for touch
  }
  window.addEventListener('touchstart', showTouch, { once: true, passive: true });
  // Also detect on pointer if it's coarse (phone/tablet)
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) showTouch();

  // Track which touch IDs are on which buttons
  const touchMap = new Map(); // touchId -> data-key

  function keyForTouch(touch) {
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el) return null;
    const btn = el.closest('[data-key]');
    return btn ? btn.dataset.key : null;
  }

  function pressKey(code) {
    if (code && !Input.keys[code]) Input.justPressed[code] = true;
    if (code) Input.keys[code] = true;
  }
  function releaseKey(code) {
    if (code) Input.keys[code] = false;
  }

  function setActive(code, on) {
    const el = overlay.querySelector('[data-key="' + code + '"]');
    if (el) el.classList.toggle('active', on);
  }

  overlay.addEventListener('touchstart', (e) => {
    e.preventDefault();
    // Also init audio on first touch (mobile Safari requirement)
    initAudio();
    for (const t of e.changedTouches) {
      const key = keyForTouch(t);
      if (key) {
        touchMap.set(t.identifier, key);
        pressKey(key);
        setActive(key, true);
      }
    }
  }, { passive: false });

  overlay.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const oldKey = touchMap.get(t.identifier);
      const newKey = keyForTouch(t);
      if (oldKey !== newKey) {
        // Finger slid off one button onto another
        if (oldKey) { releaseKey(oldKey); setActive(oldKey, false); }
        if (newKey) { pressKey(newKey); setActive(newKey, true); touchMap.set(t.identifier, newKey); }
        else { touchMap.delete(t.identifier); }
      }
    }
  }, { passive: false });

  function handleTouchEnd(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const key = touchMap.get(t.identifier);
      if (key) { releaseKey(key); setActive(key, false); }
      touchMap.delete(t.identifier);
    }
  }
  overlay.addEventListener('touchend', handleTouchEnd, { passive: false });
  overlay.addEventListener('touchcancel', handleTouchEnd, { passive: false });

  // Also let tapping on the canvas itself start/shoot (for title screen tap-to-start)
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    initAudio();
    if (gameState === STATE.TITLE || gameState === STATE.VICTORY) {
      if (!Input.keys['Enter']) Input.justPressed['Enter'] = true;
      Input.keys['Enter'] = true;
      setTimeout(() => { Input.keys['Enter'] = false; }, 100);
    }
  }, { passive: false });
})();

// --- GAME STATE ---
const STATE = {
  TITLE: 0,
  PLAYING: 1,
  GAMEOVER: 2,
  VICTORY: 3,
  PAUSED: 4,
};

let gameState = STATE.TITLE;
let score = 0;
let lives = 4;
let currentWeapon = 'standard'; // standard, spread, flame, launcher
let weaponName = 'MACHINE GUN';
let continues = 0;

// Player
let player = {
  x: NATIVE_W / 2 - 8,
  y: NATIVE_H - 40,
  w: 16, h: 16,
  dir: 'up',
  animFrame: 0,
  animTimer: 0,
  invincible: 0,
  inTank: false,
  tankHP: 0,
  shootCooldown: 0,
  grenadeCooldown: 0,
  alive: true,
};

// Scrolling
let scrollY = 0;
let totalScrolled = 0;
const LEVEL_LENGTH = 3200; // pixels total to scroll through

// Object pools
let bullets = [];
let enemyBullets = [];
let grenades = [];
let enemies = [];
let particles = [];
let pickups = [];
let hostages = [];
let tanks = []; // rideable tanks
let obstacles = []; // trees, rocks etc
let bosses = [];

// Spawn timers
let enemySpawnTimer = 0;
let enemySpawnRate = 2.0; // seconds between spawns
let waveNum = 0;
let bossSpawned = false;
let bossDefeated = false;
let stageNum = 1;

// --- TERRAIN GENERATION ---
// Generate a scrolling jungle terrain using NES-style tiles
const terrainBuffer = document.createElement('canvas');
terrainBuffer.width = NATIVE_W;
terrainBuffer.height = LEVEL_LENGTH + NATIVE_H;
const tCtx = terrainBuffer.getContext('2d');

function generateTerrain() {
  // Base ground color (sandy/dirt like the screenshots)
  tCtx.fillStyle = PAL.ltBrown;
  tCtx.fillRect(0, 0, terrainBuffer.width, terrainBuffer.height);
  
  // Add terrain variation
  for (let y = 0; y < terrainBuffer.height; y += TILE_SIZE) {
    for (let x = 0; x < terrainBuffer.width; x += TILE_SIZE) {
      const r = Math.random();
      if (r < 0.15) {
        tCtx.fillStyle = PAL.brown;
        tCtx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      } else if (r < 0.25) {
        tCtx.fillStyle = PAL.sand;
        tCtx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      } else if (r < 0.30) {
        tCtx.fillStyle = PAL.dkBrown;
        tCtx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      }
      // Add dirt texture dots
      if (Math.random() < 0.3) {
        tCtx.fillStyle = PAL.dkBrown;
        tCtx.fillRect(x + Math.floor(Math.random()*14), y + Math.floor(Math.random()*14), 2, 2);
      }
    }
  }
  
  // Roads (horizontal and vertical paths)
  for (let seg = 0; seg < 8; seg++) {
    const roadY = seg * 400 + 100;
    tCtx.fillStyle = PAL.dkGray;
    tCtx.fillRect(0, roadY, NATIVE_W, 24);
    tCtx.fillStyle = PAL.gray;
    for (let dx = 0; dx < NATIVE_W; dx += 16) {
      tCtx.fillRect(dx + 4, roadY + 10, 8, 4);
    }
  }
  
  // Water sections
  for (let seg = 0; seg < 3; seg++) {
    const waterY = seg * 1000 + 600;
    tCtx.fillStyle = PAL.dkWater;
    tCtx.fillRect(60, waterY, 136, 48);
    tCtx.fillStyle = PAL.water;
    tCtx.fillRect(64, waterY + 4, 128, 40);
    // Bridge
    tCtx.fillStyle = PAL.brown;
    tCtx.fillRect(112, waterY - 4, 32, 56);
    tCtx.fillStyle = PAL.dkBrown;
    tCtx.fillRect(114, waterY - 2, 28, 52);
  }
  
  // Add palm trees along edges (decorative obstacles)
  obstacles = [];
  for (let ty = 0; ty < terrainBuffer.height; ty += 80) {
    // Left side palms
    if (Math.random() < 0.7) {
      const tx = Math.random() * 40;
      obstacles.push({ x: tx, y: ty, w: 24, h: 32, type: 'palm' });
      tCtx.drawImage(palmTreeSprite, tx, ty);
    }
    // Right side palms
    if (Math.random() < 0.7) {
      const tx = NATIVE_W - 40 + Math.random() * 20;
      obstacles.push({ x: tx, y: ty, w: 24, h: 32, type: 'palm' });
      tCtx.drawImage(palmTreeSprite, tx, ty);
    }
    // Occasional middle obstacles
    if (Math.random() < 0.2) {
      const tx = 60 + Math.random() * 136;
      obstacles.push({ x: tx, y: ty, w: 24, h: 32, type: 'palm' });
      tCtx.drawImage(palmTreeSprite, tx, ty);
    }
  }
  
  // Fortress/bunker sections
  for (let seg = 0; seg < 4; seg++) {
    const fY = seg * 800 + 400;
    tCtx.fillStyle = PAL.dkGray;
    tCtx.fillRect(80, fY, 96, 48);
    tCtx.fillStyle = PAL.gray;
    tCtx.fillRect(84, fY + 4, 88, 40);
    tCtx.fillStyle = PAL.dkGray;
    tCtx.fillRect(108, fY - 8, 40, 12);
    // "FORTRESS" text
    tCtx.fillStyle = PAL.white;
    tCtx.font = '8px monospace';
    tCtx.textAlign = 'center';
    tCtx.fillText('FORTRESS', 128, fY + 26);
    obstacles.push({ x: 80, y: fY, w: 96, h: 48, type: 'fortress' });
  }
}

// --- ENTITY HELPERS ---
function spawnBullet(x, y, dx, dy, isPlayer) {
  const arr = isPlayer ? bullets : enemyBullets;
  const max = isPlayer ? MAX_PLAYER_BULLETS : MAX_ENEMY_BULLETS;
  if (arr.length >= max) return;
  const speed = isPlayer ? BULLET_SPEED : ENEMY_BULLET_SPEED;
  const len = Math.sqrt(dx*dx + dy*dy) || 1;
  arr.push({
    x: x - 2, y: y - 2, w: 4, h: 4,
    vx: (dx/len) * speed,
    vy: (dy/len) * speed,
    life: 2.0,
    type: isPlayer ? currentWeapon : 'standard',
  });
}

function spawnGrenade(x, y, dir) {
  if (grenades.length >= MAX_GRENADES) return;
  let vx = 0, vy = -GRENADE_SPEED;
  if (dir === 'down') vy = GRENADE_SPEED;
  if (dir === 'left') { vx = -GRENADE_SPEED; vy = -40; }
  if (dir === 'right') { vx = GRENADE_SPEED; vy = -40; }
  grenades.push({
    x, y, w: 6, h: 6,
    vx, vy,
    life: 0.8,
    bounceTimer: 0,
  });
  playGrenade();
}

function spawnParticle(x, y, color, count = 5) {
  for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 120,
      vy: (Math.random() - 0.5) * 120,
      life: 0.3 + Math.random() * 0.3,
      maxLife: 0.6,
      color,
      size: 1 + Math.random() * 3,
    });
  }
}

function spawnExplosion(x, y) {
  spawnParticle(x, y, PAL.yellow, 8);
  spawnParticle(x, y, PAL.orange, 6);
  spawnParticle(x, y, PAL.ltRed, 4);
  spawnParticle(x, y, PAL.white, 2);
  playExplosion();
}

function spawnEnemy(type = 'soldier') {
  if (enemies.length >= MAX_ENEMIES) return;
  const side = Math.random();
  let x, y;
  // Spawn mostly from the top (like Guerrilla War scrolling downward toward player)
  if (side < 0.7) {
    // Spawn from top, spread across screen but biased toward player
    const spread = 60;
    x = player.x + (Math.random() - 0.5) * NATIVE_W * 0.8;
    x = Math.max(16, Math.min(NATIVE_W - 32, x));
    y = -16;
  } else if (side < 0.85) {
    x = -16;
    y = Math.random() * NATIVE_H * 0.4;
  } else {
    x = NATIVE_W;
    y = Math.random() * NATIVE_H * 0.4;
  }
  
  const isRed = Math.random() < 0.2;
  
  if (type === 'tank') {
    enemies.push({
      x, y, w: 24, h: 24,
      type: 'tank',
      hp: 8,
      speed: 20 + Math.random() * 15,
      shootTimer: 1 + Math.random() * 2,
      animFrame: 0,
      animTimer: 0,
      dir: 'down',
      behavior: 'advance',
    });
  } else {
    enemies.push({
      x, y, w: 16, h: 16,
      type: 'soldier',
      isRed,
      hp: 1,
      speed: 30 + Math.random() * 30,
      shootTimer: 1 + Math.random() * 3,
      animFrame: 0,
      animTimer: 0,
      dir: 'down',
      behavior: Math.random() < 0.3 ? 'rush' : (Math.random() < 0.5 ? 'strafe' : 'advance'),
    });
  }
}

function spawnHostage() {
  if (hostages.length >= MAX_HOSTAGES) return;
  hostages.push({
    x: 40 + Math.random() * (NATIVE_W - 80),
    y: -20,
    w: 16, h: 16,
    freed: false,
    runTimer: 0,
    vy: 0,
  });
}

function spawnPickup(x, y) {
  if (pickups.length >= MAX_PICKUPS) return;
  const types = ['S', 'F', 'L', 'B', 'C', 'life'];
  const type = types[Math.floor(Math.random() * types.length)];
  pickups.push({ x, y, w: 12, h: 12, type, life: 8 });
}

function spawnRideableTank() {
  if (tanks.length >= 2) return;
  tanks.push({
    x: 40 + Math.random() * (NATIVE_W - 80),
    y: -30,
    w: 24, h: 24,
    flashTimer: 0,
    active: true,
  });
}

// Boss
function spawnBoss() {
  if (bossSpawned) return;
  bossSpawned = true;
  bosses.push({
    x: NATIVE_W / 2 - 20,
    y: -40,
    w: 40, h: 40,
    hp: 30,
    maxHP: 30,
    speed: 15,
    shootTimer: 0,
    phase: 0,
    moveDir: 1,
    type: 'boss',
  });
}

// --- COLLISION ---
function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// --- UPDATE ---
function update(dt) {
  if (gameState === STATE.TITLE) {
    if (Input.wasPressed('Space') || Input.wasPressed('Enter')) {
      gameState = STATE.PLAYING;
      initAudio();
      startMusic();
      resetGame();
    }
    return;
  }
  
  if (gameState === STATE.PAUSED) {
    if (Input.wasPressed('Escape') || Input.wasPressed('KeyP')) {
      gameState = STATE.PLAYING;
    }
    return;
  }
  
  if (gameState === STATE.VICTORY) {
    if (Input.wasPressed('Space') || Input.wasPressed('Enter')) {
      gameState = STATE.TITLE;
    }
    return;
  }
  
  // Pause
  if (Input.wasPressed('Escape') || Input.wasPressed('KeyP')) {
    gameState = STATE.PAUSED;
    return;
  }
  
  // Scroll
  scrollY += SCROLL_SPEED * dt;
  totalScrolled += SCROLL_SPEED * dt;
  
  // Check victory
  if (totalScrolled >= LEVEL_LENGTH && !bossSpawned) {
    spawnBoss();
    // Stop scrolling during boss
  }
  if (bossSpawned && !bossDefeated) {
    scrollY -= SCROLL_SPEED * dt;
    totalScrolled -= SCROLL_SPEED * dt;
  }
  if (bossDefeated && bosses.length === 0) {
    gameState = STATE.VICTORY;
    return;
  }
  
  // Player movement
  if (player.alive) {
    let dx = 0, dy = 0;
    if (Input.isDown('ArrowUp') || Input.isDown('KeyW')) { dy = -1; player.dir = 'up'; }
    if (Input.isDown('ArrowDown') || Input.isDown('KeyS')) { dy = 1; player.dir = 'down'; }
    if (Input.isDown('ArrowLeft') || Input.isDown('KeyA')) { dx = -1; player.dir = 'left'; }
    if (Input.isDown('ArrowRight') || Input.isDown('KeyD')) { dx = 1; player.dir = 'right'; }
    
    // Diagonal direction
    if (dx !== 0 && dy !== 0) {
      if (dy < 0 && dx < 0) player.dir = 'upleft';
      else if (dy < 0 && dx > 0) player.dir = 'upright';
      else if (dy > 0 && dx < 0) player.dir = 'downleft';
      else if (dy > 0 && dx > 0) player.dir = 'downright';
    }
    
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }
    
    const speed = player.inTank ? PLAYER_SPEED * 0.7 : PLAYER_SPEED;
    player.x += dx * speed * dt;
    player.y += dy * speed * dt;
    
    // Clamp to screen
    player.x = Math.max(8, Math.min(NATIVE_W - player.w - 8, player.x));
    player.y = Math.max(8, Math.min(NATIVE_H - player.h - 8, player.y));
    
    // Animation
    if (dx !== 0 || dy !== 0) {
      player.animTimer += dt;
      if (player.animTimer > 0.15) {
        player.animTimer = 0;
        player.animFrame = (player.animFrame + 1) % 2;
      }
    }
    
    // Shooting
    player.shootCooldown -= dt;
    if ((Input.isDown('KeyZ') || Input.isDown('KeyJ') || Input.isDown('Space')) && player.shootCooldown <= 0) {
      const cx = player.x + player.w / 2;
      const cy = player.y + player.h / 2;
      let sdx = 0, sdy = -1;
      switch (player.dir) {
        case 'up': sdx = 0; sdy = -1; break;
        case 'down': sdx = 0; sdy = 1; break;
        case 'left': sdx = -1; sdy = 0; break;
        case 'right': sdx = 1; sdy = 0; break;
        case 'upleft': sdx = -0.707; sdy = -0.707; break;
        case 'upright': sdx = 0.707; sdy = -0.707; break;
        case 'downleft': sdx = -0.707; sdy = 0.707; break;
        case 'downright': sdx = 0.707; sdy = 0.707; break;
      }
      
      if (currentWeapon === 'spread') {
        const angle = Math.atan2(sdy, sdx);
        for (let a = -0.3; a <= 0.3; a += 0.3) {
          spawnBullet(cx, cy, Math.cos(angle + a), Math.sin(angle + a), true);
        }
        player.shootCooldown = 0.15;
      } else if (currentWeapon === 'flame') {
        for (let i = -1; i <= 1; i++) {
          spawnBullet(cx + i * 3, cy, sdx + (Math.random()-0.5)*0.3, sdy + (Math.random()-0.5)*0.3, true);
        }
        player.shootCooldown = 0.08;
      } else if (currentWeapon === 'launcher') {
        spawnBullet(cx, cy, sdx, sdy, true);
        player.shootCooldown = 0.4;
      } else {
        spawnBullet(cx, cy, sdx, sdy, true);
        player.shootCooldown = player.inTank ? 0.08 : 0.12;
      }
      playShoot();
    }
    
    // Grenades
    player.grenadeCooldown -= dt;
    if ((Input.isDown('KeyX') || Input.isDown('KeyK')) && player.grenadeCooldown <= 0 && !player.inTank) {
      spawnGrenade(player.x + player.w/2, player.y, player.dir.includes('down') ? 'down' : player.dir.includes('left') ? 'left' : player.dir.includes('right') ? 'right' : 'up');
      player.grenadeCooldown = 0.5;
    }
    
    // Enter/exit tank
    if (Input.wasPressed('KeyX') || Input.wasPressed('KeyK')) {
      if (player.inTank) {
        player.inTank = false;
        player.w = 16;
        player.h = 16;
      } else {
        for (let i = tanks.length - 1; i >= 0; i--) {
          if (tanks[i].active && aabb(player, tanks[i])) {
            player.inTank = true;
            player.tankHP = 5;
            player.w = 24;
            player.h = 24;
            tanks.splice(i, 1);
            break;
          }
        }
      }
    }
    
    // Invincibility timer
    if (player.invincible > 0) player.invincible -= dt;
  }
  
  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || b.x < -10 || b.x > NATIVE_W + 10 || b.y < -10 || b.y > NATIVE_H + 10) {
      bullets.splice(i, 1);
      continue;
    }
    
    // Hit enemies
    let hit = false;
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (aabb(b, enemies[j])) {
        const e = enemies[j];
        const dmg = (currentWeapon === 'launcher') ? 3 : 1;
        e.hp -= dmg;
        if (e.hp <= 0) {
          spawnExplosion(e.x + e.w/2, e.y + e.h/2);
          score += e.type === 'tank' ? 500 : 100;
          if (e.isRed) spawnPickup(e.x, e.y);
          enemies.splice(j, 1);
        } else {
          spawnParticle(b.x, b.y, PAL.white, 2);
        }
        hit = true;
        break;
      }
    }
    // Hit bosses
    for (let j = bosses.length - 1; j >= 0; j--) {
      if (aabb(b, bosses[j])) {
        const boss = bosses[j];
        boss.hp -= (currentWeapon === 'launcher') ? 3 : 1;
        spawnParticle(b.x, b.y, PAL.white, 3);
        if (boss.hp <= 0) {
          spawnExplosion(boss.x + boss.w/2, boss.y + boss.h/2);
          spawnExplosion(boss.x + 10, boss.y + 10);
          spawnExplosion(boss.x + boss.w - 10, boss.y + boss.h - 10);
          score += 5000;
          bossDefeated = true;
          bosses.splice(j, 1);
        }
        hit = true;
        break;
      }
    }
    if (hit) {
      bullets.splice(i, 1);
    }
  }
  
  // Update enemy bullets
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || b.x < -10 || b.x > NATIVE_W + 10 || b.y < -10 || b.y > NATIVE_H + 10) {
      enemyBullets.splice(i, 1);
      continue;
    }
    // Hit player
    if (player.alive && player.invincible <= 0 && aabb(b, player)) {
      enemyBullets.splice(i, 1);
      hitPlayer();
    }
  }
  
  // Update grenades
  for (let i = grenades.length - 1; i >= 0; i--) {
    const g = grenades[i];
    g.x += g.vx * dt;
    g.y += g.vy * dt;
    g.vy += 100 * dt; // gravity arc
    g.life -= dt;
    if (g.life <= 0) {
      // Explode
      spawnExplosion(g.x, g.y);
      // Damage nearby enemies
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        const dist = Math.sqrt((e.x + e.w/2 - g.x)**2 + (e.y + e.h/2 - g.y)**2);
        if (dist < 30) {
          e.hp -= 3;
          if (e.hp <= 0) {
            spawnExplosion(e.x + e.w/2, e.y + e.h/2);
            score += e.type === 'tank' ? 500 : 100;
            if (e.isRed) spawnPickup(e.x, e.y);
            enemies.splice(j, 1);
          }
        }
      }
      // Damage bosses
      for (let j = bosses.length - 1; j >= 0; j--) {
        const boss = bosses[j];
        const dist = Math.sqrt((boss.x + boss.w/2 - g.x)**2 + (boss.y + boss.h/2 - g.y)**2);
        if (dist < 40) {
          boss.hp -= 5;
          if (boss.hp <= 0) {
            spawnExplosion(boss.x + boss.w/2, boss.y + boss.h/2);
            score += 5000;
            bossDefeated = true;
            bosses.splice(j, 1);
          }
        }
      }
      grenades.splice(i, 1);
    }
  }
  
  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    
    // Movement
    const pdx = player.x - e.x;
    const pdy = player.y - e.y;
    const pdist = Math.sqrt(pdx*pdx + pdy*pdy) || 1;
    
    e.animTimer += dt;
    if (e.animTimer > 0.2) {
      e.animTimer = 0;
      e.animFrame = (e.animFrame + 1) % 2;
    }
    
    if (e.behavior === 'rush') {
      e.x += (pdx / pdist) * e.speed * dt;
      e.y += (pdy / pdist) * e.speed * dt;
    } else if (e.behavior === 'strafe') {
      e.y += e.speed * 0.5 * dt;
      e.x += Math.sin(e.y * 0.05) * e.speed * dt;
    } else {
      e.y += e.speed * 0.6 * dt;
      if (Math.abs(pdx) > 20) {
        e.x += Math.sign(pdx) * e.speed * 0.3 * dt;
      }
    }
    
    // Shoot
    e.shootTimer -= dt;
    if (e.shootTimer <= 0 && e.y > 0 && e.y < NATIVE_H) {
      const bx = e.x + e.w/2;
      const by = e.y + e.h/2;
      spawnBullet(bx, by, pdx / pdist, pdy / pdist, false);
      e.shootTimer = 1.5 + Math.random() * 2;
    }
    
    // Remove if off screen
    if (e.y > NATIVE_H + 20 || e.x < -30 || e.x > NATIVE_W + 30) {
      enemies.splice(i, 1);
      continue;
    }
    
    // Collision with player
    if (player.alive && player.invincible <= 0 && aabb(player, e)) {
      if (player.inTank) {
        // Tank crushes soldiers
        if (e.type === 'soldier') {
          spawnExplosion(e.x + e.w/2, e.y + e.h/2);
          score += 100;
          enemies.splice(i, 1);
        }
      } else {
        hitPlayer();
      }
    }
  }
  
  // Update bosses
  for (const boss of bosses) {
    // Move side to side
    boss.x += boss.speed * boss.moveDir * dt;
    if (boss.x > NATIVE_W - boss.w - 10) boss.moveDir = -1;
    if (boss.x < 10) boss.moveDir = 1;
    
    // Move down to position
    if (boss.y < 30) boss.y += 20 * dt;
    
    // Shoot
    boss.shootTimer -= dt;
    if (boss.shootTimer <= 0) {
      const bx = boss.x + boss.w / 2;
      const by = boss.y + boss.h;
      // Spread shot
      for (let a = -0.5; a <= 0.5; a += 0.25) {
        const angle = Math.PI / 2 + a;
        spawnBullet(bx, by, Math.cos(angle), Math.sin(angle), false);
      }
      boss.shootTimer = 0.8 + Math.random() * 0.5;
      playShoot();
    }
  }
  
  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  
  // Update pickups
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    p.life -= dt;
    if (p.life <= 0) { pickups.splice(i, 1); continue; }
    if (player.alive && aabb(player, p)) {
      switch (p.type) {
        case 'S': currentWeapon = 'spread'; weaponName = 'SPREAD'; break;
        case 'F': currentWeapon = 'flame'; weaponName = 'FLAME'; break;
        case 'L': currentWeapon = 'launcher'; weaponName = 'LAUNCHER'; break;
        case 'B': /* enhanced grenades */ break;
        case 'C':
          // Clear screen
          for (const e of enemies) spawnExplosion(e.x + e.w/2, e.y + e.h/2);
          score += enemies.length * 100;
          enemies = [];
          break;
        case 'life': lives++; break;
      }
      playPickup();
      score += 200;
      pickups.splice(i, 1);
    }
  }
  
  // Update hostages
  for (let i = hostages.length - 1; i >= 0; i--) {
    const h = hostages[i];
    if (!h.freed) {
      h.y += SCROLL_SPEED * 0.3 * dt;
      if (player.alive && aabb(player, h)) {
        h.freed = true;
        h.runTimer = 2;
        score += 1000;
        playHostage();
      }
      if (h.y > NATIVE_H + 20) { hostages.splice(i, 1); continue; }
    } else {
      // Run off screen
      h.y += 60 * dt;
      h.runTimer -= dt;
      if (h.runTimer <= 0 || h.y > NATIVE_H + 20) {
        hostages.splice(i, 1);
      }
    }
  }
  
  // Update rideable tanks
  for (const t of tanks) {
    t.flashTimer += dt;
    t.y += SCROLL_SPEED * 0.1 * dt;
  }
  
  // Spawn waves
  enemySpawnTimer -= dt;
  if (enemySpawnTimer <= 0 && !bossSpawned) {
    enemySpawnTimer = enemySpawnRate;
    waveNum++;
    
    // Gradually increase difficulty
    const numToSpawn = Math.min(1 + Math.floor(waveNum / 5), 4);
    for (let i = 0; i < numToSpawn; i++) {
      if (waveNum % 10 === 0) {
        spawnEnemy('tank');
      } else {
        spawnEnemy('soldier');
      }
    }
    
    // Decrease spawn rate over time
    enemySpawnRate = Math.max(0.5, 1.5 - waveNum * 0.02);
    
    // Hostages every 8 waves
    if (waveNum % 8 === 0) spawnHostage();
    
    // Rideable tanks occasionally
    if (waveNum % 15 === 0) spawnRideableTank();
  }
}

function hitPlayer() {
  if (player.inTank) {
    player.tankHP--;
    playTankHit();
    if (player.tankHP <= 0) {
      player.inTank = false;
      player.w = 16;
      player.h = 16;
      spawnExplosion(player.x + 12, player.y + 12);
    }
    player.invincible = 0.5;
    return;
  }
  
  lives--;
  playDeath();
  spawnExplosion(player.x + player.w/2, player.y + player.h/2);
  currentWeapon = 'standard';
  weaponName = 'MACHINE GUN';
  
  if (lives < 0) {
    // Infinite continues like the original - just reset lives
    continues++;
    lives = 4;
    score = Math.max(0, score - 500);
    player.invincible = 3.0;
    player.x = NATIVE_W / 2 - 8;
    player.y = NATIVE_H - 40;
    // Clear nearby enemies for breathing room
    enemies = enemies.filter(e => {
      const dist = Math.sqrt((e.x - player.x)**2 + (e.y - player.y)**2);
      return dist > 80;
    });
    enemyBullets = [];
  } else {
    player.invincible = 2.5;
    player.x = NATIVE_W / 2 - 8;
    player.y = NATIVE_H - 40;
  }
}

function resetGame() {
  score = 0;
  lives = 4;
  currentWeapon = 'standard';
  weaponName = 'MACHINE GUN';
  scrollY = 0;
  totalScrolled = 0;
  bullets = [];
  enemyBullets = [];
  grenades = [];
  enemies = [];
  particles = [];
  pickups = [];
  hostages = [];
  tanks = [];
  bosses = [];
  bossSpawned = false;
  bossDefeated = false;
  waveNum = 0;
  enemySpawnTimer = 1;
  enemySpawnRate = 1.5;
  stageNum = 1;
  continues = 0;
  
  player = {
    x: NATIVE_W / 2 - 8,
    y: NATIVE_H - 40,
    w: 16, h: 16,
    dir: 'up',
    animFrame: 0,
    animTimer: 0,
    invincible: 2,
    inTank: false,
    tankHP: 0,
    shootCooldown: 0,
    grenadeCooldown: 0,
    alive: true,
  };
  
  generateTerrain();
}

// --- RENDER ---
function render() {
  ctx.fillStyle = PAL.black;
  ctx.fillRect(0, 0, NATIVE_W, NATIVE_H);
  
  if (gameState === STATE.TITLE) {
    drawTitleScreen();
    return;
  }
  
  // Draw terrain (scrolling background)
  const srcY = Math.max(0, LEVEL_LENGTH - totalScrolled);
  ctx.drawImage(terrainBuffer, 0, srcY, NATIVE_W, NATIVE_H, 0, 0, NATIVE_W, NATIVE_H);
  
  // Draw rideable tanks (flashing "IN")
  for (const t of tanks) {
    ctx.drawImage(tankSprite, t.x, t.y);
    if (Math.floor(t.flashTimer * 4) % 2 === 0) {
      ctx.fillStyle = PAL.white;
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('IN', t.x + 12, t.y + 14);
    }
  }
  
  // Draw hostages
  for (const h of hostages) {
    if (!h.freed || Math.floor(h.runTimer * 8) % 2 === 0) {
      ctx.drawImage(hostageSprite, h.x, h.y);
      if (!h.freed) {
        // Exclamation mark
        ctx.fillStyle = PAL.yellow;
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', h.x + 8, h.y - 4);
      }
    }
  }
  
  // Draw enemies
  for (const e of enemies) {
    if (e.type === 'tank') {
      ctx.drawImage(enemyTankSprite, e.x, e.y);
    } else {
      const sprites = e.isRed ? enemySprites.red : enemySprites.green;
      ctx.drawImage(sprites[e.animFrame], e.x, e.y);
    }
  }
  
  // Draw bosses
  for (const boss of bosses) {
    // Boss is a large tank/vehicle
    ctx.fillStyle = PAL.dkGray;
    ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
    ctx.fillStyle = PAL.red;
    ctx.fillRect(boss.x + 4, boss.y + 4, boss.w - 8, boss.h - 8);
    ctx.fillStyle = PAL.dkGray;
    ctx.fillRect(boss.x + 8, boss.y + 8, boss.w - 16, boss.h - 16);
    // Turret
    ctx.fillStyle = PAL.gray;
    ctx.fillRect(boss.x + boss.w/2 - 3, boss.y + boss.h - 4, 6, 8);
    // HP bar
    const hpPct = boss.hp / boss.maxHP;
    ctx.fillStyle = PAL.red;
    ctx.fillRect(boss.x, boss.y - 6, boss.w, 4);
    ctx.fillStyle = PAL.ltGreen;
    ctx.fillRect(boss.x, boss.y - 6, boss.w * hpPct, 4);
  }
  
  // Draw player
  if (player.alive) {
    const blink = player.invincible > 0 && Math.floor(player.invincible * 10) % 2 === 0;
    if (!blink) {
      if (player.inTank) {
        ctx.drawImage(tankSprite, player.x, player.y);
        // Draw player poking out
        ctx.drawImage(playerUp1, player.x + 4, player.y - 4, 16, 10);
      } else {
        let sprite;
        const dir = player.dir;
        if (dir === 'up' || dir === 'upleft' || dir === 'upright') {
          sprite = playerSprites.up[player.animFrame];
        } else {
          sprite = playerSprites.down[player.animFrame];
        }
        
        ctx.save();
        if (dir === 'left' || dir === 'upleft' || dir === 'downleft') {
          ctx.translate(player.x + player.w, player.y);
          ctx.scale(-1, 1);
          ctx.drawImage(sprite, 0, 0);
        } else {
          ctx.drawImage(sprite, player.x, player.y);
        }
        ctx.restore();
      }
    }
  }
  
  // Draw bullets
  for (const b of bullets) {
    if (b.type === 'flame') {
      ctx.fillStyle = Math.random() < 0.5 ? PAL.orange : PAL.yellow;
      ctx.fillRect(b.x - 2, b.y - 2, 5, 5);
    } else if (b.type === 'launcher') {
      ctx.fillStyle = PAL.ltRed;
      ctx.fillRect(b.x - 2, b.y - 3, 4, 6);
      ctx.fillStyle = PAL.orange;
      ctx.fillRect(b.x - 1, b.y - 2, 2, 4);
    } else {
      ctx.fillStyle = PAL.yellow;
      ctx.fillRect(b.x - 1, b.y - 1, 3, 3);
    }
  }
  
  // Draw enemy bullets
  for (const b of enemyBullets) {
    ctx.fillStyle = PAL.ltRed;
    ctx.fillRect(b.x - 1, b.y - 1, 3, 3);
  }
  
  // Draw grenades
  for (const g of grenades) {
    ctx.fillStyle = PAL.dkGreen;
    ctx.fillRect(g.x - 3, g.y - 3, 6, 6);
    ctx.fillStyle = PAL.green;
    ctx.fillRect(g.x - 2, g.y - 2, 4, 4);
  }
  
  // Draw particles
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size * alpha, p.size * alpha);
  }
  ctx.globalAlpha = 1;
  
  // Draw pickups
  for (const p of pickups) {
    if (p.life < 2 && Math.floor(p.life * 6) % 2 === 0) continue;
    ctx.drawImage(powerupSprites[p.type], p.x, p.y);
  }
  
  // HUD
  drawHUD();
  
  // Pause overlay
  if (gameState === STATE.PAUSED) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, NATIVE_W, NATIVE_H);
    ctx.fillStyle = PAL.white;
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', NATIVE_W/2, NATIVE_H/2);
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('Press P to resume', NATIVE_W/2, NATIVE_H/2 + 24);
  }
  
  // Game Over
  if (gameState === STATE.GAMEOVER) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, NATIVE_W, NATIVE_H);
    ctx.fillStyle = PAL.ltRed;
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', NATIVE_W/2, NATIVE_H/2 - 10);
    ctx.fillStyle = PAL.white;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('SCORE: ' + score, NATIVE_W/2, NATIVE_H/2 + 16);
    ctx.fillText('Press SPACE', NATIVE_W/2, NATIVE_H/2 + 36);
  }
  
  // Victory
  if (gameState === STATE.VICTORY) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, NATIVE_W, NATIVE_H);
    ctx.fillStyle = PAL.ltGreen;
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', NATIVE_W/2, NATIVE_H/2 - 20);
    ctx.fillStyle = PAL.yellow;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('THE REVOLUTION', NATIVE_W/2, NATIVE_H/2 + 4);
    ctx.fillText('IS COMPLETE!', NATIVE_W/2, NATIVE_H/2 + 18);
    ctx.fillStyle = PAL.white;
    ctx.fillText('SCORE: ' + score, NATIVE_W/2, NATIVE_H/2 + 40);
    ctx.fillText('Press SPACE', NATIVE_W/2, NATIVE_H/2 + 58);
  }
}

function drawTitleScreen() {
  // Background
  ctx.fillStyle = PAL.dkJungle;
  ctx.fillRect(0, 0, NATIVE_W, NATIVE_H);
  
  // Jungle pattern
  for (let y = 0; y < NATIVE_H; y += 8) {
    for (let x = 0; x < NATIVE_W; x += 8) {
      if (Math.random() < 0.3) {
        ctx.fillStyle = PAL.jungle;
        ctx.fillRect(x, y, 8, 8);
      }
    }
  }
  
  // Title banner background
  ctx.fillStyle = PAL.ltRed;
  ctx.fillRect(20, 30, NATIVE_W - 40, 50);
  ctx.fillStyle = PAL.yellow;
  ctx.fillRect(22, 32, NATIVE_W - 44, 46);
  ctx.fillStyle = PAL.dkBrown;
  ctx.fillRect(24, 34, NATIVE_W - 48, 42);
  
  // Title text
  ctx.fillStyle = PAL.ltRed;
  ctx.font = '16px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GUERRILLA', NATIVE_W/2, 52);
  ctx.fillStyle = PAL.yellow;
  ctx.fillText('WAR', NATIVE_W/2, 70);
  
  // Subtitle  
  ctx.fillStyle = PAL.white;
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillText('A TOP-DOWN RUN & GUN', NATIVE_W/2, 100);
  
  // Controls
  ctx.fillStyle = PAL.ltGreen;
  ctx.font = '7px "Press Start 2P", monospace';
  const controlY = 125;
  ctx.fillText('CONTROLS', NATIVE_W/2, controlY);
  ctx.fillStyle = PAL.gray;
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.fillText('ARROWS/WASD - MOVE', NATIVE_W/2, controlY + 14);
  ctx.fillText('Z/J/SPACE - SHOOT', NATIVE_W/2, controlY + 26);
  ctx.fillText('X/K - GRENADE/ENTER TANK', NATIVE_W/2, controlY + 38);
  ctx.fillText('P - PAUSE', NATIVE_W/2, controlY + 50);
  
  // Start prompt
  if (Math.floor(Date.now() / 500) % 2 === 0) {
    ctx.fillStyle = PAL.white;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText(touchVisible ? 'TAP TO START' : 'PRESS SPACE TO START', NATIVE_W/2, 210);
  }
  
  // Copyright
  ctx.fillStyle = PAL.dkGray;
  ctx.font = '7px "Press Start 2P", monospace';
  ctx.fillText('FRANKCARON.COM  2026', NATIVE_W/2, 232);
}

function drawHUD() {
  // Top bar background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, NATIVE_W, 16);
  
  // Score
  ctx.fillStyle = PAL.white;
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(String(score).padStart(7, '0'), 2, 12);
  
  // Lives
  ctx.fillStyle = PAL.ltRed;
  ctx.textAlign = 'center';
  ctx.fillText('x' + lives, NATIVE_W / 2 - 20, 12);
  
  // Weapon
  ctx.fillStyle = PAL.yellow;
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(weaponName, NATIVE_W - 2, 12);
  
  // Stage indicator
  ctx.fillStyle = PAL.ltGreen;
  ctx.textAlign = 'center';
  ctx.font = '6px "Press Start 2P", monospace';
  const stage = Math.min(10, 1 + Math.floor(totalScrolled / (LEVEL_LENGTH / 10)));
  ctx.fillText('STAGE ' + stage, NATIVE_W / 2 + 30, 12);
}

// --- GAME LOOP ---
let lastTime = 0;
const TICK_RATE = 1000 / 60;
let accumulator = 0;

function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  accumulator += deltaTime;
  
  while (accumulator >= TICK_RATE) {
    update(TICK_RATE / 1000);
    Input.endFrame();
    accumulator -= TICK_RATE;
  }
  
  render();
  requestAnimationFrame(gameLoop);
}

// --- DEBUG / TESTING HOOKS ---
window.render_game_to_text = function() {
  return JSON.stringify({
    state: ['TITLE','PLAYING','GAMEOVER','VICTORY','PAUSED'][gameState],
    score,
    lives,
    weapon: currentWeapon,
    player: { x: Math.round(player.x), y: Math.round(player.y), dir: player.dir, alive: player.alive, inTank: player.inTank },
    enemies: enemies.length,
    bullets: bullets.length,
    enemyBullets: enemyBullets.length,
    bosses: bosses.length,
    totalScrolled: Math.round(totalScrolled),
    bossSpawned,
    bossDefeated,
  });
};

window.advanceTime = function(ms) {
  const steps = Math.max(1, Math.round(ms / TICK_RATE));
  for (let i = 0; i < steps; i++) {
    update(TICK_RATE / 1000);
    Input.endFrame();
  }
  render();
};

// Initial terrain generation for title screen
generateTerrain();

// Start
requestAnimationFrame(gameLoop);
