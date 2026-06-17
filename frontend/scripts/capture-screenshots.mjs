import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptDirectory, '..');
const screenshotsDirectory = resolve(frontendRoot, '..', 'docs', 'screenshots');

await mkdir(screenshotsDirectory, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});

const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });

const shots = [
  { url: 'http://127.0.0.1:3000/', file: 'homepage.png' },
  { url: 'http://127.0.0.1:3000/dashboard', file: 'dashboard.png' },
  { url: 'http://127.0.0.1:3000/proof', file: 'proof.png' },
];

for (const shot of shots) {
  await page.goto(shot.url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: resolve(screenshotsDirectory, shot.file), fullPage: true });
}

await browser.close();
