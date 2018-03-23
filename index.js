const puppeteer = require('puppeteer');

const url = 'http://localhost:8080/examples/';

const duration = 2;
const numberOfFrames = Math.ceil(duration * 60);

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: 'load'
  });

  await page.setViewport({
    width: 1280,
    height: 720
  });

  await page.addScriptTag({ path: 'js/TweenLite.min.js' });
  await page.addScriptTag({ path: 'js/ScrollToPlugin.min.js' });
  await page.addStyleTag({ path: 'css/scrollbar.css' });

  page.evaluate(duration => {
    window.scrollCastTween = TweenLite.to(document.documentElement, duration, {
      scrollTop: 2000,
      paused: true
    });
  }, duration);

  for (let i = 0; i <= numberOfFrames; i++) {
    let progress = i / numberOfFrames;

    await page.evaluate(progress => {
      return new Promise(resolve => {
        window.scrollCastTween.progress(progress);
        requestAnimationFrame(() => {
          setTimeout(resolve);
        });
      });
    }, progress);

    await page.screenshot({ path: `frames/${('000' + i).slice(-4)}.png` });
  }

  await browser.close();
})();
