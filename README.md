# Scrollcasts - The script I use to record scrolling with a nice scrollbar

This will first move down 1000 pixel than back up for 1000.

`node index.js --url=http://localhost:8080/examples/the-slim-shaders-lp.html --move=1000 --move=-1000`

You need an empty `frames` folder where all the png files will be saved (yeah I was too lazy to use /tmp and clean up). At the end you get an mp4 in the cwd if the `ffmpeg` binary is available.
