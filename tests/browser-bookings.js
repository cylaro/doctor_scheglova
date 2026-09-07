// Run via Playwright CLI against a production preview. Test data stays in this browser only.
async (page) => {
  const base = await page.evaluate(() => new URL('.', location.href).href);
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const audit = async (name) => {
    if (!await page.evaluate(() => !!window.axe)) await page.addScriptTag({ path: 'output/reference/package/axe.min.js' });
    const result = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }));
    assert(result.violations.length === 0, `${name}: ${JSON.stringify(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.failureSummary) })))}`);
  };
  const noOverflow = async () => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow');
  const useConfig = async (value) => {
    await page.unroute('**/site-config.js');
    await page.route('**/site-config.js', route => route.fulfill({ contentType: 'application/javascript', body: `window.SITE_CONFIG = ${JSON.stringify(value)};` }));
    await page.goto(base);
    await page.reload();
    await page.locator('h1').waitFor();
  };
  const completeQuiz = async () => {
    await page.locator('[data-action="start"]').click();
    for (const value of ['45plus', 'changed', 'sleep_ok', 'body_none', 'labs_no']) {
      await page.locator(`label:has(input[value="${value}"])`).click();
      const title = await page.locator('h1').textContent();
      await page.locator('button[type="submit"]').click();
      await page.waitForFunction(previous => document.querySelector('h1')?.textContent !== previous, title);
    }
    await page.locator('.result-screen').waitFor();
  };

  // Actual configured single clinic, with no phone.
  await page.goto(base);
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.locator('.header-link').textContent() === 'Записаться', 'Visible booking label');
  assert((await page.locator('.header-link').getAttribute('href')).includes('ogni.clinic'), 'Direct clinic URL in header');
  assert(await page.locator('.author-bookings a').count() === 1, 'Clinic visible beside doctor');
  assert(await page.locator('a[href^="tel:"]').count() === 0, 'Phone remains hidden');
  await audit('Real home');
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await noOverflow();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'output/playwright/booking-home-mobile.png', fullPage: true });
  await page.locator('.author').screenshot({ path: 'output/playwright/booking-doctor-mobile.png' });

  // All blocks removed, then fields supplied separately.
  await useConfig({});
  assert(await page.locator('.author, .avatar, .header-link, #booking-dialog').count() === 0, 'No empty doctor/contact UI');
  await completeQuiz();
  assert(await page.locator('[data-action="save"]').count() === 1, 'No-config quiz result remains usable');
  for (const doctor of [{ name: 'Имя для проверки' }, { specialty: 'Специальность для проверки' }, { description: 'Описание для проверки' }, {}]) {
    await useConfig({ doctor });
    assert(await page.locator('.avatar').count() === 0, 'Omitted avatar is not replaced');
    assert(await page.locator('.author-info strong').count() === (doctor.name ? 1 : 0), 'Name only appears when supplied');
    assert(await page.locator('.author-info p').count() === (doctor.specialty || doctor.description ? 1 : 0), 'No invented description');
  }
  await useConfig({ contacts: { telegram: 'https://t.me/example' } });
  assert((await page.locator('.contact-links').innerText()).trim() === 'Telegram', 'Default link label without custom label');
  assert(await page.locator('.header-link').textContent() === 'Связаться', 'Contact-only action');
  await useConfig({ contacts: { bookingUrl: 'https://example.com/legacy' } });
  assert(await page.locator('.header-link').getAttribute('href') === 'https://example.com/legacy', 'Legacy booking without doctor/phone');

  const multiple = { contacts: { bookingLinks: [
    { label: 'Клиника «Огни»', url: 'https://ogni.clinic/doctors/shcheglova_svetlana_vyacheslavovna', description: 'Очный приём' },
    { label: 'Другое место приёма', url: 'https://example.org/booking', description: 'Второй вариант для проверки интерфейса' },
    { label: 'Повтор', url: 'https://example.org/booking' },
    { label: 'Без ссылки' }, null,
  ] } };
  await useConfig(multiple);
  assert(await page.locator('.author-bookings a').count() === 2, 'Invalid and duplicate links skipped');
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator('.header-link').click();
    assert(await page.locator('#booking-dialog').evaluate(el => el.open), 'Multiple links open dialog');
    await noOverflow();
    await audit(`Booking dialog ${width}`);
    await page.keyboard.press('Escape');
    assert(await page.locator('.header-link').evaluate(el => el === document.activeElement), 'Escape restores trigger focus');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.header-link').click();
  await page.screenshot({ path: 'output/playwright/booking-dialog-mobile.png' });
  await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await page.locator('[data-action="start"]').click();
  await page.locator('label:has(input[value="45plus"])').click();
  await page.locator('.header-link').click();
  await page.keyboard.press('Escape');
  assert(await page.locator('input[value="45plus"]').isChecked(), 'Opening booking preserves quiz answer');
  await page.goto(base);
  await page.reload();
  await completeQuiz();
  assert(await page.locator('.consultation .booking-option').count() === 2, 'All booking choices visible on result');
  assert(await page.locator('.author-bookings').count() === 0, 'Result does not repeat booking list');
  await audit('Result with multiple bookings');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-action="save"]').click();
  await (await downloadPromise).saveAs('output/playwright/multiple-bookings-result.txt');
  await page.unroute('**/site-config.js');
  await page.goto(base);
  await page.reload();
  return { passed: true, optionalFields: true, legacyBooking: true, multipleBookings: true, keyboard: true, accessibility: true, widths: [320, 390, 768, 1280] };
}
