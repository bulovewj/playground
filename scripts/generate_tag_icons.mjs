import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../../tag_icons');

const TAGS = [
  { name: '휠체어편리', icon: '♿', color: '#1976D2' },
  { name: '조용함',     icon: '🌿', color: '#388E3C' },
  { name: '촉감놀이기구', icon: '🖐', color: '#E65100' },
  { name: '쉴공간있음', icon: '☀️', color: '#F9A825' },
  { name: '청결함',     icon: '🧹', color: '#00897B' },
  { name: '안전한울타리', icon: '🔒', color: '#AB47BC' },
  { name: '물놀이가능', icon: '🌊', color: '#039BE5' },
  { name: '바닥안전',   icon: '🐾', color: '#8D6E63' },
];

const SIZE = 120;
const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  body { margin: 0; background: transparent; }
  .grid { display: flex; flex-wrap: wrap; width: ${SIZE * 4}px; }
  canvas { display: block; }
</style>
</head>
<body>
<div class="grid">
${TAGS.map((t) => `<canvas id="${t.name}" width="${SIZE}" height="${SIZE}"></canvas>`).join('\n')}
</div>
<script>
const tags = ${JSON.stringify(TAGS)};
const SIZE = ${SIZE};
const R = SIZE * 0.42;

tags.forEach(({ name, icon, color }) => {
  const canvas = document.getElementById(name);
  const ctx = canvas.getContext('2d');

  // 그림자 원
  ctx.shadowColor = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.beginPath();
  ctx.arc(SIZE/2, SIZE/2, R, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // 테두리
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.beginPath();
  ctx.arc(SIZE/2, SIZE/2, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 4;
  ctx.stroke();

  // 이모지
  const fontSize = Math.round(SIZE * 0.38);
  ctx.font = \`\${fontSize}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif\`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, SIZE/2, SIZE/2);
});
</script>
</body>
</html>`;

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: SIZE * 4, height: SIZE * 2, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.querySelectorAll('canvas').length === 8);

  for (const tag of TAGS) {
    const el = await page.$(`canvas[id="${tag.name}"]`);
    const buf = await el.screenshot({ type: 'png', omitBackground: true });
    const outPath = `${OUT_DIR}/${tag.name}.png`;
    writeFileSync(outPath, buf);
    console.log('저장:', outPath);
  }

  await browser.close();
  console.log('\n완료! tag_icons/ 폴더를 확인하세요.');
})();
