#!/bin/bash

# Vercel treats exit code 1 as "Proceed with Build"
# Vercel treats exit code 0 as "Cancel/Ignore Build"

echo "Evaluating build for branch: $VERCEL_GIT_COMMIT_REF"

if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
  echo "✅ Push is on main branch. Proceeding with deployment build."
  exit 1
else
  echo "🚫 Push is on feature branch or PR ($VERCEL_GIT_COMMIT_REF). Canceling build."
  exit 0
fi