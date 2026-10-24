#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
base_url="${VERIFY_BASE_URL:-http://127.0.0.1:18080}"
artifact_root="${VERIFY_ARTIFACT_DIR:-$repo_root/.artifacts/verify}"
state_file="$artifact_root/current"
pid_file="$artifact_root/verify.pid"

mkdir -p "$artifact_root"

new_run_dir() {
  local run_id
  run_id="$(date -u +%Y%m%dT%H%M%SZ)-$$"
  local run_dir="$artifact_root/$run_id"
  mkdir -p "$run_dir"
  printf '%s\n' "$run_dir" > "$state_file"
  printf '%s\n' "$run_dir"
}

current_run_dir() {
  if [[ -s "$state_file" ]]; then
    cat "$state_file"
  else
    new_run_dir
  fi
}

wait_for_health() {
  local attempts=0
  while (( attempts < 60 )); do
    if curl --silent --show-error --fail "$base_url/api/health" >/dev/null 2>&1; then
      return 0
    fi
    attempts=$((attempts + 1))
    sleep 1
  done
  return 1
}

start() {
  if [[ -s "$pid_file" ]] && kill -0 "$(<"$pid_file")" 2>/dev/null; then
    echo "verification server already running with PID $(<"$pid_file")"
    return 0
  fi

  local run_dir
  run_dir="$(new_run_dir)"
  (
    cd "$repo_root"
    PORT=18080 npm run dev -- --hostname 127.0.0.1 >"$run_dir/server.log" 2>&1
  ) &
  local pid=$!
  printf '%s\n' "$pid" > "$pid_file"
  if ! wait_for_health; then
    echo "verification server did not become ready; see $run_dir/server.log" >&2
    return 1
  fi
  echo "ready at $base_url"
  echo "evidence: $run_dir"
}

doctor() {
  local run_dir
  run_dir="$(current_run_dir)"
  curl --silent --show-error --fail "$base_url/api/health" | tee "$run_dir/health.json"
  printf '\n'
  curl --silent --show-error --fail -D "$run_dir/login.headers" -o "$run_dir/login.html" "$base_url/login"
  curl --silent --show-error --fail -D "$run_dir/register.headers" -o "$run_dir/register.html" "$base_url/register"
  if curl --silent --show-error --fail "$base_url/api/health?deep=1" >"$run_dir/health-deep.json"; then
    echo "deep databases available"
  else
    echo "deep databases unavailable"
  fi
  echo "evidence: $run_dir"
}

capture_public() {
  local run_dir
  run_dir="$(current_run_dir)"
  curl --silent --show-error --fail -D "$run_dir/home.headers" -o "$run_dir/home.html" "$base_url/"
  curl --silent --show-error --fail -D "$run_dir/login.headers" -o "$run_dir/login.html" "$base_url/login"
  curl --silent --show-error --fail -D "$run_dir/register.headers" -o "$run_dir/register.html" "$base_url/register"
  curl --silent --show-error --fail "$base_url/api/health" >"$run_dir/health.json"
  rg -q 'Realm' "$run_dir/home.html"
  rg -q 'Sign in' "$run_dir/login.html"
  rg -q 'Create account' "$run_dir/register.html"
  echo "public smoke captured and assertions passed"
  echo "evidence: $run_dir"
}

cleanup() {
  if [[ -s "$pid_file" ]]; then
    local pid
    pid="$(<"$pid_file")"
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid"
      for _ in {1..20}; do
        kill -0 "$pid" 2>/dev/null || break
        sleep 0.25
      done
    fi
    rm -f "$pid_file"
  fi
  echo "verification process cleaned up; evidence remains under $artifact_root"
}

case "${1:-}" in
  start) start ;;
  doctor) doctor ;;
  capture-public) capture_public ;;
  cleanup) cleanup ;;
  *)
    echo "usage: $0 {start|doctor|capture-public|cleanup}" >&2
    exit 2
    ;;
esac
