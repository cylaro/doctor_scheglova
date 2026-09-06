// Run with Playwright CLI against a local production preview.
async (page) => {
  await page.locator('.author img').waitFor();
  await page.waitForFunction(() => {
    const image = document.querySelector('.author img');
    return image?.complete && image.naturalWidth > 0;
  });
  const result = await page.locator('.author img').evaluate(image => ({
    loaded: image.complete,
    width: image.naturalWidth,
    height: image.naturalHeight,
    path: new URL(image.src).pathname,
  }));
  if (!result.path.endsWith('/doctor.jpg')) throw new Error('Unexpected avatar URL');
  return result;
}
