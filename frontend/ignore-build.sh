#!/bin/bash

# Vercel sets VERCEL_GIT_COMMIT_REF on automatic git push builds.
# For Deploy Hooks, Vercel triggers under a hook context where we want to proceed.

echo "Evaluating build for branch: $VERCEL_GIT_COMMIT_REF"

# Check if the deployment was triggered by standard automatic Git push to main
if [ "$VERCEL_GIT_COMMIT_REF" = "main" ] && [ -z "$VERCEL_URL" ]; then
  echo "🚫 Standard Git push to main detected. Skipping automatic Vercel build."
  echo "GitHub Actions CI will trigger the Deploy Hook after tests pass."
  exit 0
fi

echo "✅ Proceeding with Vercel deployment build."
exit 1