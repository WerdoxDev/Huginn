!/bin/bash

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

if [[ "$VERCEL_GIT_COMMIT_REF" == "release"  ]] ; then
  # Don't build master, we trigger it only with releases
  git show --oneline -s HEAD | grep 'release-please' 2> /dev/null

  if [ $? -eq 0 ]; then
    # Build if we have a tag
    echo "✅ - Build can proceed"
    exit 1;
  fi

  echo "🛑 - Master build, cancelled"
  exit 0;

else
  # Build everything else
  echo "✅ - Build can proceed"
  exit 1;
fi
