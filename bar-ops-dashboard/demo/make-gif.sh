#!/usr/bin/env bash
# Converts the Playwright recording into docs/demo.mp4 and docs/demo.gif.
# Usage (from bar-ops-dashboard/): npm run demo:record && bash demo/make-gif.sh
set -euo pipefail
cd "$(dirname "$0")"
RAW=.output/demo-raw.webm
DOCS=../../docs
START=$(node -e "console.log(require('./.output/trim.json').startMs/1000)")
FPS=${FPS:-10}
WIDTH=${WIDTH:-1000}

ffmpeg -y -loglevel error -ss "$START" -i "$RAW" -c:v libx264 -pix_fmt yuv420p -crf 26 -preset slow \
  -movflags +faststart -an "$DOCS/demo.mp4"

ffmpeg -y -loglevel error -i "$DOCS/demo.mp4" \
  -vf "fps=$FPS,scale=$WIDTH:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" \
  "$DOCS/demo.gif"

ls -lh "$DOCS/demo.mp4" "$DOCS/demo.gif"
