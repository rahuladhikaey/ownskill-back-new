const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    console.log('Page loaded');
    
    // Click on Student Module (Wait 2.5s for splash first)
    await new Promise(r => setTimeout(r, 3000));
    
    console.log('Looking for Admin Console button...');
    const buttons = await page.$$('button');
    for (let btn of buttons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text.includes('Admin Console')) {
        await btn.click();
        console.log('Clicked Admin Console');
        break;
      }
    }
    
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('Entering PIN...');
    await page.type('input[type="password"]', 'ADMIN123');
    
    console.log('Submitting PIN...');
    const submitBtns = await page.$$('button[type="submit"]');
    if (submitBtns.length > 0) {
      await submitBtns[0].click();
      console.log('Clicked Submit');
    }
    
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('Done script');
  } catch (err) {
    console.error('SCRIPT ERROR:', err);
  } finally {
    await browser.close();
  }
})();
