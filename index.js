const spawn = require('child_process').spawn;
const process = require('process');

const moment = require('moment');
const puppeteer = require('puppeteer');
const argv = require('yargs').demandOption(['url', 'pos']).argv;

const FPS = 25;
const PIXEL_PER_SECOND = 500;

const url = argv.url;
const deltas = [].concat(argv.pos);
const totalDistance = deltas.reduce((a, b) => Math.abs(a) + Math.abs(b));
const totalDuration = totalDistance / PIXEL_PER_SECOND;
const numberOfFrames = Math.ceil(totalDuration * FPS);

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

  await page.addScriptTag({ path: 'js/TweenMax.min.js' });
  await page.addScriptTag({ path: 'js/ScrollToPlugin.min.js' });
  await page.addStyleTag({ path: 'css/scrollbar.css' });

  page.evaluate(
    (PIXEL_PER_SECOND, deltas) => {
      let timeline = (window.scrollCastTween = new TimelineMax({ paused: true }));
      let scrollTop = 0;

      for (let i = 0; i < deltas.length; i++) {
        let delta = deltas[i];

        scrollTop = scrollTop + delta;

        timeline.to(document.documentElement, Math.abs(delta) / PIXEL_PER_SECOND, {
          scrollTop: scrollTop,
          ease: Power2.easeInOut
        });
      }
    },
    PIXEL_PER_SECOND,
    deltas
  );

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
  const ffmpeg = spawn('ffmpeg', [
    '-r',
    FPS,
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

  ffmpeg.stderr.pipe(process.stderr);
  ffmpeg.stderr.pipe(process.stderr);

  ffmpeg.on('close', code => {
    if (code !== 0) {
      return console.error(`Error, ffmpeg exited with status ${code}`);
    }

    console.log(`created ${videoFileName}`);
  });
})();
