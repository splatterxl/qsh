#!/bin/sh
ref=$(git describe --tags "$(git rev-list --tags --max-count=1)")
since=$(git log -n 1 "$ref" --format="%ad" --date=iso8601-strict)
echo "<!-- since $since -->"
echo "# Changes since \`$ref\`"
echo ""
git log --since="$since" --format="- \\[[\`%h\`](https://github.com/nearlySplat/qsh/commit/%H)\\] %s"
