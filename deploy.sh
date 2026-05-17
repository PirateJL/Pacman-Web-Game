#!/bin/sh
set -eu

tmpDir=""
deployDir=""

cleanup() {
    if [ -n "$deployDir" ]; then
        if git worktree list --porcelain | grep -Fq "worktree $deployDir"; then
            git worktree remove --force "$deployDir" >/dev/null 2>&1 || true
        elif [ -d "$deployDir" ]; then
            rm -rf "$deployDir"
        fi
    fi

    if [ -n "$tmpDir" ] && [ -d "$tmpDir" ]; then
        rm -rf "$tmpDir"
    fi

    if [ -n "${sourceBranch:-}" ]; then
        git checkout "$sourceBranch" >/dev/null 2>&1 || true
    fi
}

trap cleanup EXIT HUP INT TERM

# Check if "origin" remote exists
origin_url=$(git remote get-url origin 2>/dev/null || true)

if [ -z "$origin_url" ]; then
    echo "--- Error: 'origin' remote does not exist. Exiting script."
    exit 1
fi

# Start from default source branch
if git show-ref --quiet refs/heads/main; then
    sourceBranch=main
elif git show-ref --quiet refs/heads/master; then
    sourceBranch=master
else
    echo "--- Error: neither 'main' nor 'master' branch exists. Exiting script."
    exit 1
fi

git checkout "$sourceBranch"

# Install dependencies before building. The old script installed them after
# deployment, which meant a missing node_modules/ made the build fail first.
if [ -f package-lock.json ]; then
    npm ci
else
    npm install
fi

# Create fresh dist/ folder
rm -rf dist/

# Run build
npm run build

if [ ! -d dist ]; then
    echo "--- Error: build did not create dist/. Exiting script."
    exit 1
fi

tmpDir=$(mktemp -d)
rsync --archive --delete dist/ "$tmpDir"/

# Switch to gh-pages branch
buildBranch=gh-pages
deployDir=$(mktemp -d)

# Check if the local branch exists
if git show-ref --quiet refs/heads/"$buildBranch"; then
    echo "--- Local branch '$buildBranch' exists."
    git worktree add "$deployDir" "$buildBranch"
elif git ls-remote --exit-code --heads origin "$buildBranch" >/dev/null 2>&1; then
    echo "--- Remote branch '$buildBranch' exists."
    git fetch origin "$buildBranch"
    git worktree add -b "$buildBranch" "$deployDir" "origin/$buildBranch"
else
    echo "--- Branch '$buildBranch' does not exist. Creating it."
    git worktree add --detach "$deployDir" "$sourceBranch"
    (
        cd "$deployDir"
        git checkout --orphan "$buildBranch"
        git rm -rf . >/dev/null 2>&1 || true
    )
fi

# Publish the built files from a separate worktree so switching branches cannot
# hide dist/ or delete local node_modules/.
(
    cd "$deployDir"

    rsync --archive --delete \
          --exclude=.git \
          "$tmpDir"/ .

    git add -A

    if git diff --cached --quiet; then
        echo "--- No changes to deploy."
    else
        git commit -m "deploy gh-pages"
        git push -u origin "$buildBranch"
    fi
)
