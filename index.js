#! /usr/bin/env node

const spawn = require('child_process').spawn;
const process = require('process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const util = require('util');

const uuidv4 = require('uuid/v4');
const moment = require('moment');
const puppeteer = require('puppeteer');
const argv = require('yargs')
  .demandOption(['url', 'move', 'keep-frames'])
  .default('keep-frames', false).argv;

const rimraf = util.promisify(require('rimraf'));
const mkdir = util.promisify(fs.mkdir);

const TMP_DIR = os.tmpdir();
const FPS = 25;
const PIXEL_PER_SECOND = 500;

const url = argv.url;
const deltas = [].concat(argv.move);
const totalDistance = deltas.reduce((a, b) => Math.abs(a) + Math.abs(b));
const totalDuration = totalDistance / PIXEL_PER_SECOND;
const numberOfFrames = Math.ceil(totalDuration * FPS);

const tmpDir = path.join(TMP_DIR, uuidv4());

(async () => {
  await mkdir(tmpDir);

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: 'load'
  });

  //fadein behavior
  await page.waitForFunction('window.getComputedStyle(document.querySelector("scroll-meister")).opacity === "1"');

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

    console.log(`Taking screenshot ${i} of ${numberOfFrames}`);

    await page.evaluate(progress => {
      return new Promise(resolve => {
        window.scrollCastTween.progress(progress);

        requestAnimationFrame(() => {
          setTimeout(resolve);
        });
      });
    }, progress);

    await page.screenshot({
      path: path.join(tmpDir, `${('000' + i).slice(-4)}.png`)
    });
  }

  await browser.close();

  const videoFileName = `Scrollmeister-Scrollcast-${moment().format('YYYY-MM-DD HH-mm-ss')}.mp4`;
  const ffmpeg = spawn('ffmpeg', [
    '-r',
    FPS,
    '-f',
    'image2',
    '-s',
    '1280x720',
    '-i',
    path.join(tmpDir, '%04d.png'),
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

  ffmpeg.on('close', async code => {
    if (argv.keepFrames) {
      console.log('The frames are still in', tmpDir);
    } else {
      console.log('Removing frames in', tmpDir);
      console.log('Use --keep-frames to keep them around after the scrollcast is recorded');
      await rimraf(tmpDir);
    }

    if (code !== 0) {
      return console.error(`Error, ffmpeg exited with status ${code}`);
    }

    console.log(`Created ${videoFileName}`);
  });
})();
