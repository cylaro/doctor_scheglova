// Run via Playwright CLI: playwright-cli --session=local run-code --filename=tests/browser-check.js
async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const base = await page.evaluate(() => new URL('.', location.href).href);
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  const noOverflow = async (name) => {
    const dimensions = await page.evaluate(() => ({ screen: innerWidth, page: document.documentElement.scrollWidth }));
    assert(dimensions.page <= dimensions.screen, `${name}: horizontal overflow ${JSON.stringify(dimensions)}`);
  };
  const select = async (id) => page.locator(`label.option:has(input[value="${id}"])`).click();
  const next = async () => {
    const title = await page.locator('h1').textContent();
    await page.locator('#quiz-form button[type="submit"]').click();
    await page.waitForFunction(previous => document.querySelector('h1')?.textContent !== previous, title);
  };
  const runQuiz = async (values) => {
    for (let i = 0; i < values.length; i++) {
      await page.waitForURL(`**/#test/${i + 1}`);
      await select(values[i]);
      await noOverflow(`Question ${i + 1}`);
      await next();
    }
    await page.waitForURL('**/#result');
    await page.locator('.result-screen').waitFor();
    await noOverflow('Result');
  };

  await page.goto(base);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-action="start"]').click();
  assert(await page.locator('button[type="submit"]').isDisabled(), 'Unanswered question must be disabled');
  await select('40to44');
  await next();
  await page.locator('.text-back').click();
  assert(await page.locator('input[value="40to44"]').isChecked(), 'Back must preserve answer');
  await page.keyboard.press('Tab');
  await runQuiz(['45plus', 'changed', 'sleep_mild', 'body_mild', 'labs_no']);
  assert((await page.locator('h1').innerText()).includes('перименопаузе'), 'Perimenopause result');
  await page.screenshot({ path: 'output/playwright/result-mobile.png', fullPage: true });

  await page.getByText('Ваши ответы', { exact: true }).click();
  assert(await page.locator('.answer-summary > div').count() === 5, 'All five answers are shown');
  await page.getByRole('link', { name: 'Изменить ответ: Что происходит с менструальным циклом?' }).click();
  await select('absent12');
  await next(); await next(); await next(); await next();
  await page.waitForURL('**/#result');
  assert((await page.locator('h1').innerText()).includes('постменопаузе'), 'Changing answer recomputes result');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-action="save"]').click();
  const download = await downloadPromise;
  assert(download.suggestedFilename() === 'rezultat-testa.txt', 'Download filename');
  await download.saveAs('output/playwright/result.txt');
  assert(await page.locator('a[href^="tel:"]').count() === 0, 'Empty phone hidden');
  assert(await page.locator('a[href*="doctorgvoz"]').count() === 0, 'No original author contacts');

  await page.locator('[data-action="restart"]').click();
  assert(await page.locator('input:checked').count() === 0, 'Restart must reset answers');
  await runQuiz(['under35', 'regular', 'sleep_ok', 'body_none', 'labs_no']);
  assert((await page.locator('h1').innerText()).includes('недостаточно'), 'Reproductive result');
  await page.locator('[data-action="restart"]').click();
  await runQuiz(['45plus', 'context', 'sleep_strong', 'body_strong', 'labs_changed']);
  assert((await page.locator('h1').innerText()).includes('индивидуальная оценка'), 'Confounded result');

  const widths = [320, 375, 390, 768, 1280];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(base + '#result');
    await noOverflow(`Result at ${width}`);
    for (const route of ['#', '#stages', '#stage/reproductive', '#stage/perimenopause', '#stage/postmenopause', '#privacy']) {
      await page.goto(base + route);
      await page.locator('h1').waitFor();
      await noOverflow(`${route} at ${width}`);
    }
  }

  await page.goto(base + '#test/5');
  await page.reload();
  await page.waitForURL('**/#test/1');
  assert(await page.locator('input:checked').count() === 0, 'Reload cannot retain health answers');
  await page.goto(base + '#result');
  assert(await page.locator('[data-action="start"]').count() === 1, 'Result without answers returns to home');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-action="start"]').click();
  await page.screenshot({ path: 'output/playwright/question-mobile.png', fullPage: true });
  await page.goto(base);
  await page.screenshot({ path: 'output/playwright/home-mobile.png', fullPage: true });
  assert(errors.length === 0, `Browser errors: ${errors.join(', ')}`);
  assert(!requests.some(url => !url.startsWith(base)), 'No external requests');
  return { passed: true, viewportWidths: widths, results: 4, errors, externalRequests: 0, download: 'output/playwright/result.txt' };
}
