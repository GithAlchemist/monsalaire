#!/bin/sh
# Renders the social previews (Open Graph, 1200 x 630) with headless Chrome. Run from the repository root,
# outside any sandbox (Chrome needs the network for the fonts).
set -e
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for lang in fr en; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1200,630 --virtual-time-budget=4000 \
    --screenshot="public/og-$lang.png" "file://$PWD/docs/brand/og/og.html#$lang"
done
