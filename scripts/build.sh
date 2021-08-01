#!/bin/sh
set -x

if [ "$CI" = "" ]; then
  echo "This script is only meant to be run in GitHub Actions."
  exit 0
fi

git pull

tsc -p tsconfig.json

mkdir tmp
bash scripts/changelog.sh > CHANGELOG.md.new
mv docs package.json scripts/bin dist lib .npmignore tmp

git checkout build

mv CHANGELOG.md.new CHANGELOG.md
rm -rf docs dist lib
mv tmp/* . -f
mkdir scripts
mv bin scripts
rm -rf tmp

git add .
git config user.name "github-actions[bot]"
git config user.email "actions@github.com"
git commit -m "build ${GITHUB_SHA}" --author "${GITHUB_ACTOR} <${GITHUB_ACTOR}@users.noreply.github.com>" || true
git push origin build
