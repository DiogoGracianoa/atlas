#!/usr/bin/env bash
# Consulta a tabela heartbeat pela API REST do Supabase para o projeto Free não
# ser pausado por inatividade. Sai com 1 se a resposta não for 200.
#   SUPABASE_URL=... SUPABASE_ANON_KEY=... bash scripts/keepalive.sh
# Usa só o cabeçalho apikey: funciona com a chave publishable e com a anon legada.
# Nunca imprime a chave.
set -uo pipefail

url="${SUPABASE_URL:-}"
key="${SUPABASE_ANON_KEY:-}"
if [ -z "$url" ] || [ -z "$key" ]; then
  echo "::error::Defina os secrets SUPABASE_URL e SUPABASE_ANON_KEY (Settings → Secrets and variables → Actions)."
  exit 1
fi

endpoint="${url%/}/rest/v1/heartbeat?select=id&limit=1"
body="$(mktemp)"
trap 'rm -f "$body"' EXIT

status="$(curl --silent --show-error --max-time 30 \
  --retry "${KEEPALIVE_RETRY:-2}" --retry-delay 10 \
  --output "$body" --write-out '%{http_code}' \
  --header "apikey: ${key}" --header "Accept: application/json" \
  "$endpoint")" || status="000"

if [ "$status" != "200" ]; then
  echo "::error::Supabase respondeu HTTP ${status} ao consultar heartbeat."
  head -c 300 "$body" 2>/dev/null; echo
  exit 1
fi
echo "Supabase acordado: HTTP 200, $(wc -c < "$body" | tr -d ' ') bytes."
