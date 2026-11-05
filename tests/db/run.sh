#!/usr/bin/env bash
# Testa supabase/migrations/*.sql num PostgreSQL 16 descartável (Docker).
#   bash tests/db/run.sh
# Usado localmente e na GitHub Action. Os arquivos vão por stdin, sem volumes,
# para funcionar igual no Linux e no Git Bash do Windows.
set -euo pipefail
cd "$(dirname "$0")/../.."

NAME="atlas-db-test-$$"
cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker run -d --rm --name "$NAME" -e POSTGRES_PASSWORD=teste postgres:16-alpine >/dev/null

for i in $(seq 1 60); do
  if docker exec "$NAME" pg_isready -U postgres -q 2>/dev/null; then break; fi
  sleep 1
done
# pg_isready responde antes do fim da inicialização; confirma com uma consulta
for i in $(seq 1 30); do
  if docker exec "$NAME" psql -U postgres -qtAc "select 1" >/dev/null 2>&1; then break; fi
  sleep 1
done

psql() { docker exec -i "$NAME" psql -U postgres -v ON_ERROR_STOP=1 -q "$@"; }

echo "== stub de auth"
psql < tests/db/stub-auth.sql
for f in supabase/migrations/*.sql; do
  echo "== migration $f"
  psql < "$f"
done
echo "== testes"
psql -o /dev/null < tests/db/test.sql
