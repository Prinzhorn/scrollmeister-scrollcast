# Scrollcast - the script I use to record scrolling with a nice scrollbar

`npm i -g scrollcast`

You also need `ffmpeg` in your PATH.

This will first move down 1000 pixel than back up for 1000.

`scrollcast --url=http://localhost:8080/examples/the-slim-shaders-lp.html --move=1000 --move=-1000`
