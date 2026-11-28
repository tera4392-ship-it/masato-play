// 使い方: node render.cjs <開始秒> <終了秒> <出力ファイル> [fps=24]
//   フレーム確認: node render.cjs <秒> <秒> out.jpg   (開始==終了ならJPEG1枚)
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const { chromium } = require('playwright');
const [s, e, out, fpsArg, scArg] = process.argv.slice(2);
const start = parseFloat(s), end = parseFloat(e), fps = parseInt(fpsArg || '30', 10), SC = scArg || '1';
const root = __dirname;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const srv = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': mime[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', err => console.error('PAGEERROR', err.message));
  page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/index.html?render=1&s=${SC}${process.env.EXTRA ? "&" + process.env.EXTRA : ""}`);
  await page.waitForFunction('window.READY === true', null, { timeout: 60000 });
  await page.evaluate(() => document.fonts.load('900 190px "IPAGothic"'));
  const grab = async t => { await page.evaluate(t => window.renderAt(t), t); return Buffer.from((await page.evaluate(() => window.frameDataURL())).split(',')[1], 'base64'); };
  if (start === end) { fs.writeFileSync(out, await grab(start)); }
  else {
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const n = Math.round((end - start) * fps); const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      const buf = await grab(start + i / fps);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 24 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
