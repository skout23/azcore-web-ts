#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
artifact_root="${CHECKSEC_ARTIFACT_DIR:-$repo_root/.artifacts/checksec}"
run_id="$(date -u +%Y%m%dT%H%M%SZ)-$$"
run_dir="$artifact_root/$run_id"
fix_requested=false

if [[ "${1:-}" == "--fix" ]]; then
  fix_requested=true
elif [[ -n "${1:-}" ]]; then
  echo "usage: $0 [--fix]" >&2
  exit 2
fi

mkdir -p "$run_dir"

if $fix_requested; then
  npm audit fix
  if ! npm audit --audit-level=high >/dev/null; then
    npm audit fix --force
  fi
fi

trivy_status=0
npm_status=0

set +e
mise exec -- trivy fs \
  --scanners vuln,secret,misconfig \
  --severity HIGH,CRITICAL \
  --exit-code 1 \
  --skip-dirs .git,node_modules,.next,.artifacts \
  --format json \
  --output "$run_dir/trivy.json" \
  "$repo_root"
trivy_status=$?

npm audit --audit-level=high --json >"$run_dir/npm-audit.json"
npm_status=$?
set -e

echo "checksec evidence: $run_dir"
echo "trivy status: $trivy_status"
echo "npm audit status: $npm_status"

if (( trivy_status != 0 || npm_status != 0 )); then
  echo "checksec failed; inspect the reports under $run_dir" >&2
  exit 1
fi

echo "checksec passed"
