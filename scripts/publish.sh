oldv=$(jq --raw-output ".version" package.json)
v=$oldv.$(git rev-parse HEAD)

if ! [ -z "$1" ]; then v=$1; fi

echo "Publishing $v..."

pnpm version $v --no-git-check

pnpm publish --access=public
