#!/bin/sh
set -e

if [ "${TRUSTRED_RUN_MIGRATIONS:-true}" != "false" ]; then
  npm run migrate
fi

exec "$@"
