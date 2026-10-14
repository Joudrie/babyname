#!/bin/sh
# Builds the site and publishes it to the gh-pages branch, which GitHub Pages serves at
# https://joudrie.github.io/babyname/
set -e
cd "$(dirname "$0")/.."
npm run build
# One page per name for search engines, plus the sitemap.
python3 scripts/build-pages.py dist
touch dist/.nojekyll
rm -rf .deploy && cp -r dist .deploy
cd .deploy
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy $(git -C .. rev-parse --short HEAD)"
git push -q -f "$(git -C .. remote get-url origin)" gh-pages
cd .. && rm -rf .deploy
echo "Deployed: https://joudrie.github.io/babyname/"
