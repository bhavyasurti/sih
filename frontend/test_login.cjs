const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Pipe browser console to node console
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  page.on('requestfailed', request =>
    console.log(`PAGE REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`)
  );

  try {
    console.log('Navigating to http://localhost:5173/login');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });

    console.log('Typing credentials...');
    // Type in email and password.
    // The inputs are type="email" and type="password"
    await page.type('input[type="email"]', 'testuser123@example.com');
    await page.type('input[type="password"]', 'Password123!');
    
    console.log('Submitting form...');
    // Click submit button (the one with type="submit")
    await Promise.all([
      page.click('button[type="submit"]'),
      // Wait for a bit to see the logs
      new Promise(r => setTimeout(r, 5000))
    ]);

    console.log('Done waiting. Checking current URL...');
    console.log('Current URL is:', page.url());

  } catch (error) {
    console.error('Test script error:', error);
  } finally {
    await browser.close();
  }
})();
