const spawn = require('child_process').spawn;
const process = require('process');

const moment = require('moment');
const puppeteer = require('puppeteer');

const url = 'http://localhost:8080/examples/';

const duration = 0.3;
const numberOfFrames = Math.ceil(duration * 60);

(async () => {
  const browser = await puppeteer.launch({ headless: true });
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
    const progress = i / numberOfFrames;

    console.log(`taking screenshot ${i} of ${numberOfFrames}`);

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

  const videoFileName = `Scrollmeister-scrollcast-${moment().format('YYYY-MM-DD HH-mm-ss')}.mp4`;
  const wget = spawn('ffmpeg', [
    '-r',
    '60',
    '-f',
    'image2',
    '-s',
    '1280x720',
    '-i',
    'frames/%04d.png',
    '-vcodec',
    'libx264',
    '-crf',
    '25',
    '-pix_fmt',
    'yuv420p',
    videoFileName
  ]);

  wget.stderr.pipe(process.stderr);
  wget.stderr.pipe(process.stderr);

  wget.on('close', code => {
    if (code !== 0) {
      return console.error(`Error, ffmpeg exited with status ${code}`);
    }

    console.log(`created ${videoFileName}`);
  });
})();
