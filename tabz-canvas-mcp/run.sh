#!/bin/bash
# Run TabzCanvas MCP server

cd "$(dirname "$0")"

# Check if dist exists, otherwise use tsx for development
if [ -f "dist/index.js" ]; then
  exec node dist/index.js "$@"
else
  exec npx tsx src/index.ts "$@"
fi
