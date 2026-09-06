// Run after unpacking axe-core to output/reference/package/axe.min.js.
async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const base = await page.evaluate(() => new URL('.', location.href).href);
  const audits = [];
  const audit = async (screen) => {
    if (!await page.evaluate(() => !!window.axe)) await page.addScriptTag({ path: 'output/reference/package/axe.min.js' });
    const result = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }));
    audits.push({ screen, violations: result.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })) });
  };
  await page.goto(base);
  await page.setViewportSize({ width: 390, height: 844 });
  await audit('home');
  await page.locator('[data-action="start"]').click();
  await page.waitForURL('**/#test/1');
  await page.waitForFunction(() => document.activeElement?.id === 'page-title');
  await page.keyboard.press('Tab');
  assert(await page.locator('input[value="under35"]').evaluate(el => el === document.activeElement), 'Radio keyboard focus');
  await page.keyboard.press('ArrowDown');
  assert(await page.locator('input[value="35to39"]').isChecked(), 'Arrow keys select answers');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/#test/2');
  await audit('cycle question');
  for (const value of ['context', 'sleep_strong', 'body_strong', 'labs_changed']) {
    await page.locator(`label:has(input[value="${value}"])`).click();
    await page.locator('button[type="submit"]').click();
  }
  await page.waitForURL('**/#result');
  await audit('uncertain result');

  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: async payload => { window.__sharePayload = payload; } });
  });
  await page.locator('[data-action="share"]').click();
  const payload = await page.evaluate(() => window.__sharePayload);
  assert(payload.url === base && !JSON.stringify(payload).includes('индивидуальная'), 'Share must not include health result');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Permission denied'); } } });
  });
  await page.locator('[data-action="share"]').click();
  assert(await page.locator('#share-url').inputValue() === base, 'Clipboard rejection has selectable fallback');
  await page.goto(base + '#stage/postmenopause');
  await audit('stage detail');
  await page.goto(base + '#privacy');
  await audit('privacy');

  // Only intercept this test browser; never write sample contacts into the real config.
  await page.route('**/site-config.js', route => route.fulfill({ contentType: 'application/javascript', body: `window.SITE_CONFIG = ${JSON.stringify({
    brandName: 'Тестовый проект',
    doctor: { name: 'Тестовый <специалист>', specialty: 'Тестовая специальность', description: 'Описание для проверки', avatar: 'assets/favicon.svg' },
    contacts: { phone: '+7 (999) 123-45-67', telegram: 'https://t.me/example', telegramLabel: '@example', whatsapp: 'https://wa.me/79991234567', email: 'test@example.com', bookingUrl: 'https://example.com/booking', address: 'Тестовый адрес' },
    siteUrl: 'https://example.com/test/'
  })};` }));
  await page.goto(base);
  await page.reload();
  assert((await page.locator('.brand').innerText()).includes('Тестовый <специалист>'), 'Config name appears escaped');
  assert(await page.locator('специалист').count() === 0, 'Config is not injected as HTML');
  assert(await page.locator('.header-link').getAttribute('href') === 'https://example.com/booking', 'Booking priority');
  assert(await page.locator('.author a[href="tel:+79991234567"]').count() === 1, 'Normalized phone');
  assert(await page.locator('.avatar img').evaluate(img => img.complete && img.naturalWidth > 0), 'Local avatar loads');
  assert((await page.title()).includes('Тестовый <специалист>'), 'Metadata uses config');
  await page.goto(base + '#stage/postmenopause');
  assert(await page.locator('.consultation a').getAttribute('href') === 'https://example.com/booking', 'Stage CTA uses same config');
  assert((await page.locator('.author-info').innerText()).includes('Тестовый адрес'), 'Address on stage');
  await page.locator('.avatar img').evaluate(img => { img.src = 'assets/missing-test-avatar.jpg'; });
  await page.waitForFunction(() => document.querySelectorAll('.avatar img').length === 0);
  assert(await page.locator('.avatar svg').count() === 1, 'Broken image falls back to neutral icon');
  await page.unroute('**/site-config.js');
  await page.goto(base);
  await page.reload();
  return { audits, allPassed: audits.every(a => a.violations.length === 0), keyboard: true, sharePrivacy: true, deniedClipboardFallback: true, centralizedConfig: true, avatarFallback: true };
}
