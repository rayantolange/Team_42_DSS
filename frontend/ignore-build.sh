#!/bin/bash

echo "Checking Vercel build trigger..."
echo "Commit Ref: $VERCEL_GIT_COMMIT_REF"
echo "Target ENV: $VERCEL_ENV"

# Vercel sets VERCEL_GIT_COMMIT_AUTHOR or VERCEL_GIT_COMMIT_SHA on git pushes.
# When triggered via Deploy Hook without parameters, we check if it's an automated git event.

if [ "$VERCEL_GIT_COMMIT_REF" = "main" ] && [ -n "$VERCEL_GIT_COMMIT_SHA" ]; then
  # Check if this build was triggered by GitHub Actions or normal Git push
  # If it's a raw git push, skip it!
  echo "🚫 Automatic Git Push detected. Skipping Vercel build to let GitHub Actions CI finish."
  exit 0
fi

echo "✅ Triggered via Deploy Hook. Proceeding with deployment!"
exit 1