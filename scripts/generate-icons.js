import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  let srcOffset = 0;
  let dstOffset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[dstOffset++] = 0; // Filter None
    buffer.copy(scanlines, dstOffset, srcOffset, srcOffset + width * 4);
    dstOffset += width * 4;
    srcOffset += width * 4;
  }

  const deflated = zlib.deflateSync(scanlines);

  function crc32(buf) {
    let c;
    let crcTable = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      }
      crcTable[n] = c;
    }
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, combined, crcBuf]);
  }

  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // color type RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', deflated);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Emerald financial theme drawing
function drawFinanceIcon(x, y, w, h, isMaskable = false) {
  const nx = x / w;
  const ny = y / h;
  const cx = 0.5;
  const cy = 0.5;
  const dist = Math.sqrt((nx - cx) ** 2 + (ny - cy) ** 2);

  // Background gradient: Emerald #059669 (5, 150, 105) to Teal #0f766e (15, 118, 110)
  const grad = nx * 0.4 + ny * 0.6;
  let bgR = Math.round(16 + grad * (5 - 16));
  let bgG = Math.round(185 + grad * (120 - 185));
  let bgB = Math.round(129 + grad * (110 - 129));

  // Outer rounded rect for non-maskable
  if (!isMaskable) {
    const rx = Math.abs(nx - 0.5);
    const ry = Math.abs(ny - 0.5);
    // Rounded corner clamp
    const cornerR = 0.18;
    const dx = Math.max(0, rx - (0.5 - cornerR));
    const dy = Math.max(0, ry - (0.5 - cornerR));
    if (Math.sqrt(dx * dx + dy * dy) > cornerR) {
      return [0, 0, 0, 0]; // Transparent outside
    }
  }

  // Draw modern financial glyph (Card / Chart trend upward inside safe zone)
  const safeScale = isMaskable ? 0.35 : 0.42;
  const relX = (nx - 0.5) / safeScale;
  const relY = (ny - 0.5) / safeScale;

  // Let's draw 3 ascending growth bars + dollar/wallet symbol
  // Bar 1: -0.6 to -0.3
  const inBar1 = relX >= -0.7 && relX <= -0.35 && relY >= -0.1 && relY <= 0.6;
  // Bar 2: -0.2 to 0.15
  const inBar2 = relX >= -0.25 && relX <= 0.1 && relY >= -0.35 && relY <= 0.6;
  // Bar 3: 0.2 to 0.55
  const inBar3 = relX >= 0.2 && relX <= 0.55 && relY >= -0.65 && relY <= 0.6;

  // Trend upward arrow connecting tops

  if (inBar1 || inBar2 || inBar3) {
    return [255, 255, 255, 245];
  }

  // Soft glow accent
  if (dist < 0.35) {
    return [bgR + 15, Math.min(255, bgG + 25), bgB + 20, 255];
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 192x192
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, (x, y, w, h) => drawFinanceIcon(x, y, w, h, false)));
// 512x512
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawFinanceIcon(x, y, w, h, false)));
// maskable 512x512
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawFinanceIcon(x, y, w, h, true)));
// apple touch icon 180x180
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, (x, y, w, h) => drawFinanceIcon(x, y, w, h, false)));

// SVG icon for desktop browser tab
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="financeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#064e3b" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="110" fill="url(#financeGrad)"/>
  <g filter="url(#shadow)" fill="#ffffff">
    <!-- Chart Growth Bars -->
    <rect x="110" y="270" width="70" height="150" rx="14" fill="#ffffff" fill-opacity="0.85"/>
    <rect x="220" y="200" width="70" height="220" rx="14" fill="#ffffff" fill-opacity="0.95"/>
    <rect x="330" y="130" width="70" height="290" rx="14" fill="#ffffff"/>
    <!-- Growth trend line & arrowhead -->
    <path d="M120 220 L240 150 L350 85" stroke="#a7f3d0" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <polygon points="375,85 335,70 345,110" fill="#a7f3d0"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
console.log('PWA icons successfully generated in /public!');
