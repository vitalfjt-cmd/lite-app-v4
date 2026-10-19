import { chromium } from '@playwright/test';

async function testLogin(appName, url) {
  console.log(`\n=== Testing ${appName}: ${url} ===`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log(`[${appName} LOG]`, msg.type(), msg.text()));
  page.on('response', async res => {
    const u = res.url();
    if (u.includes('customer-api-prototype') || u.includes('identitytoolkit')) {
      console.log(`[${appName} RES]`, res.status(), u);
      if (res.status() >= 400) {
        try {
          console.log(`  [${appName} ERR BODY]`, await res.text());
        } catch (e) {}
      }
    }
  });

  await page.goto(url);
  await page.waitForTimeout(2000);

  const inputs = await page.locator('input').all();
  console.log(`[${appName}] Inputs found:`, inputs.length);
  for (let i = 0; i < inputs.length; i++) {
    const ph = await inputs[i].getAttribute('placeholder');
    const type = await inputs[i].getAttribute('type');
    const val = await inputs[i].inputValue();
    console.log(`[${appName}] input ${i}: type=${type}, placeholder=${ph}, val=${val}`);
  }

  // If 3 inputs: [storeSlug, email, password]
  // If 2 inputs: [email, password]
  if (inputs.length === 3) {
    await inputs[0].fill('test-cafe-fujisawa');
    await inputs[1].fill('vital.fjt@gmail.com');
    await inputs[2].fill('vital123');
  } else if (inputs.length === 2) {
    await inputs[0].fill('vital.fjt@gmail.com');
    await inputs[1].fill('vital123');
  }

  console.log(`[${appName}] Clicking submit...`);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  const errorEl = page.locator('.login-error-message').first();
  if (await errorEl.isVisible()) {
    console.log(`[${appName}] ERROR IN UI:`, await errorEl.textContent());
  } else {
    console.log(`[${appName}] SUCCESS! URL:`, page.url());
    const headings = await page.locator('h1, h2, h3, .brand-title, .header-title').allTextContents();
    console.log(`[${appName}] Headings:`, headings);
  }

  await browser.close();
}

async function main() {
  await testLogin('v2', 'https://lite-app-v2.pages.dev/?view=admin');
  await testLogin('v3', 'https://lite-app-v3.pages.dev/?view=admin');
  await testLogin('v4', 'https://lite-app-v4.pages.dev/?view=admin');
}

main().catch(console.error);
