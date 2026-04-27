/**
 * Automated user journey test for GYM Tracker
 * Uses installed Chrome via Playwright channel API
 * Run: node test-journey.mjs
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5180/GYM-Tracker';
const SLOW = 400;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (msg) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);

async function goto(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await sleep(700);
}

async function shot(page, name) {
  await page.screenshot({ path: `screenshots/${name}`, fullPage: true });
  log(`  ✓ Saved ${name}`);
}

async function main() {
  log('Launching Chrome (headed, iPhone 14 viewport)...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    slowMo: SLOW,
  });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  // ── 1. HOME ───────────────────────────────────────────────────────────────
  log('1. Home page');
  await goto(page, '/');
  const onboarding = await page.locator('text=GET STARTED').count();
  log(`   Onboarding card: ${onboarding > 0 ? '[YES]' : '[NO]'}`);
  const streak = await page.locator('text=streak').count();
  log(`   Streak badge: ${streak > 0 ? '[YES]' : '[none yet]'}`);
  await shot(page, '01-home.png');

  // ── 2. PROFILE ────────────────────────────────────────────────────────────
  log('2. Profile page');
  await goto(page, '/profile');
  await shot(page, '02-profile.png');

  // ── 3. SCAN + BROWSE ──────────────────────────────────────────────────────
  log('3. Scan page');
  await goto(page, '/scan');
  await shot(page, '03-scan.png');
  const browseBtn = page.locator('button:has-text("Browse")').first();
  if (await browseBtn.isVisible().catch(() => false)) {
    log('   Opening Browse dialog...');
    await browseBtn.click();
    await sleep(600);
    await shot(page, '04-browse-dialog.png');
    // pick first exercise
    const firstItem = page.locator('[role="option"], [data-radix-collection-item]').first();
    if (await firstItem.isVisible().catch(() => false)) {
      await firstItem.click();
      await sleep(400);
    }
    await page.keyboard.press('Escape');
    await sleep(300);
  }

  // ── 4. LOG (no active workout) ─────────────────────────────────────────────
  log('4. Log page (no active workout)');
  await goto(page, '/log');
  await shot(page, '05-log-empty.png');

  // ── 5. HISTORY ────────────────────────────────────────────────────────────
  log('5. History page');
  await goto(page, '/history');
  await shot(page, '06-history.png');
  // test filter chips if present
  const chips = page.locator('[data-muscle], button[data-filter]');
  log(`   Filter chips found: ${await chips.count()}`);

  // ── 6. PROGRESS ───────────────────────────────────────────────────────────
  log('6. Progress page');
  await goto(page, '/progress');
  await shot(page, '07-progress.png');

  // ── 7. TEMPLATES ──────────────────────────────────────────────────────────
  log('7. Templates page');
  await goto(page, '/templates');
  await shot(page, '08-templates.png');
  // check day pill sizes
  const dayPills = page.locator('button:has-text("Mon"), button:has-text("Tue"), button:has-text("Wed")');
  log(`   Day pills found: ${await dayPills.count()}`);

  // ── 8. SETTINGS ───────────────────────────────────────────────────────────
  log('8. Settings page');
  await goto(page, '/settings');
  await shot(page, '09-settings-top.png');
  // scroll to see Workout section
  await page.evaluate(() => window.scrollTo(0, 400));
  await sleep(400);
  await shot(page, '10-settings-workout-section.png');
  const autoStart = await page.locator('text=Auto-start').count();
  log(`   Auto-start rest timer toggle: ${autoStart > 0 ? '[YES]' : '[MISSING]'}`);

  // ── 9. MORE MENU ──────────────────────────────────────────────────────────
  log('9. Exercises page');
  await goto(page, '/exercises');
  await shot(page, '11-exercises.png');

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  log('\nJourney complete -- all screenshots in ./screenshots/');
  log('Browser stays open 20 s for inspection...');
  await sleep(20000);
  await browser.close();
}

main().catch((err) => {
  console.error('Journey error:', err.message);
  process.exit(1);
});
